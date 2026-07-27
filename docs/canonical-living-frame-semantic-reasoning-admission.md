# Canonical Living Frame Semantic Reasoning Admission

## Purpose

`canonical-living-frame-semantic-reasoning-admission-v1` is the private
server boundary that joins a current Living Frame semantic request to the two
workflow-neutral prerequisites it previously declared but could not consume:

1. current generic source-speech evidence; and
2. current route-data assurance for the exact Kimi K3, Qwen 3.7, and
   DeepSeek V4 Pro route.

The result is ready only for a later, separately authorized provider-envelope
step. It is not a provider request, reasoning run, reasoning result, selected
scene, edit plan, estimate, approval, work item, or runtime instruction.

## Server-owned assembly order

The service performs the binding in this order:

1. rebuild and verify the current Living Frame pre-approval input authority;
2. reread the current unpublished handoff and canonical components;
3. reread the owner/workspace-scoped source-speech package;
4. validate the source-only Slice 3D-A semantic request;
5. construct the actual bounded provider-neutral semantic payload;
6. hash that complete payload;
7. reread route-data assurance bound to that exact payload digest;
8. build the non-promotable admission; and
9. rebuild the pre-approval input authority again to reject a handoff race.

The source-speech and route-assurance services each perform their own
double-read and current-scope checks. Callers provide opaque server-owned
locators only. They cannot provide transcript evidence, policy claims,
provider selections, envelopes, credentials, or runtime state.

## Provider-neutral payload

The payload retains the validated semantic request, exact strict output-schema
digest, current visual-evidence lineage, and a bounded speech projection.
Selected speech text is:

- derived only from the current verified generic speech package;
- redacted and explicitly untrusted;
- tied to exact source-sequence items, evidence-record digests, segment IDs,
  time ranges, confidence, and semantic-context IDs;
- capped at 256 segments and 64,000 characters;
- excluded from browser payloads; and
- never granted source-instruction authority.

Raw transcript authority remains false. A referenced speech segment that is
missing from the current package fails closed. Verified no-speech and
idea-first modes retain an empty speech projection.

## Exact route-policy binding

Route assurance is evaluated against the digest of the assembled payload, not
the older pre-approval metadata digest or the source-only semantic-request
digest. Admission requires all three canonical routes to be allowed for
text-only edit planning, with no raw media, raw transcript, or browser capture.

Expired, stale, cross-owner, wrong-scope, mismatched-request, review-required,
or blocked assurance cannot create an admission. The provider-envelope digest
must still be null and provider transport and calls must still be false.

## Authority boundary

`ready_for_provider_envelope` means only that the bounded payload has current
speech and route-policy evidence. All of these remain false:

- provider-envelope, transport, credential, and provider-call authority;
- reasoning-run, attempt, cost, and result authority;
- selected-scene, component-plan, exact timing, and SoundSync authority;
- estimate, customer price, credits, reservation, approval, and snapshot
  authority;
- work-graph, queue, tool-route, media-generation, render, export, and runtime
  authority; and
- production readiness.

A durable pre-plan reasoning lifecycle, current provider envelope, canonical
selected-scene admission, estimate, user approval, and immutable snapshot are
still required downstream.

## Verification

Run:

```bash
npm run smoke:canonical-living-frame-semantic-admission
```

The smoke covers current source-speech and route-assurance binding, exact
payload-digest linkage, missing speech segments, cross-owner repositories,
wrong request digests, blocked training-use policy, handoff races, unknown
caller fields, correctly re-digested cross-field forgeries, and the literal
closed authority boundary.
