# SAM 3.1 GPU runtime candidate

This directory records the source boundary and closed, offline image-build
candidate for the future fixed `tool.sam3_1.segment_and_track_subject.v1`
worker. The Dockerfile is intentionally not build-admissible yet because its
private checkpoint, dependency wheelhouse, release receipts, and qualification
evidence do not exist in this checkout.

The runtime becomes build-admissible only after all of the following are true:

- an authorized human accepts the gated `facebook/sam3.1` terms;
- `sam3.1_multiplex.pt` is downloaded once by the canonical model-artifact
  ingest owner, then exact byte length and SHA-256 are reread;
- source and checkpoint license/security reviews pass;
- the Python 3.12, PyTorch, TorchVision, CUDA, native library, and base-image
  closure is pinned by immutable digest;
- the exact NVIDIA `cuda-compat-12-8` Ubuntu 24.04/amd64 artifact is ingested,
  reread, scanned, and included offline so the CUDA 12.8 image can be
  independently qualified against Cloud Run L4's documented 535 driver
  branch;
- the exact pinned source tree and privately ingested checkpoint load together
  without missing/unexpected keys and produce the frozen output shape;
- the open upstream `facebookresearch/sam3#526` source/checkpoint compatibility
  finding is resolved by an official compatible release or by a separately
  reviewed, versioned, exact-key conversion with full strict-load and output
  qualification; no guessed or unreviewed key rewrite is admissible;
- separate A100 80 GB primary and L4 fallback images are built, scanned,
  signed, and attested;
- both routes pass real-media quality, temporal-mask, performance, and cost
  qualification with no CPU-only heavy fallback;
- a new plan, estimate, approval, snapshot, funded reservation, exact work
  item, lease, per-attempt cost receipt, asset reconciliation, and QA chain
  bind the operation.

Runtime rules once qualified:

- one approved user edit starts one bounded isolated GPU job;
- no approved work means zero A100 and zero L4 jobs;
- A100 80 GB is primary; L4 is a classified, quality-preserving fallback;
- no runtime network or Hugging Face download;
- source, checkpoint, and output are fixed read-only/create-only private
  mounts;
- before either cloud job is created, the canonical source owner streams the
  exact approved mask proxy into the invocation-scoped private bucket object
  with a create-only generation precondition, then rereads and hashes that
  exact generation; the fixed task embeds the closed staging evidence and the
  worker independently hashes the mounted bytes before model load;
- caller code, paths, URLs, module/class names, checkpoint selection, and
  executable prompts are forbidden; the only subject text is the bounded
  server-compiled approved subject prompt bound to the snapshot and source
  frame;
- the initial A100/L4 qualification profile calls Meta's fixed Object
  Multiplex builder with a WeEditPro product cap of 16 tracked objects and a
  separate 16-object multiplex bucket size; it uses the exact
  `start_session` → `add_prompt` → streamed `propagate_in_video` →
  `close_session` lifecycle and persists only the expected object IDs,
  normalized boxes, and boolean mask frames;
- source input is one exact private read-only MP4 or exact numbered-JPEG
  directory upstream, but the first WeEditPro-qualified runtime accepts only
  an exact private read-only MP4; no caller path is accepted and no worker
  download is allowed;
- the pinned WeEditPro source patch enables TorchCodec 0.10 CUDA/NVDEC
  propagation through the multiplex loader; OpenCV/Pillow CPU decode cannot
  satisfy the runtime, and actual NVDEC/device-tensor evidence is required on
  both A100 and L4 before either image is admitted;
- the same patch prevents the partial tracker from loading the full checkpoint
  twice, requires the assembled predictor to accept every checkpoint key
  strictly, and preserves full-resolution masks as CUDA tensors through both
  the single-frame and default 16-frame batched postprocessors; the batched
  path returns before the upstream pinned-CPU mask buffer, and the only
  admitted mask transfer is the bounded create-only PNG serialization
  boundary;
- the candidate PyTorch 2.10/CUDA 12.8 base image has been resolved by immutable
  Linux/amd64 digest, but it remains build-inadmissible until its wheel, native
  library, source, checkpoint, SBOM, scan, signature, and runtime closure are
  independently qualified;
