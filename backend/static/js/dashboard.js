document.addEventListener('DOMContentLoaded', () => {
    // Load face-api.js models first, then initialize everything
    loadFaceApiModels().then(() => {
        // Initialize webcam
        initDashboardWebcam();
        
        // Initialize voice assistant
        initVoiceAssistant();
        
        // Initialize to-do list
        initTodoList();
        
        // Initialize notes
        initNotes();
        
        // Initialize mental health tracker
        initMentalHealthTracker();
        
        // Emotion detection and greeting will be handled in initDashboardWebcam
    }).catch(err => {
        console.error('Error loading face-api models:', err);
        // Still initialize components even if face detection fails
        initDashboardWebcam();
        initVoiceAssistant();
        initTodoList();
        initNotes();
        initMentalHealthTracker();
        
        // Fallback greeting
        const username = document.querySelector('.dashboard-header h1').textContent.replace('Welcome, ', '').replace('!', '');
        speakText(`Hello ${username}! Welcome to your dashboard. How can I help you today?`);
    });
});

// Initialize mental health tracker
function initMentalHealthTracker() {
    const video = document.getElementById('mental-health-webcam');
    const canvas = document.getElementById('mental-health-canvas');
    const capturedImage = document.getElementById('captured-image');
    const captureBtn = document.getElementById('capture-btn');
    const retakeBtn = document.getElementById('retake-btn');
    const uploadBtn = document.getElementById('upload-mental-health-btn');
    const description = document.getElementById('mental-health-description');
    const entriesContainer = document.getElementById('mental-health-entries');
    
    let imageData = null;
    
    // Initialize webcam for mental health tracker
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(function(stream) {
                video.srcObject = stream;
                video.play();
            })
            .catch(function(error) {
                console.error('Error accessing webcam for mental health tracker:', error);
            });
    } else {
        console.error('Your browser does not support webcam access');
    }
    
    // Capture button click handler
    captureBtn.addEventListener('click', () => {
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        imageData = canvas.toDataURL('image/jpeg');
        
        capturedImage.style.backgroundImage = `url(${imageData})`;
        capturedImage.style.display = 'block';
        video.style.display = 'none';
        
        captureBtn.style.display = 'none';
        retakeBtn.style.display = 'block';
    });
    
    // Retake button click handler
    retakeBtn.addEventListener('click', () => {
        capturedImage.style.display = 'none';
        video.style.display = 'block';
        
        captureBtn.style.display = 'block';
        retakeBtn.style.display = 'none';
        
        imageData = null;
    });
    
    // Upload button click handler
    uploadBtn.addEventListener('click', () => {
        if (!imageData) {
            alert('Please capture an image first');
            return;
        }
        
        const descriptionText = description.value.trim();
        
        // Send data to server
        fetch('/api/mental-health/upload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                image: imageData,
                description: descriptionText
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Mental health entry saved successfully!');
                
                // Reset form
                capturedImage.style.display = 'none';
                video.style.display = 'block';
                captureBtn.style.display = 'block';
                retakeBtn.style.display = 'none';
                description.value = '';
                imageData = null;
                
                // Refresh entries
                loadMentalHealthEntries();
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error uploading mental health entry:', error);
            alert('Failed to save entry. Please try again.');
        });
    });
    
    // Load mental health entries
    function loadMentalHealthEntries() {
        fetch('/api/mental-health/history')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    if (data.entries.length === 0) {
                        entriesContainer.innerHTML = '<p class="loading-text">No entries yet. Start tracking today!</p>';
                        return;
                    }
                    
                    entriesContainer.innerHTML = '';
                    
                    data.entries.forEach(entry => {
                        const entryElement = document.createElement('div');
                        entryElement.className = 'mental-health-entry';
                        
                        const dateElement = document.createElement('div');
                        dateElement.className = 'entry-date';
                        dateElement.textContent = entry.date;
                        
                        const imageElement = document.createElement('img');
                        imageElement.className = 'entry-image';
                        imageElement.src = entry.image;
                        imageElement.alt = 'Mental health tracking image';
                        
                        const descriptionElement = document.createElement('div');
                        descriptionElement.className = 'entry-description';
                        descriptionElement.textContent = entry.description || 'No description provided';
                        
                        entryElement.appendChild(dateElement);
                        entryElement.appendChild(imageElement);
                        entryElement.appendChild(descriptionElement);
                        
                        entriesContainer.appendChild(entryElement);
                    });
                } else {
                    entriesContainer.innerHTML = `<p class="loading-text">Error: ${data.message}</p>`;
                }
            })
            .catch(error => {
                console.error('Error loading mental health entries:', error);
                entriesContainer.innerHTML = '<p class="loading-text">Failed to load entries. Please refresh the page.</p>';
            });
    }
    
    // Load entries on initialization
    loadMentalHealthEntries();
}

