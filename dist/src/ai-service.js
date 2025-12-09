/**
 * AI Service with Groq SDK Integration
 * Provides intelligent conversation, context understanding, and field extraction
 */
import Groq from 'groq-sdk';
const PRIORITY_QUESTIONS = [
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
 * Call Groq API for intelligent conversation
 */
export async function getAIResponse(userMessage, context) {
    const groqKey = process.env.GROQ_API_KEY;
    // Use Groq if available
    if (groqKey) {
        try {
            return await getGroqResponse(userMessage, context, groqKey);
        }
        catch (error) {
            console.error('[AI] Groq failed:', error instanceof Error ? error.message : error);
            console.log('[AI] Falling back to mock response');
        }
    }
    // Fallback to smart mock
    return getMockAIResponse(userMessage, context);
}
/**
 * Call Groq API using SDK
 */
async function getGroqResponse(userMessage, context, apiKey) {
    const groq = new Groq({ apiKey });
    const prompt = buildPrompt(userMessage, context);
    try {
        const response = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{
                    role: 'user',
                    content: prompt
                }],
            temperature: 0.7,
            max_tokens: 512,
            top_p: 0.9
        });
        const aiText = response.choices[0]?.message?.content || '';
        if (!aiText) {
            throw new Error('Empty response from Groq');
        }
        const parsed = parseAIResponse(aiText);
        console.log('[AI] Groq response received');
        return parsed;
    }
    catch (error) {
        throw new Error(`Groq SDK error: ${error instanceof Error ? error.message : error}`);
    }
}
/**
 * Build prompt for Groq to understand travel planning context
 */
function buildPrompt(userMessage, context) {
    const recentHistory = context.recentMessages
        .slice(-4)
        .map(m => `${m.role}: ${m.content}`)
        .join('\n');
    const checklist = Object.entries(context.currentChecklist)
        .filter(([_, v]) => v !== null && v !== undefined)
        .map(([k, v]) => `- ${k}: ${v}`)
        .join('\n');
    const missing = context.missingFields.join(', ') || 'none';
    return `You are a casual, friendly travel planning assistant for trips like Goa weekends.
Keep responses SHORT and natural (max 2 sentences).

Conversation so far:
${recentHistory || '(no previous messages)'}

Current Trip Details:
${checklist || 'Nothing collected yet'}

Missing Fields (in priority order):
${missing}

The user just said:
"${userMessage}"

CHECKLIST FIELDS:
- startDate, endDate, travelDays
- totalBudget
- startingCity
- tripTheme (adventure, relaxed, foodie, cultural, beach, mountain)
- groupType (solo, couple, family, team)
- transportMode (car, train, bus, flight, bike, walk, cycling)
- stayPreference (budget, midrange, luxury, homestay, hostel)
- adventureLevel (low, moderate, high)
- foodPreference (vegetarian, vegan, non-vegetarian, any)
- comfortLevel (budget, standard, premium)
- schedulePreference (relaxed, busy, flexible, packed)
- weatherPreference (cold, hot, rainy, monsoon, sunny, mild)
- safetyNeeds, specialRequirements
- avoidPlaces (array of strings)
- visitedPlaces (array of strings)

Instructions:
1. From the user's latest message, extract as many of the above fields as you can confidently infer.
2. Choose EXACTLY ONE missing field that is most important to ask about next (from the Missing Fields list).
3. Write a friendly message that:
   - acknowledges what they said in 1–2 words ("Got it!", "Nice!", "Cool!")
   - then asks ONE clear, natural question about that chosen field only.
4. Do NOT repeat a field that already has a value in Current Trip Details.
5. If all CRITICAL fields are filled:
   - CRITICAL = startDate, travelDays or endDate, totalBudget, startingCity, groupType, tripTheme, stayPreference
   - then set "nextAction" to "generate_itinerary" instead of "ask_question" and you may skip asking a new question.

Return VALID JSON ONLY in this exact shape:
{
  "message": "Got it! [one natural question or a short confirmation if generating itinerary]",
  "extractedFields": {
    "startDate": "2025-12-12",
    "endDate": "2025-12-14",
    "travelDays": 3,
    "totalBudget": 15000,
    "groupType": "team",
    "tripTheme": "adventure",
    "stayPreference": "hostel"
  },
  "nextField": "schedulePreference",
  "nextAction": "ask_question",
  "confidence": 0.9,
  "reasoning": "brief reason of what was extracted and why this field is next"
}`;
}
/**
 * Parse AI response from Gemini
 */
function parseAIResponse(aiText) {
    try {
        // Extract JSON from response (Gemini might wrap it)
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if (!jsonMatch)
            throw new Error('No JSON found');
        const parsed = JSON.parse(jsonMatch[0]);
        return {
            message: parsed.message || 'Got it!',
            extractedFields: parsed.extractedFields || {},
            nextAction: parsed.nextAction || 'ask_question',
            nextField: parsed.nextField, // <- pass through
            confidence: parsed.confidence || 0.8,
            reasoning: parsed.reasoning || ''
        };
    }
    catch (error) {
        console.warn('Parse error:', error);
        return getMockAIResponse('', { recentMessages: [], currentChecklist: {}, completenessPercentage: 0, missingFields: [] });
    }
}
/**
 * Fallback mock response when API unavailable
 * Provides intelligent defaults based on context
 */
