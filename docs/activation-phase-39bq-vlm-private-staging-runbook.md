# Phase 39B-Q VLM Private Staging Runbook

Default plan and report commands are non-mutating:

```bash
npm run activation:vlm-l4-compatible-candidate:plan
npm run activation:vlm-l4-compatible-candidate:report
npm run activation:vlm-l4-compatible-candidate:iam-plan
```

The execution CLI downloads only the selected official Qwen candidate files at the pinned revision, computes per-file SHA-256 checksums, computes an aggregate SHA-256 over sorted relative paths, uploads verified files to private generated-assets storage, and verifies private GCS object metadata.

Mutation requires current-shell confirmations:

```bash
export REEDITPRO_CONFIRM_VLM_L4_COMPAT_CANDIDATE_APPROVAL=true
export REEDITPRO_CONFIRM_VLM_L4_COMPAT_MODEL_DOWNLOAD=true
export REEDITPRO_CONFIRM_VLM_L4_COMPAT_PRIVATE_GCS_UPLOAD=true
```

Private model prefixes:

- Candidate A: `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct-fp8/<revision>/`
- Candidate B: `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-4b-instruct/<revision>/`
- Candidate C: `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-2b-instruct/<revision>/`

Do not commit model payloads, tokenizer files, safetensors files, local snapshots, runtime caches, credentials, signed URLs, or private logs.
