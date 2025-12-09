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
/**
 * Critical fields needed for itinerary generation
 */
export const CRITICAL_FIELDS = [
    'startDate',
    'endDate',
    'travelDays',
    'totalBudget',
    'startingCity',
    'groupType',
    'stayPreference',
    'schedulePreference'
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
    // Only count critical fields for completeness
    const criticalFilled = CRITICAL_FIELDS.filter(field => checklist[field] !== null && checklist[field] !== undefined && checklist[field] !== '').length;
    // Return percentage of critical fields filled
    // Trigger itinerary generation at 75% of critical fields
    return Math.round((criticalFilled / CRITICAL_FIELDS.length) * 100);
}
