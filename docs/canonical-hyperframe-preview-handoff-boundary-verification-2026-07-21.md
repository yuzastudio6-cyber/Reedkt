# Canonical Hyperframe Preview Handoff Boundary Verification

Status: `source_verified_private_boundary_contract_only`

Date: 2026-07-21

## Outcome

ReEditPro now has one deterministic, fail-closed contract for handing an
already-approved private timeline to its browser-safe preview boundary. The
exact operation is:

`tool.hyperframe.handoff_approved_preview_timeline.v1`

This closes the launch-core evidence-classification gap without pretending
that Hyperframe is an executable backend media tool. Evidence revision
`2026-07-21.31` now reports exactly 50 registered tool identities, all 50 with
confined-runner, canonical private E2E, and server-derived job-adapter
evidence. Hyperframe remains outside that production registry as a separate
non-executable candidate-boundary proof.
- 1 separately verified non-executable boundary contract (`hyperframe`);
- 0 production-image qualified tools;
- 0 deployed-release qualified tools.

Because Hyperframe is non-executable, its remaining release blocker is exact
same-source browser/server integration and deployed-application evidence—not a
worker image. The readiness report keeps the general image tier closed for all
50 registered identities while explicitly preventing Hyperframe from being
promoted through a container runner.

## Bound authority

`server/workers/timeline/canonical-hyperframe-preview-handoff-boundary.ts`
accepts only server-derived authority bound to the exact workspace, project,
edit, approved snapshot, approved execution package, confirmed output frame,
Master Timing Plan, private timeline artifact, timeline QA receipt, and
timeline-manifest digest. It validates ordered non-overlapping clip ranges and
produces one content-addressed handoff plus a bounded browser projection.

The browser projection excludes private editorial reasons, raw chat, hidden
reasoning, provider payloads, storage paths, signed URLs, media bytes, commands,
and executable authority. Tampering with the authority, timeline, handoff, or
projection fails deterministic validation.

## Deliberately closed gates

The contract does not:

- import, install, or invoke an external Hyperframes runtime;
- assign a backend worker or run a browser-side editing engine;
- read or transform source media;
- create a queue job, lease, one-use dispatch, or tool-cost event;
- render, export, publish, deploy, or deliver video;
- authorize a provider, credential, Google Cloud, Supabase, billing, customer
  price, customer credits, service fee, or wallet mutation;
- claim runner, canonical E2E, job-adapter, production-image, deployed-release,
  external-beta, or production readiness.

## Evidence

Focused verification:

```text
npm run smoke:canonical-hyperframe-preview-handoff-boundary
npm run smoke:proven-tool-identities
npm run smoke:prod-readiness-evidence-tiers
npm run smoke:prod-readiness-validation
npm run prod:readiness:summary
npm run prod:readiness:action-plan
```

The focused boundary smoke produces deterministic receipt SHA-256
`e0c5e4032a3dff201f626d0a9ad0829fff7dd88175f63d288f1da5b1c195981d`.
The launch-core report keeps 23/23 executable identities at canonical private
E2E/job-adapter proof and records Hyperframe separately as 1/1 non-executable
integration-boundary contract proof.

This is source/private-internal evidence only. Distributed workers, a deployed
website/runtime, real-user storage, production image qualification, deployed
release qualification, external beta, and production remain blocked.
