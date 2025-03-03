# Groq API Proxy Server

A Node.js server that securely proxies requests to the Groq API without exposing your API key to the client.

## Features

- Secure handling of Groq API key via environment variables
- Proxy endpoints for chat completions and audio transcriptions
- CORS enabled for cross-origin requests
- Comprehensive error handling and detailed logging
- Health check endpoint for monitoring

## Local Development

1. Clone this repository
2. Install dependencies: `npm install`
3. Create a `.env` file with your Groq API key:
   ```
   GROQ_API_KEY=your_api_key_here
   PORT=3000
   ```
4. Run the development server: `npm run dev`

## Endpoints

- `GET /`: Status check - returns server status and version
- `GET /health`: Detailed health information including uptime and memory usage
- `POST /api/chat`: Chat completions endpoint (proxies to Groq)
- `POST /api/audio/transcriptions`: Audio transcription endpoint (proxies to Groq)

## Testing

A comprehensive test page is available at `/src/servertest.html`. This HTML file provides:
- Server status checks
- Health endpoint testing
- Chat API testing with different models
- Detailed error reporting and diagnostics
- Request/response inspection

Simply open this file in a browser or host it on any static file server to test your deployment.

## Deployment

This server is configured for easy deployment to Vercel:

1. Create a Vercel project linked to your GitHub repository
2. Add the `GROQ_API_KEY` environment variable in the Vercel project settings
3. Deploy the project

Current deployment: [https://aiwriterserver.vercel.app](https://aiwriterserver.vercel.app)

## Troubleshooting

If you encounter issues:
1. Check the server logs in Vercel dashboard
2. Use the `/health` endpoint to verify server status
3. Use the test page to diagnose specific API problems
4. Ensure CORS is properly configured if accessing from different domains