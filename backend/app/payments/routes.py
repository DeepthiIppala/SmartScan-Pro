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

        # Calculate total in dollars
        total_dollars = sum(item.product.price * item.quantity for item in cart.items)

        print(f"[DEBUG] Creating payment intent for ${total_dollars:.2f}")

        # Create payment intent (stripe_service will convert to cents)
        payment_intent = stripe_service.create_payment_intent(
            amount=total_dollars,  # Pass dollars, service converts to cents
            metadata={
                'user_id': user_id,
                'cart_id': cart.id if cart else None
            }
        )

        print(f"[DEBUG] Payment intent created: {payment_intent['payment_intent_id']}")

        return jsonify({
            'client_secret': payment_intent['client_secret'],
            'payment_intent_id': payment_intent['payment_intent_id'],
            'amount': payment_intent['amount'],  # Already in dollars from service
            'status': payment_intent['status']
        }), 200

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

        print(f"[DEBUG] Confirm payment request from user {user_id}")
        print(f"[DEBUG] Request data: {data}")

        payment_intent_id = data.get('payment_intent_id')

        if not payment_intent_id:
            print("[ERROR] Payment intent ID missing")
            return jsonify({'error': 'Payment intent ID required'}), 400

        print(f"[DEBUG] Verifying payment intent: {payment_intent_id}")

        # Verify payment with Stripe
        payment_intent = stripe_service.confirm_payment(payment_intent_id)

        print(f"[DEBUG] Payment intent status: {payment_intent.get('status')}")

        # Check if payment was successful
        actual_status = payment_intent.get('status')
        print(f"[DEBUG] Checking payment status: {actual_status}")
        if actual_status != 'succeeded':
            print(f"[ERROR] Payment status is not succeeded: {actual_status}")
            return jsonify({
                'error': 'Payment not successful',
                'status': actual_status,
                'details': 'Payment must be in succeeded status to create order'
            }), 400

        # Get user's cart
        cart = Cart.query.filter_by(user_id=user_id).first()

        if not cart or not cart.items:
            print("[ERROR] Cart is empty or not found")
            return jsonify({'error': 'Cart is empty'}), 400

        print(f"[DEBUG] Cart has {len(cart.items)} items")

        # Calculate total from cart (in dollars) - don't use Stripe amount which is in cents
        total_amount = sum(item.product.price * item.quantity for item in cart.items)
        
        print(f"[DEBUG] Creating transaction for ${total_amount:.2f}")

        # Determine if transaction requires audit (10% random + high-value/bulk triggers)
        import random
        requires_audit = False
        audit_reason = None

        # 10% random audit
        if random.random() < 0.10:
            requires_audit = True
            audit_reason = "Random security check"

        # High-value transaction ($100+)
        if total_amount >= 100:
            requires_audit = True
            audit_reason = "High-value transaction"

        # Bulk purchase (5+ of same item)
        for cart_item in cart.items:
            if cart_item.quantity >= 5:
                requires_audit = True
                audit_reason = "Bulk purchase detected"
                break

        # Create transaction record
        transaction = Transaction(
            user_id=user_id,
            total_amount=total_amount,  # Use calculated amount in dollars
            payment_intent_id=payment_intent_id,
            requires_audit=requires_audit,
            audit_reason=audit_reason
        )

        db.session.add(transaction)
        db.session.flush()  # Get transaction ID without committing

        print(f"[DEBUG] Transaction record created with ID: {transaction.id}")

        # Add transaction items
        for cart_item in cart.items:
            transaction_item = TransactionItem(
                transaction_id=transaction.id,
                product_id=cart_item.product_id,
                quantity=cart_item.quantity,
                price_at_purchase=cart_item.product.price
            )
            db.session.add(transaction_item)
            print(f"[DEBUG] Added transaction item: {cart_item.product.name} x {cart_item.quantity}")

        # Clear cart items but keep the cart
        CartItem.query.filter_by(cart_id=cart.id).delete()

        # Generate Exit Pass QR Code
        import qrcode
        import io
        import base64
        import json

        # QR code contains transaction verification data
        qr_data = {
            'transaction_id': transaction.id,
            'user_id': user_id,
            'amount': total_amount,
            'timestamp': transaction.created_at.isoformat(),
            'items_count': len(transaction.items)
        }

        # Create QR code
        qr = qrcode.QRCode(version=1, box_size=10, border=4)
        qr.add_data(json.dumps(qr_data))
        qr.make(fit=True)

        # Generate QR code image
        qr_image = qr.make_image(fill_color="black", back_color="white")

        # Convert to base64 for storage and display
        buffer = io.BytesIO()
        qr_image.save(buffer, format='PNG')
        qr_base64 = base64.b64encode(buffer.getvalue()).decode()

        # Save QR code to transaction
        transaction.qr_code = f"data:image/png;base64,{qr_base64}"

        # Commit all changes
        db.session.commit()

        print(f"[SUCCESS] Transaction {transaction.id} created with Exit Pass QR code for ${total_amount:.2f}")

        return jsonify({
            'message': 'Payment successful',
            'transaction_id': transaction.id,
            'total_amount': total_amount,
            'qr_code': transaction.qr_code,
            'requires_audit': transaction.requires_audit,
            'audit_reason': transaction.audit_reason
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] Payment confirmation failed: {str(e)}")
        import traceback
        traceback.print_exc()
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