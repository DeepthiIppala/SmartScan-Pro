from flask import request, jsonify, Blueprint
from ..models import Product
from ..extensions import db
from ..decorators import admin_required

product_bp = Blueprint('products', __name__)

@product_bp.route('', methods=['GET'])
def get_products():
    products = Product.query.all()
    return jsonify([{
        "id": p.id,
        "barcode": p.barcode,
        "name": p.name,
        "price": p.price,
        "category": p.category,
        "description": p.description,
        "image_url": p.image_url
    } for p in products])

@product_bp.route('/<string:barcode>', methods=['GET'])
def get_product_by_barcode(barcode):
    product = Product.query.filter_by(barcode=barcode).first()
    if not product:
        return jsonify({"error": "Product not found"}), 404
    return jsonify({
        "id": product.id,
        "barcode": product.barcode,
        "name": product.name,
        "price": product.price,
        "category": product.category,
        "description": product.description,
        "image_url": product.image_url
    })

@product_bp.route('', methods=['POST'])
@admin_required()
def create_product():
    data = request.get_json()
    new_product = Product(**data)
    db.session.add(new_product)
    db.session.commit()
    return jsonify({"msg": "Product created", "id": new_product.id}), 201

@product_bp.route('/<int:product_id>', methods=['PUT'])
@admin_required()
def update_product(product_id):
    product = Product.query.get_or_404(product_id)
    data = request.get_json()
    for key, value in data.items():
        setattr(product, key, value)
    db.session.commit()
    return jsonify({"msg": "Product updated"})