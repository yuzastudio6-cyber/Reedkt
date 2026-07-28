# Professional Tool Architecture Program Map

## Purpose

This map prevents the tool program from being collapsed into a single lane or a single readiness blocker.
ReEditPro now has one exact production tool count and several implementation
surfaces beneath it:

- **50 canonical private end-to-end production registry tools**.
- **23 launch-core registry tools** for ingest, timeline, audio, render, QA,
  and worker support.
- **38 bounded internal adapter contracts** wired behind professional skills.
- **12 owner-lane accepted core/support tools**: 8 launch-core tools outside the
  bounded adapter pack plus 4 support tools.
- **110 professional skills** across 12 families.
- **44 hidden skill adapter names**; all resolve to one of the 50 tools.
- **0 skill-reference-only names, 0 registry-named-only tools, and 0 promotion
  backlog entries** inside the production registry.

The retired 72-name exploratory catalog is not a production count. The
separate 22-name candidate audit cannot feed planning, approved work, dispatch,
or these totals. The old “53” evidence number was 50 tools plus three
runner-only foundations, not 53 tools.

## Implementation Tiers

| Tier | Meaning | Current Count |
| --- | --- | ---: |
| `skill_architecture_and_bounded_adapter_wired` | Skill/planner hidden adapter references plus backend adapter contracts, source-truth gate planning, QA policy, and smoke coverage exist. | 38 |
| `owner_lane_source_truth_accepted_runtime_gated` | Launch-core/support source truth is accepted from the owning lane. This lane wires around it without re-approval; runtime/product use still follows backend gates. | 12 |
| `skill_reference_only_not_bounded_adapter_wired` | A professional skill references the tool name, but the bounded adapter contract/runner/source-truth path is not wired yet. | 0 |
| `registry_named_only_not_skill_or_adapter_wired` | The name exists only in the production registry surface and should not be treated as implemented. | 0 |

Only the first tier should be described as **bounded adapter-wired**. The owner-lane tier is accepted source truth, not a re-approval backlog. None of the tiers imply paid production, external beta, public delivery, or product-ready execution.

## Source Truth Statuses

Every tool entry also carries an explicit `sourceTruthStatus` so future agents and route planners do not have to infer whether a name is accepted, adapter-wired, or genuinely unresolved.

| Source Truth Status | Count | Meaning |
| --- | ---: | --- |
| `bounded_adapter_source_truth_ready` | 36 | Backend adapter contract exists and can be planned behind approved runtime gates. |
| `bounded_adapter_manifest_evidence_required` | 2 | Backend adapter contract exists, but exact model/checkpoint evidence remains a runtime gate before execution. |
| `owner_lane_source_truth_accepted` | 12 | Owner-lane launch-core/support source truth is accepted and should not be re-approved by this lane. |
| `skill_reference_contract_required` | 0 | A skill references the tool but the bounded adapter contract is missing. |
| `registry_only_model_manifest_required` | 0 | Candidate-only model work cannot occupy the production registry. |
| `registry_only_scope_decision_required` | 0 | Owner-lane support tools are accepted context and should not remain as this lane's scope-decision backlog. |
| `registry_only_evaluation_hold` | 0 | Evaluation-only names live in the separate candidate audit, not this map. |

## Promotion Backlog

The production-registry promotion backlog is empty. Any separately audited
candidate must first earn the complete end-to-end proof and an explicit owner
decision before it can be proposed as a new production tool.

| Promotion Path | Meaning |
| --- | --- |
| `bounded_adapter_contract_and_runner_plan` | The tool is referenced by skills, but needs a bounded adapter contract, source-truth evidence source, runner/skip-safe boundary, manifests, and smoke coverage. |
| `model_weight_owner_review_then_bounded_adapter` | The tool depends on exact model/checkpoint approval before adapter execution can be promoted. Current count: 0 registry-only tools. |
| `scope_decision_before_adapter_work` | The tool name exists in the registry, but product ownership and skill/use-case selection must be decided first. Current count: 0. |
| `not_selected_or_evaluation_hold` | Candidate-only context stays outside the production registry. Current count: 0 registry tools. |

Representative examples:

