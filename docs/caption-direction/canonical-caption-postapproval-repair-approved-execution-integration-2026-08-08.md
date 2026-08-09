# Canonical Caption Postapproval Repair Approved-Execution Integration

Date: 2026-08-08

Milestone: post-CAP-20 approved-execution continuation — repair,
recomposition, and Caption-specific inspection

Status: passed as approved source/internal execution. Private visual
qualification remains blocked on actual canonical QA evidence and complete-time
inspection.

## Outcome

The Caption execution owner now has one typed postapproval selection lifecycle
for the ordered correction chain:

1. `repair_caption_scene`;
2. `recompose_caption_output`; and
3. `inspect_caption_specific_result`.

The chain is not inferred from an early creative preset. In authenticated mode,
it is selected only after an approved Caption execution has produced exact QA,
repair, recomposition, inspection, and postrender lineage. The non-qualifying
source fixture proves that same structure without claiming actual QA or repair
need. The selection record binds the prior approved source scope and execution
package to one new target planning scope, confirmed frame, MasterTiming
authority, output, scene, and frame range. The Caption planner rereads the
create-only selection twice before adding the three jobs, and the execution
owner rereads it again before admitting any work item.

Two explicitly separated evidence modes exist:

- `source_contract_fixture` proves the structural continuation against a new
  approved internal correction package, while keeping private qualification,
  actual repair need, and same-edit revision claims false; and
- `authenticated_private_caption_qa` is reserved for a canonical same-edit
  revision backed by actual private QA evidence and an actual repair need.

The source fixture uses a separate internal edit-session/package scope and maps
the same output, confirmed-frame content, authorized frame interval, and
MasterTiming contract version into a newly approved correction plan. It does
not reuse the source MasterTiming artifact or scene ID as target execution
authority. The authenticated mode instead requires the exact same edit session,
scene, frame content, and MasterTiming content through the canonical revision
owner.

Both modes preserve the prior immutable approved snapshot. Neither can mutate
the old plan, create work, dispatch a runtime, create assets, approve QA, charge
credits, deliver publicly, or claim production readiness.

## Approved execution campaign

The target campaign contains nine separate approved snapshots and execution
packages. The ninth package is a distinct approved internal correction plan
projected from the exact source evidence; it does not overwrite or reopen the
source snapshot and does not masquerade as a same-edit revision.

- Supported Caption job types: 41
- Target covered by approved source/internal execution: 30
- Target still missing approved source/internal execution: 11
- Newly covered in this milestone:
  - `repair_caption_scene`
  - `recompose_caption_output`
  - `inspect_caption_specific_result`
- Exact reread required: yes
- Identical replay required: yes
- Terminal qualification claimed: no
- Campaign receipt digest:
  `938b1c971ba9db85193b81fb92a5f91160d062e995530ccd74d01edffbad7584`

## Contracts

- `canonical-caption-postapproval-job-selection-record-v1`
- `canonical-caption-postapproval-job-selection-read-port-v1`
- `canonical-caption-postapproval-job-selection-repository-v1`
- `canonical_caption_postapproval_job_selection` internal execution gate
- `source_contract_fixture`
- `authenticated_private_caption_qa`
- `new_approved_internal_correction_package`
- `canonical_same_edit_session_revision`

The record is a closed, byte-free contract. It carries refs and hashes only;
raw media, chat, prompts, commands, paths, URLs, credentials, provider payloads,
and arbitrary executable text are rejected.

## Existing owners reused

- canonical plan, estimate, approval, immutable snapshot, execution-package,
  work-graph, asset-manifest, reservation, and worker-lease owners;
- StoryTiming/MasterTiming frame authority;
- canonical Caption source-led planning owner;
- canonical Caption execution owner;
- Caption deterministic QA, repair-decision, recomposition, inspection, and
  postrender visual-review boundaries;
- canonical private create-only JSON persistence and exact-reread owner.

