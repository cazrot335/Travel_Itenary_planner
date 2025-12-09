/**
 * Raindrop MCP Integration
 * Handles SmartBuckets, SmartMemory, SmartSQL, and KV operations
 */

import { ChatSession, TripRecord, POI, POIDocument } from './types/checklist.js';

// Types for Raindrop bindings (injected at runtime)
interface RaindropContext {
  smartbucket_pois: any;
  smartmemory_session: any;
  smartmemory_trip: any;
  smartsql_smart_trips: any;
  kv_session_cache: any;
}

// This will be injected by Raindrop framework
let raindropContext: RaindropContext | null = null;

/**
 * Initialize Raindrop integrations
 * Called at application startup
 */
export async function initializeRaindrop(context?: RaindropContext): Promise<boolean> {
  try {
    if (context) {
      raindropContext = context;
      console.log('[✓] Raindrop MCP initialized with SmartBuckets/Memory/SQL');
      return true;
    }
    console.log('[⚠] Raindrop context not available - using mock mode');
    return false;
  } catch (error) {
    console.error('[✗] Raindrop initialization failed:', error);
    return false;
  }
}

/**
 * Search and retrieve POIs from SmartBucket based on theme/city/budget
 * Uses AI-powered semantic search
 */
export async function getPOIsFromSmartBuckets(
  city: string,
  theme: string,
  budget: number,
  count: number = 10
): Promise<POI[]> {
  if (!raindropContext?.smartbucket_pois) {
    return getMockPOIs(city, theme);
  }

  try {
    const query = `${theme} activities in ${city} within budget ${budget}`;
    const results = await raindropContext.smartbucket_pois.search(query, {
      limit: count,
      filters: {
        city: city.toLowerCase(),
        maxCost: budget
      }
    });

    return results.map((doc: POIDocument) => doc.content.poi);
  } catch (error) {
    console.error('[Raindrop] POI search failed:', error);
    return getMockPOIs(city, theme);
  }
}

/**
 * Save session to SmartMemory with semantic context
 * Allows retrieval of user context in future conversations
 */
export async function saveSessionToSmartMemory(
  sessionId: string,
  session: ChatSession
): Promise<boolean> {
  if (!raindropContext?.smartmemory_session) {
    console.log('[Mock] Session saved to memory:', sessionId);
    return true;
  }

  try {
    const context = {
      sessionId,
      checklist: session.checklist,
      lastMessage: session.history[session.history.length - 1]?.content || '',
      completeness: session.completeness,
      preferences: extractPreferences(session.checklist)
    };

    await raindropContext.smartmemory_session.put(
      `session:${sessionId}`,
      context,
      {
        metadata: {
          type: 'chat_session',
          timestamp: new Date().toISOString(),
          completeness: session.completeness
        }
      }
    );

    console.log(`[✓] Session ${sessionId} saved to SmartMemory`);
    return true;
  } catch (error) {
    console.error('[Raindrop] Session save failed:', error);
    return false;
  }
}

/**
 * Load session from SmartMemory
 * Retrieves previous conversation context
 */
export async function loadSessionFromSmartMemory(sessionId: string): Promise<ChatSession | null> {
  if (!raindropContext?.smartmemory_session) {
    return null;
  }

  try {
    const session = await raindropContext.smartmemory_session.get(`session:${sessionId}`);
    if (session) {
      console.log(`[✓] Session ${sessionId} loaded from SmartMemory`);
      return session;
    }
  } catch (error) {
    console.error('[Raindrop] Session load failed:', error);
  }

  return null;
}

/**
 * Save completed trip to SmartSQL database
 * Stores trip records for analysis and recommendations
 */
export async function saveTripToSmartSQL(trip: TripRecord): Promise<boolean> {
  if (!raindropContext?.smartsql_smart_trips) {
    console.log('[Mock] Trip saved to SQL:', trip.tripId);
    return true;
  }

  try {
    const tripData = {
      trip_id: trip.tripId,
      session_id: trip.sessionId,
      destination: trip.checklist.startingCity,
      trip_theme: trip.checklist.tripTheme,
      group_type: trip.checklist.groupType,
      start_date: trip.checklist.startDate,
      end_date: trip.checklist.endDate,
      duration_days: trip.checklist.travelDays,
      total_budget: trip.checklist.totalBudget,
      estimated_cost: trip.itinerary.budget.total,
      completeness: trip.completeness,
      ai_generated: trip.aiGenerated,
      created_at: trip.createdAt,
      checklist_json: JSON.stringify(trip.checklist),
      itinerary_json: JSON.stringify(trip.itinerary)
    };

    await raindropContext.smartsql_smart_trips.insert('trips', tripData);
    console.log(`[✓] Trip ${trip.tripId} saved to SmartSQL`);
    return true;
  } catch (error) {
    console.error('[Raindrop] Trip save failed:', error);
    return false;
  }
}

