# Private Worker Resource Usage And Cost Evidence — 2026-07-20

## Verdict

`PRIVATE_WORKER_RESOURCE_USAGE_COST_EVIDENCE_EMBEDDED_CAPTURE_ACCEPTED_CLOUD_ADAPTER_BLOCKED`

ReEditPro now has one provider-neutral, attempt-level contract for retaining
observed CPU, memory, GPU, elapsed-time, network, artifact-lineage, and
infrastructure-cost evidence. Nine canonical Node operations, 19 canonical
Python operations, and the two generic FFmpeg/FFprobe operations now populate
that contract automatically from measurements captured inside their exact
confined private containers. The evidence remains private/local, uses a
placeholder infrastructure rate card, and is deliberately unable to authorize
production execution.

This increment does not install a Cloud Run/GKE observer, execute a provider,
activate Google Cloud, reconcile an invoice, charge a customer, or make all
registered operations production executable.

## Registry Truth

The current complete server registry contains:

- 72 exact canonical tool-operation specs and operation IDs;
- 53 operations with a privately verified runner;
- 19 operations that remain planned, unverified, or policy-blocked;
- 13 GPU-capable operation contracts, all of which now require
  `gpuMilliseconds`; and
- two separately registered provider operations,
  `provider.lyria.generate_music_candidate.v1` and
  `provider.elevenlabs.generate_storytelling_speech_candidate.v1`, admitted
  only through private injected evidence while both provider transports remain
  blocked.

That is 74 metering contracts in this bounded proof. It is not a claim of 74
production-ready tools. The older 50 count refers to the bounded operation
catalog surfaced by `smoke:professional-tool-operation-specs`; the complete
registry has since grown to 72 tool-operation identities.

## Frozen Evidence Contract

`server/tool-cost-metering/private-worker-resource-usage-cost-evidence.ts`
binds one record to:

- exact owner, workspace, project, edit, approved snapshot, package, approved
  work item, job, attempt ordinal, lease, dispatch grant, and idempotency
  hashes;
- one current registry-resolved tool or provider operation profile;
- the full immutable tool-operation spec digest, worker class, attempt/input/
  output/network/resource ceilings, and measurement contract;
- runtime image, runtime attestation, runtime execution, container, observer,
  and optional cloud-resource digests, with no raw container identifier, path,
  request, response, or credential;
- independently hashed start and finish observer snapshots with cumulative CPU
  nanoseconds, current/peak memory bytes, and cumulative GPU-active
  milliseconds;
- recomputed wall time, allocated vCPU/memory/GPU time, observed CPU/GPU deltas,
  peak memory, network egress, and infrastructure evidence digest;
- exact private input/output artifact IDs, checksums, byte lengths, manifest
  hashes, and operation ceilings;
- completed, failed, and unknown outcomes, retaining the infrastructure cost of
  failed and unknown attempts; and
- create-only private-local persistence with exact replay/readback and
  checksum-derived tamper detection.

The cost calculation reuses the versioned `rp-ratecard-01-mock-safe` shared
rate-card and infrastructure math. It charges the allocated resource envelope
for the measured interval while retaining observed utilization separately.
That rate card is a placeholder, not an official Google Cloud price or invoice.
Provider cost is explicitly excluded because it remains in the separate
provider-attempt cost authority.

Customer price, customer credits, ReEditPro service fee, wallet mutation, and
billing mutation remain false and outside this record.

The evidence module does not issue a package, queue claim, lease, dispatch
grant, reservation, or tool/provider call. It records exact hashes supplied by
the canonical lifecycle; it cannot replace or bypass those authorities.

## Registry Correction

`server/tool-execution/professional-tool-operation-spec-registry.ts` now derives
GPU cost measurement requirements from the actual immutable GPU allocation
ceiling. This closes a mismatch for the Torch/TorchVision and Transformers
readiness operations, whose CUDA worker/resource contracts previously omitted
`gpu_millisecond` and `gpuMilliseconds` cost evidence.

## Automatic Embedded Capture

The exact Node and Python container protocols now return one versioned start/
finish observation captured inside the executing process. The server verifies
and normalizes that wire payload against:

