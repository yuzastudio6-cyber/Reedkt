# Private Media-Binary Cgroup Resource Usage And Cost Evidence — 2026-07-20

## Verdict

`GENERIC_FFMPEG_FFPROBE_ATTEMPT_RESOURCE_COST_EVIDENCE_ACCEPTED_SPECIALIZED_AND_CLOUD_BLOCKED`

The generic canonical FFmpeg and FFprobe operations now retain exact local
cgroup-v2 CPU/memory observations and one attempt-level internal infrastructure
cost record under the existing approved-snapshot/package/job/lease/one-use-
dispatch/artifact/QA/reconciliation lifecycle.

This is real private runner and canonical lifecycle proof. It is not proof for
the specialized long-form entrypoints, Remotion, native-audio, GPU/provider
workers, deployed Google Cloud telemetry, official cloud prices, invoices,
customer price, credits, service fee, wallet mutation, billing, public
delivery, external beta, or production.

## Exact Scope

Covered operation identities:

- `tool.ffprobe.inspect_approved_media.v1`;
- `tool.ffmpeg.execute_approved_media_recipe.v1`.

Covered runtime boundary:

- pinned local image
  `reeditpro/ffmpeg-lgpl-internal:8.1.2-object-chunk-v7-local`;
- local OCI identity
  `sha256:f155c20bf380b6b05b18eaf2f3e5047081d66c620f3c0b4cf1f90e2b180f3ce0`;
- Linux `arm64`, numeric user `65532:65532`, `--network none`, read-only root,
  all capabilities dropped, no-new-privileges, fixed pids/CPU/memory/tmpfs,
  no caller bind, mount, environment, executable, or command authority;
- generic media allocation of two vCPU, 2 GiB RAM, and zero GPU/network
  egress; and
- product, external-beta, production, final-export, provider, commerce, and
  public-delivery authority all false.

The observer is installed only as the fixed container entrypoint. It accepts a
48-character server-generated nonce followed by one allowlisted in-image
entrypoint and its server-derived arguments. It preserves streamed stdin on a
private file descriptor, forwards termination to the child, waits for the
exact child exit, then emits one bounded terminal marker on stderr.

## Observation Integrity

`media-cgroup-resource-observer.sh` reads only:

- `/sys/fs/cgroup/cpu.stat` → cumulative `usage_usec`;
- `/sys/fs/cgroup/memory.current`; and
- `/sys/fs/cgroup/memory.peak`.

The marker commits:

- nonce;
- start and finish epoch nanoseconds;
- start and finish cumulative CPU microseconds;
- start and finish current memory; and
- start and finish peak memory.

The TypeScript normalizer requires the marker to be canonical ASCII, unique,
newline-terminated, and the final stderr record. It verifies the nonce, exact
container and image identity shapes, monotonic time/CPU/memory counters, safe
integer bounds, and the reviewed observer-script digest. The marker is removed
before ordinary FFmpeg/FFprobe diagnostic policy runs, so the observer cannot
weaken the pre-existing zero-diagnostic success gate.

The runtime hashes the raw container identity instead of persisting it. The
normalized component observation binds the immutable image ID, fresh nonce,
observer digest, timestamps, counters, and observation checksum.

## Multi-Container Attempt Aggregation

A generic FFprobe attempt has one observed component. A generic FFmpeg attempt
can use sequential source/reference analysis, approved execution, independent
output probe, and output color-analysis containers. The fixed aggregate:

- accepts one through eight exact component observations;
- sorts by captured start time and rejects overlap;
- sums component cgroup CPU deltas;
- uses the maximum component cgroup memory peak;
- conservatively measures elapsed time from the earliest start through the
  latest finish, including server-side gaps;
- retains zero GPU activity and zero network egress; and
- hashes the ordered component container/observation identities plus the
  versioned aggregation policy.

The aggregate is normalized through the existing
`private-embedded-process-resource-observation-wire-v1` contract as
`media_container_cgroup_v2_attempt_aggregate_v1` with measurement version
`embedded_media_cgroup_v2_attempt_aggregate_v1`.

## Canonical Attempt And Cost Binding

The canonical media-binary execution service records resource evidence only
after all of the following pass:

1. exact approved package/work item/job/runtime authority load;
2. active lease and one-use dispatch consumption;
3. exact private source/dependency/reference read;
4. approved FFmpeg/FFprobe execution;
5. create-only private output persistence and checksum readback;
6. artifact QA;
7. lease execution-fence completion;
8. artifact reconciliation; and
9. fresh approved planning-authority readback.

