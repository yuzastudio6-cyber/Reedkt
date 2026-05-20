# Render Timing Manifest + Worker Readiness

RP-TIMING-10 adds the mock render timing manifest and worker-readiness layer for StoryTiming.

This is not a render engine. It does not run Remotion, FFmpeg, Google Cloud, storage uploads, provider APIs, media processing, or real workers. It creates worker-readable timing metadata so future render/compositing workers can consume approved StoryTiming records safely.

## What The Manifest Does

The render timing manifest converts StoryTiming records into one handoff package:

- what appears
- when it starts
- when it hits
- when it ends
- which track/layer owns it
- which source record created it
- which assets it requires
- which timing dependencies must be preserved
- which conflicts or QA checks block worker readiness
- which worker notes future render systems must follow

The manifest does not replace the edit plan, captions, music cues, SFX plans, Stroke Motion, Graphic Design, Real Motion, or QA records. It references and packages them.

## Track Building

Render tracks are grouped into:

- video: source video, output video, cuts, transitions
- audio: music and SFX timing tracks
- overlays: Real Motion, Graphic Design, Stroke Motion, CTA
- captions: captions and caption emphasis timing
- markers: story beats, QA markers, render markers, manual markers

Tracks are sorted with deterministic layer rules so captions stay readable and QA/render markers remain mock-only metadata.

## Event Payloads

StoryTiming events become manifest events with:

- event ID and event type
- track type
- start, hit, and end timing
- source system and source record ID
- asset requirement
- worker notes
- mock-only metadata

Payloads remain mock-safe and never include secrets or real provider URLs.

## Dependency Map

Timing dependencies are converted into render-readable relationships:

- SFX hit syncs to a cut or reveal
- music ducking protects speech
- captions must not overlap overlays
- Graphic Design starts after a concept phrase
- Stroke Motion completes on phrase meaning
- generated overlays must wait for future asset availability

Required dependencies are marked as rules future workers should reject if violated.

## Layer Ordering

Default visual order:

```text
source video
cuts/transitions
Real Motion
Graphic Design
Stroke Motion
captions
CTA
markers
```

Default audio order:

```text
dialogue/source audio
ambience
music
SFX
```

This is metadata only. No compositing happens in this milestone.

## Worker Input

The worker input record includes:

- manifest ID
- master timing map ID
- project and edit plan IDs
- readiness decision
- required asset types
- track and event counts
- blocking conflict IDs
- worker payload
- worker notes
- `mockOnly: true`

The optional mock worker skeleton only validates readiness and returns a placeholder output.

## Readiness

Worker readiness can be:

- `ready_for_mock_worker`
- `ready_for_future_render_worker`
- `blocked_by_timing_conflicts`
- `blocked_by_missing_assets`
- `blocked_by_missing_tracks`
- `requires_user_review`
- `not_ready`

Missing generated assets may still allow mock worker readiness when mock placeholders are explicit. Missing source media, blocking conflicts, failed Timing QA, invalid event ranges, missing required tracks, layer-order issues, or required user review block real render readiness.

## Mock Scenarios

The mock scenarios cover:

- ready manifest
- blocked timing conflicts
- warning/missing generated assets
- missing source media
- missing captions track
- no music/SFX needed
- invalid timing event range
- layer order conflict
- Lake Como lifestyle manifest
- faith/serious manifest
- signature-heavy manifest
- Real Motion face safety markers
- QA markers
- incomplete worker notes
- user review before render

## Mock-Only Boundary

RP-TIMING-10 stops at worker-ready metadata and validation. It does not create UI, render video, execute workers, upload files, use cloud storage, call providers, run migrations, or connect to Supabase.

Future real rendering will need approved plan snapshots, credit reservation, real source/generated asset IDs, private storage, render worker execution, render QA, preview review, and export approval.
