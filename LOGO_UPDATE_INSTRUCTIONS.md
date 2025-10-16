# Logo Update Instructions

## Steps to Update Your Website Logo

### 1. Save Your New Logo
Save your new POLIGAP logo image to:
```
public/assets/poligap-logo.png
```

**Image Requirements:**
- Format: PNG (with transparent background recommended)
- Recommended size: 1200px width (will be scaled automatically)
- Name it: `poligap-logo.png`

### 2. Logo Locations in the Application

Your logo has been configured to use: `/assets/poligap-logo.png`

The logo appears in these locations:
- ✅ **Header** (all pages) - Updated
- ✅ **Loading screen** - Updated
- ✅ **Sign In page** - Updated
- ✅ **Sign Up page** - Updated
- ✅ **Email Verification page** - Updated
- ✅ **Confirmation page** - Updated

### 3. Alternative: Use Environment Variable

You can also set a custom logo URL using an environment variable:

Add to your `.env.local` file:
```env
NEXT_PUBLIC_LOGO_URL=/assets/poligap-logo.png
```

### 4. Update Favicon (Optional)

To update the browser tab icon:
1. Create a favicon from your logo (16x16, 32x32, 48x48)
2. Replace `public/favicon.ico` with your new favicon

### 5. After Placing the Logo

Once you've saved your logo to `public/assets/poligap-logo.png`, restart your development server:

```bash
npm run dev
```

Or rebuild for production:
```bash
npm run build
```

## Current Logo Files

Your project currently has these logo files:
- `public/assets/poligap-high-resolution-logo.png` (old logo)
- `public/assets/poligap (1).png`
- `public/assets/poligap-placeholder.svg`

You can delete these old files after confirming your new logo works correctly.

---

**Note:** The code has been updated to look for `poligap-logo.png`. Simply place your new logo image at the specified location and it will appear throughout the application!