// Initialize to-do list functionality
function initTodoList() {
    const todoInput = document.getElementById('todo-input');
    const addTodoBtn = document.getElementById('add-todo-btn');
    const todoList = document.getElementById('todo-list');
    
    // Load saved todos from localStorage
    loadTodos();
    
    // Add new todo when button is clicked
    addTodoBtn.addEventListener('click', () => {
        addTodo();
    });
    
    // Add new todo when Enter key is pressed
    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTodo();
        }
    });
    
    // Function to add a new todo
    function addTodo() {
        const todoText = todoInput.value.trim();
        if (todoText) {
            // Create todo item
            createTodoItem(todoText);
            
            // Clear input
            todoInput.value = '';
            
            // Save todos to localStorage
            saveTodos();
        }
    }
    
    // Function to create a todo item
    function createTodoItem(text, completed = false) {
        const todoItem = document.createElement('li');
        todoItem.className = `todo-item ${completed ? 'completed' : ''}`;
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'todo-checkbox';
        checkbox.checked = completed;
        
        const todoText = document.createElement('span');
        todoText.className = 'todo-text';
        todoText.textContent = text;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-todo-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        
        // Add event listeners
        checkbox.addEventListener('change', () => {
            todoItem.classList.toggle('completed');
            saveTodos();
        });
        
        deleteBtn.addEventListener('click', () => {
            todoItem.remove();
            saveTodos();
        });
        
        // Append elements to todo item
        todoItem.appendChild(checkbox);
        todoItem.appendChild(todoText);
        todoItem.appendChild(deleteBtn);
        
        // Append todo item to list
        todoList.appendChild(todoItem);
    }
    
    // Function to save todos to localStorage
    function saveTodos() {
        const todos = [];
        document.querySelectorAll('.todo-item').forEach(item => {
            todos.push({
                text: item.querySelector('.todo-text').textContent,
                completed: item.classList.contains('completed')
            });
        });
        
        localStorage.setItem('todos', JSON.stringify(todos));
    }
    
    // Function to load todos from localStorage
    function loadTodos() {
        const savedTodos = localStorage.getItem('todos');
        if (savedTodos) {
            const todos = JSON.parse(savedTodos);
            todos.forEach(todo => {
                createTodoItem(todo.text, todo.completed);
            });
        }
    }
}

