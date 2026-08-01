# Living Frame Controlled SDXL GPU Runtime Protocol

Status: source contract implemented; non-dispatching; production gates
closed.

This contract is the private boundary between the already-materialized
ComfyUI API prompt and a future canonical GPU worker operation. It does
not register a tool, dispatch a worker, create an attempt, calculate a
customer charge, or prove a production result.

## Why this seam exists

Living Frame's controlled-illustration workflow uses five GPU-resident
capabilities inside one ComfyUI process:

1. the ComfyUI execution host;
2. external control-image preprocessing, represented in this benchmark
   by its server-owned output artifact;
3. ControlNet conditioning;
4. generic IP-Adapter conditioning; and
5. a loaded PEFT/LoRA adapter.

Those are capability attributions inside one GPU attempt. They are not
five independent GPU jobs and must not be priced as five independent
provider calls. AuraFace is not part of this request; when continuity
measurement is required, it is attributed separately as a bounded CPU
QA attempt.

The protocol therefore binds:

- one single-use materialized prompt lease;
- the exact current model and input-image artifact set;
- one private ComfyUI wire request;
- one future shared GPU-host attempt expectation; and
- one future canonical worker-resource-cost evidence requirement.

## Private data boundary

The caller supplies only a server-owned artifact locator, the verified
prompt-materialization receipt, and its process-bound prompt lease. A
server-created, single-use reader returns current controlled artifact
metadata. The compiler rejects caller-shaped readers, unknown keys,
wrong lineage, aliases that do not match the materialized prompt,
runtime downloads, network fetches, paths, URLs, credentials, and
silent CPU fallback.

The serialized receipt contains hashes, counts, stable record IDs, and
closed policy literals. It never contains:

- prompt or conditioning text;
- private model or image aliases;
- model or image bytes;
- filesystem paths or signed URLs;
- commands or credentials;
- prices, credits, service-fee amounts, reservations, wallets, or
  ledger data.

The raw request is held behind a second process-bound, single-use lease.
Consuming that lease only exposes the already-compiled request to a
future canonical operation adapter. It does not itself authorize
dispatch.

## Cost and credit invariant

This source contract does not set a dollar amount or mint a cost event.
It preserves the established pricing chain:

```text
one private ComfyUI wire request
→ one future GPU execution attempt
→ one canonical worker-resource-cost receipt
→ one Living Frame actual-cost attribution
→ bundle aggregation
→ credit conversion and rounding once
→ canonical service fee once
→ existing approval/reservation/settlement authority
```

The following rules are bound into the receipt:

- the first five controlled-illustration capabilities share one
  approved GPU-worker attempt lifetime, even though the benchmark graph
  receives preprocessing's output artifact rather than running a custom
  preprocessor node;
- exact asset reuse creates no new GPU attempt;
- AuraFace CPU measurement is excluded from the GPU request;
- failed and unknown attempts retain their internal cost;
- customer credits are rounded once after bundle aggregation; and
- the ReeditPro service fee is applied once by the downstream canonical
  commercial authority.

This prevents double counting while keeping internal infrastructure
cost distinct from customer price, credits, and service fee.

## Output expectation

The controlled benchmark request expects exactly one 1024-by-1024 PNG
from the `SaveImageWebsocket` graph bridge. The request requires:

- an NVIDIA L4 worker profile;
- one GPU;
- `europe-west1`;
- read-only mounted artifacts;
- no runtime download;
- no network fetch; and
- no CPU fallback.

These are request expectations, not evidence that a Cloud Run worker or
operation exists.

## Closed production gates

The contract remains non-production until the canonical backend owns
and verifies all of the following:

- a ProductionToolId and operation registration for the qualified
  ComfyUI route;
- current GPU node-schema revalidation;
- a dependency-locked, scanned, signed GPU image;
- distributed private model and input mounts;
- canonical private GPU dispatch and worker leases;
- released attempt and completion receipts;
- canonical worker-resource-cost evidence;
- GPU metric attestation;
- actual-cost attribution and customer estimate/settlement
  reconciliation;
- exact paid-use and model-weight review; and
- approved scene, snapshot, work, asset, QA, and private-review lineage.

Until those gates close, the protocol receipt explicitly records
`dispatchReady = false`, `gpuAttemptCreated = false`,
`actualAttemptCostEvidenceCreated = false`, and
`productionReady = false`.
