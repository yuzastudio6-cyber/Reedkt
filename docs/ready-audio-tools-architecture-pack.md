# Ready Audio Tools Architecture Pack

## Purpose

This packet wires the requested audio tools into ReEditPro's backend architecture maps so planners, agents, readiness checks, QA policy, fallback policy, cost-owner coverage, and the backend tool execution gateway can reason about them consistently.

It does not install packages, run audio tools, process media, mutate Dockerfiles, write Supabase, enable external beta, or mark local OSS tools product-ready.

## Requested Tools

The requested audio tools are:

- `librosa`
- `audioread`
- `pydub`
- `scipy`
- `resampy`
- `pyloudnorm`
- `audioflux`
- `music21`
- `pretty_midi`
- `mido`
- `noisereduce`
- `pedalboard`
- `mir_eval`
- `pydub_effects`
- `ebu_r128_pyloudnorm`

Fourteen requested tools are backend-gated architecture candidates. `pedalboard` is intentionally visible but blocked by license/commercial-use review because its package metadata is GPL-3.0. `pydub_effects` and `ebu_r128_pyloudnorm` are capability wrappers over `pydub` and `pyloudnorm`; they are not independent package-source claims.

`signalsmith_stretch` remains an existing ready audio companion in the unified audio lane. The fixed Track B 16-tool handoff set is unchanged.

## Architecture Wiring

The pack updates these surfaces:

- production tool registry IDs and profiles
- QA gate mapping
- fallback-chain mapping
- production-readiness import checks
- unified skill capability registry audio and SOUND lanes
- tool-call intent planner labels
- smoke validation

The backend-facing readiness status is `ready_for_backend_execution` only after the normal hard gates exist: approved plan snapshot, approved credit estimate, active credit reservation, idempotent job/event key, private artifact references, owner/license evidence, and selected worker recipe.

The new ready-audio adapter pack is intentionally separate from the fixed Track B 16-tool handoff set. It provides one-tool-per-job contracts for `dry_run` and `bounded_execution` adapter modes, private input/output manifests, tool result schemas, and QA checks. It is callable from `POST /v1/tool-execution-gateway/dispatch` through `readyAudioAdapterToolId` and `readyAudioAdapterExecutionMode` while preserving backend-only dispatch and idempotent artifact replay.

## Tool Roles

| Tool | Role | Architecture status |
| --- | --- | --- |
| `librosa` | feature, rhythm, onset, and analysis support | backend-gated candidate |
| `audioread` | audio decode support for analysis recipes | backend-gated candidate |
| `pydub` | simple audio slicing/gain/fade recipe support | backend-gated candidate |
| `scipy` | signal processing support for bounded recipes | backend-gated candidate |
| `resampy` | resampling support for audio worker recipes | backend-gated candidate |
| `pyloudnorm` | loudness measurement support | backend-gated candidate |
| `audioflux` | spectral/rhythm analysis support | backend-gated candidate |
| `music21` | symbolic music analysis support | backend-gated candidate |
| `pretty_midi` | MIDI analysis/manipulation support | backend-gated candidate |
| `mido` | low-level MIDI message validation support | backend-gated candidate |
| `noisereduce` | noise-reduction candidate with naturalness QA | backend-gated candidate |
| `pedalboard` | future effects evaluation | license-review gated |
| `mir_eval` | MIR metric QA support | QA-only backend candidate |
| `pydub_effects` | pydub effects wrapper | backend-gated candidate |
| `ebu_r128_pyloudnorm` | pyloudnorm EBU R128 wrapper | backend-gated candidate |

## Adapter/Gateway Flow

The agent-facing flow is:

1. Planner selects a user-facing audio activity such as loudness check, music cue inspection, simple cleanup preparation, MIDI timing analysis, or audio QA.
2. Backend plan records the exact developer/audit tool ID and required private artifact references.
3. User approval and cost gates provide approved snapshot, credit estimate, credit reservation, idempotency, and private input manifest IDs.
4. `server/ready-audio-adapters` validates the selected tool contract, worker ownership, mode, private input coverage, metadata safety, output manifest shape, and QA checks.
5. `server/services/tool-execution-gateway-service.ts` dispatches through `readyAudioAdapterToolId` and records ready-audio output manifests in the worker artifact pipeline.

This flow is mock-safe and contract-only. It does not import the Python packages or process audio in this PR.

## User-Facing Display

Guided chat should not list raw tool names by default. It should describe the edit work in user-facing language such as:

- audio timing analysis
- loudness check
- music cue inspection
- simple cleanup/effects preparation
- audio QA

Raw identifiers remain available for developer/audit review only.

## Still Blocked

The pack does not approve:

- frontend/browser execution
- live worker dispatch
- package installation
- Docker image changes
- real media processing
- external beta or production use
- product-ready local OSS status
- `pedalboard` production use before owner/legal review

Product-ready local OSS count remains `0`.

## Validation

Run:

```bash
npm run smoke:ready-audio-tools-architecture
npm run smoke:prod-tool-registry
npm run smoke:prod-container-readiness
npm run smoke:unified-skill-capability-registry
npm run smoke:tool-call-intent-planner
npm run smoke:tool-execution-gateway
npm run typecheck:server
git diff --check
```
