"""
Web scraper to fetch product images from Marshalls website
"""
import requests
from bs4 import BeautifulSoup
import json
import time
from app import create_app
from app.extensions import db
from app.models import Product

# Marshalls category URLs
MARSHALLS_CATEGORIES = {
    'Women': 'https://www.marshalls.com/us/store/shop/women',
    'Men': 'https://www.marshalls.com/us/store/shop/men',
    'Kids': 'https://www.marshalls.com/us/store/shop/kids',
    'Home Decor': 'https://www.marshalls.com/us/store/shop/home'
}

def scrape_marshalls_products(category_url, max_products=20):
    """
    Scrape product images from Marshalls website

    Args:
        category_url: URL of the category page
        max_products: Maximum number of products to scrape

    Returns:
        List of product dictionaries with name and image_url
    """
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }

    products = []

    try:
        print(f"[INFO] Fetching: {category_url}")
        response = requests.get(category_url, headers=headers, timeout=10)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, 'html.parser')

        # Find product cards - adjust selectors based on actual HTML structure
        product_cards = soup.find_all('div', class_='product-card', limit=max_products)

        if not product_cards:
            # Try alternative selectors
            product_cards = soup.find_all('article', class_='product', limit=max_products)

        if not product_cards:
            # Try finding images directly
            product_images = soup.find_all('img', class_='product-image', limit=max_products)
            for img in product_images:
                image_url = img.get('src') or img.get('data-src')
                alt_text = img.get('alt', 'Product')

                if image_url and not image_url.startswith('data:'):
                    products.append({
                        'name': alt_text,
                        'image_url': image_url if image_url.startswith('http') else f"https://www.marshalls.com{image_url}"
                    })
        else:
            for card in product_cards:
                try:
                    # Find product name
                    name_elem = card.find('h3') or card.find('a', class_='product-name')
                    product_name = name_elem.text.strip() if name_elem else 'Unknown Product'

                    # Find product image
                    img_elem = card.find('img')
                    if img_elem:
                        image_url = img_elem.get('src') or img_elem.get('data-src')

                        if image_url and not image_url.startswith('data:'):
                            # Ensure full URL
                            if not image_url.startswith('http'):
                                image_url = f"https://www.marshalls.com{image_url}"

                            products.append({
                                'name': product_name,
                                'image_url': image_url
                            })
                except Exception as e:
                    print(f"[WARN] Error parsing product card: {e}")
                    continue

        print(f"[OK] Found {len(products)} products")
        return products

    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Request failed: {e}")
        return []
    except Exception as e:
        print(f"[ERROR] Scraping failed: {e}")
        return []


def match_and_update_products(scraped_products, category):
    """
    Match scraped products with database products and update image URLs

    Args:
        scraped_products: List of scraped product dictionaries
        category: Product category (Men, Women, Kids, Home Decor)
    """
    app = create_app()

    with app.app_context():
        # Get products from this category
        db_products = Product.query.filter_by(category=category).all()

        print(f"\n[INFO] Matching {len(scraped_products)} scraped products with {len(db_products)} database products in '{category}' category")

        updated = 0

        for scraped in scraped_products:
            scraped_name = scraped['name'].lower()

            # Try to find matching product in database
            best_match = None
            best_score = 0

            for db_product in db_products:
                # Simple word matching score
                db_words = set(db_product.name.lower().split())
                scraped_words = set(scraped_name.split())

                # Calculate similarity
                common_words = db_words.intersection(scraped_words)
                if common_words:
                    score = len(common_words) / max(len(db_words), len(scraped_words))

                    if score > best_score and score > 0.3:  # Minimum 30% match
                        best_score = score
                        best_match = db_product

            if best_match:
                best_match.image_url = scraped['image_url']
                updated += 1
                print(f"[OK] Matched: {best_match.name[:50]} -> {scraped['name'][:50]} (score: {best_score:.2f})")

        db.session.commit()
        print(f"\n[SUCCESS] Updated {updated} products with images")


