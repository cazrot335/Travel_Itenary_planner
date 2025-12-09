/**
 * AI Service with Gemini Integration
 * Provides intelligent conversation, context understanding, and field extraction
 */

import { TripChecklist, ConversationMessage, ChatSession } from './types/checklist.js';

interface AIResponse {
  message: string;
  extractedFields: Partial<TripChecklist>;
  nextAction: 'ask_question' | 'generate_itinerary' | 'refine_preferences' | 'clarify';
  confidence: number;
  reasoning: string;
}

interface ConversationContext {
  recentMessages: ConversationMessage[];
  currentChecklist: Partial<TripChecklist>;
  completenessPercentage: number;
  missingFields: string[];
}

/**
 * Call Gemini API for intelligent conversation
 */
export async function getAIResponse(
  userMessage: string,
  context: ConversationContext
): Promise<AIResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  // If no API key, return mock response
  if (!apiKey) {
    console.log('[AI] No API key, using mock response');
    return getMockAIResponse(userMessage, context);
  }

  try {
    const prompt = buildPrompt(userMessage, context);
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI] Gemini API error:', response.status, errorText);
      return getMockAIResponse(userMessage, context);
    }

    const data = await response.json() as any;
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!aiText) {
      console.warn('[AI] Empty response from Gemini, using mock');
      return getMockAIResponse(userMessage, context);
    }

    const parsed = parseAIResponse(aiText);
    console.log('[AI] Gemini response:', parsed.message.substring(0, 100));
    return parsed;
  } catch (error) {
    console.error('[AI] Service error:', error instanceof Error ? error.message : error);
    return getMockAIResponse(userMessage, context);
  }
}

/**
 * Build prompt for Gemini to understand travel planning context
 */
function buildPrompt(userMessage: string, context: ConversationContext): string {
  const recentHistory = context.recentMessages
    .slice(-4)
    .map(m => `${m.role}: ${m.content}`)
    .join('\n');

  const checklist = Object.entries(context.currentChecklist)
    .filter(([_, v]) => v !== null && v !== undefined)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n');

  return `You are a travel planning chatbot. Respond ONLY with valid JSON.

CONTEXT:
- Completeness: ${context.completenessPercentage}%
- Missing: ${context.missingFields.join(', ') || 'None'}

USER: "${userMessage}"

RULES:
1. If completeness >= 70%, set nextAction to "generate_itinerary"
2. Otherwise, set nextAction to "ask_question"
3. Keep message SHORT (1-2 sentences)
4. Extract any travel details user mentioned
5. Return VALID JSON ONLY - no other text

RESPOND WITH THIS JSON EXACTLY:
{
  "message": "Your response here",
  "extractedFields": {},
  "nextAction": "ask_question|generate_itinerary",
  "confidence": 0.8,
  "reasoning": "Your reasoning"
}`;
}

/**
 * Parse AI response from Gemini
 */
function parseAIResponse(aiText: string): AIResponse {
  try {
    // Extract JSON from response (Gemini might wrap it)
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      message: parsed.message || 'Got it!',
      extractedFields: parsed.extractedFields || {},
      nextAction: parsed.nextAction || 'ask_question',
      confidence: parsed.confidence || 0.8,
      reasoning: parsed.reasoning || ''
    };
  } catch (error) {
    console.warn('Parse error:', error);
    return getMockAIResponse('', { recentMessages: [], currentChecklist: {}, completenessPercentage: 0, missingFields: [] });
  }
}

/**
 * Fallback mock response when API unavailable
 * Provides intelligent defaults based on context
 */
function getMockAIResponse(userMessage: string, context: ConversationContext): AIResponse {
  const lower = userMessage.toLowerCase();
  const missing = context.missingFields[0];
  
  // Smart fallbacks based on what's missing
  let message = 'Thanks for that info! ';
  let nextQuestion = 'dates';
  
  if (context.completenessPercentage >= 70) {
    return {
      message: '🎉 I have enough info! Generating your personalized itinerary now...',
      extractedFields: {},
      nextAction: 'generate_itinerary',
      confidence: 0.95,
      reasoning: 'Sufficient data collected for itinerary generation at 70% completeness'
    };
  }

  // Smart question selection based on missing fields
  if (missing === 'startDate' || missing === 'endDate') {
    message += 'When are you thinking of traveling? Give me dates or duration.';
  } else if (missing === 'groupType') {
    message += 'Are you traveling solo, with partner, family, or a team?';
  } else if (missing === 'transportMode') {
    message += 'How do you prefer to travel - flight, train, car, bus, or bike?';
  } else if (missing === 'stayPreference') {
    message += 'What\'s your accommodation preference - budget hostels, mid-range hotels, or luxury resorts?';
  } else if (missing === 'tripTheme') {
    message += 'What kind of trip appeals to you - adventure, relaxation, food & culture, beaches, or something else?';
  } else {
    message += `Tell me more about your ${missing?.replace(/([A-Z])/g, ' $1').toLowerCase()} preference.`;
  }

  return {
    message,
    extractedFields: {},
    nextAction: 'ask_question',
    confidence: 0.7,
    reasoning: `Smart fallback: Asking about missing field - ${missing}`
  };
}

/**
 * Generate smart suggestions based on user preferences
 */
export function generateSmartSuggestions(checklist: Partial<TripChecklist>): string[] {
  const suggestions: string[] = [];

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
export function predictNextFields(history: ConversationMessage[], current: Partial<TripChecklist>): string[] {
  const allFields = [
    'startDate', 'endDate', 'travelDays', 'totalBudget', 'startingCity',
    'tripTheme', 'groupType', 'transportMode', 'stayPreference',
    'adventureLevel', 'foodPreference', 'schedulePreference',
    'weatherPreference', 'safetyNeeds', 'specialRequirements'
  ];

  return allFields.filter(field => 
    current[field as keyof TripChecklist] === null || 
    current[field as keyof TripChecklist] === undefined
  );
}

/**
 * Refine checklist based on AI understanding
 */
export function refineChecklistWithAI(
  checklist: TripChecklist,
  aiExtracted: Partial<TripChecklist>
): TripChecklist {
  const refined = { ...checklist };

  for (const [key, value] of Object.entries(aiExtracted)) {
    if (value !== null && value !== undefined && !checklist[key as keyof TripChecklist]) {
      (refined as any)[key] = value;
    }
  }

  return refined;
}