- the exact reviewed runner bundle or Python runner digest;
- an opaque hash of the fresh container identity and immutable image identity,
  never the raw container ID;
- cumulative user/system CPU, current and peak resident memory, exact start and
  finish timestamps, and an explicit null GPU counter for these CPU runners;
- the configured one-vCPU, 768-MiB, zero-network confinement envelope; and
- a checksum over the normalized observation.

After actual output persistence, QA, lease completion, reconciliation, and a
fresh approved-authority readback, the canonical execution services create one
private create-only cost record for the exact attempt. It binds approved
snapshot, package, work item, job, lease, one-use dispatch, request, source (if
applicable), accepted output, runtime image, attestation, resource interval,
and internal infrastructure cost. An exact idempotent replay verifies the
first record's identity and input/output manifests and returns it; it cannot
overwrite the first container's retained usage with a later retry.

This automatic capture currently covers all 28 operations routed through the
canonical structured Node and Python coordinators.

The generic canonical FFmpeg and FFprobe paths now add two more operations.
Their fixed image entrypoint reads cgroup-v2 `cpu.stat`, `memory.current`, and
`memory.peak` before and after each allowlisted container command. A fresh
nonce and the exact image/container identity bind one terminal marker to the
server-side execution. The runtime rejects a missing, duplicate, malformed,
non-terminal, non-monotonic, or identity-mismatched marker and never exposes
the raw container ID. A generic FFmpeg attempt may use several sequential
containers for source/reference analysis, the approved recipe, and independent
output probing; the server sums exact CPU deltas, takes the maximum cgroup
memory peak, and conservatively measures wall time from the first component's
start through the last component's finish.

After accepted private persistence, QA, lease completion, reconciliation, and
fresh authority readback, the same canonical lifecycle persists one existing
worker-resource cost record for the aggregate media attempt. The record binds
the exact source/dependency/reference inputs and accepted output. It does not
cover the specialized long-form FFmpeg entrypoints, Sharp, Remotion,
DeepFilterNet, native-audio, GPU, provider, or other runner families merely
because those operations have separate private runner proof. It is cgroup and
process evidence from confined local containers, not qualified Cloud Run task
telemetry and not a cloud invoice.

## Verification

Run:

```bash
npm run smoke:private-worker-resource-usage-cost-evidence
```

The smoke is also a required step in `npm run qa:canonical-private-pipeline`.

The retained deterministic smoke proves:

- 72/72 tool-operation contracts have CPU/memory measurements;
- 13/13 GPU-capable contracts have GPU measurements;
- all 74 current tool/provider contracts appear in the coverage evidence;
- one completed DeepFilterNet GPU attempt has exact snapshot, artifact,
  operation, runtime, cost, create-only readback, and replay proof;
- failed and unknown attempts retain nonzero internal infrastructure cost;
- Lyria and two-output Storytelling Speech provider operations accept only
  injected observed-resource evidence with zero provider requests and zero
  cloud mutation;
- unregistered providers, non-injected provider claims, unverified/policy-
  blocked tools, operation/tool mismatch, and worker-class mismatch fail
  closed;
- CPU, memory, GPU, attempt, lease, output-byte, offline-egress, provider-cost,
  manifest, and snapshot-digest ceiling violations fail closed;
- conflicting replay, recomputed-record tamper, and stored symlink substitution
  fail closed; and
- production authority, commercial fields, billing, and wallet behavior remain
  blocked.

The authoritative `npm run smoke:canonical-private-tool-dispatch` journey also
passes with all 28 eligible Node/Python operation IDs plus generic FFmpeg and
FFprobe producing one exact embedded observation and internal-cost record under
their real canonical snapshot/package/job/lease/dispatch/artifact/QA/
reconciliation lifecycle. It asserts create-only replay, the exact one-vCPU/
768-MiB structured-runner and two-vCPU/2-GiB media confinement envelopes, zero
network egress, null cloud-resource identity, placeholder-rate truth, and
complete separation from customer price, credits, service fee, wallet, and
billing.

The post-hardening rerun completed with exit code `0` on 2026-07-20. Its
terminal check list includes:

