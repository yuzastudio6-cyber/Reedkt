# Creative Skill System Repo Audit

## Purpose

This audit establishes the repo context for a future ReeditPro Creative Skill System without implementing the system. The goal is to identify source truths, current readiness, duplicate-lane risk, and a safe handoff for the next docs-only prompt.

## Current Readiness

No direct Creative Skill System implementation was found. Targeted search for `creative skill`, `creative skills`, `skill system`, `skill contract`, `editing_skill`, `skill_id`, and `docs/creative-skills` returned no existing matches before this audit directory was created.

The repo is not empty, though. It already contains a broad planning-first architecture that future skills must respect:

- Chat-native editing, intent capture, source sequence, reference analysis, plan cards, credit estimate, and approval gate are already documented, typed, and mocked.
- Professional edit quality, captions, transitions, audio cleanup, music, SFX, SoundSync, StoryTiming, and QA have existing docs and TypeScript surfaces.
- Signature systems are already defined around Stroke Motion, Graphic Design/VisualExplain, Real Motion, and SoundSync support behavior.
- Provider prompts, generation provider policy, render strategy, Remotion ownership, and tool-vs-AI boundaries are already documented.
- Job orchestration, worker runtime, worker leases, tool calling, and production readiness have extensive existing docs and type contracts.
- Supabase schema planning and many migrations already exist; the audit did not run Supabase CLI, SQL, or migrations.

The Creative Skill System should therefore be introduced later as a coordination and planning-contract layer. It should not replace or fork the existing planning stack.

## Files Inspected

Core product and planning docs inspected or mapped:

- `AGENTS.md`
- `README.md`
- `product-plan.md`
- `intent-led-edit-planning.md`
- `connected-planning-system-overview.md`
- `planning-layer-inventory.md`
- `implementation-status-and-next-phase.md`
- `chat-planning-ux-architecture.md`
- `edit-workflow-blueprints.md`
- `visual-storytelling-architecture.md`

Data model, quality, signature, provider, and runtime docs inspected or mapped:

- `database-architecture.md`
- `ai-editor-data-model.md`
- `edit-quality-engine.md`
- `signature-systems.md`
- `stroke-motion-data-model.md`
- `generation-provider-architecture.md`
- `provider-prompt-architecture.md`
- `job-orchestration-architecture.md`
- `worker-tool-runtime-architecture.md`
- `type-contracts.md`
- `backend-database-roadmap.md`

Tool, sound, reference, and production docs inspected or mapped:

- `open-source-tool-registry.md`
- `soundsync-audio-pipeline-planning.md`
- `docs/reference-video-dna-system.md`
- `docs/storytiming-planner-service.md`
- `docs/chat-native-music-ui.md`
- `docs/chat-native-sfx-ui.md`
- `docs/tool-calling/*`
- `docs/google-cloud/*`
- `docs/production-*`

TypeScript and mock planner surfaces inspected or mapped:

- `src/types/*`
- `src/lib/mock-planner.ts`
- `src/lib/intent-compiler.ts`
- `src/lib/professional-editing-ontology.ts`
- `src/lib/planner-validation.ts`
- `src/lib/tool-registry.ts`
- `server/tool-registry/*`

Supabase migration surface mapped:

- `supabase/migrations/202605130001_core_reeditpro_tables.sql`
- `supabase/migrations/202605130002_intent_edit_planning_tables.sql`
- `supabase/migrations/202605130003_professional_edit_quality_engine.sql`
- `supabase/migrations/202605130004_credit_ledger_approval_gate.sql`
- `supabase/migrations/202605130005_job_orchestration_agent_runs.sql`
- `supabase/migrations/202605130006_stroke_motion_data_model.sql`
- `supabase/migrations/202605130007_generation_providers_generated_assets.sql`
- `supabase/migrations/202605130008_render_preview_export_revision_qa.sql`
- `supabase/migrations/20260518*_reeditpro_*.sql`
- `supabase/migrations/202605190001_sfx_director_tables.sql`
- `supabase/migrations/202605190002_storytiming_master_tables.sql`
- `supabase/migrations/20260520*_*.sql`
- `supabase/migrations/202605210001_e2e_runtime_readiness_tables.sql`

## Existing Architecture To Respect

ReeditPro is a web-first AI video editing product, not a generic creative sandbox. The current architecture repeatedly enforces:

- User intent and source media understanding come before editing.
- Source order means upload/recording sequence, not final edit order.
- Reference DNA is style guidance, not a license to copy structure, lyrics, exact timings, shots, or title sequences.
- Basic edits must still be professional; higher tiers add complexity, generation depth, and review depth, not baseline quality.
- Expensive generation, rendering, provider calls, and credit deduction require approval of the plan and credit estimate.
- Remotion and deterministic tools own exact layout, text, captions, charts, maps, diagrams, and final composition where possible.
- Generative providers are tools inside ReeditPro's plan, approval, credit, QA, and provider policy boundaries.
- Worker runtime and service-role actions belong behind backend boundaries, not frontend mocks.
- Supabase target is `reeditpro`; unrelated projects must not be used.

## Current Gaps

These gaps are appropriate targets for a later docs-only `RP-SKILLS-01` prompt:

- No canonical `CreativeSkill` doctrine or definition exists.
- No skill taxonomy exists for edit skills, visual skills, audio skills, StoryTiming skills, tool-backed skills, or provider-backed skills.
- No skill-to-planning-layer matrix exists.
- No skill planning contract exists to define required inputs, outputs, approval state, credit impact, QA checks, and execution handoff.
- No explicit skill conflict policy exists for overlapping signatures, tools, provider prompts, and worker ownership.
- No skill-specific revision or QA contract exists.

## Constraints

Future Creative Skill System work must not bypass existing gates:

- Do not start generation or rendering from skill selection alone.
- Do not deduct or reserve credits until the existing approval and credit policies allow it.
- Do not let a dropdown or skill label force Stroke Motion, Graphic Design, Real Motion, SoundSync, 3D, browser capture, or any provider.
- Do not create a second source sequence model, prompt architecture, tool registry, worker routing table, provider selector, or Supabase ownership lane.
- Do not treat frontend mock cards as production execution.
- Do not run Supabase CLI, SQL, provider APIs, package installs, worker jobs, or deployments from docs-only prompts.

## Risks

Highest duplicate-lane risks:

- Tool routing and AI graphics ownership are under active open PR review.
- SoundSync, SFX, music, and SOUND CPU worker runtime have active open PR overlap.
- Worker runtime, leases, dry-run gates, and tool execution already have docs, types, migrations, and PR streams.
- Provider prompt architecture already defines how approved plans become provider-specific requests.
- Supabase migrations already cover many records a skill system might be tempted to duplicate.

## Recommended Next Prompt

Use `RP-SKILLS-01 Creative Skill System doctrine` as the next prompt. It should remain docs-only and define the doctrine, taxonomy, planning contract, approval/credit policy, QA policy, and source-of-truth references for skills before any runtime work begins.