- before Python starts, the fixed entrypoint reads the actual NVIDIA kernel
  driver version. Driver branches 535 through 569 must load the baked
  `/usr/local/cuda-12.8/compat` libraries first; 570 and newer must use the
  mounted host-driver libraries. A driver below 535, a missing compatibility
  library, an accelerator-class mismatch, or a loaded-library-path mismatch
  fails closed before model inference;
- the fixed initial qualification keeps
  FlashAttention 3 explicitly disabled; any later compiler/FA3 optimization
  needs a new version and separate qualification;
- unofficial checkpoint mirrors, public scanners, and third-party hashes
  never satisfy canonical ingest;
- Living Frame estimate projection v7 and work-graph projection v9 bind new
  temporal-mask planning to this SAM 3.1 operation, A100-primary/L4-fallback
  placement, GPU decode, current-rate reread, reservation, and complete
  temporal QA; they no longer project a SAM2 checkpoint;
- SAM 2 remains readable only for immutable historical evidence, cannot
  authorize new work, fallback, or repair, and its direct subprocess factory
  throws before spawning a child.

## Source/checkpoint qualification boundary

`canonical-sam3_1-source-checkpoint-compatibility-qualification-v1` is the
mandatory gate between private artifact ingest and image-build eligibility.
`Dockerfile.qualification.candidate`, `qualification_entrypoint.sh`, and
`qualification_runner.py` are the separate fixed A100-only executor for that
gate. This prevents the production image from needing to trust a qualification
receipt that it would otherwise have to create itself. The qualification image
contains the pinned patched source and offline dependency closure, but never
the gated checkpoint. One exact checkpoint and one server-owned person probe
MP4 are mounted read-only for one network-none Batch attempt; the worker writes
one create-only byte-free result.

The request also binds the exact immutable qualification-image digest, its
scanned/signed supply-chain release, and the Dockerfile/entrypoint/runner
source refs. Canonical admission requires the terminal Batch observation to
reread that same image digest, prove network egress was disabled, prove zero
automatic retries, reread the request, and reread the create-only result. A
base-image digest or a worker-echoed image field cannot satisfy this boundary.
The fixed image preserves the canonical dependency wheel-manifest digest and
the worker rereads it alongside the lock and dependency-closure receipt.

Each qualification attempt mounts only its own generation-bound Cloud Storage
subdirectory at `/mnt/disks/reeditpro/sam31-qualification`, which is the Batch
storage-volume path consumed by the fixed worker. The remote subdirectory
contains exactly `request/request.json`, the read-only checkpoint, and the
read-only probe before launch; `result/result.json` must not exist until the
fixed worker creates it. The canonical staging owner copies the exact
generation-bound checkpoint and probe server-side into this attempt prefix
with create-only preconditions and a fixed WeEditPro CMEK, so the 3–5 GB
checkpoint is never downloaded to the application process or installed on the
developer Mac. It then rereads generation, ETag, length, content type, digest
lineage, encryption key, and the complete three-object set before persisting
the mount observation create-only. An identical restart may reopen that exact
observation; a crossed source, extra object, pre-existing result, changed byte
identity, public/signed URL, or caller coordinate fails closed. This prevents
concurrent attempts from sharing mutable fixed-path objects while keeping
caller paths and mount coordinates out of the worker request.

The qualification image is compiled by the qualification phase of the same
canonical SAM 3.1 Cloud Build owner; it is not a second image-build owner. The
phase accepts only
`canonical-sam3_1-qualification-image-build-authority-v1`, consumes that
authority create-only before the regional Cloud Build call, and submits the
fixed `Dockerfile.qualification.candidate` with the exact dependency-lock,
dependency-closure, wheel-manifest, patch-application, and CUDA forward-
compatibility receipt hashes. Its private generation-bound capsule includes
only the pinned source, patch, offline dependency closure, and qualification
executor sources. It excludes checkpoint bytes and the source/checkpoint
qualification receipt, thereby removing the circular requirement to qualify
the checkpoint before the image capable of running that qualification exists.
An uncertain create outcome is never retried automatically. Even a successful
build stops at an immutable image digest pending SBOM reread, vulnerability
scan, KMS signature, SLSA provenance, and an independent supply-chain release;
it grants no source/checkpoint qualification, A100 job, customer credit, QA,
delivery, or production authority.

