/**
 * NLP Parser using Chrono-node for date parsing
 * Extracts structured travel information from conversation messages
 */

import * as chrono from 'chrono-node';
import {
  TripChecklist,
  GroupType,
  TripTheme,
  TransportMode,
  StayPreference,
  AdventureLevel,
  FoodPreference,
  SchedulePreference,
  WeatherPreference,
  ComfortLevel
} from './types/checklist.js';

/**
 * Main parse function - extracts all fields from a message
 */
export function parseMessage(message: string): Partial<TripChecklist> {
  const result: Partial<TripChecklist> = {};

  // Parse dates
  const { startDate, endDate } = parseChronoDateRange(message);
  if (startDate) result.startDate = startDate;
  if (endDate) result.endDate = endDate;

  // Calculate travel days if both dates present
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (days > 0) result.travelDays = days;
  }

  // Parse other fields
  const budget = parseBudget(message);
  if (budget !== null) result.totalBudget = budget;

  const city = parseCity(message);
  if (city) result.startingCity = city;

  const theme = parseTripTheme(message);
  if (theme) result.tripTheme = theme;

  const groupType = parseGroupType(message);
  if (groupType) result.groupType = groupType;

  const transport = parseTransportMode(message);
  if (transport) result.transportMode = transport;

  const stay = parseStayPreference(message);
  if (stay) result.stayPreference = stay;

  const adventure = parseAdventureLevel(message);
  if (adventure) result.adventureLevel = adventure;

  const food = parseFoodPreference(message);
  if (food) result.foodPreference = food;

  const comfort = parseComfortLevel(message);
  if (comfort) result.comfortLevel = comfort;

  const schedule = parseSchedulePreference(message);
  if (schedule) result.schedulePreference = schedule;

  const weather = parseWeatherPreference(message);
  if (weather) result.weatherPreference = weather;

  const safety = parseSpecialNeeds(message);
  if (safety) result.safetyNeeds = safety;

  const places = parsePlacesList(message);
  if (places.avoid && places.avoid.length > 0) result.avoidPlaces = places.avoid;
  if (places.visit && places.visit.length > 0) result.visitedPlaces = places.visit;

  return result;
}

/**
 * Parse date range using Chrono
 * Handles: "23rd december to 30th", "Dec 20-23", "20th to 23rd December", etc.
 */
function parseChronoDateRange(message: string): { startDate: string | null; endDate: string | null } {
  try {
    const results = chrono.parse(message);

    if (results.length === 0) {
      return { startDate: null, endDate: null };
    }

    let startDate: string | null = null;
    let endDate: string | null = null;

    if (results.length >= 1 && results[0]) {
      // First result is start date
      const firstDate = results[0].start?.date();
      if (firstDate) startDate = formatDateToISO(firstDate);
    }

    if (results.length >= 2 && results[1]) {
      // Second result is end date
      const secondDate = results[1].start?.date();
      if (secondDate) endDate = formatDateToISO(secondDate);
    } else if (results.length === 1 && results[0] && results[0].end) {
      // Some patterns like "20th to 23rd" parse as range
      const secondDate = results[0].end.date();
      if (secondDate) endDate = formatDateToISO(secondDate);
    }

    return { startDate, endDate };
  } catch (error) {
    console.error('Chrono parsing error:', error);
    return { startDate: null, endDate: null };
  }
}

/**
 * Format JavaScript Date to ISO string (YYYY-MM-DD)
 */
function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse budget - handles various formats like "3k", "30,000", "₹50000", "3 lakh", "3000 rs"
 */
function parseBudget(message: string): number | null {
  // Match patterns in order of priority

  // Pattern 1: "X lakh" or "X lac"
  const lakhMatch = message.match(/(\d+)\s*(?:lakh|lac)/i);
  if (lakhMatch && lakhMatch[1]) {
    return parseInt(lakhMatch[1]) * 100000;
  }

  // Pattern 2: "Xk" or "X K"
  const kMatch = message.match(/(\d+)\s*[kK](?:\s|$)/);
  if (kMatch && kMatch[1]) {
    return parseInt(kMatch[1]) * 1000;
  }

  // Pattern 3: "X rs" or "X rupees"
  const rsMatch = message.match(/(\d+)\s*(?:rs|rupees?)/i);
  if (rsMatch && rsMatch[1]) {
    const val = parseInt(rsMatch[1]);
    if (!isNaN(val) && val > 0 && val < 10000000) {
      return val;
    }
  }

  // Pattern 4: Numbers with commas or without
  const numMatch = message.match(/₹?([\d,]+)(?:\s+(?:per\s+person|each|pp))?/i);
  if (numMatch && numMatch[1]) {
    const value = numMatch[1].replace(/,/g, '');
    const budget = parseInt(value);
    if (!isNaN(budget) && budget > 0 && budget < 10000000) {
      return budget;
    }
  }

  return null;
}