- `ffmpeg`, `ffprobe`, `libass`, `opencv`, `opentimelineio`, `remotion`, `sharp`, and `signalsmith_stretch`: owner-lane launch-core source truth is accepted for architecture wiring and is not re-approved by this lane.
- `pyav`, `duckdb`, `polars`, and `vapoursynth`: owner-lane support source truth is accepted for architecture wiring and is not re-approved by this lane.
- `deepfilternet`, `rnnoise`, `opencolorio`, `openimageio`, `playwright`, and `pyscenedetect`: canonical private E2E tools in the bounded adapter pack.

## User-Facing Rule

Users should not see package names such as `librosa`, `GPAC`, `D3`, or `MKVToolNix` during the edit flow.
The UI should describe activities:

- Prepare source audio.
- Build visual explanation layers.
- Prepare color and image consistency checks.
- Prepare private review packaging.
- Check foreground treatment.

Developer/source-truth views may show exact tool IDs, evidence, modes, blockers, and worker ownership.

## Current Program Groups

| Group | Count | Purpose | Boundary |
| --- | ---: | --- | --- |
| Launch-core production registry foundation | 23 | Core server registry tools for ingest, timeline, audio, render, and QA foundations. | Owner-lane source truth accepted for architecture wiring; execution remains backend-gated by approved snapshots, private artifacts, QA, and runtime evidence. |
| Owner-lane registry support | 4 | Accepted support tools from other owner lanes that this architecture can route around without re-approval. | Owner-lane source truth accepted for architecture wiring; execution remains backend-gated by approved snapshots, private artifacts, QA, and runtime evidence. |
| Visual, data, and motion adapter pack | 13 | Charts, diagrams, exact text/vector cards, 2D motion, and controlled 3D visual layers. | Backend-approved render/asset handoff only. |
| AI vision and model adapter pack | 2 | Masks, background treatment, and image-processing gates. | Model-backed adapters are wired; execution still requires owner-lane manifest evidence at the approved runtime gate. |
| Speech transcript model adapter pack | 0 | Candidate speech engines do not have canonical private E2E operation evidence. | Candidate capability evidence cannot enter the production registry. |
| Music and audio adapter pack | 17 | Private audio analysis, timing, loudness, cleanup, and music cue support. | Requires private source/audio artifacts and backend package/runtime readiness evidence. |
| Browser, color, and scene adapter pack | 4 | Approved page capture, color/image handling, and scene-boundary preparation. | Backend or render-planning adapter contracts only; no arbitrary browsing, user media, or public artifact output without approved gates. |
| Render packaging validation adapter pack | 2 | Private review container and packaging validation. | Backend-only validation; no public delivery and no frontend execution. |
| Professional skill hidden adapter surface | 44 | Internal packages referenced by user-facing professional skills. | Skills hide package names and require backend-approved gates before execution. |

## Readiness Meaning

The 38 bounded adapter contracts are **wired for planning and backend-gated handoff**, not automatically product-ready.
The 12 owner-lane launch-core/support tools complete the exact 50-tool production registry and are accepted as architecture source truth, not re-opened for this lane to approve.
Every execution still requires the relevant evidence before running:

- approved plan snapshot,
- idempotency key,
- credit estimate and reservation where cost-bearing work applies,
- package/runtime readiness evidence,
- private artifact references instead of raw files or signed URLs,
- model/checkpoint owner approval for model-backed tools,
- QA gates and source-truth records,
- deployment/runbook/observability evidence before product readiness.

Product-ready local OSS count remains `0` until those gates pass.

## Validation

Run:

```bash
npm run tools:architecture-program
npm run smoke:professional-tool-architecture-program
```

The smoke test fails if the map stops resolving to exactly 50 production tools,
marks any mapped tool product-ready by default, allows frontend execution,
loses the 38 bounded adapter pack, loses the 44-name skill surface, loses the
100+ skill surface, pushes accepted owner-lane launch-core/support tools back
into a promotion backlog, admits a non-end-to-end candidate, or removes runtime
evidence gates.
It also fails if individual entries lose their explicit source-truth status, which is what prevents accepted owner-lane tools from being reclassified as this chat's unfinished work.
