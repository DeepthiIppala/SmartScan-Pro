from flask import request, jsonify, Blueprint, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import Cart, Transaction, TransactionItem, User
from ..extensions import db
import qrcode
import base64
import hmac
import hashlib
import json
import re
import secrets
from datetime import datetime
from io import BytesIO

transactions_bp = Blueprint('transactions', __name__)


def _get_signing_secret():
    # Fallback to app secret key to avoid unsigned payloads
    return current_app.config.get("QR_SIGNING_SECRET") or current_app.config.get("SECRET_KEY") or "smartscan-secret"


def _build_exit_pass_payload(transaction_id: int, user_id: int, total_amount: float):
    payload = {
        "v": 1,
        "tx": int(transaction_id),
        "uid": int(user_id),
        "amt": float(total_amount),
        "ts": int(datetime.utcnow().timestamp()),
        "nonce": secrets.token_hex(8),
    }
    signature_base = f"{payload['v']}|{payload['tx']}|{payload['uid']}|{payload['amt']}|{payload['ts']}|{payload['nonce']}"
    payload["sig"] = hmac.new(
        _get_signing_secret().encode("utf-8"),
        signature_base.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    payload["sig_fields"] = "v|tx|uid|amt|ts|nonce"
    return payload


def _serialize_transaction(t: Transaction):
    items = []
    for item in t.items:
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

    return {
        "id": t.id,
        "user_id": t.user_id,
        "total_amount": t.total_amount,
        "created_at": t.created_at.isoformat(),
        "qr_code": t.qr_code or "",
        "items": items,
        "requires_audit": t.requires_audit,
        "audit_reason": t.audit_reason
    }


def _validate_signed_payload(payload: dict):
    required = ["v", "tx", "uid", "amt", "ts", "nonce", "sig"]
    if not all(key in payload for key in required):
        return False

    signature_base = f"{payload['v']}|{payload['tx']}|{payload['uid']}|{payload['amt']}|{payload['ts']}|{payload['nonce']}"
    expected_sig = hmac.new(
        _get_signing_secret().encode("utf-8"),
        signature_base.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(str(payload.get("sig", "")), expected_sig)

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

    # Generate signed QR payload for exit pass verification
    payload = _build_exit_pass_payload(new_transaction.id, int(user_id), new_transaction.total_amount)
    qr_payload_str = json.dumps(payload, separators=(",", ":"))
    qr = qrcode.make(qr_payload_str)
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
        "items": transaction_items,
        "qr_payload": payload  # Useful for debugging; QR image still encodes the signed payload
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


@transactions_bp.route('/verify-exit-pass', methods=['POST'])
@jwt_required()
def verify_exit_pass():
    """Verify a scanned exit-pass QR code and return transaction details."""
    user_id = get_jwt_identity()
    admin_user = User.query.get(int(user_id))
    if not admin_user or not admin_user.is_admin:
        return jsonify({"msg": "Admin privileges required for verification"}), 403

    body = request.get_json() or {}
    qr_data = body.get("qr_data")

    if not qr_data or not isinstance(qr_data, str):
        return jsonify({"msg": "QR data is required for verification"}), 400

    # Attempt to parse signed JSON payload first
    parsed_payload = None
    try:
        parsed_payload = json.loads(qr_data)
    except (json.JSONDecodeError, TypeError):
        parsed_payload = None

    transaction = None
    if parsed_payload:
        # Preferred: signed payload
        if _validate_signed_payload(parsed_payload):
            transaction = Transaction.query.filter_by(id=int(parsed_payload["tx"])).first()
        else:
            # Accept legacy/unsigned JSON payloads that include a transaction id
            tx_id = parsed_payload.get("transaction_id") or parsed_payload.get("id") or parsed_payload.get("tx")
            if tx_id:
                try:
                    transaction = Transaction.query.filter_by(id=int(tx_id)).first()
                except (TypeError, ValueError):
                    transaction = None
    else:
        # Fallback: support legacy QR content such as "Transaction ID: 123"
        match = re.search(r"Transaction\\s*ID[:\\s]+(\\d+)", qr_data)
        if match:
            transaction_id = int(match.group(1))
            transaction = Transaction.query.filter_by(id=transaction_id).first()

    if not transaction:
        return jsonify({"msg": "Invalid or unsigned QR code"}), 400

    # If a signed payload exists, validate critical fields against DB
    if parsed_payload and parsed_payload.get("sig"):
        if abs(float(parsed_payload.get("amt", 0)) - float(transaction.total_amount)) > 0.01:
            return jsonify({"msg": "QR code data does not match transaction"}), 400
        if int(parsed_payload.get("uid", 0)) != int(transaction.user_id):
            return jsonify({"msg": "QR code user mismatch"}), 400

    response_data = _serialize_transaction(transaction)
    response_data["customer"] = {
        "id": transaction.user.id,
        "email": transaction.user.email,
        "first_name": transaction.user.first_name,
        "last_name": transaction.user.last_name,
    }
    response_data["verified"] = True

    return jsonify(response_data), 200
