const express = require('express');
const { OpenAI } = require('openai');

const router = express.Router();

router.post('/', async (req, res) => {

  // Check if API key is available
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY environment variable is missing!');
    return res.status(500).json({ 
      error: 'OpenAI API key not configured',
      details: 'Please set OPENAI_API_KEY environment variable'
    });
  }

  // Debug: Log the API key (first 10 chars)
  console.log('🔑 API Key loaded:', apiKey ? 
    apiKey.substring(0, 10) + '...' : 'NOT FOUND');

  try {
    const openai = new OpenAI({
      apiKey: apiKey
    });

    const { text, voice = 'alloy', speed = 1.0 } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid request format',
        details: 'text parameter is required'
      });
    }

    console.log('🎤 Processing TTS request:', { text: text.substring(0, 50) + '...', voice, speed });

    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voice,
      input: text,
      speed: Math.min(speed, 2.0)
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    
    console.log('✅ TTS audio generated successfully, size:', buffer.length, 'bytes');
    
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length
    });
    
    res.send(buffer);
  } catch (error) {
    console.error('❌ TTS API error:', error);
    
    // Provide more specific error messages
    if (error.message.includes('401')) {
      return res.status(401).json({ 
        error: 'Invalid API key',
        details: 'Please check your OpenAI API key'
      });
    }
    
    if (error.message.includes('429')) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded',
        details: 'Please try again later'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to generate speech',
      details: error.message 
    });
  }
});

module.exports = router; 