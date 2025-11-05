from app import create_app
from app.models import Product
from app.extensions import db

app = create_app()

with app.app_context():
    # Check if product already exists
    existing = Product.query.filter_by(barcode='096619879045').first()

    if existing:
        print(f'Product already exists: {existing.name} (${existing.price})')
    else:
        # Add the Kirkland water bottle
        product = Product(
            barcode='096619879045',
            name='Kirkland Signature Purified Water',
            price=0.99
        )
        db.session.add(product)
        db.session.commit()
        print(f'Successfully added: {product.name} - ${product.price}')
        print(f'Barcode: {product.barcode}')
