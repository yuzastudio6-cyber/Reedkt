# Living Frame Controlled-Illustration Settlement Contribution

## Why this adapter exists

Living Frame estimates aggregate internal cost across the controlled-
illustration bundle before converting it to integer credits. Final cost must
preserve the same principle. Rounding each small ComfyUI, ControlNet,
IP-Adapter, LoRA, or AuraFace contribution independently could charge more
credits than the total observed cost warrants.

The settlement contribution therefore:

1. verifies the controlled actual-cost attribution;
2. includes completed attempts as billable candidates;
3. absorbs failed and unknown attempts from the customer candidate total;
4. excludes exact approved-asset reuse because it created no new attempt;
5. sums the billable candidate internal USD micros;
6. converts the aggregate to integer credits once; and
7. allocates those credits deterministically back to completed attempts using
   largest remainders and stable evidence-ID tie breaking.

## Authority boundary

This adapter does not make the final billability decision. It does not add the
Reeditpro service/edit fee, mutate a reservation or wallet, issue a refund,
persist a settlement event, absorb an overage transactionally, or unlock
export.

The canonical final settlement must reread:

- the current approved customer estimate;
- the current actual-cost evidence;
- the current failure/billability policy;
- the active reservation;
- the official rate and invoice authority; and
- durable cost events.

It then applies the one Reeditpro service/edit fee and the approved ceiling.
An unapproved overage remains a Reeditpro absorption or revised-estimate
decision under the existing policy; Living Frame cannot silently charge it.

## Six-capability rule

ComfyUI, external preprocessing, ControlNet, IP-Adapter, and PEFT/LoRA remain
one shared GPU-host cost per observed attempt. AuraFace remains one optional
separate CPU continuity-measurement cost. Capability labels do not create six
independent credit charges.
