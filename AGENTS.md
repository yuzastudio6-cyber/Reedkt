# ReeditPro Agent Instructions

These instructions are for Codex and any future agent working in this repository.

## Required Reading

- Read `design.md` before any UI, layout, component, visual, brand, or frontend design work.
- Read `product-plan.md` before product-scope decisions.
- Read `intent-led-edit-planning.md` before upload, planning, AI workflow, generation, or approval work.
- Read `pricing-and-credits.md` before billing, credits, subscription, usage, or estimate work.
- Read `signature-systems.md` and `real-motion-system.md` before visual AI system work.
- Read `edit-workflow-blueprints.md` before changing video type dropdowns, workflow profiles, edit setup, or planning prompts.
- Read `visual-storytelling-architecture.md` before visual storytelling, beat planning, visual asset type, or character consistency work.
- Read `model-routing-policy.md` before provider model routing, fallback, resolution, or generation-policy work.
- Read `frame-layout-system.md` before frame template, layout panel, compositor, safe-zone, or AI animation background work.
- Read `aspect-ratio-frame-first-planning.md` before aspect ratio gates, output frame confirmation, frame-first planning, or approval-path frame requirements.
- Read `master-timing-architecture.md`, `timing-settings-catalog.md`, and `timing-qa-policy.md` before timing, cuts, captions, SFX, music ducking, beat alignment, provider clip duration, Remotion sequence timing, or frame-accurate QA work.
- Read `caption-visual-cue-timing.md`, `caption-readability-motion-policy.md`, and `visual-cue-synchronization-policy.md` before caption timing, caption animation, caption readability, visual cue timing, cue triggers, cue density, or caption/visual collision planning work.
- Read `soundsync-beat-grid-transition-timing.md`, `transition-timing-policy.md`, and `sfx-ducking-timing-policy.md` before SoundSync beat grid, transition timing, SFX timing, music ducking, beat snap, AudioFlux planning, or speech-safe transition work.
- Read `soundsync-sfx-director.md`, `sfx-provider-strategy.md`, `sfx-timing-trim-mix.md`, and `sfx-library-growth.md` before SoundSync SFX Director, SFX provider route, SFX prompt, timing/trim/mix, QA, or generated SFX library work.
- Read `timing-validation-policy.md`, `timing-complexity-credit-policy.md`, and `timing-approval-gate-policy.md` before timing validation, timing approval gates, timing credit impact, lower-cost timing alternatives, or approved timing snapshots work.
- Read `source-cleanup-trim-planning.md`, `trim-selects-qa-policy.md`, `retake-selection-planning.md`, `meaning-preservation-validation.md`, and `source-cleanup-review-ux.md` before source cleanup, selects, retake selection, trim decisions, cleanup preference, cut lists, trim review, meaning preservation, or trim QA work.
- Read `speaker-visual-layout-strategy.md` before speaker presence, visual takeover, picture-in-picture, side-by-side, lower panel, map, chart, evidence board, screen capture, b-roll cutaway, or adaptive layout strategy work.
- Read `depth-aware-overlay-composition.md` before depth-aware overlays, foreground masks, contact object preservation, object anchoring, mask risk, or layered compositing strategy work.
- Read `video-understanding-report.md` before video understanding, clip analysis, transcript meaning, visual/audio issue planning, opportunity detection, or source-content analysis work.
- Read `adaptive-planning-layer.md` before adaptive edit strategy, per-segment visual/tool decisions, or anti-template planning work.
- Read `adaptive-edit-strategy-planner.md` before adaptive segment strategy, generation restraint, visual/tool selection, or reasoned per-beat creative decisions.
- Read `open-source-tool-registry.md` before open-source tool strategy, deterministic tool planning, tool/provider separation, license review, or controlled-tool decisions.
- Read `tool-settings-catalog.md` before tool setting, preset, registry profile, map/chart/browser/color/audio/QA tool planning, or tool catalog work.
- Read `launch-tool-stack-update.md` before launch tool stack, AudioFlux, Signalsmith Stretch, FFmpeg LGPL configuration, VapourSynth, Sharp + libvips, Essentia replacement, or Rubber Band replacement work.
- Read `remotion-capability-matrix.md` before deciding what Remotion can build directly versus what needs GPT-Image-2, open-source tools, AI video assets, workers, or QA-only tools.
- Read `render-strategy-planner.md` before render strategy planning, Remotion-only decisions, GPT-image-to-Remotion flows, tool-to-Remotion flows, AI-video-to-Remotion flows, or worker pre/postprocess strategy work.
- Read `tool-strategy-planner.md` before segment/asset-specific tool chain planning, controlled-tool settings, tool fallbacks, or tool-vs-AI decisions.
- Read `tool-usage-planning-ui.md` before changing the chat UI that displays planned tool chains, tool settings, execution modes, or planning-only tool status.
- Read `color-pipeline-planning.md` before color correction, grading, shot matching, generated asset matching, AI-video panel color consistency, or color QA planning work.
- Read `color-grading-settings-catalog.md` before color settings, grade presets, LUT/look settings, shot matching settings, generated asset matching settings, or color QA thresholds.
- Read `soundsync-audio-pipeline-planning.md` before SoundSync, audio cleanup, loudness, music bed, ducking, SFX, beat timing, emotional pacing, or audio QA planning work.
- Read `audio-settings-catalog.md` before audio cleanup settings, loudness settings, music/SFX settings, SoundSync cue settings, beat sync settings, or audio QA thresholds.
- Read `map-location-animation-planning.md` before map, route, neighborhood, geography, location card, map-behind-subject, or map evidence planning work.
- Read `map-animation-settings-catalog.md` before map settings, location confidence, map style, route/camera animation, map safe zones, or map QA threshold work.
- Read `chart-diagram-planning.md` before chart, diagram, money-flow, metric, timeline, evidence-flow, or VisualExplain data graphic planning work.
- Read `chart-diagram-settings-catalog.md` before chart/data/diagram settings, source confidence, label density, animation settings, layout settings, or dataviz QA threshold work.
- Read `remotion-renderer-plan.md` before rendering, compositing, frame layout, motion design, or visual asset assembly work.
- Read `professional-editing-ontology.md` before professional editing style, pacing, cut, transition, color, caption, b-roll, sound, or custom directive work.
- Read `edit-quality-standards.md` before changing tier quality, edit QA, professional baseline, or quality-gate behavior.
- Read `intent-compiler-architecture.md` before natural-language request parsing, compiled intent, clarifying questions, or user instruction mapping work.
- Read `segment-edit-operations-architecture.md` before segment planning, worker instructions, edit operations, cut lists, caption operation plans, b-roll operation plans, or per-segment editing work.
- Read `edit-qa-architecture.md` before QA planning, fallback QA, model-policy QA, approval QA, frame-layout QA, or professional delivery checks.
- Read `edit-planning-database-architecture.md` before future edit-planning persistence, database architecture, approved plan versioning, job tables, QA tables, revision tables, or credit approval schema work.
- Read `approved-plan-snapshot-policy.md` before approval, approved snapshot, worker execution, credit reservation, revision versioning, or immutable plan version work.
- Read `editing-agent-execution-architecture.md`, `async-edit-work-graph.md`, and `editing-asset-manifest.md` before editing agent execution, async work graph, dependency planning, asset manifest, checkback policy, fallback policy, or execution-state work.
- Read `async-checkback-policy.md`, `asset-merge-reconciliation-policy.md`, and `dependency-readiness-policy.md` before async checkback, dependency readiness, asset merge, placeholder preview, final render readiness, fallback/replacement, or asset version reconciliation work.
- Read `editing-agent-qa-gates.md`, `agent-failure-fallback-decision-matrix.md`, and `agent-recovery-user-review-policy.md` before agent QA gates, failure/fallback decisions, local/global failure handling, recovery policy, retry/fallback planning, or user-review recovery work.
- Read `provider-prompt-architecture.md` before provider prompt planning, prompt previews, image prompt briefs, AI-video prompt briefs, Remotion motion briefs, or approved prompt snapshot work.
- Read `character-consistency-system.md` before character pack, recurring character, keyframe identity, start/end frame consistency, or likeness-safety work.
- Read `documentary-fact-safety-system.md` before documentary claims, real named people, allegations, evidence cards, fact-safety planning, or case-study visual treatment work.
- Read `planner-regression-validation.md` before planner validation, regression checks, demo scenario QA, model-routing tests, prompt-builder tests, or hard product rule validation work.
- Read `connected-planning-system-overview.md`, `planning-layer-inventory.md`, and `implementation-status-and-next-phase.md` before connected planning-system audits, planning-layer inventory work, next-phase recommendations, or documentation cleanup.
- Read `supabase-schema-planning-bridge.md`, `database-migration-readiness-checklist.md`, and `supabase-table-specification.md` before Supabase schema planning, table planning, migration bridge work, RLS planning, storage bucket planning, or database readiness work.
- Read `sql-migration-draft-review.md`, `supabase-rls-policy-draft.md`, and `supabase-storage-bucket-draft.md` before SQL migration draft review, RLS draft policy work, storage bucket draft policy work, or migration readiness follow-up.
- Read `migration-review-and-rls-hardening.md`, `rls-hardening-matrix.md`, and `data-privacy-retention-plan.md` before migration review, RLS hardening, service-role boundary, access-control matrix, private artifact, browser-capture privacy, or retention planning work.
- Read `chat-planning-ux-architecture.md` before chat flow organization, planning card priority, collapse behavior, guided/detailed/developer modes, or approval-path UX work.
- Read `source-sequence-review-ux.md` before source order review, clip reorder UX, uploaded-order semantics, or source-sequence confirmation work.
- Read `docs/lyria-worker-plan.md` and `docs/google-cloud-audio-worker-plan.md` before Lyria worker, Google Cloud audio worker, music generation job, worker secret, or generated music asset work.
- Read `docs/lyria-integration-adapter.md` before Lyria provider adapter, Lyria request building, Lyria response parsing, integration mode, or disabled real API path work.
- Read `supabase-production-test-readiness.md` and `supabase-local-staging-test-plan.md` before active Supabase migration testing, production-test readiness, local/staging database validation, or Supabase advisor review work.

