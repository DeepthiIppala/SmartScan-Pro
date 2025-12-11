"""
Migration script to add reset_token columns to users table
"""
import sqlite3
import os

# Get the database path
db_path = os.path.join(os.path.dirname(__file__), 'instance', 'smartscan.db')

print(f"Connecting to database: {db_path}")

# Connect to the database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    # Check if columns already exist
    cursor.execute("PRAGMA table_info(users)")
    columns = [column[1] for column in cursor.fetchall()]

    print(f"Current columns in users table: {columns}")

    # Add reset_token column if it doesn't exist
    if 'reset_token' not in columns:
        print("Adding reset_token column...")
        cursor.execute("ALTER TABLE users ADD COLUMN reset_token VARCHAR(255)")
        print("SUCCESS: reset_token column added")
    else:
        print("reset_token column already exists")

    # Add reset_token_expires column if it doesn't exist
    if 'reset_token_expires' not in columns:
        print("Adding reset_token_expires column...")
        cursor.execute("ALTER TABLE users ADD COLUMN reset_token_expires DATETIME")
        print("SUCCESS: reset_token_expires column added")
    else:
        print("reset_token_expires column already exists")

    # Commit the changes
    conn.commit()
    print("\nSUCCESS: Migration completed successfully!")

except Exception as e:
    print(f"\nERROR: Migration failed: {e}")
    conn.rollback()
finally:
    conn.close()
