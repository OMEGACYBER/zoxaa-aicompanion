const { OpenAI } = require('openai');

export default async function handler(req, res) {

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

    const { messages, systemPrompt } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ 
        error: 'Invalid request format',
        details: 'messages array is required'
      });
    }

    const allMessages = systemPrompt 
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages;

    console.log('📝 Processing chat request with', allMessages.length, 'messages');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: allMessages,
      temperature: 0.8,
      max_tokens: 100,
      presence_penalty: 0.05,
      frequency_penalty: 0.05,
    });

    const response = completion.choices[0].message.content;

    console.log('✅ Chat response generated successfully');

    res.json({
      response,
      tokens: completion.usage.total_tokens,
      model: completion.model
    });
  } catch (error) {
    console.error('❌ Chat API error:', error);
    
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
      error: 'Failed to generate response',
      details: error.message 
    });
  }
} 