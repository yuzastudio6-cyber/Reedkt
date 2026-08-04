# CAP-17 — Chat, Approval Reuse, Persistence, and Observability Report

Milestone: `CAP-17`

Status: `caption_chat_and_authenticated_reload_source_complete_shared_writers_external`

## Outcome

CAP-17 connects the frozen Caption specialist evidence to the normal Edit Chat
without creating a second plan, approval, credit, provider, persistence,
private-review, or delivery owner.

The Edit Chat now has one compact Caption status card inside the existing Plan
Review and private-review stages. The card is presentation-only. It has no
Caption-specific approve, charge, render, provider, repair, or delivery button.
Details use progressive disclosure, keyboard focus remains visible, and the
mobile layout collapses the evidence facts to one column.

Caption selection is no longer inferred from the historical optional caption
component. New professional plans emit
`professional-skill-composition-trace-v1`:

- `caption_design` plus `caption_render_qa` selects the specialist;
- `no_captions` is the mutually exclusive owner-approved restraint; and
- an absent decision is `unresolved` and cannot produce a misleading plan
  status.

## One approval, estimate, and reservation

The Caption card is inserted through the existing canonical Plan Review
supplement. Its copy explicitly states that Captions uses the plan's approval
and credit estimate. CAP-17 creates no second Caption approval or charge.

`caption-specialist-approved-snapshot-extension-v1` freezes the exact Caption
selection/restraint, CAP-02 through CAP-16 component references, execution and
render-QA work bindings, asset-manifest and estimate/cost lineage, private
review dependency, Qwen postrender request, B-roll owner reads, output scopes,
and confirmed-frame authorities. The extension can be written only through the
existing approved-snapshot path. That path verifies:

- owner, project, edit session, snapshot, and plan-version identity;
- the exact composition-trace ID, version, and digest;
- selected versus restrained disposition;
- exact output aspect and canvas dimensions; and
- immutable snapshot and closed authority flags.

The backend snapshot payload carries the extension as additive typed data.
Persistence proof names `canonical_approved_plan_snapshot_service` as the sole
owner and requires an exact tenant-scoped reread. There is no Caption-specific
database or browser persistence owner.

Snapshot-ID substitution fails closed once the Caption extension exists. The
backend must project it against the final canonical snapshot ID and all exact
downstream request/work refs; the frontend cannot repair that lineage by merely
rehashing the outer extension.

## Authenticated postrender reload

CAP-17 publishes the minimal Caption-owned request/result/projection surface
for:

`POST /v1/postrender-visual-qa/caption/authenticated-read`

The frontend client calls only this authenticated shared read route. A reload
must return one of three honest states:

- `not_found`: no canonical result exists;
- `pending`: canonical work exists but qualified visual review is incomplete;
- `completed`: every exact confirmed output has canonical, reconciled
  deterministic and model evidence.

Completed state requires evidence refs for the provider execution receipt,
persisted artifact, independent artifact QA, manifest reconciliation, and
decision, plus exact inspection coverage. Evidence cannot be reused across
output canvases. The projection digest is recomputed, and the browser cannot
use local state to promote completion.

The Caption hook reads only when a selected approved-snapshot extension is
available. It derives the request directly from the frozen confirmed-frame
authorities; width, height, fps, aspect ratio, and confirmation identity are
not reconstructed from loose browser fields.

The shared canonical Qwen lifecycle writer, create-only result persistence,
QA/reconciliation, and qualified repository read port remain backend-owned
integration gates. CAP-17 does not create a Caption dispatcher or reinterpret
the distinct Gemini Visual Intelligence operation.

## Revisions and private review

The private-review note now explicitly supports plain-language Caption wording,
size, motion, placement, and general edit changes. The versioned Caption
revision compiler accepts only allowlisted change intents, stores only the
source request digest in its worker-facing artifact, binds exact prior
snapshot/components/scenes/outputs, and requires a fresh plan, estimate,
approval, and private review. The prior immutable snapshot is never mutated.

Completed Caption scope remains separate from independent final QA and the
user's private review decision. The card may say Caption checks passed only
after authenticated reread; it does not approve the whole edit.

## Privacy and observability

The snapshot extension and observability receipt are byte-free and
tenant-scoped. They exclude raw chat, transcript, model response text, media
bytes, paths, URLs, credentials, and secrets. Metrics contain bounded counts
plus opaque lineage references only. Publishing production metrics, creating
alerts, billing, public delivery, and production authority remain false.

## Verification

`smoke:captions-specialist-cap-17` passes 30 source and adversarial assertions.
It covers composition selection/restraint, the no-action chat surface,
unresolved-plan refusal, exact authenticated route registration, reload-safe
status, request/output-frame validation, all three read dispositions, browser
completion refusal, mandatory canonical evidence, CAP-02 through CAP-16
snapshot coverage, immutable snapshot binding, tenant reread, natural-language
revision, sanitized metrics, and unknown/cyclic data refusal.

Server typecheck, full application build, full lint, the 110-definition
professional-skill registry, frontend/server boundary check, and current-tree
secret scan are green. CAP-17 produced no media and started no
media/model/provider runtime.

The exact presentation component was also mounted temporarily in the normal
Edit Chat development surface for direct browser inspection, then the preview
mount was removed before publication. The inspection accepted hierarchy,
contrast, readable wrapping, one-column mobile facts, the collapsed review
disclosure, and the absence of Caption-owned approval or charge actions at:

- desktop `1440x1000`, private screenshot SHA-256
  `02ddcb630b0e4faa42866d4e1f5ccbd53ebe520b0f7ea5f4042e34e304bae5b9`;
- mobile `390x1500`, private screenshot SHA-256
  `3f912b1089f3dbbf17c63373e7b2002c991c3187bb14a962d1072c0e5c88e10d`.

Those screenshots remain outside Git under the temporary private inspection
directory. They contain only the internal mock Edit Chat UI and no source media,
transcript, credentials, provider output, or customer artifact.

## Remaining integration gates

- backend professional-coverage admission must consume the exact composition
  trace and snapshot extension rather than substring matching;
- the shared Qwen postrender lifecycle writer and qualified repository port
  must satisfy the published authenticated read route;
- the existing B-roll owner must publish the exact selected/cropped/timed read
  result consumed by Caption/Remotion;
- backend approval packaging must supply the complete CAP-02 through CAP-16
  work/manifest/estimate/QA lineage before the snapshot extension can exist;
- CAP-18 must run the complete private real-media matrix and direct visual
  inspection.

These are internal integration gates, not public SaaS-production requirements.
CAP-18 may continue while the shared backend owners integrate the frozen CAP-17
surface.
