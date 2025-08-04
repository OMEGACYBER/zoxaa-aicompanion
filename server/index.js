const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const path = require('path');

// Load .env file from parent directory
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Check if API key is provided
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY environment variable is required!');
  console.error('Please set your OpenAI API key in your environment variables.');
  process.exit(1);
}

// Debug: Log the API key (first 10 chars)
console.log('🔑 API Key loaded:', process.env.OPENAI_API_KEY ? 
  process.env.OPENAI_API_KEY.substring(0, 10) + '...' : 'NOT FOUND');

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'ZOXAA Voice Chat Server Running' });
});

// Chat completion endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, systemPrompt } = req.body;

    const allMessages = systemPrompt 
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages;

      const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: allMessages,
    temperature: 0.8, // Slightly higher for faster responses
    max_tokens: 100, // Much shorter responses for faster generation
    presence_penalty: 0.05, // Minimal repetition penalty
    frequency_penalty: 0.05, // Minimal frequency penalty
    timeout: 5000, // 5 second timeout for faster response
  });

    const response = completion.choices[0].message.content;

    res.json({
      response,
      tokens: completion.usage.total_tokens,
      model: completion.model
    });
  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ 
      error: 'Failed to generate response',
      details: error.message 
    });
  }
});

// Text-to-speech endpoint
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice = 'alloy', speed = 1.0 } = req.body;

    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voice,
      input: text,
      speed: Math.min(speed * 2.0, 2.5) // Even faster speech for quicker responses
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length
    });
    
    res.send(buffer);
  } catch (error) {
    console.error('TTS API error:', error);
    res.status(500).json({ 
      error: 'Failed to generate speech',
      details: error.message 
    });
  }
});

// Speech-to-text endpoint
app.post('/api/stt', async (req, res) => {
  try {
    // This would handle audio file uploads
    // For now, we'll use the browser's Web Speech API
    res.json({ 
      error: 'Use browser Web Speech API for STT',
      message: 'STT is handled client-side for real-time processing'
    });
  } catch (error) {
    console.error('STT API error:', error);
    res.status(500).json({ 
      error: 'Failed to transcribe audio',
      details: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ZOXAA Voice Chat Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🎤 Voice chat ready!`);
});

module.exports = app; 