// Initialize notes functionality
function initNotes() {
    const noteTitle = document.getElementById('note-title');
    const noteContent = document.getElementById('note-content');
    const saveNoteBtn = document.getElementById('save-note-btn');
    const clearNoteBtn = document.getElementById('clear-note-btn');
    const notesList = document.getElementById('notes-list');
    
    let currentNoteId = null;
    
    // Load saved notes from localStorage
    loadNotes();
    
    // Save note when button is clicked
    saveNoteBtn.addEventListener('click', () => {
        saveNote();
    });
    
    // Clear note editor when button is clicked
    clearNoteBtn.addEventListener('click', () => {
        clearNoteEditor();
    });
    
    // Function to save a note
    function saveNote() {
        const title = noteTitle.value.trim();
        const content = noteContent.value.trim();
        
        if (title || content) {
            const noteId = currentNoteId || Date.now().toString();
            
            // Save note to localStorage
            const notes = getNotes();
            notes[noteId] = { title, content, timestamp: Date.now() };
            localStorage.setItem('notes', JSON.stringify(notes));
            
            // Update UI
            if (!currentNoteId) {
                createNoteCard(noteId, title, content);
            } else {
                updateNoteCard(noteId, title, content);
            }
            
            // Clear editor
            clearNoteEditor();
        }
    }
    
    // Function to create a note card
    function createNoteCard(id, title, content) {
        const noteCard = document.createElement('div');
        noteCard.className = 'note-card';
        noteCard.dataset.id = id;
        
        const noteTitle = document.createElement('h3');
        noteTitle.textContent = title || 'Untitled';
        
        const noteContent = document.createElement('p');
        noteContent.textContent = content;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-note-btn';
        deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
        
        // Add event listeners
        noteCard.addEventListener('click', (e) => {
            if (e.target !== deleteBtn && !deleteBtn.contains(e.target)) {
                editNote(id);
            }
        });
        
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteNote(id);
        });
        
        // Append elements to note card
        noteCard.appendChild(noteTitle);
        noteCard.appendChild(noteContent);
        noteCard.appendChild(deleteBtn);
        
        // Append note card to list
        notesList.appendChild(noteCard);
    }
    
    // Function to update a note card
    function updateNoteCard(id, title, content) {
        const noteCard = document.querySelector(`.note-card[data-id="${id}"]`);
        if (noteCard) {
            noteCard.querySelector('h3').textContent = title || 'Untitled';
            noteCard.querySelector('p').textContent = content;
        }
    }
    
    // Function to edit a note
    function editNote(id) {
        const notes = getNotes();
        const note = notes[id];
        
        if (note) {
            noteTitle.value = note.title;
            noteContent.value = note.content;
            currentNoteId = id;
            saveNoteBtn.textContent = 'Update Note';
        }
    }
    
    // Function to delete a note
    function deleteNote(id) {
        // Remove from localStorage
        const notes = getNotes();
        delete notes[id];
        localStorage.setItem('notes', JSON.stringify(notes));
        
        // Remove from UI
        const noteCard = document.querySelector(`.note-card[data-id="${id}"]`);
        if (noteCard) {
            noteCard.remove();
        }
        
        // Clear editor if the deleted note was being edited
        if (currentNoteId === id) {
            clearNoteEditor();
        }
    }
    
    // Function to clear note editor
    function clearNoteEditor() {
        noteTitle.value = '';
        noteContent.value = '';
        currentNoteId = null;
        saveNoteBtn.innerHTML = '<i class="fas fa-save"></i> Save Note';
    }
    
    // Function to get notes from localStorage
    function getNotes() {
        const savedNotes = localStorage.getItem('notes');
        return savedNotes ? JSON.parse(savedNotes) : {};
    }
    
    // Function to load notes from localStorage
    function loadNotes() {
        const notes = getNotes();
        
        // Sort notes by timestamp (newest first)
        const sortedNotes = Object.entries(notes).sort((a, b) => b[1].timestamp - a[1].timestamp);
        
        // Create note cards
        sortedNotes.forEach(([id, note]) => {
            createNoteCard(id, note.title, note.content);
        });
    }
}

// Load face-api.js models
async function loadFaceApiModels() {
    // First check if face-api is loaded
    if (typeof faceapi === 'undefined') {
        throw new Error('face-api.js is not loaded');
    }
    
    // Path to models
    const MODEL_URL = '/static/models';
    
    // Load required models
    await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
    ]);
}

// Initialize webcam for dashboard with emotion detection
function initDashboardWebcam() {
    const video = document.getElementById('dashboard-webcam');
    
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(function(stream) {
                video.srcObject = stream;
                video.play();
                
                // Wait for video to start playing
                video.addEventListener('playing', () => {
                    // Detect emotion after a short delay to ensure video is properly initialized
                    setTimeout(() => detectEmotion(video), 2000);
                });
            })
            .catch(function(error) {
                console.error('Error accessing webcam:', error);
                // Fallback greeting if webcam fails
                const username = document.querySelector('.dashboard-header h1').textContent.replace('Welcome, ', '').replace('!', '');
                speakText(`Hello ${username}! Welcome to your dashboard. How can I help you today?`);
            });
    } else {
        console.error('Your browser does not support webcam access');
        // Fallback greeting if webcam is not supported
        const username = document.querySelector('.dashboard-header h1').textContent.replace('Welcome, ', '').replace('!', '');
        speakText(`Hello ${username}! Welcome to your dashboard. How can I help you today?`);
    }
}

