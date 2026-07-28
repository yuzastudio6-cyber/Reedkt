# Canonical GPU Worker Operation Router

## Current bounded result

WeEditPro now has one workflow-neutral, source-implemented GPU operation router
for the shared `gpu_ai_worker`. It admits two closed operation envelopes:

`tool.faster_whisper.transcribe_private_audio.v1`

`tool.rembg.remove_image_background.v1`

The router does not register Faster Whisper as a 51st production tool. rembg
already belongs to the exact 50-tool production registry, so its GPU runtime
does not change the count. The canonical production tool count remains exactly
50.

Before invoking a runtime port, the router:

- accepts only the closed server-derived Faster Whisper or rembg runner
  envelope;
- rejects unknown fields, paths, URLs, bytes, credentials, raw chat, arbitrary
  settings, CPU execution, and a non-admitted region;
- recomputes the complete request binding;
- rereads the current pinned CUDA runtime source contract;
- requires the exact operation-specific model layout and digests;
- requires `cuda`, requires Faster Whisper `float16` or rembg's fixed native
  ONNX execution profile, and forbids CPU fallback;
- consumes one process-bound runtime port exactly once;
- accepts only the operation-specific digest-only success response; and
- independently binds the response to the request, dispatch intent, region,
  CUDA device, and compute type.

The serialized router receipt contains no transcript text, mask bytes, output
bytes, model bytes, source bytes, paths, URLs, or credentials.

The GPU image candidate now copies the fixed runner into
`/opt/reeditpro/gpu-operations/faster-whisper`, creates an isolated Python
environment from the exact hash-locked requirements file, and uses the pinned
CUDA 12.3.2/cuDNN 9 Linux/amd64 base digest. A fixed subprocess runtime-port
adapter invokes only that environment and runner with no shell or
caller-selected executable, argument, path, or environment. This is source
implementation, not image-build or GPU-run evidence.

The Dockerfile also exposes the inspection-only
`faster_whisper_runtime_build_candidate` target. It stops before the legacy
broad GPU dependency layer and verifies the exact Faster Whisper and
CTranslate2 package imports during build. A local build of that target is
controlled image evidence only; it cannot advance the Cloud Run, model mount,
GPU inference, artifact, QA, cost, or production gates below.

The same shared image includes a separate exact Python 3.11 environment and
fixed rembg runner under `/opt/reeditpro/gpu-operations/rembg`. The
`rembg_runtime_build_candidate` target verifies the pinned package imports.
Its process-bound adapter requires the exact canonical source-frame artifact,
the exact local U2NetP model, an exclusive CUDA execution provider, one mask,
and two digest-only process-evidence receipts.

## What this closes

The previous
`canonical_gpu_worker_operation_router_not_implemented` blocker is replaced by
the narrower `canonical_gpu_worker_operation_router_execution_required` gate.
The operation-selection and request/response revalidation source now exists and
has adversarial smoke coverage.

## What remains closed

This source slice is not evidence of a Cloud Run execution. It does not:

- deploy or invoke a Cloud Run Job;
- prove an immutable runtime image;
- verify the live worker service identity or IAM;
- materialize the approved private input or read-only model mounts;
- commit or reread output bytes;
- create the canonical worker or completion receipts;
- record attempt-level GPU cost;
- pass transcript/caption QA or mask edge/subject-coverage QA; or
- grant dispatch, work graph, asset-manifest, approval, snapshot, billing,
  delivery, or production authority.

A controlled source-fixture runtime port can prove router behavior, but its
receipt always says `actualCloudRunExecutionVerified=false`. A deployed adapter
must remain process-bound and must preserve the same one-shot, digest-bound,
CUDA-only contract.

## Next implementation seam

The next canonical backend seam is to build and independently inspect the
immutable Linux/amd64 candidate, run the fixed adapter on an L4, and connect it
to the live Cloud Run worker identity plus opaque dispatch-intent reader. That
reader must load exact current attempt authority; it must not accept an
operation request from a browser or caller. Only after a real L4 run, private
output commit, QA/reconciliation, cost evidence, and worker completion receipt
may the evidence advance beyond this non-authoritative source boundary.
