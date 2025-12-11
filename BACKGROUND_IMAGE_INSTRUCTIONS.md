# Background Image Setup - Final Step

## What Was Done

I've added background image support to the following pages:
- ✅ Home page (`/home`)
- ✅ Products page (`/products`)
- ✅ Cart page (`/cart`)

## Final Step: Add Your Background Image

**Save the shopping/checkout background image** (the one you sent showing QR code scanning) as:

```
frontend/public/shopping-bg.png
```

### Steps:

1. **Save your image** to `frontend/public/` folder
2. **Name it exactly**: `shopping-bg.png`
3. **Restart your frontend** (Ctrl+C and `npm run dev`)
4. **View the result** - the image will appear as a subtle background

## How It Looks

The background image will:
- Display at **10% opacity** (subtle, not overpowering)
- Have a **blue gradient overlay** to maintain readability
- Be **fixed** so it doesn't scroll with content
- Cover the **entire page** behind all content

## Image Requirements

- **Format**: PNG (or JPG)
- **Filename**: Must be exactly `shopping-bg.png`
- **Location**: `frontend/public/shopping-bg.png`
- **Recommended size**: 1920x1080 or larger
- **File size**: Under 1MB for fast loading

## Alternative Images

If you don't have the image file, you can:

1. **Use a different image** - just save it as `shopping-bg.png`
2. **Find a free stock image** from:
   - Unsplash.com (search: "shopping checkout")
   - Pexels.com (search: "retail store")
   - Pixabay.com (search: "qr code payment")

## Adjust Opacity (Optional)

If you want to make the background more/less visible, edit these files and change `opacity-10`:

- `frontend/app/(dashboard)/home/page.tsx` (line ~82)
- `frontend/app/(dashboard)/products/page.tsx` (line ~120)
- `frontend/app/(dashboard)/cart/page.tsx` (line ~75)

Change `opacity-10` to:
- `opacity-5` (more subtle, 5%)
- `opacity-15` (more visible, 15%)
- `opacity-20` (more visible, 20%)

## Current Setup

✅ Background code added to all pages
✅ Next.js configured for background images
✅ Updated to use PNG format
⏳ **Waiting for you to add the image file**

Once you add `shopping-bg.png`, your app will have a professional shopping background!
