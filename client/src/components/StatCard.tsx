import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

type StatCardProps = {
  label: string;
  value: number | string | ReactNode;
  icon: LucideIcon;
  color: string;
  to?: string;
  onClick?: () => void;
};

export default function StatCard({ label, value, icon: Icon, color, to, onClick }: StatCardProps) {
  const content = (
    <>
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-slate-500 text-sm">{label}</p>
      </div>
    </>
  );

  const baseClass = 'card flex items-center gap-4 transition hover:shadow-md';
  const interactiveClass = to || onClick ? 'cursor-pointer hover:border-ori-300' : '';

  if (to) {
    return (
      <Link to={to} className={`${baseClass} ${interactiveClass} block`}>
        {content}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${baseClass} ${interactiveClass} w-full text-left`}>
        {content}
      </button>
    );
  }
  return (
    <div className={baseClass}>
      {content}
    </div>
  );
}
