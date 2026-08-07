# Caption original-source final-quality render evidence

Date: 2026-08-07

Disposition: `accepted_private_stable_caption_baseline`

Terminal eligibility: `false`

## Outcome

The Caption specialist now has a private, source-bound delivery-master proof
that starts from the original uploaded phone-camera file rather than the prior
`360x640` review proxy. The bounded run reads the exact immutable source,
selects source frames `242..368`, normalizes the source's actual
`30000/1001` cadence to the confirmed `30 fps` output clock, creates a
professional BT.709 color intermediate and speech-safe voice track, renders
two reviewed-font libass caption cues, and composites the final result through
the existing private Remotion owner.

The final artifact is an actual `2160x3840@30` H.264/AAC MP4 with exactly 127
frames. It is private internal evidence only. It is not a public delivery,
whole-skill terminal qualification, or a claim that every creative Caption
style has been visually qualified.

## Exact evidence

- Original source:
  `/Users/macuser/Documents/test video/internal testing.MP4`
- Original source SHA-256:
  `a1640b8a2da4bf076c6ecfbd57d6cf51c1c2beea3536085c1b932c04c3dbf1f0`
- Original source frame:
  `1728x3072`, HEVC, `29.97003 fps`
- Runtime index SHA-256:
  `c6fffac088ae92a62ccdff0660055d45a9846c84e7c033991f3b72bd47f0b01d`
- Professional color intermediate SHA-256:
  `6a6f175342124d20861cb39258edad4c8363131624b679d402ea8ba7a9b6d2e5`
- Final MP4 SHA-256:
  `2d73a761c667c4d40ced1c160d0a5f550bdc4f5987cd3cc70c868892b7b79840`
- Final MP4 byte length: `19,312,956`
- Direct-inspection receipt digest:
  `sha256:41acf13fe0cabc2cb43bd8a689696d0c9e9a7af0e9133edd779a0b5a4b93d28c`
- Direct-inspection receipt file SHA-256:
  `3f7f6f994516d2b46606e1720710b6623fe2a513287b962a5610597fedbc2e9f`

The private evidence root is:

`/Users/macuser/.codex/private_caption_evidence/caption-original-source-final-quality-2026-08-07-v1`

## Runtime correction

The first real-source probe exposed an actual canonical intake defect: FFprobe
received uploaded MP4/MOV data only through a non-seekable pipe. Real camera
files may store their movie index at the end and require seeking. The runtime
now stages the already checksum-bound server input in its existing create-only
private spool and mounts it read-only inside the networkless confined
container. Caller paths remain absent from the wire contract, the exact source
hash is reread, and the private spool is removed after execution.

## Direct visual findings

The extraction runtime was stopped before review. Direct inspection covered
four contact sheets representing all 127 frames, plus full-resolution samples
at the no-caption, cue-on, cue-transition, cue-off, and tail boundaries.

- frames `0..4`: no caption;
- frames `5..37`: `Hey guys — today.`;
- frames `38..122`: `I'm launching my new AI software.`;
- frames `123..126`: no caption;
- caption edges remain inside the horizontal safe margin;
- no caption clips at the canvas edge;
- no caption covers the speaker's face;
- the white glyphs and dark outline remain readable over the shirt;
- the source picture, skin tone, and background remain visually continuous;
- the delivery-size raster is crisp in the inspected full-resolution frames.

This is accepted as the professional stable-caption baseline. It deliberately
does not claim that the stable subtitle treatment is the final creative style
for every edit. Creative hero/list/anchor motion and reduced-motion parity
remain covered by their separate Caption evidence and must be combined only
inside a later exact canonical qualification campaign.

## Fail-closed boundary

The evidence does not claim any of the following:

- qualified shared Visual Intelligence postrender review;
- independent final QA or accepted private-review decision;
- all 41 Caption jobs executed in this one run;
- same-run transcript, Track All, SoundSync, B-roll, or Living Frame evidence;
- terminal Caption qualification;
- provider/model, asset mutation, billing, public-delivery, or production
  authority.

The exact runtime index, final render, and direct-inspection receipt are now
inventoried by the Caption private-evidence progress ledger under the canonical
execution and complete-time visual-review gates. Those gates remain open until
their other owner evidence is present in one exact canonical campaign.

## Verification

- canonical seekable FFprobe intake: passed;
- original source exact-byte/hash verification: passed;
- bounded color and voice operations: passed;
- reviewed-font libass cue rendering: passed;
- private `2160x3840@30` Remotion render: passed;
- final FFprobe H.264/AAC/BT.709/frame-count verification: passed;
- all-frame raster extraction and direct inspection: accepted;
- closed receipt exact-hash reread: passed;
- B-roll dependency authority requalification against the corrected shared
  FFprobe source: `internal_execution_qualified`, 31 commands, 36 fixtures,
  receipt `1f7b29c3f21d875148add9bb7cc381a5164391a2792950b0ce92b07ae1e6e80c`,
  artifact `8c7f7af195b147cf613a613c79491156c0cbdab7ba265cfbeba6bfa99ebff061`;
- terminal/public/production claims: false.
