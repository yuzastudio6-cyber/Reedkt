# Qwen Server-Only Runtime Contract

Qwen 3.7 Max runtime is backend-only. Browser code may display safe summaries but must never import the Qwen runtime boundary, receive secret values, or call Qwen directly.

Boundary statement: symbolic secret references only, disabled resolver only, backend-only, no gcloud, no secret value access, no secret value printed, no provider call, no Qwen call, no Marker Chat runtime change, fake transport first by default.

Verification phrase: Qwen 3.7 Max remains behind symbolic secret references, a disabled resolver, backend-only access, no gcloud command, no secret value access, no provider call, no Qwen call, no Marker Chat runtime change, and fake transport first.

## Contract

- Browser to Qwen API is forbidden.
- Browser to secret value is forbidden.
- Marker Chat to render, worker, progress, or credit flow is forbidden.
- Future flow must pass through backend route, auth/runtime/effect gates, provider boundary, structured response validation, and safe persistence.
- Current Marker Chat runtime remains deterministic mock/local.

## Enforcement

The frontend/server boundary check blocks frontend imports from `src/backend/qwen-runtime`. The Qwen boundary checker scans for unsafe frontend imports and secret-like literals in boundary files.
