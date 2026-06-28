# RP-EXTERNAL-BETA-SINGLE-TESTER-REAL-USAGE-QA-1

Use after `RP-EXTERNAL-BETA-SINGLE-TESTER-ACTIVE-LANE-CLOSURE-1` records `completed_single_tester_external_beta_active_lane_closure_keep_expansion_blocked`.

## Goal

Run or record a bounded real-usage QA pass for the active single approved tester `aiediting@reeditpro.com` on the controlled external beta staging lane.

## Required Carry-Forward

- Active target: `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`.
- Active service: `reeditpro-staging-api`.
- Active tester group: `external-beta-testers@reeditpro.com`.
- Approved tester: `aiediting@reeditpro.com`.
- Additional tester expansion remains `blocked_no_additional_named_tester_list`.
- Paid production, public artifacts, signed URL source-of-truth, broad media, final delivery/export, and production remain blocked.

## Boundary

Any runtime QA must be bounded to authenticated staging access for the approved tester and must not add testers, mutate Google Group membership, broaden IAM, process arbitrary user/private media, run unapproved provider/model calls, spend credits, create public artifacts, create signed URLs as source-of-truth, unlock paid billing, unlock final delivery/export, or unlock production.

If no safe runtime QA is executed, record a docs-only QA plan and exact blocker.
