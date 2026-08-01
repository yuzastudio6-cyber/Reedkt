# Living Frame Blender selected-scene private review internal test

Status: measured private internal evidence. Canonical work admission, asset
manifest reconciliation, QA approval, private-review approval, cost, billing,
public delivery, and production authority remain closed.

## Purpose

This milestone proves the next stage after the selected-scene Blender
persistence test. It independently reopens the complete persisted component
sequence, validates the component passes, grants one process-bound single-use
lease for only the approved RGBA sequence, and consumes that lease in the
existing private Remotion runtime.

The evidence remains bound to:

| Binding | Value |
| --- | --- |
| Living Frame scene | `scene.musashi-strike` |
| Animated component | `musashi.body` |
| Rig mode | `armature_2_5d_character` |
| Narrative visual verb | `reach` |
| Primary control | `control.ik` |
| Confirmed component frame | 1920×1080 |
| MasterTiming visual range | frames 12 through 71 |
| Frame rate | 30 FPS |
| Selected duration | 60 frames |

This is a real Blender and Remotion internal run. It is not a mock renderer,
customer export, production operation, or canonical QA approval.

## Independent component QA

The QA boundary consumes the create-only persisted-artifact lease exactly
once. It then:

- rereads and rehashes all 180 persisted files;
- verifies the exact 60-frame set for RGBA, mask, and depth;
- revalidates PNG and OpenEXR signatures;
- validates 1920×1080 RGBA and grayscale PNG headers;
- decodes sampled RGBA and mask passes through fixed FFmpeg image-pipe
  commands;
- verifies identical non-zero silhouette support between RGBA alpha and the
  grayscale mask;
- permits only bounded 8-bit anti-alias quantization drift: at most one code
  value and no more than 0.01 percent of pixels;
- loads the sampled DWAA OpenEXR depth passes through a fixed reviewed Blender
  adapter and verifies finite positive depth inside the subject mask;
- verifies readable articulated movement in the middle pose; and
- verifies exact source-level return to the initial RGBA and mask pose.

Blender owns the fixed OpenEXR read because the locally qualified FFmpeg build
does not decode Blender's DWAA-compressed OpenEXR output. The Head Intelligence
does not choose the QA program, executable, paths, files, or thresholds. The
adapter is fixed, starts Blender from factory state with auto-execution
disabled, receives three server-staged sample pairs, and returns only bounded
numeric evidence.

The QA report contains no component bytes, file paths, URLs, credentials,
commands, or environment values.

## Private Remotion review

After QA passes, the component bridge creates a process-bound single-use lease
containing only the 60 verified RGBA frames and their immutable commitments.
The private Remotion review:

1. consumes and invalidates that lease;
2. preserves the exact 16:9 aspect ratio;
3. scales the 1920×1080 component into a bounded 640×360 internal-review
   proxy;
4. splits the 60 one-frame component images into four bounded Remotion
   requests because the current canonical request contract allows at most 16
   Living Frame overlays per request;
5. keeps the Living Frame component above the source plate and below the
   caption plane;
6. renders four real Remotion compositions;
7. trims only the filler frames required by the minimum 24-frame private
   runtime;
8. packages the exact 16 + 16 + 16 + 12 selected frames into one 60-frame
   H.264 review MP4 through FFmpeg;
9. persists the MP4 create-only in the existing canonical private Remotion
   artifact store;
10. rereads and rehashes the exact private artifact;
11. verifies codec, dimensions, frame rate, and 60-frame count with FFprobe;
    and
12. decodes frames 0, 30, and 59 to verify source visibility, subject
    visibility, caption-plane visibility, primary motion, and visual return
    to the initial pose.

Remotion remains the final-canvas owner. Blender supplies a transparent
component sequence only. FFmpeg packages the already composited Remotion
chunks and does not make creative or semantic decisions.

## Measured run

The accepted bounded run measured:

| Measurement | Value |
| --- | ---: |
| Persisted component files | 180 |
| Selected RGBA frames | 60 |
| Maximum alpha/mask quantization-different pixels | 14 |
| Maximum alpha/mask code-value difference | 1 |
| Finite positive subject-depth pixels, frames 12/42/71 | 392,380 / 314,737 / 392,380 |
| Middle-pose changed RGBA pixels | 498,548 |
| Primary alpha-centroid displacement | 288.350317 px |
| Actual Remotion render count | 4 |
| Final private review frames | 60 |
| Final private review dimensions | 640×360 |
| Final private review MP4 bytes | 58,936 |
| First/final decoded mean absolute difference | 0.426351 |

The first/final source RGBA and mask inputs are byte-identical. The small
first/final decoded review difference is bounded H.264 compression variation,
not a rig-restoration failure.

These values describe one native ARM64 internal fixture. They are not universal
performance, compression, cost, or production-capacity promises.

## Adversarial coverage

The focused regression rejects:

- forged private-persistence report lineage;
- a broad or non-owned review storage root;
- forged component-QA report lineage;
- a copied or caller-constructed Remotion sequence lease;
- replay of the consumed Remotion sequence lease;
- replay of the consumed persisted-artifact lease; and
- a 1024×1024 substitution for the confirmed 1920×1080 component frame.

The underlying admission, rig, rig-action, fixed-adapter, persistence, and
Remotion contracts additionally reject cross-scene/work-item substitution,
raw prompt/path/command/environment input, arbitrary Blender programs,
unapproved timing, final-canvas claims, and authority promotion.

## Authority boundary

This milestone grants only private internal component-QA and Remotion-review
evidence authority. It does not:

- register or dispatch the Blender candidate operation;
- mutate the canonical work graph or asset manifest;
- approve canonical QA or private review;
- create a canonical actual-cost event;
- charge a customer;
- authorize another render;
- create a customer delivery; or
- claim public or production readiness.

## Remaining gates

The Blender route still requires canonical-owner reconciliation for:

- Blender tool-profile and operation registration;
- estimate, work-graph, and asset-manifest projections;
- a pinned offline non-root, zero-network worker image;
- canonical work admission and idempotent worker execution;
- canonical QA and private-review approval;
- resource and actual tool-cost receipts; and
- broader character, topology, mechanical-object, failure, and fallback
  fixtures.

OpenToonz remains a separate flat-2D deformation evaluation route. Native
Remotion mechanics remain preferred when a deterministic lightweight rig can
perform the approved action. Blender is selected only for approved
armature/IK/skinning or deeper 2.5D requirements.

## Regression

```text
npm run smoke:living-frame-blender-selected-scene-private-review-internal-test
npm run smoke:living-frame-blender-selected-scene-private-persistence-internal-test
npm run smoke:living-frame-private-internal-end-to-end-audit
```
