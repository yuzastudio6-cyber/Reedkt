# Edit Reference approval and application response reconciliation

Date: 2026-07-20  
Status: mounted local/private evidence; canonical production transaction remains gated

## Outcome

The canonical Edit Preference workflow now resolves ambiguous browser failures at its two explicit approval boundaries without blindly repeating a mutation:

1. Preference DNA approval uses one deterministic domain idempotency key and reads back the exact Edit Reference when the response is lost.
2. Exact-edit preparation, connection, replacement, and removal read canonical application history before reporting an interrupted mutation as failed.

The browser accepts a committed result only when the readback matches the expected immutable lineage. A nearby record, a different DNA version, a changed target study, or a different receipt is not treated as success.

## Exact readback requirements

Preference DNA approval requires the same:

- DNA version identity and content digest;
- quality-review result;
- approved status and approval snapshot;
- AI-assisted reasoning approval-binding digest when that review exists.

Preference application preparation or replacement requires the same:

- workspace-owned Edit Reference and approved DNA identity/digest;
- exact project and named-edit identity;
- application source and replacement lineage;
- target-context snapshot;
- whole-video target-study package identity/digest;
- source storage/media identities and Edit Brief digest.

Connection additionally requires the same staged target-session receipt and connected downstream context. Removal additionally requires the same downstream invalidation receipt, completed invalidation state, and cleared application history.

## Mounted proof

The focused Chromium journey deliberately lets the local/private server commit and then loses the HTTP response for:

- Preference DNA approval;
- exact-edit application preparation;
- exact-edit application connection;
- exact-edit replacement preparation and connection;
- exact-edit application removal.

The mounted `/preferences` and exact named-edit `?view=preferences` surfaces read back the committed authority, show the approved/applied/removed state, and issue exactly one mutation for each operation. The flow also preserves reduced-motion behavior, mobile containment, approved DNA history, and the existing single **Apply to this edit** action.

## Honest remaining boundary

This proves browser-to-local/private-server response reconciliation. It does not turn the current multi-step compatibility flow into the future atomic production authority. Hosted production still requires the already-defined one exact-edit apply transaction and V3 application lifecycle to be mounted through live, tenant-isolated repository/RPC adapters, then proven with Auth/RLS, durable idempotency receipts, restart recovery, and same-SHA browser/backend acceptance.

No provider, cloud, Supabase, SQL, billing, deployment, public delivery, or production-readiness gate is activated by this change.
