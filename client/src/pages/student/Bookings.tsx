import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Video, User, Building2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { authFetch } from '../../store/auth';

interface Appointment {
  _id: string;
  agentId: { _id: string; profile: { firstName: string; lastName: string; avatar?: string } };
  consultancyId?: { _id: string; name: string; displayName?: string; logo?: string };
  startTime: string;
  endTime: string;
  status: string;
  topic: string;
  notes?: string;
  meetingLink?: string;
}

export default function Bookings() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch('/api/appointments')
      .then(res => res.json())
      .then(data => {
        setAppointments(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const upcoming = appointments.filter(a => new Date(a.startTime) > new Date()).sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  const past = appointments.filter(a => new Date(a.startTime) <= new Date()).sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  return (
    <div className="w-full animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">My Consultations</h1>
          <p className="text-slate-500 mt-1">Manage your 30-minute strategic sessions with registered migration agents.</p>
        </div>
        <Link 
          to="/student/consultancies"
          className="flex items-center gap-2 px-6 py-3 bg-ori-600 text-white rounded-xl font-bold hover:bg-ori-700 transition shadow-lg shadow-ori-600/20 active:scale-95 text-center justify-center shrink-0"
        >
          <CalendarIcon className="w-5 h-5" /> Book New Session
        </Link>
      </div>

      <div className="space-y-12">
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Upcoming Sessions
          </h2>
          
          {loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 rounded-full border-4 border-ori-500 border-t-transparent animate-spin" /></div>
          ) : upcoming.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-slate-200 border-dashed">
              <div className="w-16 h-16 bg-slate-50 rounded-lg flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <CalendarIcon className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">No upcoming sessions</h3>
              <p className="text-slate-500 font-medium mb-6">Ready to map out your PR pathway?</p>
              <Link to="/student/consultancies" className="px-6 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 hover:text-slate-900 transition-colors">
                Find an Agent
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {upcoming.map(apt => (
                <div key={apt._id} className="bg-white rounded-lg border border-slate-200 p-6 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-slate-100 border-2 border-white shadow-md overflow-hidden shrink-0">
                          {apt.agentId.profile?.avatar ? (
                            <img src={apt.agentId.profile.avatar} alt="Agent" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-full h-full p-3 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">{apt.agentId.profile?.firstName} {apt.agentId.profile?.lastName}</h3>
                          {apt.consultancyId && (
                            <p className="text-xs font-semibold text-slate-500 flex items-center gap-1 mt-0.5">
                              <Building2 className="w-3.5 h-3.5" /> {apt.consultancyId.displayName || apt.consultancyId.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold uppercase tracking-wider rounded-lg">
                        {apt.status}
                      </span>
                    </div>

                    <div className="mb-6">
                      <h4 className="font-bold text-slate-900 text-lg mb-2">{apt.topic}</h4>
                      {apt.notes && <p className="text-sm text-slate-600 line-clamp-2">{apt.notes}</p>}
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col gap-3">
                      <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                        <CalendarIcon className="w-5 h-5 text-ori-500" />
                        {new Date(apt.startTime).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                        <Clock className="w-5 h-5 text-ori-500" />
                        {new Date(apt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(apt.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <div className="mt-6">
                      {apt.meetingLink ? (
                        <a href={apt.meetingLink} target="_blank" rel="noreferrer" className="w-full py-3 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition shadow-md shadow-slate-900/20">
                          <Video className="w-5 h-5" /> Join Meeting
                        </a>
                      ) : (
                        <button disabled className="w-full py-3 rounded-xl bg-slate-100 text-slate-400 font-bold flex items-center justify-center gap-2 cursor-not-allowed border border-slate-200">
                          <Video className="w-5 h-5" /> Link not available yet
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {past.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <History className="w-5 h-5 text-slate-400" /> Past Sessions
            </h2>
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold border-b border-slate-200">
                      <th className="p-4 pl-6">Date</th>
                      <th className="p-4">Agent</th>
                      <th className="p-4">Topic</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 pr-6"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {past.map(apt => (
                      <tr key={apt._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 pl-6">
                          <div className="text-sm font-bold text-slate-900">{new Date(apt.startTime).toLocaleDateString()}</div>
                          <div className="text-xs text-slate-500">{new Date(apt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0">
                              {apt.agentId.profile?.avatar ? (
                                <img src={apt.agentId.profile.avatar} alt="Agent" className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-full h-full p-1.5 text-slate-400" />
                              )}
                            </div>
                            <span className="text-sm font-bold text-slate-700">{apt.agentId.profile?.firstName}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-slate-700 font-medium">{apt.topic}</span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${apt.status === 'COMPLETED' ? 'bg-slate-100 text-slate-600' : 'bg-red-50 text-red-600'}`}>
                            {apt.status === 'COMPLETED' ? 'Completed' : apt.status}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <Link to="/student/consultancies" className="text-sm font-bold text-ori-600 hover:text-ori-700 flex items-center gap-1 justify-end">
                            Book Again <ExternalLink className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function History(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}
