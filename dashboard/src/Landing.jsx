import React from 'react';
import {
  Github, ArrowRight, Check, ChevronDown, Scissors, Clapperboard, Monitor,
  Cpu, Languages, Globe, Zap, Upload, Shield, Subtitles, Type, FileVideo,
  Youtube, Instagram, Music2, Image as ImageIcon,
} from 'lucide-react';

const TikTokIcon = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z" />
  </svg>
);

/* The one bright element: the cut, drawn as the product draws it.
   A source strip with the detected moments marked in china-marker red,
   and the clip that comes out of it. */
const audioBars = [
  18, 34, 26, 48, 62, 44, 28, 52, 74, 58, 36, 24, 42, 68, 88, 72, 54, 38,
  26, 46, 64, 82, 66, 48, 32, 22, 40, 58, 76, 60, 44, 30, 24, 38, 56, 70,
  52, 34, 26, 44, 62, 46, 30, 22, 36, 54, 68, 50,
];

const moments = [
  { at: '13%', width: '15%', time: '00:32', score: 91 },
  { at: '42%', width: '18%', time: '01:47', score: 84 },
  { at: '74%', width: '13%', time: '03:05', score: 78 },
];

const HeroDeck = () => (
  <div className="relative">
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between px-5 h-11 border-b border-line">
        <span className="timecode truncate">interview_final.mp4</span>
        <span className="flex items-center gap-1.5 shrink-0">
          <span className="timecode">42:18</span>
          <span className="flex gap-0.5" aria-hidden="true">
            <span className="w-1 h-1.5 bg-ink3" />
            <span className="w-1 h-1.5 bg-ink3" />
          </span>
        </span>
      </div>

      <div className="px-5 pt-8 pb-5">
        <div className="relative h-28">
          <div className="absolute inset-0 flex items-end gap-[3px]">
            {audioBars.map((h, i) => (
              <div key={i} className="flex-1 bg-line" style={{ height: `${h}%` }} />
            ))}
          </div>
          {moments.map((m) => (
            <div
              key={m.time}
              className="absolute top-0 bottom-0 border-l border-marker bg-marker/10"
              style={{ left: m.at, width: m.width }}
            >
              <span className="absolute -top-6 left-0 timecode text-ink2">{m.time}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-line">
          <div className="flex items-center gap-4">
            {moments.map((m) => (
              <span key={m.time} className="timecode">
                {m.time} · {m.score}
              </span>
            ))}
          </div>
          <span className="timecode shrink-0">3 cuts</span>
        </div>
      </div>
    </div>

    {/* The clip that comes out of the strip */}
    <div className="absolute -bottom-10 -right-4 w-[124px] sm:w-[136px]">
      <div className="rounded-lg border border-line bg-surface p-1.5">
        <div className="relative aspect-[9/16] rounded-[6px] bg-[#0e0e10] overflow-hidden">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 80% at 50% 0%, rgba(242,242,240,0.07), transparent 60%)' }} />
          <span className="absolute top-2 left-2 flex items-center gap-1 timecode text-[11px]">
            00:32
            <span className="flex gap-0.5" aria-hidden="true">
              <span className="w-0.5 h-1 bg-ink3" />
              <span className="w-0.5 h-1 bg-ink3" />
            </span>
          </span>
          <div className="absolute inset-x-0 bottom-4 text-center">
            <span className="bg-ink text-[#111113] text-[9px] leading-[1.7] px-1 font-medium whitespace-nowrap">
              the whole take
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const Section = ({ id, label, title, intro, children, className = '', width = 'max-w-6xl' }) => (
  <section id={id} className={`px-6 scroll-mt-16 ${className}`}>
    <div className={`${width} mx-auto`}>
      <div className="mb-10">
        <div className="section-label mb-3">{label}</div>
        <h2 className="text-2xl md:text-3xl font-medium text-ink tracking-[-0.01em] max-w-2xl">{title}</h2>
        {intro && <p className="mt-3 text-ink2 max-w-2xl leading-relaxed">{intro}</p>}
      </div>
      {children}
    </div>
  </section>
);

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="panel p-5">
    <div className="flex items-center gap-2 mb-2">
      <Icon size={16} className="text-ink3 shrink-0" />
      <h3 className="text-[15px] font-medium text-ink">{title}</h3>
    </div>
    <p className="text-[13px] text-ink2 leading-relaxed">{description}</p>
  </div>
);

export default function Landing({ onLaunchApp }) {
  const [openFaq, setOpenFaq] = React.useState(null);

  const tools = [
    {
      icon: Scissors,
      title: "Clip Generator",
      description: "Long video in, vertical clips out. The model reads the transcript and the scene boundaries, picks the moments worth keeping, and cuts them.",
      points: ['Moment detection with scores', '9:16 crop that follows the speaker', 'Burned-in subtitles', 'Dubbing into 30+ languages'],
    },
    {
      icon: Clapperboard,
      title: "AI Shorts",
      description: "UGC-style marketing video for a product: script, actor, voiceover, b-roll and subtitles, generated from a URL or a description.",
      points: ['Script from a URL or a brief', 'Avatar with lip-sync', 'B-roll and subtitle overlays', 'From $0.65 per video'],
    },
    {
      icon: ImageIcon,
      title: "YouTube Studio",
      description: "The packaging around the clip: a thumbnail built from your face photo, ten title options with a refinement chat, and a description with chapters.",
      points: ['Thumbnail generator', 'Ten title options + chat', 'Descriptions with chapters', 'Publish to YouTube'],
    },
  ];

  const features = [
    {
      icon: Scissors,
      title: "Moment detection",
      description: "The model reads the full transcript with timestamps and the scene boundaries, then scores 3 to 15 candidate moments on hook strength and shareability."
    },
    {
      icon: FileVideo,
      title: "9:16 vertical crop",
      description: "TRACK mode follows one subject with MediaPipe face detection and a YOLOv8 fallback. GENERAL mode builds a blurred background for group shots and landscapes."
    },
    {
      icon: Subtitles,
      title: "Subtitles with word timing",
      description: "faster-whisper transcribes with word-level timestamps. The subtitles are styled and burned into each clip, so the text survives any re-upload."
    },
    {
      icon: Languages,
      title: "Dubbing in 30+ languages",
      description: "ElevenLabs translates and dubs the audio while keeping the speaker's voice. Dubbed clips are re-transcribed so the subtitles match the new language."
    },
    {
      icon: Type,
      title: "Hook text overlays",
      description: "Styled text over the first seconds of the clip, with the position and the font chosen in the editor."
    },
    {
      icon: Zap,
      title: "Video effects",
      description: "The model writes FFmpeg filters for colour grading, transitions and small enhancements, applied to the clip in the pipeline."
    },
    {
      icon: Upload,
      title: "YouTube URL or local file",
      description: "Paste a YouTube link or drop a file. yt-dlp downloads at the best available quality and keeps the original resolution and audio."
    },
    {
      icon: Shield,
      title: "Self-hosted",
      description: "Docker Compose on your own machine. Video files stay in your infrastructure. API keys live in your browser and go to the backend only for the request that needs them."
    },
    {
      icon: Monitor,
      title: "YouTube packaging",
      description: "Thumbnail from a face photo and a background, ten title options with a refinement chat, and a description with chapter timestamps. Publish from the same workflow."
    },
    {
      icon: Globe,
      title: "Direct publishing",
      description: "Post to TikTok, Instagram Reels and YouTube Shorts from the dashboard through Upload-Post, with async uploads and progress in the log."
    },
    {
      icon: Clapperboard,
      title: "UGC video generator",
      description: "Describe a product or paste its URL. The pipeline writes the script, generates the actor, adds b-roll and subtitles, and returns a 9:16 video. From $0.65."
    },
    {
      icon: Music2,
      title: "Actors with lip-sync",
      description: "Pick an actor from the gallery or use your own photo. The pipeline generates a talking head with lip-synced voiceover in English or Spanish. Two modes: $0.65 and $2.00 per video."
    },
  ];

  const steps = [
    { title: "Paste a URL or upload a file", description: "A YouTube link or a local video. Any common format and resolution." },
    { title: "The model finds the moments", description: "Transcription with word timing, scene boundaries, then 3 to 15 candidate clips of 15 to 60 seconds, each with a score." },
    { title: "Crop to 9:16", description: "Face tracking keeps the speaker in frame with stabilised movement. Group shots get the blurred background layout." },
    { title: "Subtitles, hook, effects", description: "Styled subtitles, hook text on the first seconds, and FFmpeg effects written for the clip. Dubbing is optional." },
    { title: "Download or publish", description: "Export the clip, or post it to TikTok, Reels and Shorts from the dashboard." },
  ];

  const apis = [
    { name: "Google Gemini", role: "Required for the AI Shorts script and the YouTube packaging", cost: "Free tier: 1,500 requests/day", icon: Cpu },
    { name: "ElevenLabs", role: "Dubbing and voiceover", cost: "Free tier included", icon: Languages },
    { name: "Upload-Post", role: "Publishing to YouTube, TikTok and Instagram", cost: "Free tier included", icon: Globe },
    { name: "fal.ai", role: "AI Shorts actors, talking-head video and lip-sync", cost: "Pay per use, from $0.04", icon: Zap },
  ];

  const stack = [
    { name: "Gemini 3.0 Flash", desc: "Script and packaging" },
    { name: "faster-whisper", desc: "Transcription" },
    { name: "YOLOv8", desc: "Object detection" },
    { name: "MediaPipe", desc: "Face tracking" },
    { name: "FFmpeg", desc: "Video processing" },
    { name: "ElevenLabs", desc: "Voice and TTS" },
    { name: "fal.ai", desc: "Video generation" },
    { name: "React + Vite", desc: "Dashboard" },
    { name: "Docker", desc: "Deployment" },
  ];

  const faqs = [
    {
      question: "What is OpenShorts and how does it work?",
      answer: "A self-hosted clip generator. You give it a YouTube URL or a local file; it transcribes the audio with word-level timestamps, detects scene boundaries with PySceneDetect, and asks the model to pick the most engaging 15 to 60 second moments. Each moment is cut, cropped to 9:16 with face tracking, and subtitled."
    },
    {
      question: "Is it really free?",
      answer: "The software is open source and self-hosted. The AI Shorts and YouTube packaging features call external APIs that have free tiers: Gemini (1,500 requests per day), ElevenLabs and Upload-Post. Nothing is metered by OpenShorts itself: no watermarks, no per-video fee."
    },
    {
      question: "How does it compare to Opus Clip?",
      answer: "Both detect moments and crop to vertical. OpenShorts is free and runs on your infrastructure, so files stay local. Opus Clip is a managed cloud service at $15–228/month. The trade-off is that OpenShorts needs Docker and a Gemini key for the packaging features."
    },
    {
      question: "How do I turn a YouTube video into a Short or a Reel?",
      answer: "Paste the URL, pick a tone and a clip count, and press process. The pipeline downloads with yt-dlp, transcribes with faster-whisper, finds the moments, crops to 9:16 with MediaPipe face tracking, and burns in the subtitles."
    },
    {
      question: "What model detects the moments?",
      answer: "The clip pipeline runs a local model through Ollama, configured in the dashboard settings, so analysis does not leave your machine. The AI Shorts script and the YouTube title and thumbnail generation use Gemini."
    },
    {
      question: "Can it translate and dub a clip?",
      answer: "Yes. ElevenLabs translates the audio into over 30 languages and keeps the speaker's voice. The dubbed audio is transcribed again so the burned-in subtitles match the new language."
    },
    {
      question: "How does the vertical crop work?",
      answer: "Two modes. TRACK follows a single subject using MediaPipe face detection with YOLOv8 as fallback, with stabilised movement and a guard against switching subjects mid-shot. GENERAL handles group shots and landscapes with a blurred background layout."
    },
    {
      question: "Can it make thumbnails and titles?",
      answer: "The YouTube Studio tab generates a thumbnail from a face photo and a background, ten title options with a refinement chat, and a description with chapter timestamps. It can publish the result to YouTube."
    },
    {
      question: "What does it need to run?",
      answer: "Docker. 8GB of RAM and a modern multi-core CPU are the recommended baseline; an NVIDIA GPU speeds up processing when CUDA is available. The compose file installs Python 3.11, FFmpeg, YOLOv8, MediaPipe, faster-whisper and the React dashboard. Linux, macOS, and Windows through WSL2."
    },
    {
      question: "What is the AI Shorts generator?",
      answer: "It generates a marketing video for a product: you describe the product or paste its URL, and the pipeline writes a script, generates an actor with lip-synced voiceover, adds b-roll and subtitles, and returns a vertical video. Two cost modes: about $0.65 per video with Hailuo and VEED lip-sync, or about $2.00 with Kling Avatar v2."
    },
    {
      question: "What does an AI Shorts video cost?",
      answer: "Only the external APIs charge. The low cost mode adds up to about $0.65: Flux image $0.05, ElevenLabs voice $0.10, Hailuo image-to-video $0.19, VEED lip-sync $0.20, b-roll $0.10. The premium mode is about $2.00 per video with Kling Avatar v2."
    },
    {
      question: "Which businesses does the UGC generator work for?",
      answer: "Any product, service or business: restaurants, shops, coaching, local services, apps. Describe the business in the text field or paste the website, and the script is written for it."
    },
  ];

  const check = <Check size={14} className="text-ink3 mx-auto" />;
  const quiet = (text) => <span className="text-[13px] text-ink3">{text}</span>;

  return (
    <div className="min-h-screen bg-background text-ink">
      <nav className="fixed top-0 w-full z-50 bg-background/90 border-b border-line">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2.5">
            <img src="/logo-openshorts.png" alt="OpenShorts" className="w-7 h-7" />
            <span className="text-[15px] font-medium">OpenShorts</span>
          </a>
          <div className="hidden md:flex items-center gap-7 text-[13px] text-ink2">
            <a href="#features" className="hover:text-ink transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-ink transition-colors">How it works</a>
            <a href="#comparison" className="hover:text-ink transition-colors">Comparison</a>
            <a href="#faq" className="hover:text-ink transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/mutonby/openshorts"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 text-[13px] text-ink2 hover:text-ink transition-colors"
            >
              <Github size={16} />
              <span>GitHub</span>
            </a>
            <button onClick={onLaunchApp} className="btn-primary h-9 text-[13px]">
              Open the dashboard
            </button>
          </div>
        </div>
      </nav>

      {/* Hero: text on the left, the cut on the right */}
      <section id="top" className="px-6 pt-32 pb-24 scroll-mt-16">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-16 lg:gap-20 items-center">
          <div>
            <div className="timecode mb-6">Self-hosted with Docker · open source</div>
            <h1 className="text-[40px] sm:text-[52px] lg:text-[56px] leading-[1.04] font-medium tracking-[-0.02em]">
              One long video in. A stack of vertical clips out.
            </h1>
            <p className="mt-6 text-[17px] text-ink2 leading-relaxed max-w-xl">
              The model reads the transcript, picks the moments worth keeping, crops them to 9:16 with face
              tracking, burns in subtitles and can dub them. It all runs on your machine.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button onClick={onLaunchApp} className="btn-primary">
                Open the dashboard
                <ArrowRight size={16} />
              </button>
              <a
                href="https://github.com/mutonby/openshorts"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-quiet"
              >
                <Github size={16} />
                View the source
              </a>
            </div>
            <div className="mt-10 flex items-center gap-6 text-[13px] text-ink3">
              <span className="flex items-center gap-2"><Youtube size={15} /> Shorts</span>
              <span className="flex items-center gap-2"><Instagram size={15} /> Reels</span>
              <span className="flex items-center gap-2"><TikTokIcon size={15} /> TikTok</span>
            </div>
          </div>

          <HeroDeck />
        </div>
      </section>

      {/* Facts, each number with what it counts */}
      <section className="border-y border-line">
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: '$0', label: 'per clip, self-hosted' },
            { value: '30+', label: 'dubbing languages' },
            { value: '9:16', label: 'crop with face tracking' },
            { value: '3', label: 'tools in one dashboard' },
          ].map((fact) => (
            <div key={fact.label}>
              <div className="text-2xl font-medium tabular-nums">{fact.value}</div>
              <div className="mt-1 text-[13px] text-ink3">{fact.label}</div>
            </div>
          ))}
        </div>
      </section>

      <Section
        id="tools"
        label="Three tools, one dashboard"
        title="Cut the clip, generate the ad, package the video"
        intro="Each tool is a tab. They share the same library of uploads and the same publishing step."
        className="py-24"
      >
        <div className="grid md:grid-cols-3 gap-4">
          {tools.map((tool) => (
            <div key={tool.title} className="panel p-6 flex flex-col">
              <tool.icon size={18} className="text-ink3 mb-4" />
              <h3 className="text-base font-medium mb-2">{tool.title}</h3>
              <p className="text-[13px] text-ink2 leading-relaxed mb-5">{tool.description}</p>
              <ul className="mt-auto space-y-2">
                {tool.points.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-[13px] text-ink2">
                    <Check size={13} className="text-ink3 mt-[3px] shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section
        id="features"
        label="Features"
        title="What the pipeline does, step by step"
        intro="Every step below is a module you can read in the source, with the model and the settings it uses."
        className="py-24 border-t border-line"
      >
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </Section>

      <Section
        label="External APIs"
        title="Four APIs, all with a free tier"
        intro="OpenShorts itself is free. The optional features call these services with your own keys, which stay in your browser until a request needs them."
        className="py-24 bg-surface border-y border-line"
        width="max-w-5xl"
      >
        <div className="divide-y divide-line border-y border-line">
          {apis.map((api) => (
            <div key={api.name} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 py-4">
              <div className="flex items-center gap-3 sm:w-52 shrink-0">
                <api.icon size={16} className="text-ink3" />
                <span className="text-sm font-medium">{api.name}</span>
              </div>
              <p className="flex-1 text-[13px] text-ink2">{api.role}</p>
              <span className="timecode sm:text-right">{api.cost}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section
        id="how-it-works"
        label="How it works"
        title="Five steps from a URL to a finished clip"
        intro="The pipeline runs on your machine; the model only ever sees the transcript and the frame descriptions."
        className="py-24"
        width="max-w-3xl"
      >
        <ol className="divide-y divide-line border-y border-line">
          {steps.map((step, i) => (
            <li key={step.title} className="flex gap-6 py-5">
              <span className="timecode shrink-0 w-6 pt-0.5">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h3 className="text-sm font-medium mb-1">{step.title}</h3>
                <p className="text-[13px] text-ink2 leading-relaxed">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section
        label="Under the hood"
        title="The tools the pipeline is built from"
        className="py-16 border-t border-line"
        width="max-w-5xl"
      >
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4">
          {stack.map((tech) => (
            <div key={tech.name} className="flex items-baseline justify-between gap-4 border-b border-line pb-2">
              <span className="text-[13px] text-ink">{tech.name}</span>
              <span className="timecode text-right">{tech.desc}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section
        id="comparison"
        label="Comparison"
        title="Same capabilities, self-hosted"
        intro="Opus Clip is a managed service; Kapwing is a browser editor. Prices from their public pricing pages, per month."
        className="py-24 bg-surface border-y border-line"
        width="max-w-5xl"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] table-fixed">
            <colgroup>
              <col className="w-[40%]" />
              <col className="w-[20%]" />
              <col className="w-[20%]" />
              <col className="w-[20%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-line">
                <th className="py-3 pr-4 text-left font-medium text-ink3">Feature</th>
                <th className="py-3 px-4 text-center font-medium text-ink">OpenShorts</th>
                <th className="py-3 px-4 text-center font-medium text-ink3">Opus Clip</th>
                <th className="py-3 px-4 text-center font-medium text-ink3">Kapwing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-ink2">
              <tr><td className="py-3 pr-4">Price</td><td className="py-3 px-4 text-center text-ink">$0</td><td className="py-3 px-4 text-center">{quiet('$15–228/mo')}</td><td className="py-3 px-4 text-center">{quiet('$24–79/mo')}</td></tr>
              <tr><td className="py-3 pr-4">Moment detection</td><td className="py-3 px-4 text-center">{check}</td><td className="py-3 px-4 text-center">{check}</td><td className="py-3 px-4 text-center">{check}</td></tr>
              <tr><td className="py-3 pr-4">Vertical crop</td><td className="py-3 px-4 text-center">{check}</td><td className="py-3 px-4 text-center">{check}</td><td className="py-3 px-4 text-center">{check}</td></tr>
              <tr><td className="py-3 pr-4">Subtitles</td><td className="py-3 px-4 text-center">{check}</td><td className="py-3 px-4 text-center">{check}</td><td className="py-3 px-4 text-center">{check}</td></tr>
              <tr><td className="py-3 pr-4">Dubbing, 30+ languages</td><td className="py-3 px-4 text-center">{check}</td><td className="py-3 px-4 text-center">{quiet('Limited')}</td><td className="py-3 px-4 text-center">{quiet('No')}</td></tr>
              <tr><td className="py-3 pr-4">Video effects</td><td className="py-3 px-4 text-center">{check}</td><td className="py-3 px-4 text-center">{quiet('No')}</td><td className="py-3 px-4 text-center">{check}</td></tr>
              <tr><td className="py-3 pr-4">Hook text</td><td className="py-3 px-4 text-center">{check}</td><td className="py-3 px-4 text-center">{check}</td><td className="py-3 px-4 text-center">{check}</td></tr>
              <tr><td className="py-3 pr-4">Self-hosted</td><td className="py-3 px-4 text-center">{check}</td><td className="py-3 px-4 text-center">{quiet('No')}</td><td className="py-3 px-4 text-center">{quiet('No')}</td></tr>
              <tr><td className="py-3 pr-4">Watermark</td><td className="py-3 px-4 text-center text-ink">None</td><td className="py-3 px-4 text-center">{quiet('Free tier')}</td><td className="py-3 px-4 text-center">{quiet('Paid')}</td></tr>
              <tr><td className="py-3 pr-4">Open source</td><td className="py-3 px-4 text-center">{check}</td><td className="py-3 px-4 text-center">{quiet('No')}</td><td className="py-3 px-4 text-center">{quiet('No')}</td></tr>
              <tr><td className="py-3 pr-4">Thumbnail generator</td><td className="py-3 px-4 text-center">{check}</td><td className="py-3 px-4 text-center">{quiet('No')}</td><td className="py-3 px-4 text-center">{quiet('Paid')}</td></tr>
              <tr><td className="py-3 pr-4">Title and description generator</td><td className="py-3 px-4 text-center">{check}</td><td className="py-3 px-4 text-center">{quiet('Limited')}</td><td className="py-3 px-4 text-center">{quiet('Paid')}</td></tr>
              <tr><td className="py-3 pr-4">UGC video generator</td><td className="py-3 px-4 text-center">{check}</td><td className="py-3 px-4 text-center">{quiet('No')}</td><td className="py-3 px-4 text-center">{quiet('No')}</td></tr>
              <tr><td className="py-3 pr-4">Usage limits</td><td className="py-3 px-4 text-center text-ink">None</td><td className="py-3 px-4 text-center">{quiet('Per plan')}</td><td className="py-3 px-4 text-center">{quiet('Per plan')}</td></tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        label="Who it is for"
        title="People who publish several clips a week"
        className="py-24"
        width="max-w-5xl"
      >
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { title: "YouTubers", icon: Youtube, description: "Repurpose long uploads into Shorts without opening an editor. Pick the clips the model scored highest, fix a title, publish." },
            { title: "Social managers", icon: Instagram, description: "Process several client videos in a batch, keep a tone per brand, and publish to TikTok, Reels and Shorts from one place." },
            { title: "Podcasters and educators", icon: FileVideo, description: "Pull the strongest minutes out of an episode. The transcript and the subtitle styling carry over to the clip." },
            { title: "Small businesses", icon: Clapperboard, description: "Generate a UGC-style ad for a product from a URL: script, actor, voiceover, subtitles. No camera and no crew." },
          ].map((useCase) => (
            <div key={useCase.title} className="panel p-6">
              <useCase.icon size={16} className="text-ink3 mb-3" />
              <h3 className="text-[15px] font-medium mb-2">{useCase.title}</h3>
              <p className="text-[13px] text-ink2 leading-relaxed">{useCase.description}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        id="faq"
        label="FAQ"
        title="Questions, answered plainly"
        className="py-24 bg-surface border-y border-line"
        width="max-w-3xl"
      >
        <div className="border-t border-line">
          {faqs.map((faq, i) => (
            <div key={faq.question} className="border-b border-line">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between gap-6 py-4 text-left"
              >
                <span className="text-sm text-ink">{faq.question}</span>
                <ChevronDown
                  size={16}
                  className={`text-ink3 shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}
                />
              </button>
              {openFaq === i && (
                <p className="pb-5 pr-8 text-[13px] text-ink2 leading-relaxed">{faq.answer}</p>
              )}
            </div>
          ))}
        </div>
      </Section>

      <section className="px-6 py-24">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-medium tracking-[-0.01em]">Start with a video you already have</h2>
          <p className="mt-3 text-ink2 max-w-xl leading-relaxed">
            Docker Compose, a Gemini key for the packaging features, and a long video. No account and no
            credit card.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button onClick={onLaunchApp} className="btn-primary">
              Open the dashboard
              <ArrowRight size={16} />
            </button>
            <a
              href="https://github.com/mutonby/openshorts"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-quiet"
            >
              <Github size={16} />
              Star on GitHub
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-line px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <img src="/logo-openshorts.png" alt="OpenShorts" className="w-6 h-6" />
            <span className="text-[13px] text-ink2">OpenShorts, self-hosted clip generator</span>
          </div>
          <div className="flex items-center gap-8 text-[13px] text-ink3">
            <a href="https://github.com/mutonby/openshorts" target="_blank" rel="noopener noreferrer" className="hover:text-ink transition-colors">GitHub</a>
            <a href="#features" className="hover:text-ink transition-colors">Features</a>
            <a href="#faq" className="hover:text-ink transition-colors">FAQ</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
