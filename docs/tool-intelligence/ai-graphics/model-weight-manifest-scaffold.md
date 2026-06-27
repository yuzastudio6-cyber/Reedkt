# AI Graphics Model-Weight Manifest Scaffold

Decision: `ai_graphics_model_weight_manifest_scaffold_prepared_for_local_private_records`

This packet adds a local-only scaffold command for the five AI graphics tools that require reviewed private model-weight manifests before native GPU runtime proof.

## Scope

- `sam2`
- `birefnet`
- `real_esrgan`
- `rembg`
- `transparent_background`

The scaffold writes the runtime mount layout expected by the GPU proof command plan:

- `sam2/model_tree_manifest.json`
- `birefnet/model_tree_manifest.json`
- `real-esrgan/model_tree_manifest.json`
- `rembg/model_tree_manifest.json`
- `transparent-background/model_tree_manifest.json`

It also writes local-only authoring support files:

- `manifest-authoring-checklist.json`
- `MANIFEST_AUTHORING_CHECKLIST.md`

## Source Candidate Guidance

Each scaffold record is linked to the current model-weight source catalog so local private manifest authoring uses the selected candidate instead of a generic placeholder:

- `sam2`: `facebook_sam2_1_hiera_tiny_existing_staging_evidence`; ready for private manifest drafting from existing internal evidence after private refs are authored.
- `birefnet`: `zhengpeng7_birefnet_official_weights_review_candidate`; ready for private manifest drafting from existing internal evidence after private refs are authored.
- `real_esrgan`: `xinntao_real_esrgan_x4plus`; ready for private manifest drafting from existing internal evidence after private refs are authored.
- `rembg`: `danielgatis_rembg_isnet_general_use_review_candidate`, artifact candidate `isnet-general-use.onnx`; blocked until source/license/checksum/provenance/quality/security review accepts the selected candidate.
- `transparent_background`: `plemeri_transparent_background_base_ckpt_review_candidate`, artifact candidate `ckpt_base.pth`, upstream MD5 `d692e3dd5fa1b9658949d452bebf1cda`; blocked until source/license/checksum/provenance/quality/security review accepts the selected candidate.

Suggested checksum guidance is included for local authoring:

- `sam2`: `45ad40cc297713cf822419c5b94a7025f80e96525fb2b9cb9b47a1bf4350c2b2` from `existing_internal_aggregate_sha256`.
- `birefnet`: `1e4044aa39d94e3f9c07e2e73d7ff78883c4838e90d678bcb8f3fc075db811e7` from `existing_internal_aggregate_sha256`.
- `real_esrgan`: `4fa0d38905f75ac06eb49a7951b426670021be3018265fd191d2125df9d682f1` from `existing_internal_file_sha256`.
- `rembg`: `requires_private_artifact_sha256`.
- `transparent_background`: `requires_private_artifact_sha256`; the upstream MD5 remains source evidence only.

Each suggested checksum must still match the reviewed private artifact before a manifest can pass review. These suggestions do not approve private manifests, model downloads, model loading, inference, GPU runtime, beta, or production.

Generated placeholder records include `sourceCandidateId` set to the selected candidate above. The review validator and native GPU readiness probe reject records whose `sourceCandidateId` does not match the source catalog.

## Authoring Checklist

The checklist records, per tool:

- selected `sourceCandidateId`
- authoring readiness (`ready_from_existing_internal_evidence_after_private_ref_authoring` or `blocked_until_source_review_accepts_selected_candidate`)
- local-only manifest path
- expected runtime manifest path
- accepted private artifact ref namespaces
- required manifest fields
- required review booleans
- source evidence refs, where available
- suggested private manifest checksum source and SHA-256 where existing internal evidence provides one
- `checksumStillMustMatchReviewedPrivateArtifact=true`
- validation commands for the manifest review and GPU proof command-plan steps

This closes the handoff gap between source selection and private manifest
creation without committing private refs, checksums, model files, or proof
results.

## Command

Use a local-only path, preferably under `.local-artifacts`, and do not commit the generated files:

```bash
npm run --silent ai-graphics:model-weight-manifest-scaffold -- --out-dir .local-artifacts/ai-graphics/model-weight-manifests
```

Use `--force` only when intentionally replacing local scaffold files:

```bash
npm run --silent ai-graphics:model-weight-manifest-scaffold -- --out-dir .local-artifacts/ai-graphics/model-weight-manifests --force
```

## Safety Defaults

The generated templates are intentionally invalid until owner-reviewed:

- `privateArtifactRef` starts with `public://replace-with-reviewed-private-artifact-ref/...`, which validation rejects.
- `checksumSha256` is `REPLACE_WITH_64_HEX_SHA256`, which validation rejects.
- `checksumEvidenceRef` is a public placeholder and must be replaced with a reviewed private checksum evidence ref.
- `sourceCandidateId` is prefilled from the source catalog and must not be changed unless a later reviewed source-catalog lane selects a different candidate.
- All review booleans are `false`.
- The local checklist reports `committedManifestApproved=false` for every tool.

This prevents a placeholder scaffold from accidentally becoming native GPU proof input.

## Validation Flow

After filling the local private records, validate them:

```bash
npm run --silent ai-graphics:model-weight-manifest-review:validate -- --manifest-dir .local-artifacts/ai-graphics/model-weight-manifests
```

Then create the GPU proof command plan:

```bash
npm run --silent ai-graphics:gpu-runtime-proof-command-plan -- --manifest-dir .local-artifacts/ai-graphics/model-weight-manifests
```

Only when the command plan reports `ready_for_native_gpu_runtime_probe_input` should the generated Docker commands be used in an approved native NVIDIA runtime proof lane.

## No-Scope

The scaffold does not download model weights, load checkpoints, run inference, process media, run Docker/GPU runtime, call Tool Routes, queue Workers, call providers, mutate Supabase/GCS, create signed URLs, create public artifacts, or unlock runtime/beta/production.
