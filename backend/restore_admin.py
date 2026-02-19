#!/usr/bin/env python3
"""
Restore admin credentials to the database
"""
import sqlite3
import hashlib
import uuid
import os

# Database path
DB_PATH = os.path.join(os.path.dirname(__file__), 'feedback.db')

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def restore_admin():
    """Create/restore admin user with default credentials"""
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Admin credentials
    admin_id = str(uuid.uuid4())
    username = 'admin'
    email = 'admin@edupulse.local'
    password = 'admin123'
    password_hash = hash_password(password)
    full_name = 'System Administrator'
    department = 'Administration'
    
    try:
        # Check if admin already exists
        cursor.execute("SELECT id FROM users WHERE username = ? AND role = ?", (username, 'admin'))
        existing = cursor.fetchone()
        
        if existing:
            print(f"✓ Admin user already exists (ID: {existing[0]})")
            print(f"  Username: {username}")
            print(f"  Password: {password}")
            return
        
        # Insert new admin user
        cursor.execute("""
            INSERT INTO users (id, username, email, password_hash, role, full_name, department)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (admin_id, username, email, password_hash, 'admin', full_name, department))
        
        conn.commit()
        
        print("✓ Admin credentials restored successfully!")
        print(f"  Admin ID: {admin_id}")
        print(f"  Username: {username}")
        print(f"  Email: {email}")
        print(f"  Password: {password}")
        print(f"  Role: admin")
        print(f"\n  Use these credentials to log in at the admin dashboard")
        
    except sqlite3.IntegrityError as e:
        print(f"✗ Error: {e}")
        print("  The admin user might already exist with a different email")
    except Exception as e:
        print(f"✗ Error: {e}")
    finally:
        conn.close()

if __name__ == '__main__':
    restore_admin()
