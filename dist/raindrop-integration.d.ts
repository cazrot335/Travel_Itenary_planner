/**
 * Raindrop MCP Integration
 * Handles SmartBuckets, SmartMemory, SmartSQL, and KV operations
 */
import { ChatSession, TripRecord, POI } from './types/checklist.js';
interface RaindropContext {
    smartbucket_pois: any;
    smartmemory_session: any;
    smartmemory_trip: any;
    smartsql_smart_trips: any;
    kv_session_cache: any;
}
/**
 * Initialize Raindrop integrations
 * Called at application startup
 */
export declare function initializeRaindrop(context?: RaindropContext): Promise<boolean>;
/**
 * Search and retrieve POIs from SmartBucket based on theme/city/budget
 * Uses AI-powered semantic search
 */
export declare function getPOIsFromSmartBuckets(city: string, theme: string, budget: number, count?: number): Promise<POI[]>;
/**
 * Save session to SmartMemory with semantic context
 * Allows retrieval of user context in future conversations
 */
export declare function saveSessionToSmartMemory(sessionId: string, session: ChatSession): Promise<boolean>;
/**
 * Load session from SmartMemory
 * Retrieves previous conversation context
 */
export declare function loadSessionFromSmartMemory(sessionId: string): Promise<ChatSession | null>;
/**
 * Save completed trip to SmartSQL database
 * Stores trip records for analysis and recommendations
 */
export declare function saveTripToSmartSQL(trip: TripRecord): Promise<boolean>;
/**
 * Query trips for analytics and recommendations
 */
export declare function getTripsForAnalysis(theme?: string, city?: string, limit?: number): Promise<TripRecord[]>;
/**
 * Save AI insights and recommendations to SmartMemory
 */
export declare function saveAIInsights(sessionId: string, insights: {
    enhancedQuestion?: string;
    optimizedItinerary?: string;
    recommendations?: string[];
}): Promise<boolean>;
/**
 * Get cached session from KV store (fast access)
 */
export declare function getSessionFromCache(sessionId: string): Promise<ChatSession | null>;
/**
 * Cache session in KV store (fast access for active conversations)
 */
export declare function cacheSession(sessionId: string, session: ChatSession): Promise<boolean>;
/**
 * Query similar trips using SmartSQL
 * Finds reference itineraries for similar preferences
 */
export declare function getSimilarTrips(checklist: any, limit?: number): Promise<TripRecord[]>;
/**
 * Add POI documents to SmartBucket
 * Used for indexing and semantic search
 */
export declare function addPOIsToSmartBucket(pois: POI[]): Promise<boolean>;
/**
 * Health check for Raindrop connection
 */
export declare function isRaindropReady(): boolean;
export {};
//# sourceMappingURL=raindrop-integration.d.ts.map