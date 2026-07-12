# Canonical Private Review Assembly

Status: private single-host internal-review evidence

The canonical private-review assembly service closes the bounded backend path from an immutable approved execution package to a credential-free private review manifest. It does not publish an export or promote the product to external beta or production.

## Route

`POST /v1/edit-executions/packages/:packageRecordId/private-review-assemblies`

The route requires authenticated workspace access, the internal-service boundary, and an `Idempotency-Key`. Its strict body contains only:

- `workspaceId`
- `purpose: assemble_canonical_private_review`

The caller cannot provide jobs, artifacts, paths, URLs, snapshots, leases, tools, QA results, provider instructions, prices, credits, billing, or delivery authority.

## Server-owned terminal proof

The service reloads the canonical execution package and immutable approved authority, then requires:

1. every required work item to have a canonical job and required expected output;
2. exactly one QA-passed, private-reconciled artifact for every required expected output;
3. exactly one Remotion final-export job and one dependent FFprobe final-QA job;
4. checksum-valid private artifact and worker-lease aggregates;
5. an independently reopened H.264/AAC final MP4 and structured final-QA report;
6. all normalized width, height, frame-rate, frame-count, duration, pixel-format, color, audio-codec, channel, and sample-rate gates to pass;
7. the completed final-QA lease to identify the exact final artifact and immutable source lease used as its input.

Only after those checks pass does the service persist a create-only, credential-free manifest and idempotent response. Replay reopens and verifies the manifest checksum before returning the same assembly identity.

The final artifact remains available only through the existing authenticated private download route. The assembly response contains no filesystem path, public URL, signed URL, dispatch credential, or provider secret.

## Current executable evidence

The canonical dispatch smoke publishes and funds a fresh five-job plan, derives its immutable execution package, and completes this exact graph:

1. approved-snapshot validation;
2. dependency-bound source-trim validation;
3. libass caption overlay generation;
4. trim-authoritative Remotion final composition;
5. dependency-bound independent FFprobe final-artifact QA.

It then proves caller-authored artifact injection is rejected, the terminal assembly is create-only and replay-safe, the final-QA lease is bound to the exact final MP4, and authenticated private download returns the verified bytes.

## Boundaries

`privateReviewReady: true` means only that this bounded, single-host, generated-fixture journey is ready for private internal review. The response keeps public export, product, external-beta, production, provider, public artifact, public delivery, further render, customer price/credit mutation, wallet, settlement, billing, and deployment authority false.

The next backend layer now records one immutable-manifest-bound private-review acceptance or structured revision request. A revision still requires canonical replacement-plan compilation, a fresh estimate, and new approval. Real-user uploads, browser handoff, deployed storage and workers, Supabase/RLS, providers, billing, public delivery, operational recovery, and production promotion remain unproven.

## Verification

- `npm run typecheck:server`
- `npm run lint`
- `npm run smoke:canonical-private-tool-dispatch`
- `npm run smoke:proven-tool-identities`
- `npm run qa:internal-pipeline`
- `npm run check:frontend-boundary`
