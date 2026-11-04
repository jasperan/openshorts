import React, { useState, useEffect, useRef } from 'react';
import { Film, Download, Copy, Check, ExternalLink, Loader2, Play, User } from 'lucide-react';
import { getApiUrl } from '../config';

export default function UGCGallery() {
  const [tab, setTab] = useState('videos');
  const [videos, setVideos] = useState([]);
  const [avatars, setAvatars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(getApiUrl('/api/saasshorts/gallery?limit=100')).then(r => r.ok ? r.json() : { videos: [] }),
      fetch(getApiUrl('/api/saasshorts/actor-gallery')).then(r => r.ok ? r.json() : { images: [] }),
    ])
      .then(([vData, aData]) => {
        setVideos(vData.videos || []);
        setAvatars(aData.images || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-ink3" />
        <span className="ml-2 text-ink2">Loading gallery...</span>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-ink">UGC Gallery</h2>
          <p className="text-xs text-ink3">{videos.length} videos · {avatars.length} avatars</p>
        </div>
        <a
          href={getApiUrl('/gallery')}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-ink3 hover:text-ink3 flex items-center gap-1"
        >
          <ExternalLink size={12} /> Public Gallery
        </a>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-line">
        {[
          { id: 'videos', label: 'Videos', count: videos.length, icon: Film },
          { id: 'avatars', label: 'Avatars', count: avatars.length, icon: User },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 h-9 -mb-px border-b text-[13px] transition-colors ${
              tab === t.id ? 'text-ink border-ink' : 'text-ink3 border-transparent hover:text-ink2'
            }`}
          >
            <t.icon size={14} />
            {t.label}
            <span className="timecode">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Videos Tab */}
      {tab === 'videos' && (
        videos.length === 0 ? (
          <div className="text-center py-16">
            <Film size={40} className="mx-auto text-ink3 mb-3" />
            <p className="text-sm text-ink3">No videos yet. Generate one from AI Shorts.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {videos.map((video) => (
              <VideoCard key={video.video_id} video={video} copied={copied} onCopy={handleCopy} />
            ))}
          </div>
        )
      )}

      {/* Avatars Tab */}
      {tab === 'avatars' && (
        avatars.length === 0 ? (
          <div className="text-center py-16">
            <User size={40} className="mx-auto text-ink3 mb-3" />
            <p className="text-sm text-ink3">No avatars yet. Generate actors from AI Shorts.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {avatars.map((avatar, i) => (
              <AvatarCard key={avatar.key || i} avatar={avatar} copied={copied} onCopy={handleCopy} />
            ))}
          </div>
        )
      )}
      </div>
    </div>
  );
}

function AvatarCard({ avatar, copied, onCopy }) {
  return (
    <div className="group rounded-xl overflow-hidden border border-line bg-raised hover:border-line transition-colors">
      <div className="aspect-[3/4] bg-black">
        <img src={avatar.url} alt="Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="p-2 space-y-1">
        {avatar.description ? (
          <div className="relative pr-4">
            <p className="text-[11px] text-ink2 line-clamp-2">{avatar.description}</p>
            <button
              onClick={() => onCopy(avatar.description, `avatar-${avatar.key}`)}
              className="absolute top-0 right-0 p-0.5 text-ink3 hover:text-ink2"
              title="Copy prompt"
            >
              {copied === `avatar-${avatar.key}` ? <Check size={9} /> : <Copy size={9} />}
            </button>
          </div>
        ) : (
          <p className="text-[11px] text-ink3">No description</p>
        )}
        <a
          href={avatar.url}
          download
          className="block text-center text-[11px] bg-raised hover:bg-raised text-ink2 py-1 rounded-md transition-colors"
        >
          <Download size={9} className="inline mr-0.5" />Download
        </a>
      </div>
    </div>
  );
}

function VideoCard({ video, copied, onCopy }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  const handleMouseEnter = () => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
      setPlaying(true);
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setPlaying(false);
    }
  };

  const mode = video.video_mode;
  const caption = video.caption || '';
  const hashtags = (video.hashtags || []).join(' ');

  return (
    <div className="group rounded-xl overflow-hidden border border-line bg-raised hover:border-line transition-colors">
      <div
        className="relative aspect-[9/16] bg-black cursor-pointer"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <video
          ref={videoRef}
          src={video.video_url}
          poster={video.actor_url}
          muted
          playsInline
          preload="metadata"
          className="w-full h-full object-cover"
        />
        {!playing && (
          <div className="absolute inset-0 flex items-center justify-center bg-background">
            <Play size={20} className="text-ink/70" />
          </div>
        )}
        <div className="absolute top-1.5 right-1.5">
          <span className={`text-[11px] px-1.5 py-0.5 rounded bg-background/85 border border-line ${
            mode === 'lowcost' ? 'text-ink3' : 'text-ink3'
          }`}>
            {mode === 'lowcost' ? 'Low cost' : 'Premium'}
          </span>
        </div>
      </div>

      <div className="p-2 space-y-1">
        <h3 className="text-[11px] font-medium text-ink truncate">{video.title || 'Untitled'}</h3>
        <p className="text-[11px] text-ink3">
          {video.duration?.toFixed(0)}s · ${video.cost_estimate?.total?.toFixed(2) || '?'}
        </p>
        {caption && (
          <div className="relative pr-4">
            <p className="text-[11px] text-ink2 line-clamp-2">{caption}</p>
            <button
              onClick={() => onCopy(`${caption}\n${hashtags}`, `caption-${video.video_id}`)}
              className="absolute top-0 right-0 p-0.5 text-ink3 hover:text-ink2"
              title="Copy caption"
            >
              {copied === `caption-${video.video_id}` ? <Check size={9} /> : <Copy size={9} />}
            </button>
          </div>
        )}
        <div className="flex gap-1 pt-0.5">
          <a
            href={video.video_url}
            download
            className="flex-1 text-center text-[11px] bg-raised hover:bg-raised text-ink2 py-1 rounded-md transition-colors"
          >
            <Download size={9} className="inline mr-0.5" />Download
          </a>
          <a
            href={getApiUrl(`/video/${video.video_id}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center text-[11px] bg-raised hover:bg-raised text-ink3 py-1 rounded-md transition-colors"
          >
            <ExternalLink size={9} className="inline mr-0.5" />View
          </a>
        </div>
      </div>
    </div>
  );
}