// Detect emotion from video feed
async function detectEmotion(videoElement) {
    try {
        if (typeof faceapi === 'undefined') {
            throw new Error('face-api.js is not loaded');
        }
        
        // Detect faces with expressions
        const detection = await faceapi.detectSingleFace(
            videoElement, 
            new faceapi.TinyFaceDetectorOptions()
        ).withFaceExpressions();
        
        if (detection) {
            // Get the dominant emotion
            const emotions = detection.expressions;
            const dominantEmotion = Object.keys(emotions).reduce((a, b) => emotions[a] > emotions[b] ? a : b);
            
            console.log('Detected emotion:', dominantEmotion, 'with confidence:', emotions[dominantEmotion]);
            
            // Get username
            const username = document.querySelector('.dashboard-header h1').textContent.replace('Welcome, ', '').replace('!', '');
            
            // Create greeting based on emotion
            let greeting = '';
            
            // Show the appropriate emotion icon
            const emotionIcons = document.querySelectorAll('.emotion-icon i');
            if (emotionIcons && emotionIcons.length > 0) {
                emotionIcons.forEach(icon => icon.style.display = 'none');
            }
            
            const emotionGreetingElement = document.getElementById('emotion-greeting');
            
            switch(dominantEmotion) {
                case 'happy':
                    const happyIcon = document.querySelector('.emotion-happy');
                    if (happyIcon) happyIcon.style.display = 'block';
                    greeting = `Hey ${username}! You seem to be happy today! How's it going? What's making you smile?`;
                    break;
                case 'sad':
                    const sadIcon = document.querySelector('.emotion-sad');
                    if (sadIcon) sadIcon.style.display = 'block';
                    greeting = `Hi ${username}. I notice you might be feeling a bit down today. Is there anything I can do to help brighten your day?`;
                    break;
                case 'angry':
                    const angryIcon = document.querySelector('.emotion-angry');
                    if (angryIcon) angryIcon.style.display = 'block';
                    greeting = `Hello ${username}. You seem a bit frustrated today. Take a deep breath. Would you like to talk about what's bothering you?`;
                    break;
                case 'surprised':
                    const surprisedIcon = document.querySelector('.emotion-surprised');
                    if (surprisedIcon) surprisedIcon.style.display = 'block';
                    greeting = `Wow ${username}! You look surprised! Did something unexpected happen today?`;
                    break;
                case 'fearful':
                    const fearfulIcon = document.querySelector('.emotion-fearful');
                    if (fearfulIcon) fearfulIcon.style.display = 'block';
                    greeting = `Hi ${username}. You seem a bit anxious or concerned about something. I'm here if you need any assistance or just want to talk.`;
                    break;
                case 'disgusted':
                    const disgustedIcon = document.querySelector('.emotion-disgusted');
                    if (disgustedIcon) disgustedIcon.style.display = 'block';
                    greeting = `Hello ${username}. You seem disoriented. Is there something specific that's bothering you? How can I help?`;
                    break;
                case 'neutral':
                default:
                    const neutralIcon = document.querySelector('.emotion-neutral');
                    if (neutralIcon) neutralIcon.style.display = 'block';
                    greeting = `Hello ${username}! Welcome to your dashboard. How can I help you today?`;
                    break;
            }
            
            // Set the greeting text
            if (emotionGreetingElement) {
                emotionGreetingElement.textContent = greeting;
            } else {
                // If emotion greeting element doesn't exist, add the message to conversation
                const conversationContainer = document.getElementById('conversation-container');
                if (conversationContainer) {
                    // Create a new assistant message
                    const messageDiv = document.createElement('div');
                    messageDiv.className = 'message assistant-message';
                    
                    const messagePara = document.createElement('p');
                    messagePara.textContent = greeting;
                    
                    messageDiv.appendChild(messagePara);
                    conversationContainer.appendChild(messageDiv);
                }
            }
            
            // Speak the emotion-based greeting
            speakText(greeting);
        } else {
            // No face detected, use default greeting
            const username = document.querySelector('.dashboard-header h1').textContent.replace('Welcome, ', '').replace('!', '');
            const defaultGreeting = `Hello ${username}! Welcome to your dashboard. How can I help you today?`;
            
            const neutralIcon = document.querySelector('.emotion-neutral');
            if (neutralIcon) neutralIcon.style.display = 'block';
            
            const emotionGreetingElement = document.getElementById('emotion-greeting');
            if (emotionGreetingElement) {
                emotionGreetingElement.textContent = defaultGreeting;
            } else {
                // If emotion greeting element doesn't exist, add the message to conversation
                const conversationContainer = document.getElementById('conversation-container');
                if (conversationContainer) {
                    // Create a new assistant message
                    const messageDiv = document.createElement('div');
                    messageDiv.className = 'message assistant-message';
                    
                    const messagePara = document.createElement('p');
                    messagePara.textContent = defaultGreeting;
                    
                    messageDiv.appendChild(messagePara);
                    conversationContainer.appendChild(messageDiv);
                }
            }
            
            speakText(defaultGreeting);
        }
    } catch (error) {
        console.error('Error detecting emotion:', error);
        // Fallback to default greeting
        const username = document.querySelector('.dashboard-header h1').textContent.replace('Welcome, ', '').replace('!', '');
        const defaultGreeting = `Hello ${username}! Welcome to your dashboard. How can I help you today?`;
        
        const neutralIcon = document.querySelector('.emotion-neutral');
        if (neutralIcon) neutralIcon.style.display = 'block';
        
        const emotionGreetingElement = document.getElementById('emotion-greeting');
        if (emotionGreetingElement) {
            emotionGreetingElement.textContent = defaultGreeting;
        } else {
            // If emotion greeting element doesn't exist, add the message to conversation
            const conversationContainer = document.getElementById('conversation-container');
            if (conversationContainer) {
                // Create a new assistant message
                const messageDiv = document.createElement('div');
                messageDiv.className = 'message assistant-message';
                
                const messagePara = document.createElement('p');
                messagePara.textContent = defaultGreeting;
                
                messageDiv.appendChild(messagePara);
                conversationContainer.appendChild(messageDiv);
            }
        }
        
        speakText(defaultGreeting);
    }
}

