# Living Frame Active Private Visual Audit — 2026-08-01

This record covers the first successful execution of
`living-frame-active-private-internal-test-v1` after the owner-scope amendment.
It is private engineering evidence, not professional QA approval.

## Aggregate result

- Frozen starting commit: `69058c727d9188779a8ac6935eb95ab2e151dd58`
- Runs: 15 of 15 passed
- Active cases represented: 12
- Paused scopes rejected: 7
- Source-contract runs: 11
- Private engineering media runs: 4
- Private review videos: 5
- Run-set digest: `e70a3fcaf929e7236cd5c828434c73bb9a3c23e89c097c2db10cea2a75a9a873`
- Case-set digest: `be80269768992733c118096f7f96541f056bc44023bf10a2023d2114eb728653`
- Aggregate report digest: `cbc90c80a0428f310871929b3421b325dcf31398f18353cdf4aabc4d96f9bb62`
- Reported state: `engineering_runtime_executed_professional_canonical_evidence_incomplete`
- Production ready: false

The aggregate correctly reports that professional visual inspection, separate
canonical audio evidence, Head QA recommendation, canonical private review,
and active-case completion are all false.

## Fail-closed corrections discovered by the run

The first run stopped before rendering because the nine-scene, single-source
five-mode fixture requested 270 frames while the canonical source-segment
profile permits at most 240. The fixture now uses nine 26-frame scenes, or 234
frames total. Scene samples and decoded-audio windows are derived from exact
frame ranges rather than stale second offsets.

The second aggregate attempt stopped on an early environmental-particle fade.
Approximately ten review pixels changed, which is not enough evidence for a
perceptible particle or a stable centroid. The review adapter now requires both
a meaningful projected-alpha footprint and at least 24 changed decoded pixels.
Early fades remain explicitly preserved as sub-perceptual frames; frames that
claim perceptible particles must still pass visibility and centroid checks.

Both focused regressions and the final aggregate passed after these corrections.

## Exact review artifacts

| Artifact | Frame | Frames | Bytes | SHA-256 |
| --- | --- | ---: | ---: | --- |
| Five-mode engineering render | 640×360 at 30 fps | 234 | 771,797 | `019c84218342c9e699dcc6ecfd4853c64068b5a454552974c856830038d08284` |
| Motion-v3 engineering render | 640×360 at 30 fps | 60 | 130,381 | `8a125bd2bc11a809ff1cdf970bf3ad91c3faab084f99bd862a0a2e2b4ef7ebfa` |
| Environmental-particle engineering render | 640×360 at 30 fps | 105 | 51,496 | `3048e80f7843948aa5cc42799a25477fc489309e18ec822a5aa6057dadf3b79a` |
| Confirmed custom-ratio render | 480×600 at 30 fps | 30 | 87,058 | `a6080b55b4031e60d6b64a13c357382f6a6f96865ea6653f6f9449373771860e` |
| Confirmed portrait render | 360×640 at 30 fps | 30 | 85,300 | `0b5fa4016f3887e25d217562134df174687a9b5fe18c107105860ac1d6d6b025` |

## Direct visual inspection verdict

The agent inspected dense all-frame contact sheets for every exported video in
addition to the technical measurements. Professional appearance is rejected.

1. The five-mode and motion-v3 outputs use synthetic grids, rectangles, and
   placeholder cards. They validate timing, layering, depth, transforms, and
   fallback mechanics but do not resemble professional editorial footage.
2. The particle output is technically present and its full timeline is
   preserved, but the effect is largely imperceptible against the test plate.
   It does not demonstrate a finished environmental treatment.
3. The 4:5 and 9:16 takeover fixtures visibly clip the white title treatment at
   the top boundary during the full-frame expansion.
4. The motion-v3 fixture allows moving blocks to enter the caption placeholder
   region. Caption z-order is preserved, but spatial collision avoidance is not
   demonstrated.
5. The fixtures contain no qualified representative source media, project-
   appropriate art direction, complete-time Qwen evidence, or Head QA result.

The review videos therefore remain negative/engineering evidence only. Their
green deterministic checks must not be interpreted as professional approval.

## Required next evidence

1. Ingest and privately approve representative source media for all active
   cases.
2. Render content-earned non-character Living Frame scenes using the confirmed
   frame and exact action-specific direction.
3. Run deterministic QA and complete-time provider-backed Qwen inspection.
4. Provide separate verified SoundSync/audio evidence.
5. Obtain Kimi-primary or classified Terra-fallback Head QA recommendation.
6. Create artifact N+1 for every repair and rerun all QA and inspection.
7. Reconcile the accepted artifact through canonical private review.

Living/illustrated character animation, complete-character keyposes,
ToonCrafter/RIFE character interpolation, all living-subject rigs, and
mechanical rigging remain paused and non-admissible. Static illustrations may
remain unanimated. This audit grants no provider, dispatch, asset, QA-approval,
cost, billing, public-delivery, or production authority.
