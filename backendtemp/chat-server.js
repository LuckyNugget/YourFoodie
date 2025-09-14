// chat-server.js - Express server to handle chat with Claude
const express = require('express');
const cors = require('cors');
const PopUpClaudeAgent = require('./popup-claude-agent');

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Store active chat sessions
const activeSessions = new Map();

// Initialize chat session
app.post('/api/chat/start', async (req, res) => {
  try {
    const { userId } = req.body;
    const sessionId = userId || `session_${Date.now()}`;
    
    // Create new agent instance for this session
    const agent = new PopUpClaudeAgent();
    activeSessions.set(sessionId, agent);
    
    // Start conversation
    const response = await agent.startConversation(sessionId);
    
    res.json({
      success: true,
      sessionId,
      message: response.message,
      needsResponse: response.needsResponse,
      step: response.step,
      options: response.options || null
    });
  } catch (error) {
    console.error('Error starting chat:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start chat session'
    });
  }
});

// Send message to Claude
app.post('/api/chat/message', async (req, res) => {
  try {
    const { sessionId, message } = req.body;
    
    if (!sessionId || !message) {
      return res.status(400).json({
        success: false,
        error: 'Session ID and message are required'
      });
    }
    
    // Get agent for this session
    const agent = activeSessions.get(sessionId);
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Session not found. Please start a new conversation.'
      });
    }
    
    // Process the user's message
    const response = await agent.processResponse(message);
    
    res.json({
      success: true,
      message: response.message,
      needsResponse: response.needsResponse,
      step: response.step,
      options: response.options || null,
      restaurants: response.restaurants || null,
      events: response.events || null
    });
  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process message'
    });
  }
});

// Get restaurants (for map integration)
app.get('/api/restaurants', async (req, res) => {
  try {
    const agent = new PopUpClaudeAgent();
    const restaurants = await agent.db.getAllRestaurants();
    agent.close();
    
    res.json({
      success: true,
      restaurants
    });
  } catch (error) {
    console.error('Error getting restaurants:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get restaurants'
    });
  }
});

// Get events/deals
app.get('/api/events', async (req, res) => {
  try {
    const agent = new PopUpClaudeAgent();
    const events = await agent.db.getActiveEvents();
    agent.close();
    
    res.json({
      success: true,
      events
    });
  } catch (error) {
    console.error('Error getting events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get events'
    });
  }
});

// End chat session
app.post('/api/chat/end', (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (activeSessions.has(sessionId)) {
      const agent = activeSessions.get(sessionId);
      agent.close();
      activeSessions.delete(sessionId);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end session'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Restaurant Chat API running on http://0.0.0.0:${port}`);
    console.log(`📱 Ready to serve your React Native app!`);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down server...');
  // Close all active sessions
  activeSessions.forEach((agent, sessionId) => {
    agent.close();
  });
  activeSessions.clear();
  process.exit(0);
});