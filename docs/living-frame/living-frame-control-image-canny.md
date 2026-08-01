# Living Frame deterministic Canny control image

Status: controlled reference pixel primitive; no artifact or runtime
authority.

Living Frame now has a deterministic way to turn approved RGBA pixels into a
structural edge-control image without installing the full
`comfyui_controlnet_aux` bundle.

## Algorithm

The fixed profile:

1. treats input as straight-alpha RGBA;
2. composites color over black so hidden transparent RGB cannot create false
   edges;
3. converts to grayscale using integer coefficients `77, 150, 29`;
4. applies a fixed 3-by-3 Gaussian kernel;
5. computes 3-by-3 Sobel gradients;
6. quantizes direction into `0`, `45`, `90`, or `135` degrees;
7. performs non-maximum suppression;
8. classifies caller-bounded low/high thresholds;
9. performs deterministic eight-neighbor hysteresis;
10. returns an opaque black/white RGBA control raster out of band.

The source pixels remain unchanged. The report contains only digests,
dimensions, thresholds, algorithm identity, and aggregate metrics.

## Relationship to the preprocessing bundle

The full `comfyui_controlnet_aux` source imports a broad processor inventory,
large optional dependency set, copied annotator code, and many
`from_pretrained` or download-capable paths. Installing that bundle merely to
obtain Canny edges would add avoidable supply-chain and runtime risk.

This reference primitive provides the needed edge capability directly. A
future canonical backend may map the approved capability to an independently
qualified OpenCV operation, but this contract does not assign a tool route or
duplicate the tool registry.

Pose, depth, segmentation, line-art, and other learned preprocessors remain
separate candidates. Each needs its exact source subset, checkpoint digest,
license, base dependency, resource profile, quality benchmark, and
no-download worker policy before admission.

## Closed gates

The primitive does not decide whether Canny is the correct semantic control
for a scene. It creates no asset or manifest entry and grants no provider,
tool, work, queue, timing, SoundSync, estimate, cost, approval, snapshot, QA,
render, runtime, or production authority.
