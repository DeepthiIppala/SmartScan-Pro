"""
Bulk import products from CSV file into the database
"""
import csv
import os
from app import create_app
from app.extensions import db
from app.models import Product

def import_products_from_csv(csv_file_path):
    """Import products from CSV file"""
    app = create_app()

    with app.app_context():
        # Check if file exists
        if not os.path.exists(csv_file_path):
            print(f"[ERROR] File not found: {csv_file_path}")
            return

        # Clear existing products (optional - comment out if you want to keep old products)
        print("[INFO] Checking for existing products...")
        existing_count = Product.query.count()
        print(f"[INFO] Found {existing_count} existing products")

        # Read CSV and import products
        imported = 0
        skipped = 0
        errors = 0

        with open(csv_file_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)

            print("[INFO] Starting product import...")

            for row in reader:
                try:
                    # Check if product with this barcode already exists
                    existing = Product.query.filter_by(barcode=row['barcode']).first()

                    if existing:
                        print(f"[SKIP] Product already exists: {row['name']} (Barcode: {row['barcode']})")
                        skipped += 1
                        continue

                    # Create new product
                    product = Product(
                        barcode=row['barcode'],
                        name=row['name'],
                        price=float(row['price']),
                        category=row.get('category', 'General'),
                        description=row.get('description', '')
                    )

                    db.session.add(product)
                    imported += 1
                    print(f"[OK] Imported: {product.name} - ${product.price} ({product.category})")

                except Exception as e:
                    errors += 1
                    print(f"[ERROR] Failed to import {row.get('name', 'Unknown')}: {str(e)}")
                    continue

            # Commit all changes
            try:
                db.session.commit()
                print(f"\n[SUCCESS] Import complete!")
                print(f"  - Imported: {imported} products")
                print(f"  - Skipped: {skipped} products (already exist)")
                print(f"  - Errors: {errors} products")
                print(f"  - Total in database: {Product.query.count()} products")
            except Exception as e:
                db.session.rollback()
                print(f"[ERROR] Failed to commit changes: {str(e)}")

if __name__ == '__main__':
    csv_path = os.path.join(os.path.dirname(__file__), 'marshalls_products.csv')
    print(f"[INFO] Importing products from: {csv_path}")
    import_products_from_csv(csv_path)
