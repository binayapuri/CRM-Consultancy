import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authFetch } from '../../store/auth';
import { format } from 'date-fns';
import { ArrowLeft, Pencil, Trash2, UserPlus, Mail, Phone, User, FileText, Calendar, Building2 } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const consultancyId = searchParams.get('consultancyId');
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const baseUrl = consultancyId ? `/consultancy/leads?consultancyId=${consultancyId}` : '/consultancy/leads';
  const editUrl = consultancyId ? `/consultancy/leads/${id}/edit?consultancyId=${consultancyId}` : `/consultancy/leads/${id}/edit`;

  useEffect(() => {
    if (!id) return;
    authFetch(`/api/leads/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setLead(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleConvert = async () => {
    if (!confirm('Convert this lead to a client?')) return;
    try {
      const res = await authFetch(`/api/leads/${id}/convert`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.client?._id) navigate(consultancyId ? `/consultancy/clients/${data.client._id}?consultancyId=${consultancyId}` : `/consultancy/clients/${data.client._id}`);
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this lead? This cannot be undone.')) return;
    try {
      const res = await authFetch(`/api/leads/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error);
      navigate(baseUrl);
    } catch (e) {
      alert((e as Error).message);
    }
  };

  if (loading) return <div className="flex items-center gap-2 text-slate-500"><LoadingSpinner size="sm" /> Loading...</div>;
  if (error || !lead) return <div className="card p-8 text-center text-red-600">{error || 'Lead not found'}</div>;

  const p = lead.profile || {};
  const backLink = <Link to={baseUrl} className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"><ArrowLeft className="w-4 h-4" /> Back to Leads</Link>;

  return (
    <div>
      {backLink}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">{p.firstName} {p.lastName}</h1>
          <p className="text-slate-500 mt-1">Lead details • Created {format(new Date(lead.createdAt), 'dd MMM yyyy')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={lead.status} className="text-sm px-3 py-1" />
          {lead.status !== 'CONVERTED' && (
            <>
              <Link to={editUrl} className="btn-secondary flex items-center gap-2"><Pencil className="w-4 h-4" /> Edit</Link>
              <button onClick={handleConvert} className="btn-primary flex items-center gap-2"><UserPlus className="w-4 h-4" /> Convert to Client</button>
            </>
          )}
          <button onClick={handleDelete} className="btn-secondary text-red-600 hover:bg-red-50 flex items-center gap-2"><Trash2 className="w-4 h-4" /> Delete</button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Profile Card */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-ori-100 flex items-center justify-center"><User className="w-5 h-5 text-ori-600" /></div>
            <h3 className="font-semibold text-slate-900">Profile</h3>
          </div>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-slate-500">Name</dt><dd className="font-medium text-slate-900">{p.firstName} {p.lastName}</dd></div>
            <div><dt className="text-slate-500">Status</dt><dd><StatusBadge status={lead.status} /></dd></div>
            <div><dt className="text-slate-500">Source</dt><dd className="text-slate-700">{lead.source || '—'}</dd></div>
          </dl>
        </div>

        {/* Contact Card */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><Mail className="w-5 h-5 text-blue-600" /></div>
            <h3 className="font-semibold text-slate-900">Contact</h3>
          </div>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-slate-500">Email</dt><dd><a href={`mailto:${p.email}`} className="text-ori-600 hover:underline">{p.email || '—'}</a></dd></div>
            <div><dt className="text-slate-500">Phone</dt><dd><a href={`tel:${p.phone}`} className="text-ori-600 hover:underline">{p.phone || '—'}</a></dd></div>
          </dl>
        </div>

        {/* Interest & Visa Card */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><FileText className="w-5 h-5 text-amber-600" /></div>
            <h3 className="font-semibold text-slate-900">Interest</h3>
          </div>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-slate-500">Visa / Service Interest</dt><dd className="text-slate-700">{p.interest || '—'}</dd></div>
          </dl>
        </div>

        {/* Assigned To Card */}
        {lead.assignedTo && (
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center"><Building2 className="w-5 h-5 text-violet-600" /></div>
              <h3 className="font-semibold text-slate-900">Assigned To</h3>
            </div>
            <p className="text-slate-700">{lead.assignedTo.profile?.firstName} {lead.assignedTo.profile?.lastName}</p>
          </div>
        )}

        {/* Notes Card */}
        {p.notes && (
          <div className="card md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center"><FileText className="w-5 h-5 text-slate-600" /></div>
              <h3 className="font-semibold text-slate-900">Notes</h3>
            </div>
            <p className="text-slate-600 text-sm whitespace-pre-wrap">{p.notes}</p>
          </div>
        )}

        {/* Timeline Card */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center"><Calendar className="w-5 h-5 text-slate-600" /></div>
            <h3 className="font-semibold text-slate-900">Timeline</h3>
          </div>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-slate-500">Created</dt><dd>{format(new Date(lead.createdAt), 'dd MMM yyyy HH:mm')}</dd></div>
            {lead.lastContactAt && <div><dt className="text-slate-500">Last Contact</dt><dd>{format(new Date(lead.lastContactAt), 'dd MMM yyyy')}</dd></div>}
            {lead.convertedToClientId && <div><dt className="text-slate-500">Converted</dt><dd><Link to={consultancyId ? `/consultancy/clients/${lead.convertedToClientId?._id || lead.convertedToClientId}?consultancyId=${consultancyId}` : `/consultancy/clients/${lead.convertedToClientId?._id || lead.convertedToClientId}`} className="text-ori-600 hover:underline">View Client →</Link></dd></div>}
          </dl>
        </div>
      </div>
    </div>
  );
}
