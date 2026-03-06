import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../store/auth';
import { Bell } from 'lucide-react';
import { format } from 'date-fns';

function getNotificationLink(n: any): string | null {
  if (!n.relatedEntityType || !n.relatedEntityId) return null;
  switch (n.relatedEntityType) {
    case 'Client': return `/consultancy/clients/${n.relatedEntityId}`;
    case 'Task': return `/consultancy/kanban`;
    case 'Application': return `/consultancy/clients`; // Would need clientId - could enhance
    case 'Document': return `/consultancy/clients`;
    default: return null;
  }
}

export default function Notifications() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchNotifications = () => authFetch('/api/notifications').then(r => r.json()).then(setNotifications);
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markRead = async (id: string) => {
    await authFetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    await authFetch('/api/notifications/read-all', { method: 'PATCH' });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClick = (n: any) => {
    const link = getNotificationLink(n);
    if (link) {
      setOpen(false);
      navigate(link);
    }
    if (!n.read) markRead(n._id);
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 relative">
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-ori-500 text-white text-xs flex items-center justify-center">{unreadCount}</span>}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-96 max-h-96 overflow-y-auto bg-white rounded-xl shadow-xl border border-slate-200 z-20">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Notifications</h3>
              {unreadCount > 0 && <button onClick={markAllRead} className="text-sm text-ori-600 hover:underline">Mark all read</button>}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length ? notifications.map((n: any) => (
                <div
                  key={n._id}
                  onClick={() => handleClick(n)}
                  className={`p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer ${!n.read ? 'bg-ori-50/30' : ''}`}
                >
                  <div className="flex justify-between">
                    <p className="font-medium text-slate-900 text-sm">{n.title}</p>
                    {!n.read && <button onClick={(e) => { e.stopPropagation(); markRead(n._id); }} className="text-ori-600 text-xs">Mark read</button>}
                  </div>
                  {n.message && <p className="text-slate-600 text-sm mt-1">{n.message}</p>}
                  <p className="text-xs text-slate-400 mt-2">{format(new Date(n.createdAt), 'dd MMM HH:mm')}</p>
                </div>
              )) : <div className="p-8 text-center text-slate-500 text-sm">No notifications</div>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
