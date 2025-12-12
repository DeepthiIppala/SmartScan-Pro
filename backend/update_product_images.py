"""
Update product images - Add image URLs to your products
"""
from app import create_app
from app.extensions import db
from app.models import Product

def update_product_images():
    """
    Update products with image URLs

    You can add real product image URLs here.
    Replace the example URLs with actual image URLs for your products.
    """
    app = create_app()

    with app.app_context():
        # Example: Update products with image URLs
        # Format: 'barcode': 'image_url'
        products_to_update = {
            # Example entries - replace with your actual product images:
            # '886742859670': 'https://example.com/images/calvin-klein-cardigan.jpg',
            # '190049632111': 'https://example.com/images/michael-kors-bag.jpg',
            # '883929669202': 'https://example.com/images/nike-sneakers.jpg',

            # Add your product image URLs here:
            # 'BARCODE': 'IMAGE_URL',
        }

        if not products_to_update:
            print("[INFO] No products to update. Add product barcodes and image URLs to the products_to_update dictionary.")
            print("\nExample:")
            print("  products_to_update = {")
            print("      '886742859670': 'https://your-cdn.com/cardigan.jpg',")
            print("      '190049632111': 'https://your-cdn.com/bag.jpg',")
            print("  }")
            return

        updated = 0
        not_found = 0

        for barcode, image_url in products_to_update.items():
            product = Product.query.filter_by(barcode=barcode).first()
            if product:
                product.image_url = image_url
                updated += 1
                print(f"[OK] Updated: {product.name} -> {image_url[:50]}...")
            else:
                not_found += 1
                print(f"[WARN] Product not found: {barcode}")

        db.session.commit()
        print(f"\n[SUCCESS] Updated {updated} products")
        if not_found > 0:
            print(f"[INFO] {not_found} products not found")


def bulk_update_from_pattern():
    """
    Update all products using a URL pattern

    Useful if your images follow a naming convention like:
    https://cdn.yourstore.com/products/{barcode}.jpg
    """
    app = create_app()

    with app.app_context():
        # Change this to your image URL pattern
        BASE_URL = "https://cdn.yourstore.com/products"

        products = Product.query.all()

        print(f"[INFO] Updating {len(products)} products...")
        print(f"[INFO] Using pattern: {BASE_URL}/{{barcode}}.jpg")

        # Ask for confirmation
        confirm = input("\nDo you want to proceed? (yes/no): ")

        if confirm.lower() != 'yes':
            print("[CANCELLED] No changes made")
            return

        for product in products:
            # Build URL using barcode
            image_url = f"{BASE_URL}/{product.barcode}.jpg"
            product.image_url = image_url

        db.session.commit()
        print(f"\n[SUCCESS] Updated {len(products)} products with image URLs")


def clear_all_images():
    """
    Remove all product image URLs (reset to placeholders)
    """
    app = create_app()

    with app.app_context():
        products = Product.query.all()

        print(f"[WARN] This will remove image URLs from {len(products)} products")
        confirm = input("Are you sure? (yes/no): ")

        if confirm.lower() != 'yes':
            print("[CANCELLED] No changes made")
            return

        for product in products:
            product.image_url = None

        db.session.commit()
        print(f"\n[SUCCESS] Cleared images from {len(products)} products")


def list_products_without_images():
    """
    List all products that don't have image URLs
    """
    app = create_app()

    with app.app_context():
        products = Product.query.filter(
            (Product.image_url == None) | (Product.image_url == '')
        ).all()

        print(f"\n[INFO] Found {len(products)} products without images:\n")

        for product in products:
            print(f"  {product.barcode} - {product.name} ({product.category})")

        print(f"\nTotal: {len(products)} products need images")


if __name__ == '__main__':
    print("=" * 60)
    print("SmartScan Pro - Product Image Updater")
    print("=" * 60)
    print("\nChoose an option:")
    print("1. Update specific products (edit this file first)")
    print("2. Bulk update using URL pattern")
    print("3. List products without images")
    print("4. Clear all image URLs")
    print()

    choice = input("Enter your choice (1-4): ")

    if choice == '1':
        update_product_images()
    elif choice == '2':
        bulk_update_from_pattern()
    elif choice == '3':
        list_products_without_images()
    elif choice == '4':
        clear_all_images()
    else:
        print("[ERROR] Invalid choice")
