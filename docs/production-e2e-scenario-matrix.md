# Production E2E Scenario Matrix

Milestone 16B covers nine dry-run/static production workflow scenarios:

| Scenario | Primary stages | Expected proof |
| --- | --- | --- |
| talking-head-clean-edit | media, speech/caption, smart cut, audio, color, final render | captions, timeline, audio/color QA, render/export QA |
| podcast-repeated-takes | media, speech/caption, smart cut, audio, final render | repeated-take safety, no mid-word cuts, transcript/cut QA |
| screen-recording-caption-safe | media, speech/caption, final render | caption safe-zone warnings without false OCR claims |
| text-behind-subject | media, mask/background, final render | weak-mask downgrade/blocking and render asset QA |
| low-quality-enhancement | media, enhancement, final render | sample-first enhancement and enhancement QA |
| mixed-color-multiclip | media, color, timeline, final render | shot-match planning and color QA |
| audio-noise-music-overlap | media, speech/caption, audio, final render | voice-first music ducking and audio QA |
| final-render-export | media, speech/caption, timeline, audio/color/enhancement, final render | render command plans and final-delivery blocking |
| production-blocked-readiness | readiness, final render | production-ready blocked by readiness/model/manual blockers |

Each scenario declares required artifacts, QA gates, allowed local-dev tools, expected blockers, expected warnings, and fixture policy. Production-ready is false by default.
