# WeEditPro SAM 3.1 A100 production-image qualification receipt

Date: 2026-08-11
Status: `historical_superseded_candidate_read_only`

This candidate is superseded by
`sam3_1-a100-production-qualification-v2-2026-08-11.md`. Its immutable
records remain readable for audit and cost reconciliation, but this image may
not satisfy a fresh L4 comparison or runtime release.

This receipt records a private pre-release qualification of the exact
production SAM 3.1 image. It does not grant a runtime release, QA approval,
asset-manifest mutation, customer credit mutation, public delivery, or
production authority.

## Immutable inputs

- Image:
  `us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sam31-gpu@sha256:42603a73fd5b1f1d60127425b3c88488d6eab0a03822e9ad20cfb24e54df1f29`
- Supply-chain release:
  `sam31-production-image-supply-chain-release-f3c85889d5870b62fb4dfdd9`
  / `d5cd7ce75025914505e1d96a046cc54aa59d5ba09495abdc46e71c2bf7a698a5`
- Source/checkpoint qualification:
  `sam31-source-checkpoint-qualification-20260809-v8-vertex-result-publication-corrected`
  / `ba8708871ddace51ca8ed0602beeaa8a406c66494848a07ef6f58d377e7085d9`
- Account-effective Vertex A100 rate authority:
  `vertex-a100-rate:vertex-a100-us-central1-weeditpro-vertex-a100-rate-publisher-477m8`
  / `12bd7ffeb17e172837b6fa49c0647792d93b967169cfdd524b795184b37f14a2`
- Account-effective L4 fallback rate authority:
  `gpu-rate:gpu-rates-us-central1-weeditpro-gpu-rate-publisher-kmwq4:l4_heavy_fallback`
  / `0fb27e1cb312a74994882af6cc93671b41c73da259105323d703253e9d69674f`

## A100 execution

- Qualification ID: `sam31-production-a100-image-42603a73-20260811`
- Invocation:
  `sam31-a100-qualification:sam31-production-a100-image-42603a73-20260811.run-01.execution`
- Vertex Custom Job:
  `projects/390722338345/locations/us-central1/customJobs/821082031986311168`
- Result admission:
  `sam31-a100-result:sam31-a100-qualification:sam31-production-a100-image-42603a73-20260811.run-01.execution`
  / `1e25f7ec176ec0877d0f843a08773bd754b90b47e2e841ce55a5104d50a06b16`
- Driver/CUDA component:
  `sam31-a100-driver-cuda-production-image-42603a73-20260811`
  / `af2ec8614ee422561b85b75a31881035a8db7ee6406538da282e35bd839c95f8`

Observed execution evidence:

- one `a2-ultragpu-1g` worker with one NVIDIA A100 80GB;
- user-triggered allocation from zero and terminal return to zero;
- CUDA BF16 inference and CUDA kernel execution observed;
- hardware NVDEC observed;
- CPU-only inference was false;
- bounded CPU output serialization was true;
- 200/200 approved frames propagated;
- two objects and 400 lossless full-resolution grayscale PNG masks;
- 96,532 ms wall time;
- 35,807 ms CUDA-event inference time;
- 19,432 ms model load;
- 1,671 ms prompt processing;
- 24,896 ms propagation;
- 9,125 ms output persistence;
- 24,593,666,048 peak CUDA allocated bytes;
- 100% maximum observed GPU utilization;
- terminal account-effective attempt-cost receipt
  `vertex-a100-cost.50948d772f95ac19034d3600bee1bd286164269ab4052ba8`
  / `d99722291c5212e942c7a251f72929710a6cf30f928af5483f4104ee674c50f1`.

## Independent artifact-integrity reread

The canonical private-output reader separately reread the response, manifest,
and all 400 mask objects. It verified exact object generations/bytes, every
mask hash, lossless PNG structure, decoded 960x540 geometry, complete frame
and object coverage, and the absence of unexpected or cross-invocation files.

- Manifest:
  `sam31-mask-manifest:sam31-qualification-execution-attempt-1`
  / `87e13ec52c33266955520c2a0981e0248d461e9bd525e97111670fffde0c9da3`
- Persisted exact output-reread evidence:
  `5ff18c261ebbb4ff481f752395af8608ba2b023fe997151ac84163f41e4f4300`
- Exact reread timestamp recovered from the already-admitted digest:
  `2026-08-11T05:40:03.011Z`

The runtime result store now persists this exact evidence create-only before a
new result admission. Restart rereads fail closed when the evidence is missing
or differs. Historical v1 result references remain readable only when their
exact evidence digest is present.

## Remaining release gates

The SAM 3.1 tool is not yet released end to end. The following evidence remains
mandatory:

1. the complete deterministic 30-run set for the immutable image;
2. complete eight-minute source performance with p95 wall time at or below
   480 seconds;
3. independent complete-interval temporal-mask measurement and private review;
4. a separately deployed and qualified L4 heavy-fallback model runtime whose
   quality is equal to or better than the approved A100 baseline;
5. final A100/L4 runtime-release compilation, pricing/credit admission,
   renderer/asset-manifest reconciliation, and fail-closed publication.

No local Mac model installation or CPU inference is part of this evidence.
