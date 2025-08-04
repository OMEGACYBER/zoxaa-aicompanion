import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, systemPrompt } = req.body;

    const allMessages = systemPrompt 
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: allMessages,
      temperature: 0.8,
      max_tokens: 100,
      presence_penalty: 0.05,
      frequency_penalty: 0.05,
      timeout: 5000,
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
} 