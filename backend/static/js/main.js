// Global variables
let video;
let canvas;
let capturedImage = null;
let mode;

// Initialize webcam
function initWebcam(pageMode) {
    mode = pageMode;
    video = document.getElementById('webcam');
    canvas = document.getElementById('canvas');
    const captureBtn = document.getElementById('capture-btn');
    const actionBtn = document.getElementById(mode === 'register' ? 'register-btn' : 'login-btn');
    const messageDiv = document.getElementById('message');
    
    // Check if browser supports getUserMedia
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(function(stream) {
                video.srcObject = stream;
                video.play();
            })
            .catch(function(error) {
                showMessage(`Error accessing webcam: ${error.message}`, 'error');
            });
    } else {
        showMessage('Your browser does not support webcam access', 'error');
    }
    
    // Capture button event
    captureBtn.addEventListener('click', function() {
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        capturedImage = canvas.toDataURL('image/png');
        
        // Enable the action button
        actionBtn.disabled = false;
        
        showMessage('Face captured! Click the ' + (mode === 'register' ? 'Register' : 'Login') + ' button to continue.', 'success');
    });
    
    // Register/Login button event
    actionBtn.addEventListener('click', function() {
        if (!capturedImage) {
            showMessage('Please capture your face first', 'error');
            return;
        }
        
        if (mode === 'register') {
            const username = document.getElementById('username').value.trim();
            if (!username) {
                showMessage('Please enter a username', 'error');
                return;
            }
            
            registerUser(username, capturedImage);
        } else {
            loginUser(capturedImage);
        }
    });
}

// Register a new user
function registerUser(username, image) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = 'Processing...';
    messageDiv.className = 'message';
    
    fetch('/api/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: username,
            image: image
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showMessage(data.message, 'success');
            // Redirect to home page after 2 seconds
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        } else {
            showMessage(data.message, 'error');
        }
    })
    .catch(error => {
        showMessage(`Error: ${error.message}`, 'error');
    });
}

// Login a user
function loginUser(image) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = 'Processing...';
    messageDiv.className = 'message';
    
    fetch('/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            image: image
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showMessage(`${data.message} (Similarity: ${(data.similarity * 100).toFixed(2)}%)`, 'success');
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = data.redirect || '/';
            }, 2000);
        } else {
            showMessage(data.message, 'error');
        }
    })
    .catch(error => {
        showMessage(`Error: ${error.message}`, 'error');
    });
}

// Show message with appropriate styling
function showMessage(text, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
}