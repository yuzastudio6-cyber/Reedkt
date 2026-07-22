# Canonical Visual Calibration Objective QA Verification

Date: 2026-07-21

Verdict: `PRIVATE_INTERNAL_VISUAL_CALIBRATION_OBJECTIVE_QA_ACCEPTED_PRODUCTION_BLOCKED`

## Frozen identities

- Provider operation: `provider.google.generate_visual_calibration_candidate.v1`
- Provider route: `gemini_omni_flash`
- Provider model policy identity: `gemini-omni-flash-preview`
- QA work item: `run_asset_qa`
- Tool operation: `tool.ffmpeg.execute_approved_media_recipe.v1`
- Planning operation: `run_visual_calibration_candidate_objective_qa`
- Recipe profile: `approved_visual_calibration_candidate_objective_qa_v1`
- Runner profile: `offline_media_binary_visual_calibration_candidate_qa_v1`
- Internal QA cost profile: `ffmpeg_visual_calibration_candidate_objective_qa_cpu_2vcpu_2gib_v1`
- Runtime image: `reeditpro/ffmpeg-lgpl-internal:8.1.2-object-chunk-v8-local`
- Verified image digest: `sha256:e99a206b8e85b7670e61693899925fcb2e46fbf7662cdf2047ba82811d0caaa3`

## Canonical path

The accepted private path is one existing authority chain:

1. one immutable approved idea-first Storytelling snapshot and execution package;
2. one admitted visual-calibration provider work item;
3. one canonical package queue claim, lease and one-use provider dispatch;
4. one checksum-read-back private MP4 output and immutable provider-attempt receipt;
5. one dependency-bound QA job in the same package;
6. one canonical QA claim, worker lease and one-use tool dispatch;
7. exact private MP4 and first/last reference-frame re-read;
8. pinned networkless FFmpeg/FFprobe execution with cgroup-v2 observation;
9. create-only private JSON QA artifact, deterministic QA and reconciliation;
10. one compact source-verified QA consumer receipt.

No second Motion queue, registry, worker, lease, storage, metering, plan,
approval, snapshot or commercial authority was added.

## Objective media contract

The candidate is bounded to one private MP4 of at most 64 MiB, one video
stream, zero or one audio stream, 24 fps, 72 through 240 frames, 3 through 10
seconds and at most 921,600 pixels per frame. Each reference frame is a
checksum-bound private PNG of at most 16 MiB.

The ten reported gates cover runtime/container integrity, exact video stream,
dimensions, duration, frame rate, black-frame ratio, frozen-frame ratio,
maximum frozen run, motion ratio and first/last reference-frame similarity.
Malformed, missing-audio-policy, multi-video, oversize, wrong-frame-rate,
wrong-duration, traversal, checksum, reference-version and receipt-lineage
substitutions fail closed. A technically valid but frozen candidate produces a
truthful failed QA report instead of being reclassified as an execution error.

## Attempt-stable receipt semantics

The provider admission receipt retains the exact queue and dispatch aggregate
hashes observed at admission. Those aggregate hashes can legitimately advance
when the dependent QA job is claimed. Revalidation therefore also derives
`providerAttemptSourceDigest`, which binds every immutable provider claim,
dispatch attempt, terminal, output, readback and cost field while excluding
only unrelated aggregate evolution. The original admission receipt remains
immutable; downstream queue progress cannot invalidate it or hide tampering.

The planned asset ID and logical provider output key remain distinct. The
provider terminal binds the immutable planned asset ID, while dependency
matching uses the approved logical output key.

## Internal cost and commercial separation

Provider usage cost, provider-worker infrastructure cost and QA-worker
infrastructure cost are three separate internal-production-cost components.
Failed or unknown provider attempt cost remains retained. The QA dispatch is
the sole exact `approved_internal_production_cost_only` exception with a zero
customer-credit work-item budget and a positive immutable infrastructure-cost
ceiling. It still requires the approved snapshot and an active funded
reservation. Every other tool dispatch retains positive customer-credit budget
coverage.

The compact receipt exposes:

- exact project/edit/snapshot/package/work-item/job identity;
- provider operation, planned asset ID, logical output ID, output-set digest,
  claim/lease identity and attempt-stable source digest;
- QA operation/profile, lease, dispatch, attempt and private artifact identity;
- bounded objective measurements and ten pass/fail gates;
- separate provider, provider-worker and QA-worker rate/evidence/cost digests;
- `qaCostAuthorizationClass=approved_internal_production_cost_only`;
- `qaCustomerCreditBudget=0` and active-reservation-required truth;
- checksum-readback, no provider URL, no local path and no browser authority;
- production, promotion, billing, wallet, render, export and public-delivery
  flags fixed false.

## Verification evidence

The frozen source passed:

- `npm run smoke:offline-media-binary-visual-calibration-objective-qa`
  - moving 96-frame candidate passed;
  - frozen candidate failed objectively;
  - first/last similarity measured at 1,000,000 millionths.
- `npm run smoke:canonical-private-visual-calibration-provider-lifecycle`
  - exact V4 output asset/key identity, terminal, cost and no-transport proof.
- `npm run smoke:canonical-private-visual-calibration-objective-qa-e2e`
  - full approved snapshot/package/provider/private-output/dependent-QA/replay
    path, 10/10 gates passed;
  - observed test evidence: provider cost 0 micros, provider-worker 180 micros,
    QA worker 360 micros, selected internal total 540 micros.
- `npm run smoke:offline-media-binary-execution`
  - all existing pinned media profiles and confinement checks remained green.
- `npm run smoke:canonical-private-tool-dispatch`
  - the exhaustive 50-tool dispatch and execution matrix remained green.
- `npm run typecheck:server`
- `npm run lint`
- `npm run build`
- `npm run check:frontend-boundary` (860 files)
- `npm run check:secrets` (5,007 files, zero values printed)
- `git diff --check`

## Closed gates

This slice performed no real provider request, Secret Manager payload read,
remote Supabase or Google Cloud mutation, billing, customer credit mutation,
render, export, deployment or public delivery. Evidence remains
`private_injected_nonprovider_test` and `non_promotable_private_injected`.
Production requires a qualified live provider transport, deployed canonical
queue/lease/private-object runtime, released rate and usage authorities,
same-release staging evidence and the product release gate.
