from flask import request, jsonify, Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from .openai_service import OpenAIService
from ..models import Transaction, Product
import json

ai_bp = Blueprint('ai', __name__)

# Initialize OpenAI service
try:
    ai_service = OpenAIService()
except ValueError as e:
    print(f"Warning: {e}")
    ai_service = None

@ai_bp.route('/recognize-product', methods=['POST'])
@jwt_required()
def recognize_product():
    """
    AI Feature 1: Product Recognition from Image
    POST /api/ai/recognize-product
    Body: { "image": "base64_encoded_image_data" }
    """
    if not ai_service:
        return jsonify({"error": "AI service not configured. Please set OPENAI_API_KEY"}), 503

    try:
        data = request.get_json()
        image_data = data.get('image')

        if not image_data:
            return jsonify({"error": "No image provided"}), 400

        result = ai_service.recognize_product(image_data)

        try:
            # Extract JSON from markdown code blocks if present
            if '```json' in result:
                result = result.split('```json')[1].split('```')[0].strip()
            elif '```' in result:
                result = result.split('```')[1].split('```')[0].strip()

            product_data = json.loads(result)
            return jsonify(product_data), 200

        except json.JSONDecodeError:
            return jsonify({
                "product_name": "Unknown Product",
                "confidence": 0.0,
                "description": result
            }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@ai_bp.route('/visual-search', methods=['POST'])
@jwt_required()
def visual_search():
    """
    AI Feature: Visual Product Search
    POST /api/ai/visual-search
    Body: { "image": "base64_encoded_image_data" }
    Upload ANY photo and find similar products in inventory
    """
    if not ai_service:
        return jsonify({"error": "AI service not configured. Please set OPENAI_API_KEY"}), 503

    try:
        data = request.get_json()
        image_data = data.get('image')

        if not image_data:
            return jsonify({"error": "No image data provided"}), 400

        # Get all available products
        products = Product.query.all()
        product_list = [
            {
                "id": p.id,
                "name": p.name,
                "price": p.price,
                "category": p.category,
                "barcode": p.barcode
            }
            for p in products
        ]

        result = ai_service.visual_product_search(image_data, product_list)

        # Clean up markdown formatting if present
        if '```json' in result:
            result = result.split('```json')[1].split('```')[0].strip()
        elif '```' in result:
            result = result.split('```')[1].split('```')[0].strip()

        search_results = json.loads(result)

        # Enrich matches with full product data
        if 'matches' in search_results:
            enriched_matches = []
            for match in search_results['matches']:
                # Find the actual product
                product = next(
                    (p for p in products if p.name == match['product_name']),
                    None
                )
                if product:
                    enriched_matches.append({
                        "id": product.id,
                        "name": product.name,
                        "price": product.price,
                        "category": product.category,
                        "barcode": product.barcode,
                        "match_reason": match.get('match_reason', ''),
                        "confidence": match.get('confidence', 0.0)
                    })
            # Return as 'products' to match frontend expectation
            search_results['products'] = enriched_matches
            search_results['matches'] = len(enriched_matches)  # Count of matches

        return jsonify(search_results), 200

    except json.JSONDecodeError as e:
        return jsonify({"error": f"Failed to parse AI response: {str(e)}", "raw_response": result}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@ai_bp.route('/chat', methods=['POST'])
@jwt_required()
def chat():
    """
    AI Feature 2: Shopping Assistant Chatbot
    POST /api/ai/chat
    Body: { "message": "user message", "history": [...] }
    """
    if not ai_service:
        return jsonify({"error": "AI service not configured. Please set OPENAI_API_KEY"}), 503

    try:
        data = request.get_json()
        user_message = data.get('message')
        history = data.get('history', [])

        if not user_message:
            return jsonify({"error": "No message provided"}), 400

        response = ai_service.chat_assistant(user_message, history)

        return jsonify({
            "response": response,
            "timestamp": "now"
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@ai_bp.route('/recommendations', methods=['GET'])
@jwt_required()
def get_recommendations():
    """
    AI Feature 4: Smart Product Recommendations
    GET /api/ai/recommendations
    """
    if not ai_service:
        return jsonify({"error": "AI service not configured. Please set OPENAI_API_KEY"}), 503

    try:
        user_id = get_jwt_identity()

        # Get user's purchase history
        user_transactions = Transaction.query.filter_by(user_id=user_id).order_by(Transaction.created_at.desc()).limit(10).all()

        history_summary = []
        for trans in user_transactions:
            for item in trans.items:
                history_summary.append({
                    "product": item.product.name,
                    "quantity": item.quantity,
                    "price": item.price_at_purchase
                })

        # Get current cart items
        from ..models import Cart
        cart = Cart.query.filter_by(user_id=user_id).first()
        current_cart_items = []
        if cart and cart.items:
            for item in cart.items:
                current_cart_items.append({
                    "product": item.product.name,
                    "quantity": item.quantity,
                    "price": item.product.price
                })

        # Generate recommendations
        result = ai_service.generate_recommendations(history_summary, current_cart_items)

        # Parse JSON response
        try:
            if '```json' in result:
                result = result.split('```json')[1].split('```')[0].strip()
            elif '```' in result:
                result = result.split('```')[1].split('```')[0].strip()

            recommendations = json.loads(result)
            return jsonify(recommendations), 200

        except json.JSONDecodeError:
            return jsonify({"recommendations": [], "error": "Failed to parse recommendations"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@ai_bp.route('/fraud-check', methods=['POST'])
@jwt_required()
def fraud_check():
    """
    AI Feature 3: Fraud Detection
    POST /api/ai/fraud-check
    Body: { "scan_data": {...}, "behavior": {...} }
    """
    if not ai_service:
        return jsonify({"error": "AI service not configured. Please set OPENAI_API_KEY"}), 503

    try:
        data = request.get_json()
        scan_data = data.get('scan_data', {})
        user_behavior = data.get('behavior', {})

        # Call Gemini Fraud Detection
        result = ai_service.detect_fraud_patterns(scan_data, user_behavior)

        # Parse JSON response
        try:
            if '```json' in result:
                result = result.split('```json')[1].split('```')[0].strip()
            elif '```' in result:
                result = result.split('```')[1].split('```')[0].strip()

            fraud_analysis = json.loads(result)
            return jsonify(fraud_analysis), 200

        except json.JSONDecodeError:
            return jsonify({
                "risk_level": "unknown",
                "confidence": 0.0,
                "error": "Failed to analyze"
            }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
