/**
 * Chat Service - AI-Powered Version
 * Natural conversation flow with Gemini integration
 */

import {
  ChatSession,
  ChatResponse,
  TripChecklist,
  ConversationMessage,
  createEmptyChecklist,
  calculateCompleteness
} from './../types/checklist.js';
import { parseMessage } from '../nlp-parser.js';
import {
  saveSessionToSmartMemory,
  loadSessionFromSmartMemory,
  cacheSession,
  getSessionFromCache,
  isRaindropReady
} from '../raindrop-integration.js';
import {
  getAIResponse,
  generateSmartSuggestions,
  predictNextFields,
  refineChecklistWithAI
} from '../ai-service.js';

/**
 * In-memory session store for quick access
 */
const sessionStore = new Map<string, ChatSession>();

/**
 * Initialize chat session or load existing one
 */
export async function initializeSession(sessionId: string): Promise<ChatSession> {
  // Try KV cache first (fastest)
  let session = await getSessionFromCache(sessionId);
  if (session) return session;

  // Try memory (second fastest)
  session = sessionStore.get(sessionId) ?? null;
  if (session) return session;

  // Try SmartMemory (persistent)
  if (isRaindropReady()) {
    session = await loadSessionFromSmartMemory(sessionId);
    if (session) {
      sessionStore.set(sessionId, session);
      return session;
    }
  }

  // Create new session
  const newSession: ChatSession = {
    sessionId,
    checklist: createEmptyChecklist(),
    history: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completeness: 0
  };

  sessionStore.set(sessionId, newSession);
  return newSession;
}

/**
 * Main chat handler - AI-powered natural conversation
 */
export async function chat(sessionId: string, userMessage: string): Promise<ChatResponse> {
  const startTime = Date.now();

  // Load or initialize session
  let session = await initializeSession(sessionId);

  // Get AI response with context understanding
  const aiResponse = await getAIResponse(userMessage, {
    recentMessages: session.history.slice(-6),
    currentChecklist: session.checklist,
    completenessPercentage: calculateCompleteness(session.checklist),
    missingFields: predictNextFields(session.history, session.checklist)
  });

  // Extract fields using both NLP and AI
  const nlpExtracted = parseMessage(userMessage);
  const aiExtracted = aiResponse.extractedFields;

  // Merge extractions
  const merged: Partial<TripChecklist> = { ...nlpExtracted };
  if (aiResponse.confidence > 0.7) {
    for (const [key, value] of Object.entries(aiExtracted)) {
      if (value !== null && value !== undefined) {
        (merged as any)[key] = value;
      }
    }
  }

  // Update checklist
  for (const [key, value] of Object.entries(merged)) {
    if (value !== null && value !== undefined) {
      (session.checklist as any)[key] = value;
    }
  }

  // Refine with AI understanding
  if (aiResponse.confidence > 0.8) {
    session.checklist = refineChecklistWithAI(session.checklist, merged);
  }

  // Calculate completeness
  const completeness = calculateCompleteness(session.checklist);

  // Add user message to history
  const userMsg: ConversationMessage = {
    role: 'user',
    content: userMessage,
    timestamp: new Date().toISOString(),
    extractedFields: merged
  };
  session.history.push(userMsg);

  // Prepare assistant response
  let assistantContent = aiResponse.message;
  const suggestions = generateSmartSuggestions(session.checklist);

  // Determine if we should generate itinerary
  let itinerary: any;
  if (completeness >= 70 && aiResponse.nextAction === 'generate_itinerary') {
    itinerary = await generateItinerary(sessionId, session.checklist);
    assistantContent = `🎉 Perfect! I have enough info to create your itinerary!\n\n${assistantContent}`;
  }

  // Add assistant response to history
  const assistantMsg: ConversationMessage = {
    role: 'assistant',
    content: assistantContent,
    timestamp: new Date().toISOString()
  };
  session.history.push(assistantMsg);

  // Update session
  session.updatedAt = new Date().toISOString();
  session.completeness = completeness;

  // Save session async
  persistSession(session).catch(err => console.error('Failed to persist session:', err));

  const processingTime = Date.now() - startTime;

  return {
    sessionId,
    completeness,
    status: completeness >= 70 ? 'complete' : 'incomplete',
    checklist: session.checklist,
    history: session.history,
    suggestions,
    nextQuestion: aiResponse.message.split('\n')[0],
    itinerary,
    processingTime,
    timestamp: new Date().toISOString(),
    aiReasoning: aiResponse.reasoning,
    confidence: aiResponse.confidence
  };
}