## Product Identity

ReeditPro is a web-first AI video editing platform. It is not a generic video editor, timeline clone, or template-only dashboard.

The primary product flow is:

1. User uploads clips in source order.
2. User chooses workflow context from a video type dropdown.
3. User chooses edit level and mood/style if needed.
4. User optionally provides a reference video.
5. User writes custom instructions.
6. AI analyzes clips, transcript, visual footage, and reference DNA.
7. AI creates a Source Sequence Map and edit strategy.
8. AI routes visual and audio systems per segment.
9. AI shows an edit plan and credit estimate.
10. User approves or requests changes.
11. Only after approval does generation/editing begin.

## Approval And Credit Gate

ReeditPro should never start expensive AI editing, rendering, or generation until it understands the user's goal and the user approves the edit plan and credit estimate.

- Always estimate credits before generation.
- Deduct credits only after user approval.
- Do not imply subscriptions provide open-ended AI editing.
- Failed ReeditPro generation should be refunded according to `pricing-and-credits.md`.
- Real Motion is premium and credit-heavy.
- RP-FIX-09 credit runtime helpers are the current mock-safe approval/reservation gate. Real reserve, spend, release, refund, provider execution, rendering, and worker jobs remain backend-required.
- RP-FIX-10 job runtime helpers are the current mock-safe queue/readiness layer. Real worker dispatch, Cloud Run jobs, service-role job mutation, provider execution, and rendering remain backend-required.
- Blockers are evidence gaps, not permanent stop signs. When a path is blocked, the repo should name the exact missing approval, proof, deployment, license, persistence, or runtime evidence and the next smallest safe step that can retire that blocker. Do not use broad "production blocked", "backend-required", or "product-ready false" language to intentionally freeze unrelated safe work. Keep approval, credit, privacy, secret, provider, worker, Supabase, storage, beta, and production gates strict, but move forward through bounded source reviews, mock-safe skeletons, local proofs, diagnostics, and QA packets whenever those steps can reduce a named blocker without bypassing the gate.
- A blocked beta or production gate must not block unrelated implementation lanes. If a live gate cannot be cleared yet, the next change should make the blocker smaller, more measurable, or closer to owner approval: source classification, dependency proof, local command/import proof, persistence preflight, cost-metering skeleton, QA acceptance, rollout plan, or rollback policy. A blocker may stop only the unsafe action it protects, not safe evidence gathering or safe backend scaffolding that keeps the gate closed.
- Hard rule: intentional blanket blockers are not allowed. A blocker must identify the unsafe action it protects, the exact evidence missing, and at least one safe forward lane. If a blocker report cannot name a safe next action, improve the blocker report first; do not treat the missing next action as permission to stop unrelated safe work.
- Reports and diagnostics should expose this distinction in machine-readable form where possible. Prefer fields that name the blocked action scope and confirm safe blocker-reduction work is allowed, so future agents do not mistake a guarded beta/production gate for a blanket instruction to stop progress.
- Production hardening and beta readiness reports must expose `intentionalBlanketBlocksAllowed: false`, `safeBlockerReductionAllowed: true`, blocked action scope, and allowed forward-progress scopes when they report launch/runtime blockers. A missing scoped-forward-progress contract is itself a metadata defect to repair, not a reason to stop all safe work.
- When a user asks to keep moving toward beta or production readiness, do not answer by treating current blockers as intentional permanent walls. Choose the smallest safe forward lane that reduces a named blocker while preserving approval, credit, privacy, Supabase, provider, worker, storage, beta, and production gates.

