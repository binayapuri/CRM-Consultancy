import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { authFetch } from '../../store/auth';
import { format } from 'date-fns';
import { Calendar, CheckCircle, Plus, Trash2, MessageSquare } from 'lucide-react';
import { Skeleton } from '../../components/Skeleton';

export default function DailyTasks() {
  const [searchParams] = useSearchParams();
  const consultancyId = searchParams.get('consultancyId');
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [clients, setClients] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [newTask, setNewTask] = useState({ title: '', clientId: '', assignedTo: '', priority: 'MEDIUM', dueDate: '' });

  const fetchTasks = () => {
    const q = consultancyId ? `&consultancyId=${consultancyId}` : '';
    authFetch(`/api/tasks/daily?date=${date}${q}`).then(r => r.json()).then(data => { setTasks(data); setLoading(false); });
  };
  useEffect(() => { setLoading(true); fetchTasks(); }, [date, consultancyId]);
  useEffect(() => {
    const url = consultancyId ? `/api/clients?consultancyId=${consultancyId}` : '/api/clients';
    authFetch(url).then(r => r.json()).then(setClients);
    authFetch('/api/users/agents').then(r => r.json()).then(setAgents);
  }, [consultancyId]);

  const completeTask = async (id: string) => {
    try {
      const res = await authFetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED', completedAt: new Date() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to complete');
      }
      fetchTasks();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const addComment = async (taskId: string) => {
    if (!commentText.trim()) return;
    try {
      const res = await authFetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: commentText }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setCommentText('');
      setExpandedTask(null);
      fetchTasks();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const deleteTask = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      const res = await authFetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete');
      }
      fetchTasks();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    try {
      const res = await authFetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTask.title,
          clientId: newTask.clientId || undefined,
          assignedTo: newTask.assignedTo || undefined,
          priority: newTask.priority,
          dueDate: newTask.dueDate ? new Date(newTask.dueDate) : undefined,
          dailyTaskDate: new Date(date),
          type: 'GENERAL',
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to add task');
      }
      setShowAdd(false);
      setNewTask({ title: '', clientId: '', assignedTo: '', priority: 'MEDIUM', dueDate: '' });
      setLoading(true);
      fetchTasks();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Daily Tasks</h1>
          <p className="text-slate-500 mt-1">Tasks tagged to today</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Task</button>
      </div>
      <div className="mt-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-slate-500" />
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input w-auto" />
        </div>
      </div>
      {showAdd && (
        <form onSubmit={handleAddTask} className="card mt-6 max-w-2xl">
          <h3 className="font-semibold text-slate-900 mb-4">New Task</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Title *</label><input value={newTask.title} onChange={e => setNewTask(t => ({ ...t, title: e.target.value }))} className="input" required placeholder="e.g. Request AFP Police Check" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Client</label><select value={newTask.clientId} onChange={e => setNewTask(t => ({ ...t, clientId: e.target.value }))} className="input"><option value="">Select</option>{clients.map((c: any) => <option key={c._id} value={c._id}>{c.profile?.firstName} {c.profile?.lastName}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Assign To</label><select value={newTask.assignedTo} onChange={e => setNewTask(t => ({ ...t, assignedTo: e.target.value }))} className="input"><option value="">Select</option>{agents.map((a: any) => <option key={a._id} value={a._id}>{a.profile?.firstName} {a.profile?.lastName}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Priority</label><select value={newTask.priority} onChange={e => setNewTask(t => ({ ...t, priority: e.target.value }))} className="input"><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option></select></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label><input type="date" value={newTask.dueDate} onChange={e => setNewTask(t => ({ ...t, dueDate: e.target.value }))} className="input" /></div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="btn-primary">Add Task</button>
            <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}
      <div className="mt-6 space-y-3">
        {loading ? (
          <>
            {[1, 2, 3, 4].map(i => <div key={i} className="card flex items-center gap-4"><Skeleton className="w-10 h-10 rounded-lg" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-48" /><Skeleton className="h-3 w-32" /></div></div>)}
          </>
        ) : tasks.map((t: any) => (
          <div key={t._id} className="card">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900">{t.title}</p>
                <p className="text-sm text-slate-500">{t.type} • {t.clientId ? [t.clientId.profile?.firstName, t.clientId.profile?.lastName].filter(Boolean).join(' ') || '—' : '—'}</p>
                {t.dueDate && <p className="text-xs text-amber-600 mt-1">Due: {format(new Date(t.dueDate), 'dd MMM yyyy')}</p>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setExpandedTask(expandedTask === t._id ? null : t._id)} className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-600" title="Comments">
                  <MessageSquare className="w-4 h-4" />
                  {t.comments?.length > 0 && <span className="absolute -top-0.5 -right-0.5 bg-ori-500 text-white text-xs rounded-full min-w-[1rem] h-4 px-1 flex items-center justify-center">{t.comments.length}</span>}
                </button>
                <button onClick={() => completeTask(t._id)} className="p-2 rounded-lg hover:bg-green-50 text-green-600" title="Mark complete"><CheckCircle className="w-5 h-5" /></button>
                <button onClick={() => deleteTask(t._id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500" title="Delete"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            {expandedTask === t._id && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="space-y-2 mb-3">
                  {(t.comments || []).map((c: any, i: number) => (
                    <div key={i} className="p-2 rounded bg-slate-50 text-sm">
                      <p className="text-slate-700">{c.text}</p>
                      <p className="text-xs text-slate-400">{c.addedBy?.profile?.firstName} {c.addedBy?.profile?.lastName} • {format(new Date(c.addedAt), 'dd MMM HH:mm')}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Add a comment..." className="input flex-1" onKeyDown={e => e.key === 'Enter' && addComment(t._id)} />
                  <button onClick={() => addComment(t._id)} className="btn-primary">Add</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {!loading && !tasks.length && !showAdd && <div className="card mt-6 p-12 text-center text-slate-500">No tasks for this date</div>}
    </div>
  );
}
