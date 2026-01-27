import os
from dotenv import load_dotenv
from datetime import timedelta

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'a-default-secret-key')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-jwt-secret-key')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)  # Tokens will now last 24 hours

    # Database configuration - handles both SQLite and PostgreSQL
    db_url = os.environ.get('DATABASE_URL', 'sqlite:///smartscan.db')
    # Render PostgreSQL URLs start with 'postgres://' but SQLAlchemy needs 'postgresql://'
    if db_url.startswith('postgres://'):
        db_url = db_url.replace('postgres://', 'postgresql://', 1)
    SQLALCHEMY_DATABASE_URI = db_url