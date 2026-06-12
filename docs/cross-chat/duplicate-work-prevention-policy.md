# Duplicate Work Prevention Policy

Status: `docs_only`.

## Mandatory Checks

- Every prompt must check `docs/cross-chat/chat-ownership-registry.md` before implementation.
- Every prompt must search for existing routes, services, schemas, docs, diagnostics, workstream records, and package scripts before creating new ones.
- No route, service, schema, table, worker, provider adapter, tool contract, UI integration, or status ledger may be duplicated without an audit note.
- No chat may change another workstream's owned contract without a handoff record or coordination prompt.
- Every new capability must declare its owner, affected workstreams, integration point, blocked scopes, and source-of-truth path.
- Conflicts create a coordination prompt; they do not get resolved by silent implementation.

## Blocked Duplicate Patterns

- Reimplementing a partially existing tool or provider route without reading source-of-truth docs.
- Creating a second schema/table path for the same concept without Supabase owner approval.
- Moving ownership of MapLibre/Turf/deck.gl/CesiumJS into AI Tools.
- Moving Sharp/libvips general capability into AI Tools.
- Treating Track A render/export validation as an AI Tools capability.
- Treating frontend mock behavior as production backend readiness.
