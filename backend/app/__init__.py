from flask import Flask, jsonify
from config import Config
from .extensions import db, migrate, jwt, cors
from .auth.routes import BLOCKLIST

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

    # JWT blocklist configuration for logout
    @jwt.token_in_blocklist_loader
    def check_if_token_in_blocklist(jwt_header, jwt_payload):
        jti = jwt_payload["jti"]
        return jti in BLOCKLIST

    # Import models to ensure they are registered with SQLAlchemy
    from . import models

    # Health check endpoint
    @app.route('/')
    def health_check():
        return jsonify({
            "status": "ok",
            "message": "SmartScan Pro API is running",
            "version": "1.0.0"
        }), 200

    @app.route('/api')
    def api_info():
        return jsonify({
            "message": "SmartScan Pro API",
            "endpoints": {
                "auth": "/api/auth (login, register, logout, profile)",
                "products": "/api/products (CRUD operations)",
                "cart": "/api/cart (cart management)",
                "transactions": "/api/transactions (checkout, history)",
                "payments": "/api/payments (Stripe payment processing)",
                "receipts": "/api/receipts (digital receipt generation)",
                "ai": "/api/ai (product recognition, chatbot, recommendations, fraud detection)"
            }
        }), 200

    # Register all blueprints
    from .auth.routes import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    from .products.routes import product_bp
    app.register_blueprint(product_bp, url_prefix='/api/products')
    from .cart.routes import cart_bp
    app.register_blueprint(cart_bp, url_prefix='/api/cart')
    from .transactions.routes import transactions_bp
    app.register_blueprint(transactions_bp, url_prefix='/api/transactions')
    from .payments.routes import payment_bp
    app.register_blueprint(payment_bp, url_prefix='/api/payments')
    from .receipts.routes import receipt_bp
    app.register_blueprint(receipt_bp, url_prefix='/api/receipts')
    from .ai.routes import ai_bp
    app.register_blueprint(ai_bp, url_prefix='/api/ai')
    return app