/**
 * Query trips for analytics and recommendations
 */
export async function getTripsForAnalysis(
  theme?: string,
  city?: string,
  limit: number = 100
): Promise<TripRecord[]> {
  if (!raindropContext?.smartsql_smart_trips) {
    return [];
  }

  try {
    let query = 'SELECT * FROM trips WHERE 1=1';
    const params: any[] = [];

    if (theme) {
      query += ' AND trip_theme = ?';
      params.push(theme);
    }
    if (city) {
      query += ' AND destination = ?';
      params.push(city);
    }

    query += ` ORDER BY created_at DESC LIMIT ${limit}`;

    const results = await raindropContext.smartsql_smart_trips.query(query, params);
    return results.map((row: any) => ({
      tripId: row.trip_id,
      sessionId: row.session_id,
      checklist: JSON.parse(row.checklist_json),
      itinerary: JSON.parse(row.itinerary_json),
      completeness: row.completeness,
      status: 'complete' as const,
      aiGenerated: row.ai_generated,
      createdAt: row.created_at
    }));
  } catch (error) {
    console.error('[Raindrop] Trip query failed:', error);
    return [];
  }
}

/**
 * Save AI insights and recommendations to SmartMemory
 */
export async function saveAIInsights(
  sessionId: string,
  insights: {
    enhancedQuestion?: string;
    optimizedItinerary?: string;
    recommendations?: string[];
  }
): Promise<boolean> {
  if (!raindropContext?.smartmemory_trip) {
    return true;
  }

  try {
    await raindropContext.smartmemory_trip.put(
      `insights:${sessionId}`,
      {
        sessionId,
        ...insights,
        timestamp: new Date().toISOString()
      },
      {
        metadata: {
          type: 'ai_insights'
        }
      }
    );

    console.log(`[✓] AI insights saved for ${sessionId}`);
    return true;
  } catch (error) {
    console.error('[Raindrop] Insights save failed:', error);
    return false;
  }
}

/**
 * Get cached session from KV store (fast access)
 */
export async function getSessionFromCache(sessionId: string): Promise<ChatSession | null> {
  if (!raindropContext?.kv_session_cache) {
    return null;
  }

  try {
    const cached = await raindropContext.kv_session_cache.get(`session:${sessionId}`);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    return null;
  }
}

/**
 * Cache session in KV store (fast access for active conversations)
 */
export async function cacheSession(sessionId: string, session: ChatSession): Promise<boolean> {
  if (!raindropContext?.kv_session_cache) {
    return true;
  }

  try {
    // Cache for 24 hours
    await raindropContext.kv_session_cache.put(
      `session:${sessionId}`,
      JSON.stringify(session),
      { expirationTtl: 86400 }
    );
    return true;
  } catch (error) {
    console.error('[Raindrop] Cache failed:', error);
    return false;
  }
}

/**
 * Query similar trips using SmartSQL
 * Finds reference itineraries for similar preferences
 */
export async function getSimilarTrips(
  checklist: any,
  limit: number = 5
): Promise<TripRecord[]> {
  if (!raindropContext?.smartsql_smart_trips) {
    return [];
  }

  try {
    const query = `
      SELECT * FROM trips
      WHERE trip_theme = ? AND destination = ?
      AND duration_days >= ? AND duration_days <= ?
      AND total_budget >= ? AND total_budget <= ?
      ORDER BY completeness DESC, created_at DESC
      LIMIT ?
    `;

    const minBudget = (checklist.totalBudget || 10000) * 0.8;
    const maxBudget = (checklist.totalBudget || 10000) * 1.2;

    const results = await raindropContext.smartsql_smart_trips.query(query, [
      checklist.tripTheme,
      checklist.startingCity,
      (checklist.travelDays || 3) - 1,
      (checklist.travelDays || 3) + 1,
      minBudget,
      maxBudget,
      limit
    ]);

    return results.map((row: any) => ({
      tripId: row.trip_id,
      sessionId: row.session_id,
      checklist: JSON.parse(row.checklist_json),
      itinerary: JSON.parse(row.itinerary_json),
      completeness: row.completeness,
      status: 'complete' as const,
      aiGenerated: row.ai_generated,
      createdAt: row.created_at
    }));
  } catch (error) {
    console.error('[Raindrop] Similar trips query failed:', error);
    return [];
  }
}

