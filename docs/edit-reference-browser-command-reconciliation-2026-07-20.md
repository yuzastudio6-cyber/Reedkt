# Edit Reference browser command reconciliation

Date: 2026-07-20
Status: mounted local/private evidence; hosted durability remains gated

## Outcome

The canonical Edit Reference workspace now reconciles ambiguous browser failures at two boundaries that precede a whole-video study:

1. A finalized private video can be attached to study evidence even when the committed evidence response is lost.
2. Whole-video study start, pause, resume, recovery, and cancellation commands are read back from canonical server state before the UI reports failure.

The browser does not invent success. It accepts a lost-response command only when the server readback proves the same run advanced monotonically into the state required by that action. Otherwise the original error remains visible and completed checkpoints remain untouched.

## Command rules

- Study start is confirmed only when the exact study and reference asset return a durable run after the failed response.
- Pause requires a newer revision in `paused` state.
- Resume requires a newer revision in `running` or already-completed state.
- Recovery requires a newer revision, no operator-review hold, and fewer blocked work items.
- Cancellation requires a newer revision in `cancelled` state.
- Version conflicts continue to refresh current state and retry only when that action is still allowed.
- Every retry uses a new command idempotency key when its expected revision changes.

This keeps the browser as a control surface. The server remains the only study, lease, checkpoint, and command authority.

## Mounted proof

The focused Chromium journey lets the local/private backend commit the start and pause mutations, then drops each HTTP response. The workspace:

- reads back the exact run;
- shows one truthful recovery notice;
- creates no second start or control mutation;
- preserves the normal whole-video progress surface and controls;
- remains responsive without horizontal overflow.

The companion upload-recovery journey separately proves that a committed evidence attachment is reconciled without a duplicate evidence mutation.

## Honest remaining boundary

This is browser-to-server lost-response reconciliation, not proof of deployed durability. Hosted production remains blocked until the same release candidate proves:

- the v5 pre-plan study persistence and distributed runtime adapter;
- atomic tenant-isolated database transactions and durable idempotency receipts;
- expired-lease, worker-restart, browser-close, and multi-hour recovery;
- real Auth/RLS/private storage and provider/infrastructure cost evidence;
- same-SHA mounted browser/backend acceptance.

No provider, cloud, Supabase, SQL, billing, deployment, public delivery, or production-readiness gate is activated by this change.
