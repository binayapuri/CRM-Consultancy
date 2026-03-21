import { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, Minimize2, Maximize2, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/auth';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi there! I'm your AI Migration Compass. I can help you check PR points, understand visa requirements, and review your documents. How can I assist you today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const token = useAuthStore.getState().token;
      const res = await fetch(
        (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:4000' : '')) + '/api/ai/compass',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ message: userMessage })
        }
      );

      const data = await res.json();
      
      if (res.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I'm having trouble connecting to the network right now. Please try again later." }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm offline right now. Could you please check your connection?" }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-r from-emerald-500 to-sky-500 flex items-center justify-center text-white shadow-xl shadow-emerald-500/30 hover:scale-110 active:scale-95 transition-all z-50 group"
      >
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
        <Bot className="w-7 h-7 group-hover:animate-bounce" />
      </button>
    );
  }

  return (
    <div 
      className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden transition-all duration-300 z-50 ${
        isExpanded
          ? 'w-[calc(100vw-2rem)] sm:w-[calc(100vw-3rem)] md:w-[600px] h-[calc(100vh-2rem)] sm:h-[calc(100vh-3rem)] max-h-[800px]'
          : 'w-[calc(100vw-2rem)] sm:w-[380px] h-[min(70vh,520px)] sm:h-[600px]'
      }`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-sky-600 p-4 flex items-center justify-between text-white relative overflow-hidden shrink-0">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold">AI Compass</h3>
            <div className="flex items-center gap-1.5 text-xs text-emerald-100">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span> Online
            </div>
          </div>
        </div>
        <div className="flex gap-2 relative z-10 text-emerald-100">
          <button onClick={() => setIsExpanded(!isExpanded)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
          <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
             <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 relative">
        <div className="text-center mb-6">
           <span className="bg-slate-200 text-slate-500 text-[10px] uppercase font-bold px-2 py-1 rounded-full">Section 276 Compliant</span>
        </div>
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
              msg.role === 'user' 
                ? 'bg-emerald-600 text-white rounded-tr-sm shadow-md shadow-emerald-600/20' 
                : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
              <span className="text-sm font-medium text-slate-500">Analysing Profile...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 shrink-0">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about PR pathways, documents..."
            className="w-full pl-4 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || loading}
            className="absolute right-2 p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-400 mt-2 font-medium">
          BIGFEW AI provides general guidance, not legal advice.
        </p>
      </form>
    </div>
  );
}
