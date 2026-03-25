import { useId, useState } from 'react';
import { authFetch } from '../../store/auth';
import { useUiStore } from '../../store/ui';

type Doc = { _id?: string; name?: string; originalName?: string; fileUrl?: string; url?: string; mimeType?: string };

type Props = {
  jobId: string;
  documents: Doc[];
  onSuccess: () => void;
  onCancel: () => void;
};

export default function StudentApplyModal({ jobId, documents, onSuccess, onCancel }: Props) {
  const uid = useId();
  const { showToast } = useUiStore();
  const [vaultResume, setVaultResume] = useState('');
  const [manualResumeUrl, setManualResumeUrl] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [vaultCover, setVaultCover] = useState('');
  const [coverText, setCoverText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const docList = Array.isArray(documents) ? documents : [];
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const toAbsolute = (u: string) => {
    if (!u) return '';
    return u.startsWith('http') ? u : `${origin}${u.startsWith('/') ? '' : '/'}${u}`;
  };

  const submit = async () => {
    const body: Record<string, string> = {};
    const resumeFromUrl = manualResumeUrl.trim() || vaultResume.trim();
    if (resumeFromUrl) body.resumeUrl = toAbsolute(resumeFromUrl);
    if (resumeText.trim().length >= 20) body.resumeText = resumeText.trim();
    const coverFrom = vaultCover.trim();
    if (coverFrom) body.coverLetterUrl = toAbsolute(coverFrom);
    if (coverText.trim()) body.coverLetterText = coverText.trim();

    if (!body.resumeUrl && !body.resumeText) {
      showToast('Select a resume from your vault, paste a resume URL, or paste resume text (min 20 characters).', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await authFetch(`/api/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        showToast('Application submitted!', 'success');
        onSuccess();
        return;
      }
      const err = await res.json().catch(() => ({}));
      showToast(err.error || 'Apply failed', 'error');
    } catch {
      showToast('Apply failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">Attach a resume from your vault, paste a public URL (e.g. Google Drive / LinkedIn), or paste your resume text.</p>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-2" htmlFor={`${uid}-resume-sel`}>
          Resume from vault
        </label>
        <select
          id={`${uid}-resume-sel`}
          className="w-full px-4 py-3 rounded-xl border border-slate-200"
          value={vaultResume}
          onChange={(e) => setVaultResume(e.target.value)}
        >
          <option value="">— Optional if using URL or text below —</option>
          {docList
            .filter((d) => !d.mimeType || d.mimeType.includes('pdf') || d.mimeType.includes('word') || d.mimeType.includes('officedocument'))
            .map((d) => (
              <option key={d._id} value={d.fileUrl || d.url || ''}>
                {d.name || d.originalName || 'Document'}
              </option>
            ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-2" htmlFor={`${uid}-resume-url`}>
          Or resume URL
        </label>
        <input
          id={`${uid}-resume-url`}
          className="w-full px-4 py-3 rounded-xl border border-slate-200"
          placeholder="https://…"
          value={manualResumeUrl}
          onChange={(e) => setManualResumeUrl(e.target.value)}
        />
        <p className="text-xs text-slate-400 mt-1">If you type a URL here, it overrides the vault selection above.</p>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-2" htmlFor={`${uid}-resume-text`}>
          Or paste resume text
        </label>
        <textarea
          id={`${uid}-resume-text`}
          rows={5}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm"
          placeholder="Paste plain-text resume (at least 20 characters) if you do not have a file URL."
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-2" htmlFor={`${uid}-cover-sel`}>
          Cover letter (optional)
        </label>
        <select
          id={`${uid}-cover-sel`}
          className="w-full px-4 py-3 rounded-xl border border-slate-200"
          value={vaultCover}
          onChange={(e) => setVaultCover(e.target.value)}
        >
          <option value="">— None —</option>
          {docList.map((d) => (
            <option key={`c-${d._id}`} value={d.fileUrl || d.url || ''}>
              {d.name || d.originalName || 'Document'}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-2" htmlFor={`${uid}-cover-text`}>
          Cover letter text (optional)
        </label>
        <textarea
          id={`${uid}-cover-text`}
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm"
          value={coverText}
          onChange={(e) => setCoverText(e.target.value)}
        />
      </div>

      {docList.length === 0 && (
        <p className="text-amber-700 text-sm font-medium bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          No documents in your vault yet — use a public resume URL or paste your resume text below.
        </p>
      )}

      <div className="flex gap-2 justify-end pt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50">
          Cancel
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={submit}
          className="px-6 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'Submit application'}
        </button>
      </div>
    </div>
  );
}
