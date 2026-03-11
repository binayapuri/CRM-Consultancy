import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authFetch, safeJson } from '../../store/auth';
import { format } from 'date-fns';
import { Plus, MessageSquare, ChevronRight, ChevronLeft, User, X, CheckCircle, PenTool, Search, Filter } from 'lucide-react';

const APP_COLUMNS = [
  { key: 'ONBOARDING', label: 'Onboarding', color: 'bg-slate-100' },
  { key: 'DRAFTING', label: 'Drafting', color: 'bg-blue-100' },
  { key: 'PENDING_INFO', label: 'Pending Info', color: 'bg-amber-100' },
  { key: 'REVIEW', label: 'Review', color: 'bg-purple-100' },
  { key: 'LODGED', label: 'Lodged', color: 'bg-green-100' },
  { key: 'DECISION', label: 'Decision', color: 'bg-ori-100' },
];

const TASK_COLUMNS = [
  { key: 'PENDING', label: 'To Do', color: 'bg-slate-100' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-100' },
  { key: 'COMPLETED', label: 'Done', color: 'bg-green-100' },
];

export default function Kanban() {
  const [searchParams] = useSearchParams();
  const consultancyId = searchParams.get('consultancyId');
  const [activeTab, setActiveTab] = useState<'applications' | 'tasks'>('tasks');
  const [appColumns, setAppColumns] = useState<Record<string, any[]>>({});
  const [tasks, setTasks] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', clientId: '', assignedTo: '', priority: 'MEDIUM' });
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [taskComment, setTaskComment] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [filterAgent, setFilterAgent] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const emptyAppColumns = () => Object.fromEntries(APP_COLUMNS.map(({ key }) => [key, []]));

  const fetchData = async () => {
    const q = consultancyId ? `?consultancyId=${consultancyId}` : '';
    const [appsRes, tasksRes, clientsRes, agentsRes] = await Promise.all([
      authFetch(`/api/applications/kanban${q}`),
      authFetch(`/api/tasks${q}`),
      authFetch(`/api/clients${q}`),
      authFetch(`/api/employees${q}`).catch(() => ({ ok: false, json: () => [] })),
    ]);
    const appsRaw = await safeJson<unknown>(appsRes);
    const tasksRaw = await safeJson<unknown>(tasksRes);
    const clientsRaw = await safeJson<unknown>(clientsRes);
    const agentsRaw = await safeJson<unknown>(agentsRes);
    if (appsRaw && typeof appsRaw === 'object' && !Array.isArray(appsRaw)) {
      const obj = appsRaw as Record<string, unknown>;
      const normalized: Record<string, any[]> = {};
      for (const { key } of APP_COLUMNS) {
        normalized[key] = Array.isArray(obj[key]) ? obj[key] : [];
      }
      setAppColumns(normalized);
    } else {
      setAppColumns(emptyAppColumns());
    }
    setTasks(Array.isArray(tasksRaw) ? tasksRaw : []);
    setClients(Array.isArray(clientsRaw) ? clientsRaw : []);
    setAgents(Array.isArray(agentsRaw) ? agentsRaw : []);
  };

  useEffect(() => { fetchData(); }, [consultancyId]);

  const moveApp = async (appId: string, newStatus: string) => {
    await authFetch(`/api/applications/${appId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchData();
  };

  const moveTask = async (taskId: string, newStatus: string) => {
    await authFetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchData();
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
          status: 'PENDING',
          type: 'GENERAL',
          dailyTaskDate: new Date(),
          ...(consultancyId && { consultancyId }),
        }),
      });
      const errData = await safeJson<any>(res);
      if (!res.ok) throw new Error(errData.error);
      setShowAddTask(false);
      setNewTask({ title: '', clientId: '', assignedTo: '', priority: 'MEDIUM' });
      fetchData();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const filterTask = (t: any) => {
    const matchSearch = !filterSearch || t.title?.toLowerCase().includes(filterSearch.toLowerCase()) || [t.clientId?.profile?.firstName, t.clientId?.profile?.lastName].filter(Boolean).join(' ').toLowerCase().includes(filterSearch.toLowerCase());
    const matchClient = !filterClient || (t.clientId?._id || t.clientId) === filterClient;
    const matchAgent = !filterAgent || (t.assignedTo?._id || t.assignedTo) === filterAgent;
    return matchSearch && matchClient && matchAgent;
  };
  const filterApp = (app: any) => {
    const matchSearch = !filterSearch || [app.clientId?.profile?.firstName, app.clientId?.profile?.lastName].filter(Boolean).join(' ').toLowerCase().includes(filterSearch.toLowerCase()) || String(app.visaSubclass || '').includes(filterSearch);
    const matchClient = !filterClient || (app.clientId?._id || app.clientId) === filterClient;
    const matchAgent = !filterAgent || (app.agentId?._id || app.agentId) === filterAgent;
    return matchSearch && matchClient && matchAgent;
  };
  const tasksList = Array.isArray(tasks) ? tasks : [];
  const clientsList = Array.isArray(clients) ? clients : [];
  const agentsList = Array.isArray(agents) ? agents : [];
  const filteredTasks = tasksList.filter(filterTask);
  const filteredApps = Object.fromEntries(
    Object.entries(appColumns || {}).map(([k, arr]) => [k, (Array.isArray(arr) ? arr : []).filter(filterApp)])
  );
  const taskColumns = TASK_COLUMNS.reduce((acc, { key }) => {
    acc[key] = filteredTasks.filter((t: any) => t.status === key);
    return acc;
  }, {} as Record<string, any[]>);

  const openTaskDetail = async (task: any) => {
    const res = await authFetch(`/api/tasks/${task._id}`);
    const data = await safeJson(res);
    setSelectedTask(data);
    setTaskComment('');
  };

  const assignTask = async (taskId: string, assignedTo: string) => {
    try {
      const res = await authFetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo: assignedTo || null }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error((data as any).error);
      setSelectedTask((t: any) => t?._id === taskId ? { ...t, assignedTo: data.assignedTo } : t);
      fetchData();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const onTaskDragStart = (e: React.DragEvent, task: any, colKey: string) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ id: task._id, fromCol: colKey }));
    e.dataTransfer.effectAllowed = 'move';
  };
  const onTaskDrop = (e: React.DragEvent, toColKey: string) => {
    e.preventDefault();
    try {
      const d = JSON.parse(e.dataTransfer.getData('application/json'));
      if (d.id && d.fromCol !== toColKey) moveTask(d.id, toColKey);
    } catch {}
  };
  const onAppDragStart = (e: React.DragEvent, app: any, colKey: string) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ id: app._id, fromCol: colKey }));
    e.dataTransfer.effectAllowed = 'move';
  };
  const onAppDrop = (e: React.DragEvent, toColKey: string) => {
    e.preventDefault();
    try {
      const d = JSON.parse(e.dataTransfer.getData('application/json'));
      if (d.id && d.fromCol !== toColKey) moveApp(d.id, toColKey);
    } catch {}
  };

  const addTaskComment = async () => {
    if (!selectedTask || !taskComment.trim()) return;
    try {
      const res = await authFetch(`/api/tasks/${selectedTask._id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: taskComment }),
      });
      const data = await safeJson<any>(res);
      if (!res.ok) throw new Error(data.error);
      setSelectedTask(data);
      setTaskComment('');
      fetchData();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const reviewTask = async () => {
    if (!selectedTask) return;
    try {
      const res = await authFetch(`/api/tasks/${selectedTask._id}/review`, { method: 'POST' });
      const data = await safeJson<any>(res);
      if (!res.ok) throw new Error(data.error);
      setSelectedTask(data);
      fetchData();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const canEditTask = (t: any) => !t.reviewedBy;

  return (
    <div className="w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Kanban Board</h1>
          <p className="text-slate-500 mt-1">Tasks first, then applications – Jira-style workflow</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input placeholder="Search client, task, visa..." value={filterSearch} onChange={e => setFilterSearch(e.target.value)} className="input pl-9 text-sm" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className={`btn-secondary flex items-center gap-2 text-sm ${showFilters ? 'ring-2 ring-ori-500' : ''}`}><Filter className="w-4 h-4" /> Filters</button>
          {showFilters && (
            <div className="flex flex-wrap gap-3 w-full sm:w-auto">
              <select value={filterClient} onChange={e => setFilterClient(e.target.value)} className="input text-sm w-full sm:w-40">
                <option value="">All clients</option>
                {clientsList.map((c: any) => <option key={c._id} value={c._id}>{c.profile?.firstName} {c.profile?.lastName}</option>)}
              </select>
              <select value={filterAgent} onChange={e => setFilterAgent(e.target.value)} className="input text-sm w-full sm:w-40">
                <option value="">All agents</option>
                {agentsList.map((a: any) => <option key={a._id} value={a._id}>{a.profile?.firstName} {a.profile?.lastName}</option>)}
              </select>
            </div>
          )}
          <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
            <button onClick={() => setActiveTab('tasks')} className={`px-3 sm:px-4 py-2 rounded-md font-medium transition text-sm sm:text-base ${activeTab === 'tasks' ? 'bg-white shadow text-ori-600' : 'text-slate-600 hover:text-slate-900'}`}>Tasks</button>
            <button onClick={() => setActiveTab('applications')} className={`px-3 sm:px-4 py-2 rounded-md font-medium transition text-sm sm:text-base ${activeTab === 'applications' ? 'bg-white shadow text-ori-600' : 'text-slate-600 hover:text-slate-900'}`}>Applications</button>
          </div>
          {activeTab === 'tasks' && (
            <button onClick={() => setShowAddTask(true)} className="btn-primary flex items-center gap-2 text-sm sm:text-base"><Plus className="w-4 h-4" /> Add Task</button>
          )}
        </div>
      </div>

      {showAddTask && (
        <form onSubmit={handleAddTask} className="card mt-6 max-w-xl">
          <h3 className="font-semibold text-slate-900 mb-4">New Task (from Kanban)</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Title *</label><input value={newTask.title} onChange={e => setNewTask(t => ({ ...t, title: e.target.value }))} className="input" required placeholder="e.g. Request AFP Police Check" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Client</label><select value={newTask.clientId} onChange={e => setNewTask(t => ({ ...t, clientId: e.target.value }))} className="input"><option value="">Select</option>{clientsList.map((c: any) => <option key={c._id} value={c._id}>{c.profile?.firstName} {c.profile?.lastName}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Assign To</label><select value={newTask.assignedTo} onChange={e => setNewTask(t => ({ ...t, assignedTo: e.target.value }))} className="input"><option value="">Select</option>{agentsList.map((a: any) => <option key={a._id} value={a._id}>{a.profile?.firstName} {a.profile?.lastName}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Priority</label><select value={newTask.priority} onChange={e => setNewTask(t => ({ ...t, priority: e.target.value }))} className="input"><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option></select></div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="btn-primary">Add Task</button>
            <button type="button" onClick={() => setShowAddTask(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      {activeTab === 'applications' && (
        <div className="mt-6 w-full overflow-x-auto pb-4 -mx-2 px-2">
          <div className="flex gap-3 sm:gap-4 min-w-max sm:min-w-0">
          {APP_COLUMNS.map(({ key, label, color }, colIdx) => (
            <div key={key} className="flex-shrink-0 w-[260px] sm:w-72">
              <div className={`${color} rounded-t-lg px-4 py-2 font-medium text-slate-700`}>{label}</div>
              <div className="bg-slate-100 rounded-b-lg p-4 min-h-[280px] sm:min-h-[360px] lg:min-h-[400px] space-y-3" onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }} onDrop={e => onAppDrop(e, key)}>
                {(filteredApps[key] || []).map((app: any) => (
                  <div key={app._id} draggable className="card cursor-grab active:cursor-grabbing hover:shadow-md transition group" onDragStart={e => onAppDragStart(e, app, key)}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900">{app.clientId?.profile?.firstName} {app.clientId?.profile?.lastName}</p>
                        <p className="text-sm text-slate-500">Subclass {app.visaSubclass}</p>
                        {app.stageDeadline && (
                          <p className={`text-xs mt-2 ${new Date(app.stageDeadline) < new Date() ? 'text-red-600 font-medium' : 'text-amber-600'}`}>
                            {new Date(app.stageDeadline) < new Date() ? 'Overdue: ' : 'Due: '}{format(new Date(app.stageDeadline), 'dd MMM yyyy')}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {colIdx > 0 && (
                          <button onClick={() => moveApp(app._id, APP_COLUMNS[colIdx - 1].key)} className="p-1.5 rounded hover:bg-slate-200 text-slate-500" title="Move left"><ChevronLeft className="w-4 h-4" /></button>
                        )}
                        {colIdx < APP_COLUMNS.length - 1 && (
                          <button onClick={() => moveApp(app._id, APP_COLUMNS[colIdx + 1].key)} className="p-1.5 rounded hover:bg-slate-200 text-slate-500" title="Move right"><ChevronRight className="w-4 h-4" /></button>
                        )}
                      </div>
                    </div>
                    <Link to={`/consultancy/clients/${app.clientId?._id || app.clientId}`} className="text-xs text-ori-600 hover:underline mt-2 block">View client →</Link>
                  </div>
                ))}
              </div>
            </div>
          ))}
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="mt-6 w-full overflow-x-auto pb-4 -mx-2 px-2">
          <div className="flex gap-3 sm:gap-4 min-w-max sm:min-w-0">
          {TASK_COLUMNS.map(({ key, label, color }, colIdx) => (
            <div key={key} className="flex-shrink-0 w-[260px] sm:w-72">
              <div className={`${color} rounded-t-lg px-4 py-2 font-medium text-slate-700`}>{label}</div>
              <div className="bg-slate-100 rounded-b-lg p-4 min-h-[280px] sm:min-h-[360px] lg:min-h-[400px] space-y-3" onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }} onDrop={e => onTaskDrop(e, key)}>
                {(taskColumns[key] || []).map((t: any) => (
                  <div key={t._id} draggable className="card cursor-grab active:cursor-grabbing hover:shadow-md transition group" onDragStart={e => onTaskDragStart(e, t, key)}>
                    <div onClick={() => openTaskDetail(t)} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900">{t.title}</p>
                        <p className="text-sm text-slate-500 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {t.clientId ? [t.clientId.profile?.firstName, t.clientId.profile?.lastName].filter(Boolean).join(' ') : '—'}
                        </p>
                        {t.comments?.length > 0 && <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><MessageSquare className="w-3 h-3" />{t.comments.length} comments</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                        {colIdx > 0 && (
                          <button onClick={() => moveTask(t._id, TASK_COLUMNS[colIdx - 1].key)} className="p-1.5 rounded hover:bg-slate-200 text-slate-500" title="Move left"><ChevronLeft className="w-4 h-4" /></button>
                        )}
                        {colIdx < TASK_COLUMNS.length - 1 && key !== 'COMPLETED' && (
                          <button onClick={() => moveTask(t._id, TASK_COLUMNS[colIdx + 1].key)} className="p-1.5 rounded hover:bg-slate-200 text-slate-500" title="Move right"><ChevronRight className="w-4 h-4" /></button>
                        )}
                      </div>
                    </div>
                    {t.clientId?._id && <Link to={`/consultancy/clients/${t.clientId._id}`} className="text-xs text-ori-600 hover:underline mt-2 block" onClick={e => e.stopPropagation()}>View client →</Link>}
                  </div>
                ))}
              </div>
            </div>
          ))}
          </div>
        </div>
      )}

      {/* Jira-style Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedTask(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="font-display font-bold text-slate-900">{selectedTask.title}</h3>
              <button onClick={() => setSelectedTask(null)} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              <div className="flex gap-2 flex-wrap items-center">
                <span className={`px-2 py-1 rounded text-xs ${selectedTask.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : selectedTask.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>{selectedTask.status}</span>
                <span className="px-2 py-1 rounded text-xs bg-slate-100">{selectedTask.priority}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">Assign:</span>
                  <select value={selectedTask.assignedTo?._id || selectedTask.assignedTo || ''} onChange={e => assignTask(selectedTask._id, e.target.value)} className="input text-sm py-1 w-40">
                    <option value="">Unassigned</option>
                    {agentsList.map((a: any) => <option key={a._id} value={a._id}>{a.profile?.firstName} {a.profile?.lastName}</option>)}
                  </select>
                </div>
                {selectedTask.clientId && (
                  <Link to={`/consultancy/clients/${selectedTask.clientId._id}`} className="text-ori-600 hover:underline text-sm">
                    {selectedTask.clientId.profile?.firstName} {selectedTask.clientId.profile?.lastName}
                  </Link>
                )}
              </div>
              {selectedTask.description && <p className="text-slate-600">{selectedTask.description}</p>}
              {selectedTask.dueDate && <p className="text-sm text-amber-600">Due: {format(new Date(selectedTask.dueDate), 'dd MMM yyyy')}</p>}
              {selectedTask.reviewedBy && (
                <p className="text-sm text-slate-500 flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-500" /> Reviewed by {selectedTask.reviewedBy.profile?.firstName} {selectedTask.reviewedBy.profile?.lastName}</p>
              )}
              <div>
                <h4 className="font-medium text-slate-900 mb-2">Comments & Notes</h4>
                <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                  {(selectedTask.comments || []).map((c: any, i: number) => (
                    <div key={i} className="p-2 rounded bg-slate-50 text-sm">
                      <p className="text-slate-700">{c.text}</p>
                      <p className="text-xs text-slate-400">{c.addedBy?.profile?.firstName} {c.addedBy?.profile?.lastName} • {format(new Date(c.addedAt), 'dd MMM HH:mm')}</p>
                    </div>
                  ))}
                </div>
                {canEditTask(selectedTask) && (
                  <div className="flex gap-2">
                    <input value={taskComment} onChange={e => setTaskComment(e.target.value)} placeholder="Add a comment..." className="input flex-1" onKeyDown={e => e.key === 'Enter' && addTaskComment()} />
                    <button onClick={addTaskComment} className="btn-primary">Add</button>
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-between">
              <div className="flex gap-2">
                {selectedTask.status !== 'PENDING' && TASK_COLUMNS.findIndex(c => c.key === selectedTask.status) > 0 && (
                  <button onClick={() => { moveTask(selectedTask._id, TASK_COLUMNS[TASK_COLUMNS.findIndex(c => c.key === selectedTask.status) - 1].key); setSelectedTask({ ...selectedTask, status: TASK_COLUMNS[TASK_COLUMNS.findIndex(c => c.key === selectedTask.status) - 1].key }); }} className="btn-secondary flex items-center gap-1"><ChevronLeft className="w-4 h-4" /> Left</button>
                )}
                {selectedTask.status !== 'COMPLETED' && (
                  <button onClick={() => { const idx = TASK_COLUMNS.findIndex(c => c.key === selectedTask.status); if (idx >= 0 && idx < TASK_COLUMNS.length - 1) { moveTask(selectedTask._id, TASK_COLUMNS[idx + 1].key); setSelectedTask({ ...selectedTask, status: TASK_COLUMNS[idx + 1].key }); } }} className="btn-secondary flex items-center gap-1">Right <ChevronRight className="w-4 h-4" /></button>
                )}
              </div>
              {canEditTask(selectedTask) && (
                <button onClick={reviewTask} className="btn-primary flex items-center gap-2"><PenTool className="w-4 h-4" /> Mark Reviewed</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
