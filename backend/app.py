from flask import Flask, render_template, request, jsonify, redirect, url_for, session
import cv2
import numpy as np
import base64
import os
import datetime
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
from database import init_db, save_user, get_all_users, user_exists
from face_recognition_utils import detect_face, extract_face_embedding, find_matching_user

app = Flask(__name__)
app.secret_key = os.urandom(24)  # For session management

# Initialize the database
init_db()

# Create directory for mental health tracking images if it doesn't exist
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'uploads')
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

@app.route('/')
def index():
    """Home page route"""
    return render_template('index.html')

@app.route('/register')
def register_page():
    """Registration page route"""
    return render_template('register.html')

@app.route('/login')
def login_page():
    """Login page route"""
    return render_template('login.html')

@app.route('/api/register', methods=['POST'])
def register():
    """API endpoint for user registration"""
    data = request.json
    username = data.get('username')
    image_data = data.get('image')
    
    # Check if username is provided
    if not username:
        return jsonify({'success': False, 'message': 'Username is required'})
    
    # Check if username already exists
    if user_exists(username):
        return jsonify({'success': False, 'message': 'Username already exists'})
    
    # Decode the base64 image
    image_data = image_data.split(',')[1]
    image_bytes = base64.b64decode(image_data)
    image_array = np.frombuffer(image_bytes, np.uint8)
    frame = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
    
    # Detect face in the image
    face_result = detect_face(frame)
    if face_result is None:
        return jsonify({'success': False, 'message': 'No face detected in the image'})
    
    face_roi, _ = face_result
    
    # Extract facial embedding
    embedding = extract_face_embedding(face_roi)
    
    # Save user to database
    success = save_user(username, embedding)
    
    if success:
        return jsonify({'success': True, 'message': f'User {username} registered successfully'})
    else:
        return jsonify({'success': False, 'message': 'Failed to register user'})

@app.route('/dashboard')
def dashboard():
    """Dashboard page route"""
    # Check if user is logged in
    if not session.get('logged_in'):
        return redirect(url_for('login_page'))
    
    username = session.get('username')
    return render_template('dashboard.html', username=username)

@app.route('/api/login', methods=['POST'])
def login():
    """API endpoint for user login"""
    data = request.json
    image_data = data.get('image')
    
    # Decode the base64 image
    image_data = image_data.split(',')[1]
    image_bytes = base64.b64decode(image_data)
    image_array = np.frombuffer(image_bytes, np.uint8)
    frame = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
    
    # Detect face in the image
    face_result = detect_face(frame)
    if face_result is None:
        return jsonify({'success': False, 'message': 'No face detected in the image'})
    
    face_roi, _ = face_result
    
    # Extract facial embedding
    embedding = extract_face_embedding(face_roi)
    
    # Get all users from database
    users = get_all_users()
    
    # Find matching user
    username, similarity = find_matching_user(embedding, users)
    
    if username:
        # Set session data
        session['logged_in'] = True
        session['username'] = username
        
        return jsonify({
            'success': True, 
            'message': f'Welcome back, {username}!',
            'similarity': float(similarity),
            'redirect': url_for('dashboard')  # Add redirect URL to dashboard
        })
    else:
        return jsonify({'success': False, 'message': 'Face not recognized'})

@app.route('/logout')
def logout():
    """Logout route"""
    session.clear()
    return redirect(url_for('index'))

# Add this to the Flask app context
@app.context_processor
def utility_processor():
    """Add utility functions to Jinja templates"""
    return {
        'now': datetime.datetime.now
    }

# Add Gemini API configuration
# You'll need to get an API key from https://makersuite.google.com/app/apikey
GEMINI_API_KEY = "AIzaSyCddlSd6D1K9buWp86-URqQbg1kmcxawwc"  # Replace with your actual API key
genai.configure(api_key=GEMINI_API_KEY)

# Configure Gemini model
generation_config = {
    "temperature": 0.7,
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 1024,
}

