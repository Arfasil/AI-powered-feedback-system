#!/usr/bin/env python3
"""
Activate admin user if it's inactive
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'feedback.db')

def activate_admin():
    """Activate the admin user"""
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check current status
        cursor.execute("SELECT username, is_active FROM users WHERE role = 'admin' LIMIT 1")
        result = cursor.fetchone()
        
        if not result:
            print("✗ No admin user found")
            return
        
        username, is_active = result
        
        if is_active:
            print(f"✓ Admin user '{username}' is already active")
            return
        
        # Activate admin user
        cursor.execute("UPDATE users SET is_active = 1 WHERE role = 'admin'")
        conn.commit()
        
        print(f"✓ Admin user activated successfully!")
        print(f"  Username: {username}")
        print(f"  Status: Active")
        print(f"\n  You can now log in with:")
        print(f"  Username: admin")
        print(f"  Password: admin123")
        
    except Exception as e:
        print(f"✗ Error: {e}")
    finally:
        conn.close()

if __name__ == '__main__':
    activate_admin()
