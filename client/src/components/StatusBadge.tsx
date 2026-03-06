type StatusBadgeProps = {
  status: string;
  className?: string;
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  ARCHIVED: 'bg-slate-100 text-slate-600',
  LEAD: 'bg-amber-100 text-amber-700',
  DISCONNECTED: 'bg-red-100 text-red-700',
  LODGED: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  DRAFTING: 'bg-blue-100 text-blue-700',
  ONBOARDING: 'bg-slate-100 text-slate-600',
  PENDING_INFO: 'bg-amber-100 text-amber-700',
  REVIEW: 'bg-violet-100 text-violet-700',
  DECISION: 'bg-indigo-100 text-indigo-700',
  PENDING: 'bg-amber-100 text-amber-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  NEW: 'bg-slate-100 text-slate-600',
  CONTACTED: 'bg-amber-100 text-amber-700',
  CONVERTED: 'bg-green-100 text-green-700',
  QUALIFIED: 'bg-amber-100 text-amber-700',
  LOST: 'bg-red-100 text-red-700',
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  SEND: 'bg-violet-100 text-violet-700',
};

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const color = STATUS_COLORS[status] || 'bg-slate-100 text-slate-600';
  const label = (status || '').replace(/_/g, ' ');
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${color} ${className}`}>
      {label}
    </span>
  );
}
