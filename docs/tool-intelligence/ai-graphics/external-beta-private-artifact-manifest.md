# AI Graphics External-Beta Private Artifact Manifest

Decision: `ai_graphics_external_beta_private_artifact_manifest_prepared_with_runtime_blocks`

This is the private artifact manifest gate after the saved worker dispatch smoke proof. It prepares the artifact boundary a future external-beta tool call needs before any real worker execution can be considered.

It does not upload to storage, create signed URLs, create public artifacts, execute tools, dispatch workers, start GPU runtime, or unlock external beta/production.

## Current Result

- Tools covered: `21`
- Product-facing capabilities covered: `12`
- GPU/model tools covered: `8`
- Source worker-dispatch-smoke proof accepted in committed docs: `false`
- Source runtime queue service proof bridge accepted in committed docs: `false`
- Private artifact manifest ready in committed docs: `false`
- Manifest records prepared by the evaluator: `21`
- External-beta-ready now: `0`
- Production-ready now: `0`

## Required Private Controls

The CLI can report `external_beta_private_artifact_manifest_ready_with_runtime_blocks` only when all of these are supplied:

1. `--external-beta-worker-dispatch-smoke-proof-packet`
2. `--external-beta-private-artifact-policy-ref`
3. `--external-beta-artifact-manifest-schema-ref`
4. `--external-beta-storage-namespace-ref`
5. `--external-beta-access-boundary-ref`
6. `--external-beta-encryption-policy-ref`
7. `--external-beta-retention-policy-ref`
8. `--external-beta-artifact-telemetry-ref`

Accepted refs must use private/backend namespaces such as `private://`, `reeditpro-private://`, `backend-evidence://`, or `external-beta-evidence://`. The source worker-dispatch-smoke proof must also preserve the 21-tool runtime queue service proof bridge.

## What The Gate Prepares

For each of the 21 AI graphics tools, the manifest prepares private refs for:

- input manifest
- output manifest
- telemetry
- lease audit
- model-weight or cache manifest when the tool is one of the 8 GPU/model tools
- the preserved source runtime queue service proof bridge marker

The refs are manifest records only. They are not storage writes.

## Rejected Artifact Patterns

The gate rejects `http://`, `https://`, `signed-url://`, `public://`, `gs://`, and `gcs://` refs. Future external beta tool calls must keep private storage and backend evidence boundaries intact instead of exposing public artifacts or signed URLs as source-of-truth.

## Runtime Boundary

Agent selection remains planning/study metadata only. Tool execution, Tool Route execution, Worker execution, provider/model runtime, browser/WebGL/canvas runtime, GPU runtime, model download/load, media processing, Supabase/GCS mutation, signed URL creation, public artifact creation, runtime readiness, external beta, and production all remain blocked.

## Next External-Beta Gate

The next external checkpoint is Tool Route runtime proof. That gate must accept this private artifact manifest plus private/backend route policy, schema, admission, authorization, rate-limit, audit, and rollback evidence before any Worker runtime proof or per-tool execution proof can proceed.
