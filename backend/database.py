import sqlite3
import pickle
import numpy as np

def init_db():
    """Initialize the SQLite database with required tables"""
    conn = sqlite3.connect('facial_auth.db')
    cursor = conn.cursor()
    
    # Create users table to store username and facial embeddings
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        face_embedding BLOB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    conn.commit()
    conn.close()
    print("Database initialized successfully")

def save_user(username, face_embedding):
    """Save a new user with their facial embedding"""
    conn = sqlite3.connect('facial_auth.db')
    cursor = conn.cursor()
    
    # Convert numpy array to binary blob for storage
    embedding_blob = pickle.dumps(face_embedding)
    
    try:
        cursor.execute(
            "INSERT INTO users (username, face_embedding) VALUES (?, ?)",
            (username, embedding_blob)
        )
        conn.commit()
        success = True
    except sqlite3.IntegrityError:
        # Username already exists
        success = False
    finally:
        conn.close()
    
    return success

def get_all_users():
    """Retrieve all users and their facial embeddings"""
    conn = sqlite3.connect('facial_auth.db')
    cursor = conn.cursor()
    
    cursor.execute("SELECT username, face_embedding FROM users")
    users = cursor.fetchall()
    
    # Convert binary blobs back to numpy arrays
    result = []
    for username, embedding_blob in users:
        face_embedding = pickle.loads(embedding_blob)
        result.append((username, face_embedding))
    
    conn.close()
    return result

def user_exists(username):
    """Check if a username already exists in the database"""
    conn = sqlite3.connect('facial_auth.db')
    cursor = conn.cursor()
    
    cursor.execute("SELECT 1 FROM users WHERE username = ?", (username,))
    exists = cursor.fetchone() is not None
    
    conn.close()
    return exists