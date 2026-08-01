# Living Frame Controlled-Illustration Cost/Work Binding

## Purpose

This binding closes the planning gap between a generated Living Frame
component's internal cost ceiling and its future named
`generate_image_asset` work requirement.

It does not execute generation. It proves that every generated opaque-still
asset intent is covered by:

- one shared controlled-illustration GPU cost line;
- one future named `generate_image_asset` batch requirement;
- one required generated PNG output per asset intent;
- the same server-recalculated customer estimate presented before approval;
- actual-attempt cost evidence after future execution; and
- an optional, separately priced AuraFace `run_asset_qa` expectation only
  when identity-continuity measurement is required.

## Pricing Invariants

- ComfyUI, ControlNet Aux, ControlNet, IP-Adapter, and PEFT/LoRA are
  capabilities inside one shared GPU-host attempt. They are not five separate
  customer charges or five ProductionToolIds.
- AuraFace is a conditional post-generation CPU continuity measurement. It is
  not part of the GPU-host lifetime.
- Cost is accumulated in exact internal micro-units before conversion to
  ReEdit Credits.
- The ReeditPro service/edit fee is absent from tool costs and appears exactly
  once in the downstream canonical customer estimate.
- Exact approved-asset reuse adds no generation cost.
- Failed and unknown attempts retain internal cost evidence but are not
  customer-billable candidates. ReeditPro absorbs unapproved overage.
- The existing canonical estimate, approval, reservation, actual-cost,
  settlement, and wallet authorities remain the only authorities.

## Work Binding

One generated scene produces one bounded batch requirement:

```text
generated asset intents
  -> shared GPU estimate line
  -> named generate_image_asset requirement
  -> one expected opaque PNG per asset intent
  -> future approved work graph
  -> future actual attempt receipts
  -> existing settlement policy
```

The existing canonical work graph now admits this exact digest-bound
requirement as a named, immutable, operation-pending
`generate_image_asset` work item. When AuraFace continuity measurement is
required, a separate operation-pending `run_asset_qa` item depends on the
generation item. Each cost line is assigned to one of those work items, so
controlled-illustration cost is no longer left outside the graph.

Admission is not execution. Both items have no approved tool operation,
provider route, executable payload, runtime lease, or dispatch authority.
The graph blocks only the affected generated-asset branch until the existing
operation, artifact-mount, dispatch, and QA authorities qualify it.

## Current Gate

This slice makes missing or duplicated pricing fail closed, eliminates
unassigned controlled-illustration cost lines, freezes the binding in the
same component-ref lineage as the customer estimate, and adds only
non-executable canonical plan work. It does not register ComfyUI, install
model weights, create approved execution authority, dispatch a GPU worker,
mutate credits, or make Living Frame production-ready.
