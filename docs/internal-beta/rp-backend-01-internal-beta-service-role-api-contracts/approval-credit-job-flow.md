# RP-BACKEND-01 Approval Credit Job Flow

The narrow internal beta flow remains blocked until route handlers are implemented and validated.

Required future flow:

1. Authenticated workspace member creates or opens a project/session.
2. Frontend-safe planning produces compiled intent, source sequence map, edit plan, timing plan, QA plan, render strategy, and credit estimate.
3. User approves the edit plan and credit estimate.
4. Backend commits `internalBeta.approvedPlan.commit`.
5. Backend creates `internalBeta.creditReservation.create`.
6. Backend enqueues `internalBeta.job.enqueue` only after snapshot and reservation checks pass.
7. Worker writes status events and artifact manifest metadata through backend-owned paths.
8. User reads sanitized job status and QA report metadata.
9. Preview/export artifact access stays private and remains disabled until the private artifact access gate is approved.

Hard blocks:

- No job may execute from raw chat.
- No job may execute without an approved snapshot.
- No job may execute without a valid credit reservation.
- No provider/model call may run from frontend code.
- No render/export may start before required assets and QA are ready.
- No public artifact or final delivery unlock is included in RP-BACKEND-01.
