from flask import request, jsonify, Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import Cart, Transaction, TransactionItem
from ..extensions import db
import qrcode
import base64
from io import BytesIO

transactions_bp = Blueprint('transactions', __name__)

@transactions_bp.route('/checkout', methods=['POST'])
@jwt_required()
def checkout():
    user_id = get_jwt_identity()
    cart = Cart.query.filter_by(user_id=user_id).first()

    if not cart or not cart.items:
        return jsonify({"msg": "Cart is empty"}), 400

    total = sum(item.quantity * item.product.price for item in cart.items)

    # Create the transaction
    new_transaction = Transaction(user_id=int(user_id), total_amount=round(total, 2))
    db.session.add(new_transaction)
    db.session.flush()  # Get the ID before committing

    # Copy cart items to transaction items
    transaction_items = []
    for item in cart.items:
        trans_item = TransactionItem(
            transaction_id=new_transaction.id,
            product_id=item.product_id,
            quantity=item.quantity,
            price_at_purchase=item.product.price
        )
        db.session.add(trans_item)
        transaction_items.append({
            "id": trans_item.id,
            "product_id": trans_item.product_id,
            "quantity": trans_item.quantity,
            "price_at_purchase": trans_item.price_at_purchase
        })

    # Generate QR Code
    qr = qrcode.make(f"Transaction ID: {new_transaction.id}, Total: ${new_transaction.total_amount}")
    buffered = BytesIO()
    qr.save(buffered, format="PNG")
    qr_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    new_transaction.qr_code = f"data:image/png;base64,{qr_str}"

    # Clear the cart
    for item in cart.items:
        db.session.delete(item)

    db.session.commit()

    return jsonify({
        "id": new_transaction.id,
        "user_id": new_transaction.user_id,
        "total_amount": new_transaction.total_amount,
        "qr_code": new_transaction.qr_code,
        "created_at": new_transaction.created_at.isoformat(),
        "items": transaction_items
    }), 201

@transactions_bp.route('', methods=['GET'])
@jwt_required()
def get_transaction_history():
    user_id = get_jwt_identity()
    transactions = Transaction.query.filter_by(user_id=user_id).order_by(Transaction.created_at.desc()).all()

    history = []
    for t in transactions:
        # Get transaction items with product details
        items = []
        print(f"Transaction {t.id} has {len(t.items)} items")
        for item in t.items:
            print(f"  Item {item.id}: product_id={item.product_id}, quantity={item.quantity}")
            items.append({
                "id": item.id,
                "product_id": item.product_id,
                "quantity": item.quantity,
                "price_at_purchase": item.price_at_purchase,
                "product": {
                    "id": item.product.id,
                    "barcode": item.product.barcode,
                    "name": item.product.name,
                    "price": item.product.price
                }
            })

        transaction_data = {
            "id": t.id,
            "user_id": t.user_id,
            "total_amount": t.total_amount,
            "created_at": t.created_at.isoformat(),
            "qr_code": t.qr_code,
            "items": items,
            "requires_audit": t.requires_audit,
            "audit_reason": t.audit_reason
        }
        print(f"Returning transaction {t.id} with {len(items)} items")
        history.append(transaction_data)

    print(f"Total transactions: {len(history)}")
    return jsonify(history)