// Initialize voice assistant
function initVoiceAssistant() {
    const micBtn = document.getElementById('mic-btn');
    const sendBtn = document.getElementById('send-btn');
    const textInput = document.getElementById('text-input');
    const conversationContainer = document.getElementById('conversation-container');
    
    let recognition;
    let isRecording = false;
    
    // Check if browser supports speech recognition
    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            textInput.value = transcript;
            sendMessage(transcript);
        };
        
        recognition.onend = function() {
            isRecording = false;
            micBtn.classList.remove('recording');
            micBtn.querySelector('.mic-text').textContent = 'Press to Talk';
        };
        
        recognition.onerror = function(event) {
            console.error('Speech recognition error:', event.error);
            isRecording = false;
            micBtn.classList.remove('recording');
            micBtn.querySelector('.mic-text').textContent = 'Press to Talk';
        };
    } else {
        micBtn.disabled = true;
        micBtn.title = 'Speech recognition not supported in this browser';
    }
    
    // Mic button click event
    micBtn.addEventListener('click', function() {
        if (!recognition) return;
        
        if (!isRecording) {
            recognition.start();
            isRecording = true;
            micBtn.classList.add('recording');
            micBtn.querySelector('.mic-text').textContent = 'Listening...';
        } else {
            recognition.stop();
            isRecording = false;
            micBtn.classList.remove('recording');
            micBtn.querySelector('.mic-text').textContent = 'Press to Talk';
        }
    });
    
    // Send button click event
    sendBtn.addEventListener('click', function() {
        const message = textInput.value.trim();
        if (message) {
            sendMessage(message);
        }
    });
    
    // Text input keypress event (Enter key)
    textInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const message = textInput.value.trim();
            if (message) {
                sendMessage(message);
            }
        }
    });
    
    // Send message to AI assistant
    function sendMessage(message) {
        // Add user message to conversation
        addMessageToConversation(message, 'user');
        
        // Clear input field
        textInput.value = '';
        
        // Send message to backend
        fetch('/api/assistant', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: message })
        })
        .then(response => response.json())
        .then(data => {
            // Add assistant response to conversation
            addMessageToConversation(data.response, 'assistant');
            
            // Speak the response
            speakText(data.response);
        })
        .catch(error => {
            console.error('Error sending message to assistant:', error);
            const errorMsg = 'Sorry, I encountered an error. Please try again.';
            addMessageToConversation(errorMsg, 'assistant');
            speakText(errorMsg);
        });
    }
    
    // Add message to conversation container
    function addMessageToConversation(message, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const messagePara = document.createElement('p');
        messagePara.textContent = message;
        
        messageDiv.appendChild(messagePara);
        conversationContainer.appendChild(messageDiv);
        
        // Scroll to bottom of conversation
        conversationContainer.scrollTop = conversationContainer.scrollHeight;
    }
}

