# Post-CAP-12 Cross-System Manifest V3 Report

Milestone: `POST-CAP-12-CROSS-SYSTEM-MANIFEST-V3`

Status: `full_regression_passed_ready_for_checkpoint`

## Outcome

The Caption cross-system contracts are now exposed through a complete additive
specialist capability surface. The frozen CAP-01 manifest and the integration
V1/V2 manifests remain unchanged. The new
`captions.specialist.integration.manifest.v3` declares what the current
Caption runtime and CAP-12 contracts actually accept and may produce.

The V3 manifest requires `source_skill_support_request` for all eight support
jobs, advertises every job-specific Caption support result globally and per
job, and declares the Caption-owned cross-system outbound payload, handoff, and
aggregate coordination-plan artifact types only for the relevant capabilities.
Its global produced-artifact list is computed from the exact per-job union.

V3 is selected by the canonical Caption source-led V3 execution input. Older
approved work remains bound to its original V1 or V2 manifest and
qualification. A V3 support job without the exact persisted HQ-mediated source
request now fails closed with `input.incoming_support_request.missing` instead
of silently completing or treating HQ input as a peer dependency.

## Frozen identities

- manifest: `captions.specialist.integration.manifest.v3`;
- skill version: `captions-specialist-integration-v3`;
- manifest hash:
  `670160edb63d4abebe8b33096a5ea70089000e6f46f8b079f5c3a046940ae0a9`;
- qualification: `captions.specialist.qualification.integration-v3`;
- qualification digest:
  `927769c6ee37009e5538752a23715be8e0f33f0c70b52e8c52b59ec5a33b3b81`.

## Artifact surface

Accepted support input:

- `source_skill_support_request`.

Caption-owned coordination outputs:

- `caption_cross_system_outbound_payload`;
- `caption_cross_system_handoff`;
- `caption_cross_system_coordination_plan`.

All eight existing support-result types are also present in the global output
catalog. The incoming typography request remains a closed typed payload inside
the versioned mediated support request; it is not mislabeled as an independent
artifact reference.

## Milestone evidence record

Milestone: `POST-CAP-12-CROSS-SYSTEM-MANIFEST-V3`

Status: `passed`

Outcome: the future HQ can discover the exact Caption input/output surface
without reading Caption implementation or inferring receiver execution.

Files changed: Caption cross-system public constants, additive integration
manifest and qualification, specialist runtime profile, internal harness,
canonical Caption execution mount, focused smokes, and Caption documentation.

Contracts added/changed: one additive manifest identity and one additive
qualification snapshot. Frozen CAP-01, integration V1/V2, StoryTiming V1,
Caption-to-Living-Frame V1/V2, and generic Orchestra contracts are unchanged.

Existing owners reused: HQ mediation, canonical approved-snapshot execution,
StoryTiming/MasterTiming, Living Frame, Transition, Graphic, Map, Chart,
Diagram, B-roll, Stroke Motion, Remotion, final QA, and billing owners.

Duplicate owners avoided: no Orchestra, dispatcher, receiver executor,
timeline writer, asset writer, QA approver, billing owner, public-delivery
owner, or production owner was added.

Tests run and passed: 41-check integration-routing smoke, 76-assertion CAP-12
smoke, 34-check canonical transcript/source-led execution smoke, 49-check
canonical Caption execution smoke, CAP-01–20 source aggregate (20/20),
Caption source-integration aggregate (47 suites and 41/41 current job
implementations), server typecheck, targeted and full ESLint, production build
(2,969 modules), frontend/server boundary (1,146 files), current secret scan
(6,851 files), reachable-history secret scan (15,645 blobs), and Git diff
whitespace validation.

Tests failed: none in the final focused run.

Media inspected: not applicable. This milestone changes byte-free manifests
and coordination receipts only.

Visible defects: not applicable.

Repairs made: the audit found that support-request inputs and per-job support
outputs existed in runtime behavior but were absent from the complete manifest
catalog. The additive V3 surface now matches the runtime and fails closed.

Known limitations: the manifest qualifies planning and coordination contracts,
not receiver runtime, shared-owner results, complete-time visual review, or
independent final QA.

Scoped blockers: the nine terminal private-evidence categories remain as
recorded by the post-CAP-20 completion audit.

Safe work completed: exact versioning, backward compatibility, canonical V3
mount selection, closed authority, focused verification, and documentation.

Next milestone: continue the same-scope private qualification campaign and
close every evidence gate that can be completed without inventing another
owner.
