# Connected Planning System Overview

This document explains how the ReeditPro planning system connects the chat-native editor to future approved-snapshot worker execution. It is a frontend/mock architecture map only. It does not implement backend persistence, Supabase migrations, provider calls, tool execution, rendering, billing, or exports.

## Trim Review Layer

Trim Review validates Source Cleanup before timing finalization. It selects retakes with reasons/confidence, validates meaning preservation, blocks risky cuts or unresolved review, and keeps provider prompts, credits, snapshots, and worker contracts locked when review is blocking.

## Editing Agent Execution Layer

Editing Agent Execution sits between approved planning and future worker runtime. It converts the approved plan into a mock async work graph with work items, dependencies, an asset manifest, checkpoints, fallback policy, and checkback policy. It prevents context loss by storing pending provider/tool/render assets as structured manifest records instead of relying on model memory.

The layer is planning-only in this frontend prototype. It does not create queues, call providers, execute tools, render Remotion compositions, store assets, connect backend services, or process media.

## Core Flow

1. The user chooses an editing category so the planner has workflow context.
2. The user uploads or attaches source clips in the order they believe the story belongs.
3. The user confirms the source sequence. Uploaded order is source/story context, not automatic final edit order.
4. The chat asks required setup questions before planning continues.
5. The user confirms format, aspect ratio, and frame layout.
6. The user confirms edit level. Basic is professional and lower-compute, not low quality.
7. The user sets visual preference, optional reference style, and custom instructions.
8. The Intent Compiler turns chat, setup choices, source order, and constraints into structured editing intent.
9. The Video Understanding Report summarizes what the mock footage appears to need.
10. The Adaptive Edit Strategy decides segment-level creative direction instead of applying a template.
11. The Professional Editing Directive sets pacing, color, captions, transitions, b-roll, sound, and custom rules.
12. Segment Edit Operations define worker-ready instructions for cuts, captions, color, audio, visuals, and QA.
13. The Visual Asset Plan decides whether each beat should use source footage, stills, cards, graphics, Stroke Motion, Real Motion, or no extra visual.
14. The Speaker/Visual Layout Plan decides the speaker-to-visual balance for each segment.
15. Depth, foreground, and masking plans describe advanced composition opportunities without executing masks or tracking.
16. Tool and render strategy decide whether Remotion, GPT-Image-2, controlled tools, AI-video assets, or future workers are appropriate.
17. Color and Audio/SoundSync pipelines plan professional polish, including color consistency, cleanup, loudness, music, ducking, SFX, and beat timing. Launch audio analysis is planned around AudioFlux, and launch music stretch/pitch planning is scoped to Signalsmith Stretch.
18. Map, DataViz, and Browser plans handle exact controlled-tool visuals when the edit needs maps, charts, diagrams, or app/browser capture.
19. Character Consistency and Documentary Fact Safety plans handle recurring identity, real people, claims, evidence, and safe wording.
20. The Renderer Composition Plan describes the final Remotion-owned canvas, zones, layers, background policy, captions, and preview constraints.
21. Provider Prompt Plans describe future GPT-Image-2, Wan, Hailuo, Veo fallback, or Remotion briefs derived from the approved plan.
22. Credit Estimate explains expected cost, fallback allowance, policy notes, and lower-cost alternatives.
23. Planner Validation and Planner Regression check hard rules before approval.
24. The user approves the edit plan and credit estimate.
25. The Editing Agent Execution Plan models future async work items, dependencies, asset manifest entries, checkpoints, and checkback/fallback policies.
26. The Approved Plan Snapshot freezes the execution contract. Future workers use the snapshot, not raw chat.
27. The Supabase Schema Bridge maps projects, sessions, media, plan versions, approvals, approved snapshots, jobs, assets, QA, exports, audit events, and private storage buckets for future migrations without creating them yet.
28. Future workers execute approved snapshots only after backend approval and credit reservation.
29. QA checks the output against intent, source order, model routing, layout, frame, color, audio, and professional standards.
30. The user reviews the preview/export and can request revisions, which create a new plan version.

