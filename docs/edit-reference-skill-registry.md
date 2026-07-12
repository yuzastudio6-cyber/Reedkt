# Edit Reference Skill Registry

Status: `gate_8_1_local_media_execution_reconciled`

This registry records capability truth, not product aspiration. A tool can back an Edit Reference skill only when an implemented adapter/service, typed input/output contract, proof, safe fallback, privacy boundary, and provenance policy exist.

Readiness values are: `verified_live`, `verified_local`, `verified_mock`, `degraded`, `blocked`, and `not_implemented`.

Existing proof is reusable evidence; it does not mean an Edit Reference study executed that skill. Every future execution must create its own PreferenceSkillRun with runtime source and fallback outcome.

## Registry Entries

### Media Structure

- skillId: `edit_reference.media_structure.metadata_map`
- displayName: `Media Structure Metadata Map`
- purpose: Build bounded duration, dimension, marker-window, scene/shot-plan, and source-order context before deeper study.
- inputs: Private asset identity or previous approved edit identity; safe media metadata; selected study goals.
- outputs: Typed media-structure evidence and missing-analysis requirements.
- toolOrRuntime: Canonical Source Video Understanding package plus registered FFmpeg/FFprobe/PySceneDetect candidates.
- readinessStatus: `verified_local`
- proofCommand: `npm run smoke:source-video-understanding-package && npm run smoke:prod-media-foundation && npm run smoke:edit-reference-gate-8-1-closure`
- fallback: Return metadata-only evidence with `media_not_studied` or a retryable blocked record; never infer semantic scene/story findings.
- sideEffects: Approved local runs read private bytes with FFprobe/FFmpeg and delete bounded temporary frame/audio outputs; provider/worker/render/credit effects remain false.
- privacyPolicy: No raw video, frame payload, filesystem path, signed URL, provider header, or full project history in browser context.
- provenancePolicy: Record private asset ID, metadata source, runtime source, tool versions, fallback flag, and evidence timestamps.

### Visual Language

- skillId: `edit_reference.visual_language.qwen_visual_analysis`
- displayName: `Visual Language Analyst`
- purpose: Extract transferable composition, shot language, layout, text, graphic, color, and visual-risk observations.
- inputs: Ephemeral approved frame samples plus bounded study context.
- outputs: Structured visual evidence with confidence, transferability, risk, and do-not-copy notes.
- toolOrRuntime: Server-only Qwen visual adapter; current verified model resolution uses `qwen3-vl-flash` when configured.
- readinessStatus: `verified_live`
- proofCommand: `npm run smoke:qwen25vl-live-provider && npm run check:qwen25vl-secret-leakage`
- fallback: Deterministic visual fallback labelled `deterministic_visual_fallback`; it must not be reported as live analysis.
- sideEffects: A live invocation calls a provider; Gate 0/1 do not invoke it.
- privacyPolicy: Raw samples are ephemeral, bounded, never persisted by default, and never returned to React; full video is not sent.
- provenancePolicy: Record resolved model, provider alias, runtime source, fallback, frame count/time windows, validation result, latency, and evidence refs.

### Story And Editorial Structure

- skillId: `edit_reference.story_editorial.qwen_reasoning`
- displayName: `Story And Editorial Analyst`
- purpose: Explain hook, chapter/beat structure, pacing logic, editorial emphasis, and why the reference works without copying sequence or timing.
- inputs: Structured study evidence, transcript summaries when available, user priorities, and do-not-copy rules.
- outputs: Transferable story/pacing observations, clarifying questions, conflicts, and target conditions.
- toolOrRuntime: Server-only Qwen 3.7 reasoning bridge.
- readinessStatus: `verified_live`
- proofCommand: `npm run smoke:qwen-live-provider && npm run check:qwen-secret-leakage`
- fallback: Deterministic structured questions/summary labelled fallback; no live-reasoning claim.
- sideEffects: Live provider call only through backend runtime; no plan, worker, render, or credit side effect.
- privacyPolicy: Bounded evidence summaries only; no raw media, full project history, secrets, or provider headers.
- provenancePolicy: Record prompt-package version, model/runtime source, fallback, evidence refs, structured validation, and safety notes.

