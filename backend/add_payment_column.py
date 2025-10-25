"""
Add payment_intent_id column to transactions table
"""
import sqlite3
import os

# Path to database
db_path = os.path.join(os.path.dirname(__file__), 'instance', 'smartscan.db')

print(f"[INFO] Connecting to database: {db_path}")

# Connect to database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    # Check if column already exists
    cursor.execute("PRAGMA table_info(transactions)")
    columns = [column[1] for column in cursor.fetchall()]

    print(f"[INFO] Current columns in transactions table: {columns}")

    # Add payment_intent_id column if it doesn't exist
    if 'payment_intent_id' not in columns:
        print("[INFO] Adding 'payment_intent_id' column...")
        cursor.execute("ALTER TABLE transactions ADD COLUMN payment_intent_id VARCHAR(255)")
        print("[SUCCESS] 'payment_intent_id' column added")
    else:
        print("[SKIP] 'payment_intent_id' column already exists")

    # Commit changes
    conn.commit()

    # Verify column was added
    cursor.execute("PRAGMA table_info(transactions)")
    columns = [column[1] for column in cursor.fetchall()]
    print(f"[INFO] Updated columns in transactions table: {columns}")

    print("\n[SUCCESS] Database migration complete!")

except Exception as e:
    print(f"[ERROR] Migration failed: {str(e)}")
    conn.rollback()

finally:
    conn.close()
