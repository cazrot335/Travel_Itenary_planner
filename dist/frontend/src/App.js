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
        if (!input.trim() || loading)
            return;
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
            const aiText = data.nextQuestion ||
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
        }
        catch (error) {
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
        }
        finally {
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
    return (React.createElement("div", { className: "flex flex-col h-screen bg-gradient-to-b from-blue-50 to-blue-100" },
        React.createElement("div", { className: "border-b border-blue-200 bg-white shadow-sm" },
            React.createElement("div", { className: "max-w-5xl mx-auto px-4 py-4 flex items-center justify-between" },
                React.createElement("div", null,
                    React.createElement("h1", { className: "text-2xl font-semibold text-blue-900" }, "\u2708\uFE0F Travel Itinerary Planner"),
                    React.createElement("p", { className: "text-sm text-gray-500 mt-1" }, "Chat about your trip and get a tailored day-by-day plan.")),
                completeness > 0 && (React.createElement("div", { className: "hidden md:flex flex-col items-end" },
                    React.createElement("span", { className: "text-xs text-gray-500 mb-1" }, "Trip info completeness"),
                    React.createElement("div", { className: "w-40 h-2 bg-gray-200 rounded-full overflow-hidden" },
                        React.createElement("div", { className: "h-full bg-blue-500 transition-all", style: { width: `${Math.min(completeness, 100)}%` } })),
                    React.createElement("span", { className: "text-xs text-gray-600 mt-1" },
                        Math.round(Math.min(completeness, 100)),
                        "%"))))),
        React.createElement("div", { className: "flex-1 overflow-y-auto px-4 py-8" }, messages.length === 0 ? (React.createElement("div", { className: "flex flex-col items-center justify-center h-full max-w-4xl mx-auto" },
            React.createElement("div", { className: "mb-6 rounded-full bg-blue-100 p-4" },
                React.createElement(Sparkles, { className: "w-10 h-10 text-blue-500", strokeWidth: 1 })),
            React.createElement("h2", { className: "text-4xl font-normal text-gray-900 mb-2 text-center" }, "Plan Your Perfect Trip"),
            React.createElement("p", { className: "text-lg text-gray-600 mb-10 text-center" }, "Tell the assistant about your travel plans and get a personalized itinerary in minutes."),
            React.createElement("div", { className: "w-full max-w-5xl" },
                React.createElement("p", { className: "text-sm text-gray-600 mb-4 px-1 font-semibold" }, "Try asking about:"),
                React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-3" }, suggestions.map((suggestion, index) => (React.createElement("button", { key: index, type: "button", onClick: () => handleSuggestionClick(suggestion), className: "bg-white text-left p-5 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 text-gray-700 text-sm border border-gray-200 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300" },
                    React.createElement("div", { className: "font-semibold text-blue-600 mb-1" }, "\uD83D\uDCA1"),
                    suggestion))))))) : (React.createElement("div", null,
            itinerary && (React.createElement("div", { className: "max-w-4xl mx-auto mb-8" },
                React.createElement("div", { className: "bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 rounded-2xl p-8 shadow-lg" },
                    React.createElement("div", { className: "flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6" },
                        React.createElement("h2", { className: "text-3xl font-bold text-gray-900" }, "\uD83C\uDF89 Your Itinerary is Ready!"),
                        React.createElement("div", { className: "text-right" },
                            React.createElement("p", { className: "text-sm text-gray-600" }, "Trip Duration"),
                            React.createElement("p", { className: "text-lg font-semibold text-green-600" },
                                (itinerary.days && itinerary.days.length) || 0,
                                " Days"))),
                    React.createElement("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 pb-8 border-b-2 border-green-200" },
                        React.createElement("div", { className: "bg-white rounded-lg p-4 shadow-sm" },
                            React.createElement("p", { className: "text-xs text-gray-600 uppercase tracking-wide mb-1" }, "Destination"),
                            React.createElement("p", { className: "text-lg font-bold text-gray-900" }, itinerary.destination || 'TBD')),
                        React.createElement("div", { className: "bg-white rounded-lg p-4 shadow-sm" },
                            React.createElement("p", { className: "text-xs text-gray-600 uppercase tracking-wide mb-1" }, "Start Date"),
                            React.createElement("p", { className: "text-lg font-bold text-gray-900" }, itinerary.startDate || 'TBD')),
                        React.createElement("div", { className: "bg-white rounded-lg p-4 shadow-sm" },
                            React.createElement("p", { className: "text-xs text-gray-600 uppercase tracking-wide mb-1" }, "End Date"),
                            React.createElement("p", { className: "text-lg font-bold text-gray-900" }, itinerary.endDate || 'TBD')),
                        React.createElement("div", { className: "bg-white rounded-lg p-4 shadow-sm" },
                            React.createElement("p", { className: "text-xs text-gray-600 uppercase tracking-wide mb-1" }, "Total Budget"),
                            React.createElement("p", { className: "text-lg font-bold text-green-600" }, typeof itinerary.totalBudget === 'number'
                                ? `₹${itinerary.totalBudget.toLocaleString()}`
                                : '₹0'))),
                    itinerary.budgetBreakdown && (React.createElement("div", { className: "mb-8" },
                        React.createElement("h3", { className: "text-xl font-bold text-gray-900 mb-4" }, "\uD83D\uDCB0 Budget Breakdown"),
                        React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4" }, Object.entries(itinerary.budgetBreakdown).map(([category, amount]) => (React.createElement("div", { key: category, className: "bg-white rounded-lg p-4 shadow-sm" },
                            React.createElement("p", { className: "text-sm text-gray-600 capitalize mb-2" }, category.replace(/([A-Z])/g, ' $1').trim()),
                            React.createElement("p", { className: "text-xl font-bold text-blue-600" },
                                "\u20B9",
                                Number(amount).toLocaleString()))))))),
                    itinerary.days && itinerary.days.length > 0 && (React.createElement("div", null,
                        React.createElement("h3", { className: "text-xl font-bold text-gray-900 mb-4" }, "\uD83D\uDCC5 Day-by-Day Schedule"),
                        React.createElement("div", { className: "space-y-4" }, itinerary.days.map((day, dayIndex) => (React.createElement("div", { key: dayIndex, className: "bg-white rounded-lg p-6 shadow-sm border-l-4 border-blue-500" },
                            React.createElement("h4", { className: "text-lg font-bold text-gray-900 mb-4" },
                                "Day ",
                                day.day,
                                ": ",
                                day.title),
                            React.createElement("div", { className: "space-y-3" }, day.activities &&
                                day.activities.map((activity, actIndex) => (React.createElement("div", { key: actIndex, className: "flex gap-4 pb-3 border-b border-gray-100 last:border-b-0" },
                                    React.createElement("div", { className: "min-w-fit" },
                                        React.createElement("p", { className: "font-semibold text-gray-700" }, activity.time)),
                                    React.createElement("div", { className: "flex-1" },
                                        React.createElement("p", { className: "font-semibold text-gray-900" }, activity.activity),
                                        activity.location && (React.createElement("p", { className: "text-sm text-gray-600" },
                                            "\uD83D\uDCCD ",
                                            activity.location)),
                                        activity.duration && (React.createElement("p", { className: "text-sm text-gray-600" },
                                            "\u23F1\uFE0F ",
                                            activity.duration)),
                                        typeof activity.estimatedCost ===
                                            'number' && (React.createElement("p", { className: "text-sm font-semibold text-green-600" },
                                            "\uD83D\uDCB5 \u20B9",
                                            activity.estimatedCost)))))))))))))))),
            React.createElement("div", { className: "max-w-3xl mx-auto space-y-4" },
                messages.map((message, index) => (React.createElement("div", { key: index },
                    React.createElement("div", { className: `flex ${message.sender === 'user'
                            ? 'justify-end'
                            : 'justify-start'}` },
                        React.createElement("div", { className: `relative max-w-2xl px-4 py-3 rounded-2xl text-sm md:text-base ${message.sender === 'user'
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : 'bg-white text-gray-800 shadow-sm rounded-bl-none'}` }, message.text)),
                    message.sender === 'ai' &&
                        typeof message.completeness === 'number' && (React.createElement("div", { className: "mt-2 flex gap-2 px-2 items-center text-xs text-gray-500" },
                        React.createElement("span", { className: "inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-full" },
                            React.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-blue-500" }),
                            "Info completeness:",
                            ' ',
                            Math.round(Math.min(message.completeness, 100)),
                            "%"))),
                    message.sender === 'ai' &&
                        message.suggestions &&
                        message.suggestions.length > 0 && (React.createElement("div", { className: "mt-3 flex flex-wrap gap-2 px-2" }, message.suggestions.map((s, idx) => (React.createElement("button", { key: idx, type: "button", onClick: () => handleSuggestionClick(s), className: "text-xs md:text-sm bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-full hover:bg-blue-50 hover:border-blue-300 transition-colors" }, s)))))))),
                loading && (React.createElement("div", { className: "flex justify-start" },
                    React.createElement("div", { className: "bg-white text-gray-800 px-4 py-3 rounded-2xl shadow-sm flex items-center gap-2" },
                        React.createElement(Loader, { className: "w-5 h-5 animate-spin text-blue-600" }),
                        React.createElement("span", { className: "text-sm text-gray-500" }, "Planning your trip...")))),
                React.createElement("div", { ref: messagesEndRef }))))),
        React.createElement("div", { className: "border-t border-gray-200 bg-white px-4 py-6" },
            React.createElement("div", { className: "max-w-5xl mx-auto" },
                React.createElement("div", { className: "relative flex items-center bg-white border border-gray-300 rounded-full shadow-sm hover:shadow-md transition-shadow duration-200" },
                    React.createElement("input", { type: "text", value: input, onChange: (e) => setInput(e.target.value), onKeyDown: handleKeyDown, placeholder: "Tell me about your trip...", disabled: loading, className: "flex-1 px-6 py-4 bg-transparent outline-none text-gray-800 placeholder-gray-400 disabled:opacity-50" }),
                    React.createElement("button", { type: "button", onClick: handleSend, disabled: loading || !input.trim(), className: "mr-2 p-3 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50" }, loading ? (React.createElement(Loader, { className: "w-5 h-5 animate-spin" })) : (React.createElement(Send, { className: "w-5 h-5" }))))))));
}
