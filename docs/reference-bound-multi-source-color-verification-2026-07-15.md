# Reference-Bound Multi-Source Color Verification

Status: `implemented_local_private_bounded_evidence`

Status date: 2026-07-15

## Scope

The canonical private pipeline can compile and execute one exact two-source,
source-only professional-color plan when all approved authority matches the
bounded profile. The first source establishes the reference grade. The second
source waits for that exact QA-passed reference artifact and applies the
approved reference-match recipe before final composition.

This slice keeps the existing product rule that every initial edit estimate is
priced with the universal 3840x2160 4K UHD cost basis. The same approved
deliverable may select covered 1080p, 2K/1440p, or 4K output without another
estimate, reservation, or credit prompt. A materially revised deliverable must
return to planning and approval.

## Exact Executable Chain

1. Persist the server-owned planning handoff with exact source order, source
   hashes, confirmed frame, Edit Preferences, Edit Brief, Master Timing Plan,
   cleanup decisions, color operations, and the required 4K estimate ceiling.
2. Publish and separately approve the immutable canonical plan, then create the
   synthetic private-test reservation and derived work graph.
3. Execute the first source with
   `approved_source_color_delivery_matroska_v1` and persist its lossless VP9
   BT.709/yuv420p Matroska artifact only after pixel, histogram, clipping, and
   container QA pass.
4. Make the second color work item depend on that exact first artifact. Reopen
   its bytes through private storage, verify its hash and lineage, and execute
   `approved_source_color_match_delivery_matroska_v1` with the fixed
   `approved_reference_three_frame_rgb_match_v1` policy.
5. Analyze representative target and reference pixels, derive bounded
   exposure/white-balance/contrast/saturation/clarity correction, and record
   objective before/after luma and RGB-chromaticity distance. The artifact is
   accepted only when the committed tolerances pass.
6. Compose the two color intermediates in approved source order with the two
   source-bound replacement voice tracks, two timed caption artifacts, and the
   immutable zero-duration hard cut.
7. Run independent final FFprobe QA, sample decoded frames on both sides of the
   source boundary for objective chromaticity continuity, reconcile every
   artifact, prove deterministic replay, and verify authenticated private
   download integrity.

The browser does not supply commands, paths, bytes, dependency artifacts,
runtime settings, or execution authority. The backend derives all of them from
the immutable approved snapshot and one-use dispatch grant.

## Verification Evidence

The following commands passed with exit code 0 on 2026-07-15:

- `npm run typecheck:server`
- `npm run lint`
- `npm run build`
- `npm run smoke:canonical-planning-publication-client`
- `npm run smoke:offline-media-binary-execution`
- `npm run smoke:offline-remotion-render-execution`
- `npm run smoke:canonical-private-color-execution`
- `npm run smoke:canonical-multi-source-final-composition`

The focused multi-source result proved:

- immutable planning, snapshot, and 4K estimate authority;
- synthetic private-test reservation without a customer charge;
- two source trims, two captions, two voice artifacts, and two color artifacts;
- reference-artifact dependency lineage and hash-bound shot matching;
- target/reference hash-tamper rejection;
- objective match QA and final boundary continuity;
- single-use dispatch, private persistence, reconciliation, replay, final QA,
  and private download;
- provider, billing, public-delivery, external-beta, and production readiness
  flags remained false.

The authoritative `npm run qa:canonical-private-pipeline` command also passed
all 18 phases in 580,973 ms with exit code 0. It included 11/11 signed-in
Chromium journey scenarios and evidence revision `2026-07-15.30`, which reports
exactly 50 private canonical end-to-end and job-adapter identities. The full
dated result is also recorded in
`docs/canonical-private-pipeline-verification.md`.

## Honest Boundary

This is bounded local/private SDR evidence, not general production color
science. It proves exactly two short synthetic sources, a first-source
reference, three representative RGB samples per source, bounded global
correction, VP9 Matroska intermediates, and one exact hard-cut composition.

It does not prove arbitrary reference selection, more than two color-matched
sources, per-shot scene detection, masks, skin-tone isolation, LUT workflows,
OpenColorIO-managed transforms, HDR or wide-gamut delivery, long-form drift,
camera-log normalization, live GCS, distributed workers, public rendering, or
production operations. Global RGB statistics are useful objective evidence for
this controlled fixture; they are not a substitute for scopes, color-managed
monitoring, professional human review, or a broad real-footage corpus.

No provider was called, no Supabase or migration action ran, no customer wallet
or billing state changed, no deployment or public delivery occurred, and no
Motion Studio or MS-001 scope was modified.
