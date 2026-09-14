import React from "react";
import {
  ArrowUpRight,
  Scissors,
  Subtitles,
  ScanLine,
  AudioLines,
  Image,
  Upload,
} from "lucide-react";

const tools = [
  [
    Scissors,
    "Find the moment",
    "Turn a long recording into a shortlist of clips using transcript and scene analysis.",
  ],
  [
    ScanLine,
    "Reframe the story",
    "Track a speaker or preserve the full scene with a blurred vertical background.",
  ],
  [
    Subtitles,
    "Make every word count",
    "Generate captions, style a hook, and fine-tune your cut before exporting.",
  ],
  [
    AudioLines,
    "Give it another voice",
    "Optional ElevenLabs dubbing brings your clips to other languages.",
  ],
  [
    Image,
    "Build the cover",
    "Create thumbnails, explore titles, and prepare the video for publishing.",
  ],
  [
    Upload,
    "Take it to your audience",
    "Download your finished cuts or connect an optional social publishing account.",
  ],
];

export default function Landing({ onLaunchApp }) {
  return (
    <div className="shorts-site">
      <a href="#content" className="shorts-skip">
        Skip to content
      </a>
      <nav className="shorts-nav" aria-label="Primary navigation">
        <a href="#" className="shorts-wordmark" aria-label="OpenShorts home">
          <Scissors aria-hidden="true" size={23} /> OpenShorts
          <span>STUDIO</span>
        </a>
        <div className="shorts-nav-links">
          <a href="#workflow">Workflow</a>
          <a href="#toolkit">The toolkit</a>
          <a href="#questions">Good to know</a>
        </div>
        <button onClick={onLaunchApp} className="shorts-cta">
          Open studio <ArrowUpRight size={17} aria-hidden="true" />
        </button>
      </nav>
      <main id="content">
        <section className="shorts-hero">
          <div className="shorts-hero-copy">
            <p className="shorts-kicker">
              <span /> An open-source editing studio
            </p>
            <h1>
              Long story.
              <br />
              <em>Short form.</em>
            </h1>
            <p className="shorts-lede">
              The moments are already in your footage. Find them, frame them,
              and make them worth watching.
            </p>
            <button
              onClick={onLaunchApp}
              className="shorts-cta shorts-cta-large"
            >
              Make your first cut <ArrowUpRight size={21} aria-hidden="true" />
            </button>
            <p className="shorts-fine">
              YouTube link or local video · Built for 9:16
            </p>
          </div>
          <figure className="shorts-film">
            <img
              src="/coastal-film.png"
              alt="Golden evening light on an Atlantic sea arch, an illustrative film still"
              fetchPriority="high"
              width="1672"
              height="941"
            />
            <div className="shorts-film-top" aria-hidden="true">
              <span>THE ATLANTIC CUT</span>
              <span>16:9 → 9:16</span>
            </div>
            <div className="shorts-crop" aria-hidden="true">
              <span>FRAME THE MOMENT</span>
              <b>
                Some stories
                <br />
                need less.
              </b>
            </div>
            <figcaption>
              Illustrative still <span>01 / THE SOURCE MATERIAL</span>
            </figcaption>
          </figure>
        </section>
        <section
          className="shorts-workflow"
          id="workflow"
          aria-labelledby="workflow-title"
        >
          <div>
            <p className="shorts-kicker">From source to short</p>
            <h2 id="workflow-title">Keep the good part.</h2>
          </div>
          <ol>
            <li>
              <span>01</span>
              <div>
                <h3>Bring your footage</h3>
                <p>Paste a link or upload a video.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>Shape your cut</h3>
                <p>Review moments, framing, and captions.</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>Make it yours</h3>
                <p>Add the finishing touches. Export.</p>
              </div>
            </li>
          </ol>
        </section>
        <section
          className="shorts-toolkit"
          id="toolkit"
          aria-labelledby="toolkit-title"
        >
          <div className="shorts-section-heading">
            <p className="shorts-kicker">One creative workspace</p>
            <h2 id="toolkit-title">
              A small studio.
              <br />A complete toolkit.
            </h2>
            <p>
              Clips, covers, captions, and optional AI actor videos—without
              moving between editing apps.
            </p>
          </div>
          <div className="shorts-tools">
            {tools.map(([Icon, title, description]) => (
              <article key={title}>
                <Icon size={22} aria-hidden="true" />
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>
        <section
          className="shorts-questions"
          id="questions"
          aria-labelledby="questions-title"
        >
          <div>
            <p className="shorts-kicker">Good to know</p>
            <h2 id="questions-title">
              Your studio.
              <br />
              Your setup.
            </h2>
            <a href="https://github.com/jasperan/openshorts#readme">
              Read the setup guide ↗
            </a>
          </div>
          <div>
            <article>
              <h3>What runs locally?</h3>
              <p>
                The core clipping workflow uses Ollama, transcription, scene
                detection, and FFmpeg on your machine. You supply the video and
                choose the final cuts.
              </p>
            </article>
            <article>
              <h3>Do I need paid services?</h3>
              <p>
                The project is open source. Optional dubbing, AI actor
                generation, cloud backup, and social publishing use external
                providers and may have their own costs and data policies.
              </p>
            </article>
            <article>
              <h3>Can I generate a video from scratch?</h3>
              <p>
                The AI Shorts workspace can turn a product brief into an
                actor-led video. Configure the required providers in Settings
                before starting.
              </p>
            </article>
          </div>
        </section>
      </main>
      <footer className="shorts-footer">
        <span>OpenShorts / Made for the cut.</span>
        <a href="https://github.com/jasperan/openshorts">Source on GitHub ↗</a>
        <button onClick={onLaunchApp}>Open the studio ↗</button>
      </footer>
    </div>
  );
}