The executable A100 admission/launch phase is
`canonical-sam3_1-source-checkpoint-qualification-a100-admission-v1`. It
rereads the persisted qualification-image supply-chain release, exact worker
request, attempt-scoped mount observation, and current billing-account-
effective A100 rate before a durable create-only consumption. It then creates
one deterministic Google Batch job with the immutable image digest, A100 80 GB
instance template, zero task retries, no caller command, and the attempt's GCS
subdirectory. An uncertain create outcome is reconciled by deterministic job
resource and is never automatically retried. A successful Batch state still
grants no qualification: the create-only worker result, actual usage/cost,
network, log, and terminal evidence must be independently reread first.

The terminal evidence path is split into two additional one-writer stages.
`canonical-sam3_1-source-checkpoint-qualification-result-evidence-v1`
generation-rereads the private CMEK result object after the exact Batch job
succeeds, requires the exact four-object attempt set, revalidates the fixed
worker result and its request/image/checkpoint lineage, and persists a
create-only private receipt. It still cannot qualify the checkpoint. The
subsequent
`canonical-sam3_1-source-checkpoint-qualification-terminal-evidence-v1`
rereads that same terminal Batch job, its one succeeded task, every returned
job-UID-scoped `batch_task_logs` entry, and the exact account-effective A100
rate authority. It persists separate create-only log, platform-internal
run-duration cost-estimate, and terminal receipts, requires zero active GPU
resources, and explicitly distinguishes that estimate from a Cloud Billing
invoice actual. Qualification, runtime release, customer credits, billing,
QA, public delivery, and production all remain closed until the final
security/compliance-bound qualification compiler receives real evidence.

The existing canonical SAM 3.1 image supply-chain owner also handles the
qualification image through the explicitly discriminated
`canonical-sam3_1-qualification-image-supply-chain-build-admission-v1`
phase. It cannot accept or relabel the historical runtime-image v1 record. It
pulls only the qualification image's immutable digest, creates an SPDX 2.3
SBOM with pinned Syft, signs and verifies that digest with the numeric
WeEditPro KMS key version through pinned Cosign, and writes three private
evidence artifacts. The admission is consumed create-only before Cloud Build,
accepts no caller steps, image, artifact path, prompt, command, secret,
checkpoint, qualification receipt, or media, and disables automatic retry
after an uncertain create outcome. A successful build only means those three
artifacts are ready for exact reread. Vulnerability occurrences, the original
image-build provenance, SBOM bytes, signature verification, and the final
qualification-image supply-chain release remain separate fail-closed gates.

`canonical-sam3_1-qualification-image-supply-chain-release-v1` now closes
that source boundary through the same canonical private evidence rereader used
by the runtime-image branch. The qualification branch is explicitly
discriminated by its image name, package, build compiler, three artifact
names, and original/supply-build refs; it cannot cast the runtime-image v1
record. It rereads the immutable Artifact Registry digest, both exact Cloud
Build records, the generation-bound artifact manifest and all three private
objects, Artifact Analysis discovery/vulnerability occurrences, an
independent security-owner approval, the numeric-KMS Cosign evidence, and the
original SLSA v1 provenance. Only zero critical, high, and unknown findings
may produce a release. The security review and release are persisted
create-only under a qualification-specific private prefix and must reopen
byte-for-byte before use. That release admits the image solely to the later
source/checkpoint qualification job; it still grants no qualification result,
GPU dispatch, customer credit mutation, public delivery, or production use.

The server-created worker request is
`canonical-sam3_1-source-checkpoint-qualification-worker-request-v1` and the
fixed result is
`canonical-sam3_1-source-checkpoint-qualification-worker-result-v1`. The
worker instruments `torch.load` around the fixed Object Multiplex builder so
the checkpoint is weights-only loaded exactly once, captures the normalized
checkpoint key set, requires strict equality with the assembled model state,
and runs three complete start/prompt/forward-propagate/close sessions. All
three CUDA mask/box/object digests must be identical. A direct canonical
qualification compiler call without this exact request-matched fixed-worker
evidence now fails closed.

