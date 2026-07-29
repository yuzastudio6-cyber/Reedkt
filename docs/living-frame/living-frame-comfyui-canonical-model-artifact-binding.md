# Living Frame ComfyUI canonical model-artifact binding

Status: server-verified repository binding; GPU operation and inference remain
closed.

Living Frame's controlled ComfyUI graph has five exact model slots:

1. base checkpoint;
2. ControlNet checkpoint;
3. LoRA adapter;
4. generic IP-Adapter checkpoint; and
5. CLIP Vision checkpoint.

The earlier requirement projection intentionally carried no locator, path,
filename, bytes, or runtime authority. This binding now consumes the shared
canonical model-artifact repository without creating a Living Frame model
store.

## Binding procedure

A process-bound server resolver supplies one canonical repository locator for
each exact requirement. Caller JSON cannot construct this resolver and cannot
choose a locator.

For every locator the binding asks the existing repository to:

- re-read the immutable descriptor;
- perform its full no-follow SHA-256 object verification;
- verify byte length and immutable object identity; and
- return no source path or model bytes.

The Living Frame adapter then requires:

- exact requirement order and unique repository records;
- the exact component role;
- the exact expected model family;
- `safetensors` format;
- the server-owned `comfyui.private-inference` consumer scope;
- `gpu_required`;
- `google_cloud_run_gpu`;
- CUDA acceleration;
- no CPU fallback;
- no runtime download; and
- no network fetch.

It projects the verified records into the existing
`CanonicalModelArtifactGpuBundleRequirement` shape. It does not create a
second bundle contract.

## Remaining production boundary

Repository verification does not prove that the five artifacts are a
compatible runnable set. The following remain required:

- one canonical operation-owned complete artifact-set projection;
- one registered GPU tool/operation identity;
- exact ComfyUI and custom-node dependency/schema locks;
- a model-family compatibility benchmark;
- approved paid-production license evidence for every artifact;
- an approved scene, snapshot, work item, attempt, and dispatch;
- the existing canonical Cloud Run GPU bundle and handoff authority;
- private GCS distribution and read-only container mounts;
- GPU worker execution and output capture;
- asset commitment, QA, cost evidence, and private review.

The binding does not mount artifacts, execute ComfyUI, run inference, create
work, mutate the asset manifest, approve cost, or grant production readiness.
