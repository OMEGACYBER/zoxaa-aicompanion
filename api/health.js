export default async function handler(req, res) {
  res.json({ 
    status: 'OK', 
    message: 'ZOXAA Voice Chat Server Running',
    timestamp: new Date().toISOString()
  });
} 