/**
 * Generate itinerary based on collected checklist
 */
async function generateItinerary(sessionId: string, checklist: TripChecklist) {
  try {
    const days = checklist.travelDays || 3;
    const startDate = checklist.startDate ? new Date(checklist.startDate) : new Date();
    
    const itineraryDays = Array.from({ length: days }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      return {
        day: i + 1,
        date: date.toISOString().split('T')[0],
        theme: `Day ${i + 1}: ${getThemeForDay(i, days, checklist)}`,
        blocks: generateDayBlocks(i, checklist),
        estimatedBudget: Math.round((checklist.totalBudget || 0) / days),
        tips: []
      };
    });

    return {
      title: `${checklist.travelDays}-Day ${checklist.startingCity || 'Trip'} Itinerary`,
      description: `Personalized trip based on your preferences`,
      startDate: checklist.startDate,
      endDate: checklist.endDate,
      days: itineraryDays,
      totalBudget: checklist.totalBudget,
      budgetBreakdown: {
        accommodation: Math.round((checklist.totalBudget || 0) * 0.4),
        food: Math.round((checklist.totalBudget || 0) * 0.3),
        activities: Math.round((checklist.totalBudget || 0) * 0.2),
        transport: Math.round((checklist.totalBudget || 0) * 0.1)
      }
    };
  } catch (error) {
    console.error('Itinerary generation error:', error);
    return undefined;
  }
}

/**
 * Generate activities for each day
 */
function generateDayBlocks(dayIndex: number, checklist: TripChecklist) {
  const blocks = [];
  const theme = checklist.tripTheme || 'mixed';

  if (dayIndex === 0) {
    blocks.push({
      time: '09:00 AM',
      activity: 'Arrive & Check-in',
      location: checklist.startingCity || 'Destination',
      cost: 0,
      duration: '1 hour'
    });
  }

  if (theme === 'adventure' || theme === 'relaxed') {
    blocks.push({
      time: '11:00 AM',
      activity: 'Explore local attractions',
      location: 'Main area',
      cost: 500,
      duration: '3 hours'
    });
  }

  if (theme === 'foodie') {
    blocks.push({
      time: '12:00 PM',
      activity: 'Local food tour',
      location: 'Food markets',
      cost: 800,
      duration: '2 hours'
    });
  }

  blocks.push(
    {
      time: '01:00 PM',
      activity: 'Lunch',
      location: 'Local restaurant',
      cost: 400,
      duration: '1 hour'
    },
    {
      time: '03:00 PM',
      activity: 'Afternoon activity',
      location: 'Varies',
      cost: 600,
      duration: '2 hours'
    },
    {
      time: '06:00 PM',
      activity: 'Sunset & evening',
      location: 'Scenic spot',
      cost: 300,
      duration: '2 hours'
    },
    {
      time: '08:00 PM',
      activity: 'Dinner',
      location: 'Local restaurant',
      cost: 500,
      duration: '1.5 hours'
    }
  );

  return blocks;
}

/**
 * Determine daily theme
 */
function getThemeForDay(dayIndex: number, totalDays: number, checklist: TripChecklist): string {
  const theme = checklist.tripTheme || 'Mixed';
  
  if (dayIndex === 0) return 'Arrival & Settling In';
  if (dayIndex === totalDays - 1) return 'Departure';
  
  return theme.charAt(0).toUpperCase() + theme.slice(1) + ' Activities';
}

/**
 * Save session to all storage layers
 */
async function persistSession(session: ChatSession) {
  const promises = [];

  promises.push(cacheSession(session.sessionId, session).catch(e => console.warn('Cache error:', e)));
  sessionStore.set(session.sessionId, session);

  if (isRaindropReady()) {
    promises.push(
      saveSessionToSmartMemory(session.sessionId, session).catch(e => console.warn('SmartMemory error:', e))
    );
  }

  await Promise.allSettled(promises);
}

/**
 * Reset session
 */
export async function resetSession(sessionId: string): Promise<void> {
  sessionStore.delete(sessionId);
}

export type { ChatSession, ChatResponse };
