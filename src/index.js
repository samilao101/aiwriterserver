require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');

const app = express();
const port = process.env.PORT || 3000;
const upload = multer();

// Middleware
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'OPTIONS'], // Allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'] // Allowed headers
}));
app.use(express.json({ limit: '10mb' })); // Increase JSON payload limit

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Validate environment variables
if (!process.env.GROQ_API_KEY) {
  console.error('GROQ_API_KEY environment variable is required');
  process.exit(1);
}

// Routes
app.get('/', (req, res) => {
  res.json({ 
    status: 'Server is running', 
    version: '1.0.1',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    env: {
      node: process.version,
      hasGroqKey: !!process.env.GROQ_API_KEY,
    }
  });
});

// Route for chat completions
app.post('/api/chat', async (req, res) => {
  try {
    console.log('Received chat request with body:', JSON.stringify(req.body));
    
    if (!req.body || !req.body.messages) {
      throw new Error('Invalid request: messages array is required');
    }

    if (!req.body.model) {
      console.warn('No model specified, defaulting to llama3-70b-8192');
      req.body.model = 'llama3-70b-8192';
    }

    console.log(`Making request to Groq API with model: ${req.body.model}`);
    
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      req.body,
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      }
    );
    
    console.log('Groq API response received successfully');
    res.json(response.data);
  } catch (error) {
    const errorDetails = {
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      requestBody: req.body
    };
    
    console.error('Error calling Groq API:', JSON.stringify(errorDetails));
    
    res.status(error.response?.status || 500).json({
      error: {
        message: 'An error occurred while processing your request',
        details: errorDetails
      }
    });
  }
});

// Route for audio transcriptions
app.post('/api/audio/transcriptions', upload.single('file'), async (req, res) => {
  try {
    console.log('Received transcription request');
    
    const formData = new FormData();
    
    // Add all fields from the request body to the form data
    Object.entries(req.body).forEach(([key, value]) => {
      console.log(`Adding form field: ${key}`);
      formData.append(key, value);
    });
    
    // Add the file from the request
    if (req.file) {
      console.log(`Adding file: ${req.file.originalname}, size: ${req.file.size} bytes, mimetype: ${req.file.mimetype}`);
      formData.append('file', req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype
      });
    } else {
      console.error('Transcription request missing file');
      return res.status(400).json({ error: { message: 'No file provided' } });
    }
    
    console.log('Making request to Groq API for transcription');
    
    const response = await axios.post(
      'https://api.groq.com/openai/v1/audio/transcriptions',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          ...formData.getHeaders()
        },
        timeout: 60000 // 60 second timeout for transcriptions
      }
    );
    
    console.log('Transcription response received successfully');
    res.json(response.data);
  } catch (error) {
    const errorDetails = {
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      requestHeaders: req.headers,
      requestFile: req.file ? {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : null
    };
    
    console.error('Error calling Groq API for transcription:', JSON.stringify(errorDetails));
    
    res.status(error.response?.status || 500).json({
      error: {
        message: 'An error occurred while processing your transcription request',
        details: errorDetails
      }
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});