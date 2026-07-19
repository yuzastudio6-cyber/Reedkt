# Canonical professional long-form private-master assembly

Date: 2026-07-18

Status: `private_local_canonical_execution_proven_private_master_qa_blocked`

## Outcome

The existing `finalize_private_4k_master` job now has one canonical local/private
execution path. It consumes the exact immutable dependencies already frozen in
the approved professional long-form package:

- every independently passed VP9 object-chunk QA completion and artifact;
- the exact passed continuous 48 kHz stereo FLAC program-audio artifact;
- the exact passed cross-chunk color-continuity validation; and
- the exact passed Master Timing completion.

It then executes the fixed
`approved_long_form_vp9_flac_matroska_master_v1` FFmpeg recipe, stream-copies
the ordered VP9 chunks and continuous FLAC audio into one private Matroska
review master, independently probes the complete output, and persists it
create-only under a content-bound private object identity.

This is the private review master. It is not the separately gated H.264/AAC
customer delivery master and it is not a public export.

## Canonical authority

The execution service accepts only `workspaceId` and
`approvedPlanSnapshotId`. The server reopens and verifies:

- authenticated owner, workspace, project, edit, plan, and snapshot identity;
- exact snapshot hash and approved work graph;
- original approved 4K estimate and funded reservation;
- exact child package, placement manifest, and queue definition;
- exact finalization job, expected output, canonical order, and dependency
  order;
- every dependency completion hash, canonical result hash, and attempt-cost
  evidence hash;
- every private chunk and program-audio checksum; and
- exact color, timing, frame, duration, codec, and object lineage.

The queue authorizes one operation only:

```text
tool.ffmpeg.execute_approved_media_recipe.v1
```

The accepted runner class is
`canonical_professional_long_form_master_assembly_ffmpeg_runner_v1`. Caller
paths, URLs, commands, codecs, chunks, artifacts, estimates, and cost fields are
not accepted.

## Runtime and persistence proof

The bounded runtime proves:

- 2 through 124 ordered chunks are supported by one versioned contract;
- up to 648,000 frames, or six hours at 30 fps, are representable;
- VP9 video and FLAC audio are stream-copied without re-encoding;
- frame and sample timelines start at zero and retain the approved duration;
- the output is one private Matroska object with VP9 video and FLAC audio;
- the full output receives an independent FFprobe pass;
- container network is disabled, root is read-only, all capabilities are
  dropped, and execution is non-root;
- the large output is streamed through a master-specific bounded create-only
  persistence path rather than buffered in application memory;
- exact SHA-256 and byte length are verified before and after persistence; and
- an orphan artifact cannot grant queue completion authority.

The canonical service also proves package authorization, an opaque local
lease, one-use dispatch, a durable heartbeat, immutable runtime evidence,
attempt-level internal cost, reconciliation, terminal queue completion, and
exact restart replay without rerunning FFmpeg.

## Retained real-media evidence

The retained integration command passed:

```text
npm run smoke:canonical-professional-long-form-master-assembly
```

The journey created and independently checked two real UHD object chunks and
one continuous program-audio artifact before assembling the master. Retained
result:

- total frames: 3,870 (129 seconds at 30 fps);
- object chunks: 2;
- completed queue jobs: 10/11;
- private-master SHA-256:
  `3e7d1707b4b9f0442ad92524f033fa7cecb20f73ba3393f31fd17d491db61e82`;
- master attempt-cost evidence SHA-256:
  `0ac13cdd89bb573fc43b9bcbb1d21307880ec3d74ade344975e56889b3a56746`;
- exact restart replay: passed;
- downstream private-master QA dependency ready: true; and
- downstream private-master QA execution authorized: false.

The evidence hashes identify this retained local run. They are not deployment
or production identities.

## Internal production-cost boundary

The attempt uses the immutable profile
`ffmpeg_long_form_master_assembly_cpu_2vcpu_4gib_v1`:

- 2 vCPU;
- 4 GiB memory;
- no GPU; and
- no network egress.

The record is `internal_production_cost_only`. It contains no customer price,
customer credit, ReEditPro service fee, margin, wallet, billing, or settlement
authority. The original approved 4K estimate and reservation are reused. No
second export estimate or export charge is created.

## Six-hour graph truth

This implementation is generic across the approved 2-to-124 chunk range, but
it does not fabricate completion in the retained six-hour graph. That graph
remains 8/255 complete because its other 122 chunk pairs, their QA, and its 123
color boundaries have not run. The finalization service becomes eligible only
after all exact dependencies in that graph genuinely complete.

## Closed gates

This slice does not prove or authorize:

- the separate `qa_private_4k_master` execution;
- H.264/AAC delivery-master encoding or decoded delivery QA;
- export, public delivery, or another deliverable;
- recovery of an already-started assembly attempt after process/lease loss;
- distributed database-backed queue/outbox/terminal transactions;
- live Google Cloud worker dispatch or completion;
- canonical or remote Supabase mutation;
- provider activation;
- billing, wallet mutation, settlement, or customer charging;
- deployment, external beta, or production readiness.

## Next dependency-safe capability

Implement canonical independent QA for the private VP9/FLAC Matroska review
master. It must reopen the exact finalization completion and master object,
decode/probe the whole approved timeline, verify frame/audio/color/timestamp
and copy-safety requirements, persist objective evidence and attempt cost, and
leave customer delivery/export separately gated.
