# Living Frame Controlled SDXL GPU Output Observation

Status: server-private output reread and measurement contract implemented;
artifact, cost, QA, and production gates closed.

This contract verifies the byte-level output expected from one controlled
ComfyUI GPU request. It does not dispatch ComfyUI, mark a worker complete,
commit an asset, calculate an actual attempt cost, approve transparency, or
make a Living Frame scene renderable.

## Exact input lineage

The observer accepts the already-verified
`living-frame-controlled-sdxl-gpu-runtime-protocol-v1` request receipt plus
two process-bound capabilities:

1. a single-use server-owned output reader; and
2. a single-use verified-output consumer.

The reader is created against the exact request-receipt ID and digest,
private wire-request digest, and output-frame expectation digest. Its packet
must repeat the exact request lineage and provide a bounded PNG whose length
and SHA-256 are recomputed by the observer. Caller bytes, paths, URLs,
credentials, output metadata, provider fields, tool routes, and completion
claims cannot qualify a reader.

The output bytes and decoded RGBA bytes never enter the serializable
observation. After verification they are delivered only through the
process-bound consumer so a future canonical artifact pipeline can continue
without exposing private media through browser-shareable state.

## Fixed opaque-PNG profile

The current controlled image route requires one exact 1024-by-1024,
8-bit, non-interlaced RGB PNG. The decoder validates:

- PNG signature and bounded chunk layout;
- CRC for every chunk;
- one exact RGB `IHDR`;
- no alpha-bearing color type or `tRNS` transparency;
- no unknown critical chunks;
- bounded decompression;
- all five PNG scanline filters; and
- exact end-of-stream and decoded-byte accounting.

The decoded RGB is expanded to straight RGBA with alpha 255 and measured
again through the existing Living Frame alpha-measurement primitive. The
observation passes only when all 1,048,576 pixels are opaque and the
measurement reports `alpha_channel_fully_opaque`.

This does **not** make the image a transparent component. The required
disposition remains:

```text
opaque generated source
→ qualified segmentation or matting
→ alpha-edge decontamination
→ true-alpha artifact commit
→ black/white/gray/saturated-background QA
→ destination-scene composite QA
→ continuity and documentary-safety QA
→ canonical artifact approval
```

A PNG with a real alpha channel is rejected at this boundary. A checkerboard
painted into RGB pixels remains opaque content and cannot satisfy later alpha
QA.

## Cost and credit lineage

The observation binds one verified output to one future GPU execution
attempt. It preserves the canonical cost rules:

- ComfyUI, external control-image preprocessing, ControlNet, generic
  IP-Adapter, and loaded PEFT/LoRA share one GPU-attempt lifetime;
- AuraFace is excluded and may be attributed only as a separate bounded CPU
  continuity-QA attempt;
- exact reuse creates no new generation attempt;
- failed and unknown attempt outcomes must retain their internal
  infrastructure cost;
- the actual amount requires canonical worker-resource-cost evidence;
- bundle costs are aggregated before customer-credit conversion and rounded
  once; and
- the ReeditPro service fee is applied once by the existing downstream
  commercial authority.

The output observation contains no dollars, credits, service-fee amount,
reservation, wallet, or ledger data. It cannot mint an actual-cost receipt.
This prevents both undercounting failed work and double-counting the five
capabilities as five provider calls.

## Closed gates

The following remain required:

- registered canonical ComfyUI operation and dispatch receipt;
- worker completion and GPU metric attestation;
- signed runtime-image and model-mount evidence;
- canonical worker-resource-cost evidence;
- qualified segmentation or matting;
- edge decontamination and true-alpha artifact commit;
- multi-background and destination-composite QA;
- continuity and documentary-safety QA; and
- approved scene, snapshot, work, asset-manifest, Remotion, and private-review
  lineage.

The observation therefore keeps selection, timing, SoundSync, estimate,
actual cost, customer price and credits, approval, snapshot, work, queue,
asset, QA, render, runtime, and production authority literal false.
