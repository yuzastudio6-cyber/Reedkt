# Connected Planning System Overview

This document explains how the ReeditPro planning system connects the chat-native editor to future approved-snapshot worker execution. It is a frontend/mock architecture map only. It does not implement backend persistence, Supabase migrations, provider calls, tool execution, rendering, billing, or exports.

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
25. The Approved Plan Snapshot freezes the execution contract. Future workers use the snapshot, not raw chat.
26. The Supabase Schema Bridge maps projects, sessions, media, plan versions, approvals, approved snapshots, jobs, assets, QA, exports, audit events, and private storage buckets for future migrations without creating them yet.
27. Future workers execute approved snapshots only after backend approval and credit reservation.
28. QA checks the output against intent, source order, model routing, layout, frame, color, audio, and professional standards.
29. The user reviews the preview/export and can request revisions, which create a new plan version.

## Planning Principles

- The chat is the editor. Planning cards appear inline only when ReeditPro needs setup, confirmation, approval, progress, preview, or useful detail.
- The timeline is secondary and should remain hidden until the user opens it.
- The planning database and ontology guide the AI, but do not limit custom requests. Custom styles should be stored as directives and mapped to known professional settings.
- Planning is adaptive, not template-based. The video type dropdown gives context; it does not force signature systems.
- Exact maps, charts, diagrams, browser visuals, captions, labels, and data layouts prefer controlled tools and Remotion over AI video.
- AI video is reserved for organic or generative motion that improves the segment.
- Remotion owns final composition. AI models create assets, clips, keyframes, cards, or prompts only.
- Browser-safe previews and tool previews are mock/developer-only until production review.
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
