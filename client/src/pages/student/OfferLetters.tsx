import { useState, useEffect } from 'react';
import { authFetch } from '../../store/auth';
import { Building2, CheckCircle, GraduationCap, ArrowRight, FileText } from 'lucide-react';

export default function OfferLetters() {
  const [universities, setUniversities] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedUni, setSelectedUni] = useState<any>(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInitialData = async () => {
    try {
      const [uniRes, appRes] = await Promise.all([
        authFetch('/api/universities'),
        authFetch('/api/offer-letters/my-applications')
      ]);
      setUniversities(await uniRes.json());
      setApplications(await appRes.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const selectUni = async (uni: any) => {
    setSelectedUni(uni);
    const res = await authFetch(`/api/universities/${uni._id}/courses`);
    setCourses(await res.json());
  };

  const applyForCourse = async (courseId: string) => {
    try {
      const res = await authFetch('/api/offer-letters/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, studentNotes: 'I am highly interested in this program.' })
      });
      if (res.ok) {
        alert('Application submitted successfully!');
        fetchInitialData(); // Refresh apps
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to apply');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" /></div>;

  return (
    <div className="w-full animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">University Offer Letters</h1>
        <p className="text-slate-500 mt-1">Explore universities, compare courses, and apply for your offer letter directly.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2">
          {!selectedUni ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {universities.map((uni: any) => (
                <div 
                  key={uni._id} 
                  onClick={() => selectUni(uni)}
                  className="bg-white border border-slate-200 rounded-lg p-6 cursor-pointer hover:border-emerald-300 hover:shadow-lg transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors mb-4">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">{uni.name}</h3>
                  <p className="text-sm text-slate-500 mb-4">{uni.location?.city}, {uni.location?.state}</p>
                  <div className="flex items-center text-sm font-bold text-emerald-600">
                    View Courses <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <button 
                onClick={() => setSelectedUni(null)}
                className="text-sm font-bold text-slate-500 hover:text-slate-900 mb-4 flex items-center gap-1"
              >
                ← Back to Universities
              </button>
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-8 text-white mb-6 relative overflow-hidden">
                <div className="relative z-10">
                  <h2 className="text-2xl font-bold font-display">{selectedUni.name}</h2>
                  <p className="text-emerald-100 mt-1">{selectedUni.location?.city}, {selectedUni.location?.state}</p>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><GraduationCap className="w-5 h-5 text-emerald-500" /> Available Courses</h3>
                {courses.length === 0 ? <p className="text-slate-500 text-sm">No courses currently listed for this university.</p> : null}
                {courses.map((course: any) => {
                  const hasApplied = applications.some((app: any) => app.courseId?._id === course._id);
                  return (
                  <div key={course._id} className="bg-white border border-slate-200 p-6 rounded-lg shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-slate-900">{course.name}</h4>
                      <p className="text-sm text-slate-500">{course.level} • {course.duration} • ${course.tuitionFee}/yr</p>
                      {course.prPathwayPotential && <span className="inline-block mt-2 px-2 py-1 bg-amber-100 text-amber-700 text-[10px] uppercase font-bold rounded">High PR Potential</span>}
                    </div>
                    {hasApplied ? (
                       <button disabled className="px-6 py-2.5 bg-slate-100 text-slate-500 font-bold rounded-xl flex items-center gap-2 cursor-not-allowed">
                         <CheckCircle className="w-4 h-4" /> Applied
                       </button>
                    ) : (
                      <button 
                        onClick={() => applyForCourse(course._id)}
                        className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition shadow-sm shadow-emerald-500/20 active:scale-95"
                      >
                        Apply Now
                      </button>
                    )}
                  </div>
                )})}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-slate-50 p-6 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 flex items-center gap-2"><FileText className="w-5 h-5 text-slate-400" /> My Applications</h3>
            </div>
            <div className="p-2">
              {applications.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  You haven't applied for any offer letters yet.
                </div>
              ) : (
                applications.map((app: any) => (
                  <div key={app._id} className="p-4 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer border-b border-slate-100 last:border-0">
                    <p className="text-xs font-bold text-emerald-600 mb-1">{app.universityId?.name}</p>
                    <h4 className="font-bold text-slate-900 text-sm leading-tight mb-2">{app.courseId?.name}</h4>
                    <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded-md ${
                      app.status === 'OFFERED' ? 'bg-emerald-100 text-emerald-700' :
                      app.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' :
                      app.status === 'ACCEPTED' ? 'bg-sky-100 text-sky-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>{app.status.replace('_', ' ')}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
