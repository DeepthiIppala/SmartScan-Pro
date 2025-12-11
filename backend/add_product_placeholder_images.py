"""
Add styled placeholder images to products
Uses imgplaceholder.com for beautiful, professional-looking product images
"""
from app import create_app
from app.extensions import db
from app.models import Product
import urllib.parse

def add_placeholder_images():
    """
    Add professional placeholder images to all products
    """
    app = create_app()

    category_styles = {
        'Women': {
            'bg': 'FFB6D9',  # Soft pink
            'text': 'C41E3A',  # Deep red
            'icon': '👗'
        },
        'Men': {
            'bg': '89CFF0',  # Baby blue
            'text': '003366',  # Navy
            'icon': '👔'
        },
        'Kids': {
            'bg': 'FFE4B5',  # Moccasin
            'text': 'FF6347',  # Tomato
            'icon': '🧸'
        },
        'Home Decor': {
            'bg': 'B0E0B0',  # Light green
            'text': '228B22',  # Forest green
            'icon': '🏠'
        },
        'Others': {
            'bg': 'E0E0E0',  # Light gray
            'text': '666666',  # Dark gray
            'icon': '📦'
        }
    }

    with app.app_context():
        products = Product.query.all()

        print(f"[INFO] Updating {len(products)} products with placeholder images...")

        for product in products:
            category = product.category if product.category in category_styles else 'Others'
            style = category_styles[category]

            # Create clean product name for image (first 3 words)
            words = product.name.split()[:3]
            short_name = ' '.join(words)

            # URL encode the text
            text = urllib.parse.quote(f"{style['icon']} {short_name}")

            # Using placeholder.co (no rate limits, great quality)
            image_url = f"https://placehold.co/600x600/{style['bg']}/{style['text']}?text={text}&font=roboto"

            product.image_url = image_url

        db.session.commit()
        print(f"[SUCCESS] Updated {len(products)} products with styled placeholder images")

        # Show examples
        print("\nExample images:")
        for category, style in category_styles.items():
            sample = Product.query.filter_by(category=category).first()
            if sample:
                print(f"\n{category}:")
                print(f"  Product: {sample.name}")
                print(f"  Image: {sample.image_url[:80]}...")


def add_category_specific_images():
    """
    Add more realistic placeholder images based on product category and type
    """
    app = create_app()

    # Map product keywords to appropriate icons/symbols
    product_type_icons = {
        # Clothing
        'cardigan': '🧥', 'shirt': '👕', 'polo': '👕', 'dress': '👗', 'blouse': '👚',
        'jeans': '👖', 'pants': '👖', 'shorts': '🩳', 'jacket': '🧥', 'blazer': '🧥',
        'sweater': '🧶', 'hoodie': '👕', 'coat': '🧥',

        # Footwear
        'sneakers': '👟', 'shoes': '👞', 'boots': '👢', 'pumps': '👠', 'sandals': '👡',

        # Accessories
        'bag': '👜', 'purse': '👛', 'wallet': '👛', 'watch': '⌚', 'sunglasses': '🕶️',
        'belt': '👔', 'tie': '👔', 'scarf': '🧣', 'hat': '🎩', 'cap': '🧢',

        # Kids
        'kids': '👶', 'toddler': '🧒', 'baby': '👶', 'backpack': '🎒',

        # Home & Kitchen
        'candle': '🕯️', 'utensil': '🍴', 'knife': '🔪', 'pan': '🍳', 'pot': '🫕',
        'blender': '🥤', 'coffee': '☕', 'mug': '☕', 'plate': '🍽️', 'bowl': '🥣',
        'vacuum': '🧹', 'mop': '🧽', 'cleaner': '🧼', 'towel': '🧻',

        # Default
        'default': '📦'
    }

    with app.app_context():
        products = Product.query.all()

        print(f"[INFO] Adding smart placeholder images for {len(products)} products...")

        for product in products:
            # Find appropriate icon based on product name
            icon = '📦'  # default
            product_name_lower = product.name.lower()

            for keyword, emoji in product_type_icons.items():
                if keyword in product_name_lower:
                    icon = emoji
                    break

            # Get category style
            category = product.category if product.category else 'Others'

            if category == 'Women':
                bg_color = 'FFB6D9'
                text_color = 'C41E3A'
            elif category == 'Men':
                bg_color = '89CFF0'
                text_color = '003366'
            elif category == 'Kids':
                bg_color = 'FFE4B5'
                text_color = 'FF6347'
            elif category == 'Home Decor':
                bg_color = 'B0E0B0'
                text_color = '228B22'
            else:
                bg_color = 'E0E0E0'
                text_color = '666666'

            # Create image URL with brand/product name
            # Extract brand name (usually first 1-2 words)
            words = product.name.split()
            if len(words) >= 2:
                text = f"{icon}+{words[0]}+{words[1]}"
            else:
                text = f"{icon}+{words[0]}"

            image_url = f"https://placehold.co/600x600/{bg_color}/{text_color}?text={text}&font=roboto"

            product.image_url = image_url

        db.session.commit()
        print(f"[SUCCESS] Updated all products with category-specific placeholder images!")

        # Show examples by category
        print("\n" + "="*70)
        print("Examples by category:")
        print("="*70)

        for category in ['Women', 'Men', 'Kids', 'Home Decor', 'Others']:
            samples = Product.query.filter_by(category=category).limit(3).all()
            if samples:
                print(f"\n{category}:")
                for sample in samples:
                    print(f"  • {sample.name[:40]}")


if __name__ == '__main__':
    print("="*70)
    print("SmartScan Pro - Product Image Setup")
    print("="*70)
    print("\nChoose an option:")
    print("\n1. Add simple placeholder images (solid colors with emojis)")
    print("2. Add smart placeholder images (product-specific icons)")
    print()

    choice = input("Enter your choice (1-2): ").strip()

    if choice == '1':
        add_placeholder_images()
    elif choice == '2':
        add_category_specific_images()
    else:
        print("[ERROR] Invalid choice")

    print("\n" + "="*70)
    print("Done! Your products now have images.")
    print("Restart your frontend to see the changes.")
    print("="*70)
