# Canonical Browser Execution Route Selection

Status: `implemented_source_verified_protected_internal_only`

Date: 2026-07-22

## Outcome

The frontend route catalog now distinguishes the four canonical authenticated
edit-preparation/private-review surfaces from the 31 retired staged execution
contracts. These four remain eligible for frontend-safe HTTP transport:

- exact approved-snapshot package request;
- bounded canonical private edit preparation;
- exact private-review media read;
- exact canonical review decision.

Six separate professional long-form customer-delivery discovery, review,
range-playback, checkpoint, decision, and accepted private-download routes also
remain frontend-safe. They inspect or deliver an already-produced private
customer master; they are not worker/tool-stage controls and do not revive the
retired execution chain.

Twenty-eight retired package, adapter, runner, mock queue, local media, preview,
final-render, and internal-download stages remain available only in the
deterministic mock router. Three historical read routes that never had mock
handlers are explicitly backend-required. In a configured frontend-safe
runtime all 31 return `backend_runtime_required` before `fetch`, so a `/v1` path
cannot bypass the canonical browser contract. The real server independently
keeps those routes behind internal-service authority or the legacy planning-
handoff gate.

This correction preserves the one approved snapshot, one package request, one
server-derived work graph, private review, and revision/acceptance boundaries.
It does not expose jobs, tools, commands, paths, credentials, provider routes,
cost internals, service-role authority, customer charging, rendering, or public
delivery to the browser.

## Verification

```sh
npm run smoke:canonical-browser-execution-route-selection
npm run smoke:internal-testing-deployment-readiness
npm run smoke:frontend-api-transport
npm run typecheck:api
npm run typecheck:server
npm run lint
npm run build
npm run check:frontend-boundary
npm run check:secrets
```

The focused route-selection proof requires four canonical edit-preparation and
private-review browser routes, six customer-delivery browser routes, 28
mock-only historical routes, three backend-required historical reads, zero
attempted legacy HTTP requests, and the exact server middleware ordering.
Remote Supabase, Google Cloud, providers, billing, deployment, external beta,
public delivery, and production readiness remain false.
