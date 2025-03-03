# Groq API Proxy Server

A Node.js server that securely proxies requests to the Groq API without exposing your API key to the client.

## Features

- Secure handling of Groq API key via environment variables
- Proxy endpoints for chat completions and audio transcriptions
- CORS enabled for cross-origin requests
- Error handling and logging

## Local Development

1. Clone this repository
2. Install dependencies: `npm install`
3. Create a `.env` file based on `.env.example` and add your Groq API key
4. Run the development server: `npm run dev`

## Deployment

This server is configured for easy deployment to Vercel. See deployment instructions in the main project documentation.