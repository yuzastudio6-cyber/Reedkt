# RP-DB-12 Backend API Skeleton

RP-DB-12 adds a mock-only backend/service skeleton for ReeditPro. It connects the frontend TypeScript domain model to the Supabase migration architecture at the code-structure level without connecting to Supabase, AI providers, Stripe, Google Cloud, storage, uploads, or render workers.

## What Was Added

- `src/backend/contracts/` defines future API request and response shapes.
- `src/backend/services/` owns mock domain behavior for chat, projects, media, intent planning, edit plans, edit quality, Stroke Motion, SoundSync SFX planning, credits, jobs, generation, render/preview, revisions, and QA.
- `src/backend/orchestrators/` demonstrates the chat-native planning flow, SoundSync SFX planning flow, and the approved mock generation flow.
- `src/backend/mock/` provides deterministic local sample data and an in-memory record store.
- `src/backend/supabase/` contains placeholders only. No Supabase package is installed and no client is configured.

## Chat-Native Flow

The mock planning orchestrator follows the product flow:

chat message -> source clips in chat -> intent analysis -> source sequence map -> recommended edit structure -> edit plan -> edit quality plan -> optional Stroke Motion plan -> credit estimate -> awaiting user approval.

The approved mock orchestrator then simulates:

edit plan approval -> credit estimate approval -> credit reservation -> job batch -> generation request placeholder -> generated asset placeholder -> render job placeholder -> preview render placeholder -> QA report -> preview-ready chat card.

## Approval And Credits

Generation and rendering services refuse to continue unless the edit plan is approved and credits are reserved. This mirrors the database gate without implementing real backend enforcement yet.

Subscription access and Reedit Credits stay separate: subscription is software access, and credits pay for AI generation, rendering, and editing usage.

## Stroke Motion

The mock Stroke Motion service supports both `spoken_story_mode` and `source_reading_mode`. Source reading mode creates meaning expansion before animation planning. The Joseph/Mary example is sample data only; Stroke Motion is not hard-coded to Bible content.

## SoundSync SFX Director

The mock SFX Director plans edit-layer sound effects before generation. It decides needed, optional, not-needed, avoid, and needs-user-confirmation states; classifies target layers; recommends timing anchors and volume profiles; creates provider routes for internal library, MMAudio V, Mirelo SFX V1.5, or no SFX; builds mock provider-specific prompt plans; creates mock duration, waveform, trim, hit-alignment, frame-placement, and timing-validation metadata; plans mock volume, ducking, EQ, room/reverb match, and mix validation; runs mock QA/regeneration decisions before preview/export; models generated SFX library growth through search, project-only storage, provenance review, reuse policy, candidates, usage records, and learning metadata; and now includes an approval/credit-gated mock SFX worker skeleton for future generation jobs.

The mock StoryTiming planner consolidates existing distributed timing records into a Master Timing Map. It exposes mock/local service and orchestrator contracts for segments, anchors, events, dependencies, conflicts, QA checks, render timing manifest placeholders, and chat-ready summaries. It does not add routes, execute rendering, connect to Supabase, or replace the source timing records.

RP-TIMING-05 extends the StoryTiming mock layer with caption/cut timing contracts and orchestrator flows for transcript anchors, caption timing plans, cut timing plans, pause preservation, J-cut/L-cut hints, focused conflicts, and caption/cut QA. These remain backend contracts/services only, not HTTP routes.

The SFX worker skeleton returns local worker events and mock provider responses with `mock://` paths. This remains mock-only. It does not call providers, read secrets, generate audio, process audio files, mix audio, render media, upload files, promote library assets, spend credits, or connect to Supabase.

RP-SFX-12 adds a mock-first SFX provider adapter layer behind the worker boundary. The adapter exposes request building, response parsing, safety gates, mock Mirelo/MMAudio/internal-library clients, disabled real-client placeholders, and integration scenarios. It remains local/demo-safe and does not create HTTP routes or real provider calls.

## StoryTiming SoundSync Timing

RP-TIMING-06 adds backend contract and mock service shapes for music/SFX timing inside StoryTiming. The mock flow can create music cue events, mock beat grids, ducking timing plans, SFX start/hit/end events, SoundSync dependencies, focused conflicts, and music/SFX QA summaries. These remain local service contracts and orchestrator flows only; no HTTP routes, Supabase calls, audio processing, provider calls, or rendering are added.

## Supabase Later

Future implementation should replace the placeholders in `src/backend/supabase/` with a real Supabase client for the `reeditpro` project. Service role access must stay in a secure backend or Google Cloud runtime and must never be bundled into the Vite frontend.

## Google Cloud Later

Future workers can connect through job, generation, render, and QA records. Expected integration points include Cloud Run APIs, Cloud Run Jobs, GPU workers, Pub/Sub events, Cloud Storage, Secret Manager, Artifact Registry, generation workers, and render workers.

## Mock-Only Limits

The skeleton does not create HTTP routes, upload files, call AI APIs, call Stripe, deploy Google Cloud resources, run FFmpeg or Remotion, or write to Supabase. It is intended to prove the code structure and the approval-gated flow before real backend implementation.

## Next Steps

1. Add real backend runtime boundaries for service-role Supabase calls.
2. Generate typed Supabase database contracts from the applied migrations.
3. Add HTTP/Cloud Run endpoints around these contracts.
4. Add worker queues and idempotent job execution.
5. Add real provider and render integrations after the approval and credit gates are enforced.