## Backend And Database Architecture

- RP-DB-01 architecture docs are the source of truth for future backend/database implementation.
- RP-FIX-08 API route contracts are the current boundary for future backend calls. Frontend code should go through frontend-safe API helpers or mock services, while service-role writes, provider calls, payment operations, workers, rendering, signed storage, and admin actions stay backend-only.
- ReeditPro editing is chat-native. The chat is the editor, and UI appears inside chat only when the AI needs user input, confirmation, approval, progress, or preview.
- Every ReeditPro edit, including Basic, must meet a professional editing standard. Basic means lower-compute clean editing, not low-quality editing.
- Edit level controls complexity, generation depth, credit cost, signature usage, and worker pipeline depth. Edit level does not control quality.
- Heavy AI, generation, rendering, and background work should be designed for future Google Cloud workers, but no Google Cloud resources, credentials, or deployments should be added unless explicitly requested.
- Never begin generation before edit plan and credit approval.
- Stroke Motion supports `spoken_story_mode` and `source_reading_mode`.
- Stroke Motion source reading requires `meaning_expansion` before animation planning.
- Veo 3.1 Lite is Premium-only and fallback-only. Basic and Pro must never route to Veo.
- AI video generation should default to matching white/near-white/custom panel backgrounds, not transparent backgrounds.
- Basic must still be professional. Basic means lower-compute clean editing, not low-quality editing.
- Edit level controls complexity, fallback depth, asset count, and credit estimate. Edit level does not control quality.
- The professional editing ontology guides the AI but must not limit custom user requests.
- If a user asks for a style not in the ontology, store it as a custom directive and map it to known professional presets.
- No random b-roll, random transitions, random captions, random color grading, or random visuals.
- Every edit plan should include structured settings for pacing, color, captions, transitions, b-roll, sound, and visual systems when applicable.
- User chat must be compiled into structured editing intent before plan generation.
- Do not rely on raw chat text alone for edit planning.
- Ask clarifying questions only when missing information changes the edit.
- Explicit user instructions have priority over defaults unless constrained by safety, tier, model policy, frame rules, or platform rules.
- Basic and Pro cannot use Veo even if the user asks; explain the tier constraint and offer Wan/Hailuo or Premium final-fallback alternatives.
- Every approved edit plan should eventually resolve into segment edit operations with enough detail for workers to execute.
- QA must check the result against user intent, tier rules, source order, frame rules, model routing, and professional standards.
- Workers must not improvise outside approved plan and fallback rules.
- Basic and Pro cannot use Veo during QA fallback.
- Premium can use Veo only as final fallback/rescue.
- Future backend/database work must use approved plan snapshots.
- Workers must execute approved plan versions, not raw chat text.
- Do not overwrite approved plan versions; approved versions are immutable except for status and audit fields.
- User revisions create new plan versions.
- Credit estimates and approval records must point to exact plan versions.
- Basic/Pro no-Veo policy and Premium fallback-only Veo policy must be preserved in approved snapshots.
- Matching panel background and frame layout rules must be preserved in approved snapshots.
- Aspect ratio/output frame must be confirmed by the user before approval.
- Do not silently default to 9:16, 16:9, or any other aspect ratio.
- Platform can suggest an aspect ratio, but it is not confirmed until the user chooses it.
- Changing aspect ratio resets approval, progress, preview, and approved snapshot state and requires replanning.
- All image/video/provider/Remotion/tool planning must use the confirmed frame.
- Source aspect ratio is not final output aspect ratio unless confirmed.
- No provider prompt should create final canvas unless the render strategy explicitly says so.
- No final export plan without confirmed aspect ratio.
- No worker execution without confirmed aspect ratio in the approved snapshot.
- Every edit must have a MasterTimingPlan before approval.
- Timing must be frame-accurate: seconds are display values, frames are execution values.
- Speech clarity outranks beat alignment, decorative motion, SFX, and retention tricks.
- Visuals must be timed to meaning, not random moments.
- Captions must be readable and aligned to speech.
- Transitions must not cut important words unless the approved plan intentionally says so.
- SFX must be justified by a visual/story cue and must not cover speech.
- Music ducking must protect voice clarity.
- Remotion layer timing must come from the MasterTimingPlan.
- Provider clip duration and placement must be planned, not arbitrary.
- No final timing approval without confirmed output frame and timing base.
- Caption timing must prioritize speech clarity and readability.
- Visual cue timing must be tied to meaning, not random motion.
- Beat sync must not override speech clarity.
- Captions must not cover faces, products, map labels, chart labels, browser highlights, source labels, or fact-safety notes.
- Text-heavy visuals need enough hold time.
- Lower panels require simpler labels and longer read time.
- SFX must be tied to planned visual or transition cues.
- Caption and visual cue timing must be frame-accurate.
- No real transcript/audio alignment is implemented unless a future worker milestone adds it.
- Timing validation must run before approval.
- Blocking or failed timing validation prevents approval.
- Timing complexity must be reflected in the credit estimate.
- Lower-cost timing alternatives must be shown when complexity is high.
- Timing changes reset approval, progress, preview readiness, and approved snapshot readiness.
- Master timing, caption/visual cue timing, SoundSync/transition timing, and timing validation must be frozen in approved snapshots.
- Workers must execute approved timing plans, not reinterpret raw chat timing.
- No real timing analysis is implemented unless a future worker milestone adds it.
- Source cleanup preference must be asked and confirmed before final approval.
- Do not randomly cut footage.
- Every trim/select decision needs a reason.
- Preserve meaning over pacing.
- Documentary and case-study proof/context must not be cut in a misleading way.
- Tutorial and product demos must preserve required steps.
- Behind-the-scenes/lifestyle content may intentionally keep natural pauses when the user requests authenticity.
- Retakes and repeats should be selected professionally, not blindly removed.
- Retake selection must have reasons and confidence.
- Meaning preservation must validate trim decisions before approval.
- User review is required when a cut could change meaning.
- Documentary/case-study context and evidence must be preserved unless user explicitly approves safe trimming.
- Tutorial/product demo steps must not be removed if required for understanding.
- User-marked important clips must not be cut without review.
- Retake selection and meaning preservation are mock-only until real transcript/media workers exist.
- Source cleanup is mock-only until real transcript/media analysis workers exist.
- Future workers must execute approved trim decisions from approved snapshots.
- The editing agent must use a structured async work graph.
- The edit must not stop globally while one asset is generating; independent work may continue when dependencies allow it.
- Required dependencies must block only the affected downstream work.
- Every generated or processed asset must appear in the asset manifest.
- The agent must not rely on model memory to remember pending jobs, dependencies, or assets.
- Every work item needs an idempotency key and approved snapshot reference or explicit pending-snapshot note.
- Provider/tool execution is future backend/worker only.
- No final render may start without required assets and QA.
- Pending provider/tool jobs must have checkback policies.
- Completed assets must be merged/reconciled before downstream work proceeds.
- Final render cannot start with missing required assets.
- Preview may use placeholders only when explicitly allowed.
- Final render cannot use placeholders for required assets.
- Every ready asset must link to segment, timing, and renderer layer where applicable.
- Asset versions and replacements must be tracked.
- Basic/Pro cannot fallback to Veo.
- Premium can use Veo only as final fallback for approved AI video assets.
- No real checkback, polling, webhook, provider, tool, worker, backend, storage, media, or rendering execution is implemented in frontend mock planning.
- Every work item should have QA gates.
- Every failure category should have an approved fallback path or user-review path.
- A local failure should not stop unrelated independent work.
- A global failure should block final render/export.
- Final render cannot proceed with unresolved required failures.
- Preview placeholders are allowed only when explicitly planned.
- Maps, charts, browser captures, captions, timing, and masks should not fallback to AI video.
- Meaning, privacy, source truth, and credit-overrun issues require user review or new approval.
- No real QA, retry, fallback, provider, worker, backend, storage, billing, media, or rendering execution occurs in frontend/mock milestones.
- Workers execute approved snapshots, not raw chat.
- Provider prompts must be built from compiled intent, professional editing direction, visual asset plan, style mode, frame layout, provider route, and QA checks.
- Do not hand-write random prompts disconnected from the approved plan.
- GPT-Image-2 prompts create images, cards, keyframes, start frames, and end frames.
- Wan, Hailuo, and Veo prompts create AI video clips/assets only, not the final canvas.
- Remotion owns final layout/composition and receives renderer or motion briefs.
- ReeditPro must plan speaker/visual layout per segment.
- Do not use the same layout for every video.
- Layout should depend on user request, segment meaning, source footage, platform, edit level, and visual need.
- Speaker should stay visible when trust, emotion, authenticity, or personal story matters.
- Visuals should take over when explanation, evidence, map, chart, timeline, diagram, or screen capture needs space.
- Remotion owns final layout/composition; AI models generate assets and clips only.
- Future depth-aware overlays and contact-object preservation are advanced layout/compositing tasks, not default flat overlays.
- Depth-aware overlays must be planned, not randomly applied.
- Preserve contact objects when they affect the depth composition.
- Person plus contact object can become one foreground depth group.
- Captions must stay above graphics and masks.
- Use safer layouts when mask risk is high.
- Basic should avoid complex depth masks.
- Pro can plan low/medium risk foreground-aware overlays.
- Premium can plan advanced depth overlays with stronger QA.
- Depth-aware composition is a compositing/masking task, not a reason to use Veo.
- Workers must not execute mask/depth plans before approval.
- ReeditPro must use video understanding before choosing visual or tool strategy.
- Do not edit every video with the same template.
- User intent and video content both shape the plan.
- Video understanding guides planning but does not override explicit user instructions.
- The planner should explain why each segment needs speaker, visual, both, b-roll, card, chart, map, Stroke Motion, Real Motion, or no extra visual.
- Current frontend tasks must not implement real video analysis unless explicitly requested.
- Every visual/edit decision should have a reason.
- Do not apply visual systems by category alone.
- Adaptive strategy must use both user intent and video understanding.
- Exact charts, maps, labels, screen captures, and data visuals should prefer controlled tools/Remotion instead of AI video.
- AI video should be reserved for organic or generative motion that actually improves the segment.
- The planner should explain why a segment uses still/card, b-roll, map, chart, screen capture, Stroke Motion, Real Motion, captions only, or no visual.
- ReeditPro should prefer controlled tools over AI generation when exact text, charts, maps, captions, layouts, screenshots, color/audio processing, or QA matters.
- Do not install tools unless the milestone explicitly asks for installation.
- Tool registry guides the AI but does not limit custom requests.
- Tool strategy must explain why a tool is chosen.
- License notes must be tracked before production use.
- Worker tools should not be bundled into frontend code without a specific milestone.
- Remotion is the compositor; tools can provide assets, data, screenshots, maps, charts, processing, or QA.
- Every visual asset should have a render strategy explaining whether Remotion alone is enough or whether GPT-Image-2, open-source tools, AI video assets, or future workers are needed.
- Do not use AI video for exact charts, captions, maps, cards, labels, screen captures, or diagrams when controlled tools or Remotion can do the job.
- Basic should prefer simpler Remotion-only, still/card, and controlled tool render strategies.
- Pro can use richer tool-based and AI-assisted render strategies, but still cannot use Veo.
- Premium can use advanced hybrid render strategies, but Veo remains final fallback only.
- Do not install render/tool packages unless the milestone explicitly asks for installation.
- Tool strategy must be segment- or asset-specific and explain why the selected tool chain is better than AI generation when exact output matters.
- Tool strategy settings should come from the settings catalog, not raw chat text alone.
- Provider models are not open-source tools.
- Tool usage UI must not imply that tools have been installed, executed, rendered, or run before approval.
- Basic/Pro no-Veo policy and Premium final-fallback-only Veo policy remain unchanged by tool strategy.
- Basic edits must include professional color correction; never describe Basic as ungraded or low quality.
- Color grading should be planned deterministically, not randomly generated.
- Remotion is not the full color grading engine; future FFmpeg/OpenColorIO/OpenImageIO/OpenCV/Sharp workers may execute color and color-QA tasks only after approval.
- Generated GPT-Image-2, Wan, Hailuo, and Veo assets should be planned to match the chosen color look and panel background.
- Color plans must preserve skin tones when people are visible.
- Documentary / Case Study color should avoid sensational overprocessing unless the user requests stylization.
- No real color processing unless a milestone explicitly requests it.
- Basic edits must include professional audio cleanup and loudness planning; never describe Basic audio as low quality.
- SoundSync is the audio/timing support engine, not a visual signature system.
- Do not add random SFX; SFX and music must support story, pacing, transition, reveal, or emotion.
- SoundSync SFX Director plans SFX before generation.
- Default SFX supports ReeditPro-created edit layers, not every real-world source action.
- Mirelo SFX V1.5 is the future production SFX provider.
- MMAudio V2 is the future cheap/draft/Basic/Pro fallback and video-synced helper.
- Generated SFX should be longer than needed, then trimmed, hit-aligned, mixed, and QA-checked.
- SFX must be voice-first and never too loud by default.
- Generated SFX starts project-only and becomes a library candidate only after QA and provenance review.
- No SFX provider API keys, provider secrets, or real SFX integrations should be added until explicitly requested.
- SFX provider integrations must remain behind backend/worker boundaries.
- Never expose Mirelo or MMAudio provider keys to frontend code.
- SFX workers must enforce edit plan approval and credit reservation before generation.
- SFX worker skeletons are mock-only until explicit real integration.
- Music must not overpower voice, and ducking should be planned when music is present under speech.
- Audio planning should be deterministic and structured, not random.
- Speech clarity beats music beat alignment.
- Beat cuts must not cut important words.
- Transition timing must be phrase-aware.
- SFX must be tied to a planned cue and reason.
- Music ducking must protect voice clarity.
- Documentary and case-study SoundSync timing should stay restrained unless the user requests otherwise.
- Basic should use simple professional timing, not chaotic beat/SFX timing.
- Beat grids are mock-only until a future AudioFlux worker exists.
- No real audio analysis is implemented in frontend/mock milestones.
- Future FFmpeg LGPL Configuration, AudioFlux, Signalsmith Stretch, librosa, whisper.cpp, and any future/evaluation Essentia or Rubber Band workers may execute audio analysis or processing only after approval.
- Launch audio analysis candidate is AudioFlux, not Essentia.
- Launch music stretch/pitch candidate is Signalsmith Stretch, not Rubber Band.
- Essentia and Rubber Band are not selected for launch unless a future legal/product review re-enables them.
- FFmpeg must be treated as LGPL-configuration-only until reviewed.
- VapourSynth is worker-only and plugins require separate review.
- Sharp + libvips needs dependency/security/LGPL review before production execution.
- AudioFlux and Signalsmith Stretch are worker-only candidates and must not be installed or executed in frontend milestones.
- No worker tool executes before approval, credit reservation, and future backend worker implementation.
- No real audio processing unless a milestone explicitly requests it.
- Audio plans must not enable Veo or change AI-video tier rules.
- Use controlled map tools for geographic/location visuals instead of AI video.
- Map visuals must be planned with layout, safe zones, label readability, and source certainty.
- Do not use AI video to invent exact maps, roads, labels, pins, or geography.
- Documentary/case-study location claims must be treated carefully; unverified locations should use safe wording and approximate visuals.
- Map behind subject/contact object is a depth-aware composition plan, not a map-generation task.
- Do not install or execute map tools unless the milestone explicitly asks for installation.
- Use controlled chart/diagram tools for exact data, labels, arrows, names, money amounts, dates, timelines, and process diagrams.
- Do not use AI video to invent exact charts, data, labels, numbers, accounts, arrows, timelines, or diagrams.
- Data/source certainty must be represented in chart and diagram plans; mock data must be clearly marked.
- Documentary/case-study data and claims must use safe wording when unverified.
- Chart/diagram visuals must preserve safe zones, label readability, and caption readability.
- Do not install or execute chart/dataviz tools unless the milestone explicitly asks for installation.
- Basic and Pro must never create allowed Veo prompts.
- Premium may create Veo prompts only as final fallback/rescue.
- Prompts must preserve matching panel background, safe-margin, and frame-panel instructions.
- Recurring characters must use a character reference pack when stills, keyframes, cards, or animation clips depend on consistent identity.
- GPT-Image-2 should create character anchors, cards, keyframes, start frames, and end frames from the approved character pack.
- Animation prompts should reference the character pack to preserve outfit, silhouette, expression range, style mode, and identity.
- Mention-only people should usually use neutral name cards, lineup cards, or character cards, not full animation.
- Real named people in Documentary / Case Study edits should default to neutral visual treatment unless verified and approved.
- Allegations must not be visually presented as proven facts.
- If claim status is unclear, ask a clarifying question when it changes the edit, or use neutral visuals.
- Workers should preserve character packs and fact-safety plans in approved snapshots.
- Any future planner, model-routing, prompt-builder, QA, or demo scenario changes must preserve the hard validation rules in `planner-regression-validation.md`.
- Basic/Pro no Veo is a blocking validation rule.
- Premium fallback-only Veo is a blocking validation rule.
- No primary/default Veo is a blocking validation rule.
- No default `1080P` generated route is a blocking validation rule.
- Matching panel background policy is a blocking validation rule for AI-video prompt planning.
- Approval before generation is a blocking validation rule.
- Validation utilities should be updated whenever new planner fields are added.
- Chat remains the primary editor; do not turn planning into a giant pre-chat form.
- Required user actions should be obvious and expanded until resolved.
- Advanced technical details should be collapsible and summarized before showing full detail.
- The plan and credit approval path must stay clear even when advanced planning cards are available.
- Developer-heavy cards should not overwhelm users in the guided chat flow.
- Any new planning card must define its priority: required_user_action, user_summary, advanced_plan_detail, safety_detail, or developer_detail.
- Uploaded order is source/story order context, not final edit order.
- Final edit order may differ only after ReeditPro shows the recommended edit structure in the plan.
- Source sequence confirmation must happen before approval in chat.
- Changing source order, clip role, clip notes, important/optional state, or clip list must reset plan approval and mock progress.
- Do not treat uploaded order as final edit order without showing the recommended edit structure first.
- Do not implement real upload, playback, thumbnails, transcoding, or media analysis in frontend mock tasks.
- Lyria Pro integration must remain behind backend/worker boundaries.
- Lyria adapter defaults to mock mode.
- Real Lyria calls must never run in the frontend.
- Never expose Lyria, Google, or service-role secrets to frontend code.
- Never expose Google/Lyria API keys to Vite/browser code.
- Lyria workers must enforce plan approval and credit reservation before generation.
- Worker skeletons are mock-only until explicit real integration is requested.
- Generated music starts as a project asset and must pass Music QA before preview/export use.
- Real generation requires edit plan approval and credit reservation.
- Lyria response parsing must handle text and audio parts in any order.
- Generated music must pass Music QA before use in render/export.
- Do not create real Supabase migrations until an explicit migration milestone.
- Draft SQL files must live in `database/migration-drafts/`.
- Do not create active Supabase migrations in `supabase/migrations/` for draft-review tasks.
- Do not run SQL.
- Do not connect Supabase.
- Approved snapshots are immutable.
- Normal users must not update or delete approved snapshots.
- Worker jobs must reference `approved_plan_snapshot_id`.
- Generation requests must reference `approved_plan_snapshot_id` when approved execution starts.
- Storage buckets are private by default.
- RLS must scope access by workspace/project membership.
- Service role is required for worker writes in future backend work.
- Worker/service writes must be backend/service-role only and audited in future.
- Normal users must not directly mutate worker/job/generation event tables.
- Source media, browser captures, QA artifacts, and generated assets are private by default.
- Browser capture artifacts require privacy and source authorization planning.
- Audit events should be append-only.
- Future credit ledger and reservation tables should be service-controlled and append-only.
- Do not store provider secrets in schema.
- Draft SQL is for review only.
- Future credit ledger and reservation records must be append-only.
- Users must not directly mutate approved snapshots, credit ledger records, or credit reservations.
- Source media and generated assets should be private by default.
- Future RLS must scope access to workspace/project membership.
- Schema planning must preserve Basic/Pro no-Veo and Premium fallback-only Veo through approved snapshot and tier constraints.
- Any future planning layer must connect to the approved snapshot policy.
- Any future execution layer must execute approved snapshots, not raw chat.
- Any future provider or tool execution must respect planner validation rules.
- Do not introduce new one-off planner fields without documenting which layer consumes them.
- Do not add UI cards that overwhelm Guided mode.
- Do not treat frontend mock previews as production rendering.
- Maintain separation between provider models, open-source tools, Remotion renderer, and worker runtime.

