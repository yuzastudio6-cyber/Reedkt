# CAP-14 Real-Source Professional Appearance Correction

Milestone: `CAP-14 real-source correction`

Status: `accepted_bounded_real_source_renderer_evidence`

## Outcome

The colored engineering fixture remains a deterministic layout and contract
regression only. It is not evidence of the intended Caption product appearance.

This correction adds the separate
`caption_direction_real_source_scene_group_v2` profile to the existing
`tool.remotion.render_approved_composition.v1` owner. The additive profile
renders Caption Direction layers over an exact private talking-head source
proxy, preserves source audio, produces full-motion and reduced-motion variants,
and requests fixed PNG evidence for direct inspection. It does not replace or
silently modify the frozen V1 engineering fixture.

## Exact source and frame authority

- original private source SHA-256:
  `a1640b8a2da4bf076c6ecfbd57d6cf51c1c2beea3536085c1b932c04c3dbf1f0`;
- reviewed source interval: `8080` through `12300` milliseconds;
- private review proxy SHA-256:
  `833a101e4028ee6ed70ffe18fea942bd4be76e41901b4b4bbb4cd79f736724cc`;
- confirmed output frame: `1080x1920@30`, exact `9:16`;
- disclosed private review proxy: `360x640@30`, exact one-third scale;
- source duration: `127` video frames;
- fixed inspection frames:
  `0, 5, 8, 12, 21, 37, 38, 45, 80, 118, 122, 126`.

The two phrases were reviewed specifically for this fixture. Their timing is a
phrase-level synthetic estimate. It is forbidden from claiming canonical
transcript qualification or word-locked motion.

## Rejected attempt and repair

The first real-source render completed technically but was visually rejected.
At the inspected cue frames:

- the `TODAY` hero treatment crowded the speaker's chin and moving hand;
- the `AI SOFTWARE` hero treatment collided with the stable caption plate;
- the second stable phrase wrapped into an oversized four-line block; and
- vertical padding inherited a widescreen scaling assumption and overflowed the
  declared plate.

No visual pass was issued for that attempt. The repair:

- changed review-space scaling to the smaller of the width and height scale;
- moved all Caption layers into the reviewed lower composition;
- reduced stable-caption type size and increased its bounded layout height;
- simplified the second hero treatment from `AI SOFTWARE` to `AI` while
  retaining exact source-word lineage;
- kept the complete spoken phrase in the accessible stable track; and
- added an entry-transition frame so full and reduced motion are compared at an
  actually moving instant.

The earlier private scratch output was never admitted as formal evidence. The
accepted hashes below are the first frozen real-source appearance receipt for
this profile.

## Accepted runtime evidence

- source-bound image ID:
  `sha256:89872a8922633729c2f0d120157e769a620e5456d40fbfb1e1c84a31ed475228`;
- exact-replay image ID:
  `sha256:7af6191e3ef4615e8556e1bd7e3095b0fb1efdd29df92fadb9f7153354f3a39c`;
- renderer source-tree SHA-256:
  `a3a1fdc47fbbc762c90de7e3063cd50e936f7286c35a729c1e7d2f1ab1091ebf`;
- create-only evidence identity:
  `accepted-f261ff6390beb66c-8ee9cb1b28893cd4`;
- full-motion MP4 SHA-256:
  `200abd32615cbed07739243880ed7993998609451ad911a1bddac9e686fa939f`;
- reduced-motion MP4 SHA-256:
  `b8b87995c9031a0221a304bd1c06bfe6beeb1c186b5818d28758fd511f606e74`.

Both MP4s contain exactly 127 H.264 video frames at `360x640`, `30/1` fps,
YUV420P limited-range BT.709 and a two-channel 48 kHz AAC stream. Container
duration is `4.288` seconds because the AAC stream carries its normal encoded
tail; the video frame count remains the exact timing authority.

