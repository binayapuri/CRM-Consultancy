import { useEffect, useState } from 'react';
import { authFetch } from '../../store/auth';
import { format } from 'date-fns';
import { ClipboardList, CheckCircle, Clock, AlertCircle, MessageSquare, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function StudentTasks() {
  const [client, setClient] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [taskComment, setTaskComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);

  useEffect(() => {
    authFetch('/api/clients')
      .then(r => r.json())
      .then(data => {
        const c = Array.isArray(data) ? data[0] : data;
        setClient(c);
      });
    authFetch('/api/tasks')
      .then(r => r.json())
      .then(setTasks)
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center gap-2 text-slate-500"><LoadingSpinner size="sm" /> Loading...</div>;

  if (!client) return (
    <div className="card p-12 text-center">
      <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
      <h2 className="font-display font-semibold text-slate-900 mb-2">No Profile Linked</h2>
      <p className="text-slate-600 mb-4">Contact a consultancy to get enrolled. Tasks from your agent will appear here.</p>
      <Link to="consultancies" className="btn-primary inline-flex items-center gap-2">Find Consultancy</Link>
    </div>
  );

  const pending = tasks.filter((t: any) => t.status !== 'COMPLETED');
  const completed = tasks.filter((t: any) => t.status === 'COMPLETED');

  const addComment = async (taskId: string) => {
    if (!taskComment.trim()) return;
    setAddingComment(true);
    try {
      const res = await authFetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: taskComment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTasks(prev => prev.map(t => t._id === taskId ? data : t));
      setTaskComment('');
      setExpandedTask(null);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setAddingComment(false);
    }
  };


  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-slate-900">My Tasks</h1>
      <p className="text-slate-500 mt-1">Action items from your migration agent</p>

      {tasks.length === 0 ? (
        <div className="card mt-6 p-12 text-center">
          <ClipboardList className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="font-semibold text-slate-900 mb-2">No Tasks Yet</h2>
          <p className="text-slate-600">Your agent will assign tasks (e.g. upload documents, complete forms). Check back soon.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {pending.length > 0 && (
            <div>
              <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><Clock className="w-5 h-5 text-amber-500" /> To Do ({pending.length})</h2>
              <div className="space-y-3">
                {pending.map((t: any) => (
                  <div key={t._id} className="card">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${t.priority === 'CRITICAL' ? 'bg-red-100' : t.priority === 'HIGH' ? 'bg-amber-100' : 'bg-slate-100'}`}>
                        <ClipboardList className={`w-5 h-5 ${t.priority === 'CRITICAL' ? 'text-red-600' : t.priority === 'HIGH' ? 'text-amber-600' : 'text-slate-600'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900">{t.title}</p>
                        <p className="text-sm text-slate-500 mt-0.5">{t.type?.replace('_', ' ')}</p>
                        {t.dueDate && <p className="text-xs text-amber-600 mt-1">Due: {format(new Date(t.dueDate), 'dd MMM yyyy')}</p>}
                        {t.description && <p className="text-sm text-slate-600 mt-2">{t.description}</p>}
                        {(t.comments || []).length > 0 && (
                          <div className="mt-2 space-y-1">
                            {(t.comments || []).slice(-2).map((c: any, i: number) => (
                              <div key={i} className="p-2 rounded bg-slate-50 text-sm">
                                <p className="text-slate-600">{c.text}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{c.addedBy?.profile?.firstName} {c.addedBy?.profile?.lastName} • {format(new Date(c.addedAt), 'dd MMM HH:mm')}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded text-xs shrink-0 ${t.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>{t.status.replace('_', ' ')}</span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <button onClick={() => setExpandedTask(expandedTask === t._id ? null : t._id)} className="text-sm text-ori-600 hover:text-ori-700 flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" /> {expandedTask === t._id ? 'Hide' : 'Reply or ask a question'}
                      </button>
                      {expandedTask === t._id && (
                        <div className="mt-2 flex gap-2">
                          <input value={taskComment} onChange={e => setTaskComment(e.target.value)} placeholder="Type your message..." className="input flex-1 text-sm" onKeyDown={e => e.key === 'Enter' && addComment(t._id)} />
                          <button onClick={() => addComment(t._id)} disabled={addingComment || !taskComment.trim()} className="btn-primary text-sm flex items-center gap-1"><Send className="w-4 h-4" /> Send</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {completed.length > 0 && (
            <div>
              <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-500" /> Completed ({completed.length})</h2>
              <div className="space-y-3">
                {completed.slice(0, 5).map((t: any) => (
                  <div key={t._id} className="card flex items-center gap-4 opacity-90">
                    <CheckCircle className="w-8 h-8 text-green-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-700 line-through">{t.title}</p>
                      {t.completedAt && <p className="text-xs text-slate-500">Completed {format(new Date(t.completedAt), 'dd MMM yyyy')}</p>}
                    </div>
                  </div>
                ))}
                {completed.length > 5 && <p className="text-sm text-slate-500">+{completed.length - 5} more completed</p>}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="card mt-8 p-6 bg-slate-50">
        <h3 className="font-semibold text-slate-900 mb-2">Need Help?</h3>
        <p className="text-sm text-slate-600">Tasks are set by your migration agent. Complete them promptly to keep your application on track. Contact your agent if you have questions.</p>
      </div>
    </div>
  );
}