function getMockAIResponse(userMessage, context) {
    // If itinerary already generated, don't ask more questions
    if (context.itineraryGenerated) {
        return {
            message: 'Your itinerary is ready! Feel free to ask me for modifications or additional details about any part of your trip.',
            extractedFields: {},
            nextAction: 'ask_question',
            confidence: 0.9,
            reasoning: 'Itinerary already generated, providing support message'
        };
    }
    // Enough info? ask to generate (75% of critical fields)
    if (context.completenessPercentage >= 75) {
        return {
            message: 'Perfect! Let me create your itinerary now.',
            extractedFields: {},
            nextAction: 'generate_itinerary',
            confidence: 0.95,
            reasoning: 'Sufficient data at 75% completeness'
        };
    }
    const current = context.currentChecklist || {};
    // Walk priority list in order and pick first missing field
    const nextField = PRIORITY_QUESTIONS.find(field => {
        const value = current[field];
        return value === null || value === undefined || (Array.isArray(value) && value.length === 0);
    });
    let nextQuestion;
    switch (nextField) {
        case 'startingCity':
            nextQuestion = 'Which city are you starting from?';
            break;
        case 'totalBudget':
            nextQuestion = 'What\'s your total budget for this trip (approx in INR)?';
            break;
        case 'groupType':
            nextQuestion = 'Who are you traveling with – solo, a partner, family, or friends/team?';
            break;
        case 'tripTheme':
            nextQuestion = 'What kind of vibe are you looking for – adventure, relaxed, beach, nightlife, or mixed?';
            break;
        case 'startDate':
            nextQuestion = 'On which date are you planning to start the trip?';
            break;
        case 'travelDays':
            nextQuestion = 'How many days do you want to travel?';
            break;
        case 'transportMode':
            nextQuestion = 'What transport do you prefer – car, bus, train, flight, or bike?';
            break;
        case 'stayPreference':
            nextQuestion = 'What kind of stay are you looking for – hostel, budget hotel, homestay, or luxury?';
            break;
        case 'adventureLevel':
            nextQuestion = 'What\'s your adventure level – low, moderate, or high?';
            break;
        case 'foodPreference':
            nextQuestion = 'Any food preference – veg, non-veg, seafood, or anything?';
            break;
        case 'schedulePreference':
            nextQuestion = 'Do you want a relaxed schedule or a packed day-by-day plan?';
            break;
        case 'comfortLevel':
            nextQuestion = 'Comfort level – budget, standard, or premium?';
            break;
        case 'weatherPreference':
            nextQuestion = 'Any weather preference – sunny, cool, or something specific?';
            break;
        case 'safetyNeeds':
            nextQuestion = 'Any safety or health needs I should keep in mind?';
            break;
        case 'specialRequirements':
            nextQuestion = 'Any special requirements – kids, elders, pets, accessibility?';
            break;
        case 'avoidPlaces':
            nextQuestion = 'Anything you definitely want to avoid – crowded spots, pubs, long treks?';
            break;
        case 'visitedPlaces':
            nextQuestion = 'Any places in Goa you\'ve already visited and want to skip this time?';
            break;
        default:
            nextQuestion = 'Anything else important for this trip that I should know?';
    }
    return {
        message: `Got it! ${nextQuestion}`,
        extractedFields: {},
        nextAction: 'ask_question',
        confidence: 0.85,
        reasoning: nextField
            ? `Asking for next missing field: ${nextField}`
            : 'No critical fields missing, asking open follow-up'
    };
}
/**
 * Generate smart suggestions based on user preferences
 */
export function generateSmartSuggestions(checklist) {
    const suggestions = [];
    if (checklist.totalBudget && checklist.totalBudget < 5000) {
        suggestions.push('💰 Budget tip: Focus on local transport and homestays to maximize your budget');
    }
    if (checklist.adventureLevel === 'high') {
        suggestions.push('🏔️ Adventure hint: Consider monsoon season for water sports, summer for trekking');
    }
    if (checklist.groupType === 'family') {
        suggestions.push('👨‍👩‍👧‍👦 Family travel: Look for destinations with kid-friendly activities and safe infrastructure');
    }
    if (checklist.tripTheme === 'foodie') {
        suggestions.push('🍜 Food lover: Visit local markets and street food areas for authentic experiences');
    }
    if (checklist.startingCity === 'delhi' || checklist.startingCity === 'bangalore') {
        suggestions.push('📍 Location tip: Consider nearby hill stations for quick getaways');
    }
    return suggestions;
}
/**
 * Understand conversation flow and predict next fields
 */
export function predictNextFields(history, current) {
    const allFields = [
        'startDate', 'endDate', 'travelDays', 'totalBudget', 'startingCity',
        'tripTheme', 'groupType', 'transportMode', 'stayPreference',
        'adventureLevel', 'foodPreference', 'schedulePreference',
        'weatherPreference', 'safetyNeeds', 'specialRequirements'
    ];
    return allFields.filter(field => current[field] === null ||
        current[field] === undefined);
}
/**
 * Refine checklist based on AI understanding
 */
export function refineChecklistWithAI(checklist, aiExtracted) {
    const refined = { ...checklist };
    for (const [key, value] of Object.entries(aiExtracted)) {
        if (value !== null && value !== undefined && !checklist[key]) {
            refined[key] = value;
        }
    }
    return refined;
}
