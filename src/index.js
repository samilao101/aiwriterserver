require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
const path = require('path');

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

// Serve the test HTML directly
app.get('/inline-test', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Inline Groq API Test</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .section { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        button { padding: 8px 12px; background-color: #4CAF50; color: white; border: none; cursor: pointer; margin-right: 10px; }
        pre { background-color: #f5f5f5; padding: 10px; border-radius: 4px; }
        .success { color: green; }
        .error { color: red; }
        .toggle { display: flex; align-items: center; margin-bottom: 15px; }
        .toggle-label { margin: 0 10px; font-weight: bold; }
      </style>
    </head>
    <body>
      <h1>Groq API Server Test (Inline Version)</h1>
      
      <div class="toggle">
        <span class="toggle-label">Local</span>
        <input type="checkbox" id="server-toggle">
        <span class="toggle-label">Vercel</span>
        <div id="current-endpoint" style="margin-left: 10px;">Currently testing: Local</div>
      </div>
      
      <div class="section">
        <h2>Server Status</h2>
        <button onclick="checkServerStatus()">Check Server Status</button>
        <button onclick="checkHealth()">Check Health Endpoint</button>
        <pre id="status-result">Click a button to test...</pre>
      </div>
      
      <div class="section">
        <h2>Chat API Test</h2>
        <div>
          <label for="model-select">Model:</label>
          <select id="model-select">
            <option value="llama3-70b-8192">llama3-70b-8192</option>
            <option value="llama3-8b-8192">llama3-8b-8192</option>
            <option value="gemma-7b-it">gemma-7b-it</option>
          </select>
          <label for="prompt">Prompt:</label>
          <input type="text" id="prompt" value="Hello, how are you?" style="width: 250px;">
        </div>
        <button onclick="testChatAPI()">Test Chat API</button>
        <pre id="chat-result"></pre>
      </div>
      
      <script>
        // API endpoints
        const LOCAL_API = window.location.origin;
        const VERCEL_API = 'https://aiwriterserver.vercel.app';
        let API_BASE_URL = LOCAL_API;
        
        // Toggle between local and Vercel
        document.getElementById('server-toggle').addEventListener('change', function() {
          if (this.checked) {
            API_BASE_URL = VERCEL_API;
            document.getElementById('current-endpoint').textContent = 'Currently testing: Vercel';
          } else {
            API_BASE_URL = LOCAL_API;
            document.getElementById('current-endpoint').textContent = 'Currently testing: Local';
          }
          // Auto-run status check
          checkServerStatus();
        });
        
        // Check server status
        async function checkServerStatus() {
          const result = document.getElementById('status-result');
          result.textContent = 'Checking server status...';
          
          try {
            const response = await fetch(API_BASE_URL + '/');
            if (response.ok) {
              const data = await response.json();
              result.innerHTML = '<span class="success">✓ Server is running</span>\\n' + JSON.stringify(data, null, 2);
            } else {
              result.innerHTML = '<span class="error">✗ Server error: ' + response.status + '</span>';
            }
          } catch (error) {
            result.innerHTML = '<span class="error">✗ Connection error: ' + error.message + '</span>';
          }
        }
        
        // Check health endpoint
        async function checkHealth() {
          const result = document.getElementById('status-result');
          result.textContent = 'Checking health endpoint...';
          
          try {
            const response = await fetch(API_BASE_URL + '/health');
            if (response.ok) {
              const data = await response.json();
              result.innerHTML = '<span class="success">✓ Health check passed</span>\\n' + JSON.stringify(data, null, 2);
            } else {
              result.innerHTML = '<span class="error">✗ Health check failed: ' + response.status + '</span>';
            }
          } catch (error) {
            result.innerHTML = '<span class="error">✗ Connection error: ' + error.message + '</span>';
          }
        }
        
        // Test chat API
        async function testChatAPI() {
          const result = document.getElementById('chat-result');
          result.textContent = 'Sending request...';
          
          const model = document.getElementById('model-select').value;
          const prompt = document.getElementById('prompt').value;
          
          try {
            const response = await fetch(API_BASE_URL + '/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: prompt }]
              })
            });
            
            if (response.ok) {
              const data = await response.json();
              result.innerHTML = '<span class="success">✓ Request successful</span>\\n' + JSON.stringify(data, null, 2);
            } else {
              let errorText = '<span class="error">✗ Request failed: ' + response.status + '</span>';
              try {
                const errorData = await response.json();
                errorText += '\\n' + JSON.stringify(errorData, null, 2);
              } catch (e) {
                errorText += '\\nCould not parse error response';
              }
              result.innerHTML = errorText;
            }
          } catch (error) {
            result.innerHTML = '<span class="error">✗ Connection error: ' + error.message + '</span>';
          }
        }
        
        // Initial status check
        checkServerStatus();
      </script>
    </body>
    </html>
  `);
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

// Test page route
app.get('/test', (req, res) => {
  try {
    console.log('Test page requested. __dirname:', __dirname);
    const testPagePath = path.join(__dirname, 'servertest.html');
    console.log('Looking for test page at:', testPagePath);
    
    res.sendFile(testPagePath, (err) => {
      if (err) {
        console.error('Error sending test page:', err);
        // Fallback to inline HTML if file can't be found
        res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Groq API Server Test</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
              pre { background-color: #f5f5f5; padding: 10px; }
              button { padding: 8px 12px; background-color: #4CAF50; color: white; border: none; cursor: pointer; }
            </style>
          </head>
          <body>
            <h1>Groq API Server Test</h1>
            <p>Server is running. This is the fallback test page.</p>
            <button onclick="testAPI()">Test Root Endpoint</button>
            <pre id="result">Results will appear here</pre>
            
            <script>
              async function testAPI() {
                const result = document.getElementById('result');
                try {
                  const response = await fetch('/');
                  const data = await response.json();
                  result.textContent = JSON.stringify(data, null, 2);
                } catch (error) {
                  result.textContent = 'Error: ' + error.message;
                }
              }
            </script>
          </body>
          </html>
        `);
      }
    });
  } catch (error) {
    console.error('Unexpected error in test route:', error);
    res.status(500).send('Error loading test page: ' + error.message);
  }
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