- `all_28_node_and_python_operations_persist_exact_embedded_cpu_memory_and_internal_cost_evidence`;
- `canonical_ffmpeg_and_ffprobe_attempts_persist_exact_cgroup_v2_cpu_memory_and_internal_cost_evidence`;
- `media_binary_resource_evidence_binds_job_attempt_lease_dispatch_input_output_and_replay`; and
- `embedded_usage_evidence_is_create_only_replay_safe_and_commercially_separate`.

The same run retained all 50 canonical private lifecycle and job-adapter
identities. The replay path verifies the exact first input and output artifact
manifests before returning existing evidence.

The retained deterministic evidence hashes are:

- completed GPU attempt:
  `0156be880735b75a873bf6adcf76146ed771e721aee23e977f4644be9423dc95`;
- failed attempt:
  `3f94c4877a682b767b4ef0c852c49b1d5efd7e5b2179bbe931db449a0a4e8709`;
- unknown attempt:
  `d73d29c3a417184c75c97a4f3e6ddf8abd195074e771faa2f041332b80a1c560`;
  and
- injected Lyria attempt:
  `bcd2598e9f03fddec873d9772023f881095f352f2d7eeb7c86350a41e8df450c`.

### Authoritative Aggregate Regression

`npm run qa:canonical-private-pipeline` passed all 43 v32 phases with exit code
`0` on 2026-07-21 UTC; its final tool report was generated at
`2026-07-21T03:00:20.253Z`. The aggregate included both the 74-contract
resource smoke and the complete canonical embedded-resource lifecycle and
retained the following adjacent proof without widening this increment's
authority:

- automatic attempt-bound CPU/memory and internal infrastructure-cost evidence
  for 30 operations: 28 structured Node/Python operations plus generic FFmpeg
  and FFprobe;
- a three-source canonical private composition with trim, caption, voice,
  reference-bound color, lease, one-use dispatch, QA, reconciliation, replay,
  private persistence, and private download evidence;
- interrupted resumable 4K source upload recovery, one 67,338,001-byte
  lossless professional-color intermediate, and one 19,141,508-byte 4K H.264
  delivery master under the original approved 4K estimate;
- one separately confined 4K Remotion streaming proof that produced a
  51,969,263-byte H.264/AAC MP4 above the former 16 MiB output boundary;
- 11/11 active named-edit Chromium workflow tests; and
- the final proven-tool report with 72 registry profiles, 53 confined-runner
  proofs, and 50 canonical private end-to-end/job-adapter proofs.
- one exact private-injected Storytelling Speech provider attempt with two
  ordered outputs, observed CPU/memory cost evidence, failed/unknown cost
  retention, exact reconciliation, and zero provider requests.

The final focused post-aggregate receipt guard also rejects an observed worker
infrastructure cost above the immutable authorization ceiling and rejects a
resource interval ending after its provider terminal. The Speech adversarial
smoke, historical Lyria smoke, and server typecheck passed after that stricter
guard; this focused delta is not described as a second full aggregate run.

The report explicitly kept specialized long-form media observation, Remotion
cgroup observation, deployed cloud-worker observation, `externalBetaReady`,
and `paidProductionReady` false. No aggregate phase called a provider, mutated
Google Cloud or remote Supabase, charged a customer, deployed the product, or
enabled public delivery.

## Remaining Gates

Still blocked or false:

- a qualified cloud observer adapter in each deployed worker runtime (for
  example, verified task/cgroup CPU and memory counters plus a qualified GPU
  counter source);
- automatic lifecycle capture for the other 23 privately verified operations,
  all provider attempts, and the 19 operations that still lack private runner
  proof;
- exact live package/reservation/lease/one-use-dispatch readback at evidence
  creation time and atomic distributed persistence with the terminal attempt;
- 19 remaining operation-specific runner integrations and adversarial proofs;
- official immutable Google Cloud rate snapshots and invoice reconciliation;
- deployed cross-instance metrics transport, storage, replay, and recovery;
- provider transport, credential-payload use, Cloud Run/GCS activation, remote
  Supabase, production rendering, billing, deployment, and public delivery;
  and
- signed-in website end-to-end acceptance.

No SQL, migration, package-lock, secret, local credential configuration,
provider call, Secret Manager payload read, cloud mutation, customer billing,
deployment, public delivery, or push is included.
