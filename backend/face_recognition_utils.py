import cv2
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

# Face detection model
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# Try to use OpenCV's face recognizer if available
try:
    face_recognizer = cv2.face.LBPHFaceRecognizer_create()
except AttributeError:
    # If cv2.face is not available, we'll use our own implementation
    # based on the extract_face_embedding function
    face_recognizer = None
    print("OpenCV face module not available. Using custom face recognition implementation.")

def detect_face(frame):
    """Detect a face in the given frame and return the face region"""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)
    
    if len(faces) == 0:
        return None
    
    # Get the largest face (in case multiple faces are detected)
    largest_face = max(faces, key=lambda rect: rect[2] * rect[3])
    x, y, w, h = largest_face
    
    # Extract the face region
    face_roi = gray[y:y+h, x:x+w]
    return face_roi, (x, y, w, h)

def extract_face_embedding(face_roi):
    """Extract facial features/embedding from the face region"""
    # Resize to a standard size
    face_roi = cv2.resize(face_roi, (100, 100))
    
    # Normalize the image
    face_roi = cv2.equalizeHist(face_roi)
    
    # Convert to a flat array (simple embedding)
    embedding = face_roi.flatten().astype(np.float32)
    
    # Normalize the embedding
    embedding = embedding / np.linalg.norm(embedding)
    
    return embedding

def compare_embeddings(embedding1, embedding2, threshold=0.8):
    """Compare two facial embeddings and return True if they match"""
    # Reshape embeddings for cosine similarity calculation
    e1 = embedding1.reshape(1, -1)
    e2 = embedding2.reshape(1, -1)
    
    # Calculate cosine similarity
    similarity = cosine_similarity(e1, e2)[0][0]
    
    return similarity > threshold, similarity

def find_matching_user(embedding, users, threshold=0.8):
    """Find a matching user for the given facial embedding"""
    best_match = None
    best_similarity = 0
    
    for username, stored_embedding in users:
        match, similarity = compare_embeddings(embedding, stored_embedding, threshold)
        if match and similarity > best_similarity:
            best_match = username
            best_similarity = similarity
    
    return best_match, best_similarity