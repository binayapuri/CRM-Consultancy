import { useState, useEffect, useRef } from 'react';
import { authFetch } from '../store/auth';
import { MessageCircle, Send } from 'lucide-react';
import { format } from 'date-fns';

export default function TeamMessages() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = () => authFetch('/api/messages').then(r => r.json()).then(setMessages);

  useEffect(() => {
    if (open) fetchMessages();
  }, [open]);

  useEffect(() => {
    if (open && messages.length) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [open, messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || sending) return;
    setSending(true);
    try {
      const res = await authFetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newMsg }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessages(prev => [...prev, data]);
      setNewMsg('');
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600">
        <MessageCircle className="w-5 h-5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-96 h-[400px] flex flex-col bg-white rounded-xl shadow-xl border border-slate-200 z-20">
            <div className="p-3 border-b border-slate-200">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2"><MessageCircle className="w-4 h-4 text-ori-500" /> Team Chat</h3>
              <p className="text-xs text-slate-500 mt-0.5">Connect with your team</p>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.length ? messages.map((m: any) => (
                <div key={m._id} className="flex gap-2">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-ori-100 flex items-center justify-center text-ori-600 text-sm font-medium">
                    {m.senderId?.profile?.firstName?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500">{m.senderId?.profile?.firstName} {m.senderId?.profile?.lastName}</p>
                    <p className="text-sm text-slate-800 break-words">{m.text}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{format(new Date(m.createdAt), 'dd MMM HH:mm')}</p>
                  </div>
                </div>
              )) : <div className="text-center text-slate-500 text-sm py-8">No messages yet. Say hello!</div>}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={sendMessage} className="p-3 border-t border-slate-200 flex gap-2">
              <input value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Type a message..." className="input flex-1 py-2 text-sm" />
              <button type="submit" disabled={sending || !newMsg.trim()} className="btn-primary py-2"><Send className="w-4 h-4" /></button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