## Subscription And Credits

- Personal: `$10/week` software access.
- Personal includes 100 weekly bonus Reedit Credits.
- 100 credits = `$5` retail value.
- Business: `$20/week` software access.
- Business can buy as many credits as needed.
- Subscription is software access.
- Edit Credits pay for AI generation, rendering, and editing usage.

## Design Rules

- Follow the ReeditPro dark premium design system in `design.md`.
- Do not invent random styles, unrelated colors, generic SaaS layouts, or generic dashboard patterns.
- Use design tokens for colors, spacing, typography, radius, borders, shadows, and states.
- Keep the UI modular and ready for future backend/database integration.
- Preserve the official ReeditPro logo assets and brand direction.
- AI chat is the primary editor. The timeline is secondary. Advanced panels should be hidden by default unless the user explicitly opens them.
- The chat is the editor. The AI edits in the background. Inline cards appear only when the AI needs user input, confirmation, approval, or preview.

## Web First, Mobile Later

- Desktop/web product comes first.
- Do not build native mobile unless explicitly asked.
- Do not build mobile companion screens unless explicitly asked.
- Treat mobile as a future companion app, not the main product.

## Signature Systems

The three visual signature systems are:

1. Stroke Motion
2. Graphic Design / VisualExplain
3. Real Motion

