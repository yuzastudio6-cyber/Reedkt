# Living Frame Credit And Cost Integration

## Canonical Rule

Living Frame uses the existing ReeditPro estimate, approval,
reservation, actual-cost, settlement, and refund authorities. It does
not create a second credit ledger or pricing system.

The customer-facing estimate is:

```text
all conservative internal tool/runtime cost credits
+ one ReeditPro service/edit fee
+ the approved fallback allowance
```

The service/edit fee is calculated once by the canonical whole-edit
estimate authority. Living Frame cost owners always report internal
tool or infrastructure cost with `serviceFeeIncluded = false`.

## Controlled Illustration Cost Ownership

The six controlled-illustration capabilities are not six product
tools and are not six independent charges:

- ComfyUI is the candidate execution host.
- `comfyui_controlnet_aux` provides candidate preprocessing.
- ControlNet is a conditioning capability.
- generic IP-Adapter is a reference-conditioning capability.
- PEFT/LoRA is an adapter-loading or training capability.
- AuraFace is a separate identity-continuity measurement capability.

The first five run inside one shared controlled-illustration GPU host,
so the estimate creates one shared GPU-host contribution per selected
scene. Capability IDs are attribution metadata only. AuraFace may add
one separate CPU measurement contribution when identity continuity is
required. AuraFace is not used for image generation, identity
conditioning, or likeness creation.

No new `ProductionToolId` is created. The exact canonical tool registry
remains at 50 identities.

## Generation Units And Retry Budget

Generation units come from the server-revalidated selected scene's
bound component asset intents:

- `generated_opaque_still_source`
- `controlled_opaque_still_variation_source`

The current conservative estimate policy uses:

| Edit level | Attempts per generation unit |
|---|---:|
| Normal | 1 |
| Premium | 2 |
| Ultra Premium | 3 |

One GPU-host contribution covers every active illustration capability
for those attempts. Retrying one generation unit does not create
separate ControlNet, IP-Adapter, LoRA, or preprocessing charges.

The source-only estimate policy uses a bounded 90-second GPU attempt
envelope with one GPU, 8 vCPU, and 32 GiB memory. It uses the existing
mock-safe internal runtime rate card. The same shared-host contribution
includes bounded temporary storage and 100 MiB of retained output per
generation unit for 24 hours. Same-region transfer is assumed to be
zero; class operations, soft-delete/versioning, and external egress
remain visible future rate-authority inputs rather than silently
invented charges. This is estimate evidence only:
it is not a current cloud price, provider invoice, released attempt
receipt, or production rate authority.

## Credit Rounding

Internal cost is retained in integer USD micros. Controlled-
illustration high-cost micros are aggregated across the entire Living
Frame bundle before conversion to integer credits. A deterministic
largest-remainder allocation assigns the aggregate credits back to
scene lines without changing the bundle total.

This avoids charging one whole credit for every tiny capability or
scene contribution. Registered tool work retains its existing
per-operation conservative ceiling because those maximums are already
bound to individual approved work items.

At the policy value:

```text
1 credit = $0.10 = 100,000 USD micros
```

## Pre-Approval And Work Admission

The canonical estimate includes controlled-illustration cost before a
controlled-illustration runtime operation is admitted. That reserved
portion is represented as an unassigned controlled-illustration
budget in the Living Frame work-graph projection. It does not create a
fake work item, `custom` work type, provider route, queue item, or
dispatch authority.

The budget can be assigned to executable work only after the existing
canonical operation, artifact, model-weight, license, security,
resource-placement, snapshot, approval, and reservation gates pass.

## Actual Cost And Settlement

The estimate never becomes actual cost evidence. Real execution must
produce durable, idempotent attempt evidence for:

- completed attempts;
- failed attempts whose infrastructure cost was incurred;
- unknown attempts that may have incurred cost;
- cache hits or reused assets that did not repeat generation.

Failed and unknown infrastructure use is retained as internal cost.
Whether it is billable to the customer remains governed by the
existing Reeditpro failure and overage policy. ReeditPro absorbs
unapproved variance and ReeditPro-caused failures; it must not silently
charge a later edit.

Final settlement remains:

```text
actual billable tool/runtime cost credits
+ the one approved ReeditPro service/edit fee
```

Unused reservation is released. A projected overage pauses paid work
and requires a revised estimate before more paid work proceeds.

## Closed Production Gates

This integration does not establish:

- a current or invoice-backed cloud rate authority;
- a released ComfyUI or AuraFace operation;
- qualified model weights, adapters, custom nodes, or preprocessors;
- provider transport, cloud deployment, or credentials;
- actual attempt receipts;
- billing, wallet, ledger, approval, reservation, or settlement
  mutation authority.

Those gates remain fail-closed in the existing canonical systems.
