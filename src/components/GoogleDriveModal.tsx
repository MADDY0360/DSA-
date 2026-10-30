import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import {
  Check,
  Cloud,
  Copy,
  Download,
  ExternalLink,
  LogOut,
  RefreshCw,
  Save,
  Share2,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import {
  createDriveSaveFile,
  deleteDriveSaveFile,
  downloadDriveSaveFile,
  DriveSaveFileMeta,
  getAccessToken,
  getCurrentAuthUser,
  googleSignIn,
  initAuth,
  listCampusSaveFiles,
  logout,
  overwriteDriveSaveFile,
} from '../services/googleDrive';
import { CloudSavePayload } from '../types/game';

interface GoogleDriveModalProps {
  currentSavePayload: CloudSavePayload;
  onRestoreCloudSave: (payload: CloudSavePayload) => void;
  onClose: () => void;
}

type PendingConfirmation =
  | { type: 'OVERWRITE'; file: DriveSaveFileMeta }
  | { type: 'DELETE'; file: DriveSaveFileMeta }
  | null;

function resolveShareableGameUrl(): string {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  if (origin.includes('ais-dev-')) {
    return origin.replace('ais-dev-', 'ais-pre-');
  }
  return origin;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  currentSavePayload,
  onRestoreCloudSave,
  onClose,
}) => {
  const shareUrl = useMemo(() => resolveShareableGameUrl(), []);
  const [copiedLink, setCopiedLink] = useState(false);

  const [needsAuth, setNeedsAuth] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(() => getCurrentAuthUser());
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const [files, setFiles] = useState<DriveSaveFileMeta[]>([]);
  const [saveFileName, setSaveFileName] = useState<string>(
    `campus-escape-vit-lv${currentSavePayload.currentLevel}-save.json`
  );
  const [feedbackMessage, setFeedbackMessage] = useState<{
    kind: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirmation>(null);

  const fetchDriveFiles = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) {
      setNeedsAuth(true);
      return;
    }
    setIsBusy(true);
    try {
      const list = await listCampusSaveFiles();
      setFiles(list);
      setNeedsAuth(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to load Drive files';
      if (msg === 'AUTH_REQUIRED') {
        setNeedsAuth(true);
      } else {
        setFeedbackMessage({ kind: 'error', text: msg });
      }
    } finally {
      setIsBusy(false);
    }
  }, []);

  useEffect(() => {
    const unsub = initAuth(
      (authedUser) => {
        setUser(authedUser);
        setNeedsAuth(false);
        void fetchDriveFiles();
      },
      () => {
        setUser(getCurrentAuthUser());
        setNeedsAuth(true);
      }
    );
    return () => unsub();
  }, [fetchDriveFiles]);

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    } catch {
      setFeedbackMessage({
        kind: 'info',
        text: `Share URL: ${shareUrl}`,
      });
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setFeedbackMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setNeedsAuth(false);
        await fetchDriveFiles();
        setFeedbackMessage({
          kind: 'success',
          text: `Connected Google Drive as ${result.user.email || result.user.displayName || 'Player'}.`,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign-in cancelled or failed.';
      setFeedbackMessage({ kind: 'error', text: msg });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setFiles([]);
    setNeedsAuth(true);
    setFeedbackMessage({ kind: 'info', text: 'Signed out of Google Drive.' });
  };

  const handleCreateNewSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = await getAccessToken();
    if (!token) {
      setNeedsAuth(true);
      return;
    }

    setIsBusy(true);
    setFeedbackMessage(null);
    try {
      const cleanName =
        saveFileName.trim() || `campus-escape-vit-lv${currentSavePayload.currentLevel}-save.json`;
      const finalName = cleanName.includes('campus-escape-vit')
        ? cleanName
        : `campus-escape-vit-${cleanName}`;
      const created = await createDriveSaveFile(finalName, {
        ...currentSavePayload,
        savedAt: new Date().toISOString(),
      });
      await fetchDriveFiles();
      setFeedbackMessage({
        kind: 'success',
        text: `Saved "${created.name}" to your Google Drive!`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save to Google Drive';
      if (msg === 'AUTH_REQUIRED') {
        setNeedsAuth(true);
      } else {
        setFeedbackMessage({ kind: 'error', text: msg });
      }
    } finally {
      setIsBusy(false);
    }
  };

  const handleLoadSave = async (file: DriveSaveFileMeta) => {
    const token = await getAccessToken();
    if (!token) {
      setNeedsAuth(true);
      return;
    }

    setIsBusy(true);
    setFeedbackMessage(null);
    try {
      const payload = await downloadDriveSaveFile(file.id);
      onRestoreCloudSave(payload);
      setFeedbackMessage({
        kind: 'success',
        text: `Loaded "${file.name}" (Level ${payload.currentLevel}, ${payload.leaderboardEntries?.length || 0} leaderboard entries)!`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load save file';
      if (msg === 'AUTH_REQUIRED') {
        setNeedsAuth(true);
      } else {
        setFeedbackMessage({ kind: 'error', text: msg });
      }
    } finally {
      setIsBusy(false);
    }
  };

  const executeConfirmedAction = async () => {
    if (!pendingConfirm) return;
    const action = pendingConfirm;
    setPendingConfirm(null);

    const token = await getAccessToken();
    if (!token) {
      setNeedsAuth(true);
      return;
    }

    setIsBusy(true);
    setFeedbackMessage(null);
    try {
      if (action.type === 'OVERWRITE') {
        const updated = await overwriteDriveSaveFile(action.file.id, {
          ...currentSavePayload,
          savedAt: new Date().toISOString(),
        });
        await fetchDriveFiles();
        setFeedbackMessage({
          kind: 'success',
          text: `Updated "${updated.name}" on Google Drive.`,
        });
      } else {
        await deleteDriveSaveFile(action.file.id);
        await fetchDriveFiles();
        setFeedbackMessage({
          kind: 'info',
          text: `Deleted "${action.file.name}" from Google Drive.`,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed';
      if (msg === 'AUTH_REQUIRED') {
        setNeedsAuth(true);
      } else {
        setFeedbackMessage({ kind: 'error', text: msg });
      }
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 bg-slate-950/85 flex items-center justify-center p-4 md:p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Cloud className="w-5 h-5 text-sky-400" />
            <div>
              <h2 className="text-xl font-bold text-white">
                Share Game Link &amp; Google Drive Sync
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Copy the playable game link or sync Maddy’s progress &amp; leaderboard to Google Drive
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close Share and Google Drive modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* 1. Shareable Game Link Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Share2 className="w-4 h-4 text-amber-400" />
                <span>Playable Game Link</span>
              </div>
              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 font-medium"
              >
                <span>Open in New Tab</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                onFocus={(e) => e.currentTarget.select()}
                aria-label="Shareable game URL"
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={handleCopyShareLink}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Game Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Feedback Banner */}
          {feedbackMessage && (
            <div
              className={`rounded-xl px-4 py-3 text-xs border ${
                feedbackMessage.kind === 'success'
                  ? 'bg-emerald-950/50 border-emerald-700/60 text-emerald-300'
                  : feedbackMessage.kind === 'error'
                  ? 'bg-red-950/50 border-red-700/60 text-red-300'
                  : 'bg-slate-950 border-slate-700 text-slate-300'
              }`}
            >
              {feedbackMessage.text}
            </div>
          )}

          {/* Explicit Destructive / Mutating Action Confirmation Dialog */}
          {pendingConfirm && (
            <div className="bg-amber-950/40 border border-amber-500/60 rounded-xl p-4 space-y-3">
              <div className="text-sm font-semibold text-amber-200">
                {pendingConfirm.type === 'DELETE'
                  ? `Delete "${pendingConfirm.file.name}" from Google Drive?`
                  : `Update the contents of "${pendingConfirm.file.name}" on Google Drive?`}
              </div>
              <p className="text-xs text-slate-300">
                {pendingConfirm.type === 'DELETE'
                  ? 'This will permanently delete this save file from your Google Drive. This action cannot be undone.'
                  : `This will overwrite "${pendingConfirm.file.name}" with your current Level ${currentSavePayload.currentLevel} progress (${currentSavePayload.score} pts) and leaderboard entries.`}
              </p>
              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setPendingConfirm(null)}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeConfirmedAction}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                    pendingConfirm.type === 'DELETE'
                      ? 'bg-red-500 hover:bg-red-400 text-slate-950'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  }`}
                >
                  {pendingConfirm.type === 'DELETE' ? 'Confirm Delete' : 'Confirm Overwrite'}
                </button>
              </div>
            </div>
          )}

          {/* 2. Google Drive Cloud Backup Section */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Google Drive Cloud Save &amp; Leaderboard Sync
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Store and restore Level {currentSavePayload.currentLevel} state ({currentSavePayload.score} pts) &amp; Max-Heap scores in your Drive
                </p>
              </div>

              {!needsAuth && user && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-300 truncate max-w-[180px]">
                    {user.email || user.displayName}
                  </span>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

            {needsAuth ? (
              <div className="pt-2 flex flex-col items-start gap-3">
                <p className="text-xs text-slate-300">
                  Sign in with your Google account to save or load Campus Escape game backups in Google Drive.
                </p>
                <button
                  type="button"
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className="gsi-material-button"
                >
                  <div className="gsi-material-button-state" />
                  <div className="gsi-material-button-content-wrapper">
                    <div className="gsi-material-button-icon">
                      <svg
                        version="1.1"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 48 48"
                        className="block w-full h-full"
                      >
                        <path
                          fill="#EA4335"
                          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                        />
                        <path
                          fill="#4285F4"
                          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                        />
                        <path
                          fill="#34A853"
                          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                        />
                        <path fill="none" d="M0 0h48v48H0z" />
                      </svg>
                    </div>
                    <span className="gsi-material-button-contents">
                      {isLoggingIn ? 'Signing in...' : 'Sign in with Google'}
                    </span>
                    <span className="hidden">Sign in with Google</span>
                  </div>
                </button>
              </div>
            ) : (
              <div className="space-y-4 pt-1">
                {/* Create New Save Form */}
                <form onSubmit={handleCreateNewSave} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={saveFileName}
                    onChange={(e) => setSaveFileName(e.target.value)}
                    placeholder="campus-escape-vit-save.json"
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="submit"
                    disabled={isBusy}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-semibold text-xs rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Save New File to Drive</span>
                  </button>
                </form>

                {/* Saved Files List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">
                      Saved Campus Escape Files in Google Drive ({files.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => void fetchDriveFiles()}
                      disabled={isBusy}
                      className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isBusy ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>
                  </div>

                  {files.length === 0 ? (
                    <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-4 text-xs text-slate-400 text-center">
                      No Campus Escape save files found in your Google Drive yet. Click &ldquo;Save New File to Drive&rdquo; above to create one!
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-800 border border-slate-800 rounded-lg overflow-hidden bg-slate-900/60">
                      {files.map((f) => (
                        <div
                          key={f.id}
                          className="p-3 flex flex-wrap items-center justify-between gap-2 text-xs"
                        >
                          <div className="min-w-0">
                            <div className="font-mono font-semibold text-slate-100 truncate">
                              {f.name}
                            </div>
                            <div className="text-[11px] text-slate-400 tabular-nums">
                              Updated {new Date(f.modifiedTime).toLocaleString()}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => void handleLoadSave(f)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 rounded-md font-medium cursor-pointer"
                              title="Load save into game"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Load</span>
                            </button>

                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => setPendingConfirm({ type: 'OVERWRITE', file: f })}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 rounded-md font-medium cursor-pointer"
                              title="Overwrite this file in Drive"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>Overwrite</span>
                            </button>

                            {f.webViewLink && (
                              <a
                                href={f.webViewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sky-300 rounded-md"
                                title="View in Google Drive"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}

                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => setPendingConfirm({ type: 'DELETE', file: f })}
                              className="inline-flex items-center gap-1 px-2 py-1.5 bg-slate-800 hover:bg-red-950/60 border border-slate-700 text-red-400 rounded-md cursor-pointer"
                              title="Delete from Google Drive"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
