# Cloudinary Setup Guide

## Why Cloudinary?

Your backend is deployed on Render, which uses an **ephemeral filesystem**. This means:
- Files stored locally (`backend/uploads`) are **lost** when the server restarts
- Files are **lost** on redeploy
- Files are **lost** when the server spins down (free tier)

**Cloudinary solves this** by storing images in the cloud permanently.

## Setup Steps

### 1. Create a Cloudinary Account

1. Go to https://cloudinary.com/users/register/free
2. Sign up for a free account (25GB storage, 25GB bandwidth/month)
3. After signup, you'll see your dashboard

### 2. Get Your Credentials

In your Cloudinary dashboard, you'll see:
- **Cloud Name** (e.g., `dxyz123abc`)
- **API Key** (e.g., `123456789012345`)
- **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz123456`)

### 3. Configure Environment Variables

#### For Local Development:

Add to `backend/.env`:
```env
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

#### For Production (Render):

1. Go to your Render dashboard
2. Select your backend service
3. Go to **Environment** tab
4. Add these environment variables:
   - `CLOUDINARY_CLOUD_NAME` = your cloud name
   - `CLOUDINARY_API_KEY` = your API key
   - `CLOUDINARY_API_SECRET` = your API secret
5. Save changes (Render will restart your service)

### 4. Install Dependencies

```bash
cd backend
npm install
```

This will install the `cloudinary` package.

### 5. Test the Setup

1. Start your backend: `npm run dev`
2. You should see: `✅ Cloudinary configured successfully` in the console
3. Upload a product image through your admin panel
4. Check that the image URL starts with `https://res.cloudinary.com/...`

## How It Works

- **With Cloudinary configured**: Images are uploaded directly to Cloudinary and stored permanently
- **Without Cloudinary**: Images are stored locally (will be lost on restart/redeploy)

The system automatically falls back to local storage if Cloudinary is not configured, so your app will work either way.

## Migration from Local to Cloudinary

If you have existing products with local image URLs (`/uploads/...`), you can migrate them:

### Option 1: Use the Migration Script (Recommended)

A migration script is included to automatically migrate existing images:

```bash
# First, test what would be migrated (dry run)
npm run migrate:images:dry-run

# Then run the actual migration
npm run migrate:images
```

**Requirements:**
- Cloudinary must be configured (environment variables set)
- Image files must exist in `backend/uploads/` directory
- Database connection must be working

**Note:** If your Render server has already restarted, the local image files may be lost. In that case, use Option 2.

### Option 2: Manual Re-upload

1. Go to your admin panel
2. Edit each product
3. Re-upload the images (they'll automatically go to Cloudinary)
4. Save the product

### Option 3: Keep as-is (Temporary)

- Old images will work until server restart/redeploy
- New images will go to Cloudinary automatically
- Gradually migrate products as you edit them

## Troubleshooting

### Images still disappearing?
- Check that environment variables are set correctly in Render
- Verify Cloudinary credentials are correct
- Check backend logs for Cloudinary errors

### "Cloudinary not configured" warning?
- This is normal if you haven't set up Cloudinary yet
- The app will use local storage as fallback
- Set up Cloudinary to fix the image persistence issue

### Images not loading?
- Check that `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` are all set
- Verify the Cloudinary URLs are being generated correctly
- Check browser console for image loading errors

## Free Tier Limits

Cloudinary free tier includes:
- 25GB storage
- 25GB bandwidth/month
- Unlimited transformations
- CDN delivery

This is usually sufficient for small to medium e-commerce sites.
