# RP-DB-12 Backend API Skeleton

RP-DB-12 adds a mock-only backend/service skeleton for ReeditPro. It connects the frontend TypeScript domain model to the Supabase migration architecture at the code-structure level without connecting to Supabase, AI providers, Stripe, Google Cloud, storage, uploads, or render workers.

## What Was Added

- `src/backend/contracts/` defines future API request and response shapes.
- `src/backend/services/` owns mock domain behavior for chat, projects, media, intent planning, edit plans, edit quality, Stroke Motion, credits, jobs, generation, render/preview, revisions, and QA.
- `src/backend/orchestrators/` demonstrates the chat-native planning flow and the approved mock generation flow.
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
