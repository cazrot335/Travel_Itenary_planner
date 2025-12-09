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
    'I want to travel with my friend',
    "What's the best time to visit the beach?",
  ];

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');

    const timestamp = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    // Add user message
    setMessages((prev) => [
      ...prev,
      {
        text: userMessage,
        sender: 'user',
        timestamp,
      },
    ]);

    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: userMessage,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      // expected shape:
      // {
      //   completeness: number;
      //   itinerary?: { destination, startDate, endDate, totalBudget, budgetBreakdown, days };
      //   nextQuestion?: string;
      //   aiReasoning?: string;
      //   suggestions?: string[];
      // }

      if (typeof data.completeness === 'number') {
        setCompleteness(data.completeness);
      }

      if (data.itinerary) {
        setItinerary(data.itinerary);
      }

      const aiText =
        data.nextQuestion ||
        data.aiReasoning ||
        "I'm here to help plan your trip!";

      setMessages((prev) => [
        ...prev,
        {
          text: aiText,
          sender: 'ai',
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          suggestions: data.suggestions,
          completeness: data.completeness,
        },
      ]);
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          text: 'Sorry, something went wrong. Please try again.',
          sender: 'ai',
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
  };

  const handleKeyDown = (e) => {
    // use keyDown instead of deprecated keyPress on modern React [web:32][web:35][web:44]
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      {/* Header */}
      <div className="border-b border-blue-200 bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-blue-900">
              ✈️ Travel Itinerary Planner
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Chat about your trip and get a tailored day-by-day plan.
            </p>
          </div>
          {completeness > 0 && (
            <div className="hidden md:flex flex-col items-end">
              <span className="text-xs text-gray-500 mb-1">
                Trip info completeness
              </span>
              <div className="w-40 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${Math.min(completeness, 100)}%` }}
                />
              </div>
              <span className="text-xs text-gray-600 mt-1">
                {Math.round(Math.min(completeness, 100))}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-8">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full max-w-4xl mx-auto">
            <div className="mb-6 rounded-full bg-blue-100 p-4">
              <Sparkles className="w-10 h-10 text-blue-500" strokeWidth={1} />
            </div>

            <h2 className="text-4xl font-normal text-gray-900 mb-2 text-center">
              Plan Your Perfect Trip
            </h2>
            <p className="text-lg text-gray-600 mb-10 text-center">
              Tell the assistant about your travel plans and get a personalized
              itinerary in minutes.
            </p>

            <div className="w-full max-w-5xl">
              <p className="text-sm text-gray-600 mb-4 px-1 font-semibold">
                Try asking about:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="bg-white text-left p-5 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 text-gray-700 text-sm border border-gray-200 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    <div className="font-semibold text-blue-600 mb-1">💡</div>
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div>
            {/* Itinerary summary */}
            {itinerary && (
              <div className="max-w-4xl mx-auto mb-8">
                <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 rounded-2xl p-8 shadow-lg">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <h2 className="text-3xl font-bold text-gray-900">
                      🎉 Your Itinerary is Ready!
                    </h2>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Trip Duration</p>
                      <p className="text-lg font-semibold text-green-600">
                        {(itinerary.days && itinerary.days.length) || 0} Days
                      </p>
                    </div>
                  </div>

                  {/* Trip Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 pb-8 border-b-2 border-green-200">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">
                        Destination
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {itinerary.destination || 'TBD'}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">
                        Start Date
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {itinerary.startDate || 'TBD'}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">
                        End Date
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {itinerary.endDate || 'TBD'}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">
                        Total Budget
                      </p>
                      <p className="text-lg font-bold text-green-600">
                        {typeof itinerary.totalBudget === 'number'
                          ? `₹${itinerary.totalBudget.toLocaleString()}`
                          : '₹0'}
                      </p>
                    </div>
                  </div>

                  {/* Budget Breakdown */}
                  {itinerary.budgetBreakdown && (
                    <div className="mb-8">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">
                        💰 Budget Breakdown
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {Object.entries(itinerary.budgetBreakdown).map(
                          ([category, amount]) => (
                            <div
                              key={category}
                              className="bg-white rounded-lg p-4 shadow-sm"
                            >
                              <p className="text-sm text-gray-600 capitalize mb-2">
                                {category.replace(/([A-Z])/g, ' $1').trim()}
                              </p>
                              <p className="text-xl font-bold text-blue-600">
                                ₹{Number(amount).toLocaleString()}
                              </p>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {/* Day-by-Day Schedule */}
                  {itinerary.days && itinerary.days.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4">
                        📅 Day-by-Day Schedule
                      </h3>
                      <div className="space-y-4">
                        {itinerary.days.map((day, dayIndex) => (
                          <div
                            key={dayIndex}
                            className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-blue-500"
                          >
                            <h4 className="text-lg font-bold text-gray-900 mb-4">
                              Day {day.day}: {day.title}
                            </h4>
                            <div className="space-y-3">
                              {day.activities &&
                                day.activities.map((activity, actIndex) => (
                                  <div
                                    key={actIndex}
                                    className="flex gap-4 pb-3 border-b border-gray-100 last:border-b-0"
                                  >
                                    <div className="min-w-fit">
                                      <p className="font-semibold text-gray-700">
                                        {activity.time}
                                      </p>
                                    </div>
                                    <div className="flex-1">
                                      <p className="font-semibold text-gray-900">
                                        {activity.activity}
                                      </p>
                                      {activity.location && (
                                        <p className="text-sm text-gray-600">
                                          📍 {activity.location}
                                        </p>
                                      )}
                                      {activity.duration && (
                                        <p className="text-sm text-gray-600">
                                          ⏱️ {activity.duration}
                                        </p>
                                      )}
                                      {typeof activity.estimatedCost ===
                                        'number' && (
                                        <p className="text-sm font-semibold text-green-600">
                                          💵 ₹{activity.estimatedCost}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Chat messages */}
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((message, index) => (
                <div key={index}>
                  <div
                    className={`flex ${
                      message.sender === 'user'
                        ? 'justify-end'
                        : 'justify-start'
                    }`}
                  >
                    <div
                      className={`relative max-w-2xl px-4 py-3 rounded-2xl text-sm md:text-base ${
                        message.sender === 'user'
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-white text-gray-800 shadow-sm rounded-bl-none'
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>

                  {/* Inline completeness chip under AI messages */}
                  {message.sender === 'ai' &&
                    typeof message.completeness === 'number' && (
                      <div className="mt-2 flex gap-2 px-2 items-center text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          Info completeness:{' '}
                          {Math.round(
                            Math.min(message.completeness, 100),
                          )}
                          %
                        </span>
                      </div>
                    )}

                  {/* AI follow-up suggestions below the last AI message */}
                  {message.sender === 'ai' &&
                    message.suggestions &&
                    message.suggestions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2 px-2">
                        {message.suggestions.map((s, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSuggestionClick(s)}
                            className="text-xs md:text-sm bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-full hover:bg-blue-50 hover:border-blue-300 transition-colors"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-800 px-4 py-3 rounded-2xl shadow-sm flex items-center gap-2">
                    <Loader className="w-5 h-5 animate-spin text-blue-600" />
                    <span className="text-sm text-gray-500">
                      Planning your trip...
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
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
              onKeyDown={handleKeyDown}
              placeholder="Tell me about your trip..."
              disabled={loading}
              className="flex-1 px-6 py-4 bg-transparent outline-none text-gray-800 placeholder-gray-400 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="mr-2 p-3 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