### Caption Design

- skillId: `edit_reference.caption_design.evidence`
- displayName: `Caption Design Evidence`
- purpose: Describe caption hierarchy, placement, density, animation restraint, readability, and speech relationship.
- inputs: Visual/text-region observations, transcript timing evidence when available, and user study goals.
- outputs: Caption-design evidence, safe-zone constraints, transferability conditions, and copy-risk notes.
- toolOrRuntime: Preference Video Study contracts, Qwen visual summaries, and future OCR/transcript workers.
- readinessStatus: `verified_mock`
- proofCommand: `npm run smoke:preference-video-study && npm run smoke:preference-dna`
- fallback: User-described caption preference with low-confidence/manual evidence label.
- sideEffects: None in current mock proof.
- privacyPolicy: Do not store reference caption wording or raw screenshots as reusable rules.
- provenancePolicy: Record observation source, frame/time range when known, confidence, exact-text redaction, and mock/runtime state.

### Color Treatment

- skillId: `edit_reference.color_treatment.evidence`
- displayName: `Color Treatment Evidence`
- purpose: Describe palette, contrast, saturation, warmth, exposure, skin-tone policy, and scene-matching principles.
- inputs: Validated visual evidence and optional user correction.
- outputs: Transferable color principles and target-dependent constraints.
- toolOrRuntime: Preference DNA visual/color layers; registered OpenColorIO/OpenImageIO/OpenCV candidates remain future execution tools.
- readinessStatus: `verified_mock`
- proofCommand: `npm run smoke:preference-dna && npm run smoke:prod-real-color`
- fallback: Preserve broad user-approved mood only; do not invent exact LUT/grade values.
- sideEffects: Mock evidence only; no color processing is triggered.
- privacyPolicy: No raw frames or private color assets in browser responses.
- provenancePolicy: Record evidence refs, runtime source, tool proof classification, confidence, and target adaptation conditions.

### Speech And Pacing

- skillId: `edit_reference.speech_pacing.evidence`
- displayName: `Speech And Pacing Evidence`
- purpose: Study speech density, pauses, edit rhythm, caption cadence, and speech-first timing principles.
- inputs: Transcript/alignment evidence when proven, metadata-only markers otherwise, and user intent.
- outputs: Pacing observations with evidence confidence and missing-worker blockers.
- toolOrRuntime: Preference Video Study transcript stages; Faster Whisper/AudioFlux remain future Edit Reference adapters.
- readinessStatus: `blocked`
- proofCommand: `npm run smoke:preference-video-study && npm run smoke:prod-speech-caption`
- fallback: Ask deterministic clarification questions and retain metadata-only status; never claim transcript analysis.
- sideEffects: None until approved transcript/audio workers are connected.
- privacyPolicy: Transcript content is project-private and only bounded excerpts may enter reasoning context.
- provenancePolicy: Record alignment/tool version, source ranges, confidence, fallback, and whether speech bytes were processed.

### Audio And Sound Design

- skillId: `edit_reference.audio_sound_design.evidence`
- displayName: `Audio And Sound Design Evidence`
- purpose: Describe music role, energy arc, ambience, ducking, SFX density/category, voice safety, and SoundSync policy.
- inputs: Approved audio evidence or manual/reference observations.
- outputs: Transferable audio/SFX principles, blocked exact music/SFX details, and voice-safety constraints.
- toolOrRuntime: Existing Reference Video DNA audio services and Preference DNA music/SFX layers; real analysis remains future-gated.
- readinessStatus: `verified_mock`
- proofCommand: `npm run smoke:preference-video-study && npm run smoke:preference-dna-qa && npm run smoke:sound-music-audio-planner`
- fallback: Manual/user-described audio evidence; label real analysis as not run.
- sideEffects: No audio generation, MMAudio, Lyria, media processing, or credits.
- privacyPolicy: Never persist or reuse copied songs, lyrics, copyrighted SFX, or raw provider audio payloads.
- provenancePolicy: Record evidence type, cue/time range when known, source ownership, confidence, copy-risk decision, and runtime state.

### Graphics And Motion

