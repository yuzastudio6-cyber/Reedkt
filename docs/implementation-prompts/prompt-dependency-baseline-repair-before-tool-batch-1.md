# Dependency Baseline Repair Before Tool Batch 1

Repair the dependency baseline before any Open-Source Tool Stack Batch 1 install/proof execution packet.

Required starting point:

- Source branch: `codex/rp-github-merge-hygiene-open-pr-stack-audit`.
- Prior decision: `blocked_pending_package_lock_sync_review`.
- Blocking command: `npm ci --dry-run --ignore-scripts --no-audit --no-fund`.

The repair phase may inspect package metadata and propose the smallest lockfile synchronization needed to resolve:

- missing @emnapi/runtime@1.11.1
- missing @emnapi/core@1.11.1
- invalid @emnapi/wasi-threads@1.2.1 not satisfying 1.2.2
- missing @emnapi/core@1.10.0
- missing @emnapi/runtime@1.10.0
- missing @emnapi/wasi-threads@1.2.1

Do not install or execute open-source tools as part of this repair unless a later prompt explicitly authorizes it. Keep tool, route, worker, provider, media, Supabase, GCS, public artifact, signed URL, raw prompt, beta, and production scopes blocked.