/**
 * Add POI documents to SmartBucket
 * Used for indexing and semantic search
 */
export async function addPOIsToSmartBucket(pois: POI[]): Promise<boolean> {
  if (!raindropContext?.smartbucket_pois) {
    return true;
  }

  try {
    const documents = pois.map(poi => ({
      id: poi.id,
      content: {
        poi,
        metadata: {
          indexed_at: new Date().toISOString(),
          themes: [poi.category],
          difficulty_levels: [poi.difficulty || 'moderate'],
          seasons: poi.bestTime ? [poi.bestTime] : []
        }
      },
      text: `${poi.name} ${poi.description} in ${poi.city} costs ${poi.costEstimate}`
    }));

    for (const doc of documents) {
      await raindropContext.smartbucket_pois.put(doc.id, doc.content, {
        text: doc.text,
        metadata: doc.content.metadata
      });
    }

    console.log(`[✓] Added ${pois.length} POIs to SmartBucket`);
    return true;
  } catch (error) {
    console.error('[Raindrop] POI indexing failed:', error);
    return false;
  }
}

/**
 * Get mock POIs for fallback (when Raindrop not available)
 */
function getMockPOIs(city: string, theme: string): POI[] {
  const mockData: Record<string, Record<string, POI[]>> = {
    pune: {
      adventure: [
        {
          id: 'poi-1',
          name: 'Sinhagad Fort',
          category: 'trek',
          description: 'Historic fort with scenic views and trekking trails',
          city: 'pune',
          latitude: 18.3697,
          longitude: 73.7997,
          costEstimate: 0,
          duration: '4 hours',
          difficulty: 'moderate',
          tags: ['history', 'adventure', 'views']
        },
        {
          id: 'poi-2',
          name: 'Rajmachi Trek',
          category: 'trek',
          description: 'Challenging trek with two forts at the summit',
          city: 'pune',
          latitude: 18.7333,
          longitude: 73.4333,
          costEstimate: 500,
          duration: '6 hours',
          difficulty: 'high',
          tags: ['adventure', 'views']
        }
      ],
      relaxed: [
        {
          id: 'poi-3',
          name: 'Lonavala',
          category: 'hill-station',
          description: 'Hill station with scenic views and pleasant weather',
          city: 'pune',
          latitude: 18.75,
          longitude: 73.4167,
          costEstimate: 500,
          duration: '2 hours',
          difficulty: 'low',
          tags: ['relaxation', 'scenic']
        }
      ],
      foodie: [
        {
          id: 'poi-4',
          name: 'FC Road',
          category: 'food-street',
          description: 'Popular street with diverse food options',
          city: 'pune',
          latitude: 18.5204,
          longitude: 73.8567,
          costEstimate: 400,
          duration: '2 hours',
          difficulty: 'low',
          tags: ['food', 'culture']
        }
      ]
    },
    goa: {
      adventure: [
        {
          id: 'poi-5',
          name: 'Dudhsagar Falls',
          category: 'waterfall',
          description: 'Majestic four-tiered waterfall in the Western Ghats',
          city: 'goa',
          latitude: 15.3167,
          longitude: 73.9833,
          costEstimate: 2000,
          duration: '6 hours',
          difficulty: 'high',
          tags: ['nature', 'adventure']
        }
      ],
      relaxed: [
        {
          id: 'poi-6',
          name: 'Baga Beach',
          category: 'beach',
          description: 'Popular beach with water sports and shacks',
          city: 'goa',
          latitude: 15.5833,
          longitude: 73.7333,
          costEstimate: 300,
          duration: 'full-day',
          difficulty: 'low',
          tags: ['beach', 'relaxation']
        }
      ]
    }
  };

  const cityPois = mockData[city.toLowerCase()] || mockData.pune || {};
  const themePois = (cityPois[theme.toLowerCase()] || cityPois.relaxed) || [];

  return themePois;
}

/**
 * Helper: Extract user preferences from checklist
 */
function extractPreferences(checklist: any): Record<string, any> {
  return {
    theme: checklist.tripTheme,
    adventure: checklist.adventureLevel,
    comfort: checklist.stayPreference,
    food: checklist.foodPreference,
    schedule: checklist.schedulePreference,
    group: checklist.groupType,
    budget: checklist.totalBudget
  };
}

/**
 * Health check for Raindrop connection
 */
export function isRaindropReady(): boolean {
  return raindropContext !== null;
}
