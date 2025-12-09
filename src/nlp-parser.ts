/**
 * NLP Message Parser
 * Extracts travel preferences from user conversations
 */

import {
  TripChecklist,
  ExtractedFields,
  GroupType,
  TripTheme,
  TransportMode,
  StayPreference,
  AdventureLevel,
  FoodPreference,
  SchedulePreference,
  WeatherPreference
} from './types/checklist';

/**
 * Parse user message and extract checklist fields
 * Uses pattern matching, keywords, and contextual heuristics
 */
export function parseMessage(message: string): ExtractedFields {
  const extracted: ExtractedFields = {};
  const lower = message.toLowerCase();

  // === DATE PARSING ===
  extracted.startDate = parseStartDate(message);
  extracted.endDate = parseEndDate(message);
  extracted.travelDays = parseTravelDays(message);

  // === BUDGET PARSING ===
  extracted.totalBudget = parseBudget(message);

  // === LOCATION PARSING ===
  extracted.startingCity = parseCity(message);

  // === TRIP THEME ===
  extracted.tripTheme = parseTripTheme(message);

  // === GROUP TYPE ===
  extracted.groupType = parseGroupType(message);

  // === TRANSPORT MODE ===
  extracted.transportMode = parseTransportMode(message);

  // === ACCOMMODATION ===
  extracted.stayPreference = parseStayPreference(message);

  // === ADVENTURE LEVEL ===
  extracted.adventureLevel = parseAdventureLevel(message);

  // === FOOD PREFERENCE ===
  extracted.foodPreference = parseFoodPreference(message);

  // === SCHEDULE ===
  extracted.schedulePreference = parseSchedulePreference(message);

  // === WEATHER ===
  extracted.weatherPreference = parseWeatherPreference(message);

  // === SPECIAL NEEDS ===
  extracted.safetyNeeds = parseSpecialNeeds(message, 'safety|accessibility|wheelchair|health');
  extracted.specialRequirements = parseSpecialNeeds(message, 'special|requirement|allergy|diet');

  // === PLACES ===
  extracted.avoidPlaces = parsePlacesList(message, 'avoid|skip|don\'t|no go|exclude');
  extracted.visitedPlaces = parsePlacesList(message, 'visited|been|already|went|been to');

  return extracted;
}

/**
 * Parse start date from message
 * Formats: "22nd Dec", "Dec 22-25", "next week", "2025-12-22", "20th to 23rd December"
 */
function parseStartDate(message: string): string | null {
  const lower = message.toLowerCase();
  
  // Handle "20th to 23rd December" or "20-23 December"
  const monthMap: Record<string, number> = {
    'january': 1, 'jan': 1,
    'february': 2, 'feb': 2,
    'march': 3, 'mar': 3,
    'april': 4, 'apr': 4,
    'may': 5,
    'june': 6, 'jun': 6,
    'july': 7, 'jul': 7,
    'august': 8, 'aug': 8,
    'september': 9, 'sep': 9,
    'october': 10, 'oct': 10,
    'november': 11, 'nov': 11,
    'december': 12, 'dec': 12
  };

  // Check for range with "to" or "-" separator: "20th to 23rd December"
  // Extract the FIRST day in range
  const rangeMatch = lower.match(/(\d{1,2})(?:st|nd|rd|th)?\s*(?:to|[-–—])\s*(\d{1,2})(?:st|nd|rd|th)?/);
  if (rangeMatch) {
    // Found a range, use the first day
    const firstDay = rangeMatch[1];
    
    // Now find the month for this range
    for (const [monthName, monthNum] of Object.entries(monthMap)) {
      if (lower.includes(monthName)) {
        const day = String(firstDay).padStart(2, '0');
        const month = String(monthNum).padStart(2, '0');
        const year = new Date().getFullYear();
        return `${year}-${month}-${day}`;
      }
    }
  }

  // Non-range: check for any month name
  for (const [monthName, monthNum] of Object.entries(monthMap)) {
    if (lower.includes(monthName)) {
      // Found a month, now extract the day
      const dayMatch = lower.match(/(\d{1,2})(?:st|nd|rd|th)?/);
      if (dayMatch) {
        const day = String(dayMatch[1]).padStart(2, '0');
        const month = String(monthNum).padStart(2, '0');
        const year = new Date().getFullYear();
        return `${year}-${month}-${day}`;
      }
    }
  }

  // ISO format: 2025-12-22
  const isoMatch = message.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  // Relative dates
  if (lower.includes('today')) {
    return getDateString(0);
  }
  if (lower.includes('tomorrow')) {
    return getDateString(1);
  }
  const daysMatch = lower.match(/in\s+(\d+)\s+days?/);
  if (daysMatch && daysMatch[1]) {
    return getDateString(parseInt(daysMatch[1]));
  }

  // Day of week
  if (lower.match(/(?:this|next)\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)/)) {
    const weekDate = getNextDayOfWeek(message);
    return weekDate || null;
  }

  return null;
}