One existing `private-worker-resource-usage-cost-evidence-v1` record then binds
the owner, workspace, project, edit, snapshot, package, work item, job,
attempt, lease, dispatch, idempotency hash, operation/profile, runtime image,
runtime attestation, aggregate cgroup observation, exact input manifests, and
accepted output manifest.

Cost uses the existing `rp-ratecard-01-mock-safe` infrastructure math against
the allocated resource envelope and measured interval. Observed utilization is
retained separately. The record explicitly keeps provider cost, customer
price, customer credits, ReEditPro service fee, wallet mutation, and billing
mutation false. Failed/unknown-attempt retention remains part of the shared
contract; this slice proves the completed generic media path.

Exact idempotent replay returns the first create-only evidence hash and cannot
replace it with measurements from a later container.

## Frozen Source Evidence

SHA-256 identities at the accepted focused-test boundary:

- observer script:
  `a4fb8e77282ee6a04ab087cf41b7982edfdc1c708c6d9ff733422a8efb450a79`;
- parser/aggregator:
  `7dedea1e243c904f436860e49d9174d65f7c0f994eed01af6ee085d8b2c446a2`;
- media runtime:
  `198d9dfa289709762631863e88e4c5cda0ba4426785643abcc0159bb8f2afb7a`;
- media types:
  `4b3ba0279b03a731706a849567758d00857f6c1b36e7611336bbded62c7c7505`;
- canonical media service:
  `8e6eb0c2e212cc3efbcb5242ab279c56ca53e7992d56b3a26759817d4cc41b81`;
- shared observation contract:
  `1df17ff37e9308fa1081cc3f19b38b09747d9c7120bd37bdb454db6eae383bbb`;
- focused runtime smoke:
  `cf57968d70ded6e42cbebe5c63f09f685ba5597cc20b94cd9e37b97c00de5b97`;
  and
- canonical lifecycle smoke:
  `5104415acb949ccea5ad2ab01cf3823840c29b1797160d18176071d22ab3ccd0`.

These hashes identify the pre-documentation accepted source boundary. The
final commit/tree and aggregate report remain the release handoff identities.

## Verification

Passed with exit code `0` on 2026-07-20:

- `npm run typecheck:server`;
- `npm run smoke:offline-media-binary-execution`; and
- `npm run smoke:canonical-private-tool-dispatch`.

The focused runtime smoke proves real FFmpeg/FFprobe streamed input, output,
re-probe, deterministic replay, exact cgroup observations, multi-container
aggregation, restart-safe authority, and malformed/duplicate/non-monotonic
marker rejection.

The canonical lifecycle smoke retains all 50 canonical tool and job-adapter
identities and proves 30 operations with automatic embedded observations: 28
structured Node/Python operations plus generic FFmpeg and FFprobe. Its terminal
checks include:

- `canonical_ffmpeg_and_ffprobe_attempts_persist_exact_cgroup_v2_cpu_memory_and_internal_cost_evidence`;
- `media_binary_resource_evidence_binds_job_attempt_lease_dispatch_input_output_and_replay`;
  and
- `embedded_usage_evidence_is_create_only_replay_safe_and_commercially_separate`.

The authoritative v31 aggregate now requires both the focused media observer
smoke and the complete canonical embedded-resource lifecycle smoke. It passed
all `42/42` phases with exit code `0`, starting at
`2026-07-20T23:21:29.970Z`, finishing at
`2026-07-21T00:35:25.784Z`, and completing in `4,435,814 ms`. The observer
phase passed in `13,620 ms`; the full lifecycle phase passed in `727,760 ms`.
The machine-readable report records all three scoped claims as true and keeps
specialized long-form, Remotion, and deployed-cloud resource observation false.
The full retained evidence record is in
`docs/canonical-private-pipeline-verification.md`.

## Remaining Gates

Still false or blocked:

- cgroup/resource capture on the specialized source-slice, object-chunk,
  continuous-program-audio, long-form assembly, and customer-delivery FFmpeg
  entrypoints;
- Remotion, Sharp, native-audio, DeepFilterNet, other specialized runners, GPU,
  and provider-attempt automatic capture;
- qualified Cloud Run/GKE task identity and deployed CPU/memory/GPU metric
  transport;
- official immutable Google Cloud rate cards and invoice reconciliation;
- distributed atomic persistence of terminal attempt, artifact, and cost
  evidence;
- provider transport and credential use;
- remote Supabase/GCS/Cloud Run activation;
- customer billing, wallet/credit settlement, deployment, public delivery,
  external beta, and production; and
- signed-in same-source website acceptance.

No SQL, migration, package, lockfile, secret, local credential configuration,
provider request, Secret Manager payload read, remote database action, cloud
mutation, customer charge, deployment, public delivery, or push is included.
