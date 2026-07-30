# Living Frame style-depth breadth private render

## Purpose

Run:

```text
npm run smoke:living-frame-style-depth-breadth-private-render-internal-test
```

This private internal test closes the visual-style breadth gap between the
source-level adaptive style grammar and actual rendered output. It proves that
Living Frame does not apply one universal anime, parallax, or 2.5D treatment
to every illustration.

It complements the existing deep-multiplane Musashi runtime with two generated
animation-aware fixtures:

| Fixture | Treatment | Approved depth |
| --- | --- | --- |
| Original fictional astronomer | `flat_editorial_cutout` | `flat` |
| Original stylized locomotive | `paper_collage` | `shallow_2_5d` |

Both images were created through the built-in image-generation path for this
internal fixture, generated on a flat chroma field, converted with the
unchanged image-generation skill chroma-key helper using soft matte and
despill, and committed as content-addressed RGBA fixtures with provenance.
They are illustrations, not archival or factual evidence, and they are not
canonical ComfyUI provider evidence.

## Flat editorial contract

The astronomer scene intentionally permits:

- opacity reveal;
- restrained scale settling; and
- editorial line construction.

It forbids spatial parallax. The actual rendered QA measures both the character
and the editorial anchor between settled frames and requires zero effective
centroid drift.

This is important: a flat style is not an incomplete 2.5D scene. It is a
deliberate visual language that may still contain selective editorial motion.

## Shallow paper-collage contract

The locomotive scene permits only restrained near/subject/background
separation:

- slow far-paper drift;
- smaller subject-anchor drift;
- three independently isolated drive wheels rotating around their own hubs;
- one separately layered static connecting-rod band above the rotating wheels;
- one paper-smoke rise; and
- stronger but bounded foreground drift.

The runtime measures the actual rendered output and requires the foreground
to move materially farther than the far plane. It also measures vertical smoke
movement rather than trusting motion-plan metadata.

The drive-wheel proof is also byte- and raster-backed. The test decodes the
prepared locomotive RGBA, assigns each wheel pixel to one nearest circular
component, reconstructs the exposed undercarriage with a bounded deterministic
paper-dark fill, centers every wheel in its own full-frame alpha sprite, and
then places the sprite back at the exact approved hub. This lets the existing
Remotion scalar motion runtime rotate each wheel about the correct component
pivot. A separate static rod overlay remains above those rotating components.

The receipt records:

- exactly three wheel components;
- selected-pixel counts and content digests for every component;
- the reconstructed-pixel count;
- the static-rod selected-pixel count and digest;
- the approved 240-degree motion arc; and
- an independently decoded wheel-region pixel delta between separated output
  frames.

This is the second real selective-part rig after the Musashi character fixture
and proves that the same architecture works for a different visual treatment
and a mechanical object. It remains a fixture-specific deterministic rig, not
automatic arbitrary-object decomposition.

The scene does not claim deep multiplane, volumetric, skeletal, or true-3D
behavior.

## Runtime and QA

The test:

1. rereads and verifies both fixture metadata records;
2. verifies exact PNG digest, length, dimensions, and transparent corners;
3. prepares full-frame RGBA layers with FFmpeg;
4. compiles canonical scalar motion specs using exact internal frame ranges;
5. renders through the real pinned Remotion runtime;
6. persists and reopens the final artifact through canonical private storage;
7. probes the exact H.264 output with FFprobe;
8. decodes selected output frames and measures flat stability, differential
   shallow parallax, smoke movement, mechanical wheel-region motion, temporal
   variation, and caption priority;
9. retains three content-addressed private review frames; and
10. emits only a byte-free evidence receipt.

Together with the existing Musashi deep-multiplane composite, the aggregate
private audit now exercises:

```text
flat editorial
→ shallow paper-collage 2.5D
→ deep cinematic anime multiplane
```

## Authority boundary

This is a private internal visual and renderer proof. It grants no canonical
planning, provider, work-graph, asset-manifest, dispatch, billing, public
delivery, or production authority.

Remotion remains the final canvas. Exact ComfyUI generation remains separately
gated by released five-model mounts and real L4 execution evidence.
