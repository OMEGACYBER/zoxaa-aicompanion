# ZOXAA Backend API

This is the backend API for the ZOXAA AI cognitive partner application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env` file in the backend directory with:
```
OPENAI_API_KEY=your_openai_api_key_here
PORT=3001
```

3. Start the development server:
```bash
npm run dev
```

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/debug` - Debug information
- `GET /api/test` - Test endpoint
- `POST /api/chat` - Chat with AI
- `POST /api/tts` - Text-to-speech conversion

## Production

For production deployment, the backend is configured to work with Vercel serverless functions.

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests (placeholder) 