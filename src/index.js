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
            const response = await fetch(API_BASE_URL + '/api/status');
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
// Server status endpoint moved to /api/status
app.get('/api/status', (req, res) => {
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
                  const response = await fetch('/api/status');
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

// Root route with AIBookScribe support page
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AIBookScribe: Smart Writing Assistant</title>
      <style>
          body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open 
  Sans', 'Helvetica Neue', sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
          }
          h1, h2 {
              color: #2c3e50;
          }
          .contact-section {
              background-color: #f8f9fa;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 20px;
          }
          .faq-item {
              margin-bottom: 20px;
          }
      </style>
  </head>
  <body>
      <h1>AIBookScribe: Smart Writing Assistant</h1>

      <div class="contact-section">
          <h2>Contact Us</h2>
          <p>If you need assistance with AIBookScribe, please fill out the form below:</p>
          <form id="contact-form" style="margin-top: 15px;">
              <div style="margin-bottom: 15px;">
                  <label for="contact-name" style="display: block; margin-bottom: 5px;">Name:</label>
                  <input type="text" id="contact-name" name="name" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
              </div>
              <div style="margin-bottom: 15px;">
                  <label for="contact-email" style="display: block; margin-bottom: 5px;">Email:</label>
                  <input type="email" id="contact-email" name="email" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
              </div>
              <div style="margin-bottom: 15px;">
                  <label for="contact-subject" style="display: block; margin-bottom: 5px;">Subject:</label>
                  <input type="text" id="contact-subject" name="subject" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
              </div>
              <div style="margin-bottom: 15px;">
                  <label for="contact-message" style="display: block; margin-bottom: 5px;">Message:</label>
                  <textarea id="contact-message" name="message" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; min-height: 120px;"></textarea>
              </div>
              <button type="submit" style="padding: 10px 15px; background-color: #2c3e50; color: white; border: none; border-radius: 4px; cursor: pointer;">Submit</button>
          </form>
          <div id="form-response" style="margin-top: 15px; display: none;"></div>
          <script>
              document.getElementById('contact-form').addEventListener('submit', function(e) {
                  e.preventDefault();
                  
                  const responseDiv = document.getElementById('form-response');
                  responseDiv.style.display = 'block';
                  responseDiv.innerHTML = '<p style="color: green;">Thank you for your message! We will respond to <strong>' + 
                      document.getElementById('contact-email').value + 
                      '</strong> within 24-48 hours.</p>';
                  
                  // You would normally send this data to a server endpoint
                  // For now, we'll just simulate a successful submission
                  console.log({
                      name: document.getElementById('contact-name').value,
                      email: document.getElementById('contact-email').value,
                      subject: document.getElementById('contact-subject').value,
                      message: document.getElementById('contact-message').value,
                      to: 'humberto@paiperapps.com'
                  });
                  
                  // Reset the form
                  this.reset();
              });
          </script>
          <p style="margin-top: 15px; font-size: 0.9em; color: #666;">Alternatively, you can email us directly at <a href="mailto:humberto@paiperapps.com">humberto@paiperapps.com</a>. We aim to respond to all inquiries within 24-48 hours.</p>
      </div>

      <h2>Frequently Asked Questions</h2>

      <div class="faq-item">
          <h3>How do I create a new document?</h3>
          <p>Tap the "+" button in the document library or select "New Document" from the menu to create a new
  document.</p>
      </div>

      <div class="faq-item">
          <h3>Can I use voice commands to write?</h3>
          <p>Yes! Tap the microphone icon to activate voice-to-text functionality. You can dictate your content and
  AIBookScribe will transcribe it for you.</p>
      </div>

      <div class="faq-item">
          <h3>How do I change paragraph styles?</h3>
          <p>Select a paragraph and use the style selector to choose between title, section title, and body paragraph
  formats.</p>
      </div>

      <div class="faq-item">
          <h3>Can I export my documents?</h3>
          <p>Yes, you can export your documents by tapping the share icon and selecting your preferred format.</p>
      </div>

      <h2>Troubleshooting</h2>

      <div class="faq-item">
          <h3>The app is running slowly</h3>
          <p>Try closing other applications running in the background. If issues persist, restart your device.</p>
      </div>

      <div class="faq-item">
          <h3>Content generation is not working</h3>
          <p>
              1. Check your internet connection<br>
              2. Ensure your prompt is clear and specific<br>
              3. Restart the app and try again
          </p>
      </div>

      <div class="faq-item">
          <h3>Documents are not saving</h3>
          <p>
              1. Check that you have sufficient storage space on your device<br>
              2. Ensure you're connected to the internet if cloud sync is enabled<br>
              3. Try saving with a different document name
          </p>
      </div>

      <p>If your issue isn't addressed here, please contact us directly using the email address above.</p>

      <footer>
          <p>&copy; 2025 AIBookScribe by Paiper Apps. All rights reserved. | <a href="/privacy">Privacy Policy</a> | <a href="/terms">Terms of Service</a></p>
      </footer>
  </body>
  </html>`);
});

// Privacy Policy Route
app.get('/privacy', (req, res) => {
  // Redirect to the TermsFeed hosted privacy policy
  res.redirect('https://www.termsfeed.com/live/9f3834ec-bdaf-4ccf-8fa6-e96fbd6ad19f');
});

// Terms of Service Route
app.get('/terms', (req, res) => {
  // Redirect to Apple's Standard EULA
  res.redirect('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/');
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});