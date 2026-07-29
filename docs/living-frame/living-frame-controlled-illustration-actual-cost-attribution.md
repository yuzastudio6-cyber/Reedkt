# Living Frame Controlled-Illustration Actual Cost Attribution

## Purpose

The customer estimate already prices controlled illustration before approval.
This contract covers the later, separate question: what internal
infrastructure cost was actually incurred by an observed worker attempt?

It reuses Reeditpro's existing worker resource-usage evidence and final
settlement boundaries. It does not create another ledger, rate card, customer
price, credit conversion, service fee, approval, reservation, wallet, refund,
or settlement system.

## Cost ownership

The controlled-illustration capabilities are attributed as two cost
components:

1. One shared GPU-host attempt covers ComfyUI execution,
   `comfyui_controlnet_aux` preprocessing, ControlNet conditioning,
   IP-Adapter reference conditioning, and PEFT/LoRA loading. Those five
   capability IDs explain the attempt; they are not five charges.
2. AuraFace is an optional, separate CPU identity-continuity measurement. It
   is neither a generator nor a likeness-conditioning route.

Each observed attempt keeps its exact approved snapshot, package, work item,
job, lease, dispatch, idempotency, operation, resource-usage, rate-card, and
artifact lineage through the existing private worker-cost evidence.

## Outcomes

- Completed attempts retain their actual internal infrastructure cost.
- Failed attempts retain incurred infrastructure cost.
- Unknown attempts retain possibly incurred infrastructure cost.
- Exact approved-asset reuse creates no new worker attempt and therefore adds
  zero incremental attempt cost. The original attempt cost is not erased.

Whether any attempt is billable to the customer is not a Living Frame
decision. Existing settlement policy decides billability and absorbs
Reeditpro-caused failures and unapproved overages.

## Credit boundary

The attribution output deliberately contains no customer-credit allocation.
Customer credits must be derived only after the canonical settlement layer
has decided which exact actual-cost events are billable. This avoids rounding
non-billable failures into a customer charge and avoids double-counting the
one Reeditpro service/edit fee.

The pre-approval estimate continues to aggregate controlled-illustration
micros before rounding. Actual settlement must likewise aggregate the
billable subset under the canonical credit policy instead of charging once
per capability.

## Current boundary

This slice accepts only a process-bound controlled fixture reader and
controlled non-promotable resource-usage evidence. It does not register
ComfyUI or AuraFace, dispatch work, observe a live cloud worker, approve an
official cloud rate, reconcile an invoice, create a settlement event, or
charge a customer.

The exact future operation expectations are:

- `tool.comfyui.generate_controlled_image.v1` on one qualified GPU worker; and
- a separately reviewed CPU identity-continuity measurement operation for
  AuraFace.

The AuraFace operation identity recorded in the controlled contract is a
candidate binding only. It does not promote the existing `transformers`
foundation profile into the 50-tool production registry.
