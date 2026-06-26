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
- All review booleans are `false`.

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