## Planning Principles

- The chat is the editor. Planning cards appear inline only when ReeditPro needs setup, confirmation, approval, progress, preview, or useful detail.
- The timeline is secondary and should remain hidden until the user opens it.
- The planning database and ontology guide the AI, but do not limit custom requests. Custom styles should be stored as directives and mapped to known professional settings.
- Planning is adaptive, not template-based. The video type dropdown gives context; it does not force signature systems.
- Exact maps, charts, diagrams, browser visuals, captions, labels, and data layouts prefer controlled tools and Remotion over AI video.
- AI video is reserved for organic or generative motion that improves the segment.
- Remotion owns final composition. AI models create assets, clips, keyframes, cards, or prompts only.
- Browser-safe previews and tool previews are mock/developer-only until production review.
- The editing agent uses an async work graph so independent tasks can continue while provider/tool jobs are pending, but final render waits for required assets and QA.
- Worker runtime is future-only in this frontend prototype.
- Supabase schema planning is a typed bridge only. It documents future tables, JSONB snapshots, RLS, and private storage, but it does not create migrations or connect Supabase.

## Launch Tool Stack Boundary

The current launch worker/tool candidate stack is planning metadata only:

- VapourSynth is a worker-only frame/video pipeline candidate. Plugin licenses require separate review.
- FFmpeg must be treated as FFmpeg LGPL Configuration until build flags, codecs, patents, and commercial use are reviewed.
- AudioFlux replaces Essentia as the launch audio analysis and SoundSync feature-analysis candidate.
- Signalsmith Stretch replaces Rubber Band as the launch music time-stretch and pitch-adjustment candidate.
- Sharp + libvips is the launch image/asset pipeline candidate and needs dependency, security, and LGPL review before production execution.

Essentia and Rubber Band are not launch defaults. They may remain as future evaluation items only if a later legal/product review re-enables them.

Browser-safe tools such as D3, ECharts, MapLibre GL, Turf, and lottie-web are preview/developer planning surfaces. They are not production rendering and do not authorize browser capture, external site access, or worker execution. Worker-only tools do not run in the frontend.

## Hard Rules Preserved

- User approval and credit estimate approval are required before generation, rendering, or tool execution.
- Workers execute approved snapshots, not raw chat.
- Basic and Pro must never use Veo.
- Premium may use Veo 3.1 Lite only as final fallback or rescue.
- Veo must never be primary or default.
- Generated AI video must not default to 1080P.
- Wan is 720P, Hailuo is 768P, and Veo is 720P when Premium fallback is approved.
- AI video generation defaults to matching frame or panel backgrounds, not transparent AI-video backgrounds.
- Reference DNA is style guidance only, not shot-for-shot copying.
- Browser capture must respect auth, paywalls, CAPTCHAs, robots, rate limits, site restrictions, and privacy rules.
- Documentary and case-study claims, names, evidence, locations, and data must use safe wording when uncertain.
- Production readiness documents are product and engineering planning, not legal advice.

## Current Boundary

The current repo contains documentation, TypeScript types, mock planners, browser-safe UI cards, validation, regression checks, local worker/provider skeletons, and mock music flows. It does not create live backend records, remote Supabase tables, Stripe charges, real provider generations, real rendering, real media analysis, real tool output, real export jobs, or production legal conclusions.

## RP-FRAME-02 Output Frame Gate

The connected planning system now treats aspect ratio/output frame as a required chat-native gate. Recommendations can appear early, but approval, provider prompt execution, renderer readiness, worker runtime, final export planning, and approved snapshots require a confirmed frame.

Changing the frame resets approval, progress, preview, and approved snapshot state so downstream plans can be rebuilt around the new canvas.

## Master Timing Layer

