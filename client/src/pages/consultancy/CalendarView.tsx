import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, FileText, ListTodo, Users, Plus, X } from 'lucide-react';
import { authFetch, safeJson } from '../../store/auth';
import { Skeleton } from '../../components/Skeleton';

type CalendarEvent = {
  id: string;
  date: Date;
  title: string;
  subtitle: string;
  category: 'deadline' | 'task' | 'appointment';
  severity?: string;
  href?: string;
  meta?: string;
  payload?: any;
};

const FILTERS: Array<{ key: 'ALL' | CalendarEvent['category']; label: string }> = [
  { key: 'ALL', label: 'All' },
  { key: 'deadline', label: 'Deadlines' },
  { key: 'task', label: 'Tasks' },
  { key: 'appointment', label: 'Appointments' },
];

export default function ConsultancyCalendarView() {
  const [searchParams] = useSearchParams();
  const consultancyId = searchParams.get('consultancyId');
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [filter, setFilter] = useState<'ALL' | CalendarEvent['category']>('ALL');
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
  const [savingAppointment, setSavingAppointment] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({
    studentId: '',
    agentId: '',
    startTime: '',
    endTime: '',
    topic: '',
    notes: '',
    meetingLink: '',
    internalNotes: '',
    status: 'CONFIRMED',
  });

  const scopedPath = (path: string) => (consultancyId ? `${path}${path.includes('?') ? '&' : '?'}consultancyId=${consultancyId}` : path);

  const loadCalendarData = async (activeGuard?: { active: boolean }) => {
    setLoading(true);
    try {
      const qs = consultancyId ? `?consultancyId=${consultancyId}` : '';
      const [overviewRes, tasksRes, appointmentsRes, clientsRes, agentsRes] = await Promise.all([
        authFetch(`/api/consultancies/me/overview${qs}`),
        authFetch(`/api/tasks${qs}`),
        authFetch(`/api/appointments${consultancyId ? `?scope=consultancy&consultancyId=${consultancyId}` : '?scope=consultancy'}`),
        authFetch(consultancyId ? `/api/clients?consultancyId=${consultancyId}` : '/api/clients'),
        authFetch(consultancyId ? `/api/employees?consultancyId=${consultancyId}` : '/api/employees').catch(() => ({ ok: false })),
      ]);
      const overview = overviewRes.ok ? await safeJson<any>(overviewRes) : null;
      const tasks = tasksRes.ok ? await safeJson<any[]>(tasksRes) : [];
      const appointments = appointmentsRes.ok ? await safeJson<any[]>(appointmentsRes) : [];
      const clientRows = clientsRes.ok ? await safeJson<any[]>(clientsRes) : [];
      const agentRows = agentsRes && 'ok' in agentsRes && agentsRes.ok ? await safeJson<any[]>(agentsRes as Response) : [];

      const deadlineEvents: CalendarEvent[] = (overview?.deadlineTracker?.items || [])
        .filter((item: any) => item?.dueDate)
        .map((item: any, idx: number) => ({
          id: `deadline-${item.type || idx}-${item.clientId || idx}-${item.dueDate}`,
          date: new Date(item.dueDate),
          title: item.title || 'Deadline',
          subtitle: item.clientName || item.subtitle || '',
          category: 'deadline',
          severity: item.severity,
          href: item.clientId ? scopedPath(`clients/${item.clientId}`) : undefined,
          meta: item.type || '',
          payload: item,
        }));

      const taskEvents: CalendarEvent[] = (Array.isArray(tasks) ? tasks : [])
        .filter((task: any) => task.status !== 'COMPLETED' && (task.dueDate || task.dailyTaskDate))
        .map((task: any) => {
          const eventDate = task.dueDate || task.dailyTaskDate;
          return {
            id: `task-${task._id}`,
            date: new Date(eventDate),
            title: task.title || 'Task',
            subtitle: task.clientId ? `${task.clientId.profile?.firstName || ''} ${task.clientId.profile?.lastName || ''}`.trim() : (task.priority || 'Task'),
            category: 'task',
            severity: task.priority,
            href: scopedPath('daily-tasks'),
            meta: task.status || '',
            payload: task,
          };
        });

      const appointmentEvents: CalendarEvent[] = (Array.isArray(appointments) ? appointments : [])
        .filter((appointment: any) => appointment.startTime)
        .map((appointment: any) => ({
          id: `appointment-${appointment._id}`,
          date: new Date(appointment.startTime),
          title: appointment.topic || 'Client appointment',
          subtitle: `${appointment.studentId?.profile?.firstName || ''} ${appointment.studentId?.profile?.lastName || ''}`.trim() || 'Booked session',
          category: 'appointment',
          severity: appointment.status,
          meta: `${appointment.agentId?.profile?.firstName || ''} ${appointment.agentId?.profile?.lastName || ''}`.trim(),
          payload: appointment,
        }));

      if (!activeGuard || activeGuard.active) {
        setEvents([...deadlineEvents, ...taskEvents, ...appointmentEvents]);
        setClients((Array.isArray(clientRows) ? clientRows : []).filter((client: any) => client.userId));
        setAgents(Array.isArray(agentRows) ? agentRows : []);
      }
    } finally {
      if (!activeGuard || activeGuard.active) setLoading(false);
    }
  };

  useEffect(() => {
    const activeGuard = { active: true };
    loadCalendarData(activeGuard);
    return () => {
      activeGuard.active = false;
    };
  }, [consultancyId]);

  const gridDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const filteredEvents = useMemo(() => {
    const base = filter === 'ALL' ? events : events.filter((event) => event.category === filter);
    return base.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [events, filter]);

  const selectedEvents = useMemo(
    () => filteredEvents.filter((event) => isSameDay(event.date, selectedDate)),
    [filteredEvents, selectedDate]
  );

  const monthEvents = useMemo(
    () => filteredEvents.filter((event) => isSameMonth(event.date, month)),
    [filteredEvents, month]
  );

  const countForDay = (day: Date) => filteredEvents.filter((event) => isSameDay(event.date, day)).length;

  const badgeClass = (event: CalendarEvent) => {
    if (event.category === 'deadline') return event.severity === 'OVERDUE' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700';
    if (event.category === 'appointment') return 'bg-cyan-100 text-cyan-700';
    return 'bg-violet-100 text-violet-700';
  };

  const openNewAppointment = () => {
    const baseStart = new Date(selectedDate);
    baseStart.setHours(10, 0, 0, 0);
    const baseEnd = new Date(baseStart);
    baseEnd.setMinutes(baseEnd.getMinutes() + 30);
    setEditingAppointmentId(null);
    setAppointmentForm({
      studentId: '',
      agentId: '',
      startTime: format(baseStart, "yyyy-MM-dd'T'HH:mm"),
      endTime: format(baseEnd, "yyyy-MM-dd'T'HH:mm"),
      topic: '',
      notes: '',
      meetingLink: 'https://meet.google.com/new',
      internalNotes: '',
      status: 'CONFIRMED',
    });
    setShowAppointmentModal(true);
  };

  const openExistingAppointment = (appointment: any) => {
    setEditingAppointmentId(appointment._id);
    setAppointmentForm({
      studentId: appointment.studentId?._id || appointment.studentId || '',
      agentId: appointment.agentId?._id || appointment.agentId || '',
      startTime: appointment.startTime ? format(new Date(appointment.startTime), "yyyy-MM-dd'T'HH:mm") : '',
      endTime: appointment.endTime ? format(new Date(appointment.endTime), "yyyy-MM-dd'T'HH:mm") : '',
      topic: appointment.topic || '',
      notes: appointment.notes || '',
      meetingLink: appointment.meetingLink || '',
      internalNotes: appointment.internalNotes || '',
      status: appointment.status || 'CONFIRMED',
    });
    setShowAppointmentModal(true);
  };

  const saveAppointment = async () => {
    if (!appointmentForm.studentId || !appointmentForm.agentId || !appointmentForm.startTime || !appointmentForm.topic) {
      alert('Student, agent, start time, and topic are required.');
      return;
    }
    setSavingAppointment(true);
    try {
      const payload = {
        consultancyId: consultancyId || undefined,
        studentId: appointmentForm.studentId,
        agentId: appointmentForm.agentId,
        startTime: new Date(appointmentForm.startTime).toISOString(),
        endTime: appointmentForm.endTime ? new Date(appointmentForm.endTime).toISOString() : undefined,
        topic: appointmentForm.topic,
        notes: appointmentForm.notes || undefined,
        meetingLink: appointmentForm.meetingLink || undefined,
        internalNotes: appointmentForm.internalNotes || undefined,
        status: appointmentForm.status,
      };
      const res = await authFetch(editingAppointmentId ? `/api/appointments/${editingAppointmentId}` : '/api/appointments', {
        method: editingAppointmentId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await safeJson<any>(res);
      if (!res.ok) throw new Error(data?.error || 'Failed to save appointment');
      setShowAppointmentModal(false);
      await loadCalendarData();
    } catch (err: any) {
      alert(err.message || 'Failed to save appointment');
    } finally {
      setSavingAppointment(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Calendar View</h1>
          <p className="text-slate-500 mt-1">One timeline for deadlines, tasks, document expiry, visa expiry, and appointments.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={openNewAppointment} className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest">
            <Plus className="w-4 h-4" /> Book Appointment
          </button>
          {FILTERS.map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key)}
              className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest transition ${
                filter === item.key ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 border border-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? [1, 2, 3, 4].map((i) => <div key={i} className="card"><Skeleton className="h-20 w-full" /></div>) : (
          <>
            <div className="card flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center"><CalendarDays className="w-6 h-6 text-amber-700" /></div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{monthEvents.filter((e) => e.category === 'deadline').length}</p>
                <p className="text-slate-500 text-sm">Deadlines This Month</p>
              </div>
            </div>
            <div className="card flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center"><ListTodo className="w-6 h-6 text-violet-700" /></div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{monthEvents.filter((e) => e.category === 'task').length}</p>
                <p className="text-slate-500 text-sm">Tasks This Month</p>
              </div>
            </div>
            <div className="card flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-100 flex items-center justify-center"><Users className="w-6 h-6 text-cyan-700" /></div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{monthEvents.filter((e) => e.category === 'appointment').length}</p>
                <p className="text-slate-500 text-sm">Appointments This Month</p>
              </div>
            </div>
            <div className="card flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center"><FileText className="w-6 h-6 text-rose-700" /></div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{monthEvents.filter((e) => e.severity === 'OVERDUE').length}</p>
                <p className="text-slate-500 text-sm">Overdue Items</p>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Month</p>
              <h2 className="text-xl font-black text-slate-900 mt-1">{format(month, 'MMMM yyyy')}</h2>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setMonth((current) => subMonths(current, 1))} className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"><ChevronLeft className="w-5 h-5" /></button>
              <button onClick={() => setMonth(startOfMonth(new Date()))} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50">Today</button>
              <button onClick={() => setMonth((current) => addMonths(current, 1))} className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"><ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="px-3 py-3 text-center text-[11px] font-black uppercase tracking-widest text-slate-400">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {loading ? (
              Array.from({ length: 35 }).map((_, idx) => <div key={idx} className="min-h-[110px] border-b border-r border-slate-100 p-3"><Skeleton className="h-16 w-full" /></div>)
            ) : (
              gridDays.map((day) => {
                const dayEvents = filteredEvents.filter((event) => isSameDay(event.date, day)).slice(0, 3);
                const dayCount = countForDay(day);
                const isSelected = isSameDay(day, selectedDate);
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`min-h-[110px] border-b border-r border-slate-100 p-3 text-left align-top transition ${
                      isSelected ? 'bg-indigo-50' : 'hover:bg-slate-50'
                    } ${!isSameMonth(day, month) ? 'bg-slate-50/60 text-slate-300' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-bold ${isSameDay(day, new Date()) ? 'text-indigo-700' : 'text-slate-700'}`}>{format(day, 'd')}</span>
                      {dayCount > 0 && (
                        <span className="min-w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center px-1">
                          {dayCount}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 space-y-1">
                      {dayEvents.map((event) => (
                        <div key={event.id} className={`truncate rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-widest ${badgeClass(event)}`}>
                          {event.category}
                        </div>
                      ))}
                      {dayCount > 3 && <div className="text-[10px] font-bold text-slate-400">+{dayCount - 3} more</div>}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Selected Day</p>
            <h2 className="text-xl font-black text-slate-900 mt-1">{format(selectedDate, 'EEEE, dd MMM yyyy')}</h2>
          </div>
          <div className="p-5 space-y-3 max-h-[720px] overflow-y-auto">
            {loading ? (
              [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)
            ) : selectedEvents.length ? (
              selectedEvents.map((event) => {
                const content = (
                  <div className="rounded-2xl border border-slate-200 p-4 hover:border-slate-300 transition bg-slate-50/60">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-slate-900">{event.title}</p>
                        <p className="text-sm text-slate-500 mt-1">{event.subtitle || 'No extra context'}</p>
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${badgeClass(event)}`}>
                        {event.category}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-[11px] font-bold text-slate-500">
                      <span className="inline-flex items-center gap-1"><Clock3 className="w-3.5 h-3.5" /> {format(event.date, 'hh:mm a')}</span>
                      {event.meta ? <span>{event.meta}</span> : null}
                      {event.severity ? <span>{event.severity}</span> : null}
                    </div>
                  </div>
                );
                return event.category === 'appointment' ? (
                  <button key={event.id} type="button" onClick={() => openExistingAppointment(event.payload)} className="w-full text-left">
                    {content}
                  </button>
                ) : event.href ? (
                  <Link key={event.id} to={event.href}>
                    {content}
                  </Link>
                ) : (
                  <div key={event.id}>{content}</div>
                );
              })
            ) : (
              <div className="py-16 text-center">
                <p className="text-slate-400 font-bold italic">No calendar items for this day.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {showAppointmentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900">{editingAppointmentId ? 'Manage Appointment' : 'Book Appointment'}</h3>
                <p className="text-sm text-slate-500 mt-1">Create, reschedule, or update the status of a consultation.</p>
              </div>
              <button onClick={() => setShowAppointmentModal(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Client</label>
                  <select value={appointmentForm.studentId} onChange={(e) => setAppointmentForm((prev) => ({ ...prev, studentId: e.target.value }))} className="input">
                    <option value="">Select client</option>
                    {clients.map((client: any) => (
                      <option key={client._id} value={client.userId}>
                        {client.profile?.firstName} {client.profile?.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Agent</label>
                  <select value={appointmentForm.agentId} onChange={(e) => setAppointmentForm((prev) => ({ ...prev, agentId: e.target.value }))} className="input">
                    <option value="">Select agent</option>
                    {agents.map((agent: any) => (
                      <option key={agent._id} value={agent._id}>
                        {agent.profile?.firstName} {agent.profile?.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Start</label>
                  <input type="datetime-local" value={appointmentForm.startTime} onChange={(e) => setAppointmentForm((prev) => ({ ...prev, startTime: e.target.value }))} className="input" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">End</label>
                  <input type="datetime-local" value={appointmentForm.endTime} onChange={(e) => setAppointmentForm((prev) => ({ ...prev, endTime: e.target.value }))} className="input" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Topic</label>
                  <input value={appointmentForm.topic} onChange={(e) => setAppointmentForm((prev) => ({ ...prev, topic: e.target.value }))} className="input" placeholder="Consultation topic" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Status</label>
                  <select value={appointmentForm.status} onChange={(e) => setAppointmentForm((prev) => ({ ...prev, status: e.target.value }))} className="input">
                    <option value="PENDING">Pending</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Meeting Link</label>
                <input value={appointmentForm.meetingLink} onChange={(e) => setAppointmentForm((prev) => ({ ...prev, meetingLink: e.target.value }))} className="input" placeholder="https://meet.google.com/..." />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Client Notes</label>
                  <textarea value={appointmentForm.notes} onChange={(e) => setAppointmentForm((prev) => ({ ...prev, notes: e.target.value }))} className="input min-h-[120px]" placeholder="Pre-meeting notes or client context" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Internal Notes</label>
                  <textarea value={appointmentForm.internalNotes} onChange={(e) => setAppointmentForm((prev) => ({ ...prev, internalNotes: e.target.value }))} className="input min-h-[120px]" placeholder="Internal preparation or follow-up notes" />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowAppointmentModal(false)} className="px-4 py-2 text-xs font-bold text-slate-500">Cancel</button>
                <button type="button" onClick={saveAppointment} disabled={savingAppointment} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-60">
                  {savingAppointment ? 'Saving...' : editingAppointmentId ? 'Save Changes' : 'Create Appointment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
