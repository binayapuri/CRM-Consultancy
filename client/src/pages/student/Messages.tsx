import { useState, useEffect } from 'react';
import { authFetch } from '../../store/auth';
import { MessageSquare, Send, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Conversation {
  otherUser: { _id: string; profile?: { firstName?: string; lastName?: string }; email?: string };
  contextPostId?: string;
  contextPostTitle?: string;
  lastMessage: string;
  lastAt: string;
}

interface Message {
  _id: string;
  text: string;
  senderId: { _id: string; profile?: { firstName?: string; lastName?: string } };
  recipientId?: { _id: string; profile?: { firstName?: string; lastName?: string } };
  createdAt: string;
}

export default function Messages() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<{ recipientId: string; postId?: string } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newText, setNewText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchConversations = async () => {
    try {
      const res = await authFetch('/api/messages/conversations');
      if (res.ok) setConversations(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMessages = async () => {
    if (!selected) return;
    try {
      let url = `/api/messages?recipientId=${selected.recipientId}`;
      if (selected.postId) url += `&postId=${selected.postId}`;
      const res = await authFetch(url);
      if (res.ok) setMessages(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchConversations().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selected) fetchMessages();
  }, [selected?.recipientId, selected?.postId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim() || !selected || sending) return;
    setSending(true);
    try {
      const res = await authFetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: newText.trim(),
          recipientId: selected.recipientId,
          postId: selected.postId,
        }),
      });
      if (res.ok) {
        setNewText('');
        fetchMessages();
        fetchConversations();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const selectedConvo = selected
    ? conversations.find(
        c =>
          c.otherUser?._id === selected.recipientId &&
          (c.contextPostId || '') === (selected.postId || '')
      )
    : null;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 rounded-full border-4 border-ori-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in-up">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-display font-black text-slate-900 tracking-tight">Messages</h1>
          <p className="text-slate-500 text-sm">Your community conversations</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col sm:flex-row min-h-[400px]">
        <div className="w-full sm:w-80 border-b sm:border-b-0 sm:border-r border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">Conversations</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No conversations yet. Message someone from a community post!</div>
            ) : (
              conversations.map((c) => {
                const key = `${c.otherUser?._id}:${c.contextPostId || ''}`;
                const isSelected =
                  selected?.recipientId === c.otherUser?._id &&
                  (selected?.postId || '') === (c.contextPostId || '');
                const name = `${c.otherUser?.profile?.firstName || ''} ${c.otherUser?.profile?.lastName || ''}`.trim() || c.otherUser?.email || 'User';
                return (
                  <button
                    key={key}
                    onClick={() => setSelected({ recipientId: c.otherUser!._id, postId: c.contextPostId })}
                    className={`w-full text-left p-4 border-b border-slate-50 hover:bg-slate-50 transition ${isSelected ? 'bg-ori-50 border-l-4 border-l-ori-600' : ''}`}
                  >
                    <p className="font-bold text-slate-900 truncate">{name}</p>
                    {c.contextPostTitle && <p className="text-xs text-slate-500 truncate">Re: {c.contextPostTitle}</p>}
                    <p className="text-sm text-slate-600 truncate mt-0.5">{c.lastMessage}</p>
                    <p className="text-xs text-slate-400 mt-1">{new Date(c.lastAt).toLocaleDateString()}</p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-[300px]">
          {selected ? (
            <>
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                <p className="font-bold text-slate-900">
                  {selectedConvo?.otherUser?.profile?.firstName} {selectedConvo?.otherUser?.profile?.lastName}
                </p>
                {selectedConvo?.contextPostTitle && (
                  <p className="text-xs text-slate-500">Re: {selectedConvo.contextPostTitle}</p>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(m => {
                  const isFromThem = (m.senderId?._id || m.senderId)?.toString() === selected.recipientId;
                  return (
                  <div
                    key={m._id}
                    className={`flex ${isFromThem ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-xl px-4 py-2 ${
                        isFromThem
                          ? 'bg-slate-100 text-slate-900'
                          : 'bg-ori-600 text-white'
                      }`}
                    >
                      <p className="text-sm">{m.text}</p>
                      <p className="text-[10px] opacity-70 mt-1">{new Date(m.createdAt).toLocaleTimeString()}</p>
                    </div>
                  </div>
                );})}
              </div>
              <form onSubmit={handleSend} className="p-4 border-t border-slate-200 flex gap-2">
                <input
                  value={newText}
                  onChange={e => setNewText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-ori-500/50"
                />
                <button
                  type="submit"
                  disabled={!newText.trim() || sending}
                  className="px-4 py-3 bg-ori-600 text-white rounded-xl font-bold hover:bg-ori-700 disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p>Select a conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
