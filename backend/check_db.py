from app import create_app
from app.models import Product

app = create_app()

with app.app_context():
    products = Product.query.all()
    print(f"\n=== All Products in Database ({len(products)} total) ===")
    for p in products:
        print(f"ID: {p.id} | Barcode: {p.barcode} | Name: {p.name} | Price: ${p.price}")
    print()
