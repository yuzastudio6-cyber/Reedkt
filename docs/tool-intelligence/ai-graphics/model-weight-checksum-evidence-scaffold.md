# AI Graphics Model-Weight Checksum Evidence Scaffold

Decision: `ai_graphics_model_weight_checksum_evidence_scaffold_prepared_for_local_private_records`

Branch: `codex/rp-ai-graphics-tool-call-readiness-contract`

Draft PR: [#862](https://github.com/yuzastudio6-cyber/Reedkt/pull/862)

## Purpose

This packet adds a local-only scaffold command for private checksum evidence
records. These records are the required SHA/provenance input before the five AI
graphics model-weight tools can author reviewed private manifests and then move
to native NVIDIA proof.

It does not download model weights, load models, run inference, run GPU, run
Tool Routes, run Workers, call providers, process media, create signed URLs,
create public artifacts, or unlock runtime, beta, or production.

## Scope

- `sam2`
- `birefnet`
- `real_esrgan`
- `rembg`
- `transparent_background`

The scaffold writes local-only checksum evidence templates:

- `sam2/checksum-evidence.json`
- `birefnet/checksum-evidence.json`
- `real-esrgan/checksum-evidence.json`
- `rembg/checksum-evidence.json`
- `transparent-background/checksum-evidence.json`

It also writes local-only authoring support files:

- `checksum-evidence-authoring-checklist.json`
- `CHECKSUM_EVIDENCE_AUTHORING_CHECKLIST.md`

The checksum evidence validator ignores `checksum-evidence-authoring-checklist.json`
so the checklist cannot be mistaken for an evidence record.

## Source Candidate Guidance

Each scaffold record is linked to the current model-weight source catalog:

- `sam2`: `facebook_sam2_1_hiera_tiny_existing_staging_evidence`; ready for checksum evidence drafting from existing internal evidence after private refs are authored.
- `birefnet`: `zhengpeng7_birefnet_official_weights_review_candidate`; ready for checksum evidence drafting from existing internal evidence after private refs are authored.
- `real_esrgan`: `xinntao_real_esrgan_x4plus`; ready for checksum evidence drafting from existing internal evidence after private refs are authored.
- `rembg`: `danielgatis_rembg_isnet_general_use_review_candidate`, artifact candidate `isnet-general-use.onnx`; blocked until source/license/checksum/provenance/quality/security review accepts the selected candidate.
- `transparent_background`: `plemeri_transparent_background_base_ckpt_review_candidate`, artifact candidate `ckpt_base.pth`; blocked until source/license/checksum/provenance/quality/security review accepts the selected candidate.

Suggested checksum guidance is included for local authoring:

- `sam2`: `45ad40cc297713cf822419c5b94a7025f80e96525fb2b9cb9b47a1bf4350c2b2`.
- `birefnet`: `1e4044aa39d94e3f9c07e2e73d7ff78883c4838e90d678bcb8f3fc075db811e7`.
- `real_esrgan`: `4fa0d38905f75ac06eb49a7951b426670021be3018265fd191d2125df9d682f1`.
- `rembg`: `requires_private_artifact_sha256`.
- `transparent_background`: `requires_private_artifact_sha256`.

Each checksum must still match the reviewed private artifact. These suggestions
do not approve private manifests, model downloads, model loading, inference,
GPU runtime, beta, or production.

## Command

Use a local-only path, preferably under `.local-artifacts`, and do not commit
the generated files:

```bash
npm run --silent ai-graphics:model-weight-checksum-evidence-scaffold -- --out-dir .local-artifacts/ai-graphics/model-weight-checksum-evidence
```

Use `--force` only when intentionally replacing local scaffold files:

```bash
npm run --silent ai-graphics:model-weight-checksum-evidence-scaffold -- --out-dir .local-artifacts/ai-graphics/model-weight-checksum-evidence --force
```

## Safety Defaults

The generated templates are intentionally invalid until owner-reviewed:

- `checksumEvidenceRef` starts with `public://replace-with-reviewed-private-checksum-evidence/...`, which validation rejects.
- `sourceArtifactRef` starts with `public://replace-with-reviewed-private-source-artifact/...`, which validation rejects.
- `artifactSha256` is either the existing source-catalog guidance or `REPLACE_WITH_64_HEX_SHA256`; it still requires private artifact review.
- All review booleans are `false`.
- The local checklist reports `committedChecksumEvidenceApproved=false` for every tool.

This prevents a placeholder scaffold from accidentally becoming manifest
authoring input.

## Validation Flow

After filling the local private records, validate them:

```bash
npm run --silent ai-graphics:model-weight-checksum-evidence:validate -- --evidence-dir .local-artifacts/ai-graphics/model-weight-checksum-evidence
```

Then create or update private model-weight manifests and validate them:

```bash
npm run --silent ai-graphics:model-weight-manifest-review:validate -- --manifest-dir .local-artifacts/ai-graphics/model-weight-manifests
```

Then create the GPU proof command plan:

```bash
npm run --silent ai-graphics:gpu-runtime-proof-command-plan -- --manifest-dir .local-artifacts/ai-graphics/model-weight-manifests
```

Only when the command plan reports `ready_for_native_gpu_runtime_probe_input`
should generated Docker commands be used in an approved native NVIDIA runtime
proof lane.

## No-Scope

The scaffold does not download model weights, load checkpoints, run inference,
process media, run Docker/GPU runtime, call Tool Routes, queue Workers, call
providers, mutate Supabase/GCS, create signed URLs, create public artifacts, or
unlock runtime/beta/production.
