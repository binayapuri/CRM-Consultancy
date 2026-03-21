import { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { authFetch } from '../../store/auth';
import { safeJson } from '../../store/auth';
import { resolveFileUrl } from '../../lib/imageUrl';
import { useUiStore } from '../../store/ui';
import { ArrowLeft, Save, Upload, X } from 'lucide-react';

type NewsCategory = { _id: string; name: string; slug: string; order?: number };

const emptyForm = () => ({
  title: '',
  summary: '',
  content: '',
  coverImage: '',
  categoryId: '' as string,
  tagsStr: '',
  isPublished: false,
});

export default function AdminNewsForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(emptyForm());
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const { showToast } = useUiStore();

  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await authFetch('/api/news/upload-cover', { method: 'POST', body: fd });
      const data = await safeJson<{ url?: string }>(res);
      if (!res.ok) throw new Error((data as any)?.error || 'Upload failed');
      if (data?.url) setForm(f => ({ ...f, coverImage: data.url ?? '' }));
      if (coverInputRef.current) coverInputRef.current.value = '';
    } catch (err: any) {
      showToast(err?.message || 'Upload failed', 'error');
    } finally {
      setUploadingCover(false);
    }
  };

  useEffect(() => {
    authFetch('/api/admin/news/categories')
      .then(r => safeJson<NewsCategory[]>(r))
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    authFetch(`/api/news/admin/${id}`)
      .then(r => safeJson<any>(r))
      .then(article => {
        if (article) {
          setForm({
            title: article.title || '',
            summary: article.summary || '',
            content: article.content || '',
            coverImage: article.coverImage || '',
            categoryId: (article.categoryId as any)?._id || article.categoryId || '',
            tagsStr: Array.isArray(article.tags) ? article.tags.join(', ') : '',
            isPublished: article.isPublished === true,
          });
        }
      })
      .catch(() => showToast('Failed to load article', 'error'))
      .finally(() => setLoading(false));
  }, [id, showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const tags = form.tagsStr ? form.tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];
      const payload = {
        title: form.title,
        summary: form.summary || undefined,
        content: form.content,
        coverImage: form.coverImage || undefined,
        categoryId: form.categoryId || undefined,
        tags,
        isPublished: form.isPublished,
      };
      if (isEdit && id) {
        const res = await authFetch(`/api/news/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await safeJson(res);
        if (!res.ok) throw new Error((data as any)?.error || 'Update failed');
        showToast('Article updated', 'success');
        navigate('/admin/news');
      } else {
        const res = await authFetch('/api/news', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await safeJson(res);
        if (!res.ok) throw new Error((data as any)?.error || 'Create failed');
        showToast('Article created', 'success');
        navigate('/admin/news');
      }
    } catch (e: any) {
      showToast(e?.message || 'Request failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <p className="text-slate-500">Loading…</p>
      </div>
    );
  }

  return (
    <div>
      <Link to="/admin/news" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to News
      </Link>
      <h1 className="text-2xl font-display font-bold text-slate-900">{isEdit ? 'Edit article' : 'Add news'}</h1>
      <p className="text-slate-500 mt-1">{isEdit ? 'Update the article below.' : 'Create a new news article.'}</p>

      <form onSubmit={handleSubmit} className="card mt-6 w-full space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="input w-full"
            placeholder="Article title"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Summary</label>
          <input
            type="text"
            value={form.summary}
            onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
            className="input w-full"
            placeholder="Short summary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Content *</label>
          <div className="min-h-[200px] [&_.quill]:min-h-[200px] [&_.ql-container]:min-h-[160px]">
            <ReactQuill
              theme="snow"
              value={form.content}
              onChange={value => setForm(f => ({ ...f, content: value ?? '' }))}
              placeholder="Write the article content here…"
              modules={{
                toolbar: [
                  [{ header: [1, 2, 3, false] }],
                  ['bold', 'italic', 'underline', 'strike'],
                  [{ list: 'ordered' }, { list: 'bullet' }],
                  ['link', 'blockquote'],
                  ['clean'],
                ],
              }}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Cover image</label>
          {form.coverImage ? (
            <div className="space-y-2">
              <div className="relative inline-block">
                <img
                  src={resolveFileUrl(form.coverImage)}
                  alt="Cover preview"
                  className="max-h-48 w-auto max-w-full rounded-lg border border-slate-200 object-contain bg-slate-50"
                />
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, coverImage: '' }))}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-900/70 text-white hover:bg-slate-900 transition"
                  aria-label="Remove cover"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverUpload}
              disabled={uploadingCover}
            />
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={uploadingCover}
              className="btn-secondary flex items-center gap-2"
            >
              <Upload className="w-4 h-4" /> {uploadingCover ? 'Uploading…' : 'Upload cover image'}
            </button>
          </div>
          <div className="mt-2">
            <label className="block text-xs text-slate-500 mb-1">Or paste image URL</label>
            <input
              type="text"
              value={form.coverImage}
              onChange={e => setForm(f => ({ ...f, coverImage: e.target.value }))}
              className="input w-full text-sm"
              placeholder="https://... or /uploads/..."
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
          <select
            value={form.categoryId}
            onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
            className="input w-full"
          >
            <option value="">— Select —</option>
            {categories.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tags (comma-separated)</label>
          <input
            type="text"
            value={form.tagsStr}
            onChange={e => setForm(f => ({ ...f, tagsStr: e.target.value }))}
            className="input w-full"
            placeholder="visa, 189, update"
          />
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))}
            className="w-5 h-5 rounded border-slate-300 text-ori-600 focus:ring-ori-500/50"
          />
          <span className="text-sm font-medium text-slate-700">Publish immediately</span>
        </label>
        <div className="flex gap-2 pt-4 border-t border-slate-100">
          <Link to="/admin/news" className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" /> {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create article'}
          </button>
        </div>
      </form>
    </div>
  );
}
