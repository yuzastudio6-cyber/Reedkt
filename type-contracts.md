# Type Contracts

## Purpose

RP-DB-02 adds TypeScript contracts for the future ReeditPro backend/database model. These contracts are not migrations and do not connect to Supabase, AI providers, Stripe, uploads, rendering, or Google Cloud. They are implementation-ready shapes that future Codex tasks can use to create Supabase tables, API payloads, worker messages, and typed service boundaries.

Future database work must use the Supabase project named `reeditpro`. Do not use the Yuza Studio Supabase project.

## Contract Layout

The contracts live under `src/types/`:

- `shared.ts`: IDs, timestamps, JSON, time ranges, statuses, approval states, credit impact, priorities, and common record helpers.
- `accounts.ts`: users, workspaces, members, subscriptions, and Personal/Business plans.
- `credits.ts`: credit wallets, ledger entries, estimates, reservations, refunds, and credit source types.
- `projects-chat.ts`: chat-native projects, chat sessions, messages, attachments, inline cards, and chat actions.
- `media.ts`: media assets, source clip sequences, transcripts, scene boundaries, visual/audio observations, references, and Reference DNA.
- `planning.ts`: intent analysis, edit plans, edit plan segments, edit instructions, signature routes, and story beat maps.
- `edit-quality.ts`: Professional Edit Quality Engine records for pacing, cuts, transitions, audio, ambience, music, SFX, captions, and QA checks.
- `signature-systems.ts`: Stroke Motion, Graphic Design / VisualExplain, Real Motion, SoundSync, and future signature support records.
- `stroke-motion.ts`: Stroke Motion plans, beats, characters, symbols, transitions, timing anchors, generation specs, and meaning expansion examples.
- `storytiming.ts`: StoryTiming master timing maps, segments, anchors, events, dependencies, conflicts, QA checks, and render timing manifests.
- `jobs.ts`: jobs, dependencies, events, agent runs, agent outputs, and audit events.
- `generation.ts`: future provider abstraction for Wan, Veo, Kling, Remotion, SVG, Lottie, Google Cloud workers, custom providers, and generated assets.
- `sfx-director.ts`: SoundSync SFX Director contracts for event planning, provider routing, prompts, trim/hit alignment, mix/ducking, QA, usage, and generated SFX library growth.
- `review-render-export.ts`: preview renders, final renders, exports, preview reviews, comments, revisions, approvals, and QA reports.
- `google-cloud.ts`: reference-only contracts for Cloud Run, Cloud Run Jobs, GPU workers, Cloud Storage, Pub/Sub, Secret Manager, Artifact Registry, and worker runtime configuration.
- `index.ts`: the future backend-oriented public type entrypoint.

The existing frontend compatibility file, `src/types/reeditpro.ts`, remains available for current mock UI imports.

## Chat-Native Editing

ReeditPro editing is chat-native: the chat is the editor. Users send clips, references, instructions, approvals, revision requests, and export requests through chat. UI appears as inline cards only when ReeditPro needs user input, confirmation, approval, progress, or preview.

The contracts support:

- `chat_sessions`, `chat_messages`, and `chat_attachments`.
- Inline cards for source sequence, workflow choices, AI questions, Reference DNA, edit plans, credit estimates, approval requests, editing progress, preview-ready states, revision requests, and export-ready states.
- Source clip order as a separate `source_clip_sequences` concept. Uploaded order means source sequence, not automatically final edit order.
- Edit plans and credit estimates linked back to chat messages so approval can happen inside the conversation.
- Revision requests linked to chat messages and affected segments.

## Approval Before Generation

ReeditPro must never start expensive AI editing, animation generation, rendering, or credit spending until:

1. AI understands the user goal.
2. AI creates an edit plan.
3. AI creates a credit estimate.
4. The user approves the plan and credits.

The contracts reflect this with:

- `EditPlanRecord.approvalRequiredBeforeGeneration`.
- `CreditEstimateRecord.approvalRequiredBeforeGeneration`.
- `ApprovalRecord` for plan, credit, generation, revision, and export approvals.
- `CreditReservationRecord` for reserve/spend/refund lifecycle.
- Job statuses such as `waiting_user_approval` before generation or render work.

## Edit Levels And Professional Quality

The backend edit complexity levels are:

- `basic_edit`
- `pro_edit`
- `signature_edit`
- `premium_signature_edit`

