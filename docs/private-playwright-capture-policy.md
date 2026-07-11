# Private Approved Playwright Capture Policy

Status: `private_executable` for one bounded conditional strategy operation
Milestone: `RP-TOOLEXEC-02`
Date: 2026-07-10

## Purpose

ReeditPro may render a small approved HTML-derived visual when a frozen edit plan explicitly asks for a browser-style evidence card. The current runner is deliberately **not** a website screenshot service. It renders one server-owned template from four sanitized text tokens and returns a private PNG for the approved segment and renderer layer.

Normal approved snapshots retain the four executable core operations: FFmpeg source processing, ffprobe processed-media QA, FFmpeg final render, and ffprobe final-delivery QA. A snapshot gains a conditional Playwright operation only when every authorization link below is present.

## Required Authorization Chain

The immutable approved snapshot and server-owned tool-work manifest must bind:

1. `browser_capture_chain` as the tool strategy.
2. `playwright` as the primary tool.
3. `approved_internal_html_v1` as the source kind.
4. `reeditpro_private_capture_card_v1` as the fixed template.
5. `captureAuthorizationConfirmed = true`.
6. Exactly four structured text tokens: `eyebrow`, `title`, `body`, and `callout`.
7. The fixed 640x360 viewport at device scale factor 1.
8. An approved segment and visual-asset plan item.
9. At least one approved renderer layer.
10. A linked `capture_browser_asset` work item that references the same strategy, segment, asset, and renderer layer.
11. The same workspace, project, approved snapshot, estimate, and credit reservation as the canonical manifest.
12. A server-owned approved-snapshot registry record owned by the authenticated user, with matching workspace, project, estimate, reservation, approved status, and canonical execution-snapshot SHA-256.

Missing or conflicting evidence keeps the strategy `degraded_planning_only`. It cannot call the runner or emit actual-work evidence.

Client package input is never sufficient execution authority. When an executable-looking Playwright strategy is packaged, the backend reloads the authenticated server-owned approval record and records a package/manifest-bound authorization attestation. Immediately before capture execution, it reloads the record again and verifies the full canonical snapshot hash and scope. Without that second server-source check, the runner is not called and no Playwright bytes are generated.

## Allowed Inputs

The runner accepts only this fixed specification:

- source kind,
- fixed template ID,
- explicit authorization boolean,
- four bounded plain-text tokens,
- fixed viewport width, height, and device scale factor.

Text is whitespace-normalized, length-bounded, HTML-escaped, and rejected when it contains markup, URL-like content, loopback hosts, data/file/JavaScript schemes, or credential-like terms.

## Prohibited Inputs And Runtime Capabilities

The runner rejects or does not expose:

- URLs or navigation,
- raw HTML supplied by a user,
- JavaScript,
- custom CSS,
- auth headers,
- cookies,
- credentials or secrets,
- local/session storage,
- service workers,
- downloads,
- provider payloads,
- loopback access as a network shortcut,
- public artifact paths or signed URLs.

Playwright runs headlessly with JavaScript disabled, service workers blocked, downloads disabled, and a catch-all route that aborts any network request. A nonzero request count fails the operation.

## Artifact Contract

The runner produces:

- `image/png`,
- exactly 640x360 pixels,
- at most 8 MiB,
- a valid PNG signature and IHDR dimensions,
- SHA-256 and byte-size evidence,
- a contained path under `LOCAL_STORAGE_ROOT`,
- `privateArtifact = true`,
- `publicArtifact = false`,
- `signedUrl = null`,
- approved segment, asset, work-item, renderer-layer, and manifest lineage.

Writes use a contained temporary file followed by rename. The deterministic output path includes the approved operation ID and source-spec hash.

New capture directories are created with mode `0700` and PNG files with mode `0600` on POSIX. Scope path components include SHA-256 entropy from the raw workspace, project, snapshot, and operation IDs, and artifact IDs include manifest fingerprint entropy, preventing lossy sanitized labels from colliding.

## Idempotency And Tamper Handling

A valid same-size PNG at the deterministic path is not enough for reuse. Before accepting an existing artifact, the runner re-renders the current fixed template from the approved structured spec and requires exact byte equality. A different valid 640x360 PNG fails closed with deterministic provenance validation instead of being reused or silently overwritten.

The artifact ID, operation-instance ID, evidence ID, cost-event ID, and cost-event idempotency key remain stable for an identical manifest/spec/output.

## Preview And Final Render Integration

The private preview assembly executes only Playwright operations already promoted by the immutable manifest. It supports no more than four authorized captures and only one capture per segment. Each result must find the matching private preview segment.

The preview manifest records safe capture metadata without a public URL or signed URL. Absolute `localFilePath` fields remain internal to the service and are recursively removed from the render-preview HTTP DTO. The final FFmpeg renderer receives the local PNG only through the approved clip overlay structure and places it in the linked segment. Immediately before composition it re-reads the contained file and revalidates the PNG signature, exact 640x360 IHDR, byte bound, and approved SHA-256, so stale runner evidence cannot authorize a swapped artifact. The final command summary, edit-decision manifest, tool-operation evidence, and delivery QA all record the browser-capture overlay count and lineage.

## Cost And Credit Boundary

Actual tool-cost evidence is emitted only after PNG bytes pass validation. The event:

- records internal infrastructure runtime only,
- is nonbillable to the user,
- includes no service fee,
- performs no wallet mutation,
- performs no settlement,
- remains bound to the approved credit reservation.

An estimate or a planning-only capture never emits actual-work evidence.

## Destructive Validation

Run:

```bash
npm run smoke:private-playwright-capture
```

The smoke proves:

- normal manifest = four executable core operations,
- authorized fixture = five executable operations,
- fixed-template zero-network PNG output,
- private artifact and approved lineage,
- idempotent evidence reuse,
- rejection of a different valid same-dimension PNG,
- rejection of missing authorization,
- rejection of URL/raw-HTML settings,
- rejection of credential-like and oversized tokens,
- rejection of reservation mismatch,
- rejection of a client-injected executable-looking package without server-owned approval state,
- rejection of planner-sourced authorization and blocked strategy/work-item statuses,
- collision-resistant scope paths and private POSIX modes,
- visible FFmpeg overlay composition,
- no user billing, service fee, wallet mutation, or settlement.

## Release Boundary

This evidence authorizes local/private internal execution only. Arbitrary browser capture, authenticated website capture, staging deployment, external beta, production service identity, public delivery, and billable execution remain blocked until separate security, privacy, tenancy, deployment, cost, legal, and operational gates pass.
