# Product Images Setup Guide

This guide explains how to add real product images to your SmartScan Pro application.

## Overview

The application now supports real product images! You can add image URLs to your products, and they will automatically be displayed instead of the generated placeholder images.

## How It Works

- **Database**: Added `image_url` column to the `products` table
- **Backend**: API now returns `image_url` field for each product
- **Frontend**: Components check for real images first, then fall back to generated placeholders

## Adding Product Images

### Method 1: Using Image URLs (Recommended)

1. **Find product images online** or use your own hosted images
2. **Update the database** with image URLs

#### Using Python Script:

Create a file `backend/update_product_images.py`:

```python
from app import create_app
from app.extensions import db
from app.models import Product

def update_product_images():
    app = create_app()

    with app.app_context():
        # Example: Update specific products with image URLs
        products_to_update = {
            '886742859670': 'https://example.com/images/calvin-klein-cardigan.jpg',
            '190049632111': 'https://example.com/images/michael-kors-bag.jpg',
            # Add more products here...
        }

        for barcode, image_url in products_to_update.items():
            product = Product.query.filter_by(barcode=barcode).first()
            if product:
                product.image_url = image_url
                print(f"Updated {product.name}")

        db.session.commit()
        print("All images updated successfully!")

if __name__ == '__main__':
    update_product_images()
```

Then run:
```bash
cd backend
venv/Scripts/python.exe update_product_images.py
```

#### Using CSV Import:

1. **Add `image_url` column to your CSV**:

```csv
barcode,name,price,category,description,image_url
886742859670,Calvin Klein Women's Cardigan,34.99,Women,Soft knit cardigan,https://example.com/cardigan.jpg
190049632111,Michael Kors Crossbody Bag,79.99,Women,Leather crossbody bag,https://example.com/bag.jpg
```

2. **Update the import script** (`backend/import_products.py`):

```python
for row in reader:
    product = Product.query.filter_by(barcode=row['barcode']).first()
    if not product:
        product = Product(
            barcode=row['barcode'],
            name=row['name'],
            price=float(row['price']),
            category=row.get('category', 'Others'),
            description=row.get('description', ''),
            image_url=row.get('image_url', '')  # Add this line
        )
        db.session.add(product)
```

### Method 2: Using Local Images

1. **Place images in** `frontend/public/products/` folder:
   ```
   frontend/public/products/
   ├── 886742859670.jpg    (use barcode as filename)
   ├── 190049632111.jpg
   └── ...
   ```

2. **Update products with local paths**:
   ```python
   product.image_url = f'/products/{product.barcode}.jpg'
   ```

### Method 3: Using External APIs

You can fetch product images from external APIs like:

- **Amazon Product Advertising API**
- **Google Shopping API**
- **Your supplier's product API**

Example using a hypothetical API:

```python
import requests

def fetch_product_image(product_name):
    api_url = f"https://api.productimages.com/search?q={product_name}"
    response = requests.get(api_url)
    data = response.json()
    return data['image_url'] if data else None

# Update products
for product in Product.query.all():
    image_url = fetch_product_image(product.name)
    if image_url:
        product.image_url = image_url
        db.session.commit()
```

## Image Requirements

### Recommended Specifications:
- **Format**: JPG, PNG, or WebP
- **Size**: 800x800px minimum (square images work best)
- **File size**: Under 500KB for optimal loading
- **Aspect ratio**: 1:1 (square) is ideal

### Image Sources:

1. **Free Stock Photos**:
   - Unsplash.com
   - Pexels.com
   - Pixabay.com

2. **Product Databases**:
   - Official brand websites
   - Supplier catalogs
   - Manufacturer websites

3. **E-commerce Sites** (with permission):
   - Amazon (Product Advertising API)
   - Your retail partners

## Testing

After adding images, test them:

1. **Check the products page**: Visit `/products` to see if images load
2. **Check the cart**: Add items to cart and verify images display
3. **Check mobile view**: Ensure images are responsive

## Troubleshooting

### Images Not Showing?

1. **Check the image URL** is accessible (open in browser)
2. **Verify CORS settings** if using external URLs
3. **Check Next.js config** - add domains to `remotePatterns` in `next.config.ts`:

```typescript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'api.dicebear.com',
      pathname: '/**',
    },
    {
      protocol: 'https',
      hostname: 'your-image-host.com',  // Add your domain
      pathname: '/**',
    },
  ],
}
```

4. **Restart the frontend** after config changes

### Placeholder Images Still Showing?

This is normal! Products without `image_url` will automatically show generated placeholders.

## Bulk Update Example

To update all products at once:

```python
from app import create_app
from app.extensions import db
from app.models import Product

def bulk_update_images():
    app = create_app()

    with app.app_context():
        products = Product.query.all()

        for product in products:
            # Example: Use a pattern-based URL
            image_url = f"https://cdn.yourstore.com/products/{product.barcode}.jpg"
            product.image_url = image_url

        db.session.commit()
        print(f"Updated {len(products)} products")

if __name__ == '__main__':
    bulk_update_images()
```

## Next Steps

1. **Collect product images** for your inventory
2. **Choose a method** (URL, local, or API)
3. **Update the database** with image URLs
4. **Test thoroughly** on different devices
5. **Monitor loading performance**

## Need Help?

- Check that `image_url` column exists: `cd backend && venv/Scripts/python.exe add_image_url_column.py`
- Verify backend returns images: Visit `http://localhost:5000/api/products`
- Check browser console for image loading errors

---

**Note**: The SmartScan logo has been updated to remove "by Marshalls" and now shows "Smart Shopping, Instant Checkout" as the tagline. The logo image at `/logo.png` should be replaced with your custom logo.
