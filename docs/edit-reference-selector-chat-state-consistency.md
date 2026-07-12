# Selector And Chat State Consistency

Status: `passed_backend_local`

New Edit and Edit Chat use the same application repository, service, API client, target-adaptation code, stage/connect/activate receipts, and invalidation path.

## Canonical Record

Every new record includes the exact reference and approved DNA identity, target project/session snapshot, `setup_selector | chat_tag | session_panel` origin, adaptation decisions, do-not-copy rules, warnings, QA identity, timestamps, monotonic version, and immutable replacement/removal links. `updatedAt` changes only on lifecycle mutation. Pre-Gate-8.1 records without the origin field retain their historical digest shape and hydrate safely.

## State Transitions

```text
setup_selector v1 connected
→ chat compare (no mutation)
→ explicit replace confirmation
→ v1 invalidated/replaced + chat_tag v2 connected
→ explicit remove confirmation
→ v2 invalidated/cleared
```

Replacement and removal clear active Project Edit Session context before the backend mutation is finalized. Prior records, context hashes, usage events, audit events, and bidirectional links remain immutable history. The latest active application—not stale panel state—wins recovery after a chat mutation.

Project Edit Session, Edit Brief, Marker Context, Marker Chat, Plan Hints, and QA consume the same bounded downstream context. Changing the application remounts/refetches the preference surface. Removing it clears the active context and prevents stale hints/QA from returning. Backend-local application history reconstructs the empty target shell after reload without reactivating cleared guidance.

Behavior proof:

- closure smoke checks exact sources, versions, links, readback, ambiguity, idempotency, compare, replace, and remove;
- focused Playwright checks New Edit → Brief/Marker/Plan/QA → reload → chat compare/replace/remove → reload/history;
- existing downstream and lifecycle smokes continue to pass.
