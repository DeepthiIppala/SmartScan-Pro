from flask import request, jsonify, Blueprint
from ..models import User
from ..extensions import db
from flask_jwt_extended import create_access_token, get_jwt, jwt_required, get_jwt_identity

auth_bp = Blueprint('auth', __name__)
BLOCKLIST = set()

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"msg": "Missing email or password"}), 400
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"msg": "Email already exists"}), 409
    
    new_user = User(email=data['email'])
    new_user.set_password(data['password'])
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"msg": "User registered successfully"}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data.get('email')).first()
    if user and user.check_password(data.get('password')):
        access_token = create_access_token(identity=str(user.id), additional_claims={"is_admin": user.is_admin})
        return jsonify(access_token=access_token)
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
            "is_admin": user.is_admin
        }), 200
    except ValueError as e:
        return jsonify({"msg": f"Invalid user ID format: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"msg": f"Server error: {str(e)}"}), 500