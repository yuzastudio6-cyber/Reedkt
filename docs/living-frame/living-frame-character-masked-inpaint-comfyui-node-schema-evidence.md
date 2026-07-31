# Living Frame character masked-inpaint ComfyUI node-schema evidence

Status date: 2026-07-31

Status:
`gray8_mask_loader_qualified_canonical_v2_and_l4_execution_blocked`

This evidence closes the source-schema gate for the Living Frame character
plate-reconstruction graph. It binds the decision to the exact pinned ComfyUI
source inside the private hardened image; it does not start the image, load a
model, execute a graph, dispatch work, persist an asset, approve QA, or claim
production readiness.

## Exact evidence

| Item | Frozen value |
| --- | --- |
| Private image digest | `sha256:51e854b0a83392f031d7bb70247a71f195bba367f70818b6407138f343c8ec0e` |
| ComfyUI revision | `093d571b83e7a79833200e199b46b9f5a62217f9` |
| ComfyUI tree | `15652258f4c49f079158fd492479d379aedbc240` |
| Source archive SHA-256 | `dfc771e822aeef3956a3295834a211b36a72e8dce1a7f2bf6b8327a311af9948` |
| `nodes.py` path | `/opt/reeditpro/gpu-operations/comfyui/source/nodes.py` |
| `nodes.py` bytes | `107224` |
| `nodes.py` SHA-256 | `860b5aa27a99be08627c4f996b2852c998081473a54e7be4f24c6c421f667a8d` |

The image was resolved by digest. A container filesystem was created only so
the source file could be copied and hashed. The container was never started.
No image code, model, or graph ran.

## Defect found before execution

`LoadImage` returns:

```text
output 0: IMAGE
output 1: MASK
```

Its mask output comes from inverted image alpha. When an opaque grayscale PNG
has no alpha channel, this source path returns a zero mask. Feeding a normal
gray8 inpaint mask through `LoadImage(...)[1]` would therefore produce an empty
inpaint region even though the graph is structurally valid.

That is not acceptable for professional internal testing, because the request
could consume GPU time and return a visually unchanged plate while appearing
successful.

## Qualified graph contract

The exact pinned source also registers `LoadImageMask`:

```text
required:
  image
  channel ∈ [alpha, red, green, blue]

output 0:
  MASK
```

For an opaque gray8 mask, `channel = red` returns the grayscale pixel values
without alpha inversion. The corrected plate graph is therefore:

```text
source plate
→ LoadImage
→ IMAGE output 0

opaque gray8 inpaint mask
→ LoadImageMask(channel = red)
→ MASK output 0

IMAGE + VAE + MASK
→ VAEEncodeForInpaint(grow_mask_by = 6)
→ KSampler(denoise = 0.55)
→ VAEDecode
→ one SaveImageWebsocket
```

Mask polarity is explicit: white/one means “inpaint this region.” The mask
must match the confirmed source-plate dimensions. `EmptyLatentImage`, plain
`LoadImage` mask output, caller-selected channel, arbitrary nodes, and
independent per-frame generation remain forbidden.

## Canonical owner request

The canonical v2 request now requires both additional node classes:

```text
LoadImageMask
VAEEncodeForInpaint
```

This remains the same single `comfyui` tool identity, the same
`tool.comfyui.generate_controlled_image.v1` operation, one supervised GPU
attempt, one output image, and one internal cost event. The correction does
not create a second tool, provider, runtime owner, or final-canvas owner.

## Versioning disposition

The feature-owned `living-frame-character-controlled-preparation-v1` and
private-prompt v1 names are retained because the masked-plate branch was never
admitted to the canonical request compiler, dispatched, executed, persisted,
QA-approved, or released. Its node-schema qualification gate was explicitly
open. This correction occurs before the first executable admission.

Previously serialized candidate receipts cannot pass the current verifier:
their graph topology and preparation digests differ, and the old plain
`LoadImage` mask edge is no longer in the exact node-class sequence. The
canonical backend extension is still a new
`canonical-comfyui-gpu-runtime-request-candidate-v2` contract because its v1
request surface is already frozen and does not allow either required inpaint
node.

## Remaining internal gates

- canonical v2 request/compiler support for the exact gray8 mask contract;
- canonical private mask staging and pixel/encoding verification;
- real L4 generation;
- create-only private persistence and exact reread;
- hidden-plate, component-alpha, face-clearance, attachment, continuity, and
  fact-safety QA;
- route recompilation and private Remotion review.

## Regression

```text
npm run smoke:living-frame-character-masked-inpaint-comfyui-node-schema-evidence
npm run smoke:living-frame-character-controlled-preparation
npm run smoke:living-frame-character-controlled-preparation-private-prompt
npm run smoke:living-frame-character-controlled-preparation-canonical-comfyui-reconciliation
```
