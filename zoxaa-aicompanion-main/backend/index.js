require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Import API routes
const chatRouter = require('./chat');
const ttsRouter = require('./tts');
const healthRouter = require('./health');

// API routes
app.use('/api/chat', chatRouter);
app.use('/api/tts', ttsRouter);
app.use('/api/health', healthRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'ZOXAA AI Backend API', version: '1.0.0' });
});

// API root endpoint
app.get('/api', (req, res) => {
  res.json({ 
    message: 'ZOXAA AI Backend API', 
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      chat: '/api/chat',
      tts: '/api/tts'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`ZOXAA Backend running on port ${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api/`);
});

module.exports = app; 