# Safety settings should be separate from generation config
safety_settings = {
    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
}

# Initialize Gemini model
gemini_model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",  # Using 1.5-flash which is available
    generation_config=generation_config,
    safety_settings=safety_settings  # Pass safety settings separately
)

@app.route('/api/assistant', methods=['POST'])
def assistant():
    """API endpoint for AI assistant"""
    # Check if user is logged in
    if not session.get('logged_in'):
        return jsonify({'success': False, 'response': 'Please log in to use the assistant'})
    
    data = request.json
    user_message = data.get('message', '')
    username = session.get('username', 'User')
    
    if not user_message:
        return jsonify({'success': False, 'response': 'Please provide a message'})
    
    try:
        # Generate response from Gemini
        prompt = f"User {username} says: {user_message}\nRespond helpfully and concisely."
        response = gemini_model.generate_content(prompt)
        
        return jsonify({
            'success': True,
            'response': response.text
        })
    except Exception as e:
        print(f"Error generating response: {str(e)}")
        return jsonify({
            'success': False,
            'response': "I'm sorry, I couldn't process your request at the moment."
        })

@app.route('/api/mental-health/upload', methods=['POST'])
def upload_mental_health_image():
    """API endpoint for uploading mental health tracking images"""
    # Check if user is logged in
    if not session.get('logged_in'):
        return jsonify({'success': False, 'message': 'Please log in to use this feature'})
    
    data = request.json
    image_data = data.get('image')
    description = data.get('description', '')
    username = session.get('username')
    
    if not image_data:
        return jsonify({'success': False, 'message': 'No image provided'})
    
    try:
        # Create user directory if it doesn't exist
        user_dir = os.path.join(UPLOAD_FOLDER, username)
        if not os.path.exists(user_dir):
            os.makedirs(user_dir)
        
        # Generate filename with timestamp
        timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{timestamp}.jpg"
        filepath = os.path.join(user_dir, filename)
        
        # Save description to a text file
        desc_filepath = os.path.join(user_dir, f"{timestamp}.txt")
        with open(desc_filepath, 'w') as f:
            f.write(description)
        
        # Decode and save the image
        image_data = image_data.split(',')[1]
        image_bytes = base64.b64decode(image_data)
        with open(filepath, 'wb') as f:
            f.write(image_bytes)
        
        return jsonify({
            'success': True, 
            'message': 'Mental health tracking image uploaded successfully',
            'filename': filename
        })
    except Exception as e:
        print(f"Error uploading image: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to upload image'})

@app.route('/api/mental-health/history', methods=['GET'])
def get_mental_health_history():
    """API endpoint for retrieving mental health tracking history"""
    # Check if user is logged in
    if not session.get('logged_in'):
        return jsonify({'success': False, 'message': 'Please log in to use this feature'})
    
    username = session.get('username')
    user_dir = os.path.join(UPLOAD_FOLDER, username)
    
    if not os.path.exists(user_dir):
        return jsonify({'success': True, 'entries': []})
    
    entries = []
    image_files = [f for f in os.listdir(user_dir) if f.endswith('.jpg')]
    
    for image_file in sorted(image_files, reverse=True):
        timestamp = image_file.split('.')[0]
        desc_file = f"{timestamp}.txt"
        desc_path = os.path.join(user_dir, desc_file)
        
        description = ""
        if os.path.exists(desc_path):
            with open(desc_path, 'r') as f:
                description = f.read()
        
        date_obj = datetime.datetime.strptime(timestamp.split('_')[0], '%Y%m%d')
        formatted_date = date_obj.strftime('%B %d, %Y')
        
        entries.append({
            'date': formatted_date,
            'image': f"/static/uploads/{username}/{image_file}",
            'description': description
        })
    
    return jsonify({'success': True, 'entries': entries})

if __name__ == '__main__':
    # Run the app on all network interfaces (0.0.0.0) and port 5000
    # This allows the app to be accessible from other devices on the network
    app.run(host='0.0.0.0', port=5000, debug=True)