'use client';

import { useEffect, useMemo, useState } from 'react';

interface UploadResponse {
  imageId: string;
  imageUrl: string;
}

type Phase = 'idle' | 'uploading' | 'processing' | 'success';

interface HistoryItem extends UploadResponse {
  createdAt: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
const HISTORY_STORAGE_KEY = 'image-transform-history';
const HISTORY_LIMIT = 12;
const HISTORY_TTL_MS = 24 * 60 * 60 * 1000;

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 bytes';
  const sizes = ['bytes', 'KB', 'MB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
};

const readErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

const uploadWithProgress = (
  file: File,
  onProgress: (percent: number) => void,
  onPhase: (phase: Phase) => void
): Promise<UploadResponse> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE_URL}/api/images/upload`);
    xhr.responseType = 'json';

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const percent = Math.round((event.loaded / event.total) * 100);
      onProgress(percent);
      if (percent >= 100) {
        onPhase('processing');
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response as UploadResponse);
        return;
      }

      const response = xhr.response as { message?: string } | null;
      const message = response?.message || xhr.statusText || 'Upload failed.';
      reject(new Error(message));
    };

    xhr.onerror = () => {
      reject(new Error('Network error. Please try again.'));
    };

    xhr.onabort = () => {
      reject(new Error('Upload was cancelled.'));
    };

    const formData = new FormData();
    formData.append('image', file);
    xhr.send(formData);
  });
};

const loadHistory = (): HistoryItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryItem[];
    if (!Array.isArray(parsed)) return [];
    const now = Date.now();
    const filtered = parsed.filter((item) => {
      if (!item?.imageId || !item?.imageUrl || !item?.createdAt) return false;
      const createdAtMs = Date.parse(item.createdAt);
      if (Number.isNaN(createdAtMs)) return false;
      return now - createdAtMs <= HISTORY_TTL_MS;
    });
    if (filtered.length !== parsed.length) {
      saveHistory(filtered);
    }
    return filtered;
  } catch {
    return [];
  }
};

const saveHistory = (items: HistoryItem[]) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage errors.
  }
};

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const isBusy = phase === 'uploading' || phase === 'processing' || isDeleting;

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  const fileMeta = useMemo(() => {
    if (!selectedFile) return null;
    return {
      name: selectedFile.name,
      size: formatBytes(selectedFile.size)
    };
  }, [selectedFile]);

  const handleFileChange = (file: File | null) => {
    setErrorMessage(null);
    setResult(null);
    setUploadProgress(0);
    setPhase('idle');
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMessage('Please choose an image file first.');
      return;
    }

    setErrorMessage(null);
    setResult(null);
    setUploadProgress(0);
    setPhase('uploading');

    try {
      const response = await uploadWithProgress(selectedFile, setUploadProgress, setPhase);
      const historyItem: HistoryItem = {
        imageId: response.imageId,
        imageUrl: response.imageUrl,
        createdAt: new Date().toISOString()
      };
      setHistory((prev) => {
        const next = [historyItem, ...prev.filter((item) => item.imageId !== response.imageId)].slice(0, HISTORY_LIMIT);
        saveHistory(next);
        return next;
      });
      setResult(response);
      setPhase('success');
      setToast('Image processed successfully.');
    } catch (error) {
      setPhase('idle');
      setErrorMessage(readErrorMessage(error, 'Upload failed.'));
    }
  };

  const handleCopy = async () => {
    if (!result?.imageUrl) return;
    try {
      await navigator.clipboard.writeText(result.imageUrl);
      setToast('URL copied to clipboard.');
    } catch {
      setErrorMessage('Copy failed. Please copy the URL manually.');
    }
  };

  const handleDelete = async () => {
    if (!result?.imageId) return;

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/images/${encodeURIComponent(result.imageId)}`,
        { method: 'DELETE' }
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message || 'Delete failed.');
      }

      setHistory((prev) => {
        const next = prev.filter((item) => item.imageId !== result.imageId);
        saveHistory(next);
        return next;
      });
      setResult(null);
      setPhase('idle');
      setToast('Image deleted.');
    } catch (error) {
      setErrorMessage(readErrorMessage(error, 'Delete failed.'));
    } finally {
      setIsDeleting(false);
    }
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (isBusy) return;

    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleHistoryCopy = async (imageUrl: string) => {
    try {
      await navigator.clipboard.writeText(imageUrl);
      setToast('URL copied to clipboard.');
    } catch {
      setErrorMessage('Copy failed. Please copy the URL manually.');
    }
  };

  const handleHistoryDelete = async (imageId: string) => {
    if (!imageId) return;
    setIsDeleting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/images/${encodeURIComponent(imageId)}`,
        { method: 'DELETE' }
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message || 'Delete failed.');
      }

      setHistory((prev) => {
        const next = prev.filter((item) => item.imageId !== imageId);
        saveHistory(next);
        return next;
      });

      if (result?.imageId === imageId) {
        setResult(null);
        setPhase('idle');
      }

      setToast('Image deleted.');
    } catch (error) {
      setErrorMessage(readErrorMessage(error, 'Delete failed.'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen px-6 py-12 text-ink">
      <div className="mx-auto max-w-6xl">
        <header className="relative overflow-hidden rounded-[32px] border border-black/5 bg-paper/80 p-8 shadow-glow backdrop-blur">
          <div className="absolute inset-0 texture-grid opacity-30" />
          <div className="relative z-10 flex flex-col gap-4">
            <p className="text-sm uppercase tracking-[0.3em] text-ink/50">Image Transformation Lab</p>
            <h1 className="font-display text-4xl font-semibold leading-tight text-ink md:text-5xl">
              Remove backgrounds, flip horizontally, and ship a clean URL.
            </h1>
          </div>
        </header>

        <main className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <section className="relative rounded-[28px] border border-black/5 bg-white/70 p-6 shadow-xl backdrop-blur">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Upload & Preview</h2>
              <span className="rounded-full bg-lagoon/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-lagoon">
                {phase === 'processing' ? 'Processing' : phase === 'uploading' ? 'Uploading' : phase === 'success' ? 'Ready' : 'Idle'}
              </span>
            </div>

            <div
              className={`mt-5 flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-4 text-center transition ${
                isBusy ? 'border-ember/40 bg-ember/5' : 'border-black/10 bg-white/60 hover:border-ember/60'
              }`}
              onDrop={onDrop}
              onDragOver={onDragOver}
            >
              <p className="text-sm text-ink/60">Drag and drop a PNG, JPG, or WEBP</p>
              <label className={`cursor-pointer rounded-full border border-black/10 bg-ink px-4 py-2 text-sm font-semibold text-white transition ${
                isBusy ? 'opacity-60' : 'hover:-translate-y-0.5 hover:bg-dusk'
              }`}>
                Choose File
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(event) => handleFileChange(event.target.files?.[0] || null)}
                  disabled={isBusy}
                />
              </label>
              {fileMeta && (
                <div className="text-xs text-ink/60">
                  <span className="font-semibold text-ink">{fileMeta.name}</span> - {fileMeta.size}
                </div>
              )}
            </div>

            {previewUrl && (
              <div className="mt-5 overflow-hidden rounded-2xl border border-black/5">
                <img src={previewUrl} alt="Selected preview" className="h-auto w-full" />
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3">
              <button
                className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold uppercase tracking-wide transition ${
                  isBusy
                    ? 'cursor-not-allowed bg-ember/30 text-ink/60'
                    : 'bg-ember text-white hover:-translate-y-0.5 hover:bg-[#e66a11]'
                }`}
                onClick={handleUpload}
                disabled={isBusy || !selectedFile}
              >
                {phase === 'processing'
                  ? 'Finishing up...'
                  : phase === 'uploading'
                  ? `Uploading ${uploadProgress}%`
                  : 'Upload & Transform'}
              </button>

              {phase !== 'idle' && (
                <div className="rounded-2xl bg-ink/5 px-4 py-3">
                  <div className="flex items-center justify-between text-xs text-ink/70">
                    <span>{phase === 'processing' ? 'Processing image' : 'Upload progress'}</span>
                    <span>{phase === 'processing' ? 'Working...' : `${uploadProgress}%`}</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ink/10">
                    <div
                      className={`h-full rounded-full bg-lagoon transition-all ${
                        phase === 'processing' ? 'animate-pulse' : ''
                      }`}
                      style={{ width: `${phase === 'processing' ? 100 : uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="rounded-2xl border border-ember/40 bg-ember/10 px-4 py-3 text-sm text-ink">
                  {errorMessage}
                </div>
              )}
            </div>
          </section>

          <section className="relative overflow-hidden rounded-[28px] border border-black/5 bg-white/70 p-6 shadow-xl backdrop-blur">
            <div className="absolute -right-10 top-10 h-32 w-32 rounded-full bg-ember/20 blur-2xl" />
            <div className="absolute -left-14 bottom-6 h-32 w-32 rounded-full bg-lagoon/20 blur-2xl" />
            <div className="relative z-10 flex h-full flex-col gap-6">
              <div>
                <h2 className="text-lg font-semibold">Result</h2>
                <p className="mt-2 text-sm text-ink/60">
                  Get the public URL, share it instantly, or remove it from the cloud.
                </p>
              </div>

              {result ? (
                <div className="flex flex-col gap-4">
                  <div className="overflow-hidden rounded-2xl border border-black/5">
                    <img src={result.imageUrl} alt="Processed result" className="h-auto w-full" />
                  </div>
                  <div className="rounded-2xl border border-black/5 bg-white px-4 py-3 text-xs text-ink/70">
                    <p className="font-semibold text-ink">Hosted URL</p>
                    <p className="mt-1 break-words">{result.imageUrl}</p>
                  </div>
                  <div className="flex flex-col gap-3 md:flex-row">
                    <button
                      className="flex-1 rounded-2xl border border-ink/10 bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-dusk"
                      onClick={handleCopy}
                    >
                      Copy URL
                    </button>
                    <button
                      className={`flex-1 rounded-2xl border border-ember/20 px-4 py-3 text-sm font-semibold transition ${
                        isDeleting
                          ? 'cursor-not-allowed bg-ember/20 text-ink/60'
                          : 'bg-white text-ink hover:-translate-y-0.5 hover:bg-ember/10'
                      }`}
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete Image'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-black/10 bg-white/50 p-6 text-center text-sm text-ink/60">
                  <span className="font-display text-3xl text-ink/70 animate-float-slow">Preview</span>
                  <p>Processed images will appear here after upload.</p>
                </div>
              )}
            </div>
          </section>
        </main>

        <section className="mt-6 rounded-[28px] border border-black/5 bg-white/70 p-6 shadow-xl backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">History</h2>
              <p className="mt-1 text-sm text-ink/60">
                Stored locally in your browser. We automatically clear history after 24 hours.
              </p>
            </div>
            <span className="rounded-full bg-ink/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ink/60">
              {history.length} items
            </span>
          </div>

          {history.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-black/10 bg-white/50 p-6 text-center text-sm text-ink/60">
              No processed images yet.
            </div>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {history.map((item) => (
                <div key={item.imageId} className="overflow-hidden rounded-2xl border border-black/5 bg-white">
                  <div className="aspect-[4/5] w-full overflow-hidden bg-ink/5">
                    <img src={item.imageUrl} alt="Processed history item" className="h-full w-full object-contain" />
                  </div>
                  <div className="flex flex-col gap-2 px-3 py-3 text-xs text-ink/70">
                    <div className="line-clamp-2 break-words">{item.imageUrl}</div>
                    <div className="flex gap-2">
                      <button
                        className="flex-1 rounded-full border border-ink/10 bg-ink px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-dusk"
                        onClick={() => handleHistoryCopy(item.imageUrl)}
                      >
                        Copy URL
                      </button>
                      <button
                        className={`flex-1 rounded-full border border-ember/20 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide transition ${
                          isDeleting
                            ? 'cursor-not-allowed bg-ember/20 text-ink/60'
                            : 'bg-white text-ink hover:-translate-y-0.5 hover:bg-ember/10'
                        }`}
                        onClick={() => handleHistoryDelete(item.imageId)}
                        disabled={isDeleting}
                      >
                        Delete
                      </button>
                    </div>
                    <div className="text-[11px] text-ink/50">
                      {new Date(item.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <footer className="mt-10 text-xs text-ink/50">
          Allowed formats: PNG, JPG, WEBP - Max size 5MB - Powered by remove.bg and Cloudinary
        </footer>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 rounded-full bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
