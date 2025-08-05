const express = require('express');

const router = express.Router();

router.get('/', async (req, res) => {

  try {
    // Check all environment variables
    const envVars = {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'set' : 'missing',
      NODE_ENV: process.env.NODE_ENV || 'development',
      VERCEL_ENV: process.env.VERCEL_ENV || 'not-vercel',
      VERCEL_URL: process.env.VERCEL_URL || 'not-vercel'
    };

    // Test OpenAI API key format (without revealing the key)
    const apiKey = process.env.OPENAI_API_KEY;
    const apiKeyInfo = {
      exists: !!apiKey,
      length: apiKey ? apiKey.length : 0,
      startsWith: apiKey ? apiKey.substring(0, 3) : 'N/A',
      format: apiKey && apiKey.startsWith('sk-') ? 'valid' : 'invalid'
    };

    // Test OpenAI API call
    let openaiTest = 'not tested';
    if (apiKey && apiKey.startsWith('sk-')) {
      try {
        const { OpenAI } = await import('openai');
        const openai = new OpenAI({ apiKey });
        
        // Test with a simple request
        const response = await openai.models.list();
        openaiTest = 'success';
      } catch (error) {
        openaiTest = `failed: ${error.message}`;
      }
    }

    res.json({ 
      status: 'OK', 
      message: 'ZOXAA Debug API',
      timestamp: new Date().toISOString(),
      environment: envVars,
      apiKey: apiKeyInfo,
      openaiTest,
      headers: {
        'user-agent': req.headers['user-agent'],
        'origin': req.headers['origin']
      }
    });
  } catch (error) {
    console.error('Debug API error:', error);
    res.status(500).json({ 
      error: 'Debug API failed',
      details: error.message 
    });
  }
});

module.exports = router; 