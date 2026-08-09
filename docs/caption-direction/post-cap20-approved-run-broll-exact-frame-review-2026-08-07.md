# Caption + B-roll exact-frame professional review

Date: 2026-08-07  
Disposition: `accepted_caption_owned_exact_frame_typography_and_layout`  
Whole-skill terminal qualification: `not_claimed`

## Outcome

The approved Caption + B-roll integration now renders both full-motion and
reduced-motion private review variants at the exact confirmed
`3840x2160@30` output frame. Direct inspection covered every rendered frame in
ordered contact sheets and opened original 4K entrance, hold, transition, and
exit rasters for both variants.

This closes the internal exact-frame typography/layout gap. It does not claim
final source-picture quality because the admitted B-roll input remains the
disclosed `640x360` private proxy. It also does not replace the canonical final
canvas, qualified postrender AI review, independent final QA, billing, public
delivery, or production owners.

## Exact evidence

- Real private source SHA-256:
  `833a101e4028ee6ed70ffe18fea942bd4be76e41901b4b4bbb4cd79f736724cc`
- Immutable approved snapshot SHA-256:
  `041177b23dddaf7cf3539ddd9bd8ecb27ff2155e4d5518e2b05bf3a0325a3b01`
- Approved execution package SHA-256:
  `d0f46e5d50abdfe33d75c440fa79da3a18ad350d8cbc6ddc3ed5830363c4a4af`
- Exact confirmed-frame authority SHA-256:
  `56e76a7ed2208a8ab16317c6bfc77821acfceebb63ba1fb819ca995cb53c3a3a`
- Exact-frame review package SHA-256:
  `b3dc155609d3635b65ea7820abdfff670790e07ba35ee6d391954435c5ebc344`
- Full-motion 4K MP4 SHA-256:
  `47b2d2babdf04077de28b28f52e8768fa5a30a6b29be9f084eba175ce7ebe6cf`
- Reduced-motion 4K MP4 SHA-256:
  `ee189383982dd91b8641b72cab5000889d4f77a694ced60554636a08d7a97c77`
- Full-motion every-frame contact-sheet SHA-256:
  `73525f73edf52bbea339a52ea8623146544bc4d40f20b039d082f82ba7c23a2d`
- Reduced-motion every-frame contact-sheet SHA-256:
  `b289af8f65196fd8d0d07d8e422e22ad7facac0d933fdb225aa206953ee92fb3`
- Closed inspection receipt digest:
  `38e80d61533f88763528bbe56791d41558cb9bbba027f91a4dfc94cc3e9c6d96`
- Serialized receipt-file SHA-256:
  `abef2be4ea1b725f6072e1d319758f03f3bc2efb0bb6e439958acb7536176b98`

Both MP4s contain exactly 127 H.264/YUV420P/BT.709 frames at 30 fps and
`3840x2160`, with a measured duration of 4.288 seconds. The two `16x8`
contact sheets represent 254/254 rendered frames. Five original 4K inspection
frames and four original 4K transition frames were opened for each variant.

## Direct visual findings

- the source subject remains undistorted within the restrained blurred side
  fill;
- Caption remains above the B-roll layer;
- semantic hero text and the accessible caption plate stay distinct;
- neither the face nor the active hand gesture is obstructed;
- no caption clipping, phrase overflow, unsafe edge contact, stuck layer, or
  truncated tail is visible;
- full and reduced variants preserve wording, semantic emphasis, placement,
  and readable contrast;
- reduced motion removes decorative movement without removing information.

The accepted visual design is the professional `TODAY` / `AI SOFTWARE` hero
layout with a separate accessible speech plate. The earlier bright diagnostic
fixture remains plumbing evidence only and is not the Caption design.

## Fail-closed transport correction

The first exact-frame attempt rendered successfully but tried to return five
4K PNG goldens together with the 4K MP4 through one bounded Docker response,
which exceeded the existing 24 MB confinement ceiling. The ceiling was not
raised. The corrected V6 transport returns the exact 4K MP4 plus explicitly
declared `640x360` runtime-golden proxies; all authoritative 4K inspection
rasters are then decoded from the exact returned MP4 after the render process
has exited.

The old evidence root remains immutable and replay correctly failed closed
after the source-bound runtime changed. The accepted V14 run uses a fresh
create-only root bound to the requalified source.

## Verification

- approved run: 17/17 Caption jobs and 13/13 B-roll work items;
- full and reduced exact-frame render: passed;
- focused exact-frame contract smoke: 15 assertions;
- direct-inspection receipt: positive receipt plus three semantic tamper
  refusals;
- B-roll/Remotion requalification: 31 command proofs and 36 fixtures,
  `internal_execution_qualified`;
- full server typecheck, build, lint, frontend boundary, runtime security,
  execution boundary, and idempotency proof: green in requalification;
- all Caption Remotion/Docker/FFmpeg/FFprobe children stopped before direct
  visual inspection.

## Remaining internal gates

- qualified shared postrender visual-AI review for the exact rendered output;
- complete motion-playback review;
- final-canvas render using final-quality source media rather than the bounded
  source proxy;
- independent final QA/private-review recommendation;
- terminal whole-skill projection after all exact shared-owner evidence is
  mounted.

The current first runtime blocker remains
`postrender_visual_intelligence_evidence_missing`. All provider, dispatch,
repair, asset-mutation, final-QA, billing, public-delivery, and production
authority flags remain false.
