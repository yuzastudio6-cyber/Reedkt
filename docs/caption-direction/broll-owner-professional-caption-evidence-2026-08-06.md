# B-roll owner professional Caption evidence — 2026-08-06

Status: `accepted_caption_owned_professional_appearance_outside_terminal_scope`

## Outcome

Caption now has a real-footage, owner-bound B-roll co-composition proof through
the additive Remotion profile
`caption_direction_broll_owner_real_source_scene_group_v4`. This evidence is
specifically intended to prove professional Caption appearance over an actual
B-roll owner result. It does not reuse the synthetic color-bar fixture as
appearance evidence.

The proof binds:

- the exact persisted `b_roll_caption_owner_read_result_v1` digest
  `4c816bcd9b940f0bb8aa0b0a05b5dbf96aafc414b4b50e185872f1e9ba19fe88`;
- the owner-selected, audio-removed 72-frame normalized source digest
  `7ae4d2cc3dcb9123539575264c39bbdf90e6043b43eac101e787c0b710cb1765`;
- the approved Matroska Remotion proxy digest
  `8f09cc84c0d9442b2dd6a0a12c7fe378d4e1693c91f87c712a67d4affd317851`;
- the exact `1920x1080@24` confirmed output frame;
- the exact MasterTiming interval `[120, 192)`; and
- the B-roll owner request, result receipt, selected-media, layout occupancy,
  crop timing, visible-text, and authenticated owner-evidence references.

Caption does not select B-roll, change its crop or timing, claim Track All
evidence, or preserve audio that the owner intentionally removed. Remotion
remains the composition owner.

## Visual inspection and repair

The first full and reduced-motion renders passed their technical checks but
were visually rejected. The hero words `TODAY` and `AI` were centered over the
speaker's face. A technical pass was therefore not accepted as professional
visual evidence.

The repair:

- moved hero typography into the open blurred area on the left;
- retained the stable accessible caption in the lower safe band;
- kept the speaker's face and gesture unobstructed;
- preserved the exact B-roll selection, proxy, timing, wording, and output
  frame; and
- published new immutable repair-spec identities and a layer-derived
  scene-group digest.

The rejected and accepted artifacts remain version-separated. The accepted
private artifacts are:

| Variant | Review spec digest | MP4 SHA-256 |
| --- | --- | --- |
| Full motion | `1e0c167c4da7d5c143f17020d0a949b6262b25d7dfd7203d731fcba1a109fa98` | `a75bcfe4dabd4ca4af1cc0893150e4ee66971efd585b826ae2082a95ae76babf` |
| Reduced motion | `715d792bec411cd74edd5d4f113da85474c92db25680bf8e320fc0cc6704ed0e` | `a6e5f9089d8be6834fffa504c9653a566412ba544cf55f854747b964f8583128` |

Both videos are `640x360@24` private one-third review proxies containing 72
frames. They do not claim the final customer canvas.

## Complete-time evidence

Direct visual inspection covered:

- all 72 frames of full motion;
- all 72 frames of reduced motion;
- 14 original-resolution entrance, hold, transition, and exit frames; and
- the rejected face-obstruction frames retained as repair evidence.

The complete-time sheet digests are:

- full motion:
  `106980eecde584806aa0bc718c203c320ece7f15a4c08eeaf075712a3e7baf2d`;
- reduced motion:
  `381dc4977d4ee200b3343cb5291030863d5078285f9a25f71327a3caa4fdcf6b`.

The accepted direct-inspection receipt is
`caption-broll-owner-professional-direct-inspection-v1`, digest
`93f1a59310c6fa5e41f57b39e4b6db6ae82d7b015a800b50ad3b6235ef818adc`.
It records no source substitution, aspect distortion, face/gesture
obstruction, clipping, overflow, hero/stable collision, unstable placement,
bad cue transition, stuck layer, or tail truncation.

## Boundary

This evidence improves Caption-owned professional appearance and B-roll
co-composition qualification. It remains outside one exact terminal canonical
edit run and does not replace:

- a canonical transcript/diarization owner result;
- qualified shared postrender visual-AI review;
- independent final QA and private-review decision;
- a final multi-job terminal qualification projection; or
- provider, billing, public-delivery, or production readiness.

All operation-dispatch, asset-mutation, final-QA approval, billing,
public-delivery, and production authority flags remain false.

## Canonical consumption adapter

The accepted receipt is no longer limited to a progress-ledger reference. The
additive `canonical-caption-broll-owner-inspection-projection-service-v1`
adapter can project it into the existing
`canonical-caption-direct-visual-inspection-evidence-v1` repository without
creating a second visual-evidence or final-QA owner.

The adapter requires independent, twice-reread inputs for:

- the tenant-scoped, create-only inspection bundle containing the accepted and
  rejected full/reduced specs plus the inspection receipt;
- the exact authenticated B-roll owner result and Caption evidence record; and
- the canonical approved-run authority binding the immutable snapshot,
  execution package, output, scene, MasterTiming range, confirmed frame,
  deterministic QA, selected normalized source, render, and approved source
  manifest.

It rejects crossed sources, review specs, scenes, support requests, outputs,
owner records, changing rereads, stale digests, create-only collisions, and
caller-supplied receipts or authority. Exact replay produces the same canonical
direct-inspection evidence digest.

This closes the source-level canonical projection seam. It does not pretend the
projection alone is an approved-run or terminal qualification result.

## Approved-run and campaign mount

The additive mixed-inspection qualification path now consumes that projection
without changing its owner. `canonical-caption-private-qualification-run-
controller-v2` persists and rereads the exact B-roll inspection bundle, invokes
the existing projection service, then asks the existing canonical approved-run
reader to assemble the complete run. Missing downstream evidence returns a
waiting disposition and cannot be promoted.

`canonical-caption-private-qualification-campaign-controller-v2` carries the
result alongside uploaded-source runs using distinct request versions and an
explicit inspection-lane field. It still requires multiple immutable approved
snapshots and an exact declared catalog. The V1 uploaded-source controller and
campaign remain unchanged for compatibility.

This mount does not change the current terminal count. A fresh canonical run
must still supply all work, owner, deterministic QA, qualified shared visual
review, independent final-QA, and private-review evidence before the run or
41-job catalog can advance.
