/**
 * AI Service with Gemini Integration
 * Provides intelligent conversation, context understanding, and field extraction
 */
import { TripChecklist, ConversationMessage } from './types/checklist.js';
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
export declare function getAIResponse(userMessage: string, context: ConversationContext): Promise<AIResponse>;
/**
 * Generate smart suggestions based on user preferences
 */
export declare function generateSmartSuggestions(checklist: Partial<TripChecklist>): string[];
/**
 * Understand conversation flow and predict next fields
 */
export declare function predictNextFields(history: ConversationMessage[], current: Partial<TripChecklist>): string[];
/**
 * Refine checklist based on AI understanding
 */
export declare function refineChecklistWithAI(checklist: TripChecklist, aiExtracted: Partial<TripChecklist>): TripChecklist;
export {};
//# sourceMappingURL=ai-service.d.ts.map