SoundSync is not the third visual signature system. SoundSync is the audio and timing support engine.

StoryTiming coordinates captions, cuts, Stroke Motion, Graphic Design / VisualExplain, Real Motion, SoundSync, and story beats.

## StoryTiming

- StoryTiming is the master timing coordination layer.
- Do not duplicate existing timing fields; consolidate and reference them.
- Every generated or edited layer should reference timing anchors where possible.
- Timing must preserve speech meaning, emotional pauses, and viewer comprehension.
- SFX, music, and animation timing should not override speech meaning unless the approved edit is explicitly music-driven.
- Future timing migrations should connect existing planning, edit quality, music, SFX, signature, generation, render, review, and QA timing records.

## Dropdown Workflow Rule

The video type dropdown gives workflow context only. It does not automatically decide which signature systems are used.

All video types can use:

- Stroke Motion
- Graphic Design / VisualExplain
- Real Motion
- SoundSync
- None

The AI planner decides signature usage per segment based on user instructions, video type, edit level, uploaded clip order, transcript, visual footage, reference video style, platform, credit budget, and whether the visual actually improves the video.

## Uploaded Clip Order

Uploaded order means source sequence: the order the user filmed the clips or believes they belong. The AI should respect uploaded order as important context, but it is not automatically the final edit order.

