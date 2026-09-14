# Film-led entry and dark studio

## Capture notes

Browser screenshots from the actual Vite/React build. The studio capture is an idle workspace, not a completed video-generation job. The coastal image is a generated illustrative film still, not real customer footage.

Web captures use Chromium at 1440 × 1080 (desktop) and 390 × 1080 (mobile), with reduced motion enabled. Screenshots are real rendered interfaces, not image-generated UI mockups. Raster renderer examples retain their native dimensions.

## Verification — 2026-09-14

`cd dashboard && npm run build` passed. Offline Chromium checks cover studio entry and page widths 360, 390, 768, 1024, and 1440px. No live YouTube, Ollama, transcription, publishing, or paid-provider integration was run.

Only the existing visual surfaces were changed. The screenshots are not evidence of end-to-end service availability, accessibility certification, or production performance.

## Original illustration

Asset: [`dashboard/public/coastal-film.png`](../../dashboard/public/coastal-film.png). Generated specifically for this redesign with OpenAI image generation on 2026-09-14. It is the only generated bitmap in the new interface; the README screenshots capture the implemented site.

Prompt:

> Use case: photorealistic-natural. Asset type: original sample film still for the OpenShorts video-editing studio hero. A cinematic aerial view of a rugged Atlantic sea arch and coastline, small rolling waves breaking against dark volcanic rock, low sun catching fine ocean spray, muted sea-green water and warm limestone highlights. Photorealistic 35mm travel-film texture with fine natural grain and beautiful restrained contrast. Wide horizontal composition, the sea arch is near the center so both landscape and vertical center crops are useful. No people, no text, no typography, no frame, no interface, no logos, no watermark. This is an illustrative sample still, not a screenshot.
