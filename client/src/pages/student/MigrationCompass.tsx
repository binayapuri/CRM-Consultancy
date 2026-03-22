import { useState, useRef, useEffect } from 'react';
import { authFetch } from '../../store/auth';
import { Send, Bot, User } from 'lucide-react';

type Message = { role: 'user' | 'assistant'; content: string };

export default function MigrationCompass() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Hi! I'm the Abroad Up Migration Compass. I provide factual information about Australian and New Zealand visas. I can explain visa types, fees, English requirements, and general PR pathways. I also use the details in your Abroad Up profile when available, but I cannot give personal migration advice—for that, you should speak with a registered migration agent.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    try {
      const res = await authFetch('/api/ai/compass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-slate-900">Migration Compass</h1>
      <p className="text-slate-500 mt-1">
        AI-powered factual migration information (Section 276 compliant). Use this to research and prepare, then lodge yourself
        or with a registered migration agent.
      </p>
      <div className="card mt-6 max-w-3xl">
        <div className="h-96 overflow-y-auto space-y-4 mb-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
              {m.role === 'assistant' && <div className="w-8 h-8 rounded-full bg-ori-100 flex items-center justify-center flex-shrink-0"><Bot className="w-4 h-4 text-ori-600" /></div>}
              <div className={`max-w-[80%] p-3 rounded-lg ${m.role === 'user' ? 'bg-ori-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
                {m.content}
              </div>
              {m.role === 'user' && <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0"><User className="w-4 h-4 text-slate-600" /></div>}
            </div>
          ))}
          {loading && <div className="flex gap-3"><div className="w-8 h-8 rounded-full bg-ori-100 flex items-center justify-center"><Bot className="w-4 h-4 text-ori-600" /></div><div className="bg-slate-100 p-3 rounded-lg text-slate-500">Thinking...</div></div>}
          <div ref={bottomRef} />
        </div>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Ask about visa fees, English requirements..."
            className="input flex-1"
          />
          <button onClick={send} disabled={loading} className="btn-primary flex items-center gap-2">
            <Send className="w-4 h-4" /> Send
          </button>
        </div>
      </div>
    </div>
  );
}