It can become canonical only from a dedicated, network-none A100 80 GB
qualification attempt using the pinned base image, exact offline dependency
closure, exact source and patch, and the exact private gated checkpoint. The
gate requires approved source/checkpoint license, privacy, trade-control,
static-security, malware, and weights-only inspection evidence. It then
requires a strict checkpoint load with zero missing or unexpected keys, one
checkpoint read, one fixed builder call, the complete session/prompt/
propagation/close lifecycle, CUDA/bfloat16 output tensors, correct mask and
object shapes, and the same deterministic probe digest across at least three
runs. The receipt binds both the exact patched source artifact hash and the
nonempty deterministic probe-output digest. CPU-only execution, network
egress, automatic retry after an unknown
outcome, unreviewed key rewriting, quantization, resolution reduction, or a
developer-machine run cannot satisfy the gate.

The receipt authorizes only private image-build review. It does not authorize
Cloud Build, an A100/L4 customer job, billing, QA approval, public delivery,
or production. The current repository contains the contract and refusal
tests plus the fixed cloud-only qualification executor; a canonical receipt
remains absent until official gated access, the private artifact scans/reviews,
an immutable qualified qualification-image digest, and an A100 allocation are
available.

## Offline immutable image build boundary

`Dockerfile.candidate` is built only by the canonical private Cloud Build
owner from one generation-bound `.tar.gz` storage source. That capsule is the
complete Docker build context: it contains the exact clean, published
repository slice required by the Dockerfile plus one
`sam31_private_build_input` directory materialized from canonical private
rereads. It is never a developer-machine BuildKit context, caller upload, Git
checkout, mutable tag, or local model install. The private-input portion has
this closed layout:

```text
sam31_private_build_input/source/sam3-96914d2425f90a64f45ca977c2b5165418099543.tar
sam31_private_build_input/source/sam3-96914d2425f90a64f45ca977c2b5165418099543-reeditpro-gpu-decode.tar
sam31_private_build_input/source/source-patch-application-receipt.json
sam31_private_build_input/dependency-closure/requirements.lock.txt
sam31_private_build_input/dependency-closure/wheelhouse/*
sam31_private_build_input/dependency-closure/dependency-closure-receipt.json
sam31_private_build_input/dependency-closure/cuda-forward-compat/cuda-compat-12-8_570.211.01-0ubuntu1_amd64.deb
sam31_private_build_input/dependency-closure/cuda-forward-compat/cuda-forward-compat-ingest-receipt.json
sam31_private_build_input/release-receipts/private-artifact-build-binding.json
sam31_private_build_input/release-receipts/source-checkpoint-compatibility-receipt.json
```

The first source object is the exact uncompressed deterministic Git tar, not
gzip. The second is the canonical source-preparation owner's deterministic
patched tar. The patched tree is
`f3a58b95a0e460d76e1cf38abff0382a7307f67d`; its archive is produced from
that tree with prefix `sam3/` and fixed mtime
`2026-07-30T17:21:37-07:00`, yielding 73,605,120 bytes and SHA-256
`b692268f0e295673d5c5cc2fc14e7813847effc5e371e32cb18c1861b4c8adfb`.
The create-only patch receipt must bind the original archive, the frozen
patch, every modified path, and this exact patched archive; the Docker build
does not accept a caller-selected hash or improvise/re-apply a fuzzy patch.
The private artifact build binding contains only opaque digest-bound evidence;
it deliberately removes source/checkpoint bucket, object, generation, ETag,
token, and byte fields from the build context. The checkpoint is never present
in the capsule or copied into the image; the canonical GPU job rereads and
mounts its exact reviewed bytes read-only at the fixed runtime path. The image
builder can read only the checkpoint-free build-input bucket and has no access
to the model-artifact bucket. The dependency lock
must use hashes for every wheel and may resolve only from the supplied offline
wheelhouse. The build checks the source, patch, dependency-lock,
dependency-closure, private-ingest, source/checkpoint-compatibility, and CUDA
forward-compatibility ingest receipt hashes. The CUDA package is the exact
37,945,232-byte NVIDIA Ubuntu 24.04/amd64 artifact version
`570.211.01-0ubuntu1`, SHA-256
`e980bf55b8d1f6390f07968df46644c971a52f4e4129067d33d1445fac716893`;
the build verifies its package name, version, architecture, bytes, and receipt
before extracting it offline. The build also fails unless the base runtime is
exactly Python 3.12, PyTorch 2.10.0+cu128, TorchVision 0.25.0, TorchCodec
0.10.0, and CUDA 12.8. It installs no dependency from the network and runs as
UID/GID 65532. The same immutable closure may be separately qualified on A100
80 GB and L4, but each route still needs its own driver/library-path,
release, and benchmark evidence.

