import { LucideIcon } from 'lucide-react';

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  message?: string;
  action?: React.ReactNode;
  className?: string;
};

export default function EmptyState({ icon: Icon, title, message, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`p-12 text-center ${className}`}>
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="font-semibold text-slate-900">{title}</h3>
      {message && <p className="text-slate-500 mt-1 text-sm max-w-sm mx-auto">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
