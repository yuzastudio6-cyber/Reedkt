# Canonical Faster Whisper GPU Runtime Contract

## Outcome

This slice implements the bounded CUDA-only operation source for Faster
Whisper inside the one shared `gpu_ai_worker` architecture:

- exact Faster Whisper 1.2.1 and CTranslate2 4.6.2 identities;
- 28 fully versioned Linux/amd64 Python wheels with SHA-256 hashes;
- the four exact `Systran/faster-whisper-small` model files;
- one fixed private WAV input location;
- one fixed read-only model directory;
- one fixed private output directory;
- fixed CUDA/float16/beam/VAD/word-timestamp settings;
- a SHA-256 binding over the complete server-derived runner request;
- 32 MiB per-output and 64 MiB combined private-output ceilings;
- digest-only success receipts that exclude transcript text and media/model
  bytes;
- fail-closed validation for model files, input audio, runtime packages, CUDA,
  float16 support, inference output, and private output writes.

It does not add a second worker or promote Faster Whisper into the exact
50-tool registry.

## Runtime base

The source contract pins the Linux/amd64 manifest of
`nvidia/cuda:12.3.2-cudnn9-runtime-ubuntu22.04`:

```text
sha256:edc99e084ef003e1e6f180dbe2e9f64496c61254cb109c09060532c2d3b61d75
```

The manifest-list digest is:

```text
sha256:fa44193567d1908f7ca1f3abf8623ce9c63bc8cba7bcfdb32702eb04d326f7a8
```

Faster Whisper 1.2.1 documents CUDA 12 and cuDNN 9 for current GPU execution.
NVIDIA documents CUDA 12.x minor-version compatibility with the R535 driver
family. Neither document replaces a real Cloud Run L4 build/model-load test,
so the contract keeps CUDA compatibility and inference qualification blocked.

Primary references:

- [Faster Whisper v1.2.1 README](https://github.com/SYSTRAN/faster-whisper/blob/65882eee9f5cdbeeb2d877f1131d48cf241b327d/README.md)
- [Faster Whisper v1.2.1 requirements](https://github.com/SYSTRAN/faster-whisper/blob/65882eee9f5cdbeeb2d877f1131d48cf241b327d/requirements.txt)
- [Cloud Run Jobs GPU configuration](https://docs.cloud.google.com/run/docs/configuring/jobs/gpu)
- [NVIDIA CUDA minor-version compatibility](https://docs.nvidia.com/deploy/cuda-compatibility/minor-version-compatibility.html)

## Region safety

The current ReeditPro region authority recognizes `us-east1` and
`europe-west1`. Cloud Run Jobs currently offers NVIDIA L4 in `europe-west1`
but not `us-east1`.

Therefore the operation source admits only `europe-west1` and rejects
`us-east1`. It also forbids cross-region private-media transfer. A US GPU
deployment needs a separate canonical migration to an L4-capable US region
such as the region selected by the backend owner after storage, queue, IAM,
residency, cost, and deployment review.

## Fixed runtime file layout

The request cannot provide paths, URLs, bytes, commands, or model aliases.
The shared GPU worker must supply these fixed locations:

```text
/mnt/reeditpro/private-input/source.wav
/mnt/reeditpro/model-artifacts/faster-whisper-small/config.json
/mnt/reeditpro/model-artifacts/faster-whisper-small/model.bin
/mnt/reeditpro/model-artifacts/faster-whisper-small/tokenizer.json
/mnt/reeditpro/model-artifacts/faster-whisper-small/vocabulary.txt
/mnt/reeditpro/private-output/
```

The runner rehashes and checks the exact size of every input before importing
the model. It requires an empty output directory, uses exclusive file
creation, writes mode `0600`, fsyncs each JSON output, and returns only file
names, sizes, and SHA-256 digests.

The request carries `requestBindingSha256`, computed over every other request
field using the canonical stable-JSON encoding. The Python runner independently
recomputes that digest before reading any mounted artifact. Its response echoes
the binding so a later canonical worker receipt can tie the output candidates
to the exact approved request rather than only to an operation name.

## Result boundary

The server can strictly parse the runner's success envelope and derive three
non-authoritative output candidates. That parser verifies the request binding,
admission and dispatch lineage, CUDA/float16 identity, exact output order,
per-output and combined byte ceilings, and the receipt's no-bytes/no-text/
no-path boundary.

This is intentionally structural verification of an untrusted wire result. It
does not prove that Cloud Run executed it. Promotion requires the existing
canonical worker receipt and completion receipt, immutable private artifact
commit/QA/reconciliation, transcript-alignment and caption-timing QA, and
GPU-active internal-cost evidence under an approved cloud rate.

## Authority boundary

Implemented:

- source-level runner;
- exact dependency lock;
- exact source-provenance lock;
- fixed input/model/output layout;
- CUDA-only and float16-only preflight;
- local-files-only model load;
- deterministic JSON encoding and digest-only receipt;
- strict untrusted-wire result parsing with explicit canonical completion,
  artifact/QA, and GPU-cost evidence requirements;
- source-level and adversarial smoke coverage.

Still required:

- reproducible shared GPU worker image build;
- Cloud Run L4 container start and driver/runtime evidence;
- exact CTranslate2 model load and real inference;
- canonical approved-package, snapshot, work, lease, model-bundle, and private
  audio rereads;
- private output artifact storage and immutable reconciliation;
- transcript-alignment and caption-timing QA;
- cost receipt, cleanup, service identity/IAM, deployment, and production
  review.

No cloud dispatch, model inference authority, work/queue mutation, artifact
commit, QA pass, customer cost, approval, snapshot, render, or production
authority is granted by this contract.

## Evidence

Run:

```bash
npx tsx server/smoke/canonical-faster-whisper-gpu-runtime-contract-smoke.ts
```

The smoke rehashes all three source files, checks every dependency line,
syntax-compiles the runner outside the repository, executes invalid and
otherwise-valid/no-mount requests to prove sanitized fail-closed behavior,
revalidates the complete contract, rejects forged runtime/region/authority
fields, and confirms the exact 50-tool production registry is unchanged.