- skillId: `edit_reference.graphics_motion.evidence`
- displayName: `Graphics And Motion Evidence`
- purpose: Study graphic hierarchy, cards, UI/document treatment, animation grammar, transitions, and signature-system use.
- inputs: Visual evidence, scene/card summaries, and user priorities.
- outputs: Transferable motion/graphics rules, deterministic-render recommendations, and non-transferable layout/brand findings.
- toolOrRuntime: Preference DNA graphic/motion layers, visual reasoning, and Remotion/tool registries.
- readinessStatus: `verified_mock`
- proofCommand: `npm run smoke:preference-dna && npm run smoke:preference-dna-qa`
- fallback: User-described rules with manual-evidence provenance and conservative application.
- sideEffects: No Remotion render, provider generation, or worker execution.
- privacyPolicy: Exact UI screenshots, brand marks, creator identity, and proprietary layout are non-transferable.
- provenancePolicy: Record evidence refs, component/motion category, target conditions, copy-risk status, runtime source, and fallback.

### Transferability And Do-Not-Copy

- skillId: `edit_reference.transferability.copy_safety`
- displayName: `Transferability And Do-Not-Copy Review`
- purpose: Separate transferable principles from reference-specific details and block direct-copy instructions.
- inputs: All evidence, proposed rules, source rights metadata, and user corrections.
- outputs: Transferability decisions, universal/specific do-not-copy rules, findings, blockers, and review requirements.
- toolOrRuntime: Canonical Preference DNA QA services.
- readinessStatus: `verified_mock`
- proofCommand: `npm run smoke:preference-dna-qa && npm run smoke:edit-reference-dna-qa-approval`
- fallback: Fail closed to user/manual review when confidence, evidence, identity, or rights are unclear.
- sideEffects: None.
- privacyPolicy: Do not reproduce reference assets or expose source/private identity in reusable rules.
- provenancePolicy: Every decision links to rule IDs, evidence refs, check IDs, severity, reviewer, and version.

### Preference DNA Synthesis

- skillId: `edit_reference.preference_dna.synthesis`
- displayName: `Preference DNA Synthesis`
- purpose: Convert approved evidence into categorized, versioned, evidence-linked transferable editing intelligence.
- inputs: Evidence refs, corrections, conflicts, study goals, and mandatory safety rules.
- outputs: DNA layer records, rule candidates, conflicts, confidence, contract hints, and a new immutable version candidate.
- toolOrRuntime: Canonical Preference DNA builder services with optional future Qwen reasoning bridge.
- readinessStatus: `verified_mock`
- proofCommand: `npm run smoke:preference-dna && npm run smoke:edit-reference-dna-synthesis`
- fallback: Do not create an approvable version when evidence or do-not-copy coverage is insufficient.
- sideEffects: No provider, media, worker, render, credit, or remote persistence in current proof.
- privacyPolicy: Persist structured evidence references and decisions, not raw provider payloads/frames.
- provenancePolicy: Record builder version, input evidence revisions, runtime source, fallback, conflicts, and output digest.

### Preference DNA QA

- skillId: `edit_reference.preference_dna.qa`
- displayName: `Preference DNA QA`
- purpose: Validate completeness, evidence coverage, confidence, contradictions, transferability, copy risk, identity safety, side effects, and approval readiness.
- inputs: Exact DNA version candidate plus evidence and source-safety metadata.
- outputs: Version-bound QA result, findings, blockers, warnings, and review decision.
- toolOrRuntime: Canonical Preference DNA QA service family.
- readinessStatus: `verified_mock`
- proofCommand: `npm run smoke:preference-dna-qa`
- fallback: Block approval and request evidence/manual review.
- sideEffects: None.
- privacyPolicy: QA browser DTOs contain summaries and IDs only; no private bytes or provider payloads.
- provenancePolicy: Record QA registry version, check results, DNA digest/version, evidence refs, runtime source, and reviewer decision.

### Target-Video Adaptation

