/**
 * Travel Itinerary Checklist Types
 * Defines all checklist fields, enums, and interfaces for trip planning
 */

export type GroupType = 'solo' | 'couple' | 'family' | 'team';
export type TripTheme = 'adventure' | 'relaxed' | 'foodie' | 'cultural' | 'beach' | 'mountain';
export type TransportMode = 'car' | 'train' | 'bus' | 'flight' | 'bike' | 'walk' | 'cycling';
export type StayPreference = 'budget' | 'midrange' | 'luxury' | 'homestay' | 'hostel';
export type AdventureLevel = 'low' | 'moderate' | 'high';
export type FoodPreference = 'vegetarian' | 'vegan' | 'non-vegetarian' | 'any';
export type ComfortLevel = 'budget' | 'standard' | 'premium';
export type SchedulePreference = 'relaxed' | 'busy' | 'flexible' | 'packed';
export type WeatherPreference = 'cold' | 'hot' | 'rainy' | 'monsoon' | 'sunny' | 'mild';

/**
 * Core checklist fields that must be collected from user
 */
export interface TripChecklist {
  // Dates and Duration
  startDate: string | null;
  endDate: string | null;
  travelDays: number | null;

  // Budget
  totalBudget: number | null;

  // Location
  startingCity: string | null;

  // Trip Style
  tripTheme: TripTheme | null;
  groupType: GroupType | null;

  // Transport & Accommodation
  transportMode: TransportMode | null;
  stayPreference: StayPreference | null;

  // Preferences
  adventureLevel: AdventureLevel | null;
  foodPreference: FoodPreference | null;
  comfortLevel: ComfortLevel | null;
  schedulePreference: SchedulePreference | null;
  weatherPreference: WeatherPreference | null;

  // Safety & Special Needs
  safetyNeeds: string | null;
  specialRequirements: string | null;

  // Places
  avoidPlaces: string[] | null;
  visitedPlaces: string[] | null;
}

/**
 * Session data that persists across conversation
 */
export interface ChatSession {
  sessionId: string;
  checklist: TripChecklist;
  history: ConversationMessage[];
  createdAt: string;
  updatedAt: string;
  completeness: number;
  aiEnhancedQuestion?: string;
}

/**
 * Conversation message in chat history
 */
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  extractedFields?: Partial<TripChecklist>;
}

/**
 * Point of Interest (POI) for activities
 */
export interface POI {
  id: string;
  name: string;
  category: string;
  description: string;
  city: string;
  latitude: number;
  longitude: number;
  costEstimate: number;
  duration: string;
  difficulty?: AdventureLevel;
  bestTime?: string;
  ratings?: {
    adventure?: number;
    food?: number;
    culture?: number;
    relaxation?: number;
  };
  tags?: string[];
}

/**
 * Daily itinerary block
 */
export interface ItineraryBlock {
  time: string;
  activity: string;
  description: string;
  duration: string;
  location?: {
    name: string;
    latitude: number;
    longitude: number;
  };
  cost: number;
  category?: string;
}

/**
 * Single day in itinerary
 */
export interface ItineraryDay {
  date: string;
  day: number;
  title: string;
  blocks: ItineraryBlock[];
  dayCost?: number;
  weather?: string;
  notes?: string;
}

/**
 * Budget breakdown
 */
export interface BudgetBreakdown {
  accommodation: number;
  food: number;
  activities: number;
  transport: number;
  miscellaneous?: number;
}

/**
 * Complete itinerary
 */
export interface Itinerary {
  tripId: string;
  summary: string;
  destination: string;
  startDate: string;
  endDate: string;
  days: ItineraryDay[];
  budget: {
    total: number;
    perDay: number;
    breakdown: BudgetBreakdown;
    remaining: number;
    bufferPercent: number;
  };
  map?: GeoJSONFeatureCollection;
  recommendations?: string[];
  warnings?: string[];
  essentialTips?: string[];
}

/**
 * Complete trip record
 */
