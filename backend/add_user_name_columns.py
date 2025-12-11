"""
Migration script to add first_name and last_name columns to the users table
"""
from app import create_app
from app.extensions import db

app = create_app()

with app.app_context():
    try:
        # Add first_name column
        with db.engine.connect() as conn:
            conn.execute(db.text(
                "ALTER TABLE users ADD COLUMN first_name VARCHAR(50)"
            ))
            conn.commit()
            print("✓ Added first_name column")
    except Exception as e:
        print(f"first_name column might already exist: {e}")

    try:
        # Add last_name column
        with db.engine.connect() as conn:
            conn.execute(db.text(
                "ALTER TABLE users ADD COLUMN last_name VARCHAR(50)"
            ))
            conn.commit()
            print("✓ Added last_name column")
    except Exception as e:
        print(f"last_name column might already exist: {e}")

    print("\n✓ Migration completed successfully!")
