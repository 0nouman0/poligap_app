"
```

## Changes Made:
1. **Removed extra slash** before username: `mongodb+srv://` (not `mongodb+srv:///`)
2. **Added database name** `/poligap` after the host
3. **Added both environment variables** for compatibility

## Steps:
1. Open your `.env` file
2. Replace the MongoDB URI with the corrected version above
3. Save the file
4. Restart the development server: `npm run dev`
