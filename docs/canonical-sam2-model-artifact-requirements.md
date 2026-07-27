# Canonical SAM2 Model Artifact Requirements

Status: `exact_internal_candidate_repository_and_gpu_runtime_blocked`

## Outcome

ReEditPro now has one immutable, server-owned model-artifact requirement
definition for the existing canonical operation
`tool.sam2.segment_and_track_subject.v1`.

The first controlled candidate is Meta SAM 2.1 Hiera Small. It is selected as
the initial qualification target because Meta publishes it as a current SAM
2.1 checkpoint, its 46 million parameters are substantially smaller than the
224.4 million-parameter Large checkpoint, and the existing ReEditPro
operation requires temporal video segmentation rather than a still-only
mask model.

This selection does not download, ingest, mount, deserialize, or execute the
checkpoint. It does not make SAM2 product-ready.

## Immutable Upstream Observation

The source observation is pinned to:

- official source repository:
  <https://github.com/facebookresearch/sam2>;
- source revision:
  `2b90b9f5ceec907a1c18123530e92e794ad901a4`;
- source license: Apache-2.0;
- source `LICENSE` SHA-256:
  `c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4`;
- source config:
  `sam2/configs/sam2.1/sam2.1_hiera_s.yaml`;
- source config SHA-256:
  `0f36b91e86e58d06c87e42997166212468b88b98b60e4d816d5e4d4d088b6f55`;
- pinned `checkpoints/download_ckpts.sh` SHA-256:
  `6cb8caa8f70f40f7076029a9c858bfa4d4fdfb6c960b7943331c85432f6c2ac6`;
- official model repository:
  <https://huggingface.co/facebook/sam2.1-hiera-small>;
- model repository revision:
  `ee5bba1d82bb8749febdf90f45e84b687142ba03`;
- checkpoint:
  `sam2.1_hiera_small.pt`;
- checkpoint size: `184416285` bytes; and
- checkpoint SHA-256:
  `6d1aa6f30de5c92224f8172114de081d104bbd23dd9dc5c58996f0cad5dc4d38`.

The same byte length and SHA-256 were independently observed from the
checkpoint URL in Meta's pinned `checkpoints/download_ckpts.sh`. Mutable
`main`, latest, model-name-only, URL-only, or filename-only references are
not accepted by the contract.

The pinned Hugging Face repository's YAML config is not byte-identical to the
current pinned Meta source config. Its two RoPE attention `feat_sizes` values
are `32,32`, while the selected current source config uses `64,64`. The
contract records this mismatch and selects only the pinned Meta source config
for the native `build_sam2_video_predictor` route. A Hugging Face
`from_pretrained` route is not qualified, and the source-config/checkpoint
pair must pass a real CUDA load fixture before execution.

Meta's source README states that SAM 2 checkpoints and code are Apache-2.0.
The descriptor therefore records the observed license as commercially
permissive and redistribution-capable with attribution. ReEditPro owner/legal
approval for paid production remains independently false.

## Model Artifact Versus Runtime Source

The operation-owned model-artifact set has exactly one slot:

```text
slot: sam2_checkpoint
artifact: meta-sam2.1-hiera-small-checkpoint
format: pytorch_checkpoint
role: sam2-video-segmentation-checkpoint
family: sam2.1-hiera-small
consumer scope: sam2.private-inference
```

The pinned SAM2 Python source and pinned YAML model config belong in the
future immutable CUDA worker image. They are not disguised as model
artifacts. This makes the model-artifact slot definition complete while
truthfully leaving source installation and runtime compatibility unqualified.

The legacy `sam2_checkpoint` model-weight template remains a placeholder and
is not silently promoted or rewritten by this slice.

## GPU-Only Rule

The descriptor requires:

```text
executionClass = gpu_required
requiredExecutionTarget = google_cloud_run_gpu
accelerator = cuda
cpuFallbackAllowed = false
runtimeDownloadAllowed = false
networkFetchAllowed = false
```

Meta reports 84.8 compiled frames per second for this model on an A100 with
Torch 2.5.1 and CUDA 12.4. That observation is not an L4 performance promise.
ReEditPro still requires a real benchmark in the pinned Google Cloud Run
`nvidia_l4` worker before private execution can be admitted.

If the L4 job, CUDA runtime, exact checkpoint, or capacity is unavailable,
SAM2 must fail closed or follow an already approved fallback. It must never
silently run on CPU.

## Pickle Checkpoint Boundary

The official `.pt` checkpoint is a PyTorch checkpoint and therefore enters a
pickle-capable deserialization path. ReEditPro admits only the exact
server-owned SHA-256 candidate and still blocks deserialization until a
pinned, unprivileged, network-disabled CUDA image with a read-only root and
read-only model mount passes adversarial runtime qualification.

Caller checkpoints, arbitrary pickle files, paths, URLs, runtime downloads,
and network fetches remain forbidden.

## Repository Projection

Once an owner-authorized server process ingests the exact checkpoint through
the canonical model-artifact repository, the resulting locator can be
projected into the existing generic GPU bundle requirement shape. That
projection still does not trust the locator by itself. The generic GPU
bundle must reread the manifest and fully rehash the 184,416,285-byte object.

The current projection explicitly reports:

- repository verification still required;
- canonical operation artifact set not yet verified;
- cloud dispatch not authorized;
- model inference authority false; and
- production readiness false.

## Remaining Gates

SAM2 remains blocked on:

- owner-authorized ingest of the exact checkpoint;
- exact repository record and complete GPU bundle verification;
- pinned SAM2 source and YAML config in the CUDA worker image;
- a successful exact source-config/checkpoint load fixture;
- confined exact-checkpoint deserialization;
- private generation-bound model distribution and read-only Cloud Run mount;
- deployed service identity and IAM evidence;
- an actual L4/CUDA install, load, warmup, memory, latency, and cost benchmark;
- canonical private image/video dependency reads;
- byte-producing mask image/sequence output persistence;
- mask edge, subject coverage, contact-object, and temporal stability QA;
- approved snapshot, work item, reservation, attempt, and asset lineage; and
- explicit owner/legal approval for paid production.

No provider, Google Cloud resource, database, billing system, deployment,
queue, model repository object, or production runtime is mutated by this
contract.

## Focused Evidence

Run:

```bash
npx tsx server/smoke/canonical-sam2-model-artifact-requirements-smoke.ts
```

The smoke proves the fixed source, config, checkpoint, license, operation,
GPU target, and one-slot requirement identity; validates compatibility with
the generic repository descriptor and GPU-bundle requirement types; and
rejects mutable refs, wrong hashes, wrong artifacts, CPU placement, CPU
fallback, runtime download, forged paid-production approval, path-bearing
locators, unknown keys, and correctly re-signed authority forgeries.