Before Cloud Build authority exists, the capsule owner streams and hashes the
compressed object, expands it under a separate bounded limit, validates every
USTAR header and checksum, rejects links/devices/sockets/traversal and data
after the terminator, and compares the exact ordered file path/length/SHA-256
set with the closed manifest. Only the listed repository files, the two source
archives, the fixed receipts, the pinned CUDA package, and flat `.whl` files
under the wheelhouse are admissible. A checkpoint-shaped extra entry, nested
wheelhouse payload, reordering, corruption, or compressed/uncompressed bound
violation fails closed. The artifact binding's semantic record digest and its
serialized file-byte digest are separate and both remain bound through the
build closure.

The one-writer build authority is
`canonical-sam3_1-cloud-image-build-authority-v2`. It binds the exact capsule
bucket/object/generation/ETag/length/SHA-256, source commit/tree and closure
hashes, fixed regional Cloud Build endpoint, pinned Docker builder digest,
user-specified least-privilege image-builder identity, network-none build,
immutable destination tag, and verified-provenance request. The submission
service consumes that authority create-only before the cloud call and disables
automatic retry after an uncertain provider outcome. A successful build only
produces an immutable digest pending SBOM, scan, signature, and independent
A100/L4 qualification; it cannot directly authorize a GPU job or customer
charge.

`canonical-sam3_1-cloud-image-supply-chain-release-v1` then rereads that exact
digest from Artifact Registry and cross-binds a complete SPDX 2.3 SBOM,
Google Artifact Analysis occurrence set, security-owner disposition, KMS
signature verification, SLSA v1 provenance, build request, and exact capsule
generation. Critical, high, or unknown-severity findings fail closed. That
release still grants neither A100 nor L4 execution: each route must consume the
same qualified image digest and pass its own runtime evidence.

The Dockerfile source itself does not authorize a build, image push, service
deployment, checkpoint redistribution, GPU allocation, or customer charge.

The source/checkpoint qualification release owner separately rereads the exact
candidate, private ingest, fixed A100 worker request/result, Batch terminal
evidence, zero remaining GPU resources, account-effective internal cost, and
an authenticated legal/privacy/trade/security clearance. Only its create-only
compiled record may qualify the source/checkpoint pair for private image-build
review. It still grants no runtime, customer-media, billing, public-delivery,
or production authority.

The Cloud Build execution owner must independently reread that create-only
qualification release from the private control-plane store before consuming
its separate image-build authority or making any provider request. The release
must exact-match the authority's source/checkpoint qualification reference and
remain limited to private image-build review. A missing, stale, crossed, or
authority-opened release rejects the build before creation; a caller-provided
boolean or digest cannot replace the canonical reread.

Fresh A100 and L4 runtime release also requires
`canonical-sam3_1-gpu-runtime-qualification-compilation-authority-v1`.
That owner rereads the final route qualification plus four separately hashed
canonical component records: driver/CUDA evidence, the exact 30-run
deterministic set, the complete eight-minute performance set, and independent
temporal-mask quality review. It byte-compares each component payload with the
final qualification and records the exact route and immutable image. A stored
qualification summary or caller-supplied collection of pass booleans cannot
become the substantive GPU release reference.

The canonical source contract is
`server/model-artifacts/canonical-sam3_1-source-runtime-candidate.ts`.
