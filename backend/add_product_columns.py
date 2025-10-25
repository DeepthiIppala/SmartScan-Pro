"""
Add category and description columns to products table using raw SQL
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
    # Check if columns already exist
    cursor.execute("PRAGMA table_info(products)")
    columns = [column[1] for column in cursor.fetchall()]

    print(f"[INFO] Current columns in products table: {columns}")

    # Add category column if it doesn't exist
    if 'category' not in columns:
        print("[INFO] Adding 'category' column...")
        cursor.execute("ALTER TABLE products ADD COLUMN category VARCHAR(50)")
        print("[SUCCESS] 'category' column added")
    else:
        print("[SKIP] 'category' column already exists")

    # Add description column if it doesn't exist
    if 'description' not in columns:
        print("[INFO] Adding 'description' column...")
        cursor.execute("ALTER TABLE products ADD COLUMN description TEXT")
        print("[SUCCESS] 'description' column added")
    else:
        print("[SKIP] 'description' column already exists")

    # Commit changes
    conn.commit()

    # Verify columns were added
    cursor.execute("PRAGMA table_info(products)")
    columns = [column[1] for column in cursor.fetchall()]
    print(f"[INFO] Updated columns in products table: {columns}")

    print("\n[SUCCESS] Database migration complete!")

except Exception as e:
    print(f"[ERROR] Migration failed: {str(e)}")
    conn.rollback()

finally:
    conn.close()
