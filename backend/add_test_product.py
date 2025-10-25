"""
Script to add test products to the database
Run this with: python add_test_product.py
"""

from app import create_app
from app.extensions import db
from app.models import Product

app = create_app()

with app.app_context():
    # Add a Cardigan product for AI testing
    cardigan = Product(
        barcode="TEST-CARDIGAN-001",
        name="Women's Cardigan",
        price=29.99
    )

    # Check if it already exists
    existing = Product.query.filter_by(barcode="TEST-CARDIGAN-001").first()

    if existing:
        print(f"[OK] Product already exists: {existing.name} - ${existing.price}")
    else:
        db.session.add(cardigan)
        db.session.commit()
        print(f"[OK] Added: {cardigan.name} - ${cardigan.price} (Barcode: {cardigan.barcode})")

    # Show all products in database
    print("\n--- All Products in Database ---")
    all_products = Product.query.all()
    for p in all_products:
        print(f"  - {p.name} - ${p.price} (Barcode: {p.barcode})")

    print(f"\nTotal products: {len(all_products)}")
