# Living Frame canonical Sharp alpha component

Status: private/internal exact operation admission. This is one step inside
the existing WeEditPro edit workflow, not a separate workflow and not a new
tool.

The canonical Living Frame work-graph projection now maps the selected
component-image requirement to the existing production tool identity
`sharp` and its existing operation
`tool.sharp.prepare_approved_image_asset.v1`. The production registry remains
exactly 50 tools.

## Exact inputs

The canonical work item has exactly two upstream dependencies:

1. the approved exact source-frame PNG produced by the existing FFmpeg source
   frame operation; and
2. the QA-selected grayscale mask PNG produced by the GPU-only rembg work
   item.

The work item binds the selected scene, source-sequence item,
source-cleanup decision, output frame, dependency work-item keys, expected
asset identity, customer-estimate budget, and one required non-placeholder
PNG output. Callers cannot provide paths, URLs, filenames, artifact IDs,
bytes, dimensions, recipes, or alternate tool operations.

At execution time, the existing worker lease and dependency-artifact reader
select both exact artifacts from the approved asset manifest. Each artifact
is reread from private storage and reverified against its content digest,
length, content type, source execution attempt, and immutable lease
authority.

## Real image operation

The existing confined Sharp runner now admits one additional closed recipe:

```text
approved_living_frame_alpha_component_v1
```

The recipe:

- accepts PNG only;
- permits at most 4096 by 4096 and 16,777,216 pixels;
- requires the source and mask dimensions to equal the confirmed output
  frame;
- requires an opaque source;
- requires an opaque-container grayscale mask with both zero-alpha
  background and fully opaque foreground samples;
- copies source RGB where mask alpha is nonzero;
- derives straight alpha from the mask;
- clears RGB to zero beneath alpha zero;
- strips metadata and forbids upscaling;
- encodes a deterministic PNG;
- decodes the result and compares every RGBA byte with the intended output;
  and
- proves the input byte commitments were not mutated.

The container remains network-disabled, read-only, non-root, without caller
mounts, added capabilities, or provider access. The older bounded SVG-to-image
Sharp recipes remain unchanged and are covered by regression tests.

## Authority boundary

Operation admission does not bypass upstream or downstream gates. The Sharp
job stays blocked until the exact source frame and rembg mask are complete,
committed, QA-selected, and present in the immutable dependency lease. The
rembg model remains Google Cloud Run GPU-only with CUDA/NVIDIA L4 placement
and no CPU fallback.

The Sharp result is still only a private candidate. Artifact commitment,
alpha/mask QA, asset reconciliation, the exact Living Frame Remotion layer,
caption and SoundSync composition, private review, final render, delivery,
and production authority remain owned by the one canonical WeEditPro
pipeline.
