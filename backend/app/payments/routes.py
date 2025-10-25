"""
Payment API Routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import Transaction, TransactionItem, Cart, CartItem
from ..extensions import db
from .stripe_service import stripe_service

payment_bp = Blueprint('payments', __name__, url_prefix='/api/payments')

@payment_bp.route('/config', methods=['GET'])
def get_stripe_config():
    """Get Stripe publishable key for frontend"""
    try:
        return jsonify({
            'publishableKey': stripe_service.get_publishable_key()
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@payment_bp.route('/create-payment-intent', methods=['POST'])
@jwt_required()
def create_payment_intent():
    """Create a payment intent for checkout"""
    try:
        user_id = get_jwt_identity()

        # Get cart total
        cart = Cart.query.filter_by(user_id=user_id).first()

        if not cart or not cart.items:
            return jsonify({'error': 'Cart is empty'}), 400

        # Calculate total
        total = sum(item.product.price * item.quantity for item in cart.items)

        print(f"[DEBUG] Creating payment intent for ${total:.2f}")

        # Create payment intent
        payment_intent = stripe_service.create_payment_intent(
            amount=total,
            metadata={
                'user_id': user_id,
                'cart_id': cart.id
            }
        )

        print(f"[DEBUG] Payment intent created: {payment_intent}")

        return jsonify(payment_intent), 200

    except Exception as e:
        print(f"[ERROR] Payment intent creation failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@payment_bp.route('/confirm-payment', methods=['POST'])
@jwt_required()
def confirm_payment():
    """Confirm payment and create transaction"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        print(f"[DEBUG] Confirm payment request data: {data}")

        payment_intent_id = data.get('payment_intent_id')

        if not payment_intent_id:
            print("[ERROR] Payment intent ID missing")
            return jsonify({'error': 'Payment intent ID required'}), 400

        print(f"[DEBUG] Verifying payment intent: {payment_intent_id}")

        # Verify payment with Stripe
        payment_details = stripe_service.confirm_payment(payment_intent_id)

        print(f"[DEBUG] Payment details: {payment_details}")

        if payment_details['status'] != 'succeeded':
            print(f"[ERROR] Payment status is not succeeded: {payment_details['status']}")
            return jsonify({'error': 'Payment not successful'}), 400

        # Get user's cart
        cart = Cart.query.filter_by(user_id=user_id).first()

        if not cart or not cart.items:
            return jsonify({'error': 'Cart is empty'}), 400

        # Create transaction record
        transaction = Transaction(
            user_id=user_id,
            total_amount=payment_details['amount'],
            payment_intent_id=payment_intent_id
        )

        db.session.add(transaction)
        db.session.flush()  # Get transaction ID

        # Add transaction items
        for cart_item in cart.items:
            transaction_item = TransactionItem(
                transaction_id=transaction.id,
                product_id=cart_item.product_id,
                quantity=cart_item.quantity,
                price_at_purchase=cart_item.product.price
            )
            db.session.add(transaction_item)

        # Clear cart
        CartItem.query.filter_by(cart_id=cart.id).delete()

        db.session.commit()

        return jsonify({
            'message': 'Payment successful',
            'transaction_id': transaction.id,
            'total_amount': transaction.total_amount
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@payment_bp.route('/refund', methods=['POST'])
@jwt_required()
def refund_payment():
    """Refund a transaction"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        transaction_id = data.get('transaction_id')

        if not transaction_id:
            return jsonify({'error': 'Transaction ID required'}), 400

        # Get transaction
        transaction = Transaction.query.filter_by(
            id=transaction_id,
            user_id=user_id
        ).first()

        if not transaction:
            return jsonify({'error': 'Transaction not found'}), 404

        if not hasattr(transaction, 'payment_intent_id') or not transaction.payment_intent_id:
            return jsonify({'error': 'No payment intent associated with transaction'}), 400

        # Process refund
        refund = stripe_service.refund_payment(transaction.payment_intent_id)

        return jsonify({
            'message': 'Refund processed',
            'refund_id': refund['refund_id'],
            'amount': refund['amount']
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
