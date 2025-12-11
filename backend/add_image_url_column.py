"""
Add image_url column to products table
"""
from app import create_app
from app.extensions import db

def add_image_url_column():
    """Add image_url column to products table"""
    app = create_app()

    with app.app_context():
        try:
            # Try to add the column
            with db.engine.connect() as conn:
                conn.execute(db.text(
                    "ALTER TABLE products ADD COLUMN image_url VARCHAR(500)"
                ))
                conn.commit()
            print("[SUCCESS] Added image_url column to products table")
        except Exception as e:
            if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
                print("[INFO] image_url column already exists")
            else:
                print(f"[ERROR] Failed to add column: {str(e)}")

if __name__ == '__main__':
    add_image_url_column()
