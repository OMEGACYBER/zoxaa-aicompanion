import { OpenAI } from 'openai';

export default async function handler(req, res) {
  // Enable CORS for all browsers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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

    // Validate text length for mobile compatibility
    if (text.length > 4000) {
      return res.status(400).json({
        error: 'Text too long',
        details: 'Text must be less than 4000 characters for mobile compatibility'
      });
    }

    console.log('🎤 Processing TTS request:', { 
      text: text.substring(0, 50) + '...', 
      voice, 
      speed,
      userAgent: req.headers['user-agent']?.substring(0, 100) || 'Unknown'
    });

    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voice,
      input: text,
      speed: Math.min(Math.max(speed, 0.25), 4.0) // Clamp speed between 0.25 and 4.0
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    
    console.log('✅ TTS audio generated successfully, size:', buffer.length, 'bytes');
    
    // Convert to base64 for reliable serverless function response
    const base64Audio = buffer.toString('base64');
    
    // Add additional headers for mobile compatibility
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.setHeader('Content-Type', 'application/json');
    
    res.json({
      audio: base64Audio,
      format: 'mp3',
      size: buffer.length,
      duration: Math.ceil(buffer.length / 16000), // Rough estimate of duration
      voice: voice,
      speed: speed
    });
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

    if (error.message.includes('400')) {
      return res.status(400).json({
        error: 'Invalid request',
        details: 'Please check your text input and try again'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to generate speech',
      details: error.message 
    });
  }
} 