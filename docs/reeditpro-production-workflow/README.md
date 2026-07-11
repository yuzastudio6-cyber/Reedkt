# ReeditPro Production AI Editing Workflow

This folder defines the production architecture for ReeditPro's AI-native editing flow. It is the implementation foundation for future milestones that will add records, UI, API routes, workers, provider integrations, rendering, QA automation, and export behavior.

Core flow:

```text
Upload
-> Footage Prep
-> Clean Assembly
-> Optional Edit Brief/Edit Cues
-> AI Edit Plan
-> Professional Integration
-> QA
-> Preview
-> Edit Map
-> Revision/Export
```

ReeditPro is not a timeline-first editor. The user gives direction, the AI performs professional editing execution, and expensive generation or rendering starts only after the user approves the plan and credit estimate.

Milestone 2 adds shared TypeScript workflow contracts in `src/types` for future UI, mock runtime, API, database, worker, QA, render, Edit Map, and revision milestones.

Milestone 3 adds a deterministic mock Footage Prep runtime under `src/lib/footage-prep`. It simulates Source Understanding, Cleanup Plan, Clean Assembly, Source Time Mapping, Prep Summary, and Workflow Activity Events without real provider calls or media processing.

Milestone 4 adds the first Footage Prep UI under `src/components/editor/footage-prep`. It displays the deterministic mock runtime output inside the chat-native editor without database, provider, render, worker, or Supabase production wiring.

Milestone 5 adds a non-destructive local cleanup review engine and UI controls so users can restore, accept, mark important, or mark do-not-use cleanup decisions before creative planning. This remains mock/local and does not add database or provider wiring.

Milestone 6 adds a local Source Library role review layer. It lets users confirm or override AI-suggested asset roles, priorities, notes, and do-not-use choices before Edit Brief/Edit Cues and AI planning. This remains local/mock and does not add database or provider wiring.

Milestone 7 adds a local optional Edit Brief layer. It lets users define the goal, audience, platforms, target duration, style, pacing, caption/music preferences, B-roll preferences, asset rules, brand notes, and special instructions before AI planning. This remains local/mock and does not add database or provider wiring.

Milestone 8 adds a local Edit Cues layer. It lets users create precise instructions attached to Clean Assembly time, transcript segments, scenes, assets, or global rules before AI planning. Cues remain local/mock and are planning inputs only; Professional Integration will later turn them into polished edit decisions.

Milestone 9 adds local Edit Cue remapping and conflict resolution. Raw-source timestamp cues can be mapped to Clean Assembly timing using Source Time Mappings, and obvious cue conflicts can be detected/resolved locally before AI planning. This remains local/mock and does not add database, worker, provider, or render wiring.

Milestone 10 adds a local Planning Context layer and makes the mock AI Edit Plan consume the Clean Assembly, Cleanup Review, Source Library, Edit Brief, Edit Cues, remapping results, and cue conflicts. It remains local/mock and does not add database, worker, provider, render, Professional Integration, or Supabase wiring.

Milestone 11 adds a local Professional Integration planner and treatment UI. It turns Planning Context, Edit Brief, Edit Cues, and Source Library assets into professional treatment decisions for B-roll, overlays, assets, and cue compliance checks. This remains local/mock and does not add database, worker, provider, render, or Supabase wiring.

Milestone 12 adds a local Professional QA engine and preview readiness gate. It checks Planning Context and Professional Integration for cue compliance, overlay safety, B-roll/audio treatment, privacy, caption/face collision risk, safe zones, readability, source integrity, and blocking issues before preview/generation. This remains local/mock and does not add database, worker, provider, render, or Supabase wiring.

Milestone 13 adds a local Generation Readiness, mock credit estimate, approval, and mock preview job orchestrator. It checks Planning Context, Professional Integration, and Professional QA before simulating a preview job. This remains local/mock and does not add database, worker, provider, real render, billing, or Supabase wiring.

Milestone 14 adds a local Edit Map / Edit Graph layer after mock preview readiness. It turns the preview into connected editable systems, groups, and elements, with local non-destructive operations for selection, scope, visibility, lock state, style patches, regeneration requests, delete/restore, and operation history. This remains local/mock and does not add database, worker, provider, real render, revision, export, or Supabase wiring.

Milestone 15 adds local Revision Requests and a mock revision job pipeline for post-preview Edit Map operations. It classifies operations as local-only, rerender, AI regeneration, or premium generation; creates mock revision credit estimates and approvals when needed; and produces local preview/Edit Map version records. This remains local/mock and does not add database, worker, provider, real render, billing, or Supabase wiring.

Milestone 16 adds local Export Readiness and a mock export pipeline. It checks the latest preview/Edit Map version, pending Edit Map operations, revision state, QA readiness, export targets, settings, mock estimate, approval, and mock export job/output records. This remains local/mock and does not add database, worker, provider, real render/export, billing, file generation, or Supabase wiring.

Milestone 17 adds RP-DB-11, the production database foundation for Footage Prep and Source Understanding. It stores Footage Prep sessions, asset analysis reports, transcript segments/words, scene segments, silence regions, retake groups, source quality flags, and Source Understanding Maps with RLS, indexes, comments, and validation checks. It does not wire the frontend to Supabase yet.

Milestone 18 adds RP-DB-12, the production database foundation for Cleanup Plan and Clean Assembly. It stores cleanup plans, cleanup items, non-destructive clean assemblies, clean assembly segments, source time mappings, cleanup review cards, review item states, and review operations with RLS, indexes, constraints, comments, and validation checks. It does not wire the frontend to Supabase yet.

Milestone 19 adds RP-DB-13, the production database foundation for Edit Brief and Edit Cues. It stores optional creative direction, cue anchors, cue assets, cue remapping, cue conflicts, cue-to-plan mappings, and chat card links with RLS, indexes, constraints, comments, and validation checks. It does not wire the frontend to Supabase yet.

## Documents

1. [End-to-end AI editing workflow](./01-end-to-end-ai-editing-workflow.md)
2. [Footage Prep + Clean Assembly](./02-footage-prep-clean-assembly.md)
3. [Edit Brief + Edit Cues](./03-edit-brief-and-edit-cues.md)
4. [Professional Integration Pipeline](./04-professional-integration-pipeline.md)
5. [Edit Map / Edit Graph](./05-edit-map-edit-graph.md)
6. [Project State Machine](./06-project-state-machine.md)
7. [Database Expansion Plan](./07-database-expansion-plan.md)
8. [Codex Implementation Rules](./08-codex-implementation-rules.md)

## Non-goals Of Milestone 1

- No full UI implementation.
- No database migrations.
- No API routes.
- No worker orchestration.
- No real provider calls.
- No real render jobs.
- No production Supabase wiring.