ReeditPro now includes a mock Master Timing Plan before renderer/provider execution. It coordinates final segment ranges, captions, visual cues, transitions, SFX, music ducking, provider clip placement, and Remotion layer timing with frame ranges.

Frames are the execution unit and seconds are display values. If the output frame is not confirmed, Master Timing stays `needs_frame_confirmation` and approval remains blocked. Transcript and beat timing remain mock-only until future transcript alignment, AudioFlux audio analysis, and media workers exist.

## Caption + Visual Cue Timing Layer

Caption + Visual Cue Timing refines Master Timing with caption chunk timing, caption animation policy, visual cue trigger timing, read-time holds, and collision recommendations. It keeps captions and visuals tied to speech meaning and safe zones before renderer, prompt, credit, and QA planning consume the timing.

The layer is typed mock metadata only. It does not run transcript alignment, speech-to-text, AudioFlux, Remotion, providers, or media tools.

## SoundSync + Transition Timing Layer

SoundSync + Transition Timing refines Master Timing transition, SFX, and music ducking timing after captions and visual cues have frame-accurate planning. It adds deterministic mock beat grids, music phrase sections, beat snap decisions, refined transitions, cue-linked SFX, and ducking ranges.

Speech clarity beats beat alignment. Beat cuts snap to phrase boundaries when a beat would cut through important speech. SFX must link to visual or transition cues and include a reason. Music ducking protects voice clarity. AudioFlux is the future analysis worker represented in the plan, but no real beat detection, audio analysis, media processing, provider call, or render runs in this frontend mock.

## Timing Validation + Credit Impact Layer

Timing Validation validates Master Timing, Caption + Visual Cue Timing, and SoundSync + Transition Timing before approval. It checks confirmed frame, timing base, frame ranges, caption readability, visual read time, transition speech safety, cue-linked SFX, voice ducking, provider clip duration, Remotion layer timing, tier complexity, and timing credit impact.

Blocking or failed timing validation locks approval and approved snapshot creation. The credit estimate includes timing credits and lower-cost timing alternatives. This remains mock-only and does not run transcript alignment, AudioFlux, FFmpeg, Signalsmith Stretch, Remotion, media tools, backend jobs, provider calls, or real billing.
## Source Cleanup + Selects

`SourceCleanupPlan` sits after source sequence/video understanding and before final segment timing. It asks the user to confirm cleanup aggressiveness, then records mock keep/cut/tighten/preserve/repurpose decisions with reasons.

The layer feeds segment operations, Master Timing source ranges, prompt notes, credits, QA, validation, audit, and approved snapshots. It is mock-only until future transcript/media workers can verify silence, fillers, retakes, and exact trim frames.
## RP-AGENT-02 Async Reconciliation Layer

`AsyncAssetReconciliationPlan` sits after `EditingAgentExecutionPlan`. It models mock checkbacks, dependency readiness, asset merge/reconciliation, version selection, final render readiness, and preview placeholder policy.

Completed assets are not considered usable until they are represented in the asset manifest, linked to segment/timing/renderer targets, QA-checked, and reconciled. Final render readiness depends on required assets and QA; preview placeholders are preview-only unless a later approved fallback changes the requirement.

No real webhook, polling, provider status check, worker event, storage, backend, media processing, or rendering runs in this frontend planning layer.

## RP-AGENT-03 Agent QA + Fallback Layer

`AgentQAFallbackPlan` sits after the execution graph and async reconciliation layer. It defines QA gates, likely failure scenarios, fallback actions, and fallback decisions so failed outputs cannot silently enter final render.

Fallback decisions are constrained by the approved plan: local failures should not stop unrelated work, global failures block final render/export, Basic/Pro never fallback to Veo, and Premium Veo remains final fallback only for approved AI video assets.

No real QA, retry, fallback execution, provider call, worker event, storage, billing, media processing, or rendering runs in this frontend planning layer.
