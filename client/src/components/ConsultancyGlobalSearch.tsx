import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch, safeJson } from '../store/auth';
import { Loader2, Search, X } from 'lucide-react';

type SearchResult = {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  href: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  consultancyId?: string | null;
};

export default function ConsultancyGlobalSearch({ open, onClose, consultancyId }: Props) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }
    const timer = window.setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([]);
        setLoading(false);
        setError(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ q: query.trim(), limit: '6' });
        if (consultancyId) params.set('consultancyId', consultancyId);
        const res = await authFetch(`/api/consultancy-ops/search?${params.toString()}`);
        const data = await safeJson<{ results?: SearchResult[]; error?: string }>(res);
        if (!res.ok) throw new Error(data?.error || 'Search failed');
        setResults(Array.isArray(data?.results) ? data.results : []);
      } catch (err: any) {
        setError(err?.message || 'Search failed');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => window.clearTimeout(timer);
  }, [open, query, consultancyId]);

  const groupedResults = useMemo(() => {
    return results.reduce<Record<string, SearchResult[]>>((acc, item) => {
      if (!acc[item.type]) acc[item.type] = [];
      acc[item.type].push(item);
      return acc;
    }, {});
  }, [results]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/50 backdrop-blur-sm p-4 sm:p-6" onClick={onClose}>
      <div className="mx-auto max-w-3xl rounded-3xl bg-white shadow-2xl border border-slate-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 sm:px-6 py-4">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clients, applications, leads, tasks, sponsors, invoices..."
            className="w-full bg-transparent outline-none text-slate-900 placeholder:text-slate-400"
          />
          {loading && <Loader2 className="w-4 h-4 text-slate-400 animate-spin shrink-0" />}
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-4 sm:px-6 py-4">
          {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

          {!error && query.trim().length < 2 && (
            <div className="py-10 text-center text-slate-500">
              <p className="font-medium text-slate-700">Start typing to search the consultancy workspace</p>
              <p className="text-sm mt-1">Use at least 2 characters. Keyboard shortcut: Cmd/Ctrl + K.</p>
            </div>
          )}

          {!error && query.trim().length >= 2 && !loading && results.length === 0 && (
            <div className="py-10 text-center text-slate-500">
              <p className="font-medium text-slate-700">No matches found</p>
              <p className="text-sm mt-1">Try a name, visa subclass, email, invoice number, or company.</p>
            </div>
          )}

          <div className="space-y-5">
            {Object.entries(groupedResults).map(([type, items]) => (
              <div key={type}>
                <h3 className="px-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{type}</h3>
                <div className="mt-2 space-y-2">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onClose();
                        navigate(item.href);
                      }}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left hover:border-ori-200 hover:bg-ori-50/40 transition"
                    >
                      <div className="font-medium text-slate-900">{item.title}</div>
                      {item.subtitle && <div className="mt-1 text-sm text-slate-500">{item.subtitle}</div>}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
