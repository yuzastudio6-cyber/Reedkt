# Living Frame Control-Image Workflow Binding

Status: controlled, non-promotable, non-executable contract.

This binding joins two independently validated Living Frame results:

1. one deterministic control-image report: RGBA-to-Canny, source-bound
   uint16 depth raster, or COCO-17 pose raster; and
2. the controlled stock-node ComfyUI ControlNet graph expectation.

It proves that:

- both contracts are structurally valid at the moment of binding;
- their exact width and height match;
- the graph uses a ControlNet profile;
- exactly one `control_image_artifact_expectation` exists; and
- that expectation's digest equals the measured control-image output bytes.

The pose and depth paths are not detectors. Their process-bound creation
inputs contain the already-derived measurement packet and returned RGBA
bytes so the binding can recompute and revalidate the exact result before
retaining only safe lineage and digests. Neither landmarks, depth samples,
nor pixels enter the serialized binding.

The binding does not create or approve an artifact. The output pixels still
have to pass through the existing canonical work, asset-manifest, QA,
approval, and dispatch authorities. Parent contracts must be re-read and
revalidated before any later admission.

## Closed gates

- control-image input evidence revalidation, including source-pixel
  provenance for Canny, depth-packet evidence for depth, or landmark-packet
  evidence for pose;
- canonical control-image artifact creation and QA;
- canonical asset-manifest binding;
- exact ControlNet checkpoint resolution;
- ComfyUI runtime artifact resolution; and
- canonical dispatch admission.

The binding contains no raw pixels, depth samples, landmarks, paths, URLs,
provider/tool identifiers, work IDs, queue IDs, prompt text, timing, sound,
estimate, approval, or runtime authority. It is generic and never selects a
subject-specific route.