/**
 * Parse end date from message
 */
function parseEndDate(message: string): string | null {
  const lower = message.toLowerCase();
  
  const monthMap: Record<string, number> = {
    'january': 1, 'jan': 1,
    'february': 2, 'feb': 2,
    'march': 3, 'mar': 3,
    'april': 4, 'apr': 4,
    'may': 5,
    'june': 6, 'jun': 6,
    'july': 7, 'jul': 7,
    'august': 8, 'aug': 8,
    'september': 9, 'sep': 9,
    'october': 10, 'oct': 10,
    'november': 11, 'nov': 11,
    'december': 12, 'dec': 12
  };

  // Handle "20th to 23rd December" or "20-23 December" - extract the END day
  const rangeMatch = lower.match(/\d{1,2}(?:st|nd|rd|th)?\s*(?:to|[-–—])\s*(\d{1,2})(?:st|nd|rd|th)?/);
  if (rangeMatch) {
    // Found range, extract end day (group 1)
    const endDay = String(rangeMatch[1]).padStart(2, '0');
    
    // Now find the month
    for (const [monthName, monthNum] of Object.entries(monthMap)) {
      if (lower.includes(monthName)) {
        const month = String(monthNum).padStart(2, '0');
        const year = new Date().getFullYear();
        return `${year}-${month}-${endDay}`;
      }
    }
  }

  // ISO range: 2025-12-22 to 2025-12-25
  const isoRangeMatch = message.match(/(\d{4})-(\d{2})-(\d{2})\s*(?:to|[-])\s*(\d{4})-(\d{2})-(\d{2})/);
  if (isoRangeMatch) {
    return `${isoRangeMatch[4]}-${isoRangeMatch[5]}-${isoRangeMatch[6]}`;
  }

  return null;
}

/**
 * Parse travel days from message
 */
function parseTravelDays(message: string): number | null {
  const match = message.match(/(\d+)\s*(?:days?|nights?|d|nights)/i);
  if (match && match[1]) {
    return parseInt(match[1]);
  }
  return null;
}

/**
 * Parse budget from message
 * Supports: "3k", "30,000", "₹50000", "3 lakh"
 */
function parseBudget(message: string): number | null {
  const patterns = [
    // Currency with amount: ₹5000, Rs. 5000
    /[₹₽Rs.rs]*\s*(\d+(?:,\d{3})*)\s*(?:rupees?|rs|inr)?/i,
    // Thousands: 3k, 5K
    /(\d+)\s*k\b/i,
    // Words: 3 thousand, 2 lakh
    /(\d+)\s*(?:thousand|lakh|crore)\b/i,
    // Plain number: 5000
    /\b(\d{4,})\b/
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      let budget = parseInt(match[1].replace(/,/g, ''));

      if (message.match(/(\d+)\s*k\b/i)) {
        budget = budget * 1000;
      }
      if (message.match(/(\d+)\s*thousand/i)) {
        budget = budget * 1000;
      }
      if (message.match(/(\d+)\s*lakh/i)) {
        budget = budget * 100000;
      }
      if (message.match(/(\d+)\s*crore/i)) {
        budget = budget * 10000000;
      }

      if (budget > 0) {
        return budget;
      }
    }
  }

  return null;
}

/**
 * Parse city from message
 */
