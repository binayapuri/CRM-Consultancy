import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus,
  Image as ImageIcon,
  MapPin,
  GraduationCap,
  LayoutGrid,
  X,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { authFetch } from '../../store/auth';
import { resolveFileUrl } from '../../lib/imageUrl';
import {
  extractFirstUrl,
  extractHashtags,
  buildPostTitle,
  linkDisplayTitle,
} from '../../lib/communityTextUtils';
import FeedImageMosaic from './FeedImageMosaic';

const LOCATIONS = ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Canberra', 'Gold Coast'];
const POST_CATEGORIES = [
  { value: 'ROOM_RENT', label: 'Room Rent' },
  { value: 'JOB_HELP', label: 'Job Help' },
  { value: 'COMMUNITY_SUPPORT', label: 'Community Support' },
  { value: 'STUDY_HELP', label: 'Study Help' },
  { value: 'GENERAL', label: 'General' },
];

type ModalKind = 'location' | 'university' | 'category' | null;

interface UserLite {
  profile?: { firstName?: string; lastName?: string; avatar?: string };
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPosted: () => void;
  user?: UserLite | null;
}

function categoryLabel(value: string) {
  return POST_CATEGORIES.find((c) => c.value === value)?.label || value;
}

export default function CommunityComposer({ open, onOpenChange, onPosted, user }: Props) {
  const [headline, setHeadline] = useState('');
  const [body, setBody] = useState('');
  const [hiddenTags, setHiddenTags] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [university, setUniversity] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [modal, setModal] = useState<ModalKind>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewDegraded, setPreviewDegraded] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkPreviewTitle, setLinkPreviewTitle] = useState('');
  const [linkPreviewDescription, setLinkPreviewDescription] = useState('');
  const [linkPreviewImage, setLinkPreviewImage] = useState('');
  const [tempUniversity, setTempUniversity] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewAbortRef = useRef<AbortController | null>(null);
  const lastFetchedUrlRef = useRef<string | null>(null);

  const allTags = extractHashtags(body);
  const visibleTags = allTags.filter((t) => !hiddenTags.includes(t));

  useEffect(() => {
    const tags = extractHashtags(body);
    setHiddenTags((h) => h.filter((t) => tags.includes(t)));
  }, [body]);

  const applyLocalFallback = useCallback((url: string, message: string | null) => {
    lastFetchedUrlRef.current = url;
    setLinkUrl(url);
    setLinkPreviewTitle(linkDisplayTitle(url));
    setLinkPreviewDescription('');
    setLinkPreviewImage('');
    setPreviewDegraded(true);
    setPreviewError(message);
  }, []);

  const fetchPreview = useCallback(
    async (url: string, forceRetry = false) => {
      previewAbortRef.current?.abort();
      const ac = new AbortController();
      previewAbortRef.current = ac;
      setPreviewLoading(true);
      setPreviewError(null);
      if (forceRetry) lastFetchedUrlRef.current = null;
      try {
        const res = await authFetch('/api/community/link-preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
          signal: ac.signal,
        });
        const data = (await res.json().catch(() => ({}))) as {
          url?: string;
          title?: string;
          description?: string;
          image?: string;
          degraded?: boolean;
          error?: string;
        };
        if (!res.ok) {
          lastFetchedUrlRef.current = null;
          applyLocalFallback(url, data.error || (res.status === 429 ? 'Too many preview requests. Try again later.' : null));
          return;
        }
        setLinkUrl(String(data.url || url));
        setLinkPreviewTitle(String(data.title ?? ''));
        setLinkPreviewDescription(String(data.description ?? ''));
        setLinkPreviewImage(String(data.image ?? ''));
        setPreviewDegraded(!!data.degraded);
        lastFetchedUrlRef.current = url;
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
        lastFetchedUrlRef.current = null;
        applyLocalFallback(
          url,
          'Could not reach preview service. You can still post this link.'
        );
      } finally {
        setPreviewLoading(false);
      }
    },
    [applyLocalFallback]
  );

  useEffect(() => {
    const url = extractFirstUrl(body);
    const t = setTimeout(() => {
      if (!url) {
        lastFetchedUrlRef.current = null;
        setLinkUrl('');
        setLinkPreviewTitle('');
        setLinkPreviewDescription('');
        setLinkPreviewImage('');
        setPreviewError(null);
        setPreviewDegraded(false);
        setPreviewLoading(false);
        return;
      }
      if (url === lastFetchedUrlRef.current) return;
      fetchPreview(url);
    }, 550);
    return () => clearTimeout(t);
  }, [body, fetchPreview]);

  const resetForm = () => {
    setHeadline('');
    setBody('');
    setHiddenTags([]);
    setLocation('');
    setUniversity('');
    setCategory('GENERAL');
    setImageUrls([]);
    setLinkUrl('');
    setLinkPreviewTitle('');
    setLinkPreviewDescription('');
    setLinkPreviewImage('');
    setPreviewError(null);
    setPreviewDegraded(false);
    setModal(null);
    setTempUniversity('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tags = extractHashtags(body).filter((t) => !hiddenTags.includes(t));
    const title = buildPostTitle(headline, body);
    const content = body.trim();
    if (content.length < 5) return;

    try {
      const payload: Record<string, unknown> = {
        title,
        content,
        tags,
        category: category || 'GENERAL',
        location: location || undefined,
        university: university.trim() || undefined,
      };
      if (imageUrls.length) payload.images = imageUrls.map((u) => ({ url: u }));
      const first = extractFirstUrl(body);
      if (first) {
        payload.linkUrl = linkUrl || first;
        if (linkPreviewTitle || linkPreviewDescription || linkPreviewImage) {
          payload.linkPreview = {
            title: linkPreviewTitle || undefined,
            description: linkPreviewDescription || undefined,
            image: linkPreviewImage || undefined,
          };
        }
      }

      const res = await authFetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        onOpenChange(false);
        resetForm();
        onPosted();
      }
    } catch {
      /* network error */
    }
  };

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || imageUrls.length >= 8) return;
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await authFetch('/api/community/upload-image', { method: 'POST', body: fd });
      if (res.ok) {
        const data = await res.json();
        if (data?.url) setImageUrls((prev) => [...prev, data.url]);
      }
    } catch {
      /* ignore */
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (url: string) => {
    setImageUrls((prev) => prev.filter((u) => u !== url));
  };

  const hideTag = (tag: string) => {
    setHiddenTags((h) => (h.includes(tag) ? h : [...h, tag]));
  };

  const firstUrl = extractFirstUrl(body);
  const showMetadataChips = Boolean(location || university.trim() || category !== 'GENERAL');

  const openUniversityModal = () => {
    setTempUniversity(university);
    setModal('university');
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        className="w-full text-left px-4 py-4 flex items-center gap-3 hover:bg-slate-50/80 transition"
      >
        {user && (
          <>
            {resolveFileUrl(user.profile?.avatar) ? (
              <img
                src={resolveFileUrl(user.profile?.avatar)}
                alt=""
                className="w-10 h-10 rounded-full object-cover border border-slate-100 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0 flex items-center justify-center text-slate-600 text-sm font-bold">
                {(user.profile?.firstName || 'Y').charAt(0)}
              </div>
            )}
          </>
        )}
        <span className="text-slate-500 font-medium">Start a post…</span>
        <Plus className="w-5 h-5 text-ori-600 ml-auto shrink-0" />
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3 border-t border-slate-100">
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-slate-900">Create post</h2>
        <button
          type="button"
          onClick={() => {
            onOpenChange(false);
            resetForm();
          }}
          className="text-sm text-slate-500 hover:text-slate-800"
        >
          Collapse
        </button>
      </div>

      <div>
        <label className="sr-only">Headline</label>
        <input
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          className="w-full text-lg font-semibold text-slate-900 placeholder:text-slate-400 border-0 border-b border-transparent focus:border-ori-200 focus:ring-0 px-0 py-1 bg-transparent"
          placeholder="Headline (optional)"
          maxLength={200}
        />
      </div>

      <div>
        <label className="sr-only">What do you want to share?</label>
        <textarea
          required
          minLength={5}
          rows={5}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="input resize-none w-full min-h-[120px] border-slate-200 rounded-xl"
          placeholder="What do you want to talk about? Use #hashtags for topics."
        />
      </div>

      {visibleTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {visibleTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full bg-ori-50 text-ori-800 text-sm font-medium border border-ori-100"
            >
              #{tag}
              <button
                type="button"
                onClick={() => hideTag(tag)}
                className="p-0.5 rounded-full hover:bg-ori-100"
                aria-label={`Remove ${tag}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {(previewLoading || linkUrl || firstUrl) && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-2">
          {previewLoading && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Loader2 className="w-4 h-4 animate-spin" /> Fetching link preview…
            </div>
          )}
          {!previewLoading && linkUrl && (
            <>
              {(previewDegraded || previewError) && (
                <p className="text-xs text-slate-600">
                  {previewError ||
                    'Could not load a rich preview for this site. You can still post — edit the title below if you like.'}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 justify-between gap-y-1">
                <p className="text-xs text-slate-500 truncate flex-1 min-w-0">{linkUrl}</p>
                {firstUrl && (
                  <button
                    type="button"
                    onClick={() => fetchPreview(firstUrl, true)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-ori-700 hover:text-ori-800 shrink-0"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Retry preview
                  </button>
                )}
              </div>
              <div className="flex gap-3 rounded-lg border border-slate-200 bg-white overflow-hidden">
                {linkPreviewImage ? (
                  <img
                    src={resolveFileUrl(linkPreviewImage) || linkPreviewImage}
                    alt=""
                    className="h-[150px] w-[150px] object-cover shrink-0"
                  />
                ) : (
                  <div className="h-[150px] w-[150px] shrink-0 bg-slate-100 flex items-center justify-center text-[10px] text-slate-500 px-1 text-center leading-tight">
                    Link
                  </div>
                )}
                <div className="flex-1 min-w-0 p-2 space-y-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Title</label>
                    <input
                      value={linkPreviewTitle}
                      onChange={(e) => setLinkPreviewTitle(e.target.value)}
                      className="input text-sm py-1.5 w-full"
                      placeholder="Preview title"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Description</label>
                    <textarea
                      value={linkPreviewDescription}
                      onChange={(e) => setLinkPreviewDescription(e.target.value)}
                      className="input text-sm py-1.5 w-full resize-none"
                      rows={2}
                      placeholder="Preview description"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {showMetadataChips && (
        <div className="flex flex-wrap gap-2">
          {location && (
            <span className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-sky-50 text-sky-900 text-sm border border-sky-100">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              {location}
              <button
                type="button"
                onClick={() => setLocation('')}
                className="p-0.5 rounded-full hover:bg-sky-100"
                aria-label="Remove location"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          {university.trim() && (
            <span className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-indigo-50 text-indigo-900 text-sm border border-indigo-100">
              <GraduationCap className="w-3.5 h-3.5 shrink-0" />
              {university.trim()}
              <button
                type="button"
                onClick={() => setUniversity('')}
                className="p-0.5 rounded-full hover:bg-indigo-100"
                aria-label="Remove university"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          {category !== 'GENERAL' && (
            <span className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-slate-100 text-slate-800 text-sm border border-slate-200">
              <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
              {categoryLabel(category)}
              <button
                type="button"
                onClick={() => setCategory('GENERAL')}
                className="p-0.5 rounded-full hover:bg-slate-200"
                aria-label="Reset category"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
        </div>
      )}

      {imageUrls.length > 0 && (
        <div className="mt-1">
          <FeedImageMosaic urls={imageUrls} onRemove={removeImage} compact />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-slate-100">
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
        <button
          type="button"
          disabled={uploadingImage || imageUrls.length >= 8}
          onClick={() => {
            setModal(null);
            fileInputRef.current?.click();
          }}
          className="p-2.5 rounded-full text-slate-600 hover:bg-slate-100 disabled:opacity-50"
          title="Photo"
        >
          <ImageIcon className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => setModal('location')}
          className={`p-2.5 rounded-full ${location ? 'text-ori-600 bg-ori-50' : 'text-slate-600 hover:bg-slate-100'}`}
          title="Location"
        >
          <MapPin className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={openUniversityModal}
          className={`p-2.5 rounded-full ${university ? 'text-ori-600 bg-ori-50' : 'text-slate-600 hover:bg-slate-100'}`}
          title="University"
        >
          <GraduationCap className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => setModal('category')}
          className={`p-2.5 rounded-full ${category !== 'GENERAL' ? 'text-ori-600 bg-ori-50' : 'text-slate-600 hover:bg-slate-100'}`}
          title="Category"
        >
          <LayoutGrid className="w-5 h-5" />
        </button>
      </div>

      {modal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setModal(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[85vh] overflow-y-auto p-5 border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {modal === 'location' && (
              <>
                <h3 className="font-bold text-slate-900 mb-3">Location</h3>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setLocation('');
                      setModal(null);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm ${!location ? 'bg-ori-50 font-semibold text-ori-800' : 'hover:bg-slate-50'}`}
                  >
                    None
                  </button>
                  {LOCATIONS.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => {
                        setLocation(loc);
                        setModal(null);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm ${location === loc ? 'bg-ori-50 font-semibold text-ori-800' : 'hover:bg-slate-50'}`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
                <button type="button" className="mt-4 btn-secondary w-full" onClick={() => setModal(null)}>
                  Close
                </button>
              </>
            )}
            {modal === 'university' && (
              <>
                <h3 className="font-bold text-slate-900 mb-3">University</h3>
                <input
                  value={tempUniversity}
                  onChange={(e) => setTempUniversity(e.target.value)}
                  className="input w-full"
                  placeholder="e.g. UNSW"
                  autoFocus
                />
                <div className="flex gap-2 mt-4">
                  <button type="button" className="btn-secondary flex-1" onClick={() => setModal(null)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-primary flex-1"
                    onClick={() => {
                      setUniversity(tempUniversity.trim());
                      setModal(null);
                    }}
                  >
                    Save
                  </button>
                </div>
              </>
            )}
            {modal === 'category' && (
              <>
                <h3 className="font-bold text-slate-900 mb-3">Category</h3>
                <div className="space-y-1">
                  {POST_CATEGORIES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => {
                        setCategory(c.value);
                        setModal(null);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm ${category === c.value ? 'bg-ori-50 font-semibold text-ori-800' : 'hover:bg-slate-50'}`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
                <button type="button" className="mt-4 btn-secondary w-full" onClick={() => setModal(null)}>
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => {
            onOpenChange(false);
            resetForm();
          }}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={body.trim().length < 5}>
          Post
        </button>
      </div>
    </form>
  );
}