// Function to speak text using the Web Speech API
function speakText(text) {
    // Check if speech synthesis is supported
    if ('speechSynthesis' in window) {
        // Show speaking indicator
        const speakingIndicator = document.querySelector('.speaking-indicator');
        if (speakingIndicator) {
            speakingIndicator.classList.add('active');
        }
        
        // Create a new speech synthesis utterance
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Set properties (optional)
        utterance.lang = 'en-US';
        utterance.volume = 1; // 0 to 1
        utterance.rate = 1; // 0.1 to 10
        utterance.pitch = 1; // 0 to 2
        
        // Get available voices and set a better voice if available
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice => 
            voice.name.includes('Google') || 
            voice.name.includes('Microsoft') || 
            voice.name.includes('Female')
        );
        
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }
        
        // Hide speaking indicator when done
        utterance.onend = function() {
            if (speakingIndicator) {
                speakingIndicator.classList.remove('active');
            }
        };
        
        // Speak the text
        window.speechSynthesis.speak(utterance);
    } else {
        console.error('Speech synthesis not supported in this browser');
    }
}

// Ensure voices are loaded (needed for some browsers)
if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = function() {
        // This event fires when voices are available
    };
}

// Add this function to ensure the emotion greeting works
function initializeEmotionGreeting() {
    // Default greeting if emotion detection hasn't run yet
    const defaultGreeting = "Welcome to your dashboard! I'll analyze your expression when the camera is ready.";
    const emotionGreetingElement = document.getElementById('emotion-greeting');
    
    if (emotionGreetingElement) {
        emotionGreetingElement.textContent = defaultGreeting;
    }
    
    // Make sure the neutral emotion is shown by default
    const neutralIcon = document.querySelector('.emotion-neutral');
    if (neutralIcon) {
        neutralIcon.style.display = 'block';
    }
}

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeEmotionGreeting();
    
    // Rest of your existing initialization code
});

// Update this function in your existing code to properly display emotions
function updateEmotionGreeting(emotion) {
    const greetings = {
        'happy': "You're looking happy today! That's great to see.",
        'sad': "I notice you might be feeling down. Is there anything I can help with?",
        'angry': "You seem a bit frustrated. Take a deep breath, I'm here to assist you.",
        'surprised': "You look surprised! I hope it's a good surprise.",
        'neutral': "Welcome back! How can I assist you today?",
        'fearful': "You seem concerned. Remember, I'm here to help you.",
        'disgusted': "Something bothering you? Let me know if I can help."
    };
    
    // Hide all emotion icons first
    document.querySelectorAll('.emotion-icon i').forEach(icon => {
        icon.style.display = 'none';
    });
    
    // Show the detected emotion icon
    const emotionIcon = document.querySelector(`.emotion-${emotion}`);
    if (emotionIcon) {
        emotionIcon.style.display = 'block';
    }
    
    // Update the greeting text
    const emotionGreeting = document.getElementById('emotion-greeting');
    if (emotionGreeting) {
        emotionGreeting.textContent = greetings[emotion] || greetings['neutral'];
    }
}