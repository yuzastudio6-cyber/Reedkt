# Canonical Tool Payload Authority

Status: authenticated local/private backend authority with complete 50-tool
fixture evidence

ReEditPro now rejects a tool-backed canonical work item before plan persistence
unless the exact private runner can parse its structured payload and the work
item carries the exact binding and artifact contract that runner supports. This
closes the former gap where a plan could be schema-valid and identity-proven,
reserve synthetic credits at approval, and only discover an invalid runner
payload during dispatch.

## Server-owned authority

After grouped planner work is compiled into atomic jobs, plan publication builds
`canonical-tool-payload-authority-v1` from the compiled work items and the exact
operation specifications. It does not trust caller-authored readiness, runner
class, output support, provider authority, or production claims.

Every validated tool work item freezes:

- canonical tool and exact operation ID;
- one of 19 exact runner-validator families;
- a hash of the bounded structured payload;
- source-sequence, cleanup-decision, and dependency bindings;
- exact output key, role, content type, and required state;
- a binding hash and validation hash.

Required tool work must already have canonical job-adapter proof. Optional
unproven work remains separately identified and cannot be dispatched as proven
work.

## Exact pre-approval checks

The authority calls the existing runner protocol validators for Node structured,
Sharp, Python structured/source media/source audio, FFmpeg, ffprobe, Remotion
preview/final composition, libass, browser graphics, bounded AI capability,
native image/audio, container validation, VapourSynth, AudioFlux, rembg, and
DeepFilterNet.

It also enforces:

- the exact tool/operation pair frozen in `approvedToolOperationIds`;
- runner-specific source, cleanup, and dependency cardinality;
- content types covered by the proven identity catalog's exact artifact
  evidence;
- offline, credential-free, non-provider execution policy;
- authorized internal Playwright capture policy; and
- final-artifact ownership only for the exact private Remotion source-caption
  composition profile.

The canonical five-job fixture is now runner-valid rather than only
schema-valid: snapshot validation, one approved FFmpeg trim, one libass caption
overlay, one Remotion final composition, and dependency-bound final ffprobe QA.

## Immutable lineage and revalidation

The payload manifest is stored as a content-addressed plan component before the
plan hash is computed. Approval reloads and reconstructs it before synthetic
credit reservation. The approved snapshot carries the same reference, and
execution-authority/package loading reconstructs it again from immutable
approved work items.

Dispatch no longer maintains a second payload-validation implementation. It
calls the same shared work-item validator before runtime evidence and one-use
dispatch authorization. Payload, binding, output, manifest, or current-runner
contract drift therefore fails closed at publication, approval, packaging, or
dispatch as applicable.

## Evidence

The focused planning smoke proves valid publication plus rejection of malformed
payloads, unsupported binding shapes, unverified output content types, and
content-addressed payload-authority tampering. The complete canonical fixture
proves 50 unique tool identities and all 19 validator families before approval,
then continues through the existing snapshot, reservation, lease, one-use
dispatch, confined execution, private persistence, QA, reconciliation, replay,
and downstream verification lifecycle.

Verification commands:

- `npm run smoke:edit-planning-authority`
- `npm run smoke:canonical-private-tool-dispatch`
- `npm run smoke:canonical-tool-operation-package`
- `npm run typecheck:server`
- `npm run lint`

## Boundaries

This is private single-host authority. It does not promote any tool to product,
external-beta, staging, or production readiness. It authorizes no provider,
remote Supabase, distributed worker, customer price, customer credit, wallet
mutation, billing, public rendering, delivery, frontend execution, or
deployment.