## Duplicate owners avoided

- no second Caption planner or execution dispatcher;
- no separate repair or recomposition queue;
- no parallel timeline, StoryTiming, or MasterTiming clock;
- no mutation of the prior approved snapshot;
- no duplicate work graph, asset manifest, estimate, reservation, billing, or
  final-QA owner;
- no browser-local completion and no Orchestra implementation.

## Tests

- `smoke:canonical-caption-postapproval-job-selection`: 29 assertions, passed.
- `smoke:captions-specialist-cap-02`: 37 assertions, passed.
- `smoke:captions-specialist-cap-16`: 39 assertions, passed with explicit
  complete-time AI, export, and independent-final-QA gates.
- `smoke:canonical-caption-source-led-professional-planning-owner`: 189 checks,
  passed.
- `smoke:canonical-caption-specialist-planning`: 64 checks, passed.
- `smoke:canonical-caption-specialist-execution`: 54 checks, passed.
- targeted ESLint: passed.
- server TypeScript check with the repository-required 8 GB heap: passed.
- full ESLint: passed.
- full TypeScript/Vite build: passed, 2,969 modules transformed.
- frontend/server boundary: passed for 1,159 files.
- current-tree secret scan: passed for 7,007 files.
- reachable-history secret scan: passed for 16,518 unique blobs.
- `smoke:canonical-caption-broll-approved-run-harness`: passed with nine
  approved runs, 30 covered jobs, 11 missing jobs, exact campaign reread, and
  identical replay.

The campaign exposed three real boundary defects while the correction lane was
being integrated: crossed target scope, plan-local ref identity, and attempted
replacement publication without a revision handoff. The final source fixture
uses a distinct internal correction package, keeps source and target authority
separate, and requires exact frame content/range plus versioned timing
compatibility. The authenticated mode remains same-edit and revision-only. No
validator was bypassed.

## Media inspected

None. This milestone adds typed source/internal planning, persistence, and
execution admission. It does not generate or inspect new image, video, or audio
evidence and makes no professional-appearance claim.

## Defects and repairs

1. The initial target did not state how source evidence projected into its new
   planning scope, so the source/target guard rejected it before work creation.
2. A follow-up incorrectly required plan-local frame/timing ref IDs to remain
   identical across plans; the contract now requires identical frame contract
   version/content and independently binds each full local ref.
3. An attempted same-edit replacement correctly failed because no canonical
   revision handoff existed.
4. The structural fixture now creates a separate approved correction package;
   real same-edit repairs remain gated by the existing revision owner and
   authenticated QA mode.
5. The source snapshot remains immutable and the source fixture remains
   non-qualifying.

## Limitations and blockers

The source fixture proves contract wiring only. Actual private qualification
still requires canonical Caption QA to establish a real repair need, a new
same-edit-session revision and approval, repaired media, deterministic QA,
complete-time direct visual inspection, authenticated qualified visual review,
private review, and final independent QA. No provider, GPU, model, media
renderer, public delivery, billing, or production authority is promoted here.

## Remaining target approved-execution gaps

1. `plan_caption_to_visual_handoff`
2. `resolve_caption_mode_transition`
3. `inspect_caption_boundary_behavior`
4. `provide_speech_derived_typography_spec`
5. `provide_caption_phrase_lineage`
6. `provide_caption_safe_region_constraints`
7. `provide_caption_to_visual_handoff_spec`
8. `provide_accessible_text_projection`
9. `provide_typographic_transition_component`
10. `provide_caption_broll_composition_constraints`
11. `provide_caption_living_frame_handoff_constraints`

Safe work completed: typed postapproval selection, create-only persistence,
exact source/target lineage, planner reread, execution reread, immutable source
snapshot preservation, and closed authority boundaries.

Next: finish the remaining typed Caption support/handoff jobs, then run the
real-media, accessibility, complete-time visual, repair/reinspection, and
whole-specialist private qualification matrix.
