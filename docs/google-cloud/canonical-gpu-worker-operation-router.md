# Canonical GPU Worker Operation Router

## Current bounded result

ReeditPro now has one workflow-neutral, source-implemented GPU operation router
for the shared `gpu_ai_worker`. Its first admitted operation is the
candidate-only Faster Whisper transcription contract:

`tool.faster_whisper.transcribe_private_audio.v1`

The router does not register Faster Whisper as a 51st production tool. The
canonical production tool count remains exactly 50.

Before invoking a runtime port, the router:

- accepts only the closed server-derived Faster Whisper runner envelope;
- rejects unknown fields, paths, URLs, bytes, credentials, raw chat, arbitrary
  settings, CPU execution, and a non-admitted region;
- recomputes the complete request binding;
- rereads the current pinned CUDA runtime source contract;
- requires the exact four-file Faster Whisper model layout and digests;
- requires `cuda` plus `float16` and forbids CPU fallback;
- consumes one process-bound runtime port exactly once;
- accepts only the closed digest-only three-output success response; and
- independently binds the response to the request, dispatch intent, region,
  CUDA device, and compute type.

The serialized router receipt contains no transcript text, output bytes, model
bytes, source bytes, paths, URLs, or credentials.

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
- materialize the approved private audio or read-only model mounts;
- commit or reread output bytes;
- create the canonical worker or completion receipts;
- record attempt-level GPU cost;
- pass transcript-alignment or caption-timing QA; or
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