/**
 * Parse destination city from predefined list
 */
function parseCity(message: string): string | null {
  const cities = [
    'goa', 'mumbai', 'delhi', 'bangalore', 'hyderabad', 'kerala',
    'jaipur', 'agra', 'udaipur', 'pushkar', 'ooty', 'shimla',
    'manali', 'ladakh', 'kasmir', 'guwahati', 'assam',
    'rajasthan', 'tamil nadu', 'karnataka', 'maharashtra',
    'new delhi', 'chandigarh', 'pune', 'ahmedabad',
    'lucknow', 'varanasi', 'kolkata', 'bhubaneswar'
  ];

  const messageLower = message.toLowerCase();
  
  for (const city of cities) {
    if (messageLower.includes(city)) {
      return city.charAt(0).toUpperCase() + city.slice(1);
    }
  }

  return null;
}

/**
 * Parse trip theme - identifies travel style
 */
function parseTripTheme(message: string): TripTheme | null {
  const messageLower = message.toLowerCase();

  if (/adventure|trek|hike|water|sport|active|thrill|cave|paraglid|skydiv|zip|cliff|bungee/.test(messageLower)) {
    return 'adventure';
  }
  if (/relax|beach|chill|leisure|calm|peaceful|rest|unwind|spa|therapy/.test(messageLower)) {
    return 'relaxed';
  }
  if (/food|cuisine|culinary|cook|eat|restaurant|taste|gastro|delicacies/.test(messageLower)) {
    return 'foodie';
  }
  if (/culture|heritage|historic|museum|temple|art|tradition|architecture|monument/.test(messageLower)) {
    return 'cultural';
  }
  if (/beach|coast|ocean|sea|sand|swim|tropical|island|seaside|surfing/.test(messageLower)) {
    return 'beach';
  }
  if (/mountain|hill|alpine|trek|peak|snowy|cold|high altitude|himalaya/.test(messageLower)) {
    return 'mountain';
  }

  return null;
}

/**
 * Parse group composition - solo, couple, family, team
 */
function parseGroupType(message: string): GroupType | null {
  const messageLower = message.toLowerCase();

  if (/solo|alone|by myself|single traveler/.test(messageLower)) {
    return 'solo';
  }
  if (/couple|partner|spouse|honeymoon|boyfriend|girlfriend|husband|wife/.test(messageLower)) {
    return 'couple';
  }
  if (/family|kids|children|parents|relatives|grandparent/.test(messageLower)) {
    return 'family';
  }
  if (/friend|friends|team|group|office|colleagues|company/.test(messageLower)) {
    return 'team';
  }

  return null;
}

/**
 * Parse transportation mode
 */
function parseTransportMode(message: string): TransportMode | null {
  const messageLower = message.toLowerCase();

  if (/flight|airplane|fly|aeroplane|airways/.test(messageLower)) {
    return 'flight';
  }
  if (/train|railway|express|local|metro|rail/.test(messageLower)) {
    return 'train';
  }
  if (/bus|coach|transport/.test(messageLower)) {
    return 'bus';
  }
  if (/car|drive|driving|rental|self-drive|vehicle/.test(messageLower)) {
    return 'car';
  }
  if (/bike|motorcycle|two-wheeler|scooter|motorbike/.test(messageLower)) {
    return 'bike';
  }
  if (/walk|walking|trek|hiking|foot/.test(messageLower)) {
    return 'walk';
  }
  if (/cycle|cycling|bicycle/.test(messageLower)) {
    return 'cycling';
  }

  return null;
}

/**
 * Parse accommodation preference
 */
function parseStayPreference(message: string): StayPreference | null {
  const messageLower = message.toLowerCase();

  if (/luxury|premium|5-star|five star|upscale|high-end/.test(messageLower)) {
    return 'luxury';
  }
  if (/midrange|mid-range|3-star|four star|comfortable|standard/.test(messageLower)) {
    return 'midrange';
  }
  if (/budget|cheap|economical|affordable|hostel|backpack/.test(messageLower)) {
    return 'budget';
  }
  if (/homestay|home stay|local|airbnb/.test(messageLower)) {
    return 'homestay';
  }
  if (/hostel|dorm|shared|backpacker/.test(messageLower)) {
    return 'hostel';
  }

  return null;
}

/**
 * Parse adventure level
 */
function parseAdventureLevel(message: string): AdventureLevel | null {
  const messageLower = message.toLowerCase();

  if (/extreme|very adventurous|high risk|hardcore|adrenaline|extreme sports|thrilling|thrill|exciting/.test(messageLower)) {
    return 'high';
  }
  if (/moderate|some adventure|mix of|balanced|mid|medium/.test(messageLower)) {
    return 'moderate';
  }
  if (/low|relaxed|no adventure|chill|safe|comfortable|easy|slow|calm/.test(messageLower)) {
    return 'low';
  }

  return null;
}

