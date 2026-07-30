# Living Frame temporal-mask selected-scene work candidate

## Purpose

Run:

```text
npm run smoke:living-frame-temporal-mask-work-admission-candidate
```

This candidate closes the namespaced design gap between an approved Living
A-Roll scene and the existing non-executable SAM2 operation preflight. It does
not modify the canonical work graph. It defines the exact two-step projection
that the canonical owner must admit:

```text
approved selected Living A-Roll scene
→ exact private scene-range source video
→ server-compiled normalized subject prompt
→ SAM2 temporal segmentation and tracking
→ private FFV1 mask sequence + analysis + QA
```

The current shared named-work input exposes only
`generate_mask_asset`. It does not preserve the
`temporal_subject_mask_sequence` asset-kind discriminator or the required
SAM2 operation. The existing work projection therefore resolves the request
as a still `rembg` PNG. The candidate records that conflict and rejects that
substitution.

## Canonical inputs

The compiler revalidates:

- the selected-scene binding and exact Living A-Roll mode;
- the execution requirements;
- the MasterTiming/SoundSync timing binding;
- the source-media-backed asset/work-input binding;
- the temporal mask intent and its exact source dependency;
- server-owned private source-video metadata; and
- a server-owned normalized subject box produced by video understanding.

The source metadata and subject selection are content-addressed inputs. They
accept no caller prompt, model, seed, path, URL, bytes, command, credential,
environment, or media override.

## Required source-video work

The candidate requires one deterministic FFmpeg work item before SAM2:

```text
work item:
process_video_asset

operation:
prepare_approved_living_frame_temporal_source_video

tool operation:
tool.ffmpeg.execute_approved_media_recipe.v1
```

The work item derives its source-frame range from:

- the selected source sequence item;
- the approved source-cleanup decision;
- the selected scene's exact visual range;
- the source media frame rate; and
- the MasterTiming frame rate.

Its output:

- preserves the source dimensions used by subject selection;
- is normalized to the MasterTiming frame rate and exact visual frame count;
- contains no audio or retained metadata;
- is private;
- permits no network fetch or runtime download; and
- is not the final video canvas.

The first frame of this prepared clip is the approved subject-selection
anchor. After the source artifact is persisted, the canonical server binds
its artifact ID, digest, dimensions, and frame timing into the existing
`CanonicalSam2SubjectPromptPacket`.

## Required SAM2 work

The second work item must preserve:

```text
asset kind:
temporal_subject_mask_sequence

operation class:
temporal_video_subject_segmentation_and_tracking

tool:
sam2

operation:
tool.sam2.segment_and_track_subject.v1
```

It reuses the existing `sam2` identity. It does not add a tool merely for a
checkpoint, model weight, library, or capability.

The candidate binds the existing controlled SAM2 requirement set:

- checkpoint slot `sam2_checkpoint`;
- artifact `meta-sam2.1-hiera-small-checkpoint`;
- model family `sam2.1-hiera-small`;
- Google Cloud Run GPU target;
- NVIDIA L4;
- CUDA;
- no CPU fallback;
- no runtime download; and
- no network fetch.

The exact outputs are:

1. gray8 FFV1 Matroska mask sequence;
2. SAM2 tracking analysis JSON; and
3. temporal-mask QA JSON.

The mask sequence must match the prepared source's frame count, dimensions,
and frame timing.

## QA and contact objects

The candidate requires:

- `mask_edge_quality`;
- `mask_temporal_stability`; and
- `mask_subject_coverage`.

The subject-selection contract also requires contact-object preservation. The
downstream byte-output test already proves that the FFV1 and temporal
measurement path preserves a contact-object silhouette. Real SAM2 inference
must still prove that the model selects and tracks the correct contact object.

## Fallback

The candidate forbids:

- treating a video request as a still `rembg` PNG;
- AI-video fallback for masks; and
- silently rendering a required-mask scene without the mask.

The approved simplification order is:

1. static or known-cutout occlusion when already approved;
2. safe side/lower panel;
3. visual takeover without temporal subject masking;
4. caption-only or no extra visual; and
5. user review if simplifying would alter the explanation.

## Authority boundary

This is a namespaced, non-executable integration candidate. It creates no
canonical work item, estimate item, asset-manifest entry, snapshot mutation,
queue message, worker lease, model inference, persisted artifact, QA approval,
customer charge, public delivery, or production authority.

Remotion remains the final canvas owner.

The production registry count remains semantic: its current observed count is
not a cap. This candidate creates no identity and reuses `sam2`.

## Remaining internal gate

The canonical backend owner must:

1. preserve the temporal asset-kind/operation discriminator;
2. admit the scene-range source-video dependency;
3. reproject estimate/work/asset lineage to SAM2 rather than `rembg`;
4. materialize the exact source video and subject-prompt artifacts;
5. release the approved SAM2 checkpoint/runtime evidence; and
6. run real inference plus mask QA.

Customer release work remains outside the current internal-testing target.
