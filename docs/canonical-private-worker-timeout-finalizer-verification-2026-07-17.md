# Canonical Private Worker Timeout Finalizer Verification — 2026-07-17

Status: `single_host_durable_attempt_start_and_controller_timeout_finalizer_verified_distributed_observer_blocked`

## Outcome

ReEditPro now has a private, single-host recovery path for a metered worker that
dies after its runtime allocation starts but before it writes terminal internal
cost evidence.

The accepted worker must call the server-owned attempt-start boundary before
tool or media execution. Under the package-scoped cooperative lock, that
boundary revalidates the exact approved snapshot, work item, job, delivery
attempt, queue claim, manifest entry, controller receipt, worker receipt, and a
fresh process-branded worker identity. It then writes one checksum-protected,
`0600`, create-only start record. Execution must not begin when the tool lacks a
supported durable cost profile, the worker identity differs, the lease is no
longer active, or the record conflicts.

The private controller now owns a bounded package scan. The caller supplies no
job ID or dispatch intent. The controller selects up to 32 expired
`worker_identity_accepted` attempts in deterministic lease-expiry order,
revalidates each under the package transaction lock, and requires either:

- the exact terminal failed-timeout cost evidence already persisted; or
- an exact durable attempt-start record for one of the currently metered
  DeepFilterNet, Remotion, or FFmpeg workload profiles.

For the second case, the controller deterministically meters internal runtime
from the persisted start time through the immutable queue-lease expiry. The
lease expiry—not observer delay or caller input—is the finish boundary. It
persists one failed `timeout` cost record, then the existing timeout WAL commits
the queue release and terminal outbox receipt together. Exact retries replay;
no automatic package attempt starts.

## Authority Flow

```text
approved snapshot + funded reservation + package work item
  -> server-selected queue claim and opaque outbox attempt
  -> exact controller identity accepted
  -> exact worker identity accepted
  -> worker reauthenticates immediately before runtime allocation
  -> one create-only attempt-start/cost binding is persisted under package lock
  -> tool/runtime may begin inside the private bounded contract
  -> worker disappears before terminal cost finalization
  -> immutable queue lease expires
  -> controller authenticates and scans its own package scope
  -> controller selects the expired dispatch intent
  -> terminal internal cost is finalized through immutable lease expiry
  -> timeout WAL atomically releases queue claim + terminalizes outbox
  -> a later approved attempt requires a separate explicit enqueue
```

No browser, worker, or caller selects a retry. No raw authorization header,
bearer token, claim credential, prompt, media path, signed URL, customer price,
customer credits, service fee, wallet operation, settlement, invoice, or
billing instruction is persisted or accepted by this boundary.

## Durable Start Evidence

`canonical-private-cloud-dispatch-attempt-start-evidence-v1` binds:

- owner, workspace, project, edit session, approved snapshot, work item, job,
  execution attempt, and retry number;
- exact canonical tool and operation plus the fixed metered workload profile;
- rate-card version, attempt identity hash, attempt input hash, and fixed CPU,
  memory, and GPU envelope;
- package record, delivery attempt, queue definition, manifest entry, queue
  claim, claim expiry/deadline, controller receipt, and worker receipt; and
- the server timestamp at which runtime allocation metering began.

The current supported profiles are:

| Tool | Durable profile | Fixed envelope |
|---|---|---|
| DeepFilterNet | `deepfilternet_cpu_4vcpu_4gib_v1` | 4 vCPU, 4 GiB, CPU-only |
| Remotion | `remotion_4k_source_slice_chunk_cpu_2vcpu_4gib_v1` | 2 vCPU, 4 GiB, CPU-only |
| FFmpeg | `ffmpeg_4k_mezzanine_finalization_cpu_2vcpu_4gib_v1` | 2 vCPU, 4 GiB, CPU-only |

Every other canonical tool remains fail-closed at this attempt-start boundary
until it has a reviewed terminal metering profile. This does not reduce the
existing 50-tool dispatch-contract or adapter inventory; it prevents that
inventory from being misrepresented as 50 production-metered runtimes.

## Focused Verification

`npm run smoke:canonical-cloud-dispatch-outbox-receivers` passes `31` checks.
The new checks prove:

- an unmetered tool cannot claim a durable cost start;
- wrong worker identity and pre-expiry timeout finalization fail closed;
- concurrent start calls converge on one record plus exact replay;
- the record survives service reconstruction and is mode `0600`;
- the record contains no bearer token, claim credential, or customer
  commercial fields;
- a checksum-tampered or removed start record cannot mutate queue/outbox state;
- all three supported workload profiles bind their exact resource envelopes;
- the controller, not its caller, selects the expired attempt;
- timeout cost is derived exactly from start time through immutable lease
  expiry;
- one timeout reconciliation occurs and later finalizer runs are no-ops;
- later package execution still requires an explicit server enqueue; and
- distributed, live-cloud, commercial, and production authority remain false.

The following also pass on the same source:

- `npm run typecheck:server`;
- `npm run smoke:private-internal-attempt-cost-evidence`;
- `npm run smoke:canonical-private-package-state-transaction`; and
- targeted ESLint plus `git diff --check`.

## Honest Readiness Boundary

This is create-only private local persistence plus a cooperative same-host
package lock. It proves restart-safe application behavior and exact
idempotency for cooperating processes. It does not prove a distributed
database transaction, host-power durability, multi-replica ownership, a
deployed sweeper schedule, authoritative Cloud Run job termination, Cloud Tasks
dead-letter handling, live heartbeat/death observation, Google IAM, private GCS
transport, provider activation, remote Supabase, customer billing, deployment,
public delivery, external beta, or production readiness.

The next infrastructure gate remains a reviewed distributed package queue,
outbox, attempt-start, terminal-cost, and timeout transaction/RPC, followed by
controlled staging proof of live Google identity/IAM, duplicate delivery,
worker death, late completion fencing, dead-letter reconciliation,
observability, and recovery. No SQL, cloud resource, provider, billing, or
deployment mutation was performed here.
