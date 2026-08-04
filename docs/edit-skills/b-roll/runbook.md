# B-roll internal execution runbook

Status: `internal_execution_qualified`; production and public delivery blocked

Canonical skill: `b_roll@1.0.0`

Canonical provider operation: `provider.google.generate_b_roll_candidate.v1`

## Operator boundaries

B-roll runs only from an exact manifest-bound assignment, approved plan
snapshot, execution package, reservation, work item, and private artifact
scope. It may read whole-video context but may write only its assigned frame
range. It cannot select a caller model, endpoint, credential, executable,
command, path, or URL.

The source order is restraint first, eligible project source, approved user
asset, eligible approved-source edit, reference-image generation, then
text-to-video. Generated output is illustrative and is never proof. Wan,
Hailuo, Veo, Kling, stock-library, and generic provider-gateway fallbacks are
not B-roll routes.

Track All remains a separate skill. B-roll accepts only a content-addressed,
model-neutral `track_graph_v1`. If the approved plan needs tracking and the
artifact is absent, return `needs_other_skill`; do not select or execute a
tracking model.

## Internal qualification commands

Run from the repository root with the pinned project dependencies and Docker
available:

```text
npm run validate:skill-capability-manifests
npm run test:b-roll-capability-manifest
npm run test:b-roll-planning
npm run test:b-roll-canonical-integration
npm run smoke:b-roll-existing-source
npm run smoke:b-roll-provider-authority
npm run smoke:b-roll-provider-lifecycle
npm run smoke:b-roll-candidate-qa
npm run smoke:b-roll-remotion-integration
npm run smoke:b-roll-retirement
npm run smoke:b-roll-end-to-end
```

The final E2E command generates only local synthetic media. It injects the
provider outcome, records zero actual provider requests, executes real pinned
FFmpeg/FFprobe and Docker-confined Remotion work, and removes its temporary
private root on completion.

Also run the shared build, type, lint, frontend boundary, security, private
artifact, canonical work graph, provider lifecycle, and Remotion regressions
listed in
[`qualification-and-test-evidence.md`](./qualification-and-test-evidence.md).

## Result interpretation

- `use_no_broll`: keep the base scene; this is a professional result.
- `use_existing_project_clip` / `use_uploaded_user_asset`: run passed source
  inspection, exact trim/normalization, and private integration.
- `generate_with_gemini_omni`: one initial candidate is allowed after the
  approval and cost gates.
- `edit_uploaded_video_with_gemini_omni`: allowed only with an approved source
  and eligible region.
- `needs_other_skill`: preserve the assignment and wait for the named
  dependency, such as Track All.
- `needs_user_confirmation`: do not select automatically.
- `blocked`: do not execute provider, media, or render work.

Candidate QA is authoritative, not provider success. Version 1 may be accepted
or request the one approved refinement. Version 2 is final: accept after QA,
fallback to eligible source, use no B-roll, request user review, block, or fail.
There is no automatic retry or alternate provider fallback.

## Unknown outcomes and replay

An unknown provider outcome must be reconciled against the original attempt;
never submit a second generation request while the first may have occurred.
Exact idempotency replay reopens committed receipts and private checksums. A
changed request, component ref, source, candidate, QA observation, cost
authority, or result dependency must fail closed rather than overwrite the
existing record.

## Preview and handoff

Only the exact QA-normalized FFV1/NUT selection can enter integration. The
pinned media runtime may create the fixed VP9 Matroska technical proxy needed
by Chromium. Remotion renders a private preview only. Sound, Color, Transition,
Captions, Track All, Render, and final export retain final ownership.

Do not publish the preview, treat it as final export, spend customer credits,
or mutate a public timeline from this internal route.

## Live Gemini Omni canary

The canary is optional and must remain blocked unless every explicit external
gate is present. Run:

```text
npm run canary:gemini-omni-b-roll
```

Required operator-owned environment authority:

- `REEDITPRO_CONFIRM_GEMINI_OMNI_BROLL_EXECUTE`
- `REEDITPRO_GEMINI_OMNI_BROLL_SAFE_FIXTURE_ID`
- `GOOGLE_SECRET_GEMINI_API_KEY_NAME`
- `REEDITPRO_GEMINI_OMNI_BROLL_PRIVATE_ROOT`
- `REEDITPRO_GEMINI_OMNI_BROLL_MAX_COST_MICROS`
- `REEDITPRO_GEMINI_OMNI_BROLL_RATE_MICROS_PER_SECOND`

Without all six gates the expected result is
`blocked_external_prerequisites` with zero requests. A canary success alone
does not authorize production: the preview alias still lacks an immutable
accepted provider revision, and live security/privacy/rate/account review must
also pass.

## Incident response

On checksum, range, manifest, scope, QA, or lineage failure, retain the private
artifacts and sanitized receipts, stop only the affected work item, and do not
retry outside the approved policy. On a global authority or required-asset
failure, block final render/export. Meaning, proof, privacy, ownership, or
unapproved cost changes require user review and a new plan version.
