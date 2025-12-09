/**
 * Local Development Server
 * Run the travel chat API locally without Raindrop deployment
 * Raindrop services use mock implementations for development
 */
import 'dotenv/config';
import { createServer } from 'http';
import app from './handlers/chat-handler.js';
const port = parseInt(process.env.PORT || '3000', 10);
console.log('🚀 Travel Chat API Server Starting...');
console.log(`📡 Listening on http://localhost:${port}`);
console.log('');
console.log('Available endpoints:');
console.log(`  POST   http://localhost:${port}/api/chat`);
console.log(`  GET    http://localhost:${port}/api/session/:sessionId`);
console.log(`  POST   http://localhost:${port}/api/session/:sessionId/reset`);
console.log(`  POST   http://localhost:${port}/api/feedback`);
console.log(`  GET    http://localhost:${port}/api/health`);
console.log(`  GET    http://localhost:${port}/`);
console.log('');
console.log('Test the API:');
console.log(`  curl -X POST http://localhost:${port}/api/chat \\`);
console.log(`    -H "Content-Type: application/json" \\`);
console.log(`    -d '{"sessionId": "test-user", "message": "I want a 3-day trip to Goa with 10k budget"}'`);
console.log('');
const server = createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const hasBody = !['GET', 'HEAD'].includes(req.method || '');
    const request = new Request(url, {
        method: req.method,
        headers: req.headers,
        ...(hasBody && { body: req, duplex: 'half' })
    });
    const response = await app.fetch(request);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(await response.text());
});
server.listen(port, () => {
    console.log(`✅ Server ready at http://localhost:${port}`);
});
