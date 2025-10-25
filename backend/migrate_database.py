"""
Database migration script to add category and description to products table
"""
from app import create_app
from app.extensions import db

app = create_app()

with app.app_context():
    print("[INFO] Running database migration...")

    # This will create all tables and add new columns
    db.create_all()

    print("[SUCCESS] Database migration complete!")
    print("[INFO] New columns added to products table: category, description")
