/**
 * Travel Chat API Handlers
 * Hono.js endpoints for chat and itinerary generation
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { chat, initializeSession } from '../services/chat.js';
import { ChatResponse, ChatSession } from '../types/checklist.js';

// Define context variables type
type Variables = {
  startTime: number;
};

// Create app
const app = new Hono<{ Variables: Variables }>();

// Middleware
app.use(cors());
app.use(async (c, next) => {
  c.set('startTime', Date.now());
  await next();
});

/**
 * GET / - Health check
 */
app.get('/', (c) => {
  return c.json({
    status: 'ok',
    service: 'travel-chat-api',
    version: '1.0.0',
    endpoints: [
      'POST /api/chat - Send message to travel planning chatbot',
      'GET /api/session/:sessionId - Get session details',
      'POST /api/session/:sessionId/reset - Reset session'
    ]
  });
});

/**
 * POST /api/chat - Main chat endpoint
 * Accepts: sessionId, message
 * Returns: ChatResponse with updated checklist, history, and optional itinerary
 */
app.post('/api/chat', async (c) => {
  try {
    const body = await c.req.json();
    const { sessionId, message } = body;

    // Validation
    if (!sessionId || typeof sessionId !== 'string') {
      return c.json(
        { error: 'Missing or invalid sessionId' },
        { status: 400 }
      );
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return c.json(
        { error: 'Missing or invalid message' },
        { status: 400 }
      );
    }

    // Process chat
    const response: ChatResponse = await chat(sessionId, message.trim());

    // Add metadata
    const responseWithMeta = {
      ...response,
      processingTime: Date.now() - (c.get('startTime') as number),
      timestamp: new Date().toISOString()
    };

    return c.json(responseWithMeta, { status: 200 });
  } catch (error) {
    console.error('[API] Chat error:', error);
    return c.json(
      {
        error: 'Failed to process message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});

/**
 * GET /api/session/:sessionId - Retrieve session details
 * Returns: Current session with checklist and history
 */
app.get('/api/session/:sessionId', async (c) => {
  try {
    const sessionId = c.req.param('sessionId');

    if (!sessionId) {
      return c.json(
        { error: 'Missing sessionId' },
        { status: 400 }
      );
    }

    // Initialize or load session
    const session: ChatSession = await initializeSession(sessionId);

    return c.json({
      session,
      completeness: session.completeness,
      messageCount: session.history.length,
      createdAt: session.createdAt,
      lastUpdated: session.updatedAt
    });
  } catch (error) {
    console.error('[API] Session fetch error:', error);
    return c.json(
      {
        error: 'Failed to fetch session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});

/**
 * POST /api/session/:sessionId/reset - Reset session
 * Clears checklist and history, starts fresh
 */
app.post('/api/session/:sessionId/reset', async (c) => {
  try {
    const sessionId = c.req.param('sessionId');

    if (!sessionId) {
      return c.json(
        { error: 'Missing sessionId' },
        { status: 400 }
      );
    }

    // Create fresh session
    const session: ChatSession = await initializeSession(sessionId);
    session.checklist = {
      startDate: null,
      endDate: null,
      travelDays: null,
      totalBudget: null,
      destinations: [],
      activities: [],
      accommodation: null,
      transportation: null,
      documents: [],
      packing: [],
      contacts: [],
      notes: []
    } as any;
    session.history = [];
    session.updatedAt = new Date().toISOString();

    return c.json({
      success: true,
      message: 'Session reset successfully',
      session
    });
  } catch (error) {
    console.error('[API] Session reset error:', error);
    return c.json(
      {
        error: 'Failed to reset session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});

/**
 * POST /api/feedback - Submit feedback on itinerary
 */
app.post('/api/feedback', async (c) => {
  try {
    const body = await c.req.json();
    const { sessionId, tripId, rating, comments } = body;

    if (!sessionId || !tripId) {
      return c.json(
        { error: 'Missing sessionId or tripId' },
        { status: 400 }
      );
    }

    // TODO: Save feedback to database
    console.log(`[Feedback] Trip ${tripId}: ${rating}/5 - ${comments}`);

    return c.json({
      success: true,
      message: 'Feedback recorded',
      feedback: { sessionId, tripId, rating, comments, timestamp: new Date().toISOString() }
    });
  } catch (error) {
    console.error('[API] Feedback error:', error);
    return c.json(
      {
        error: 'Failed to save feedback',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});

/**
 * GET /api/health - Detailed health check
 */
app.get('/api/health', async (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      chat: 'ready',
      raindrop: 'checking...',
      database: 'checking...'
    }
  });
});

/**
 * Error handler middleware
 */
app.onError((err, c) => {
  console.error('[API] Unhandled error:', err);
  return c.json(
    {
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error'
    },
    { status: 500 }
  );
});

/**
 * 404 handler
 */
app.notFound((c) => {
  return c.json(
    {
      error: 'Not found',
      path: c.req.path,
      method: c.req.method
    },
    { status: 404 }
  );
});

export default app;
