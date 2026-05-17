# Approved Plan Snapshot Policy

## Purpose

Raw chat is not enough for workers. ReeditPro is chat-native, but execution must use a structured, approved snapshot.

The approved snapshot is the frozen contract between the user, the planner, credit estimate, future workers, and QA.

## Approval Freezes The Plan

When a user approves the edit plan and credit estimate, ReeditPro should freeze an approved plan snapshot. Future workers execute that snapshot only.

The snapshot must include:

- compiled intent
- confirmed settings
- source order
- professional editing directive
- segment operations
- visual asset plan
- renderer plan
- QA plan
- provider routing
- credit estimate
- approval record

Workers should not reinterpret raw chat messages. Workers should not change approved plan behavior unless the approved fallback policy allows it.

## Revision Policy

If the user changes important instructions after approval, ReeditPro should create a new plan version. The previous approved plan remains immutable except for status and audit fields.

Examples that should create a new version:

- changed edit level
- changed output ratio or frame template
- changed source order
- changed custom instructions
- changed reference video
- changed visual preference
- changed credit preference
- request to add/remove major visuals or Real Motion

## Credits And Approval

Credits are reserved or deducted only after approval according to future credit ledger policy. Subscription is software access; Reedit Credits pay for generation, rendering, and editing usage.

Failed ReeditPro generation should be refunded or restored according to future billing policy.

The approved snapshot must point to the exact credit estimate the user approved. If a revision changes estimated usage, ReeditPro must create a new estimate and ask for approval again.

## Tier And Model Policy In Snapshot

The approved snapshot must freeze model constraints:

- Basic cannot use Veo.
- Pro cannot use Veo.
- Premium may use Veo 3.1 Lite only as final fallback/rescue.
- Veo is never primary or default.
- Generated video routes must not default to 1080P.
- Wan remains primary animation generation.
- Hailuo remains normal fallback/alternate.

Workers cannot bypass these constraints during QA fallback.

## Frame Background Policy In Snapshot

The approved snapshot must freeze the frame/background policy:

- AI-video assets use matching white/near-white/custom panel backgrounds by default.
- Transparent AI-video backgrounds are not the default.
- The final canvas belongs to ReeditPro and the planned Remotion compositor.
- AI-generated clips live inside controlled frame/panel zones.

## Worker Rule

Workers execute approved snapshots, not raw chat. If the plan cannot be completed inside the approved route, fallback allowance, credit estimate, or tier policy, the system should request a revision or new approval.

This document does not create a database table, migration, backend route, credit ledger, provider integration, renderer job, or export flow.