- skillId: `edit_reference.target_adaptation.application`
- displayName: `Target-Video Preference Adaptation`
- purpose: Resolve approved Preference DNA against one target edit's source, user intent, edit level, frame, budget, and safety constraints.
- inputs: Approved DNA version, target Project Edit Session context, Edit Brief, source understanding, marker context, explicit chat instructions, and platform rules.
- outputs: Target-specific application package, plan hints, QA conditions, downstream context summaries, and invalidation effects.
- toolOrRuntime: Canonical mock Preference DNA application and Project Edit Session/Brief/Marker bridges.
- readinessStatus: `verified_mock`
- proofCommand: `npm run smoke:edit-reference-target-application && npm run smoke:edit-reference-adaptation-proof && npm run smoke:edit-reference-downstream-integration && npm run smoke:edit-reference-lifecycle-closure`
- fallback: Legacy preference or no-reference route, explicitly labelled; blocked DNA never silently applies.
- sideEffects: Metadata/hints only in current proof; no plan approval, provider, worker, render, or credit activity.
- privacyPolicy: Downstream contexts exclude full study chat, raw media/frames, provider payloads, secrets, and unrelated project history.
- provenancePolicy: Record target edit, approved DNA version, target-context digest, instruction precedence, adapted/rejected rules, fallback, and application version.

## Registry Governance

- `verified_live` means an exact adapter and live proof exist; it does not mean the current study ran it.
- `verified_local` means an actual local adapter performed the operation with runtime evidence.
- `verified_mock` means deterministic contracts/behavior passed but no real analysis/execution is implied.
- `degraded` means a bounded subset is available with explicit missing capability.
- `blocked` means the skill cannot truthfully run for the requested evidence yet.
- `not_implemented` means no compliant adapter/service exists.

Before any entry changes status, update its proof command, privacy/provenance policies, goal verification log, and behavior tests together.

## Gate 2 Execution Evidence

Gate 2 originally recorded per-study execution truth separately. Gate 8.1 later upgraded the Media Structure registry entry after real private-video FFprobe/FFmpeg proof:

- In Gate 2, Media Structure normalized user-supplied metadata only, remained `degraded` per run, and required `media_not_studied`.
- Visual Language and Story/Editorial use explicit deterministic fallback over user descriptions; their live provider adapters are not called.
- Caption, Color, Audio/SFX, and Graphics/Motion use manual-evidence fallback with the registry's conservative constraints.
- Speech/Pacing stays blocked without transcript/audio evidence.
- Transferability/Do-Not-Copy runs the deterministic `verified_mock` safety classifier and fails closed on direct-copy requests.
- A deterministic pacing-conflict pass creates a review-required finding instead of silently choosing.
- Preference DNA Synthesis, DNA QA, and Target Adaptation do not run in Gate 2.

Exact behavior proof: `npm run smoke:edit-reference-evidence-study`.

## Gate 3 Execution Evidence

Gate 3 executes `edit_reference.preference_dna.synthesis` through the canonical Edit Reference service with `verified_mock` runtime truth:

- Only an `evidence_ready` study with a completed copy-safety result can synthesize.
- Active source evidence and the latest derived evidence are frozen by exact ID/revision and SHA-256 input digest.
- Populated layer snapshots, evidence-linked rules, conflict snapshots, confidence, and at least five mandatory do-not-copy rules are persisted as one review-required version.
- Identical immutable input produces identical rules, layers, and content digest.
- Corrected evidence creates a later version without mutating the prior version's immutable content.
- Provider, model, media, worker, generation, render, credit, and remote Supabase side effects remain false.
- `edit_reference.preference_dna.qa` and `edit_reference.target_adaptation.application` do not run in Gate 3.

Exact behavior proof: `npm run smoke:edit-reference-dna-synthesis`.

## Gate 4 Execution Evidence

Gate 4 executes `edit_reference.preference_dna.qa` through the canonical Edit Reference service with `verified_mock` runtime truth:

