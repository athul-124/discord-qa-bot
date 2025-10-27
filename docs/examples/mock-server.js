// Mock API Server for Testing
// Run with: node mock-server.js
// Requires: npm install express cors multer

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Mock authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: { message: 'No token provided' } });
  }
  
  // Mock token validation (in real app, verify with Firebase Admin SDK)
  if (token === 'invalid') {
    return res.status(401).json({ error: { message: 'Invalid token' } });
  }
  
  next();
};

// GET /usage
app.get('/usage', authenticateToken, (req, res) => {
  const { serverId } = req.query;
  
  if (!serverId) {
    return res.status(400).json({ 
      error: { message: 'serverId is required' } 
    });
  }
  
  // Simulate different responses based on serverId
  const usageData = {
    '123456789': {
      monthlyCount: 150,
      remainingQuota: 850,
      tier: 'free'
    },
    '987654321': {
      monthlyCount: 450,
      remainingQuota: 9550,
      tier: 'pro'
    }
  };
  
  const data = usageData[serverId] || {
    monthlyCount: 0,
    remainingQuota: 1000,
    tier: 'free'
  };
  
  res.json(data);
});

// POST /link-server
app.post('/link-server', authenticateToken, (req, res) => {
  const { whopToken, serverId } = req.body;
  
  if (!whopToken || !serverId) {
    return res.status(400).json({ 
      error: { message: 'whopToken and serverId are required' } 
    });
  }
  
  // Simulate different tiers based on token
  const tier = whopToken.includes('pro') ? 'pro' : 'free';
  
  setTimeout(() => {
    res.json({
      success: true,
      tier: tier,
      message: `Server linked successfully with ${tier} tier`
    });
  }, 1000); // Simulate API delay
});

// POST /upload-kb
app.post('/upload-kb', authenticateToken, upload.single('file'), (req, res) => {
  const { serverId } = req.body;
  const file = req.file;
  
  if (!file) {
    return res.status(400).json({ 
      error: { message: 'File is required' } 
    });
  }
  
  if (!serverId) {
    return res.status(400).json({ 
      error: { message: 'serverId is required' } 
    });
  }
  
  // Simulate file processing delay
  setTimeout(() => {
    res.json({
      success: true,
      message: 'File uploaded and processed successfully',
      fileId: `file_${Date.now()}`
    });
  }, 2000);
});

// GET /trends
app.get('/trends', authenticateToken, (req, res) => {
  const { serverId } = req.query;
  
  if (!serverId) {
    return res.status(400).json({ 
      error: { message: 'serverId is required' } 
    });
  }
  
  // Simulate Pro-only feature
  const proServers = ['987654321', '555555555'];
  
  if (!proServers.includes(serverId)) {
    return res.status(403).json({ 
      error: { message: 'Trends feature is only available for Pro tier subscribers' } 
    });
  }
  
  // Generate mock trends data
  const today = new Date();
  const dailyUsage = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dailyUsage.push({
      date: date.toISOString().split('T')[0],
      count: Math.floor(Math.random() * 50) + 20
    });
  }
  
  res.json({
    totalQuestions: 1250,
    averageResponseTime: 145,
    topTopics: [
      { topic: 'Account Issues', count: 45 },
      { topic: 'Technical Support', count: 38 },
      { topic: 'Billing Questions', count: 22 },
      { topic: 'Feature Requests', count: 18 },
      { topic: 'Bug Reports', count: 15 }
    ],
    dailyUsage
  });
});

// POST /auth/whop-exchange
app.post('/auth/whop-exchange', (req, res) => {
  const { whopToken } = req.body;
  
  if (!whopToken) {
    return res.status(400).json({ 
      error: { message: 'whopToken is required' } 
    });
  }
  
  // Simulate Whop token validation
  if (whopToken === 'invalid') {
    return res.status(401).json({ 
      error: { message: 'Invalid Whop token' } 
    });
  }
  
  // Return mock Firebase custom token
  res.json({
    firebaseToken: `mock_firebase_token_${Date.now()}`
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: { message: 'Internal server error' } 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: { message: 'Not found' } 
  });
});

app.listen(PORT, () => {
  console.log(`Mock API server running on http://localhost:${PORT}`);
  console.log('\nAvailable endpoints:');
  console.log('  GET  /health');
  console.log('  GET  /usage?serverId=123456789');
  console.log('  POST /link-server');
  console.log('  POST /upload-kb');
  console.log('  GET  /trends?serverId=987654321');
  console.log('  POST /auth/whop-exchange');
  console.log('\nUse Authorization header: Bearer <token>');
  console.log('\nExample server IDs:');
  console.log('  123456789 - Free tier');
  console.log('  987654321 - Pro tier (for trends)');
});
