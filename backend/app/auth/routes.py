from flask import request, jsonify, Blueprint
from ..models import User
from ..extensions import db
from flask_jwt_extended import create_access_token, get_jwt, jwt_required, get_jwt_identity
import secrets
from datetime import datetime, timedelta
import os

auth_bp = Blueprint('auth', __name__)
BLOCKLIST = set()

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"msg": "Missing email or password"}), 400
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"msg": "Email already exists"}), 409

    new_user = User(
        email=data['email'],
        first_name=data.get('first_name'),
        last_name=data.get('last_name')
    )
    new_user.set_password(data['password'])
    db.session.add(new_user)
    db.session.commit()

    print(f"[DEBUG] User {new_user.id} ({new_user.email}) registered successfully")

    return jsonify({
        "msg": "Registration successful! Please log in.",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "first_name": new_user.first_name,
            "last_name": new_user.last_name,
            "is_admin": new_user.is_admin
        }
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data.get('email')).first()
    if user and user.check_password(data.get('password')):
        access_token = create_access_token(identity=str(user.id), additional_claims={"is_admin": user.is_admin})
        print(f"[DEBUG] User {user.id} ({user.email}) logged in successfully")
        return jsonify(
            access_token=access_token,
            user={
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "is_admin": user.is_admin
            }
        )
    print(f"[DEBUG] Failed login attempt for email: {data.get('email')}")
    return jsonify({"msg": "Bad email or password"}), 401

@auth_bp.route('/logout', methods=['DELETE'])
@jwt_required()
def logout():
    current_user_id = get_jwt_identity()
    jti = get_jwt()["jti"]
    BLOCKLIST.add(jti)
    print(f"[DEBUG] User {current_user_id} logged out, token {jti} added to blocklist")
    return jsonify(msg="Successfully logged out"), 200

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    try:
        current_user_id = get_jwt_identity()
        if current_user_id is None:
            return jsonify({"msg": "Invalid token - no user ID found"}), 401

        user = User.query.get(int(current_user_id))
        if not user:
            return jsonify({"msg": "User not found"}), 404

        return jsonify({
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "is_admin": user.is_admin
        }), 200
    except ValueError as e:
        return jsonify({"msg": f"Invalid user ID format: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"msg": f"Server error: {str(e)}"}), 500


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Request a password reset token"""
    data = request.get_json()
    email = data.get('email') if data else None
    
    if not email:
        return jsonify({"msg": "Email is required"}), 400
    
    user = User.query.filter_by(email=email).first()
    if not user:
        # Don't reveal if email exists for security
        return jsonify({"msg": "If that email exists, a password reset link will be sent"}), 200
    
    # Generate reset token (valid for 1 hour)
    reset_token = secrets.token_urlsafe(32)
    
    # Store token and expiry in user model (you need to add these fields to User model)
    user.reset_token = reset_token
    user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
    db.session.commit()
    
    # In production, send email with reset link
    # For now, we'll log it (in real app, use Flask-Mail or similar)
    reset_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/reset-password?token={reset_token}"
    print(f"[DEBUG] Password reset requested for {email}")
    print(f"[DEBUG] Reset link: {reset_url}")
    
    return jsonify({"msg": "If that email exists, a password reset link will be sent"}), 200


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Reset password using token"""
    data = request.get_json()
    token = data.get('token') if data else None
    new_password = data.get('new_password') if data else None
    
    if not token or not new_password:
        return jsonify({"msg": "Token and new password are required"}), 400
    
    if len(new_password) < 8:
        return jsonify({"msg": "Password must be at least 8 characters long"}), 400
    
    # Find user with valid reset token
    user = User.query.filter_by(reset_token=token).first()
    
    if not user:
        return jsonify({"msg": "Invalid or expired reset token"}), 400
    
    # Check if token has expired
    if user.reset_token_expires < datetime.utcnow():
        user.reset_token = None
        user.reset_token_expires = None
        db.session.commit()
        return jsonify({"msg": "Reset token has expired"}), 400
    
    # Update password
    user.set_password(new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.session.commit()
    
    print(f"[DEBUG] Password reset successful for user {user.id} ({user.email})")
    
    return jsonify({"msg": "Password reset successful"}), 200