Every ReeditPro edit, including Basic, must meet a professional editing standard. Basic means lower-compute clean editing, not low-quality editing. Edit level controls complexity and cost, not quality.

The Professional Edit Quality Engine types model:

- Quality profiles and standards.
- Pacing analysis.
- Cut decisions.
- Transition plans.
- Audio environment analysis.
- Ambient sound plans.
- Music plans.
- Sound effect plans.
- Caption plans.
- Edit quality checks.

Basic edits can still include clean cuts, dead-space removal, obvious mistake removal, meaningful pause preservation, basic captions, voice cleanup, room tone preservation, audio leveling, and professional preview QA. Higher levels add more planning depth, signature generation, SoundSync complexity, and credit cost.

## Signature Systems

The visual signature systems are:

- Stroke Motion
- Graphic Design / VisualExplain
- Real Motion

SoundSync is the audio/timing support engine, not the third visual signature system.

The contracts preserve the rule that the video type dropdown gives workflow context only. It does not automatically choose signature systems. All video types can use Stroke Motion, Graphic Design / VisualExplain, Real Motion, SoundSync, or none. The AI planner routes systems per segment based on user intent, footage, transcript, reference DNA, platform, edit level, credit budget, and whether the visual improves the video.

## Stroke Motion

Stroke Motion is modeled as a fast transparent 2D animated story layer that turns spoken meaning, source text, or scripture/book/document reading into visual story beats timed to the speaker words.

The Stroke Motion contracts support:

- `spoken_story_mode`
- `source_reading_mode`
- `meaning_expansion`
- story summaries
- source references and excerpts
- connected transition chains
- timing anchors
- characters
- symbols
- beats
- generation specs
- worker notes
- must-follow rules
- avoid rules
- approval and credit estimate links

In `source_reading_mode`, AI must understand the meaning behind the source text before planning animation. The mock records include the Joseph and Mary example from Matthew 1:18-25 as an example only; Stroke Motion applies to all stories, not only Bible content.

## Credits And Approvals

The credit contracts model subscription access separately from AI usage.

- Subscription = software access.
- Edit Credits = AI generation, rendering, and editing usage.
- Personal is `$10/week` software access with 100 weekly bonus Reedit Credits.
- Business is `$20/week` software access with stronger brand/team/client workflows.
- ReeditPro does not imply unlimited AI editing.

Credit flow:

1. Estimate credits.
2. User approves.
3. Reserve credits.
4. Generation starts.
5. On success, reserved credits become spent.
6. If ReeditPro fails, reserved or spent credits are refunded.

This is represented by `credit_wallets`, `credit_ledger_entries`, `credit_estimates`, `credit_reservations`, and refund records.

## Jobs, Agents, And Workers

The orchestration contracts use a central job model with controlled agents and workers. Jobs support dependency graphs, idempotency keys, retries, priorities, input/output payload summaries, audit events, and status transitions.

Supported agents/workers include:

- Chat Intent Agent
- Media Analysis Agent
- Source Sequence Agent
- Edit Quality Agent
- Pacing Agent
- Transition Agent
- Audio Environment Agent
- Music Supervisor Agent
- SFX Agent
- Signature Investigation Agent
- Stroke Motion Story Agent
- Credit Estimation Agent
- Generation Orchestrator
- Stroke Motion Generation Worker
- Graphic Design Worker
- Real Motion Worker
- SoundSync Worker
- Render Worker
- Quality Check Agent

Future Google Cloud workers should receive IDs and safe payload summaries, load trusted records server-side, use Secret Manager for provider keys, and write results back through safe server paths.

## SoundSync SFX Director Type Contracts

`src/types/sfx-director.ts` is the dedicated contract layer for SoundSync SFX Director. It does not replace the existing Professional Edit Quality `SoundEffectPlanRecord`; it gives future SFX-specific workers, services, and migrations a deeper model for individual SFX events, routing, prompts, trimming, timing, mix, QA, usage, provenance, and reusable-library review.

The SFX Director contracts preserve these product rules:

- ReeditPro must not add random SFX.
- Default SFX supports ReeditPro-created edit layers, not every visible source-footage action.
- No SFX is always a valid professional decision.
- SFX must stay voice-first, subtle by default, and QA-checked before preview or export.