- QA is bound to the exact Gate 3 DNA version, DNA content digest, and input-evidence digest.
- Twelve stable checks cover integrity, selected-goal layers, evidence coverage, confidence, conflicts, transferability, mandatory copy boundaries, direct-copy risk, identity/source safety, false production side effects, and approval readiness.
- Blocking results cannot be acknowledged or approved.
- Non-blocking review limits require explicit user acknowledgement before exact-version approval.
- Approval retains an immutable snapshot linked to the exact QA result and never applies the guidance to a target edit.
- Corrected evidence creates a later independently reviewed version; prior DNA, QA, and approval history remains immutable.
- Provider, model, file-byte, external fetch, media, worker, generation, render, credit, application, and remote Supabase side effects remain false.
- `edit_reference.target_adaptation.application` does not run in Gate 4.

Exact behavior proof: `npm run smoke:edit-reference-dna-qa-approval`.

## Gate 5 Execution Evidence

Gate 5 executes `edit_reference.target_adaptation.application` with deterministic `verified_mock` truth:

- only an exact approved, QA-reviewed DNA version can prepare an application;
- each target snapshot confirms source mode, content, instruction, story role, platform, frame, edit level, budget, and constraints;
- every DNA rule becomes one adapted, context-only, or blocked decision with explicit precedence and explanation;
- reference-specific footage, timing, captions, sequence, music/SFX, layouts, brands, people, and identity stay blocked;
- immutable application/target digests and durable replay are validated on read;
- no target edit, plan, provider, media, worker, render, or credit state changes.

Exact behavior proof: `npm run smoke:edit-reference-target-application`.

## Gate 6 Execution Evidence

Gate 6 connects the exact prepared application to the existing backend-local Project Edit Session authority, then exposes only a bounded downstream context:

- inactive staging and approval reset occur before server connection;
- exact target/session/frame/platform/level/context receipts must match;
- Project Edit Session, Edit Brief, Marker Context, Marker Chat, Plan Hints, and QA consume the same bounded context;
- confirmed target markers and current instructions outrank reusable DNA;
- provider/media/worker/render/credit flags remain false.

Exact behavior proof: `npm run smoke:edit-reference-downstream-integration`.

## Gate 7 Execution Evidence

Gate 7 preserves immutable lifecycle history while replacing or removing guidance:

- invalidation removes old active context before a replacement is prepared;
- application versions are monotonic with immutable prior/next links;
- removal preserves cleared application, usage, audit, and downstream history;
- reload/recovery cannot reactivate replaced or removed context;
- affected Brief/Marker/Plan/QA state requires replan;
- no approved plan, provider, media, worker, render, or credit state is changed.

Exact behavior proof: `npm run smoke:edit-reference-lifecycle-closure`.

## Gate 8 Reconciliation Evidence

Gate 8 separates registry capability readiness from per-study runtime truth and records the complete result in `docs/edit-reference-skill-provenance-report.md`:

- 12 registry families retain typed input/output, proof, fallback/failure, privacy, and provenance fields;
- after Gate 8.1, current totals are 2 `verified_live`, 1 `verified_local`, 8 `verified_mock`, 0 `degraded`, and 1 `blocked`;
- the two live-capable Qwen adapters were not called merely to refresh a label;
- Gate 8 studies used labelled deterministic/manual fallbacks and an explicit blocked speech/pacing result;
- three target adaptations proved context-only/blocked rules, target-specific guidance, and zero production side effects;
- provider, media, worker, generation, render, credit, and remote-persistence calls remained false.

Exact behavior proof: `npm run smoke:edit-reference-evidence-study && npm run smoke:edit-reference-adaptation-proof && npm run smoke:edit-reference-gate-8-readiness`.

## Gate 8.1 Execution Evidence

- Media Structure executes `verified_local` against a finalized private video through FFprobe.
- Representative-frame planning executes `verified_local` through FFmpeg with at most four frames and verified temporary-directory cleanup.
- Frame timing/count is persisted; raw frame pixels, extracted audio, local paths, signed URLs, and process output are not.
- Visual, story, caption, color, speech, audio, and graphics semantic specialists each emit `degraded` or `blocked` runs with exact blockers. Manual fallback stays separately labelled.
- Copy safety, DNA synthesis, QA, target adaptation, setup/chat application, replacement, and removal retain deterministic `verified_mock` truth.
- No provider/model/worker/render/credit/remote Supabase call occurs.

Exact proof: `npm run smoke:edit-reference-gate-8-1-closure`.
