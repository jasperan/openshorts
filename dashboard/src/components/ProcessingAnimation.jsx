import React, { useEffect, useState, useRef } from 'react';


const formatTime = (seconds) => {
  const total = Math.max(0, Math.floor(seconds || 0));
  const m = Math.floor(total / 60);
  const sec = total % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

const ProcessingAnimation = ({ media, isComplete, syncedTime, isSyncedPlaying, syncTrigger }) => {
  const [videoSrc, setVideoSrc] = useState(null);
  const [isYouTube, setIsYouTube] = useState(false);
  const videoRef = useRef(null);
  const iframeRef = useRef(null);

  useEffect(() => {
    if (!media) return;

    if (media.type === 'file') {
      const url = URL.createObjectURL(media.payload);
      setVideoSrc(url);
      return () => URL.revokeObjectURL(url);
    } else if (media.type === 'url') {
      setIsYouTube(true);
      const videoId = getYouTubeId(media.payload);
      setVideoSrc(videoId);
    }
  }, [media]);

  // Handle Sync Playback for Local Video
  useEffect(() => {
    if (!isYouTube && videoRef.current) {
      if (isSyncedPlaying) {
        // Sync Mode: Seek to time and Play
        videoRef.current.currentTime = syncedTime;
        videoRef.current.play().catch(e => console.log("Auto-play prevented", e));
        videoRef.current.loop = false;
        videoRef.current.muted = true; // Keep muted to avoid double audio with clip
      } else {
        // Stop Sync: Pause
        videoRef.current.pause();

        // If Analysis Complete and we just stopped syncing (paused clip), we might want to return to ambient loop?
        // User issue: "ahora el video loop original que sale oscurito ahora bien pero es una imagen estatica no se está reproduciendo el video en bucle como antes"
        // This means when NOT synced, it should loop.
        
        // HOWEVER, previously user asked: "si pauso el video preview y lo reanudo el video original se vuelve al princpio en vez de contnuar igual"
        // This implies: 
        // 1. If I PAUSE the clip -> Left video should PAUSE (static image) so it can resume.
        // 2. If I STOP (or it finishes? or just idle state?) -> It should LOOP.
        
        // The problem is we only have onPause from the clip.
        // Maybe we need to distinguish "Pause" vs "Idle/Stop".
        // But currently we just get `isSyncedPlaying = false`.
        
        // If the user wants "resume from where left off", it MUST be static (paused).
        // If the user wants "loop when not playing", it MUST play.
        // These are contradictory for the "Paused" state.
        
        // BUT, maybe the "loop original" refers to the initial state BEFORE any clip is played?
        // OR when the clip finishes?
        
        // Let's look at the logic:
        // isSyncedPlaying is true ONLY when a clip is playing.
        // When clip pauses, isSyncedPlaying becomes false.
        
        // If we want it to loop "como antes", we should set it to loop.
        // But then we lose the "resume" position because it starts looping.
        // Unless... we only loop if we haven't started syncing yet? Or if explicitly reset?
        
        // Wait, the user said: "ahora el video loop original que sale oscurito ahora bien pero es una imagen estatica"
        // This likely refers to the state AFTER analysis is complete but BEFORE (or after) playing a clip.
        // If I haven't touched a clip yet, `isSyncedPlaying` is false.
        // In that case, it SHOULD be looping.
        
        // My previous change removed the "else { play loop }" block entirely.
        // I need to restore the loop for the IDLE state, but keep the PAUSE for the "paused clip" state?
        // That requires knowing WHY `isSyncedPlaying` is false.
        
        // Actually, if `isSyncedPlaying` is false, it means no clip is controlling it.
        // If I want it to loop in the background, I can just let it loop.
        // BUT if I play a clip later, it will jump to the sync time anyway (handled by the `if (isSyncedPlaying)` block).
        // The only issue is if I PAUSE the clip, `isSyncedPlaying` becomes false, and if I immediately start looping,
        // visually it might jump or start moving when it should be "paused".
        
        // Let's try this:
        // If `syncedTime` is 0 (or we track if we ever started syncing?), we loop.
        // But `syncedTime` updates on play.
        
        // Alternative interpretation: The user sees it static because I removed `videoRef.current.play()` in the else block.
        // If I put it back, it fixes the "loop" issue.
        // Does it break the "resume" issue?
        // "si pauso el video preview y lo reanudo el video original se vuelve al princpio en vez de contnuar igual"
        // If I pause the clip -> `isSyncedPlaying` = false.
        // If logic says -> Loop from 0.
        // Then I resume -> `isSyncedPlaying` = true -> Jump to `syncedTime`.
        // This actually SHOULD work fine for "resume", because `syncedTime` comes from the clip's current time.
        // The only visual glitch is that while paused, the left video is looping instead of frozen on the frame.
        
        // If the user accepts that "Paused Clip" = "Background Loop", then we are good.
        // If the user wants "Paused Clip" = "Frozen Frame" AND "Idle" = "Background Loop", we need more state.
        // But typically "Idle" implies we aren't focusing on a clip.
        
        // Let's restore the loop behavior because "video loop original... es una imagen estatica" sounds like a bug to them.
        
        if (isComplete) {
             videoRef.current.loop = true;
             videoRef.current.play().catch(e => console.log("Ambient play prevented", e));
        }
      }
    }
  }, [syncedTime, isSyncedPlaying, isYouTube, isComplete, syncTrigger]);

  // Handle Sync Playback for YouTube (Basic Iframe Control via PostMessage)
  useEffect(() => {
    if (isYouTube && iframeRef.current && videoSrc) {
        const iframeWindow = iframeRef.current.contentWindow;
        if (isSyncedPlaying) {
             // Seek and Play
             iframeWindow.postMessage(JSON.stringify({ event: 'command', func: 'seekTo', args: [syncedTime, true] }), '*');
             iframeWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*');
        } else {
             // Pause
            //  iframeWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), '*'); // Removed pause to allow loop if needed, but YT embeds are tricky with custom loops via API.
            // For now, let's just pause YouTube as complex looping is harder without state.
             iframeWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), '*');
        }
    }
  }, [syncedTime, isSyncedPlaying, isYouTube, videoSrc, syncTrigger]);


  const getYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const containerClasses = `relative w-full aspect-video rounded-lg overflow-hidden bg-[#0e0e10] border border-line mb-4 transition-colors duration-200
    ${isSyncedPlaying ? 'border-ink3' : ''}`;

  const getVideoOpacityClass = () => {
    if (isSyncedPlaying) return 'opacity-100';
    if (isComplete) return 'opacity-60';
    return 'opacity-40';
  };

  return (
    <div className={containerClasses}>
      {/* Video layer */}
      <div className={`absolute inset-0 transition-opacity duration-200 ${getVideoOpacityClass()}`}>
        {isYouTube && videoSrc ? (
          <iframe
            ref={iframeRef}
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${videoSrc}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoSrc}&modestbranding=1&showinfo=0&rel=0&enablejsapi=1`}
            title="Source video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        ) : videoSrc ? (
          <video
            ref={videoRef}
            src={videoSrc}
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-5 h-5 rounded-full border-2 border-line border-t-ink3 animate-spin" />
          </div>
        )}
      </div>

      {!isComplete && (
        <div className="absolute top-3 left-3 flex items-center gap-2 h-6 px-2 rounded bg-background/80 border border-line">
          <span className="w-1.5 h-1.5 rounded-full bg-marker" />
          <span className="timecode text-[11px]">analysing</span>
        </div>
      )}

      {isSyncedPlaying && (
        <div className="absolute bottom-3 right-3 h-6 px-2 rounded bg-background/80 border border-line flex items-center">
          <span className="timecode text-[11px]">synced {formatTime(syncedTime)}</span>
        </div>
      )}
    </div>
  );
};

export default ProcessingAnimation;