Edit-layer SFX is modeled through `SFXEventPlanRecord.targetLayer`, `decisionState`, `sourceFootagePolicy`, `anchorType`, `timingPriority`, `volumeProfile`, and `mixPriority`. `SoundEffectPlanRecord` can optionally reference deeper SFX Director records with `sfxEventPlanIds`, `sfxMixPlanIds`, and `sfxQAReportIds` while existing records remain valid.

Provider routing is modeled through `SFXProviderRouteRecord`. The supported future routes are ReeditPro internal library, MMAudio V2, Mirelo SFX V1.5, no SFX, manual upload, and unknown. Internal library is the future first choice, MMAudio V2 is the cheap/draft/Basic/Pro fallback and video-synced helper, and Mirelo SFX V1.5 is the future production-quality provider for important final-polish moments.

Provider-specific prompting is modeled through `SFXPromptPlanRecord` and `SFXPromptStyle`. MMAudio prompts use `video_conditioned_short_prompt`; Mirelo prompts can use `simple_keyword`, `short_phrase`, `tag_list`, or `structured_sentence` test styles; internal library search uses `library_search_tags`.

RP-SFX-05 adds mock backend prompt adapters that populate these prompt plan records from SFX event plans and provider routes. The adapters store provider-specific prompt text, negative prompts, search tags, duration-to-generate, timing instructions, mix instructions, and validation warnings without calling providers.

RP-SFX-06 adds mock timing contract support with `SFXDurationPlan`, `SFXMockWaveformAnalysisRecord`, `SFXTransientDetectionResult`, `SFXTimelinePlacement`, and `SFXTimingValidationResult`. These types model generate-extra-duration planning, mock waveform shape, transient strength, trim confidence, frame snapping, and timing validation issues without processing real audio.

Generated duration and trim planning are modeled through `SFXGeneratedDurationPolicy`, `SFX_GENERATED_DURATION_POLICY_RANGES`, `SFXGeneratedAssetRecord`, and `SFXTrimPlanRecord`. The contracts support generating longer audio than needed, finding a usable region, trimming, and preserving hit-offset metadata for frame-accurate placement.

Hit alignment and mix planning are modeled through `SFXTimingAlignmentRecord` and `SFXMixPlanRecord`. Timing records store anchor type, anchor time, start/hit/end placement, pre-roll, tail, generated duration, needed duration, and speech-safe placement flags. RP-SFX-06 services derive these from trim windows and hit offsets, then validate late/early hits, long tails, bad trim windows, speech overlap risk, and beat mismatch before the future mix planner. Mix records store volume profile, gain target, voice/music ducking, sidechain intent, fades, EQ notes, stereo width, reverb match, and room match.

RP-SFX-07 adds mock mix contract support with `SFXDuckingIntensity`, `SFXEQProfile`, `SFXStereoWidthProfile`, `SFXReverbProfile`, `SFXMixValidationIssue`, and `SFXMixValidationResult`. The mock mix services create `SFXMixPlanRecord` entries with voice-first target gain hints, ducking, sidechain intent, fade reuse from trim plans, EQ guidance, stereo width, room/reverb match, and validation before handing off to SFX QA.

RP-SFX-08 adds mock QA decision support through `SFXRegenerationReason`, `SFXAdjustmentType`, `SFXAdjustmentDecisionRecord`, and `SFXReplacementDecisionRecord`, while preserving existing `SFXQAReportRecord`, `SFXQAIssue`, and `SFXRegenerationDecisionRecord` usage. QA can approve use, require mix or trim adjustment, regenerate, replace with a future approved library cue, remove SFX, or ask the user. Generated library growth is modeled through `SFXLibraryCandidateRecord`, `SFXUsageRecord`, provenance fields, reuse status, license scope, and privacy flags. Future Supabase migrations should map these contracts to tables only after RP-SFX-03 review.

RP-SFX-09 adds generated SFX library-growth contracts: `SFXLibraryDecision`, `SFXReuseRisk`, `SFXLibrarySearchMatchStrength`, `SFXLibraryPromotionReason`, `SFXLibraryBlockReason`, `SFXProvenanceReviewRecord`, `SFXLibrarySearchRecord`, and `SFXUsageLearningRecord`. These contracts keep generated SFX project-only by default, model provenance/terms review, record library search attempts, evaluate candidates, and capture usage learning without approving real reuse automatically.

## Generation Providers And Google Cloud

The generation provider contracts do not hard-code one provider. They support future provider routing across Wan, Veo, Kling, Remotion, SVG renderer, Lottie renderer, Google Cloud workers, custom providers, and unknown providers.