function parseCity(message: string): string | null {
  const cities: Record<string, string[]> = {
    pune: ['pune', 'pimpri', 'aundh'],
    goa: ['goa', 'panaji', 'goan'],
    mumbai: ['mumbai', 'bombay', 'mumbai'],
    bangalore: ['bangalore', 'bengaluru', 'blr'],
    delhi: ['delhi', 'new delhi', 'nd'],
    kerala: ['kerala', 'kochi', 'cochin', 'trivandrum'],
    jaipur: ['jaipur', 'pink city'],
    agra: ['agra', 'taj'],
    shimla: ['shimla', 'simla', 'himachal'],
    manali: ['manali', 'himachal'],
    darjeeling: ['darjeeling', 'siliguri'],
    ladakh: ['ladakh', 'leh', 'srinagar']
  };

  const lower = message.toLowerCase();
  for (const [city, keywords] of Object.entries(cities)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return city;
      }
    }
  }

  return null;
}

/**
 * Parse trip theme from message
 */
function parseTripTheme(message: string): TripTheme | null {
  const themeMap: Record<string, TripTheme> = {
    adventure: 'adventure',
    adventurous: 'adventure',
    trek: 'adventure',
    trekking: 'adventure',
    hiking: 'adventure',
    relax: 'relaxed',
    relaxation: 'relaxed',
    relaxed: 'relaxed',
    chill: 'relaxed',
    slow: 'relaxed',
    foodie: 'foodie',
    food: 'foodie',
    culinary: 'foodie',
    eating: 'foodie',
    cultural: 'cultural',
    culture: 'cultural',
    heritage: 'cultural',
    history: 'cultural',
    beach: 'beach',
    beaches: 'beach',
    seaside: 'beach',
    coast: 'beach',
    mountain: 'mountain',
    mountains: 'mountain',
    hills: 'mountain'
  };

  const lower = message.toLowerCase();
  for (const [keyword, theme] of Object.entries(themeMap)) {
    if (lower.includes(keyword)) {
      return theme;
    }
  }

  return null;
}

/**
 * Parse group type from message
 */
function parseGroupType(message: string): GroupType | null {
  const lower = message.toLowerCase();

  const groups: Record<GroupType, string[]> = {
    solo: ['solo', 'alone', 'myself', 'just me', 'by myself'],
    couple: ['couple', 'partner', 'spouse', 'girlfriend', 'boyfriend', 'wife', 'husband', 'my partner', 'significant other'],
    family: ['family', 'kids', 'children', 'parents', 'family trip', 'with my family', 'grandparents'],
    team: ['team', 'group of', 'friends', 'colleagues', 'office', 'company', 'with friends', 'group trip']
  };

  for (const [type, keywords] of Object.entries(groups)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return type as GroupType;
      }
    }
  }

  return null;
}

/**
 * Parse transport mode from message
 */
function parseTransportMode(message: string): TransportMode | null {
  const lower = message.toLowerCase();
  const modes: Record<string, TransportMode> = {
    car: 'car',
    drive: 'car',
    driving: 'car',
    train: 'train',
    railway: 'train',
    bus: 'bus',
    coach: 'bus',
    flight: 'flight',
    fly: 'flight',
    flying: 'flight',
    bike: 'bike',
    motorcycle: 'bike',
    ride: 'bike',
    walk: 'walk',
    walking: 'walk',
    cycling: 'cycling',
    cycle: 'cycling'
  };

  for (const [keyword, mode] of Object.entries(modes)) {
    if (lower.includes(keyword)) {
      return mode;
    }
  }

  return null;
}

/**
 * Parse accommodation preference from message
 */
function parseStayPreference(message: string): StayPreference | null {
  const lower = message.toLowerCase();
  const preferences: Record<string, StayPreference> = {
    budget: 'budget',
    cheap: 'budget',
    affordable: 'budget',
    midrange: 'midrange',
    'mid-range': 'midrange',
    mid: 'midrange',
    moderate: 'midrange',
    standard: 'midrange',
    luxury: 'luxury',
    '5star': 'luxury',
    'five star': 'luxury',
    premium: 'luxury',
    homestay: 'homestay',
    'home stay': 'homestay',
    hostel: 'hostel',
    backpacker: 'hostel'
  };

  for (const [keyword, pref] of Object.entries(preferences)) {
    if (lower.includes(keyword)) {
      return pref;
    }
  }

  return null;
}

/**
 * Parse adventure level from message
 */
