# Living Frame Cloud Run L4 pricing

Status: bounded estimate input; dated public-list observation; not production
rate authority

Observed: 2026-07-29

## Purpose

Living Frame controlled illustration combines ComfyUI, external control-image
preparation, ControlNet, generic IP-Adapter, and loaded PEFT/LoRA adapters
inside one future GPU-host attempt. Those five capability labels must not
become five customer charges. Optional AuraFace continuity measurement remains
a separate CPU QA contribution.

The original Living Frame estimate used the repository-wide
`rp-ratecard-01-mock-safe` infrastructure placeholders. That generic helper
also defaulted `renderSeconds` to the full worker lifetime, adding a synthetic
renderer charge to a Cloud Run inference attempt. This document and the
namespaced calculator replace that GPU estimate input with a dated,
unit-accurate public-list observation. They do not replace the canonical
customer estimate, credit, service-fee, approval, reservation, settlement, or
actual-cost authorities.

## Dated public rates

The 2026-07-29 observation records these default USD list prices:

| Resource | Public list price | Stored integer unit |
|---|---:|---:|
| CPU | $0.000018 per vCPU-second | 18,000 USD nanos |
| Memory | $0.000002 per GiB-second | 2,000 USD nanos |
| NVIDIA L4, no zonal redundancy | $0.0001867 per GPU-second | 186,700 USD nanos |
| Cloud Run ephemeral disk | $0.000109589 per GiB-hour | 109,589 USD nanos |
| Regional Standard Cloud Storage | $0.000027397 per GiB-hour | 27,397 USD nanos |
| Regional Standard Class A write | $0.005 per 1,000 operations | 5,000 USD nanos per write |
| Cloud Run GPU request fee | none | 0 USD nanos |

Primary sources:

- [Cloud Run pricing](https://cloud.google.com/run/pricing)
- [Cloud Run GPU requirements and regions](https://docs.cloud.google.com/run/docs/configuring/services/gpu)
- [Cloud Storage pricing](https://cloud.google.com/storage/pricing)

These values are a source-controlled observation, not a live Cloud Billing
Pricing API response, billing-account price, invoice, committed-use discount,
or production rate approval. Production admission still requires a current
server reread from the shared pricing authority and later invoice
reconciliation.

## Workload assumptions

The current controlled-illustration estimate assumes, per generated asset
attempt:

- `europe-west1`;
- instance-based Cloud Run billing;
- one non-zonally-redundant NVIDIA L4;
- eight vCPU;
- 32 GiB instance memory;
- two GiB temporary disk;
- 90 seconds of instance lifetime;
- one approximately 100 MiB output retained in Regional Standard Cloud
  Storage for 24 hours; and
- one Class A object write.

Cloud Run rounds billable instance time upward to 100 milliseconds and applies
a 60-second minimum to each instance-based attempt. The calculator applies the
minimum and rounding separately to every attempt before aggregating. It does
not collapse several short attempts into one minimum.

No free tier, committed-use discount, billing-account discount, or currency
conversion is applied. Same-region network egress is assumed to be zero.
Class B reads, Artifact Registry, soft-delete/version-retention amplification,
tax, and unexpected retry resources remain outside the expected base and must
come from later actual-usage evidence. The existing high-risk estimate buffer
remains downstream.

## Integer cost math

Rates are held in USD nanodollars so the fractional-micro L4 price is not
rounded early. Each SKU usage is calculated in nanos, the SKU contributions
are summed, and the bundle converts to USD micros once:

```text
billable_ms_per_attempt =
  max(60,000, ceil(wall_ms / 100) * 100)

total_billable_ms =
  attempt_count * billable_ms_per_attempt

cpu_nanos =
  ceil(vcpu * total_billable_ms * 18,000 / 1,000)

memory_nanos =
  ceil(memory_gib * total_billable_ms * 2,000 / 1,000)

gpu_nanos =
  ceil(gpu_count * total_billable_ms * 186,700 / 1,000)

temp_storage_nanos =
  ceil(temp_gib * total_billable_ms * 109,589 / 3,600,000)

output_storage_nanos =
  ceil(output_count * output_mib * retention_hours * 27,397 / 1,024)

output_write_nanos =
  output_count * 5,000

expected_internal_cost_micros =
  ceil(sum(all_nanos) / 1,000)
```

There is no synthetic `renderMicros` line. Remotion/rendering is priced by its
own canonical owner when that work exists.

## Checked examples

One 90-second attempt for one 100 MiB output produces:

```text
CPU                 12,960,000 nanos
Memory               5,760,000 nanos
L4 GPU              16,803,000 nanos
Temporary storage        5,480 nanos
Output storage           64,212 nanos
Class A write              5,000 nanos
-------------------------------------
Total                35,597,692 nanos
Expected internal cost   35,598 micros ($0.035598)
```

Two Premium generation units plan two attempts each. The four-attempt bundle
is `142,253` expected internal USD micros before the existing high-risk range.
The earlier generic placeholder path produced more than ten times that GPU
estimate because its provisional CPU, memory, and GPU rates were much higher
and it also added a renderer line.

## Customer credit flow

This calculator emits internal cost only:

```text
all Living Frame internal-cost contributions
  -> aggregate in USD micros
  -> existing risk range
  -> canonical bundle allocation
  -> round credits once
  -> existing edit-level service fee once
  -> existing estimate and approval
```

Normal, Premium, and Ultra Premium currently plan one, two, and three attempts
per generated asset respectively. Exact approved-asset reuse plans zero new
attempts. Failed and unknown attempts remain internal-cost evidence and are
not silently converted into customer charges. Unapproved overages remain
ReeditPro's responsibility under the existing credit policy.

AuraFace currently retains the small generic CPU placeholder estimate because
its final execution placement and production resource profile are not yet
qualified. It must receive a separately reviewed public or billing-account
rate binding before production; this GPU correction does not guess that
placement.

## Closed gates

This slice does not:

- call the Cloud Billing Pricing API;
- read billing-account prices or discounts;
- create a provider/tool operation or Cloud Run job;
- mint actual attempt-cost evidence;
- write a wallet, ledger, reservation, invoice, or settlement event;
- add the Reeditpro service fee;
- approve an estimate;
- dispatch, render, or produce an asset; or
- claim production price or runtime authority.
