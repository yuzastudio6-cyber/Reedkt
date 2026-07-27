# Canonical Source Speech Evidence

Status: backend-local private contract and content-addressed repository

Runtime readiness: evidence binding only; no transcription dispatch, planning
promotion, or production authority

## Purpose

ReeditPro must understand source narration before it can create a professional
edit plan, but Living Frame and other planning systems must not invent their
own transcript worker or treat a `sourceOfTruth` boolean as proof.

`canonical-source-speech-evidence-package-v1` is the workflow-neutral bridge
between a verified private transcription result and pre-approval planning. It
binds one exact evidence record to every canonical source-sequence item and
stores the private package in a checksummed, content-addressed backend-local
repository. The persistence service accepts only an opaque server-owned
capture locator plus a process-bound private reader capability; it does not
accept transcript or evidence records from caller JSON. Consumers receive only
the repository's opaque locator and package digest.

## Required lineage

Each source record binds:

- canonical source-sequence item, media asset, uploaded order, and source-byte
  SHA-256;
- source-audio artifact identity, closed audio content type, byte count, and
  content SHA-256;
- source-audio extraction evidence bound to that exact source;
- JSON transcript and word-timestamp artifact identities, byte counts, and
  content SHA-256 values when speech exists;
- ordered, bounded, redacted transcript projections with integer millisecond
  coverage, explicit untrusted-source classification, and no instruction
  authority;
- passed transcript-alignment QA with no blocking issue or pending human
  review;
- exact faster-whisper model-weight, execution, and internal-analysis-budget
  evidence; and
- the exact canonical source-sequence digest plus immutable evidence snapshot
  identity and monotonic evidence revision.

A verified no-speech result has no transcript, word-timestamp, model-run, or
segment payload. It instead requires an independent speech-absence evidence
digest and the same exact source/audio/QA binding.

## GPU placement rule

Verified transcription evidence is accepted only when it records:

```text
executionPlacement = google_cloud_run_gpu
device = cuda
cpuFallbackUsed = false
modelDownloadDuringRun = false
customerCreditReservationUsed = false
```

The package does not deploy a worker or prove that a current Cloud Run service
exists. It makes the future execution requirement explicit and prevents a
heavy speech model from silently falling back to CPU. Local fixtures may test
the contract through the process-bound reader seam, but they cannot mint live
or production runtime authority.

## Privacy and persistence

The full transcript remains only in the exact private JSON artifact. Package
segments are bounded, redacted, untrusted-source projections and cannot become
model instructions. Neither form is returned by a browser route in this
slice. The private local repository:

- scopes records by owner and workspace;
- derives an opaque locator from workspace, project, edit session, and exact
  source-sequence digest;
- stores immutable content-addressed package versions and one checksummed
  latest pointer;
- double-reads the private capture result before persistence and rejects
  racing evidence;
- prevents replay of an older immutable package from rolling the latest
  pointer backward and rejects conflicting content at the same revision;
- uses no-follow, mode-restricted atomic persistence and a cooperative
  same-host lock;
- rejects cross-owner reads, stale source bindings, digest tampering, unsafe
  transcript payloads, and pointer substitution; and
- stores no raw media, signed URL, credential, provider request, customer
  price, credit mutation, or public artifact.

A later distributed repository must preserve the same tenant, checksum,
content-addressing, retention, and double-read semantics before production.

## Authority boundary

This package proves only that private source-speech evidence is structurally
current for later server-side consumption. It does not:

- select or publish a Living Frame scene;
- create or approve an edit plan;
- mint `MasterTimingPlan` frames or SoundSync cues;
- calculate customer price or reserve/spend credits;
- choose or call a provider or tool;
- create work, queue, asset-manifest, render, or delivery records; or
- authorize runtime or production.

The next canonical slice should inject this package into the workflow-neutral
pre-approval reasoning input, reread it alongside the current planning
handoff, and project only the minimum bounded narration meaning required by the
strict reasoning request. Raw transcript text must not be copied into a
browser-shareable Living Frame component or reasoning result.
