#!/usr/bin/env python3
"""
List all users in the database
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'feedback.db')

def list_users():
    """Display all users in the database"""
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT id, username, email, role, full_name, created_at, is_active
            FROM users
            ORDER BY role DESC, username ASC
        """)
        
        users = cursor.fetchall()
        
        if not users:
            print("No users found in database")
            return
        
        print(f"\n{'Users in Database':^100}")
        print("=" * 100)
        print(f"{'Role':<10} {'Username':<15} {'Email':<25} {'Full Name':<20} {'Status':<10}")
        print("-" * 100)
        
        for user in users:
            user_id, username, email, role, full_name, created_at, is_active = user
            status = "Active" if is_active else "Inactive"
            print(f"{role:<10} {username:<15} {email:<25} {full_name:<20} {status:<10}")
        
        print("=" * 100)
        print(f"Total users: {len(users)}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == '__main__':
    list_users()
