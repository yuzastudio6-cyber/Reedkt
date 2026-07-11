# Professional Tool Architecture Program Map

## Purpose

This map prevents the tool program from being collapsed into a single lane or a single readiness blocker.
ReEditPro now has multiple tool source-truth surfaces:

- **72 production registry entries**: server-only tool profiles, including launch-core tools, aliases, support tools, future tools, and evaluation-only tools.
- **24 launch-core registry tools**: the first production-readiness foundation set for ingest, timeline, audio, render, QA, and worker support.
- **50 bounded internal adapter contracts**: the user-named adapter pack currently wired behind professional skills for dry-run, readiness, and bounded backend execution gates.
- **109 professional skills** across 12 families: the user-facing edit capabilities that hide internal package names.
- **55 hidden skill adapter names**: the broader internal package surface referenced by skills; some names are owner-lane launch-core/support tools or registry-only and are intentionally not part of the 50-tool bounded adapter pack.
- **13 owner-lane accepted tools**: 9 launch-core plus 4 support tools accepted from their owner lanes for architecture wiring; this lane does not re-approve them.
- **0 skill-reference-only names**: all current hidden skill adapter names are now either bounded-adapter wired or owner-lane accepted; remaining unimplemented names are registry-named-only.
- **9 registry-named-only tools**: present in the server production registry but not yet wired into the skill/adapter architecture.
  - **4 model/checkpoint manifest lanes**: `paddleocr`, `mediapipe`, `demucs`, and `film`.
  - **5 not-selected/evaluation holds**: `soundtouch`, `rubber_band`, `essentia`, `cesium_js`, and `revideo`.

These counts are intentionally different. Track B's original media/audio OSS lane, the broader user-named adapter pack, hidden skill references, and the production registry are not interchangeable.

## Implementation Tiers

| Tier | Meaning | Current Count |
| --- | --- | ---: |
| `skill_architecture_and_bounded_adapter_wired` | Skill/planner hidden adapter references plus backend adapter contracts, source-truth gate planning, QA policy, and smoke coverage exist. | 50 |
| `owner_lane_source_truth_accepted_runtime_gated` | Launch-core/support source truth is accepted from the owning lane. This lane wires around it without re-approval; runtime/product use still follows backend gates. | 13 |
| `skill_reference_only_not_bounded_adapter_wired` | A professional skill references the tool name, but the bounded adapter contract/runner/source-truth path is not wired yet. | 0 |
| `registry_named_only_not_skill_or_adapter_wired` | The name exists only in the production registry surface and should not be treated as implemented. | 9 |

Only the first tier should be described as **bounded adapter-wired**. The owner-lane tier is accepted source truth, not a re-approval backlog. None of the tiers imply paid production, external beta, public delivery, or product-ready execution.

## Source Truth Statuses

Every tool entry also carries an explicit `sourceTruthStatus` so future agents and route planners do not have to infer whether a name is accepted, adapter-wired, or genuinely unresolved.

| Source Truth Status | Count | Meaning |
| --- | ---: | --- |
| `bounded_adapter_source_truth_ready` | 42 | Backend adapter contract exists and can be planned behind approved runtime gates. |
| `bounded_adapter_manifest_evidence_required` | 8 | Backend adapter contract exists, but model/checkpoint evidence remains a runtime gate before execution. |
| `owner_lane_source_truth_accepted` | 13 | Owner-lane launch-core/support source truth is accepted and should not be re-approved by this lane. |
| `skill_reference_contract_required` | 0 | A skill references the tool but the bounded adapter contract is missing. |
| `registry_only_model_manifest_required` | 4 | Registry-only tool needs exact model/checkpoint manifest work before adapter promotion. |
| `registry_only_scope_decision_required` | 0 | Owner-lane support tools are accepted context and should not remain as this lane's scope-decision backlog. |
| `registry_only_evaluation_hold` | 5 | Registry-only tool is not selected or evaluation-only and stays out of execution planning. |

## Promotion Backlog

Every ambiguous/non-selected registry-only tool must have a concrete next gate:

