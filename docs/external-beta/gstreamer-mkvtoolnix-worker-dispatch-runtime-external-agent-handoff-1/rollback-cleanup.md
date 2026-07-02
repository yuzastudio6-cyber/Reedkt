# Rollback And Cleanup Requirements

Rollback plan ID: `rollback-remote-claim-lease-already-verified-no-persistent-dispatch-residue`

Cleanup plan ID: `cleanup-tmp-evidence-only-no-persistent-public-artifacts`

## Rollback Requirements

A future external-agent dry run must fail closed if any requested action would:

- mutate Supabase;
- execute SQL;
- mutate a worker lease;
- write a persistent job queue record;
- start a worker process;
- broaden worker registration;
- use arbitrary media;
- create signed/public artifacts;
- unlock final render/export;
- unlock production.

## Cleanup Requirements

Evidence may be written only under `/tmp/reeditpro-rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-dry-run-1/<runId>/` in a later dry-run packet. Those files are evidence only and must not be committed.
