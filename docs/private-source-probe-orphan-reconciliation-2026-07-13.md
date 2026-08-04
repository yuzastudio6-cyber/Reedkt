# Private Source-Probe Orphan Reconciliation — 2026-07-13

Status: `bounded_single_process_local_maintenance_not_production_ready`

This boundary recovers private local FFprobe staging attempts left by abnormal process death or a cleanup refusal. It does not reconcile GCS objects, execute providers, mutate Supabase, render media, charge credits, or authorize public delivery.

## Ownership contract

Each source-probe attempt:

- uses a canonical random UUID below a versioned, SHA-256 scope directory;
- acquires its attempt directory with create-only semantics;
- never adopts or overwrites an existing attempt directory;
- records the created directory device/inode identity;
- remains registered as active for the life of the staging handle;
- shares one cleanup promise across concurrent callers; and
- removes only the exact identity originally created by the attempt.

An invalid UUID, repeated collision exhaustion, ancestor symlink, or attempt-identity substitution fails closed. Replacement paths and external symlink destinations are not deleted.

## Reconciliation contract

Inspection is the default and makes no directory. The reconciler traverses only:

```text
upload-probes/private-source-probe-v1/<64-hex-scope>/<canonical-v4-uuid>/
```

It accepts only flat regular-file attempt directories. It refuses malformed scope or attempt names, files where directories are expected, directories where files are expected, symbolic links, special entries, nested content, identity changes, and configured or hard-limit overflow.

An attempt is a stale candidate only when the newest directory/file `mtime`, `ctime`, or `birthtime` is strictly older than the cutoff. The minimum cutoff is 24 hours. Process-local active attempts, cutoff-equal/recent attempts, future-dated attempts, and attempts containing any fresh file are retained.

The delete path performs a complete bounded preflight, then rechecks active state, directory identity, flat content, and newest activity before removal. It serializes overlapping reconciliations for the same resolved root inside one Node process. A multi-candidate run is not a filesystem transaction; a later same-UID race can still fail after an earlier validated removal.

Reports contain aggregate counts and fixed readiness flags only. They contain no local root, relative path, tenant identifier, scope hash, attempt UUID, or filename.

## Operations

Inspect the configured local storage root:

```bash
npm run maintenance:private-source-probe-orphans
```

Use a longer age threshold when needed:

```bash
npm run maintenance:private-source-probe-orphans -- --stale-hours 72
```

Deletion is allowed only after request serving has stopped and the operator has confirmed exclusive ownership of the local storage root:

```bash
npm run maintenance:private-source-probe-orphans -- --delete --confirm-request-serving-stopped --confirm-exclusive-local-storage-root
```

The CLI disables dotenv loading, accepts only non-production `local`/`mock` runtime with `STORAGE_MODE=local`, defaults to inspection, and emits only the sanitized aggregate report or a stable failure reason.

## Evidence

Run:

```bash
npm run typecheck:server
npm run smoke:private-source-probe-staging
npm run smoke:private-source-probe-orphan-reconciliation
npm run smoke:private-local-persistence
```

The focused reconciliation smoke covers missing-root non-creation, minimum age, deletion authority, inspect-only behavior, stale final/empty/temporary attempts, active/recent/future/fresh-file retention, report redaction, unknown-version preservation, malformed-name refusal before deletion, attempt/file symlinks, nested content, entry/delete limits, pre-delete identity replacement, and overlapping local calls.

## Explicit remaining gates

This is not safe evidence for shared or distributed storage. Production promotion still requires:

- a deployed retention/reconciliation schedule with durable audit and alerting;
- cross-process or distributed single-writer coordination;
- a reviewed shared-storage object identity and deletion protocol;
- dirfd/unlinkat-style confinement or an isolated worker sandbox against hostile same-UID pathname races;
- GCS lifecycle and generation-bound orphan reconciliation;
- operational metrics, failure review, backup/retention policy, and representative staging tests.

No SQL, migration, package-lock, remote Supabase, provider, Google Cloud, billing, deployment, or production-render change is part of this slice.
