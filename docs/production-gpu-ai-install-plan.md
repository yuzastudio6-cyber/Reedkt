# Production GPU AI Install Plan

Milestone 11 prepares the GPU AI worker package foundation and model-weight readiness metadata. It follows Milestone 10's CPU/render core install definitions.

M11 adds GPU worker Docker declarations, GPU Python requirements, model-weight manifest templates, GPU readiness checks, and policy docs. It does not build images, deploy, run GPU jobs, process user media, download weights, call providers, add secrets, or make Revideo core.

GPU tools remain worker-only and can execute only from approved snapshots in future milestones.
## Milestone 12 Validation

M12 surfaces M11 GPU package declarations, model-weight templates, source-install review items, and GPU runtime policy in the unified readiness report. It does not run GPU jobs, import heavy GPU packages by default, load model weights, or download models.

## Milestone 15C Consumption

M15C consumes the GPU readiness and model-weight metadata for BiRefNet and SAM2. It adds skip-safe execution scaffolds and command plans only; it does not download models, run unapproved GPU jobs, or treat package availability as model-weight approval.

## Milestone 15D Consumption

M15D consumes GPU readiness and model-weight metadata for Real-ESRGAN and FILM. It adds sample-first enhancement and selected-clip interpolation scaffolds only; it does not download model weights, run unapproved GPU jobs, final render/export, or treat package availability as model-weight approval.

## Current SAM 3.1 production boundary (2026-08-08)

The historical M15C SAM2 scaffold is read-only compatibility evidence. New
segmentation and tracking work uses `tool.sam3_1.segment_and_track_subject.v1`;
SAM2/SAM2.1 cannot receive a new dispatch.

The production path is deliberately split into immutable one-writer stages:

1. privately ingest and reread the official pinned SAM 3.1 source and
   checkpoint without installing either on a developer machine;
2. qualify the exact source/checkpoint pairing on one scale-from-zero A100
   80 GB job;
3. create and independently scan a checkpoint-free production build capsule
   containing the exact qualification and artifact-binding receipts;
4. publish that capsule, binding, and Cloud Build authority create-only through
   `canonical-sam3_1-production-image-authority-publisher-v1`;
5. let the separately deployed, unarmed scale-zero image operator consume the
   exact authority once; and
6. qualify the immutable production image independently on A100 and L4 before
   any runtime release.

The publisher accepts only an exact source/checkpoint qualification ref and an
exact production capsule-manifest ref. It cannot accept a command, Dockerfile,
path, bucket, image tag, retry policy, checkpoint bytes, runtime-release flag,
GPU dispatch, customer-credit mutation, QA approval, or production authority.
The durable repository stores the artifact binding, capsule manifest, and build
authority in separate create-only exact-reread collections. A production image
tag remains non-authoritative until its immutable digest, scans, signatures,
provenance, A100 qualification, L4 qualification, and runtime release are all
present.

Source completion is not runtime completion. At this checkpoint, Google Cloud
authentication and account-effective pricing observation remain external live
preconditions. No model/checkpoint is installed or executed on the developer
machine, no GPU job is dispatched, no customer credits are changed, and
production readiness remains false.

The production-capsule promotion boundary is now source-closed separately from
the builder. `canonical-sam3_1-production-capsule-publisher-v1` accepts only the
exact final source/checkpoint qualification reference and two distinct Cloud
Build UUIDs. It rereads both complete build results, both complete security
reviews, and both private object coordinates; requires byte-for-byte equality
across SHA-256, byte length, CRC32C, MD5, and the canonically ordered archive
entry set; and persists the reproducibility receipt, artifact binding, and
production capsule manifest create-only with exact reread. The capsule must
contain the qualification receipt but no checkpoint, credential, customer
media, caller command, path, URL, image tag, or unreviewed dependency install.
This promotion operation cannot start Cloud Build, a GPU/model job, runtime
release, billing settlement, customer-credit mutation, QA approval, or
production delivery.

The production-capsule source is prepared by the canonical
`canonical_sam3_1-production-capsule-build-input-v1` one-writer boundary. It
exact-rereads the final source/checkpoint qualification release, official
private-ingest receipt, exact source qualification-capsule manifest and bytes,
and a create-only image-build artifact binding. A browser, CLI caller, or build
invocation cannot supply a path, URL, command, image tag, Dockerfile, GPU type,
or replacement artifact.

`scripts/gcp/prod/53-build-sam31-production-capsule-twice.sh` submits exactly
two independent Cloud Build executions from the same clean Git commit/tree and
the same generation-bound canonical records. Each execution builds inside a
source-bound builder image, creates a sorted USTAR archive with fixed ownership
and timestamp plus deterministic gzip metadata, scans the entire archive with
the pinned private scanner, and uploads the capsule, builder result, and
security review create-only. This stage does not build the runtime image,
execute SAM 3.1, select an A100/L4, mutate customer credits, or grant a runtime
release. The production capsule publisher must exact-reread both build results
and refuse publication unless their capsule bytes and entry set are identical.
