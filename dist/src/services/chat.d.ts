/**
 * Chat Service - AI-Powered Version
 * Natural conversation flow with Gemini integration
 */
import { ChatSession, ChatResponse } from './../types/checklist.js';
/**
 * Initialize chat session or load existing one
 */
export declare function initializeSession(sessionId: string): Promise<ChatSession>;
/**
 * Main chat handler - AI-powered natural conversation
 */
export declare function chat(sessionId: string, userMessage: string): Promise<ChatResponse>;
/**
 * Reset session
 */
export declare function resetSession(sessionId: string): Promise<void>;
export type { ChatSession, ChatResponse };
//# sourceMappingURL=chat.d.ts.map