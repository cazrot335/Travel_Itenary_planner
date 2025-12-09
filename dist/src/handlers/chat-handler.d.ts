/**
 * Travel Chat API Handlers
 * Hono.js endpoints for chat and itinerary generation
 */
import { Hono } from 'hono';
type Variables = {
    startTime: number;
};
declare const app: Hono<{
    Variables: Variables;
}, import("hono/types").BlankSchema, "/">;
export default app;
//# sourceMappingURL=chat-handler.d.ts.map