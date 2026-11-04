import React, { useState, useRef, useCallback } from 'react';
import { Upload, Image, Loader2, Send, Check, Download, ArrowRight, ArrowLeft, Video, Type, X, Plus, MessageSquare, FileText, Youtube, AlertCircle, CheckCircle2, Settings } from 'lucide-react';
import { getApiUrl } from '../config';

const STEPS = ['Input', 'Titles', 'Generate', 'Description', 'Publish'];

function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((label, i) => (
        <React.Fragment key={label}>
          <div className={`flex items-center gap-2 h-7 px-2.5 rounded-lg text-[12px] transition-colors ${
            i === currentStep ? 'bg-raised text-ink border border-ink3' :
            i < currentStep ? 'text-ink3 border border-transparent' : 'text-ink3/70 border border-transparent'
            }`}>
            <span className={`w-4 h-4 flex items-center justify-center font-mono text-[11px] tabular-nums ${i === currentStep ? 'text-ink' : 'text-ink3'}`}>
              {i < currentStep ? <Check size={11} /> : String(i + 1).padStart(2, '0')}
            </span>
            <span className="hidden sm:inline">{label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-8 h-px ${i < currentStep ? 'bg-ink3' : 'bg-line'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function DragDropZone({ label, accept, onFile, file, onClear, icon: Icon }) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  }, [onFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  if (file) {
    return (
      <div className="relative border border-line rounded-xl p-3 bg-raised">
        <div className="flex items-center gap-3">
          {file.type?.startsWith('image/') ? (
            <img src={URL.createObjectURL(file)} className="w-12 h-12 rounded-lg object-cover" alt="" />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-raised flex items-center justify-center">
              <Icon size={20} className="text-ink2" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-ink truncate">{file.name}</p>
            <p className="text-xs text-ink3">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
          </div>
          <button onClick={onClear} className="text-ink3 hover:text-ink transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragging(false)}
      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${isDragging ? 'border-primary/50 bg-primary/5' : 'border-line hover:border-line bg-surface'
        }`}
    >
      <Icon size={24} className="mx-auto text-ink3 mb-2" />
      <p className="text-sm text-ink2">{label}</p>
      <p className="text-xs text-ink3 mt-1">Drop or click to upload</p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => e.target.files[0] && onFile(e.target.files[0])}
      />
    </div>
  );
}

export default function ThumbnailStudio({ geminiApiKey, uploadPostKey, uploadUserId }) {
  // Step management
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState(null); // 'video' or 'manual'

  // Step 1 state
  const [videoFile, setVideoFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Step 2 state
  const [sessionId, setSessionId] = useState(null);
  const [titles, setTitles] = useState([]);
  const [selectedTitle, setSelectedTitle] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isRefining, setIsRefining] = useState(false);
  const [recommended, setRecommended] = useState([]); // [{index, reason}]

  // Step 3 state
  const [faceImage, setFaceImage] = useState(null);
  const [bgImage, setBgImage] = useState(null);
  const [extraPrompt, setExtraPrompt] = useState('');
  const [thumbnailCount, setThumbnailCount] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedThumbnails, setGeneratedThumbnails] = useState([]);

  // Description state
  const [description, setDescription] = useState('');
  const [isDescribing, setIsDescribing] = useState(false);

  // Step 4 (Publish) state
  const [selectedThumbnail, setSelectedThumbnail] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState(null);

  // Background preprocessing state
  const [preprocessSessionId, setPreprocessSessionId] = useState(null);
  const [isPreprocessing, setIsPreprocessing] = useState(false);

  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // --- Background Pre-upload (starts Whisper immediately) ---
  const handlePreUpload = async (file) => {
    setPreprocessSessionId(null);
    setIsPreprocessing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(getApiUrl('/api/thumbnail/upload'), {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setPreprocessSessionId(data.session_id);
        console.log(`🎙️ Background Whisper started: ${data.session_id}`);
      }
    } catch (e) {
      console.error('Pre-upload failed:', e);
    } finally {
      setIsPreprocessing(false);
    }
  };

  // --- Step 1: Analyze Video ---
  const handleAnalyze = async () => {
    if (!geminiApiKey) return alert('Please set your Gemini API key in Settings first.');
    setIsAnalyzing(true);

    try {
      const formData = new FormData();

      if (preprocessSessionId) {
        // Use pre-uploaded session (Whisper already running/done in background)
        formData.append('session_id', preprocessSessionId);
      } else if (videoFile) {
        formData.append('file', videoFile);
      } else {
        return alert('Please upload a video file.');
      }

      const res = await fetch(getApiUrl('/api/thumbnail/analyze'), {
        method: 'POST',
        headers: { 'X-Gemini-Key': geminiApiKey },
        body: formData
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }

      const data = await res.json();
      setSessionId(data.session_id);
      setTitles(data.titles || []);
      setRecommended(data.recommended || []);
      setChatHistory([{
        role: 'assistant',
        content: `Here are ten title suggestions based on your video. The two picks I would post are marked. Click one to select it, or tell me how to refine them.`
      }]);
      setStep(1);
    } catch (e) {
      alert(`Analysis failed: ${e.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleManualMode = () => {
    setMode('manual');
    setStep(1);
  };

  // --- Step 2: Title Selection / Refinement ---
  const handleSelectTitle = (title) => {
    setSelectedTitle(title);
  };

  const handleConfirmTitle = () => {
    if (mode === 'manual' && manualTitle) {
      setSelectedTitle(manualTitle);
      // Create session for manual mode
      const newSessionId = sessionId || crypto.randomUUID();
      setSessionId(newSessionId);
      fetch(getApiUrl('/api/thumbnail/titles'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Gemini-Key': geminiApiKey
        },
        body: JSON.stringify({ title: manualTitle, session_id: newSessionId })
      }).catch(() => { });
    }
    if (selectedTitle || (mode === 'manual' && manualTitle)) {
      setStep(2);
    }
  };

  const handleRefine = async () => {
    if (!chatInput.trim() || !sessionId) return;
    setIsRefining(true);

    const userMsg = chatInput.trim();
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);

    try {
      const res = await fetch(getApiUrl('/api/thumbnail/titles'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Gemini-Key': geminiApiKey
        },
        body: JSON.stringify({ session_id: sessionId, message: userMsg })
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setTitles(data.titles || []);
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: `Here are refined titles based on your feedback. Click one to select it.`
      }]);
      setTimeout(scrollToBottom, 100);
    } catch (e) {
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: `Failed to refine: ${e.message}`
      }]);
    } finally {
      setIsRefining(false);
    }
  };

  // --- Step 3: Generate Thumbnails ---
  const handleGenerate = async () => {
    if (!geminiApiKey) return alert('Please set your Gemini API key in Settings first.');
    const finalTitle = selectedTitle || manualTitle;
    if (!finalTitle) return alert('Please select or enter a title first.');

    setIsGenerating(true);
    setGeneratedThumbnails([]);

    try {
      const formData = new FormData();
      formData.append('session_id', sessionId || 'manual');
      formData.append('title', finalTitle);
      formData.append('extra_prompt', extraPrompt);
      formData.append('count', thumbnailCount);
      if (faceImage) formData.append('face', faceImage);
      if (bgImage) formData.append('background', bgImage);

      const res = await fetch(getApiUrl('/api/thumbnail/generate'), {
        method: 'POST',
        headers: { 'X-Gemini-Key': geminiApiKey },
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || `Server error ${res.status}`);
      }

      const data = await res.json();
      if (!data.thumbnails || data.thumbnails.length === 0) {
        throw new Error('No thumbnails were generated. Your Gemini API key may not have access to image generation.');
      }
      setGeneratedThumbnails(data.thumbnails);
    } catch (e) {
      alert(`Generation failed: ${e.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (url) => {
    try {
      const response = await fetch(getApiUrl(url));
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = url.split('/').pop() || 'thumbnail.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback: open in new tab if fetch fails
      window.open(getApiUrl(url), '_blank');
    }
  };

  // --- Description Generation ---
  const handleGenerateDescription = async () => {
    if (!geminiApiKey) return alert('Please set your Gemini API key in Settings first.');
    const finalTitle = selectedTitle || manualTitle;
    if (!finalTitle) return alert('Please select a title first.');
    if (!sessionId) return alert('No session available.');

    setIsDescribing(true);
    try {
      const res = await fetch(getApiUrl('/api/thumbnail/describe'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Gemini-Key': geminiApiKey
        },
        body: JSON.stringify({ session_id: sessionId, title: finalTitle })
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }

      const data = await res.json();
      setDescription(data.description || '');
    } catch (e) {
      alert(`Description generation failed: ${e.message}`);
    } finally {
      setIsDescribing(false);
    }
  };

  // --- Publish to YouTube ---
  const handlePublish = async () => {
    if (!uploadPostKey || !uploadUserId) return alert('Please configure your Upload-Post API key and user in Settings first.');
    const finalTitle = selectedTitle || manualTitle;
    if (!finalTitle) return alert('No title selected.');
    if (!selectedThumbnail) return alert('Please select a thumbnail first.');
    if (!description) return alert('Please generate or write a description first.');

    setIsPublishing(true);
    setPublishResult(null);
    try {
      const formData = new FormData();
      formData.append('session_id', sessionId);
      formData.append('title', finalTitle);
      formData.append('description', description);
      formData.append('thumbnail_url', selectedThumbnail);
      formData.append('api_key', uploadPostKey);
      formData.append('user_id', uploadUserId);

      // Submit the publish job — returns immediately with a publish_id
      const res = await fetch(getApiUrl('/api/thumbnail/publish'), {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }

      const { publish_id } = await res.json();

      // Poll for status every 2 seconds (upload can take minutes for large videos)
      await new Promise((resolve, reject) => {
        const interval = setInterval(async () => {
          try {
            const statusRes = await fetch(getApiUrl(`/api/thumbnail/publish/status/${publish_id}`));
            if (!statusRes.ok) { clearInterval(interval); reject(new Error('Status check failed')); return; }
            const statusData = await statusRes.json();

            if (statusData.status === 'done') {
              clearInterval(interval);
              setPublishResult({ success: true, data: statusData.result });
              resolve();
            } else if (statusData.status === 'failed') {
              clearInterval(interval);
              reject(new Error(statusData.error || 'Upload failed'));
            }
            // 'uploading' → keep polling
          } catch (e) {
            clearInterval(interval);
            reject(e);
          }
        }, 2000);
      });

    } catch (e) {
      setPublishResult({ success: false, error: e.message });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleReset = () => {
    setStep(0);
    setMode(null);
    setVideoFile(null);
    setSessionId(null);
    setTitles([]);
    setSelectedTitle('');
    setManualTitle('');
    setChatInput('');
    setChatHistory([]);
    setFaceImage(null);
    setBgImage(null);
    setExtraPrompt('');
    setGeneratedThumbnails([]);
    setDescription('');
    setIsDescribing(false);
    setSelectedThumbnail(null);
    setIsPublishing(false);
    setPublishResult(null);
    setPreprocessSessionId(null);
    setIsPreprocessing(false);
    setRecommended([]);
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-medium tracking-[-0.01em]">YouTube Studio</h1>
          {step > 0 && (
            <button onClick={handleReset} className="btn-quiet h-8 text-[13px]">
              <Plus size={12} /> New project
            </button>
          )}
        </div>
        <p className="text-[13px] text-ink3 mb-6">Thumbnails, titles, descriptions, and a publish step for YouTube</p>

        <StepIndicator currentStep={step} />

        {/* Gemini API Key Warning */}
        {!geminiApiKey && (
          <div className="mb-6 p-5 bg-raised border border-line rounded-xl flex items-start gap-3">
            <AlertCircle size={20} className="text-ink2 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-ink2">Gemini API Key Required</p>
              <p className="text-xs text-ink2/70 mt-1">YouTube Studio requires a Google Gemini API key to function. Please configure it in the <strong>Settings</strong> tab before using this feature. Gemini's free tier includes 1,500 requests per day.</p>
            </div>
          </div>
        )}

        {/* ===== STEP 0: Input Mode Selection ===== */}
        {step === 0 && (
          <div className={`grid md:grid-cols-2 gap-6 ${!geminiApiKey ? 'opacity-50 pointer-events-none select-none' : ''}`}>
            {/* Mode A: Video Analysis */}
            <div className="panel p-6 space-y-4">
              <div className="mb-2">
                <h3 className="text-sm font-medium text-ink flex items-center gap-2">
                  <Video size={15} className="text-ink3" /> Analyze a video
                </h3>
                <p className="text-[13px] text-ink3 mt-1">Suggests titles from what is said in the video</p>
              </div>

              <DragDropZone
                label="Upload video file"
                accept="video/*"
                onFile={(f) => { setVideoFile(f); setMode('video'); handlePreUpload(f); }}
                file={videoFile}
                onClear={() => { setVideoFile(null); setPreprocessSessionId(null); }}
                icon={Video}
              />

              {isPreprocessing && (
                <div className="flex items-center gap-2 text-xs text-ink3 bg-raised border border-ink3 rounded-lg px-3 py-2">
                  <Loader2 size={12} className="animate-spin" />
                  Pre-processing video (Whisper transcription starting)...
                </div>
              )}
              {preprocessSessionId && !isPreprocessing && (
                <div className="flex items-center gap-2 text-xs text-positive bg-positive/10 border border-positive/25 rounded-lg px-3 py-2">
                  <Check size={12} />
                  Video uploaded — transcription running in background
                </div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !videoFile}
                className="btn-primary w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Analyzing video...
                  </>
                ) : (
                  'Analyze and get titles'
                )}
              </button>
            </div>

            {/* Mode B: Manual Title */}
            <div className="panel p-6 space-y-4 flex flex-col">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-raised flex items-center justify-center">
                  <Type size={16} className="text-ink3" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-ink">Write Your Own</h3>
                  <p className="text-xs text-ink3">Skip analysis, enter your title directly</p>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center">
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="Enter your YouTube title..."
                  className="input-field text-sm mb-4"
                  maxLength={70}
                />
                <p className="text-xs text-ink3 mb-4">{manualTitle.length}/70 characters</p>
              </div>

              <button
                onClick={handleManualMode}
                disabled={!manualTitle.trim()}
                className="w-full py-3 bg-raised hover:bg-raised text-ink rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors border border-line disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowRight size={16} />
                Use This Title
              </button>
            </div>
          </div>
        )}

        {/* ===== STEP 1: Title Selection ===== */}
        {step === 1 && (
          <div className="grid md:grid-cols-5 gap-6">
            {/* Left: Chat / Controls */}
            <div className="md:col-span-2 flex flex-col gap-4">
              {mode === 'manual' ? (
                <div className="panel p-6 space-y-4">
                  <h3 className="text-sm font-medium text-ink">Your Title</h3>
                  <input
                    type="text"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    className="input-field text-sm"
                    maxLength={70}
                  />
                  <p className="text-xs text-ink3">{manualTitle.length}/70 characters</p>
                  <button
                    onClick={handleConfirmTitle}
                    disabled={!manualTitle.trim()}
                    className="btn-primary w-full"
                  >
                    <ArrowRight size={16} />
                    Continue to Thumbnails
                  </button>
                </div>
              ) : (
                <div className="panel p-4 flex flex-col h-[500px]">
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-line">
                    <MessageSquare size={14} className="text-primary" />
                    <span className="text-xs font-medium text-ink2">Title Refinement Chat</span>
                  </div>

                  {/* Chat messages */}
                  <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar mb-3">
                    {chatHistory.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[90%] px-3 py-2 rounded-xl text-xs ${msg.role === 'user'
                          ? 'bg-primary/20 text-primary border border-primary/20'
                          : 'bg-raised text-ink2 border border-line'
                          }`}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Chat input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleRefine()}
                      placeholder="Ask for a change, for example shorter or more specific"
                      className="input-field text-xs flex-1"
                      disabled={isRefining}
                    />
                    <button
                      onClick={handleRefine}
                      disabled={isRefining || !chatInput.trim()}
                      className="btn-primary w-10 px-0 shrink-0"
                      aria-label="Send"
                    >
                      {isRefining ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    </button>
                  </div>
                </div>
              )}

              {mode !== 'manual' && selectedTitle && (
                <button
                  onClick={handleConfirmTitle}
                  className="btn-primary w-full"
                >
                  <ArrowRight size={16} />
                  Use Selected Title
                </button>
              )}
            </div>

            {/* Right: Title Cards */}
            <div className="md:col-span-3 space-y-3">
              {selectedTitle && (
                <div className="p-3 bg-positive/10 border border-positive/25 rounded-xl flex items-center gap-2 text-sm">
                  <Check size={14} className="text-positive shrink-0" />
                  <span className="text-positive font-medium truncate">Selected: {selectedTitle}</span>
                </div>
              )}

              {titles.length > 0 && (
                <div className="space-y-2">
                  {titles.map((title, i) => {
                    const rec = recommended.find(r => r.index === i);
                    const recRank = recommended.findIndex(r => r.index === i);
                    return (
                      <button
                        key={i}
                        onClick={() => handleSelectTitle(title)}
                        className={`w-full text-left p-4 rounded-xl border transition-colors text-sm ${selectedTitle === title
                          ? 'bg-primary/10 border-primary/30 text-ink'
                          : rec
                            ? 'bg-raised border-line text-ink hover:bg-raised'
                            : 'bg-surface border-line text-ink2 hover:bg-raised hover:border-line'
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-medium shrink-0 mt-0.5 ${selectedTitle === title ? 'bg-primary text-[#111113]' :
                            rec ? 'bg-ink3 text-[#111113]' : 'bg-raised text-ink3'
                            }`}>
                            {selectedTitle === title ? <Check size={10} /> : i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="leading-relaxed">{title}</span>
                              {rec && (
                                <span className="text-[11px] text-ink2 shrink-0">
                                  {recRank === 0 ? 'Top pick' : 'Second pick'}
                                </span>
                              )}
                            </div>
                            {rec && (
                              <p className="text-[11px] text-ink2/70 mt-1.5 leading-relaxed">{rec.reason}</p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {isRefining && (
                <div className="flex items-center justify-center py-8 text-ink3">
                  <Loader2 size={20} className="animate-spin mr-2" />
                  <span className="text-sm">Refining titles...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== STEP 2: Thumbnail Generation ===== */}
        {step === 2 && (
          <div className="grid md:grid-cols-5 gap-6">
            {/* Left: Controls */}
            <div className="md:col-span-2 space-y-4">
              <div className="panel p-6 space-y-4">
                <h3 className="text-sm font-medium text-ink mb-1">Selected Title</h3>
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm text-primary">
                  {selectedTitle || manualTitle}
                </div>

                <button
                  onClick={() => setStep(1)}
                  className="text-xs text-ink3 hover:text-ink transition-colors flex items-center gap-1"
                >
                  <ArrowLeft size={12} /> Change title
                </button>
              </div>

              <div className="panel p-6 space-y-4">
                <h3 className="text-sm font-medium text-ink">Face Image <span className="text-ink3 font-normal">(optional)</span></h3>
                <DragDropZone
                  label="Upload face / person photo"
                  accept="image/*"
                  onFile={setFaceImage}
                  file={faceImage}
                  onClear={() => setFaceImage(null)}
                  icon={Upload}
                />
              </div>

              <div className="panel p-6 space-y-4">
                <h3 className="text-sm font-medium text-ink">Background Image <span className="text-ink3 font-normal">(optional)</span></h3>
                <DragDropZone
                  label="Upload background image"
                  accept="image/*"
                  onFile={setBgImage}
                  file={bgImage}
                  onClear={() => setBgImage(null)}
                  icon={Image}
                />
              </div>

              <div className="panel p-6 space-y-4">
                <h3 className="text-sm font-medium text-ink">Extra Instructions <span className="text-ink3 font-normal">(optional)</span></h3>
                <textarea
                  value={extraPrompt}
                  onChange={(e) => setExtraPrompt(e.target.value)}
                  placeholder="e.g. Use red and black colors, dramatic lighting, include money emojis..."
                  className="input-field text-sm resize-none h-20"
                />
              </div>

              <div className="panel p-6 space-y-4">
                <h3 className="text-sm font-medium text-ink">Number of Thumbnails</h3>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map(n => (
                    <button
                      key={n}
                      onClick={() => setThumbnailCount(n)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${thumbnailCount === n
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'bg-raised text-ink2 border border-line hover:bg-raised'
                        }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="btn-primary w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Generating thumbnails...
                  </>
                ) : (
                  'Generate thumbnails'
                )}
              </button>

            </div>

            {/* Right: Generated Thumbnails */}
            <div className="md:col-span-3">
              {generatedThumbnails.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-ink2">Generated Thumbnails — click to select for publishing</h3>
                  <div className="grid gap-4">
                    {generatedThumbnails.map((url, i) => (
                      <div
                        key={i}
                        onClick={() => setSelectedThumbnail(url)}
                        className={`panel overflow-hidden group relative cursor-pointer transition-colors ${selectedThumbnail === url ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
                          }`}
                      >
                        <img
                          src={getApiUrl(url)}
                          alt={`Thumbnail ${i + 1}`}
                          className="w-full aspect-video object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-raised transition-colors flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDownload(url); }}
                            className="bg-white text-[#111113] px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-zinc-200 transition-colors"
                          >
                            <Download size={14} />
                            Download
                          </button>
                        </div>
                        <div className="p-3 flex items-center justify-between">
                          <span className="text-xs text-ink3 flex items-center gap-2">
                            Thumbnail {i + 1}
                            {selectedThumbnail === url && (
                              <span className="text-primary flex items-center gap-1"><Check size={10} /> Selected</span>
                            )}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDownload(url); }}
                            className="text-xs text-ink2 hover:text-ink transition-colors flex items-center gap-1"
                          >
                            <Download size={12} /> Save
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Regenerate */}
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full py-3 bg-raised hover:bg-raised text-ink2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors border border-line disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      'Regenerate'
                    )}
                  </button>

                  {/* Proceed to Description */}
                  {selectedThumbnail && (
                    <button
                      onClick={() => setStep(3)}
                      className="btn-primary w-full"
                    >
                      <ArrowRight size={16} />
                      Next: Description
                    </button>
                  )}
                </div>
              ) : isGenerating ? (
                <div className="h-full flex flex-col items-center justify-center text-ink3 space-y-4 min-h-[400px]">
                  <div className="w-5 h-5 rounded-full border-2 border-line border-t-ink2 animate-spin" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-ink2">Generating thumbnails...</p>
                    <p className="text-xs text-ink3 mt-1">This may take a minute per thumbnail</p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-ink3 space-y-4 min-h-[400px]">
                  <div className="w-20 h-20 rounded-xl bg-raised border border-line flex items-center justify-center">
                    <Image size={32} className="text-ink3" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-ink2">Your thumbnails will appear here</p>
                    <p className="text-xs text-ink3 mt-1">Configure options and click Generate</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== STEP 3: YouTube Description ===== */}
        {step === 3 && (
          <div className="grid md:grid-cols-5 gap-6">
            {/* Left: Context & Controls */}
            <div className="md:col-span-2 space-y-4">
              <button
                onClick={() => setStep(2)}
                className="text-xs text-ink3 hover:text-ink transition-colors flex items-center gap-1 mb-2"
              >
                <ArrowLeft size={12} /> Back to Generate
              </button>

              {/* Selected Thumbnail Preview */}
              {selectedThumbnail && (
                <div className="panel overflow-hidden">
                  <img
                    src={getApiUrl(selectedThumbnail)}
                    alt="Selected thumbnail"
                    className="w-full aspect-video object-cover"
                  />
                  <div className="p-3">
                    <span className="text-xs text-positive flex items-center gap-1"><Check size={10} /> Selected Thumbnail</span>
                  </div>
                </div>
              )}

              {/* Title */}
              <div className="panel p-6 space-y-3">
                <h3 className="text-sm font-medium text-ink">Video Title</h3>
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm text-primary">
                  {selectedTitle || manualTitle}
                </div>
              </div>

              {/* Generate Description Button */}
              {mode === 'video' && (
                <div className="panel p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-ink">Description</h3>
                    <span className="text-[11px] text-ink3">with chapters</span>
                  </div>
                  <p className="text-xs text-ink3">
                    Generate a YouTube description with chapter timestamps from your video transcript.
                  </p>
                  <button
                    onClick={handleGenerateDescription}
                    disabled={isDescribing}
                    className="w-full py-3 bg-negative/10 hover:bg-negative/20 text-negative rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors border border-negative/25 disabled:opacity-50"
                  >
                    {isDescribing ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Generating description...
                      </>
                    ) : (
                      <>
                        <FileText size={14} />
                        {description ? 'Regenerate Description' : 'Generate Description'}
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Next: Publish */}
              {description && (
                <button
                  onClick={() => setStep(4)}
                  className="btn-primary w-full"
                >
                  <ArrowRight size={16} />
                  Next: Publish
                </button>
              )}
            </div>

            {/* Right: Editable Description */}
            <div className="md:col-span-3 space-y-4">
              <div className="panel p-6 space-y-4 h-full flex flex-col">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-ink flex items-center gap-2">
                    <FileText size={14} className="text-negative" />
                    YouTube Description
                  </h3>
                  <span className="text-[11px] text-ink3">{description.length}/5000</span>
                </div>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={mode === 'video'
                    ? "Click 'Generate Description' to auto-generate with chapters, or write your own..."
                    : "Write your YouTube video description here..."
                  }
                  className="input-field text-sm resize-none flex-1 min-h-[500px] font-mono custom-scrollbar"
                  maxLength={5000}
                />

                {!description && (
                  <p className="text-xs text-ink3">
                    {mode === 'video'
                      ? "AI will generate a compelling description with chapter timestamps from your video's Whisper transcript."
                      : "Write a description for your YouTube video. You can proceed to publish once you have a description."}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===== STEP 4: Publish to YouTube ===== */}
        {step === 4 && (
          <div className="grid md:grid-cols-5 gap-6">
            {/* Left: Summary & Publish */}
            <div className="md:col-span-2 space-y-4">
              <button
                onClick={() => setStep(3)}
                className="text-xs text-ink3 hover:text-ink transition-colors flex items-center gap-1 mb-2"
              >
                <ArrowLeft size={12} /> Back to Description
              </button>

              {/* Selected Thumbnail Preview */}
              {selectedThumbnail && (
                <div className="panel overflow-hidden">
                  <img
                    src={getApiUrl(selectedThumbnail)}
                    alt="Selected thumbnail"
                    className="w-full aspect-video object-cover"
                  />
                  <div className="p-3">
                    <span className="text-xs text-positive flex items-center gap-1"><Check size={10} /> Selected Thumbnail</span>
                  </div>
                </div>
              )}

              {/* Editable Title */}
              <div className="panel p-6 space-y-3">
                <h3 className="text-sm font-medium text-ink">Video Title</h3>
                <input
                  type="text"
                  value={selectedTitle || manualTitle}
                  onChange={(e) => selectedTitle ? setSelectedTitle(e.target.value) : setManualTitle(e.target.value)}
                  className="input-field text-sm"
                  maxLength={100}
                />
              </div>

              {/* Publish Button */}
              {(!uploadPostKey || !uploadUserId) ? (
                <div className="panel p-6 space-y-3">
                  <div className="flex items-center gap-2 text-ink2">
                    <AlertCircle size={16} />
                    <span className="text-sm font-medium">Upload-Post Not Configured</span>
                  </div>
                  <p className="text-xs text-ink3">
                    To publish directly to YouTube, configure your Upload-Post API key and connect a profile in Settings.
                  </p>
                  <button
                    onClick={() => { }}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <Settings size={12} /> Go to Settings
                  </button>
                </div>
              ) : (
                <button
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="w-full py-4 bg-red-600 hover:bg-red-700 text-ink rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Publishing to YouTube...
                    </>
                  ) : (
                    <>
                      <Youtube size={16} />
                      Publish to YouTube
                    </>
                  )}
                </button>
              )}

              {/* Publish Result */}
              {publishResult && (
                <div className={`panel p-4 ${publishResult.success ? 'border-positive/25' : 'border-negative/25'}`}>
                  {publishResult.success ? (
                    <div className="flex items-center gap-2 text-positive">
                      <CheckCircle2 size={16} />
                      <div>
                        <p className="text-sm font-medium">Published successfully!</p>
                        <p className="text-xs text-ink3 mt-1">Your video is being uploaded to YouTube asynchronously.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-negative">
                      <AlertCircle size={16} />
                      <div>
                        <p className="text-sm font-medium">Publish failed</p>
                        <p className="text-xs text-ink3 mt-1">{publishResult.error}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Description Preview (read-only feel, still editable) */}
            <div className="md:col-span-3 space-y-4">
              <div className="panel p-6 space-y-4 h-full flex flex-col">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-ink flex items-center gap-2">
                    <FileText size={14} className="text-negative" />
                    YouTube Description
                  </h3>
                  <button
                    onClick={() => setStep(3)}
                    className="text-xs text-ink2 hover:text-ink flex items-center gap-1 transition-colors"
                  >
                    <ArrowLeft size={10} /> Edit
                  </button>
                </div>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field text-sm resize-none flex-1 min-h-[500px] font-mono custom-scrollbar"
                  maxLength={5000}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
