# Job Orchestration Architecture

## Purpose

This document defines the future ReeditPro job and multi-agent orchestration model. It is documentation only. It does not build workers, create Cloud Run services, deploy Google Cloud resources, call providers, or create migrations.

## Core Principle

ReeditPro should use a central orchestrator. Random agents must not independently mutate plans, spend credits, call providers, render video, or publish.

The orchestrator controls:

- Dependencies.
- Status.
- Retry behavior.
- Approval gates.
- Credit reservations.
- Worker assignment.
- Audit logs.

RP-FIX-09 adds a mock-safe credit gate service that job orchestration can call before generation, render, provider, music, SFX, or worker jobs move from waiting/queued metadata into executable work. Real job queueing and ledger mutation remain backend-only.

RP-FIX-10 adds a mock-safe job runtime layer for queue items, dependency chains, worker dispatch placeholders, job events, retry plans, and chat summaries. It does not deploy a queue or worker runtime. Real Cloud Run, provider, render, and service-role job mutation remain backend-required.

## Required Tables

### `jobs`

Canonical background work item.

Fields:

- `id`
- `project_id`
- `edit_plan_id`
- `chat_session_id`
- `worker_type`
- `job_type`
- `status`: `queued`, `running`, `waiting_dependency`, `waiting_user_approval`, `completed`, `failed`, `cancelled`, `retrying`
- `priority`
- `input_payload_json`
- `output_payload_json`
- `retry_count`
- `max_attempts`
- `idempotency_key`
- `credit_reservation_id`
- `created_at`
- `started_at`
- `completed_at`

### `job_dependencies`

Dependency graph between jobs.

Fields:

- `id`
- `job_id`
- `depends_on_job_id`
- `dependency_type`
- `required_status`
- `status`
- `created_at`

### `job_events`

Append-only job progress and audit events.

Fields:

- `id`
- `job_id`
- `event_type`
- `event_message`
- `event_payload_json`
- `visible_to_user`
- `created_at`

### `agent_runs`

One run of a controlled agent.

Fields:

- `id`
- `job_id`
- `agent_type`
- `input_record_table`
- `input_record_id`
- `status`
- `model_or_worker_ref`
- `started_at`
- `completed_at`
- `error_summary`

### `agent_outputs`

Structured result from an agent run.

Fields:

- `id`
- `agent_run_id`
- `output_record_table`
- `output_record_id`
- `output_type`
- `summary`
- `validation_status`
- `created_at`

### `event_log`

System-wide audit log for important actions.

Fields:

- `id`
- `workspace_id`
- `project_id`
- `actor_type`
- `actor_id`
- `event_type`
- `target_table`
- `target_id`
- `summary`
- `metadata_json`
- `created_at`

## Controlled Agents And Workers

Each agent must have input records, output records, status, dependencies, retry behavior, and audit/event logging.

### 1. Chat Intent Agent
- Input: `chat_messages`, `chat_attachments`.
- Output: `intent_analyses`, missing questions.
- Dependency: active chat session.

### 2. Media Analysis Agent
- Input: `media_assets`, `source_clip_sequences`.
- Output: `transcripts`, `visual_observations`, `audio_observations`.
- Dependency: uploaded/sent media available.

### 3. Source Sequence Agent
- Input: `source_clip_sequences`.
- Output: source map in `intent_analyses` or `edit_plan_segments`.
- Dependency: media records linked to project.

### 4. Edit Quality Agent
- Input: intent, transcript, audio/visual observations.
- Output: `edit_quality_profiles`, `pacing_analysis`, `cut_decisions`, `edit_quality_checks`.
- Dependency: media analysis complete.

### 5. Pacing Agent
- Input: transcript and pacing analysis.
- Output: pacing recommendations and cut timing.

### 6. Transition Agent
- Input: edit quality profile, scene boundaries, music plan.
- Output: `transition_plans`.

### 7. Audio Environment Agent
- Input: audio observations.
- Output: `audio_environment_analysis`, `ambient_sound_plans`.

### 8. Music Supervisor Agent
- Input: intent, mood, platform, edit level.
- Output: `music_plans`.

### 9. SFX Agent
- Input: transitions and signature plans.
- Output: `sound_effect_plans`.

### 10. Signature Investigation Agent
- Input: edit plan segments and user instructions.
- Output: `signature_routes`.
- Rule: video type is context only and must not force a system.

### 11. Stroke Motion Story Agent
- Input: transcript/source text, intent, segment plan.
- Output: `stroke_motion_plans` and `stroke_motion_beats`.
- Rule: `source_reading_mode` requires `meaning_expansion`.

### 12. Credit Estimation Agent
- Input: edit plan, signatures, render plan.
- Output: `credit_estimates`.
- Dependency: plan ready.

### 13. Generation Orchestrator
- Input: approved edit plan and approved estimate.
- Output: generation jobs.
- Gate: no jobs run before plan and credit approval.

### 14. Stroke Motion Generation Worker
- Input: approved `stroke_motion_generation_specs`.
- Output: generated overlay assets.

### 15. Graphic Design Worker
- Input: approved `graphic_design_plans`.
- Output: graphic overlay assets.

### 16. Real Motion Worker
- Input: approved `real_motion_plans`.
- Output: generated realistic overlay assets.

### 17. SoundSync Worker
- Input: approved `soundsync_plans`, music plans, SFX plans.
- Output: audio mix assets.

### 18. Render Worker
- Input: assembled edit manifest and generated assets.
- Output: `renders`, preview media.

### 19. Quality Check Agent
- Input: rendered preview and plan.
- Output: `qa_reports`, `edit_quality_checks`.

## Dependency Graph

```text
transcription_job
-> media_analysis_job
-> source_sequence_job
-> intent_analysis_job
-> edit_quality_job
-> signature_investigation_job
-> stroke_motion_plan_job
-> credit_estimate_job
-> waiting_user_approval
-> generation_job
-> render_preview_job
-> quality_check_job
-> preview_ready
```

## Google Cloud Integration Points

Future Google Cloud services should be connected by IDs, not raw prompts:

- Cloud Run API services receive authenticated requests.
- Pub/Sub or Cloud Tasks can enqueue job IDs.
- Cloud Run Jobs or GPU workers load job context from Supabase.
- Secret Manager stores provider keys.
- Cloud Storage stores source media, generated overlays, previews, and renders.
- Artifact Registry stores worker containers.

Workers must:

- Load trusted context from Supabase `reeditpro`.
- Check approval and credit reservation before expensive work.
- Read secrets from Secret Manager.
- Write job status, generated assets, and events back to Supabase.
- Avoid logging secrets, signed URLs, or provider keys.

## Retry And Idempotency

Every job should include:

- `idempotency_key`
- `retry_count`
- `max_attempts`
- retryable/non-retryable error classification
- dependency checks
- safe cancellation behavior

Failed jobs should create targeted repair instructions where possible instead of restarting the whole edit.

## RP-FIX-11 Runtime Transport And Leases

RP-FIX-11 adds the first mock runtime transport and worker lease skeleton:

- runtime envelopes for API, worker, provider, render, storage, credit, and custom targets;
- mock transport acknowledgement with backend HTTP, Supabase Edge, Cloud Run, Cloud Run Job, and Pub/Sub placeholders;
- mock lease claim, heartbeat, renew, release, complete, fail, cancel, and stale recovery;
- idempotency helpers for job dispatch, provider requests, render jobs, and credit spend;
- worker runtime registry metadata.

The layer is mock-only. Production still needs backend service-role handlers, transactional lease claims, durable idempotency storage, Cloud Run/PubSub deployment, and worker-side provider/render execution.
