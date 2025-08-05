export default async function handler(req, res) {

  try {
    // Check API key status
    const apiKey = process.env.OPENAI_API_KEY;
    const apiKeyStatus = apiKey ? 'configured' : 'missing';
    
    res.json({ 
      status: 'OK', 
      message: 'ZOXAA API is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      apiKey: apiKeyStatus,
      version: '1.0.0'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      error: 'Health check failed',
      details: error.message 
    });
  }
} 