function parseAdventureLevel(message: string): AdventureLevel | null {
  const lower = message.toLowerCase();

  if (lower.match(/high|extreme|adrenaline|thrill/)) {
    return 'high';
  }
  if (lower.match(/moderate|medium|some|reasonable/)) {
    return 'moderate';
  }
  if (lower.match(/low|calm|peaceful|relaxing|light/)) {
    return 'low';
  }

  return null;
}

/**
 * Parse food preference from message
 */
function parseFoodPreference(message: string): FoodPreference | null {
  const lower = message.toLowerCase();

  if (lower.match(/vegetarian|veg|vegan/)) {
    return lower.includes('vegan') ? 'vegan' : 'vegetarian';
  }
  if (lower.match(/non[- ]?veg|non[- ]?vegetarian|meat|chicken|fish/)) {
    return 'non-vegetarian';
  }
  if (lower.match(/any|flexible|no preference|all/)) {
    return 'any';
  }

  return null;
}

/**
 * Parse schedule preference from message
 */
function parseSchedulePreference(message: string): SchedulePreference | null {
  const lower = message.toLowerCase();

  if (lower.match(/relaxed|slow|chill|leisurely/)) {
    return 'relaxed';
  }
  if (lower.match(/busy|packed|packed schedule|full|activity packed/)) {
    return 'busy';
  }
  if (lower.match(/flexible|flexible schedule|adaptable/)) {
    return 'flexible';
  }

  return null;
}

/**
 * Parse weather preference from message
 */
function parseWeatherPreference(message: string): WeatherPreference | null {
  const lower = message.toLowerCase();

  if (lower.match(/cold|snow|winter|chilly|cool/)) {
    return 'cold';
  }
  if (lower.match(/hot|warm|summer|heat/)) {
    return 'hot';
  }
  if (lower.match(/rainy|rain|monsoon|wet|showers/)) {
    return 'rainy';
  }
  if (lower.match(/sunny|sun|clear|bright/)) {
    return 'sunny';
  }
  if (lower.match(/mild|moderate|pleasant/)) {
    return 'mild';
  }

  return null;
}

/**
 * Parse special needs or requirements
 */
function parseSpecialNeeds(message: string, pattern: string): string | null {
  const regex = new RegExp(`(?:${pattern})[^.!?]*[.!?]?`, 'i');
  const match = message.match(regex);
  return match ? match[0].trim() : null;
}

/**
 * Parse list of places from message
 */
function parsePlacesList(message: string, pattern: string): string[] | null {
  const regex = new RegExp(`(?:${pattern})[^.!?]*[.!?]?`, 'i');
  const match = message.match(regex);
  
  if (match) {
    // Extract comma-separated or "and" separated places
    const text = match[0];
    const places = text
      .replace(new RegExp(`^(?:${pattern})`, 'i'), '')
      .split(/[,;]|and/)
      .map(p => p.trim())
      .filter(p => p.length > 0 && p.length < 50);
    
    return places.length > 0 ? places : null;
  }

  return null;
}

/**
 * Helper: Get month number from month name
 */
function getMonthNumber(monthStr: string): number | null {
  const months: Record<string, number> = {
    jan: 1, january: 1,
    feb: 2, february: 2,
    mar: 3, march: 3,
    apr: 4, april: 4,
    may: 5,
    jun: 6, june: 6,
    jul: 7, july: 7,
    aug: 8, august: 8,
    sep: 9, september: 9,
    oct: 10, october: 10,
    nov: 11, november: 11,
    dec: 12, december: 12
  };

  return months[monthStr.toLowerCase().substring(0, 3)] || null;
}

/**
 * Helper: Get date string from offset
 */
function getDateString(daysOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0] ?? '';
}

/**
 * Helper: Get next occurrence of day of week
 */
function getNextDayOfWeek(message: string): string {
  const dayMap: Record<string, number> = {
    monday: 1, tuesday: 2, wednesday: 3, thursday: 4,
    friday: 5, saturday: 6, sunday: 0
  };

  const dayMatch = message.match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
  if (!dayMatch || !dayMatch[1]) return '';

  const targetDay = dayMap[dayMatch[1].toLowerCase()];
  if (targetDay === undefined) return '';

  const today = new Date();
  const currentDay = today.getDay();

  let daysAhead = targetDay - currentDay;
  if (daysAhead <= 0) {
    daysAhead += 7;
  }

  const date = new Date(today);
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString().split('T')[0] ?? '';
}
