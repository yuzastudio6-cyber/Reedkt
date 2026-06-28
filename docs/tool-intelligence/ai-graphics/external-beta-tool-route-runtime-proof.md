# AI Graphics External-Beta Tool Route Runtime Proof

Decision: `ai_graphics_external_beta_tool_route_runtime_proof_prepared_with_runtime_blocks`

This is the Tool Route proof gate after the private artifact manifest. It checks that a future external-beta route would have private artifacts and backend-only route controls before any real execution can be considered.

It does not execute Tool Routes, dispatch Workers, run tools, start GPU runtime, call providers/models, upload storage, create signed URLs, create public artifacts, or unlock external beta/production.

## Current Result

- Tools covered: `21`
- Product-facing capabilities covered: `12`
- GPU/model tools covered: `8`
- Source private artifact manifest accepted in committed docs: `false`
- Tool Route runtime proof ready in committed docs: `false`
- Tool Route records prepared by the evaluator: `21`
- External-beta-ready now: `0`
- Production-ready now: `0`

## Required Route Controls

The CLI can report `external_beta_tool_route_runtime_proof_ready_with_runtime_blocks` only when all of these are supplied:

1. `--external-beta-private-artifact-manifest-packet`
2. `--external-beta-tool-route-policy-ref`
3. `--external-beta-tool-route-schema-ref`
4. `--external-beta-tool-route-admission-ref`
5. `--external-beta-tool-route-authz-ref`
6. `--external-beta-tool-route-rate-limit-ref`
7. `--external-beta-tool-route-audit-ref`
8. `--external-beta-tool-route-rollback-ref`

Accepted refs must use private/backend namespaces such as `private://`, `reeditpro-private://`, `backend-evidence://`, or `external-beta-evidence://`.

## What The Gate Prepares

For each of the 21 AI graphics tools, the proof prepares a runtime-proof-only Tool Route record with:

- canonical tool id and production tool id
- worker type and runtime target
- product-facing capabilities
- private input/output manifest refs
- telemetry and lease audit refs
- model-weight/cache manifest refs for the 8 GPU/model tools
- route policy, schema, admission, authz, rate-limit, audit, and rollback refs

These are route proof records only. They are not route executions and they are not worker enqueue operations.

## Rejected Route Patterns

The gate rejects `http://`, `https://`, `signed-url://`, `public://`, `gs://`, and `gcs://` refs. Future external-beta Tool Route execution must keep private storage and backend evidence boundaries intact.

## Runtime Boundary

Agent selection remains planning/study metadata only. Tool execution, Tool Route execution, Worker execution, provider/model runtime, browser/WebGL/canvas runtime, GPU runtime, model download/load, media processing, Supabase/GCS mutation, signed URL creation, public artifact creation, runtime readiness, external beta, and production all remain blocked.
