from app import create_app
from app.extensions import db

app = create_app()

with app.app_context():
    # Add new columns to transactions table
    with db.engine.connect() as conn:
        # Check if columns already exist
        result = conn.execute(db.text("PRAGMA table_info(transactions)"))
        columns = [row[1] for row in result]

        if 'requires_audit' not in columns:
            conn.execute(db.text("ALTER TABLE transactions ADD COLUMN requires_audit BOOLEAN DEFAULT 0"))
            print("Added 'requires_audit' column")
        else:
            print("'requires_audit' column already exists")

        if 'audit_reason' not in columns:
            conn.execute(db.text("ALTER TABLE transactions ADD COLUMN audit_reason VARCHAR(255)"))
            print("Added 'audit_reason' column")
        else:
            print("'audit_reason' column already exists")

        conn.commit()

    print("Database schema updated successfully!")
