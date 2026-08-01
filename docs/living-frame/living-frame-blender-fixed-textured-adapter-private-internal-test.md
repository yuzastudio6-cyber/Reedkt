# Living Frame Blender Fixed Textured Adapter Private Internal Test

Status date: 2026-07-30

Status: `passed_private_native_host_partial_qualification`

This milestone proves that the fixed Living Frame Blender adapter can deform
an actual approved RGBA illustration rather than only a flat diagnostic
material. It is private internal evidence. It does not register an operation,
admit canonical work, persist a canonical asset, approve QA, charge a
customer, deliver a public artifact, or grant production authority.

## Boundary

The existing
`living-frame-blender-fixed-adapter-internal-request-v1` contract remains the
flat-color compatibility lane. Textured input uses the additive
`living-frame-blender-fixed-textured-adapter-internal-request-v2` request.
Both requests execute the same fixed reviewed Python adapter and produce the
same already-qualified result shape:

```text
approved component texture bytes
  -> server validates RGBA PNG profile and computes commitment
  -> v2 payload contains commitment only
  -> server stages one fixed create-only private filename
  -> Blender independently rehashes and revalidates PNG IHDR
  -> fixed Image Texture node maps through approved UVs
  -> approved armature, weights, constraints, and IK deform the mesh
  -> transparent RGBA + mask + depth component sequences
  -> Remotion remains final canvas
```

The serialized request contains no image bytes, caller path, URL, command,
environment, credential, model choice, Blender code, node graph, or final
canvas instruction. The only serialized path-like value is the constant
server-owned relative filename `input/component-texture.png`. The texture
bytes remain process-bound in server memory until they are written create-only
inside the isolated job root.

## Exact texture binding

The v2 request binds:

- artifact ID;
- `image/png` content type;
- width and height;
- exact byte length;
- SHA-256;
- straight-alpha mode;
- sRGB color space; and
- the fixed relative input filename.

The TypeScript compiler accepts only an 8-bit, non-interlaced RGBA PNG within
the bounded byte and pixel ceilings. It copies the supplied bytes before
creating the private binding. Blender rereads the fixed file, verifies the
same byte length, SHA-256, PNG signature, IHDR dimensions, bit depth, RGBA
color type, compression, filter, and interlace values, then checks the decoded
Blender image dimensions and channel count before constructing the material.

The v2 payload digest covers the complete texture commitment. The output
result continues to use `living-frame-blender-fixed-adapter-result-v1`
because the output-pass schema is unchanged; its payload digest binds the v2
request.

## Real measured fixture

The internal fixture uses the existing approved
`lf.style-depth.astronomer-flat-editorial.v1` illustration:

| Measurement | Result |
| --- | --- |
| Texture | 1024×1536 RGBA PNG |
| Texture bytes | 1,342,199 |
| Texture SHA-256 | `b87db6ca3fb2300f361a2e44adae44821507e25a5cdd3832ad37f49d5871c340` |
| Output | 1920×1080 |
| Frame range | 12–71 at 30 FPS |
| RGBA / mask / depth frames | 60 / 60 / 60 |
| First-frame nontransparent pixels | 619,818 |
| First-frame quantized color buckets | 102 |
| Initial-to-demonstration changed pixels | 684,293 |
| Initial-to-final changed pixels | 0 |

This proves decoded illustration color survives the Blender material path,
motion is substantial, and the approved final-pose restoration is exact. The
existing flat-color v1 runtime regression remains green after the adapter
extension.

## What this does not prove

This slice does not yet prove:

- selected-scene approved-snapshot inclusion of the exact texture artifact;
- component decomposition output bound to the rig request;
- hidden-area reconstruction for a textured deformable character part;
- canonical create-only asset persistence or manifest reconciliation for the
  textured sequence;
- independent textured-component alpha, mask, depth, identity, or destination
  QA;
- a real illustrated-character Blender sequence inside the final private
  Remotion review;
- a pinned scanned offline non-root zero-network Blender worker image;
- canonical work admission, dispatch, resource/cost accounting, billing,
  public delivery, or production release.

Those remain separate evidence gates. The next internal slice should bind a
selected-scene texture artifact to the approved snapshot/work-item lineage,
feed a real decomposed illustration component into this v2 request, persist
and QA its output, and produce an actual private Remotion review.

## Regression

```text
npm run smoke:living-frame-blender-fixed-textured-adapter-private-internal-test
npm run smoke:living-frame-blender-fixed-adapter-private-internal-test
npm run smoke:living-frame-private-internal-end-to-end-audit
```
