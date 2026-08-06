# Living Frame canonical temporal-mask work admission

Status: private/internal source admission. This contract does not register or
dispatch an operation, run model inference, create an artifact, approve QA,
charge a customer, deliver media, or promote production.

The canonical Living Frame projection now preserves the accepted
`temporal_subject_mask_sequence` distinction instead of treating every
`generate_mask_asset` request as a still-image background-removal request.
The exact server-derived chain is:

1. `approved_source_asset_reference`
2. `prepared_temporal_source_video`
3. `temporal_subject_mask_sequence`

The corresponding named work inputs are distinct even though other Living
Frame branches may share a broad work-item type:

| Operation class | Work type | Requested canonical tool/operation | Required outputs |
| --- | --- | --- | --- |
| `prepare_temporal_source_video` | `process_video_asset` | `ffmpeg` / `tool.ffmpeg.execute_approved_media_recipe.v1` | private MP4 source proxy |
| `temporal_video_subject_segmentation_and_tracking` | `generate_mask_asset` | `sam2` / `tool.sam2.segment_and_track_subject.v1` | gray8 FFV1 Matroska mask sequence, analysis JSON, QA JSON |

The SAM2 work item depends on the exact deterministic work key of the FFmpeg
source-video item. The graph rejects a missing dependency, a cross-output
dependency, rembg substitution, a still PNG output, or an output set other
than the exact three SAM2 candidate outputs.

Still-image alpha is deliberately unchanged. A `still_alpha_mask` continues
through `remove_still_image_background`, the existing `rembg` operation, an
exact source-frame PNG, and the existing Sharp straight-alpha component path.
The shared `generate_mask_asset` work type is therefore no longer enough to
select an operation; the asset kind plus operation class is authoritative.

Both temporal nodes remain pending and non-dispatching:

- `approvedToolIds` and `approvedToolOperationIds` remain empty on projected
  work items;
- the requested tool and operation appear only in digest-bound pending
  admission evidence;
- the FFmpeg temporal-source recipe and exact private source-media metadata
  bridge are not yet released;
- the server-owned normalized SAM2 subject prompt is not yet bound;
- the exact SAM2 checkpoint requirement is observed, but artifact ingest,
  read-only mount, runtime qualification, L4/CUDA inference, temporal QA,
  actual resource cost, and operation registration remain false;
- the unreleased SAM2 estimate line is zero-credit and ineligible for customer
  estimation until the canonical cost owner admits it.

This creates no tool identity. It reuses the existing `ffmpeg` and evaluation
`sam2` identities. Registry size is semantic rather than capped, but a tool
becomes executable only through the canonical registry, operation, runtime,
security, cost, and release owners.

The focused regression is
`server/smoke/living-frame-canonical-temporal-mask-work-admission-smoke.ts`.
It proves the two-node dependency, exact output types, absence of rembg, and
false dispatch/runtime/billing/public/production authority. The existing
edit-planning-authority regression separately proves the still-image
rembg/Sharp/Remotion path is unchanged.
