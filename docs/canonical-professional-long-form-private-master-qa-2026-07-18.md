# Canonical professional long-form private-master QA

Date: 2026-07-18

Status: `private_local_retained_review_graph_qa_proven_delivery_blocked`

## Outcome

The canonical `qa_private_4k_master` job now has one bounded local/private
execution path. It independently reopens the exact immutable VP9/FLAC
Matroska review master produced by `finalize_private_4k_master`, streams the
whole object through the pinned networkless FFprobe runtime, persists
objective create-only evidence, and terminally completes the final job in the
retained private review graph.

This proof closes the retained two-chunk review graph at 11/11. It does not
create or authorize the separate H.264/AAC customer-delivery master, export,
public delivery, billing, deployment, or production readiness.

## Canonical authority and dispatch

The service accepts only authenticated execution context plus `workspaceId`
and `approvedPlanSnapshotId`. The server reconstructs and verifies:

- exact owner, workspace, project, edit, plan, snapshot, and reservation;
- immutable private-master assembly completion and output checksum;
- exact QA job definition, canonical order, dependency, placement, and
  expected output identity;
- approved 4K frame, 30 fps timing, frame count, and expected duration;
- one opaque lease, one-use dispatch, heartbeat, attempt deadline, and
  terminal queue transition; and
- original approved estimate and reservation reuse with no second export
  estimate or charge.

The only accepted operation is:

```text
tool.ffprobe.inspect_approved_media.v1
```

The fixed runner is
`canonical_professional_long_form_private_master_ffprobe_qa_v1`, using the
inspection profile `private_long_form_master_qa_v1`. Caller paths, URLs,
commands, codecs, thresholds, object identities, estimates, and cost fields
are rejected.

## Objective media checks

The complete persisted input is independently read and checked for:

- exact SHA-256 and byte length before inspection;
- one Matroska container with exactly one VP9 video stream and one FLAC audio
  stream;
- exact approved 4K frame, 30 fps, and fully decoded frame count;
- `yuv420p`, limited-range BT.709 color metadata;
- 48 kHz stereo FLAC audio metadata;
- format, video, and audio starts at zero within one frame plus 1 ms;
- video/audio start sync within the same tolerance;
- exact approved duration within one frame plus 1 ms; and
- no media mutation.

For streamed Matroska inputs that do not expose seek-derived format or stream
duration, the normalizer derives duration only from FFprobe's fully decoded
video-frame count and measured frame rate. Missing or non-positive decoded
frame evidence still fails closed.

## Queue, persistence, replay, and cost evidence

The path proves:

- assembly completion is an immutable prerequisite;
- queue receipt exists before lease;
- an initial claim and bounded heartbeat are durably observed;
- the operation starts only after the exact attempt record exists;
- raw probe, runtime receipt, QA artifact, reconciliation, terminal, and cost
  records are stored create-only and content-addressed;
- orphan blobs do not grant queue completion authority;
- the final queue commit advances exactly one job from leased to completed;
- clearing process memory and reopening persisted state returns the exact same
  result without rerunning FFprobe; and
- internal production cost is recorded per attempt under
  `ffprobe_long_form_private_master_qa_cpu_2vcpu_4gib_v1`.

The cost profile is 2 vCPU, 4 GiB, CPU-only, and networkless. Its record is
internal tool/infrastructure cost only. It contains no customer price,
customer credits, ReEditPro fee or margin, wallet mutation, billing, charging,
or settlement authority.

## Retained execution proof

The following command passed with exit code 0:

```text
npm run smoke:canonical-professional-long-form-private-master-qa
```

Retained result:

- total frames: 3,870 (129 seconds at 30 fps);
- object chunks: 2;
- cross-chunk boundaries: 1;
- completed queue jobs: 11/11;
- private-master SHA-256:
  `3e7d1707b4b9f0442ad92524f033fa7cecb20f73ba3393f31fd17d491db61e82`;
- QA attempt-cost evidence SHA-256:
  `97a2c07f45016d832d4ffe2b9e062c5c52636302baa648c40be73bc308cb3e16`;
- private-master QA exact restart replay: passed;
- private review graph complete: true;
- customer-delivery master created: false;
- export execution authorized: false;
- product ready: false; and
- production ready: false.

These hashes identify one retained local run. They are not deployed identities
and do not prove the six-hour graph or production infrastructure.

## Six-hour graph truth

The implementation consumes the same generic 2-to-124-chunk contract, but it
does not fabricate the remaining work in the separate maximum six-hour graph.
That graph remains 8/255 complete because its other 122 object chunk pairs,
their QA jobs, and the required cross-boundary work have not executed. Its
master and final QA are not eligible until every exact dependency genuinely
completes.

## Verification packet

All of the following completed with exit code 0 after the final runtime change:

```text
npm run typecheck:server
npm run lint
npm run build:server
npm run check:secrets
npm run smoke:offline-media-binary-execution
npm run smoke:private-internal-attempt-cost-evidence
npm run smoke:canonical-professional-long-form-private-master-qa
npm run smoke:canonical-private-package-work-queue
npm run smoke:private-local-persistence
npm run smoke:canonical-private-package-state-transaction
npm run smoke:edit-architecture-e2e
npm run smoke:private-final-render-settlement-preflight
npm run smoke:prod-final-render-export
npm run smoke:rate-card
npm run smoke:tool-cost-metering
npm run smoke:canonical-professional-long-form-post-approval
```

The secret scan inspected 4,535 files without printing secret values. The
maximum-graph smoke retained 124 chunks and 255 jobs, with 8 completed and 247
blocked; `liveGoogleCloudVerified`, `productReady`, and `productionReady`
remained false.

## Closed gates

This slice does not prove or authorize:

- H.264/AAC customer-delivery encoding or decoded delivery QA;
- export, download unlock, or public delivery;
- recovery of an already-started FFprobe attempt after lease/process loss;
- distributed database-backed queue, outbox, terminal, or artifact authority;
- live Google Cloud worker dispatch, IAM, storage, or completion;
- canonical or remote Supabase mutation;
- provider activation;
- billing, wallet mutation, settlement, or customer charging;
- deployment, Gmail website acceptance, external beta, or production.

## Next dependency-safe capability

Implement the separately authorized H.264/AAC customer-delivery lifecycle
from this passed private review master. It must reuse the original approved 4K
estimate and reservation, add decoded delivery QA and private download
authority, and continue to keep public delivery, billing, and production
activation fail-closed until their own evidence exists.
