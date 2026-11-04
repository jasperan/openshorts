import React, { useState, useEffect } from 'react';
import { Download, Share2, Instagram, Youtube, Video, CheckCircle, AlertCircle, X, Loader2, Copy, Wand2, Type, Calendar, Clock, Languages } from 'lucide-react';
import { getApiUrl } from '../config';
import SubtitleModal from './SubtitleModal';
import HookModal from './HookModal';
import TranslateModal from './TranslateModal';

const formatTimecode = (seconds) => {
    const total = Math.max(0, Math.floor(seconds || 0));
    const m = Math.floor(total / 60);
    const sec = total % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

export default function ResultCard({ clip, index, jobId, uploadPostKey, uploadUserId, onPlay, onPause }) {
    const [showModal, setShowModal] = useState(false);
    const [showSubtitleModal, setShowSubtitleModal] = useState(false);
    const videoRef = React.useRef(null);
    const [currentVideoUrl, setCurrentVideoUrl] = useState(getApiUrl(clip.video_url));

    const [platforms, setPlatforms] = useState({
        tiktok: true,
        instagram: true,
        youtube: true
    });
    const [postTitle, setPostTitle] = useState("");
    const [postDescription, setPostDescription] = useState("");
    const [isScheduling, setIsScheduling] = useState(false);
    const [scheduleDate, setScheduleDate] = useState("");

    const [posting, setPosting] = useState(false);
    const [postResult, setPostResult] = useState(null);

    const [isEditing, setIsEditing] = useState(false);
    const [isSubtitling, setIsSubtitling] = useState(false);
    const [isHooking, setIsHooking] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const [showHookModal, setShowHookModal] = useState(false);
    const [showTranslateModal, setShowTranslateModal] = useState(false);
    const [editError, setEditError] = useState(null);

    // Initialize/Reset form when modal opens
    useEffect(() => {
        if (showModal) {
            setPostTitle(clip.video_title_for_youtube_short || "Untitled clip");
            setPostDescription(clip.video_description_for_instagram || clip.video_description_for_tiktok || "");
            setIsScheduling(false);
            setScheduleDate("");
            setPostResult(null);
        }
    }, [showModal, clip]);

    const handleAutoEdit = async () => {
        setIsEditing(true);
        setEditError(null);
        try {
            const res = await fetch(getApiUrl('/api/edit'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    job_id: jobId,
                    clip_index: index,
                    input_filename: currentVideoUrl.split('/').pop()
                })
            });

            if (!res.ok) {
                const errText = await res.text();
                try {
                    const jsonErr = JSON.parse(errText);
                    throw new Error(jsonErr.detail || errText);
                } catch {
                    throw new Error(errText);
                }
            }

            const data = await res.json();
            if (data.new_video_url) {
                setCurrentVideoUrl(getApiUrl(data.new_video_url));
                // Reload video
                if (videoRef.current) {
                    videoRef.current.load();
                }
            }

        } catch (e) {
            setEditError(e.message);
            setTimeout(() => setEditError(null), 5000);
        } finally {
            setIsEditing(false);
        }
    };

    const handleSubtitle = async (options) => {
        setIsSubtitling(true);
        setEditError(null);
        try {
            const res = await fetch(getApiUrl('/api/subtitle'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    job_id: jobId,
                    clip_index: index,
                    position: options.position,
                    font_size: options.fontSize,
                    font_name: options.fontName,
                    font_color: options.fontColor,
                    border_color: options.borderColor,
                    border_width: options.borderWidth,
                    bg_color: options.bgColor,
                    bg_opacity: options.bgOpacity,
                    input_filename: currentVideoUrl.split('/').pop()
                })
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(errText);
            }

            const data = await res.json();
            if (data.new_video_url) {
                setCurrentVideoUrl(getApiUrl(data.new_video_url));
                if (videoRef.current) {
                    videoRef.current.load();
                }
                setShowSubtitleModal(false);
            }

        } catch (e) {
            setEditError(e.message);
            setTimeout(() => setEditError(null), 5000);
        } finally {
            setIsSubtitling(false);
        }
    };

    const handleHook = async (hookData) => {
        setIsHooking(true);
        setEditError(null);
        try {
            // Support both string (legacy) and object
            const payload = typeof hookData === 'string'
                ? { text: hookData, position: 'top', size: 'M' }
                : hookData;

            const res = await fetch(getApiUrl('/api/hook'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    job_id: jobId,
                    clip_index: index,
                    text: payload.text,
                    position: payload.position,
                    size: payload.size,
                    input_filename: currentVideoUrl.split('/').pop()
                })
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(errText);
            }

            const data = await res.json();
            if (data.new_video_url) {
                setCurrentVideoUrl(getApiUrl(data.new_video_url));
                if (videoRef.current) {
                    videoRef.current.load();
                }
                setShowHookModal(false);
            }

        } catch (e) {
            setEditError(e.message);
            setTimeout(() => setEditError(null), 5000);
        } finally {
            setIsHooking(false);
        }
    };

    const handleTranslate = async (options) => {
        setIsTranslating(true);
        setEditError(null);
        try {
            const requestBody = {
                job_id: jobId,
                clip_index: index,
                target_language: options.targetLanguage,
                input_filename: currentVideoUrl.split('/').pop()
            };

            const res = await fetch(getApiUrl('/api/translate'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!res.ok) {
                const errText = await res.text();
                try {
                    const jsonErr = JSON.parse(errText);
                    throw new Error(jsonErr.detail || errText);
                } catch (e) {
                    if (e.message !== errText) throw e;
                    throw new Error(errText);
                }
            }

            const data = await res.json();
            if (data.new_video_url) {
                setCurrentVideoUrl(getApiUrl(data.new_video_url));
                if (videoRef.current) {
                    videoRef.current.load();
                }
                setShowTranslateModal(false);
            }

        } catch (e) {
            setEditError(e.message);
            setTimeout(() => setEditError(null), 5000);
        } finally {
            setIsTranslating(false);
        }
    };

    const handlePost = async () => {
        if (!uploadPostKey || !uploadUserId) {
            setPostResult({ success: false, msg: "Missing API Key or User ID." });
            return;
        }

        const selectedPlatforms = Object.keys(platforms).filter(k => platforms[k]);
        if (selectedPlatforms.length === 0) {
            setPostResult({ success: false, msg: "Select at least one platform." });
            return;
        }

        if (isScheduling && !scheduleDate) {
            setPostResult({ success: false, msg: "Please select a date and time." });
            return;
        }

        setPosting(true);
        setPostResult(null);

        try {
            const payload = {
                job_id: jobId,
                clip_index: index,
                api_key: uploadPostKey,
                user_id: uploadUserId,
                platforms: selectedPlatforms,
                title: postTitle,
                description: postDescription
            };

            if (isScheduling && scheduleDate) {
                // Convert to ISO-8601
                payload.scheduled_date = new Date(scheduleDate).toISOString();
                // Optional: pass timezone if needed, backend defaults to UTC or we can send user's timezone
                payload.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            }

            const res = await fetch(getApiUrl('/api/social/post'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errText = await res.text();
                try {
                    const jsonErr = JSON.parse(errText);
                    throw new Error(jsonErr.detail || errText);
                } catch {
                    throw new Error(errText);
                }
            }

            setPostResult({ success: true, msg: isScheduling ? "Scheduled successfully!" : "Posted successfully!" });
            setTimeout(() => {
                setShowModal(false);
                setPostResult(null);
            }, 3000);

        } catch (e) {
            setPostResult({ success: false, msg: `Failed: ${e.message}` });
        } finally {
            setPosting(false);
        }
    };

    return (
        <div className="panel overflow-hidden flex flex-col md:flex-row min-h-[280px]">
            {/* The clip */}
            <div className="w-full md:w-[168px] lg:w-[184px] shrink-0 bg-[#0e0e10] relative aspect-[9/16] md:aspect-auto">
                <video
                    ref={videoRef}
                    src={currentVideoUrl}
                    controls
                    className="w-full h-full object-cover"
                    playsInline
                    onPlay={() => {
                        const currentTime = videoRef.current ? videoRef.current.currentTime : 0;
                        onPlay && onPlay(clip.start + currentTime);
                    }}
                    onPause={() => onPause && onPause()}
                    onEnded={() => {
                        if (videoRef.current) {
                            videoRef.current.currentTime = 0;
                            videoRef.current.play();
                        }
                    }}
                />
                <div className="absolute top-2 left-2 flex items-center gap-2 h-6 px-2 rounded bg-background/85 border border-line pointer-events-none">
                    <span className="w-1 h-1 bg-marker" aria-hidden="true" />
                    <span className="timecode text-[11px]">{formatTimecode(clip.start)}–{formatTimecode(clip.end)}</span>
                    <span className="flex gap-0.5" aria-hidden="true">
                        <span className="w-0.5 h-1 bg-ink3" />
                        <span className="w-0.5 h-1 bg-ink3" />
                    </span>
                </div>

                {isEditing && (
                    <div className="absolute inset-0 bg-background/85 flex flex-col items-center justify-center gap-2 z-10 p-4 text-center">
                        <Loader2 size={20} className="text-ink2 animate-spin" />
                        <span className="text-[13px] text-ink">Editing clip {index + 1}</span>
                        <span className="text-[11px] text-ink3">Colour, zooms and transitions</span>
                    </div>
                )}
            </div>

            {/* Text and controls */}
            <div className="flex-1 p-4 md:p-5 flex flex-col overflow-hidden min-w-0">
                <div className="mb-3">
                    <h3 className="text-[15px] font-medium text-ink leading-snug line-clamp-2 break-words" title={clip.video_title_for_youtube_short}>
                        {clip.video_title_for_youtube_short || 'Clip ' + (index + 1)}
                    </h3>
                    <div className="flex items-center gap-3 mt-2 timecode">
                        <span>{Math.floor(clip.end - clip.start)}s</span>
                        <span className="text-line">|</span>
                        <span>9:16</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1 mb-3">
                    <div className="rounded-lg border border-line p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                            <Youtube size={12} className="text-ink3 shrink-0" />
                            <span className="text-[11px] text-ink3">YouTube title</span>
                        </div>
                        <p className="text-[13px] text-ink2 select-all break-words">
                            {clip.video_title_for_youtube_short || 'No title returned'}
                        </p>
                    </div>

                    <div className="rounded-lg border border-line p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                            <Instagram size={12} className="text-ink3 shrink-0" />
                            <span className="text-[11px] text-ink3">TikTok and Reels caption</span>
                        </div>
                        <p className="text-[13px] text-ink2 line-clamp-3 hover:line-clamp-none transition-colors cursor-pointer select-all break-words">
                            {clip.video_description_for_tiktok || clip.video_description_for_instagram}
                        </p>
                    </div>
                </div>

                {editError && (
                    <div className="mb-3 p-2 border border-line rounded-lg flex items-start gap-2">
                        <AlertCircle size={12} className="shrink-0 text-marker mt-0.5" />
                        <span className="text-[11px] text-ink2">{editError}</span>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-2 mt-auto pt-3 border-t border-line">
                    <button
                        onClick={handleAutoEdit}
                        disabled={isEditing}
                        className="h-8 px-2 rounded-lg bg-raised border border-line text-[12px] text-ink2 hover:text-ink hover:border-ink3 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40"
                    >
                        {isEditing ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
                        {isEditing ? 'Editing' : 'Auto edit'}
                    </button>

                    <button
                        onClick={() => setShowSubtitleModal(true)}
                        disabled={isSubtitling}
                        className="h-8 px-2 rounded-lg bg-raised border border-line text-[12px] text-ink2 hover:text-ink hover:border-ink3 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40"
                    >
                        {isSubtitling ? <Loader2 size={13} className="animate-spin" /> : <Type size={13} />}
                        {isSubtitling ? 'Adding' : 'Subtitles'}
                    </button>

                    <button
                        onClick={() => setShowHookModal(true)}
                        disabled={isHooking}
                        className="h-8 px-2 rounded-lg bg-raised border border-line text-[12px] text-ink2 hover:text-ink hover:border-ink3 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40"
                    >
                        {isHooking ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
                        {isHooking ? 'Adding' : 'Hook text'}
                    </button>

                    <button
                        onClick={() => setShowTranslateModal(true)}
                        disabled={isTranslating}
                        className="h-8 px-2 rounded-lg bg-raised border border-line text-[12px] text-ink2 hover:text-ink hover:border-ink3 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40"
                    >
                        {isTranslating ? <Loader2 size={13} className="animate-spin" /> : <Languages size={13} />}
                        {isTranslating ? 'Dubbing' : 'Dub voice'}
                    </button>

                    <button
                        onClick={() => setShowModal(true)}
                        className="h-8 px-2 rounded-lg bg-ink text-[#111113] text-[12px] font-medium hover:bg-white transition-colors flex items-center justify-center gap-1.5"
                    >
                        <Share2 size={13} className="shrink-0" /> Post
                    </button>
                    <button
                        onClick={async (e) => {
                            e.preventDefault();
                            try {
                                const response = await fetch(currentVideoUrl);
                                if (!response.ok) throw new Error('Download failed');
                                const blob = await response.blob();
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.style.display = 'none';
                                a.href = url;
                                a.download = `clip-${index + 1}.mp4`;
                                document.body.appendChild(a);
                                a.click();
                                window.URL.revokeObjectURL(url);
                                document.body.removeChild(a);
                            } catch (err) {
                                console.error('Download error:', err);
                                window.open(currentVideoUrl, '_blank');
                            }
                        }}
                        className="h-8 px-2 rounded-lg border border-line text-[12px] text-ink2 hover:text-ink hover:border-ink3 transition-colors flex items-center justify-center gap-1.5"
                    >
                        <Download size={13} className="shrink-0" /> Download
                    </button>
                </div>
            </div>

            {/* Post modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/90">
                    <div className="panel p-6 w-full max-w-md relative max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex items-start justify-between mb-5">
                            <div>
                                <h3 className="text-[15px] font-medium">Post or schedule</h3>
                                <p className="text-[13px] text-ink3 mt-1">Clip {index + 1} · {formatTimecode(clip.start)}–{formatTimecode(clip.end)}</p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-ink3 hover:text-ink transition-colors"
                                aria-label="Close"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {!uploadPostKey && (
                            <div className="mb-4 p-3 border border-line rounded-lg flex items-start gap-2">
                                <AlertCircle size={13} className="mt-0.5 shrink-0 text-ink3" />
                                <span className="text-[12px] text-ink2">Add an Upload-Post key in Settings to publish from here. Download still works.</span>
                            </div>
                        )}

                        <div className="space-y-4 mb-5">
                            <div>
                                <label className="block text-[12px] text-ink2 mb-1.5" htmlFor="post-title">Title</label>
                                <input
                                    id="post-title"
                                    type="text"
                                    value={postTitle}
                                    onChange={(e) => setPostTitle(e.target.value)}
                                    className="input-field"
                                    placeholder="Title for the post"
                                />
                            </div>

                            <div>
                                <label className="block text-[12px] text-ink2 mb-1.5" htmlFor="post-caption">Caption</label>
                                <textarea
                                    id="post-caption"
                                    value={postDescription}
                                    onChange={(e) => setPostDescription(e.target.value)}
                                    rows={4}
                                    className="input-field resize-none"
                                    placeholder="Caption for the post"
                                />
                            </div>

                            <div className="rounded-lg border border-line p-3">
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-2 text-[13px] text-ink2">
                                        <Calendar size={14} className="text-ink3" /> Schedule
                                    </span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={isScheduling} onChange={(e) => setIsScheduling(e.target.checked)} className="sr-only peer" />
                                        <div className="w-9 h-5 bg-line rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-ink2 after:rounded-full after:h-3.5 after:w-3.5 after:transition-transform peer-checked:bg-ink peer-checked:after:bg-[#111113]"></div>
                                    </label>
                                </div>

                                {isScheduling && (
                                    <div className="mt-3">
                                        <label className="block text-[12px] text-ink2 mb-1.5" htmlFor="post-date">Date and time</label>
                                        <div className="relative">
                                            <input
                                                id="post-date"
                                                type="datetime-local"
                                                value={scheduleDate}
                                                onChange={(e) => setScheduleDate(e.target.value)}
                                                className="input-field pl-9"
                                            />
                                            <Clock size={14} className="absolute left-3 top-3 text-ink3" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <span className="block text-[12px] text-ink2 mb-2">Platforms</span>
                                <div className="grid grid-cols-1 gap-2">
                                    {[
                                        { key: 'tiktok', label: 'TikTok', icon: Video },
                                        { key: 'instagram', label: 'Instagram', icon: Instagram },
                                        { key: 'youtube', label: 'YouTube Shorts', icon: Youtube },
                                    ].map((platform) => (
                                        <label key={platform.key} className="flex items-center gap-3 h-10 px-3 rounded-lg border border-line cursor-pointer hover:border-ink3 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={platforms[platform.key]}
                                                onChange={(e) => setPlatforms({ ...platforms, [platform.key]: e.target.checked })}
                                                className="w-4 h-4 rounded accent-ink"
                                            />
                                            <platform.icon size={14} className="text-ink3" />
                                            <span className="text-[13px] text-ink">{platform.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {postResult && (
                            <div className="mb-4 p-3 rounded-lg border border-line flex items-start gap-2">
                                {postResult.success
                                    ? <CheckCircle size={13} className="mt-0.5 shrink-0 text-ink2" />
                                    : <AlertCircle size={13} className="mt-0.5 shrink-0 text-marker" />}
                                <span className="text-[12px] text-ink2">{postResult.msg}</span>
                            </div>
                        )}

                        <button
                            onClick={handlePost}
                            disabled={posting || !uploadPostKey}
                            className="btn-primary w-full"
                        >
                            {posting ? (
                                <><Loader2 size={15} className="animate-spin" /> {isScheduling ? 'Scheduling' : 'Publishing'}</>
                            ) : (
                                <><Share2 size={15} /> {isScheduling ? 'Schedule' : 'Publish now'}</>
                            )}
                        </button>
                    </div>
                </div>
            )}

            <SubtitleModal
                isOpen={showSubtitleModal}
                onClose={() => setShowSubtitleModal(false)}
                onGenerate={handleSubtitle}
                isProcessing={isSubtitling}
                videoUrl={currentVideoUrl}
            />

            <HookModal
                isOpen={showHookModal}
                onClose={() => setShowHookModal(false)}
                onGenerate={handleHook}
                isProcessing={isHooking}
                videoUrl={currentVideoUrl}
                initialText={clip.viral_hook_text}
            />

            <TranslateModal
                isOpen={showTranslateModal}
                onClose={() => setShowTranslateModal(false)}
                onTranslate={handleTranslate}
                isProcessing={isTranslating}
                videoUrl={currentVideoUrl}
            />
        </div>
    );
}
