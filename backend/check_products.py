from app import create_app
from app.models import Product
from app.extensions import db

app = create_app()

with app.app_context():
    products = Product.query.all()
    print(f'Found {len(products)} products:')
    for p in products:
        print(f'- {p.barcode}: {p.name} (${p.price})')
