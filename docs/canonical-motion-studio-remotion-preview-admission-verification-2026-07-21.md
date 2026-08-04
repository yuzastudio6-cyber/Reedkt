# Canonical Motion Studio Remotion Preview Admission — 2026-07-21

Status: `private_internal_canonical_admission_verified_production_blocked`

## Outcome

The four reviewed Motion Studio Remotion composition profiles now enter the
existing canonical ReEditPro pipeline through the one approved operation,
work-item type, worker class, snapshot, package, queue, lease, one-use tool
dispatch, private artifact, QA, and reconciliation authority:

- tool: `remotion`
- operation: `tool.remotion.render_approved_composition.v1`
- work item: `render_remotion_preview`
- worker: `render_worker`
- profiles:
  - `motion_studio_scene_preview_v1`
  - `motion_studio_native_layered_scene_v1`
  - `motion_studio_prepared_script_animatic_v1`
  - `motion_studio_deterministic_route_draw_v1`

No second registry, queue, lease, dispatch, renderer, snapshot, estimate,
persistence, or billing authority was introduced.

## Frozen planning authority

`canonical-motion-studio-remotion-preview-binding-v1` binds one exact private
preview to the current workspace, project, edit session, production, canonical
Storytelling style component, style selection, Motion DNA, Reference Contracts,
source audits, calibration plan, internal-cost envelope, approved Prepared
Script, locked SceneDocuments, confirmed output frame, Master Timing authority,
and profile-specific private review frame.

The binding is content addressed and deliberately non-promotable. It records:

- `sourceRepositoryReverified = false`;
- `privateInternalControlledExecutionOnly = true`;
- no provider execution;
- no customer price, customer credits, or service fee;
- `productionReady = false`.

The animatic additionally requires exact narration authority. All other
profiles reject narration authority. A changed style component, timing plan,
frame, production identity, profile, or binding hash fails before publication
or execution.

## Profile dependencies

The source-verified planning and lease rules are:

| Profile | Required dependency | Maximum bytes | Frame-golden proof |
| --- | --- | ---: | ---: |
| Scene preview | none | n/a | 3 frames |
| Native layered scene | one QA-passed private `image/png` | 1 MiB | 3 frames |
| Prepared-script animatic | one QA-passed private `audio/wav` | 16 MiB | 3 frames |
| Deterministic route draw | one QA-passed private `image/png` | 8 MiB | 5 frames |

For dependency-bound profiles, the worker accepts only the artifact selected by
the active canonical lease. It reopens that private object server-side, verifies
tenant/snapshot/job/work-item/lease/dispatch identity, artifact version, QA,
reconciliation, content type, byte ceiling, and SHA-256 readback, then builds the
committed Remotion request in memory. Browser paths, URLs, bytes, artifact IDs,
provider routes, commands, credentials, and executable selection are not
accepted.

The private MP4 identity, actual-run evidence, artifact QA, and response bind
the profile, dependency-read evidence when present, independent FFprobe result,
and exact frame-golden evidence digest. Ordinary dependency-free ReEditPro
previews keep their prior behavior.

## Runtime evidence

The confined runtime retains the reviewed implementation from the Motion
integration source at `7ed83671` and has the following source SHA-256 values:

- protocol: `2e830a090f0d4c1c52af49fd9a3fc4183d6cc921c0ace1f45f1dddb6ba8f18a7`
- service: `5c14d22473c15c067a2764e5187df88eadeed5da821941903f52e9c5645ecf57`
- types: `680663e64427bda942349b7ede932e3c787515c54f55e4db5c084dc541903fce`
- runner: `0db7896b6f05f76b060426e579c118e954dfc001824c28e1db26e02e05c2576f`
- composition: `c1a4ab569a93e8430062560884e1800f02f2e0cfb326e065cd9c745edb0de9b4`

`smoke:offline-remotion-render-execution` proves all four profiles on this exact
backend source using bounded, server-created in-memory fixtures. It renders real
H.264 MP4 bytes under the pinned zero-network, read-only, non-root Docker
runtime and verifies the exact frame-golden sets. The ordinary preview and
approved final-composition regression remains green.

`smoke:canonical-private-tool-dispatch` additionally proves the native scene
and dependency-bound layered profile through canonical planning publication,
immutable approval, synthetic internal-test reservation, package/job derivation,
lease, one-use dispatch, exact private dependency read, execution fence,
create-only artifact persistence, objective FFprobe QA, reconciliation, replay,
downstream dependency verification, terminal review, and revision. The same run
retains 50 canonical E2E tool identities and 20 exact payload validator families.

The approved-snapshot secret scanner has one narrow semantic exception for the
four fixed `motionToken` enum values. Any caller-selected value and all ordinary
credential/token fields remain rejected.

## Closed gates

This slice does not authorize or claim:

- source-less/idea-first Storytelling canonical plan admission;
- a deployed queue, worker, or shared multi-replica persistence authority;
- provider or Secret Manager access;
- Google Cloud, Supabase, RLS, Storage, or deployment changes;
- production rendering, export, public delivery, or release readiness;
- customer pricing, credits, service fee, wallet mutation, billing, or charging;
- provider or infrastructure attempt-cost metering for these Remotion previews.

Internal production cost remains separate from future customer price and
credits. The existing style internal-cost envelope is hash-bound, but observed
Remotion worker resource usage and an immutable rate-card settlement remain a
separate production gate.

The next dependency-safe backend slice is the separately reviewed
`canonical-motion-studio-storytelling-production-authority-v1` admission for
exact `idea_first_no_uploaded_media`. It must be a distinct forward-only change:
`sourceSequence = []` and source cleanup `not_applicable` may be accepted only
under that verified authority, never by fabricating upload records or weakening
ordinary edit source requirements.

## Verification commands

```bash
npm run smoke:approved-snapshot
npm run smoke:offline-remotion-render-execution
npm run smoke:canonical-private-tool-dispatch
npm run typecheck:server
npm run lint
npm run build
npm run check:frontend-boundary
npm run check:secrets
git diff --check
```

Production readiness remains `false`.
