# Private Worker Resource Usage And Cost Evidence — 2026-07-20

## Verdict

`PRIVATE_WORKER_RESOURCE_USAGE_COST_EVIDENCE_CONTRACT_ACCEPTED_RUNTIME_ADAPTER_BLOCKED`

ReEditPro now has one provider-neutral, attempt-level contract for retaining
observed CPU, memory, GPU, elapsed-time, network, artifact-lineage, and
infrastructure-cost evidence. The contract is usable for private injected
proof and is deliberately unable to authorize production execution.

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
- one separately registered provider operation,
  `provider.lyria.generate_music_candidate.v1`, admitted only through private
  injected evidence while provider transport remains blocked.

That is 73 metering contracts in this bounded proof. It is not a claim of 73
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

## Verification

Run:

```bash
npm run smoke:private-worker-resource-usage-cost-evidence
```

The smoke is also a required step in `npm run qa:canonical-private-pipeline`.

The retained deterministic smoke proves:

- 72/72 tool-operation contracts have CPU/memory measurements;
- 13/13 GPU-capable contracts have GPU measurements;
- all 73 current tool/provider contracts appear in the coverage evidence;
- one completed DeepFilterNet GPU attempt has exact snapshot, artifact,
  operation, runtime, cost, create-only readback, and replay proof;
- failed and unknown attempts retain nonzero internal infrastructure cost;
- one Lyria provider attempt accepts injected observed-resource evidence with
  zero provider requests and zero cloud mutation;
- unregistered providers, non-injected provider claims, unverified/policy-
  blocked tools, operation/tool mismatch, and worker-class mismatch fail
  closed;
- CPU, memory, GPU, attempt, lease, output-byte, offline-egress, provider-cost,
  manifest, and snapshot-digest ceiling violations fail closed;
- conflicting replay, recomputed-record tamper, and stored symlink substitution
  fail closed; and
- production authority, commercial fields, billing, and wallet behavior remain
  blocked.

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

`npm run qa:canonical-private-pipeline` passed all 38 phases with exit code 0
on 2026-07-20. The aggregate included this resource-usage evidence smoke and
also retained the following adjacent proof without widening this increment's
authority:

- a three-source canonical private composition with trim, caption, voice,
  reference-bound color, lease, one-use dispatch, QA, reconciliation, replay,
  private persistence, and private download evidence;
- interrupted resumable 4K source upload recovery, one 67,338,001-byte
  lossless professional-color intermediate, and one 19,233,922-byte 4K H.264
  delivery master under the original approved 4K estimate;
- one separately confined 4K Remotion streaming proof that produced a
  54,460,136-byte H.264/AAC MP4 above the former 16 MiB output boundary;
- 11/11 active named-edit Chromium workflow tests; and
- the final proven-tool report with 72 registry profiles, 53 confined-runner
  proofs, and 50 canonical private end-to-end/job-adapter proofs.

The aggregate continued to report `productReady`, `externalBetaReady`, and
`productionReady` as false. No aggregate phase called a provider, mutated
Google Cloud or remote Supabase, charged a customer, deployed the product, or
enabled public delivery.

## Remaining Gates

Still blocked or false:

- a qualified observer adapter in each canonical worker runtime (for example,
  verified container/cgroup CPU and memory counters plus a qualified GPU
  counter source);
- automatic start/finish capture inside the canonical tool and provider
  attempt lifecycle rather than injected smoke snapshots;
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