| Frame | Full SHA-256 | Reduced-motion relation | Direct visual finding |
| ---: | --- | --- | --- |
| 0 | `ad69f35e780524c789e77fa969dda8a85692defa168bf0f7f7aebc6e2eb4b14c` | pixel-identical | pass — source-only opening; no caption ghost |
| 5 | `0643c53570cde67917cdf0ead9e9aba903cd95ba1a7824812f2111db71a6ad6a` | pixel-identical | pass — bounded entry begins without clipping |
| 8 | `0604eecb998f79c7f933a3ea358dbf338e6ff16235ae5b48c4903fce0446d6ff` | reduced is `891cfb97d3b274a05a449aec6107831047382de5f11a3b053f63aeb5e05b53fc` | pass — motion differs while wording/layout remain stable |
| 12 | `f91642fedd431e2fdc2803bdf1bfbc2e8fc7caa3e3bf1fb44ad30ac176e2d7d6` | pixel-identical | pass — `TODAY` and full phrase are readable below the face |
| 21 | `10d58c711e7bd5f34c10909ccd88fdaa2b11200662541464025863f2e826e22e` | pixel-identical | pass — face and raised hand remain unobstructed |
| 37 | `ae86e80d188452c5dbab66b038797640967ceef556ca05c594b4bc9d2b416857` | pixel-identical | pass — first cue exits cleanly |
| 38 | `5289fdbb0dd76fb4a2657a7abcceec10be0e5fae17f83b287d6381683a82a002` | pixel-identical | pass — phrase boundary has no stale layer |
| 45 | `f3f060cc004f08f3132b7cd19347d41eca5b3970170d16a92eb5299b69bfd2b7` | pixel-identical | pass — second cue hierarchy is clear |
| 80 | `f44d172cb6233c92feaaea24573ffe5eb1656c6b8ed133750cf43cafdfca0152` | pixel-identical | pass — `AI` accent and complete phrase do not collide |
| 118 | `f883a1f316cecf1689edd372dfebe9fc16a9e05857603f7b3b529f6ae070467e` | pixel-identical | pass — late pose remains readable with clear face/gesture space |
| 122 | `f8ca0bb244b819d733367d1d0fa8eff879437cf0590ba0492c5068122bed6855` | pixel-identical | pass — caption exit is complete |
| 126 | `6f46da726f7e98f63b9bf0e5c1c018edec2d112844a816458ef23eb073b43ea4` | pixel-identical | pass — clean source-only tail |

Every distinct raster in the fixed set was opened and judged directly after
all render children exited. Matching full/reduced hashes were checked as exact
pixel equivalence rather than relabeled as separately different pictures.

## Contracts and owners

New Caption-owned source contracts:

- `caption-remotion-real-source-review-spec-v1`;
- `caption_direction_real_source_scene_group_v2`.

Existing owners reused:

- StoryTiming remains the frame owner;
- the canonical Remotion operation remains the renderer;
- Caption owns only its phrase, typography, motion, and review specification;
- the source media owner remains external and is represented by exact refs and
  digests;
- final canvas, independent final QA, asset admission, billing, public delivery,
  and production remain external and false.

No second renderer, source reader, transcript owner, mask owner, provider
dispatcher, work queue, asset manifest, final-QA owner, or delivery owner was
created.

## Tests and inspection

- `smoke:captions-specialist-cap-14-real-source`: 22 assertions passed;
- `smoke:captions-specialist-cap-14`: all 46 frozen V1 assertions passed;
- focused ESLint: passed;
- server TypeScript check: passed;
- full and reduced real-source runtime renders: passed;
- create-only exact replay against the same evidence identity: passed with
  byte-identical MP4 and PNG hashes;
- direct inspection of the fixed real-source raster set: passed after one
  rejected and repaired attempt;
- FFprobe technical inspection of both accepted MP4s: passed.

## Known limitations

- this is bounded private renderer evidence, not complete-track or final-canvas
  qualification;
- the fixture wording is phrase-level human-reviewed text, not an authenticated
  canonical transcript reread;
- no word-locked motion is claimed;
- no Track All/SAM 3.1 mask, anchor, depth, or behind-subject execution is
  claimed;
- selected-frame direct inspection is not complete-time qualified visual-AI
  review or independent final QA;
- public, billing, delivery, and production authority remain false.

## Next

Carry this accepted real-source evidence into Caption QA and the private
qualification ledger, then continue the authenticated transcript, Visual
Intelligence, Track All, SoundSync, B-roll, complete-time visual review, and
independent private-review integrations required for terminal Caption
qualification.
