# Living Frame generated-still rembg and alpha runtime

Status: private/internal, namespaced, unreleased, non-production evidence.

This slice closes a concrete transparency gap for controlled illustrations
without creating another tool, worker, timing, approval, cost, or rendering
system. It proves this bounded chain:

```text
verified opaque generated PNG
  -> canonical rembg dispatch consumption
  -> fixed CUDA/L4 u2netp mask operation
  -> strict gray8 PNG verification
  -> canonical Sharp dispatch consumption
  -> existing confined Sharp 0.35.3 alpha recipe
  -> straight-alpha RGBA PNG
  -> existing Living Frame alpha measurement
  -> process-bound output lease
```

The source is explicitly
`living_frame_generated_opaque_still_png`. It is not relabeled as an
FFmpeg-extracted source frame. The current shared rembg and Sharp services
remain source-frame-specific, so their generated-still dependency/source
unions and artifact reconciliation remain closed canonical integration gates.

## Cost and credit lineage

The chain does not calculate customer price or mutate credits. It preserves
the existing cost owners:

- the five controlled-illustration generation capabilities share one ComfyUI
  L4 attempt and are not charged again here;
- rembg is one separate canonical GPU tool attempt;
- completed, failed, and outcome-unknown rembg attempts require the existing
  canonical worker-resource cost evidence;
- Sharp uses its existing deterministic tool-cost owner;
- the bridge does not include dollar values, customer credits, service fees,
  reservations, wallet changes, or settlement authority.

The canonical Living Frame estimate/actual-cost/settlement adapters aggregate
these tool-owned contributions before customer-credit rounding and add the
ReeditPro service fee once downstream. This runtime cannot override those
calculations.

## Runtime constraints

The rembg path reuses the fixed canonical runtime contract:

- rembg `2.0.76`;
- ONNX Runtime GPU `1.27.0`;
- model `u2netp`;
- exact model SHA-256
  `309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8`;
- exact model size `4,574,861` bytes;
- Google Cloud Run GPU expectation in `europe-west1`;
- one NVIDIA L4;
- CUDA only;
- no CPU fallback;
- no runtime download;
- no external network fetch.

Controlled fixtures can prove protocol and validation behavior but cannot
claim model inference. Private internal observations remain unreleased and
cannot claim production qualification.

The mask verifier requires a single 1024x1024 grayscale PNG with valid chunk
ordering and CRCs, a non-flat alpha population, partial pixels, no trailing
bytes, and exact decoded-mask commitment.

## Straight-alpha construction

The bridge consumes the source and mask through single-use process-bound
leases, then executes the existing
`approved_living_frame_alpha_component_v1` Sharp recipe in the confined
offline Sharp runtime. The recipe:

- verifies exact source and mask digests;
- requires an opaque source;
- requires a grayscale, opaque-container mask;
- derives alpha from the mask;
- clears RGB where alpha is zero;
- preserves source RGB for non-zero alpha;
- strips metadata;
- emits a PNG with four channels;
- checks the decoded output against its expected RGBA pixels.

The bridge derives the same straight-alpha raster from the already verified
source RGBA and mask, then passes it to the existing multi-background Living
Frame alpha measurement. Measurement is evidence, not QA approval.

## Authority boundaries

This slice does not:

- admit a new tool or operation ID;
- add work items or queue jobs;
- persist a mask or alpha artifact;
- update the asset manifest;
- approve alpha QA;
- select a Living Frame scene;
- author timing or SoundSync cues;
- estimate customer price or credits;
- approve a plan or mutate an immutable snapshot;
- render or promote a component;
- grant beta, runtime, or production readiness.

Canonical artifact commit, asset-manifest reconciliation, alpha QA,
continuity/fact QA, private review, and Remotion consumption remain required.

## Focused evidence

`server/smoke/living-frame-controlled-sdxl-rembg-gpu-runtime-smoke.ts`
proves:

- completed mask execution and strict mask verification;
- failed and outcome-unknown cost retention;
- canonical rembg and Sharp dispatch matching;
- replay rejection;
- exact model mount identity;
- CPU/network/download fail-closed behavior;
- invalid and flat-mask rejection;
- one-shot source, mask, and alpha-output leases;
- real confined Sharp package execution;
- straight-alpha output and alpha measurement;
- no ComfyUI/rembg double charging at the Sharp stage;
- forged production/QA/credit authority rejection.