export interface TripRecord {
  tripId: string;
  sessionId: string;
  checklist: TripChecklist;
  itinerary: Itinerary;
  completeness: number;
  status: 'incomplete' | 'complete' | 'optimized';
  aiGenerated: boolean;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Chat response to user
 */
export interface ChatResponse {
  sessionId: string;
  completeness: number;
  status: 'incomplete' | 'complete' | 'optimized' | 'ready';
  checklist: TripChecklist;
  history: ConversationMessage[];
  nextQuestion?: string;
  itinerary?: Itinerary | any;
  suggestions?: string[];
  processingTime?: number;
  timestamp?: string;
  aiReasoning?: string;
  confidence?: number;
}

/**
 * Extracted fields from user message
 */
export interface ExtractedFields extends Partial<TripChecklist> {
  confidence?: number;
  method?: 'regex' | 'keyword' | 'ai';
}

/**
 * GeoJSON types for map data
 */
export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

export interface GeoJSONFeature {
  type: 'Feature';
  properties: Record<string, any>;
  geometry: GeoJSONGeometry;
}

export type GeoJSONGeometry =
  | { type: 'Point'; coordinates: [number, number] }
  | { type: 'LineString'; coordinates: [number, number][] }
  | { type: 'Polygon'; coordinates: [number, number][][] };

/**
 * Parsed AI response for itinerary
 */
export interface AIGeneratedItinerary {
  summary: string;
  days: Array<{
    date: string;
    day: number;
    blocks: Array<{
      time: string;
      activity: string;
      description: string;
      duration: string;
      location: { name: string; lat: number; lng: number };
      cost: number;
    }>;
  }>;
  budget: {
    total: number;
    breakdown: {
      accommodation: number;
      food: number;
      activities: number;
      transport: number;
    };
    remaining: number;
  };
  recommendations: string[];
}

/**
 * Raindrop SmartBucket document for POI
 */
export interface POIDocument {
  id: string;
  content: {
    poi: POI;
    metadata: {
      indexed_at: string;
      themes: TripTheme[];
      difficulty_levels: AdventureLevel[];
      seasons: string[];
    };
  };
  embedding?: number[];
}

/**
 * Constants for checklist
 */
export const CHECKLIST_FIELDS: (keyof TripChecklist)[] = [
  'startDate',
  'endDate',
  'travelDays',
  'totalBudget',
  'startingCity',
  'tripTheme',
  'groupType',
  'transportMode',
  'stayPreference',
  'adventureLevel',
  'foodPreference',
  'comfortLevel',
  'schedulePreference',
  'weatherPreference',
  'safetyNeeds',
  'specialRequirements',
  'avoidPlaces',
  'visitedPlaces'
];

export const PRIORITY_QUESTIONS: (keyof TripChecklist)[] = [
  'startingCity',
  'totalBudget',
  'groupType',
  'tripTheme',
  'startDate',
  'travelDays',
  'transportMode',
  'stayPreference',
  'adventureLevel',
  'foodPreference',
  'schedulePreference',
  'comfortLevel',
  'weatherPreference',
  'safetyNeeds',
  'specialRequirements',
  'avoidPlaces',
  'visitedPlaces'
];

/**
 * Creates an empty checklist
 */
export function createEmptyChecklist(): TripChecklist {
  return {
    startDate: null,
    endDate: null,
    travelDays: null,
    totalBudget: null,
    startingCity: null,
    tripTheme: null,
    groupType: null,
    transportMode: null,
    stayPreference: null,
    adventureLevel: null,
    foodPreference: null,
    comfortLevel: null,
    schedulePreference: null,
    weatherPreference: null,
    safetyNeeds: null,
    specialRequirements: null,
    avoidPlaces: null,
    visitedPlaces: null
  };
}

/**
 * Calculate checklist completeness
 */
export function calculateCompleteness(checklist: TripChecklist): number {
  const filled = Object.values(checklist).filter(
    v => v !== null && v !== undefined && v !== '' && (!Array.isArray(v) || v.length > 0)
  ).length;
  return Math.round((filled / CHECKLIST_FIELDS.length) * 100);
}
