# WeEditPro SAM 3.1 A100 production-image qualification v2

Date: 2026-08-11
Status: `a100_exact_runtime_result_admitted_l4_comparison_ready`

This receipt records the independently built, supply-chain-qualified, and
privately executed SAM 3.1 image that is the only current A100 baseline for
the L4 heavy-fallback qualification. It does not grant a runtime release,
artifact QA approval, renderer admission, customer credit mutation, public
delivery, or production authority.

## Immutable image and supply chain

- Image:
  `us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sam31-gpu@sha256:5bbb3b447e3d7e1d89709c5dee49dc8e00fec0e78877afc1b9da50729cb3daaf`
- Source commit:
  `65516c6793319bef662c85a7b339f1b6c75c8544`
- Source tree:
  `48d15a24fa2bd80da89b081722233a230c9904ed`
- Capsule SHA-256:
  `c68100680b37acc378775c4a07fe9ad7725bd1c59e25f89164cdbfcbab5002f9`
- Independent capsule builds:
  `3f75e4f5-c910-4eab-80e0-abada9b531c0` and
  `47ffd59e-9a3d-4e6c-9797-1364788ef725`
- Runtime-image build:
  `357ba307-0a12-4f15-9f75-6c98ccd2bb49`
- Supply-chain build:
  `3bb60f64-b0a3-4640-9749-993980da1a49`
- Supply-chain release:
  `sam31-production-image-supply-chain-release-0e3ce795592286a16ec8c608`
  / `92ee7e3989a8c1f53333fb0509aea47406efeb1be2f982171f9a88beb42ed781`
- SBOM SHA-256:
  `ecee91720d4f3850d50488ca5b124944abdf250963d2f9aa1b4f72335e19f256`
- Security review: zero critical, zero high, zero unknown; medium and low
  findings remain recorded in the immutable review instead of being hidden.
- KMS signature and SLSA provenance were verified before admission.

## Frozen model and account-effective rates

- Source/checkpoint qualification:
  `sam31-source-checkpoint-qualification-20260809-v8-vertex-result-publication-corrected`
  / `ba8708871ddace51ca8ed0602beeaa8a406c66494848a07ef6f58d377e7085d9`
- Account-effective Vertex A100 rate authority:
  `vertex-a100-rate:vertex-a100-us-central1-weeditpro-vertex-a100-rate-publisher-477m8`
  / `12bd7ffeb17e172837b6fa49c0647792d93b967169cfdd524b795184b37f14a2`
- Account-effective L4 fallback rate authority:
  `gpu-rate:gpu-rates-us-central1-weeditpro-gpu-rate-publisher-kmwq4:l4_heavy_fallback`
  / `0fb27e1cb312a74994882af6cc93671b41c73da259105323d703253e9d69674f`

## A100 80GB execution

- Qualification ID: `sam31-production-a100-image-5bbb3b44-20260811`
- Invocation:
  `sam31-a100-qualification:sam31-production-a100-image-5bbb3b44-20260811.run-01.execution`
- Vertex Custom Job: `577113595922350080`
- Task hash:
  `4bf5f63849f32c1b14529b466a015016becc04e728b99b0d492be48094defa93`
- Result admission:
  `sam31-a100-result:sam31-a100-qualification:sam31-production-a100-image-5bbb3b44-20260811.run-01.execution`
  / `3de1bb79e1e4cc33c48ea4a76db64fb97e255a4579542077f15832b862dda628`

The scale-from-zero worker used one NVIDIA A100 80GB, then terminated and
returned to zero. The admitted response proves CUDA BF16 model execution,
CUDA-resident decoded frames, measured CUDA kernels, measured hardware NVDEC,
no CPU-only inference, and bounded CPU serialization only.

- 200/200 approved frames propagated synchronously;
- two tracked objects and 400 lossless 960x540 grayscale PNG masks;
- 94,686 ms wall time;
- 37,263 ms CUDA-event inference;
- 19,637 ms model load;
- 1,571 ms prompt processing;
- 24,433 ms propagation;
- 11,135 ms output persistence;
- 24,595,795,968 peak CUDA allocated bytes;
- 100% maximum observed GPU utilization;
- 10% maximum observed NVDEC utilization.

Terminal billing evidence is bound through the current account-effective
A100 rate authority:

- cost receipt:
  `vertex-a100-cost.c26719923d36f2b3661978e6f5ac05b3856e686e6b8f5c45`
  / `cda369579ba194f7352d8f2d1927bd1ec042d77e421d931787e56f4b68ca0d43`;
- worker usage evidence:
  `vertex-a100-worker-usage.c26719923d36f2b3661978e6f5ac05b3`
  / `08c49863ac37afe775c93c6e0ae99da36627ec72c492f6c2e8e0da92cec22973`.

These receipts record internal infrastructure cost. They do not authorize a
customer charge, wallet mutation, WeEditPro service fee, or unapproved
overage.

## Exact private-output reread

The canonical result owner separately reread the response, manifest, and all
400 masks before admitting the A100 result. It verified create-only storage,
exact bytes and hashes, decoded dimensions, the complete approved 0-199 frame
interval, both object IDs, and no unexpected or cross-invocation objects.

- Manifest:
  `sam31-mask-manifest:sam31-qualification-execution-attempt-1`
  / `3697acb075710db2a771e1e24adad6307465d311c04ae08b57b55cdc2c055eef`
- Private-output reread evidence:
  `ad7cc9e845e1aa2040d65cd7c1e9cca1c80cbb8c5c1948734a9ebbef786d444c`
- Reread timestamp: `2026-08-11T07:56:59.602Z`

The L4 qualifier must reread this exact result admission as well as the task.
It may not compare against the superseded image, a raw task, a caller boolean,
or a name-matched record.

## Remaining release gates

The SAM 3.1 tool is not yet released end to end. Remaining evidence includes:

1. the exact immutable image deployed only to the isolated L4 fallback job;
2. a separately qualified L4 CUDA/NVDEC run with exact output reread,
   terminal usage, account-effective cost, and independent mask QA;
3. deterministic repeat evidence and the required 30-run release set;
4. complete eight-minute source performance with p95 wall time at or below
   480 seconds;
5. A100-primary/L4-fallback quality comparison;
6. final runtime-release compilation, asset/renderer reconciliation, and
   fail-closed publication.

No model is installed on the local Mac and CPU substantive media/model work
is not part of this architecture.
