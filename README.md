# Image Transformation Service

Full-stack app for uploading an image, removing the background, flipping it horizontally, and returning a hosted URL.

## Live URLs

- Frontend: https://image-transformation-service-rouge.vercel.app/
- Backend: https://image-transformation-service-a41g.onrender.com

## Repository Structure

```
root/
  frontend/
  backend/
  README.md
```

## Tech Stack

- Frontend: Next.js (App Router), TypeScript, Tailwind CSS
- Backend: Node.js, Express, TypeScript
- Image processing: Sharp
- Background removal: remove.bg API
- Hosting: Cloudinary

## Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env` from `backend/.env.example` and fill in values:

```
PORT=4000
REMOVE_BG_API_KEY=your_remove_bg_api_key
REMOVE_BG_API_URL=https://api.remove.bg/v1.0/removebg
REMOVE_BG_TIMEOUT_MS=30000
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLOUDINARY_FOLDER=processed-images
MAX_FILE_SIZE=5242880
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
LOG_LEVEL=info
```

Run locally:

```bash
npm run dev
```

## Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env` from `frontend/.env.example` and set the backend URL:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

Run locally:

```bash
npm run dev
```

## API Documentation

### Upload and Process Image

`POST /api/images/upload`

- Content-Type: `multipart/form-data`
- Field name: `image`

Response:

```json
{
  "imageId": "cloudinary_public_id",
  "imageUrl": "https://res.cloudinary.com/..."
}
```

### Delete Image

`DELETE /api/images/:imageId`

Response:

```json
{
  "success": true
}
```

### Error Response Format

```json
{
  "error": true,
  "message": "Description"
}
```


## Notes

- Supported file types: PNG, JPG, WEBP
- Max file size: 5MB (configurable via `MAX_FILE_SIZE`)
- Upload is in-memory and never persisted locally