The AI must show:

- Source Sequence Map
- Recommended Edit Structure

The final edit order should not be changed without showing the plan first.

## Reference Video

If the user provides a reference video, AI should study it but not copy it shot-for-shot.

Extract Reference DNA:

- Topic
- Opening style
- Pacing
- Music intro
- Beat changes
- Transition style
- Caption style
- Visual effect style
- Use of Stroke Motion
- Use of Graphic Design / VisualExplain
- Use of Real Motion-style overlays
- Mood and tone
- Why the reference edit works

## Supabase

- Future backend/database work must use the Supabase project named `reeditpro`.
- Do not connect, configure, migrate, or reference the Yuza Studio Supabase project for this repo.
- If Supabase credentials or project refs are introduced later, verify they belong to `reeditpro` before use.
- RP-DATA-04 active migration files under `supabase/migrations/` are for manual local/staging testing only until explicitly approved.
- Do not run Supabase migrations, SQL, or Supabase CLI commands from Codex unless a later task explicitly authorizes execution.
- Approved snapshots, audit events, and credit ledger records must remain protected from normal user mutation.
- Worker/service writes must stay backend/service-role controlled and audited in future implementation.
- Source media, browser captures, generated assets, QA artifacts, previews, and exports are private by default unless a later reviewed policy changes that.
- Worker leases, runtime messages, job claim attempts, and idempotency records are backend/service-role concerns. Frontend code may inspect mock status but must not claim real leases, call Cloud Run/PubSub/Supabase Edge, mutate worker state, or run providers/renderers directly.
- The first backend runtime scaffold is a mock-only Cloud Run API service target under `src/server`. Do not export server-only modules through frontend-facing barrels, and do not deploy Cloud Run, configure Secret Manager, or enable real provider/render/payment handlers unless a later task explicitly asks for it.

