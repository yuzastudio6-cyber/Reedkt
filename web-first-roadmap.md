# Web-First Roadmap

## Phase 0: Repo Foundation

- Set up repository structure.
- Add initial app scaffold if needed.
- Add `design.md` as design source of truth.
- Confirm Supabase project direction: use `reeditpro`, not Yuza Studio.

## Phase 1: Product Planning Docs

- Create README and AGENTS instructions.
- Document product model, approval gate, pricing, credits, signature systems, Real Motion, intent-led planning, workflow blueprints, and roadmap.
- Do not build backend, mobile, billing, AI APIs, migrations, or rendering.

## Phase 2: Marketing Website

- Build product positioning and website pages using `design.md`.
- Communicate web-first AI editing, edit planning, credit estimates, and approval-before-generation.
- Explain subscription vs credits clearly.

## Phase 3: Desktop Web App Shell

- Build web dashboard shell.
- Add navigation, projects, upload, editor entry, wallet, pricing, brand kit, and exports placeholders.
- Keep mobile app out of scope.

## Phase 4: Upload/Edit Setup Flow

- Build source-order upload flow.
- Add video type dropdown, edit level, mood/style, optional reference video, and custom instructions.
- Capture source sequence intent.

## Phase 5: Intent-Led AI Planning

- Analyze clips, transcript, visual footage, and reference DNA.
- Create Source Sequence Map.
- Create Recommended Edit Structure.
- Route Stroke Motion, Graphic Design / VisualExplain, Real Motion, SoundSync, or none per segment.

## Phase 6: Credit Estimate And Approval Gate

- Show edit plan.
- Show credit estimate.
- Allow user approval or change requests.
- Prevent expensive generation before approval.

## Phase 7: Backend/Database

- Add auth, projects, media, plans, credits, edit plans, approval status, jobs, and exports.
- Use Supabase project `reeditpro`.
- Do not use the Yuza Studio Supabase project.
- Follow RP-DB-01 docs: `database-architecture.md`, `ai-editor-data-model.md`, `edit-quality-engine.md`, `credit-ledger-architecture.md`, `job-orchestration-architecture.md`, `stroke-motion-data-model.md`, `generation-provider-architecture.md`, and `preview-revision-qa-architecture.md`.

## Phase 8: AI/Video Generation Integration

- Integrate AI planning, transcript, visual analysis, reference analysis, signature generation, SoundSync, rendering, and exports.
- Enforce credit estimates and approval gate.
- Refund failed ReeditPro generation according to billing rules.

## Phase 9: Mobile Companion Later

- Build mobile only after the web product is stable.
- Treat mobile as a companion for upload, review, comments, approvals, export monitoring, and status.
- Do not turn mobile into the full editing product unless a future product decision changes scope.
