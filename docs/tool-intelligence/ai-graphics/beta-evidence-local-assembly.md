# AI Graphics Beta Evidence Local Assembly

Decision: `ai_graphics_beta_evidence_local_assembly_prepared_with_directory_inputs`

This packet adds a local-only assembler for the final AI graphics beta evidence
gate. It reads reviewed private model-weight manifests and native GPU runtime
proof result JSON files from local directories, builds the two required evidence
packets in memory, and evaluates the existing all-21 beta evidence bundle.

The assembler does not install dependencies, run Docker, execute GPU runtime,
download model weights, load checkpoints, run inference, process media, call
Tool Routes, queue Workers, call providers, create artifacts, or unlock runtime,
beta, or production.

The default output is intentionally redacted for operator use. It reports counts,
accepted booleans, missing evidence, and blocked tool ids only. Use
`--full-output` only for local diagnostics that need the full nested validation
packet shape; full output remains validator-only and must still avoid raw private
artifact references, public URLs, signed URLs, model loading, and runtime
execution.

## Command

Default fail-closed check. This emits a sanitized summary only; it does not
print nested manifest review packets, GPU proof result packets, or beta bundle
records.

```bash
npm run --silent ai-graphics:beta-evidence-local-assembly
```

Local assembly with reviewed manifests, native GPU proof results, committed
JS runtime proof packets, and non-owner technical gates ready for owner review:

```bash
npm run --silent ai-graphics:beta-evidence-local-assembly -- \
  --manifest-dir .local-artifacts/ai-graphics/model-weight-manifests \
  --result-dir .local-artifacts/ai-graphics/gpu-runtime-proof-results \
  --use-committed-js-runtime-proofs \
  --all-technical-gates-passed \
  --browser-canvas-webgl-sandbox-passed \
  --require-ready-for-owner-gate
```

Local assembly after owner approval is explicitly granted:

```bash
npm run --silent ai-graphics:beta-evidence-local-assembly -- \
  --manifest-dir .local-artifacts/ai-graphics/model-weight-manifests \
  --result-dir .local-artifacts/ai-graphics/gpu-runtime-proof-results \
  --use-committed-js-runtime-proofs \
  --all-shared-gates-passed \
  --browser-canvas-webgl-sandbox-passed \
  --require-all-21-beta-ready
```

## Evidence Inputs

- Manifest directory: `.local-artifacts/ai-graphics/model-weight-manifests`
- GPU proof result directory: `.local-artifacts/ai-graphics/gpu-runtime-proof-results`
- Committed JS proofs:
  - `docs/tool-intelligence/ai-graphics/node-runtime-proof.json`
  - `docs/tool-intelligence/ai-graphics/browser-runtime-proof.json`
  - `docs/tool-intelligence/ai-graphics/satori-font-runtime-proof.json`

## Current Public State

- PR: https://github.com/yuzastudio6-cyber/Reedkt/pull/862
- Draft: `true`
- Merge state: `CLEAN`
- Head at packet creation: `1826fe93811115d380bdc273bdc5070bf5cadbf2`
- Check rollup: empty
- Local manifest records provided: `0`
- Local GPU proof results provided: `0`
- Default CLI output mode: `sanitized_summary`
- Full nested packet output requires: `--full-output`
- Default all-21 beta evidence ready: `false`
- Default all-21 technical evidence ready before owner approval: `false`
- Agent can execute tools now: `false`
- Runtime ready now: `false`
- Internal beta ready now: `false`
- Production ready now: `false`

## Why This Exists

The final beta evidence bundle already requires actual packet evidence instead of
override booleans. This assembler removes the manual packet-capture step from the
operator flow by deriving the model-weight manifest review packet and native GPU
runtime proof packet directly from local evidence directories.

The owner-review gate remains fail-closed until the private manifest records,
native GPU proof results, committed JS proof packets, browser sandbox proof, and
non-owner shared gates are supplied. The final all-21 beta evidence gate remains
fail-closed until owner approval is explicitly supplied after that technical
evidence is complete.