Stroke Motion should prefer controlled renderers such as SVG, Lottie, Remotion, or custom deterministic animation when transparent overlays and word-level timing are required. AI video models may support concept generation or animation help, but the architecture should not depend only on full AI video generation for Stroke Motion.

The Google Cloud contracts store references only:

- project ID placeholder
- region
- service or job name
- bucket and object path
- Pub/Sub topic
- Secret Manager name/version
- worker runtime type
- GPU requirement
- estimated compute class

They must never contain real credentials, API keys, service account keys, or provider secrets.

## StoryTiming Type Contracts

RP-TIMING-02 adds `src/types/storytiming.ts` as the master timing coordination contract layer. StoryTiming does not replace existing timing fields in edit plans, story beats, pacing analysis, cuts, transitions, captions, Stroke Motion, music, SFX, generation, render, review, or QA records. It references those systems through `StoryTimingSourceRef`, `sourceSystem`, and `sourceRecordId` so distributed timing can be coordinated without deleting local domain timing.

The core records are `MasterTimingMapRecord`, `StoryTimingSegmentRecord`, `TimingAnchorRecord`, `TimingEventRecord`, `TimingDependencyRecord`, `TimingConflictRecord`, `TimingConflictResolutionRecord`, `StoryTimingQACheckRecord`, and `RenderTimingManifestRecord`. Together they model the approved output timing map, reusable anchors, timeline events, cross-system dependencies, detected conflicts, proposed fixes, timing QA, and the future worker-ready render manifest.

StoryTiming connects existing timing surfaces this way:

- Edit plan segments and story beats become `StoryTimingSegmentRecord` rows and source refs.
- Pacing, cut, transition, and caption timing become anchors, events, dependencies, and QA checks.
- Music cue, beat, ducking, and mix timing become music events and speech-protection dependencies.
- SFX event, trim, alignment, mix, and QA timing become SFX start/hit/end events plus hit-alignment checks.
- Stroke Motion, Graphic Design, and Real Motion timing become signature animation anchors/events tied to meaning and safe zones.
- Generated asset timing maps, render inputs, review comments, and QA markers feed render and QA tracks.

`src/lib/mock-storytiming-records.ts` includes Lake Como/lifestyle and serious faith teaching examples with captions, cuts, music cues, ducking, SFX hits, Stroke Motion, Graphic Design, Real Motion, conflicts, QA checks, and render manifests. `src/backend/contracts/storytiming-contracts.ts` provides request/response shapes for future mock services or API skeletons, but RP-TIMING-02 does not add routes, services, migrations, or database tables. RP-TIMING-03 should map these contracts to Supabase tables after review.

RP-TIMING-05 adds mock caption/cut timing contracts for `CaptionTimingPlanRecord` and `CutTimingPlanRecord`. These records do not replace caption plans, cut decisions, pacing analysis, or transcript fields; they coordinate those existing records into StoryTiming transcript anchors, caption events, cut events, pause decisions, J-cut/L-cut hints, focused conflicts, and caption/cut QA.

RP-TIMING-06 adds mock SoundSync timing contracts for `MusicBeatGridRecord`, `MusicDuckingTimingPlanRecord`, and `SoundSyncTimingIntegrationRecord`. These records do not replace music cue sheets, music mix plans, SFX event plans, SFX trim plans, SFX timing alignments, or SFX mix plans. They coordinate those existing records into StoryTiming music cue events, mock beat/downbeat anchors, voice-safe ducking windows, SFX start/hit/end events, SoundSync dependencies, focused conflicts, and music/SFX QA. Beat grids are mock estimates only until a future worker adds real audio analysis.

## Mock Records

`src/lib/mock-ai-editor-records.ts` contains typed examples that prove the model can represent:

- a chat-native project
- four source clips in uploaded order
- a chat session and user instruction message
- inline source sequence card
- intent analysis
- Basic and Signature edit quality profiles
- Stroke Motion source reading mode with `meaning_expansion`
- Stroke Motion beats, characters, symbols, transitions, timing anchors, and generation spec
- music, ambient sound, and transition plans
- credit estimate and credit reservation
- job dependency chain
- generation request placeholder
- preview render placeholder
- QA report placeholder
- revision request placeholder

These records are static examples only. They do not connect to Supabase or trigger any backend work.