## Local Development

- This repo uses Vite, React, and TypeScript for the current web prototype.
- On this Windows machine, use `npm.cmd` instead of `npm` in PowerShell.
- If npm registry certificate verification fails, run commands with `NODE_OPTIONS=--use-system-ca`.

## SoundSync SFX Provider Adapter

- The SFX provider adapter defaults to mock mode.
- Real Mirelo/MMAudio calls must never run in the frontend.
- Never expose SFX provider keys to Vite/browser code.
- Real SFX generation requires edit plan approval and credit reservation.
- SFX response parsing must tolerate unknown provider response shapes.
- Generated SFX must pass trim, mix, and QA before preview/export.
- Generated SFX starts project-only before any library promotion.

## Do Not Implement Unless Asked

Do not implement these without explicit user request:

- Backend logic
- Database migrations
- Stripe integration
- AI API integration
- Video rendering
- Native mobile app
- Mobile companion app
- Unlimited AI editing assumptions
- Generation before approval

## RP-RESERVATION-01 Credit Reservation Boundary

- Mock credit reservation holds `maximumEstimatedCredits` / `requiredHoldCredits`, not `totalEstimatedCredits`.
- Only local in-memory mock wallet available/reserved balances and mock reservation records may change.
- Do not wire live billing, Stripe/payment, Supabase writes, provider calls, production wallet or ledger mutation, settlement, render/export, checkout/top-up, or export unlock for this milestone.
- Use `docs/credit-reservation-max-estimate.md` and `smoke:credit-reservation` when changing the credit reservation surface.
