/**
 * Travel Itinerary Checklist Types
 * Defines all checklist fields, enums, and interfaces for trip planning
 */
/**
 * Constants for checklist
 */
export const CHECKLIST_FIELDS = [
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
export const PRIORITY_QUESTIONS = [
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
export function createEmptyChecklist() {
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
export function calculateCompleteness(checklist) {
    const filled = Object.values(checklist).filter(v => v !== null && v !== undefined && v !== '' && (!Array.isArray(v) || v.length > 0)).length;
    return Math.round((filled / CHECKLIST_FIELDS.length) * 100);
}
