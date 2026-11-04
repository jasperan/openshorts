import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, LayoutDashboard, Settings, PlusCircle, X, Terminal, LayoutGrid, Image as ImageIcon, RotateCcw, Github, Clapperboard, ArrowLeft, Youtube, Instagram } from 'lucide-react';
// KeyInput removed - no API keys needed for core pipeline
import MediaInput from './components/MediaInput';
import ResultCard from './components/ResultCard';
import ProcessingAnimation from './components/ProcessingAnimation';
import ThumbnailStudio from './components/ThumbnailStudio';
import SaaShortsTab from './components/SaaShortsTab';
import UGCGallery from './components/UGCGallery';
import { getApiUrl } from './config';

// Enhanced "Encryption" using XOR + Base64 with a Salt
// This is better than plain Base64 but still client-side.
const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY || "OpenShorts-Static-Salt-Change-Me";
const ENCRYPTION_PREFIX = "ENC:";

const encrypt = (text) => {
  if (!text) return '';
  try {
    const xor = text.split('').map((c, i) =>
      String.fromCharCode(c.charCodeAt(0) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length))
    ).join('');
    return ENCRYPTION_PREFIX + btoa(xor);
  } catch (e) {
    console.error("Encryption failed", e);
    return text;
  }
};

const decrypt = (text) => {
  if (!text) return '';
  if (text.startsWith(ENCRYPTION_PREFIX)) {
    try {
      const raw = text.slice(ENCRYPTION_PREFIX.length);
      // Check if it's plain base64 or our custom XOR (simple try)
      const xor = atob(raw);
      const result = xor.split('').map((c, i) =>
        String.fromCharCode(c.charCodeAt(0) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length))
      ).join('');
      return result;
    } catch {
      // Fallback if decryption fails (might be old plain text)
      return '';
    }
  }
  // Backward compatibility: If no prefix, assume old plain text (or return empty if you want to force re-login)
  // For migration: Return text as is, so it populates the field, and next save will encrypt it.
  return text;
};

// Simple TikTok icon sine Lucide might not have it or it varies
const TikTokIcon = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z" />
  </svg>
);

