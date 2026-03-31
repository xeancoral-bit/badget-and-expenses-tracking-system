'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Loader2, User } from 'lucide-react';
import { useApp } from '@/lib/AppContext';

export default function Chat() {
    const { state, dispatch, refreshData } = useApp();
    const { chatOpen, chatMessages, theme } = state;
    const isDark = theme === 'dark';
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showWelcome, setShowWelcome] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatMessages]);

    const handleCloseWelcome = () => {
        setShowWelcome(false);
    };

    const addNotification = (message: string, type: 'success' | 'error' | 'info') => {
        dispatch({ type: 'ADD_NOTIFICATION', payload: { message, type } });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setIsLoading(true);

        // Add user message immediately
        dispatch({ type: 'ADD_CHAT_MESSAGE', payload: { role: 'user', content: userMessage } });

        // Add notification for user message
        addNotification(`You: ${userMessage}`, 'info');

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage }),
            });

            const data = await response.json();

            if (data.error) {
                dispatch({ type: 'ADD_CHAT_MESSAGE', payload: { role: 'assistant', content: `Error: ${data.error}` } });
                addNotification(`Error: ${data.error}`, 'error');
            } else {
                dispatch({ type: 'ADD_CHAT_MESSAGE', payload: { role: 'assistant', content: data.response || "I processed your request, but I couldn't generate a specific response." } });
                addNotification('AI responded to your message', 'success');
            }

            // Refresh data if a transaction was added
            if (data.action === 'transaction_added') {
                refreshData();
                addNotification('Transaction added successfully!', 'success');
            }
        } catch (error) {
            dispatch({ type: 'ADD_CHAT_MESSAGE', payload: { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' } });
            addNotification('Chat error occurred', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const [isOpen, setIsOpen] = useState(chatOpen);

    useEffect(() => {
        setIsOpen(chatOpen);
    }, [chatOpen]);

    const toggleLocalChat = () => {
        dispatch({ type: 'TOGGLE_CHAT' });
    };

    return (
        <>
            {/* Floating FAB Trigger */}
            {!isOpen && (
                <button
                    onClick={toggleLocalChat}
                    className={`fixed bottom-8 right-8 w-16 h-16 rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 z-[60] group overflow-hidden
                        ${isDark 
                            ? 'bg-charcoal-accent text-white ring-2 ring-charcoal-accent/40 shadow-[0_0_30px_rgba(15,124,144,0.4)]' 
                            : 'bg-black text-white ring-2 ring-black/10 shadow-[0_10px_30px_rgba(0,0,0,0.2)]'
                        }`}
                >
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'bg-gradient-to-br from-charcoal-accent to-charcoal-accent-hover' : 'bg-slate-800'}`} />
                    <Sparkles className="relative z-10 animate-pulse" size={28} />
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className={`fixed bottom-8 right-8 h-[650px] w-[420px] rounded-3xl animate-fadeIn z-[60] flex flex-col shadow-2xl overflow-hidden
                    ${isDark 
                        ? 'glass-charcoal-light border-2 border-charcoal-accent/30 shadow-[0_30px_60px_rgba(0,0,0,0.6)] ring-1 ring-charcoal-accent/20' 
                        : 'bg-white border-2 border-black/5 shadow-[0_30px_60px_rgba(0,0,0,0.15)] ring-1 ring-black/5'
                    }`}>
                    {/* Premium Header */}
                    <div className={`p-6 backdrop-blur-xl border-b flex items-center justify-between
                        ${isDark 
                            ? 'bg-charcoal-tertiary/80 border-charcoal-border' 
                            : 'bg-black border-black/10'
                        }`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-charcoal-accent/20' : 'bg-white/10'}`}>
                                <Sparkles className={isDark ? 'text-charcoal-accent' : 'text-white'} size={22} />
                            </div>
                            <div>
                                <h3 className={`text-sm font-black tracking-wider uppercase ${isDark ? 'text-charcoal-text-primary' : 'text-white'}`}>SmartBudget Gemini AI</h3>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isDark ? 'bg-charcoal-success' : 'bg-emerald-400'}`} />
                                    <span className={`text-[10px] font-bold ${isDark ? 'text-charcoal-success' : 'text-emerald-400'}`}>Online & Learning</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={toggleLocalChat}
                            className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-charcoal-light text-charcoal-text-muted hover:text-charcoal-text-primary' : 'hover:bg-white/10 text-white/60 hover:text-white'}`}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages Container */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                        {/* Static Welcome if empty */}
                        {chatMessages.length === 0 && showWelcome && (
                            <div className="space-y-4 animate-fadeIn">
                                <div className={`p-5 rounded-2xl border transition-all ${isDark ? 'bg-charcoal-accent/20 border-charcoal-accent/40 shadow-lg shadow-charcoal-accent/5' : 'bg-slate-50 border-slate-200 shadow-sm'}`}>
                                    <h4 className={`font-bold mb-2 flex items-center gap-2 ${isDark ? 'text-charcoal-text-primary' : 'text-slate-900'}`}>
                                        Hello! I'm your AI strategist.
                                    </h4>
                                    <p className={`text-xs leading-relaxed mb-4 ${isDark ? 'text-charcoal-text-secondary' : 'text-slate-600'}`}>
                                        I can automate your expense tracking and provide deep financial insights. How can I help today?
                                    </p>
                                    <div className="grid grid-cols-1 gap-2">
                                        {[
                                            "Add ₱500 for groceries",
                                            "Analyze my spending habits",
                                            "What's my balance across accounts?",
                                            "Set a ₱5000 budget for health"
                                        ].map((tool, i) => (
                                            <button 
                                                key={i}
                                                onClick={() => setInput(tool)}
                                                className={`text-left px-3 py-2 rounded-lg text-xs transition-colors border ${isDark ? 'bg-charcoal-tertiary/40 hover:bg-charcoal-tertiary text-charcoal-text-primary border-charcoal-border/30' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-sm'}`}
                                            >
                                                {tool}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {chatMessages.map((msg, index) => (
                            <div
                                key={index}
                                className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${msg.role === 'user' 
                                    ? (isDark ? 'bg-charcoal-accent shadow-lg shadow-charcoal-accent/20' : 'bg-black shadow-lg shadow-black/10') 
                                    : (isDark ? 'bg-charcoal-tertiary border border-charcoal-border' : 'bg-slate-100 border border-slate-200')}`}>
                                    {msg.role === 'user' ? <User size={14} className="text-white" /> : <Sparkles size={14} className={isDark ? 'text-charcoal-accent' : 'text-slate-600'} />}
                                </div>
                                <div
                                    className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${msg.role === 'user'
                                        ? `${isDark ? 'bg-charcoal-accent' : 'bg-black'} text-white rounded-tr-sm`
                                        : `${isDark ? 'bg-charcoal-tertiary border border-charcoal-border' : 'bg-slate-100 border border-slate-200'} ${isDark ? 'text-charcoal-text-primary' : 'text-slate-800'} rounded-tl-sm`
                                        }`}
                                >
                                    <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-charcoal-tertiary border border-charcoal-border flex items-center justify-center">
                                    <Loader2 className="text-charcoal-accent animate-spin" size={14} />
                                </div>
                                <div className="bg-charcoal-tertiary border border-charcoal-border rounded-2xl p-4 rounded-tl-sm">
                                    <div className="flex gap-1">
                                        <div className="w-1.5 h-1.5 bg-charcoal-accent rounded-full animate-bounce" />
                                        <div className="w-1.5 h-1.5 bg-charcoal-accent rounded-full animate-bounce [animation-delay:0.2s]" />
                                        <div className="w-1.5 h-1.5 bg-charcoal-accent rounded-full animate-bounce [animation-delay:0.4s]" />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className={`p-6 border-t ${isDark ? 'bg-charcoal-tertiary/30 border-charcoal-border' : 'bg-slate-50 border-slate-200'}`}>
                        <form onSubmit={handleSubmit} className="relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Speak naturally..."
                                className={`w-full border-2 rounded-2xl py-4 pl-5 pr-14 text-sm transition-all shadow-inner focus:outline-none focus:ring-2
                                    ${isDark 
                                        ? 'bg-charcoal-secondary border-charcoal-accent/30 text-black placeholder:text-slate-400 focus:ring-charcoal-accent/50' 
                                        : 'bg-white border-slate-200 text-black placeholder:text-slate-400 focus:ring-black/5'}`}
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className={`absolute right-2 top-2 w-10 h-10 text-white rounded-xl flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95
                                    ${isDark ? 'bg-charcoal-accent hover:bg-charcoal-accent-hover' : 'bg-black hover:bg-slate-800'}`}
                            >
                                <Send size={18} />
                            </button>
                        </form>
                        <p className={`text-[10px] text-center mt-4 font-bold uppercase tracking-widest opacity-60 ${isDark ? 'text-charcoal-text-muted' : 'text-slate-500'}`}>
                            Powered by Gemini AI
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}
