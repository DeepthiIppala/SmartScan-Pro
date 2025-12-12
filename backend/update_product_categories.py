"""
Update existing products with categories from CSV file
"""
import csv
import os
from app import create_app
from app.extensions import db
from app.models import Product

def update_product_categories():
    """Update existing products with categories from CSV"""
    app = create_app()

    with app.app_context():
        csv_path = os.path.join(os.path.dirname(__file__), 'marshalls_products.csv')

        if not os.path.exists(csv_path):
            print(f"[ERROR] File not found: {csv_path}")
            return

        updated = 0
        not_found = 0
        errors = 0

        with open(csv_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)

            print("[INFO] Starting category update...")

            for row in reader:
                try:
                    # Find product by barcode
                    product = Product.query.filter_by(barcode=row['barcode']).first()

                    if product:
                        # Update category and description
                        product.category = row.get('category', 'Others')
                        product.description = row.get('description', '')
                        updated += 1
                        print(f"[OK] Updated: {product.name} -> {product.category}")
                    else:
                        not_found += 1
                        print(f"[WARN] Product not found: {row['name']} (Barcode: {row['barcode']})")

                except Exception as e:
                    errors += 1
                    print(f"[ERROR] Failed to update {row.get('name', 'Unknown')}: {str(e)}")
                    continue

            # Commit all changes
            try:
                db.session.commit()
                print(f"\n[SUCCESS] Update complete!")
                print(f"  - Updated: {updated} products")
                print(f"  - Not found: {not_found} products")
                print(f"  - Errors: {errors} products")
            except Exception as e:
                db.session.rollback()
                print(f"[ERROR] Failed to commit changes: {str(e)}")

if __name__ == '__main__':
    update_product_categories()