/**
 * Parse food preferences
 */
function parseFoodPreference(message: string): FoodPreference | null {
  const messageLower = message.toLowerCase();

  if (/vegetarian|veggie|no meat|veg/.test(messageLower)) {
    return 'vegetarian';
  }
  if (/vegan|no animal/.test(messageLower)) {
    return 'vegan';
  }
  if (/non-vegetarian|non vegetarian|meat|non-veg|everything/.test(messageLower)) {
    return 'non-vegetarian';
  }
  if (/any|anything|flexible|doesn't matter|no preference/.test(messageLower)) {
    return 'any';
  }

  return null;
}

/**
 * Parse comfort level
 */
function parseComfortLevel(message: string): ComfortLevel | null {
  const messageLower = message.toLowerCase();

  if (/premium|luxury|comfortable|well-equipped|best|high quality/.test(messageLower)) {
    return 'premium';
  }
  if (/standard|good|decent|average|okay/.test(messageLower)) {
    return 'standard';
  }
  if (/budget|basic|minimal|economical|cheap/.test(messageLower)) {
    return 'budget';
  }

  return null;
}

/**
 * Parse schedule preference
 */
function parseSchedulePreference(message: string): SchedulePreference | null {
  const messageLower = message.toLowerCase();

  if (/packed|busy|full schedule|lots of activities|go go go|action-packed|morning start|early start|packed itinerary/.test(messageLower)) {
    return 'packed';
  }
  if (/busy|active|multiple activities|several activities/.test(messageLower)) {
    return 'busy';
  }
  if (/relax|relaxed|slow|chill|leisure|no rush|take time|evening|night|lazy/.test(messageLower)) {
    return 'relaxed';
  }
  if (/flexible|adaptable|depends|mix|balance|go with flow/.test(messageLower)) {
    return 'flexible';
  }

  return null;
}

/**
 * Parse weather preference
 */
function parseWeatherPreference(message: string): WeatherPreference | null {
  const messageLower = message.toLowerCase();

  if (/cold|snow|winter|freezing|chilly/.test(messageLower)) {
    return 'cold';
  }
  if (/hot|summer|warm|heat|tropical/.test(messageLower)) {
    return 'hot';
  }
  if (/rainy|rain|wet|monsoon|drizzle/.test(messageLower)) {
    return 'rainy';
  }
  if (/monsoon|heavy rain|downpour/.test(messageLower)) {
    return 'monsoon';
  }
  if (/sunny|bright|clear|sunny days|no clouds/.test(messageLower)) {
    return 'sunny';
  }
  if (/mild|pleasant|moderate|comfortable|spring|fall/.test(messageLower)) {
    return 'mild';
  }

  return null;
}

/**
 * Parse special needs and safety requirements
 */
function parseSpecialNeeds(message: string): string | null {
  const specialNeeds = [];

  if (/wheelchair|mobility|disability|disability access|ramp|elevator/.test(message.toLowerCase())) {
    specialNeeds.push('accessibility');
  }
  if (/medication|medical|health|asthma|allergy|diabetes|heart|condition/.test(message.toLowerCase())) {
    specialNeeds.push('medical requirements');
  }
  if (/safe|safety|women|solo female|crime|safety concerns|security/.test(message.toLowerCase())) {
    specialNeeds.push('safety');
  }
  if (/pregnant|pregnancy|expecting/.test(message.toLowerCase())) {
    specialNeeds.push('pregnancy');
  }

  return specialNeeds.length > 0 ? specialNeeds.join(', ') : null;
}

/**
 * Parse places to visit or avoid
 */
function parsePlacesList(message: string): { visit: string[]; avoid: string[] } {
  const visit: string[] = [];
  const avoid: string[] = [];

  // Look for places mentioned after keywords
  const visitKeywords = /(?:visit|see|want to go|must see|must visit|including|like to visit|want to explore)/gi;
  const avoidKeywords = /(?:avoid|not go|stay away|skip|don't want)/gi;

  // Simple extraction - look for capitalized words (likely place names)
  const capitalizedWords = message.match(/\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*/g) || [];

  // This is a basic implementation
  // In production, you'd use a proper NER (Named Entity Recognition) library
  if (visitKeywords.test(message)) {
    visit.push(...capitalizedWords.filter(w => w.length > 2));
  }

  if (avoidKeywords.test(message)) {
    avoid.push(...capitalizedWords.filter(w => w.length > 2));
  }

  return {
    visit: [...new Set(visit)], // Remove duplicates
    avoid: [...new Set(avoid)]
  };
}
