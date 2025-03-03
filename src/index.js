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
app.use(cors());
app.use(express.json());

// Validate environment variables
if (!process.env.GROQ_API_KEY) {
  console.error('GROQ_API_KEY environment variable is required');
  process.exit(1);
}

// Routes
app.get('/', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Route for chat completions
app.post('/api/chat', async (req, res) => {
  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      req.body,
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error calling Groq API:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || { message: 'An error occurred while processing your request' }
    });
  }
});

// Route for audio transcriptions
app.post('/api/audio/transcriptions', upload.single('file'), async (req, res) => {
  try {
    const formData = new FormData();
    
    // Add all fields from the request body to the form data
    Object.entries(req.body).forEach(([key, value]) => {
      formData.append(key, value);
    });
    
    // Add the file from the request
    if (req.file) {
      formData.append('file', req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype
      });
    } else {
      return res.status(400).json({ error: { message: 'No file provided' } });
    }
    
    const response = await axios.post(
      'https://api.groq.com/openai/v1/audio/transcriptions',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          ...formData.getHeaders()
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error calling Groq API for transcription:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || { message: 'An error occurred while processing your transcription request' }
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});