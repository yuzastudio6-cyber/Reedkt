# Route And Runtime Boundary

## Route

The only accepted route for a future confirmed runtime execution attempt is:

```text
/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/execute
```

This packet does not invoke that route. The route remains future-confirmed only.

## Worker

The only accepted worker source boundary for the future attempt is:

```text
server/workers/gstreamer-mkvtoolnix-narrow-source-execution-worker-not-registered.ts
```

The future attempt must prove the worker is invoked only through the approved external-agent runtime path, not from raw chat, frontend code, broad service-role handlers, arbitrary route calls, or ad hoc shell commands.

## Service Role

- Service-role secret payload access: `forbidden_in_this_packet`.
- Frontend service-role exposure: `forbidden`.
- Broad service-role handler: `forbidden`.
- Supabase mutation in this packet: `false`.
- SQL execution in this packet: `false`.

The next confirmed runtime attempt must either prove it does not need service-role payload access from this session, or it must name an explicitly approved secret source, redaction policy, target ref, and rollback behavior before any remote action occurs.

## Input Fixture

Allowed input fixture scope: `controlled_generated_fixture_only`.

Blocked inputs:

- Arbitrary private media.
- User media.
- Public URLs.
- Signed URLs as source-of-truth.
- GCS/private artifact access unless separately approved.
- Broad media folders.
- Final render/export inputs.

## Idempotency

Future idempotency must be derived from:

- #2181 merge SHA `5621ee3cfb7146ee0ba13617b5c8d24f9ebf80d2`.
- Future runtime run ID.
- Route path.
- Persisted job id `job-persisted-gstreamer-mkvtoolnix-generated-fixture-runtime-source-gate-1`.
- Fixture scope `controlled_generated_fixture_only`.

## Rollback And Cleanup

Rollback must prove that partial runtime attempts do not create public artifacts, leave broad worker state, unlock beta/production, or create final exports. Cleanup must remove only generated local evidence under `/tmp` and any future transient generated fixture outputs that the confirmed packet explicitly creates.