| Promotion Path | Meaning |
| --- | --- |
| `bounded_adapter_contract_and_runner_plan` | The tool is referenced by skills, but needs a bounded adapter contract, source-truth evidence source, runner/skip-safe boundary, manifests, and smoke coverage. |
| `model_weight_owner_review_then_bounded_adapter` | The tool depends on exact model/checkpoint approval before adapter execution can be promoted. Current count: 4. |
| `scope_decision_before_adapter_work` | The tool name exists in the registry, but product ownership and skill/use-case selection must be decided first. Current count: 0. |
| `not_selected_or_evaluation_hold` | The tool is future/evaluation/not-selected context and should stay out of execution planning unless an owner promotes it. Current count: 5. |

Representative examples:

- `ffmpeg`, `ffprobe`, `hyperframe`, `libass`, `opencv`, `opentimelineio`, `remotion`, `sharp`, and `signalsmith_stretch`: owner-lane launch-core source truth is accepted for architecture wiring and is not re-approved by this lane.
- `pyav`, `duckdb`, `polars`, and `vapoursynth`: owner-lane support source truth is accepted for architecture wiring and is not re-approved by this lane.
- `faster_whisper`, `whisper_cpp`, `deepfilternet`, `rnnoise`, `opencolorio`, `openimageio`, `playwright`, `maplibre`, `turf`, `deck_gl`, and `pyscenedetect`: promoted into the bounded adapter pack and no longer treated as skill-reference-only.
- `paddleocr`, `mediapipe`, `demucs`, `film`: `model_weight_owner_review_then_bounded_adapter`
- `rubber_band`, `essentia`, `revideo`, `cesium_js`, `soundtouch`: `not_selected_or_evaluation_hold`

## User-Facing Rule

Users should not see package names such as `librosa`, `GPAC`, `D3`, `SAM2`, or `MKVToolNix` during the edit flow.
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
| Launch-core production registry foundation | 24 | Core server registry tools for ingest, timeline, audio, render, and QA foundations. | Owner-lane source truth accepted for architecture wiring; execution remains backend-gated by approved snapshots, private artifacts, QA, and runtime evidence. |
| Owner-lane registry support | 4 | Accepted support tools from other owner lanes that this architecture can route around without re-approval. | Owner-lane source truth accepted for architecture wiring; execution remains backend-gated by approved snapshots, private artifacts, QA, and runtime evidence. |
| Visual, data, and motion adapter pack | 13 | Charts, diagrams, exact text/vector cards, 2D motion, and controlled 3D visual layers. | Backend-approved render/asset handoff only. |
| AI vision and model adapter pack | 8 | Model runtime foundations, masks, background treatment, and enhancement gates. | Model-backed adapters are wired; execution still requires owner-lane manifest evidence at the approved runtime gate. |
| Speech transcript model adapter pack | 2 | Speech transcript and timing adapters for approved private source audio. | Backend-only speech adapters require owner-lane model manifest evidence, private audio refs, and approved snapshots before execution. |
| Music and audio adapter pack | 17 | Private audio analysis, timing, loudness, cleanup, and music cue support. | Requires private source/audio artifacts and backend package/runtime readiness evidence. |
| Map, browser, color, and scene adapter pack | 7 | Map geometry, approved page capture, color/image handling, and scene-boundary preparation. | Backend or render-planning adapter contracts only; no arbitrary browsing, user media, or public artifact output without approved gates. |
| Render packaging validation adapter pack | 3 | Private review packaging, container validation, and internal render pipeline support. | Backend-only validation; no public delivery and no frontend execution. |
| Professional skill hidden adapter surface | 55 | Internal packages referenced by user-facing professional skills. | Skills hide package names and require backend-approved gates before execution; this includes both bounded-adapter-wired and reference-only names. |

## Readiness Meaning

The 50 bounded adapter contracts are **wired for planning and backend-gated handoff**, not automatically product-ready.
The 13 owner-lane launch-core/support tools are accepted as architecture source truth, not re-opened for this lane to approve.
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

The smoke test fails if the map collapses the architecture into one ambiguous tool count, marks any mapped tool product-ready by default, allows frontend execution, loses the 50 bounded adapter pack, loses the 55-name skill surface, loses the 100+ skill surface, pushes accepted owner-lane launch-core/support tools back into this lane's promotion backlog, mixes named-only tools into implemented adapter counts, or removes runtime evidence gates.
It also fails if individual entries lose their explicit source-truth status, which is what prevents accepted owner-lane tools from being reclassified as this chat's unfinished work.
