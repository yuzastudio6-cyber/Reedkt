# Living Frame Five-Mode Private Render Internal Test

Status: verified private/internal runtime evidence

Entrypoint:
`npm run smoke:living-frame-five-mode-private-render`

Implementation:
`server/smoke/living-frame-five-mode-private-render-smoke.ts`

## Purpose

This internal test proves that Living Frame's product definition is executable
across all five modes. It is not a metadata-only capability matrix and it does
not equate Living Frame with a universal 2.5D treatment.

One real 240-frame, 640×360, 30 FPS private Remotion artifact contains eight
frame-accurate ranges:

1. `living_a_roll`;
2. `living_still`;
3. `living_archive`;
4. `living_diagram`;
5. `hybrid_expansion`; and
6. deliberate non-use for an emotionally sensitive range; and
7. a static-card fallback when richer motion is not justified or available;
   and
8. a safe-negative-space fallback when subject masking is unavailable or too
   risky.

All Living Frame layers remain below the caption plane. The source plate and
audio remain owned by the existing final composition, and the resulting MP4 is
persisted and reopened through the existing canonical private Remotion artifact
storage owner.

## Mode assertions

### Living A-Roll

The fixture keeps the speaker/source frame active and places one explanatory
route between the source plate and an approved low-risk subject-plus-contact
cutout. Actual decoded pixels prove:

- the explanatory component enters and settles;
- the route remains visible before and after the foreground group but is
  occluded inside both the subject and contact-object regions;
- a smooth source-plane focus and luminance handoff occurs;
- source attention returns by the end of the range; and
- captions remain above the explanatory visual and foreground cutout.

This is a real subject/contact-object layer-order and composition test using a
static, low-risk RGBA cutout whose appearance is known by the fixture. It does
not claim that temporal mask inference, hair-edge tracking, moving contact
objects, or arbitrary footage are qualified.

### Living Still

The source still is split into a static body anchor and an independent
mechanical component. Actual decoded pixels prove that the rotor changes from a
horizontal to a vertical orientation while the body remains a separate stable
layer.

This is selective, deterministic component animation rather than generated
video.

### Living Archive

Two document layers occupy different depth bands under one shared virtual
camera move. Actual decoded pixels prove differential parallax: the foreground
document travels materially farther than the background document.

This verifies a deep-multiplane 2.5D treatment while preserving the rule that
2.5D is a scene decision, not the Living Frame parent style.

### Living Diagram

An exact deterministic relationship graphic is revealed and positioned without
image generation. Pixel counts prove the approved diagram transitions from
sub-perceptual to fully visible while captions retain priority.

### Hybrid Expansion

The visual begins as an in-frame panel, expands beyond the source frame, and
returns to its initial scale. Pixel-area measurements prove both expansion and
restoration, and decoded caption pixels prove that the final canvas ordering is
preserved during the takeover.

### Deliberate non-use

The deliberate non-use range contains no Living Frame overlay. Pixel checks reject residual
cyan, green, or purple Living Frame components while retaining the source and
caption planes. This is runtime evidence that restraint is an executable
professional decision rather than documentation-only guidance.

### Fallback treatments

The artifact exercises three real fallback rungs:

- a safe-space overlay instead of unqualified temporal A-roll masking;
- a static card instead of unsupported or unnecessary richer motion; and
- no extra visual when source delivery must remain primary.

The static card remains below captions and uses a constant approved scalar
track, proving that the fallback does not require fake motion to satisfy the
renderer contract. The separate safe-space range places the explanatory
elements entirely outside the subject-plus-contact region, and pixel
measurements prove both the protected negative space and caption priority.

## Sound choreography evidence

The Living Still range carries one approved mechanical SFX cue on exactly
frames 30–60. The cue is a fixed 48 kHz stereo PCM input, is streamed through
the existing supplemental-audio contract, and uses the existing
`narration_protected_uploaded_sfx_v1` mix profile. It is not a new Living Frame
audio owner.

The source fixture carries a 330 Hz narration-proxy tone, and the approved SFX
carries an 880 Hz mechanical tone. After the real render, FFmpeg decodes the
mixed AAC stream back to mono PCM. Frequency-domain measurements prove that:

- the mechanical tone is effectively absent before its approved range;
- it is present during the selective rotor motion;
- the source narration-proxy tone remains materially dominant; and
- the source tone does not suffer a material drop during the cue.

This is a real timing and mix proof for one subject-neutral internal fixture.
It does not claim that a sine tone is human speech, and it does not replace
SoundSync's ownership of real cue selection, gain envelopes, ducking, or
project-specific narration QA.

## Runtime and QA evidence

The test executes:

- the pinned private Remotion runtime;
- server-injected, digest-bound source, caption, and RGBA component streams;
- canonical scalar motion specs with exact frame ranges;
- create-only canonical private artifact persistence;
- exact digest and byte-length readback;
- real FFmpeg frame extraction;
- real FFmpeg audio decode and frequency-domain cue/mix measurement;
- real FFprobe width, height, frame-rate, and frame-count inspection; and
- pixel-level motion, scale, depth, visibility, restoration, caption-order, and
  non-use assertions.

The expected final artifact is:

```text
H.264 MP4
640×360
30/1 FPS
240 frames
```

## Authority boundary

This evidence is authorized for private internal testing only. It grants no:

- customer billing authority;
- public delivery authority;
- provider or cloud deployment authority;
- production registry promotion;
- production worker dispatch; or
- customer-release claim.

Those boundaries do not reduce the internal evidence: the renderer, media
inspection, artifact persistence, and pixel QA are real executions rather than
mock plans.
