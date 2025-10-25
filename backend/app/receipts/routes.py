"""
Receipt API Routes
"""
from flask import Blueprint, request, jsonify, make_response
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import Transaction
from .receipt_generator import receipt_generator

receipt_bp = Blueprint('receipts', __name__, url_prefix='/api/receipts')

@receipt_bp.route('/<int:transaction_id>/text', methods=['GET'])
@jwt_required()
def get_text_receipt(transaction_id):
    """Get plain text receipt"""
    try:
        user_id = get_jwt_identity()

        # Get transaction
        transaction = Transaction.query.filter_by(
            id=transaction_id,
            user_id=user_id
        ).first()

        if not transaction:
            return jsonify({'error': 'Transaction not found'}), 404

        # Generate text receipt
        receipt_text = receipt_generator.generate_text_receipt(transaction)

        response = make_response(receipt_text)
        response.headers['Content-Type'] = 'text/plain'
        response.headers['Content-Disposition'] = f'attachment; filename=receipt_{transaction_id}.txt'

        return response

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@receipt_bp.route('/<int:transaction_id>/html', methods=['GET'])
@jwt_required()
def get_html_receipt(transaction_id):
    """Get HTML receipt"""
    try:
        user_id = get_jwt_identity()

        # Get transaction
        transaction = Transaction.query.filter_by(
            id=transaction_id,
            user_id=user_id
        ).first()

        if not transaction:
            return jsonify({'error': 'Transaction not found'}), 404

        # Generate HTML receipt
        receipt_html = receipt_generator.generate_html_receipt(transaction)

        response = make_response(receipt_html)
        response.headers['Content-Type'] = 'text/html'

        return response

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@receipt_bp.route('/<int:transaction_id>/download', methods=['GET'])
@jwt_required()
def download_receipt(transaction_id):
    """Download HTML receipt"""
    try:
        user_id = get_jwt_identity()

        # Get transaction
        transaction = Transaction.query.filter_by(
            id=transaction_id,
            user_id=user_id
        ).first()

        if not transaction:
            return jsonify({'error': 'Transaction not found'}), 404

        # Generate HTML receipt
        receipt_html = receipt_generator.generate_html_receipt(transaction)

        response = make_response(receipt_html)
        response.headers['Content-Type'] = 'text/html'
        response.headers['Content-Disposition'] = f'attachment; filename=receipt_{transaction_id}.html'

        return response

    except Exception as e:
        return jsonify({'error': str(e)}), 500