def scrape_all_categories():
    """
    Scrape product images from all Marshalls categories
    """
    print("=" * 70)
    print("Marshalls Product Image Scraper")
    print("=" * 70)
    print("\nThis will scrape product images from Marshalls website")
    print("and match them with your database products.\n")

    all_scraped = {}

    for category, url in MARSHALLS_CATEGORIES.items():
        print(f"\n{'='*70}")
        print(f"Scraping {category} category...")
        print(f"{'='*70}")

        products = scrape_marshalls_products(url, max_products=30)
        all_scraped[category] = products

        # Be nice to the server
        time.sleep(2)

    # Match and update
    print(f"\n{'='*70}")
    print("Matching and updating products...")
    print(f"{'='*70}")

    for category, products in all_scraped.items():
        if products:
            match_and_update_products(products, category)

    # Summary
    print(f"\n{'='*70}")
    print("Summary")
    print(f"{'='*70}")
    for category, products in all_scraped.items():
        print(f"{category}: {len(products)} products scraped")


def use_unsplash_images():
    """
    Alternative: Use Unsplash API to get high-quality product-like images
    This is a fallback if web scraping doesn't work
    """
    app = create_app()

    # Unsplash API (free tier: 50 requests/hour)
    UNSPLASH_ACCESS_KEY = 'YOUR_UNSPLASH_ACCESS_KEY'  # Get free key from unsplash.com/developers

    category_keywords = {
        'Women': ['fashion', 'women clothing', 'handbag', 'shoes'],
        'Men': ['men fashion', 'menswear', 'sneakers', 'watch'],
        'Kids': ['kids clothing', 'children toys', 'kids shoes'],
        'Home Decor': ['home decor', 'kitchen', 'furniture', 'candle']
    }

    with app.app_context():
        for category, keywords in category_keywords.items():
            products = Product.query.filter_by(category=category).filter(
                (Product.image_url == None) | (Product.image_url == '')
            ).limit(10).all()

            for i, product in enumerate(products):
                keyword = keywords[i % len(keywords)]

                # Unsplash random photo API
                url = f"https://source.unsplash.com/400x400/?{keyword}"
                product.image_url = url
                print(f"[OK] {product.name} -> {url}")

            db.session.commit()

        print("[SUCCESS] Updated products with Unsplash images")


def use_placeholder_api():
    """
    Use a placeholder image API (always works as fallback)
    """
    app = create_app()

    category_colors = {
        'Women': 'FF69B4',  # Pink
        'Men': '4169E1',    # Royal Blue
        'Kids': 'FFB6C1',   # Light Pink
        'Home Decor': '90EE90',  # Light Green
        'Others': 'D3D3D3'  # Light Gray
    }

    with app.app_context():
        products = Product.query.filter(
            (Product.image_url == None) | (Product.image_url == '')
        ).all()

        for product in products:
            category = product.category or 'Others'
            color = category_colors.get(category, 'D3D3D3')

            # Using placeholder.com API
            image_url = f"https://via.placeholder.com/400x400/{color}/FFFFFF?text={product.name[:20].replace(' ', '+')}"
            product.image_url = image_url

        db.session.commit()
        print(f"[SUCCESS] Updated {len(products)} products with placeholder images")


if __name__ == '__main__':
    print("\n" + "="*70)
    print("Product Image Scraper - Choose an option:")
    print("="*70)
    print("\n1. Scrape from Marshalls website (may not work if site structure changed)")
    print("2. Use placeholder images with product names")
    print("3. Use Unsplash high-quality images (requires API key)")
    print("4. Test scraping (see what's found without updating)")
    print()

    choice = input("Enter your choice (1-4): ").strip()

    if choice == '1':
        scrape_all_categories()
    elif choice == '2':
        use_placeholder_api()
    elif choice == '3':
        print("\nTo use Unsplash:")
        print("1. Get free API key from: https://unsplash.com/developers")
        print("2. Edit this file and add your key to UNSPLASH_ACCESS_KEY")
        print("3. Run option 3 again")
        # use_unsplash_images()
    elif choice == '4':
        print("\nTest mode - Scraping Women category...")
        products = scrape_marshalls_products(MARSHALLS_CATEGORIES['Women'], max_products=5)
        print(f"\nFound {len(products)} products:")
        for p in products:
            print(f"  - {p['name'][:50]}")
            print(f"    {p['image_url'][:80]}...")
    else:
        print("[ERROR] Invalid choice")