const UserProfileSelector = ({ profiles, selectedUserId, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!profiles || profiles.length === 0) return null;

  const selectedProfile = profiles.find(p => p.username === selectedUserId) || profiles[0];

  const platformState = (profile, name) =>
    profile.connected.includes(name) ? 'text-ink2' : 'text-ink3/50';

  return (
    <div className="relative z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 flex items-center gap-2 bg-raised border border-line rounded-lg pl-1.5 pr-2.5 text-[13px] text-ink2 hover:border-ink3 transition-colors"
      >
        <span className="w-5 h-5 rounded-full bg-line flex items-center justify-center text-[11px] font-medium text-ink">
          {selectedProfile?.username?.substring(0, 1).toUpperCase() || "U"}
        </span>
        <span className="text-ink truncate max-w-[120px]">{selectedProfile?.username || "Select profile"}</span>
        <ChevronDown size={13} className={`text-ink3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-64 panel overflow-hidden">
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {profiles.map((profile) => (
              <button
                key={profile.username}
                onClick={() => {
                  onSelect(profile.username);
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-between gap-3 px-3 h-12 hover:bg-raised transition-colors text-left border-b border-line last:border-0"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-line flex items-center justify-center text-[11px] text-ink shrink-0">
                    {profile.username.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] text-ink truncate">{profile.username}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <TikTokIcon size={11} className={platformState(profile, 'tiktok')} />
                      <Instagram size={11} className={platformState(profile, 'instagram')} />
                      <Youtube size={11} className={platformState(profile, 'youtube')} />
                    </div>
                  </div>
                </div>
                {selectedUserId === profile.username && <span className="w-1.5 h-1.5 rounded-full bg-ink shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const SESSION_KEY = 'openshorts_session';
const SESSION_MAX_AGE = 3600000; // 1 hour (matches server job retention)

// Mock polling function
const pollJob = async (jobId) => {
  const res = await fetch(getApiUrl(`/api/status/${jobId}`));
  if (!res.ok) throw new Error('Status check failed');
  return res.json();
};

function App() {
  // Social API State - Load encrypted or plain (optional, for social posting)
  const [uploadPostKey, setUploadPostKey] = useState(() => {
    const stored = localStorage.getItem('uploadPostKey_v3');
    if (stored) return decrypt(stored);
    return '';
  });

  // fal.ai API State - Load encrypted (optional, for AI Shorts UGC)
  const [falKey, setFalKey] = useState(() => {
    const stored = localStorage.getItem('falKey_v1');
    if (stored) return decrypt(stored);
    return '';
  });

  const [uploadUserId, setUploadUserId] = useState(() => localStorage.getItem('uploadUserId') || '');
  const [userProfiles, setUserProfiles] = useState([]); // List of {username, connected: []}
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, processing, complete, error
  const [results, setResults] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logsVisible, setLogsVisible] = useState(true);
  const [processingMedia, setProcessingMedia] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, settings

  const [sessionRecovered, setSessionRecovered] = useState(false);

  // Sync state for original video playback
  const [syncedTime, setSyncedTime] = useState(0);
  const [isSyncedPlaying, setIsSyncedPlaying] = useState(false);
  const [syncTrigger, setSyncTrigger] = useState(0);

  const handleClipPlay = (startTime) => {
    setSyncedTime(startTime);
    setIsSyncedPlaying(true);
    setSyncTrigger(prev => prev + 1);
  };

  const handleClipPause = () => {
    setIsSyncedPlaying(false);
  };

  // Session Recovery: Restore on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (!saved) return;
      const session = JSON.parse(saved);
      if (Date.now() - session.timestamp > SESSION_MAX_AGE) {
        localStorage.removeItem(SESSION_KEY);
        return;
      }
      if (session.jobId && session.status && session.status !== 'idle') {
        setJobId(session.jobId);
        setResults(session.results || null);
        if (session.processingMedia) setProcessingMedia(session.processingMedia);
        if (session.activeTab) setActiveTab(session.activeTab);
        // If was processing, resume polling; if complete/error, just show results
        setStatus(session.status === 'processing' ? 'processing' : session.status);
        setSessionRecovered(true);
        setTimeout(() => setSessionRecovered(false), 5000);
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
  }, []);

  // Session Recovery: Save state changes
  useEffect(() => {
    if (status === 'idle') {
      localStorage.removeItem(SESSION_KEY);
      return;
    }
    try {
      const sessionData = {
        jobId,
        status,
        results,
        processingMedia: processingMedia?.type === 'url' ? processingMedia : null,
        activeTab,
        timestamp: Date.now()
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    } catch {
      // localStorage full or serialization error - ignore
    }
  }, [jobId, status, results, activeTab, processingMedia]);

  useEffect(() => {
    if (uploadPostKey) {
      localStorage.setItem('uploadPostKey_v3', encrypt(uploadPostKey));
    }
    if (uploadUserId) {
      localStorage.setItem('uploadUserId', uploadUserId);
    }
  }, [uploadPostKey, uploadUserId]);

  useEffect(() => {
    if (falKey) {
      localStorage.setItem('falKey_v1', encrypt(falKey));
    }
  }, [falKey]);

  const fetchUserProfiles = useCallback(async () => {
    if (!uploadPostKey) return;
    try {
      const res = await fetch(getApiUrl('/api/social/user'), {
        headers: { 'X-Upload-Post-Key': uploadPostKey }
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      if (data.profiles && data.profiles.length > 0) {
        setUserProfiles(data.profiles);
        // Auto select first if none selected
        if (!uploadUserId) {
          setUploadUserId(data.profiles[0].username);
        }
      } else {
        alert("No profiles found for this API Key.");
      }
    } catch (e) {
      alert("Error fetching User Profiles. Please check key.");
      console.error(e);
    }
  }, [uploadPostKey, uploadUserId]);

  useEffect(() => {
    if (uploadPostKey && userProfiles.length === 0) {
      fetchUserProfiles();
    }
  }, [uploadPostKey, userProfiles.length, fetchUserProfiles]);

  useEffect(() => {
    let interval;
    if ((status === 'processing' || status === 'completed') && jobId) {
      interval = setInterval(async () => {
        try {
          const data = await pollJob(jobId);
          console.log("Job status:", data);

          // Update results if available (real-time)
          if (data.result) {
            setResults(data.result);
          }

          if (data.status === 'completed') {
            setStatus('complete');
            clearInterval(interval);
          } else if (data.status === 'failed') {
            setStatus('error');
            const errorMsg = data.error || (data.logs && data.logs.length > 0 ? data.logs[data.logs.length - 1] : "Process failed");
            setLogs(prev => [...prev, "Error: " + errorMsg]);
            clearInterval(interval);
          } else {
            // Update logs if available
            if (data.logs) setLogs(data.logs);
          }
        } catch (e) {
          console.error("Polling error", e);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [status, jobId]);


  const handleProcess = async (data) => {
    setStatus('processing');
    setLogs(["Starting process..."]);
    setResults(null);
    setProcessingMedia(data);

    try {
      let body;
      let headers = {};

      if (data.type === 'url') {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify({ url: data.payload });
      } else {
        const formData = new FormData();
        formData.append('file', data.payload);
        body = formData;
      }

      const res = await fetch(getApiUrl('/api/process'), {
        method: 'POST',
        headers,
        body
      });

      if (!res.ok) throw new Error(await res.text());
      const resData = await res.json();
      setJobId(resData.job_id);

    } catch (e) {
      setStatus('error');
      setLogs(l => [...l, `Error starting job: ${e.message}`]);
    }
  };

  const handleBatch = async (urls) => {
    setStatus('processing');
    setLogs(["Starting batch processing..."]);
    setResults(null);
    setProcessingMedia({ type: 'batch', payload: urls });

    try {
      const res = await fetch(getApiUrl('/api/batch'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls })
      });

      if (!res.ok) throw new Error(await res.text());
      const resData = await res.json();
      // Track the first job for status display
      if (resData.job_ids && resData.job_ids.length > 0) {
        setJobId(resData.job_ids[0]);
        setLogs(prev => [...prev, `Queued ${resData.count} videos for processing`]);
      }
    } catch (e) {
      setStatus('error');
      setLogs(l => [...l, `Error starting batch: ${e.message}`]);
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setJobId(null);
    setResults(null);
    setLogs([]);
    setProcessingMedia(null);
    localStorage.removeItem(SESSION_KEY);
  };

  // --- UI Components ---

  const navItems = [
    { id: 'dashboard', label: 'Clip Generator', icon: LayoutDashboard },
    { id: 'saasshorts', label: 'AI Shorts', icon: Clapperboard },
    { id: 'ugc-gallery', label: 'UGC Gallery', icon: LayoutGrid },
    { id: 'thumbnails', label: 'YouTube Studio', icon: ImageIcon },
  ];

  const currentView = navItems.find((item) => item.id === activeTab)?.label || 'Settings';

  const Sidebar = () => (
    <div className="w-16 lg:w-60 bg-surface border-r border-line flex flex-col h-full shrink-0">
      <div className="h-14 px-4 flex items-center gap-2.5 shrink-0">
        <img src="/logo-openshorts.png" alt="OpenShorts" className="w-7 h-7 shrink-0" />
        <span className="text-[15px] font-medium text-ink hidden lg:block">OpenShorts</span>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {navItems.map((item) => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full h-9 flex items-center gap-2.5 px-2.5 rounded-lg text-[13px] transition-colors ${
                active ? 'bg-raised text-ink' : 'text-ink2 hover:text-ink hover:bg-raised/60'
              }`}
            >
              <item.icon size={17} className="shrink-0" />
              <span className="hidden lg:block truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="px-2 py-3 border-t border-line space-y-0.5">
        <button
          onClick={() => setActiveTab('settings')}
          className={`w-full h-9 flex items-center gap-2.5 px-2.5 rounded-lg text-[13px] transition-colors ${
            activeTab === 'settings' ? 'bg-raised text-ink' : 'text-ink2 hover:text-ink hover:bg-raised/60'
          }`}
        >
          <Settings size={17} className="shrink-0" />
          <span className="hidden lg:block">Settings</span>
        </button>
        <a
          href="https://github.com/mutonby/openshorts"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full h-9 flex items-center gap-2.5 px-2.5 rounded-lg text-[13px] text-ink2 hover:text-ink hover:bg-raised/60 transition-colors"
        >
          <Github size={17} className="shrink-0" />
          <span className="hidden lg:block">Source</span>
        </a>
        <button
          onClick={() => {
            localStorage.removeItem('openshorts_skip_landing');
            window.location.hash = '';
            window.location.reload();
          }}
          className="w-full h-9 flex items-center gap-2.5 px-2.5 rounded-lg text-[13px] text-ink2 hover:text-ink hover:bg-raised/60 transition-colors"
        >
          <ArrowLeft size={17} className="shrink-0" />
          <span className="hidden lg:block">Landing page</span>
        </button>
      </div>
    </div>
  );

  const SettingRow = ({ label, value, mono }) => (
    <div className="flex items-center justify-between gap-6 py-2.5 border-b border-line last:border-0">
      <span className="text-[13px] text-ink2">{label}</span>
      <span className={mono ? 'timecode' : 'text-[13px] text-ink'}>{value}</span>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <header className="h-14 border-b border-line flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-[15px] font-medium text-ink truncate">{currentView}</h1>
            {status !== 'idle' && (
              <span className="timecode hidden sm:inline">
                {status === 'processing' ? 'running' : status === 'complete' ? 'done' : 'failed'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {status !== 'idle' && (
              <button
                onClick={handleReset}
                className="btn-quiet h-8 text-[13px]"
              >
                <PlusCircle size={15} />
                <span className="hidden sm:inline">New project</span>
              </button>
            )}

            {userProfiles.length > 0 && (
              <UserProfileSelector
                profiles={userProfiles}
                selectedUserId={uploadUserId}
                onSelect={setUploadUserId}
              />
            )}
          </div>
        </header>

        {sessionRecovered && (
          <div className="mx-6 mt-3 flex items-center justify-between gap-4 shrink-0 border border-line rounded-lg px-3 h-10 bg-surface">
            <div className="flex items-center gap-2 text-[13px] text-ink2 min-w-0">
              <RotateCcw size={14} className="text-ink3 shrink-0" />
              <span className="text-ink">Session restored</span>
              <span className="text-ink3 truncate">previous work recovered</span>
            </div>
            <button onClick={() => setSessionRecovered(false)} className="text-ink3 hover:text-ink transition-colors shrink-0">
              <X size={14} />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-hidden relative">
          {activeTab === 'settings' && (
            <div className="h-full overflow-y-auto custom-scrollbar">
              <div className="max-w-3xl px-6 py-8 space-y-6">
                <div className="panel p-6">
                  <div className="flex items-baseline justify-between mb-1">
                    <h2 className="text-[15px] font-medium">Local AI engine</h2>
                    <span className="timecode">Ollama</span>
                  </div>
                  <p className="text-[13px] text-ink2 leading-relaxed mb-4">
                    Moment detection and editing run on models on your machine. Nothing about a video leaves
                    your network.
                  </p>
                  <SettingRow label="Text model" value="qwen3.5:4b" mono />
                  <SettingRow label="Vision model" value="minicpm-v" mono />
                </div>

                <div className="panel p-6">
                  <div className="flex items-baseline justify-between mb-1">
                    <h2 className="text-[15px] font-medium">Publishing</h2>
                    <span className="timecode">optional</span>
                  </div>
                  <p className="text-[13px] text-ink2 leading-relaxed mb-4">
                    Upload-Post publishes to TikTok, Instagram Reels and YouTube Shorts. It has a free tier.
                    Without it you can still download the clips.
                  </p>
                  <label className="block text-[13px] text-ink2 mb-2" htmlFor="upload-post-key">API key</label>
                  <div className="flex gap-2">
                    <input
                      id="upload-post-key"
                      type="password"
                      value={uploadPostKey}
                      onChange={(e) => setUploadPostKey(e.target.value)}
                      className="input-field"
                      placeholder="ey..."
                    />
                    <button onClick={fetchUserProfiles} className="btn-primary h-10 shrink-0">
                      Connect
                    </button>
                  </div>
                  <div className="mt-4 divide-y divide-line border-t border-line">
                    {[
                      { n: '01', label: 'Create an account', href: 'https://app.upload-post.com/login' },
                      { n: '02', label: 'Connect your profiles', href: 'https://app.upload-post.com/manage-users' },
                      { n: '03', label: 'Generate the API key', href: 'https://app.upload-post.com/api-keys' },
                    ].map((step) => (
                      <a
                        key={step.n}
                        href={step.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 py-2.5 text-[13px] text-ink2 hover:text-ink transition-colors"
                      >
                        <span className="timecode">{step.n}</span>
                        {step.label}
                      </a>
                    ))}
                  </div>
                  <p className="mt-4 text-[11px] text-ink3 leading-relaxed">
                    Keys are stored in your browser. They go to the backend only for the request that needs
                    them and are not written server-side.
                  </p>
                </div>

                <div className="panel p-6">
                  <div className="flex items-baseline justify-between mb-1">
                    <h2 className="text-[15px] font-medium">Translation</h2>
                    <span className="timecode">local</span>
                  </div>
                  <p className="text-[13px] text-ink2 leading-relaxed">
                    30+ languages through Ollama and edge-tts. Transcription, translation and speech run on
                    your machine. Select a clip and use "Dub voice" to translate it.
                  </p>
                </div>

                <div className="panel p-6">
                  <div className="flex items-baseline justify-between mb-1">
                    <h2 className="text-[15px] font-medium">AI Shorts</h2>
                    <span className="timecode">fal.ai + ElevenLabs</span>
                  </div>
                  <p className="text-[13px] text-ink2 leading-relaxed mb-4">
                    The UGC generator writes the script, generates the actor and adds the voiceover. It bills
                    per video on fal.ai.
                  </p>
                  <label className="block text-[13px] text-ink2 mb-2" htmlFor="fal-key">fal.ai API key</label>
                  <div className="flex gap-2">
                    <input
                      id="fal-key"
                      type="password"
                      value={falKey}
                      onChange={(e) => setFalKey(e.target.value)}
                      className="input-field"
                      placeholder="fal_..."
                    />
                    <button
                      onClick={() => {
                        if (falKey) {
                          localStorage.setItem('falKey_v1', encrypt(falKey));
                          alert('fal.ai API key saved.');
                        }
                      }}
                      className="btn-primary h-10 shrink-0"
                    >
                      Save
                    </button>
                  </div>
                  <div className="mt-4 flex items-center gap-6 text-[13px]">
                    <a href="https://fal.ai/dashboard/keys" target="_blank" rel="noopener noreferrer" className="text-ink2 hover:text-ink transition-colors">
                      Create a key
                    </a>
                    <span className="text-ink3">Stored in your browser only</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'saasshorts' && (
            <SaaShortsTab falKey={falKey} uploadPostKey={uploadPostKey} uploadUserId={uploadUserId} />
          )}

          {activeTab === 'ugc-gallery' && (
            <UGCGallery />
          )}

          {activeTab === 'thumbnails' && (
            <ThumbnailStudio uploadPostKey={uploadPostKey} uploadUserId={uploadUserId} />
          )}

          {/* Idle: the input is the screen */}
          {activeTab === 'dashboard' && status === 'idle' && (
            <div className="h-full overflow-y-auto custom-scrollbar">
              <div className="max-w-3xl px-6 py-10 animate-rise">
                <h2 className="text-2xl md:text-3xl font-medium tracking-[-0.01em] max-w-xl leading-tight">
                  A long video in, vertical clips out
                </h2>
                <p className="mt-3 text-[15px] text-ink2 max-w-xl leading-relaxed">
                  Paste a YouTube URL or drop a file. The pipeline finds the moments, cuts them to 9:16 and
                  burns in the subtitles.
                </p>

                <div className="mt-8">
                  <MediaInput onProcess={handleProcess} onBatch={handleBatch} isProcessing={status === 'processing'} />
                </div>

                <div className="mt-6 flex items-center gap-6 text-[13px] text-ink3">
                  <span className="flex items-center gap-2"><Youtube size={15} /> YouTube</span>
                  <span className="flex items-center gap-2"><Instagram size={15} /> Instagram</span>
                  <span className="flex items-center gap-2"><TikTokIcon size={15} /> TikTok</span>
                </div>
              </div>
            </div>
          )}

          {/* Processing and results: preview and log on the left, clips on the right */}
          {activeTab === 'dashboard' && (status === 'processing' || status === 'complete' || status === 'error') && (
            <div className="h-full flex flex-col lg:flex-row">

              <div className="w-full lg:w-[360px] xl:w-[400px] shrink-0 h-full flex flex-col border-r border-line overflow-y-auto custom-scrollbar px-6 py-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="timecode">
                    {status === 'processing' ? 'analysing' : status === 'complete' ? 'analysis complete' : 'analysis failed'}
                  </span>
                  {processingMedia && (
                    <span className="timecode truncate max-w-[160px]">
                      {processingMedia.type === 'file' ? processingMedia.payload?.name : 'source'}
                    </span>
                  )}
                </div>

                {processingMedia && (
                  <ProcessingAnimation
                    media={processingMedia}
                    isComplete={status === 'complete'}
                    syncedTime={syncedTime}
                    isSyncedPlaying={isSyncedPlaying}
                    syncTrigger={syncTrigger}
                  />
                )}

                <div className={`mt-6 rounded-lg border border-line overflow-hidden flex flex-col ${status === 'complete' ? 'h-40 shrink-0' : 'flex-1 min-h-[200px]'}`}>
                  <div className="h-9 px-3 border-b border-line flex items-center justify-between shrink-0">
                    <span className="flex items-center gap-2 timecode">
                      <Terminal size={12} /> Log
                    </span>
                    <button
                      onClick={() => setLogsVisible(!logsVisible)}
                      className="text-ink3 hover:text-ink transition-colors"
                      aria-label={logsVisible ? 'Hide log' : 'Show log'}
                    >
                      <ChevronDown size={14} className={logsVisible ? '' : 'rotate-180'} />
                    </button>
                  </div>
                  {logsVisible && (
                    <div className="flex-1 p-3 overflow-y-auto custom-scrollbar font-mono text-[11px] leading-relaxed space-y-1">
                      {logs.map((log, i) => (
                        <div
                          key={i}
                          className={log.toLowerCase().includes('error') ? 'text-marker' : 'text-ink2'}
                        >
                          {log}
                        </div>
                      ))}
                      {status === 'processing' && <div className="text-ink3">_</div>}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 h-full flex flex-col p-6 min-w-0">
                <div className="flex items-center justify-between mb-4 shrink-0">
                  <div className="flex items-baseline gap-3">
                    <h2 className="text-[15px] font-medium">Clips</h2>
                    {results?.clips?.length > 0 && (
                      <span className="timecode">{results.clips.length}</span>
                    )}
                  </div>
                  {results?.cost_analysis && (
                    <span
                      className="timecode"
                      title={`Input ${results.cost_analysis.input_tokens} tokens, output ${results.cost_analysis.output_tokens}`}
                    >
                      ${results.cost_analysis.total_cost.toFixed(5)}
                    </span>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {results && results.clips && results.clips.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 pb-10">
                      {results.clips.map((clip, i) => (
                        <ResultCard
                          key={i}
                          clip={clip}
                          index={i}
                          jobId={jobId}
                          uploadPostKey={uploadPostKey}
                          uploadUserId={uploadUserId}
                          onPlay={(time) => handleClipPlay(time)}
                          onPause={handleClipPause}
                        />
                      ))}
                    </div>
                  ) : (
                    status === 'processing' ? (
                      <div className="h-full flex flex-col items-start justify-center gap-3">
                        <div className="w-5 h-5 rounded-full border-2 border-line border-t-ink2 animate-spin" />
                        <p className="text-[13px] text-ink3">The first clip appears when the analysis lands</p>
                      </div>
                    ) : status === 'error' ? (
                      <div className="h-full flex flex-col items-start justify-center gap-2">
                        <p className="text-[13px] text-marker">Generation failed</p>
                        <p className="text-[13px] text-ink3">The log on the left has the last message from the pipeline</p>
                      </div>
                    ) : null
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
