# RP-INTERNAL-BETA-CREDIT-RESERVATION-LOCAL-RUNTIME-1 Runtime Contract

Local runtime function: `createInternalBetaCreditReservationLocalRuntime`

Runtime status values:
- `local_credit_reservation_validated_no_remote_mutation`
- `blocked_invalid_credit_reservation_input`

Required inputs:
- `workspaceId`
- `projectId`
- `editPlanId`
- `approvedPlanSnapshotId`
- `creditEstimateId`
- `creditApprovalId`
- `creditEstimateStatus: approved`
- `estimatedCredits`
- `approvedByUserId`
- `idempotencyKey`

Created local-only metadata on success:
- deterministic `credit_reservation_<hash>` id
- deterministic `credit_ledger_reservation_<hash>` id
- `reservedCredits`
- `spentCredits: 0`
- `releasedCredits: 0`
- `refundedCredits: 0`
- idempotency key hash
- local-only metadata with `realCreditMutation: false`

Blocked inputs:
- missing approved estimate or idempotency data
- negative or non-finite credit totals
- raw chat, raw prompt, provider prompt, signed/public URL, service-role, Stripe secret, or payment-intent fields in metadata
- secret-like metadata values

Remote credit mutation: `false`

Stripe/payment processing: `false`

Supabase persistence: `false`

Internal beta unlock: `false`
