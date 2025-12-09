import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader } from 'lucide-react';

export default function TravelChatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(`session-${Date.now()}`);
  const [completeness, setCompleteness] = useState(0);
  const [itinerary, setItinerary] = useState(null);
  const messagesEndRef = useRef(null);

  const suggestions = [
    "I'm planning a trip to Goa",
    "I want to travel with my friend",
    "What's the best time to visit the beach?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (input.trim()) {
      const userMessage = input;
      setInput('');
      
      // Add user message
      setMessages(prev => [...prev, { 
        text: userMessage, 
        sender: 'user',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      
      setLoading(true);
      
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            sessionId, 
            message: userMessage 
          })
        });

        if (!response.ok) throw new Error('Failed to get response');
        
        const data = await response.json();
        
        // Update completeness
        setCompleteness(data.completeness);
        
        // Check for itinerary
        if (data.itinerary) {
          setItinerary(data.itinerary);
        }

        // Add AI response
        setMessages(prev => [...prev, { 
          text: data.nextQuestion || data.aiReasoning, 
          sender: 'ai',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestions: data.suggestions,
          completeness: data.completeness
        }]);
      } catch (error) {
        console.error('Error:', error);
        setMessages(prev => [...prev, { 
          text: 'Sorry, I encountered an error. Please try again.', 
          sender: 'ai',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      {/* Header */}
      <div className="border-b border-blue-200 bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-semibold text-blue-900">✈️ Travel Itinerary Planner</h1>
          {completeness > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="text-sm text-gray-600">Trip Planning Progress</div>
              <div className="w-32 h-2 bg-gray-300 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300"
                  style={{ width: `${completeness}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-blue-600">{completeness}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-8">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full max-w-4xl mx-auto">
            <div className="mb-6">
              <Sparkles className="w-16 h-16 text-blue-500" strokeWidth={1} />
            </div>
            
            <h2 className="text-4xl font-normal text-gray-900 mb-2">
              Plan Your Perfect Trip
            </h2>
            <p className="text-lg text-gray-600 mb-16">
              Tell me about your travel dreams and I'll create a personalized itinerary
            </p>

            <div className="w-full max-w-5xl">
              <p className="text-sm text-gray-600 mb-4 px-1 font-semibold">
                Try asking about:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="bg-white text-left p-5 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 text-gray-700 text-sm border border-gray-200 hover:bg-blue-50"
                  >
                    <div className="font-semibold text-blue-600 mb-1">💡</div>
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((message, index) => (
              <div key={index}>
                <div
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-2xl px-4 py-3 rounded-2xl ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-800 shadow-sm'
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
                
                {message.sender === 'ai' && message.completeness && (
                  <div className="mt-2 flex gap-2 px-2 items-center">
                    <div className="text-xs text-gray-500">Progress: {message.completeness}%</div>
                    <div className="w-20 h-1 bg-gray-300 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500"
                        style={{ width: `${message.completeness}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 px-4 py-3 rounded-2xl shadow-sm">
                  <Loader className="w-5 h-5 animate-spin text-blue-600" />
                </div>
              </div>
            )}
            
            {itinerary && (
              <div className="mt-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6">
                <h3 className="text-xl font-bold text-green-700 mb-4">✨ Your Itinerary is Ready!</h3>
                <div className="space-y-3">
                  <div><strong>📍 Destination:</strong> {itinerary.destination || 'N/A'}</div>
                  <div><strong>📅 Duration:</strong> {itinerary.days || 'N/A'} days</div>
                  <div><strong>💰 Budget:</strong> {itinerary.totalBudget || 'N/A'}</div>
                  <div><strong>🎯 Theme:</strong> {itinerary.theme || 'N/A'}</div>
                </div>
                
                {itinerary.dayPlan && itinerary.dayPlan.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <h4 className="font-semibold text-gray-800">Day-by-Day Plan:</h4>
                    {itinerary.dayPlan.map((day, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-lg">
                        <div className="font-semibold text-blue-600">{day.title}</div>
                        <div className="text-sm text-gray-700 mt-1">
                          <div>🌅 Morning: {day.morning || 'Rest'}</div>
                          <div>☀️ Afternoon: {day.afternoon || 'Explore'}</div>
                          <div>🌙 Evening: {day.evening || 'Relax'}</div>
                          <div className="mt-1 text-green-600 font-semibold">💵 {day.estimatedBudget}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white px-4 py-6">
        <div className="max-w-5xl mx-auto">
          <div className="relative flex items-center bg-white border border-gray-300 rounded-full shadow-sm hover:shadow-md transition-shadow duration-200">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Tell me about your trip..."
              disabled={loading}
              className="flex-1 px-6 py-4 bg-transparent outline-none text-gray-800 placeholder-gray-400 disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="mr-2 p-3 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
