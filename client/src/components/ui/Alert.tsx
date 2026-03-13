import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export type AlertType = 'success' | 'error' | 'info';

type AlertProps = {
  type: AlertType;
  message: string;
  className?: string;
};

function alertStyles(type: AlertType) {
  const base = 'flex items-center gap-3 p-3 rounded-xl text-sm font-medium';
  if (type === 'success') return `${base} bg-emerald-50 text-emerald-800 border border-emerald-200`;
  if (type === 'error') return `${base} bg-red-50 text-red-800 border border-red-200`;
  return `${base} bg-indigo-50 text-indigo-800 border border-indigo-200`;
}

function AlertIcon({ type }: { type: AlertType }) {
  if (type === 'success') return <CheckCircle2 className="w-4 h-4 shrink-0" />;
  if (type === 'error') return <AlertTriangle className="w-4 h-4 shrink-0" />;
  return <Info className="w-4 h-4 shrink-0" />;
}

export default function Alert({ type, message, className = '' }: AlertProps) {
  if (!message) return null;
  return (
    <div className={`${alertStyles(type)} ${className}`} role="alert">
      <AlertIcon type={type} />
      <span>{message}</span>
    </div>
  );
}
