# Track All runbook

## Current executable routes

Run deterministic geometry with:

```sh
npm run test:track-all-deterministic-geometry
npm run test:track-all-privacy-redaction
npm run test:track-all-focus-reframe
```

The privacy command runs all four fixed treatments and one attempt through the
confined FFmpeg runtime. Rebuild and verify the forward-only privacy-capable
image with:

```sh
docker/prod/ffmpeg-lgpl-runtime/smoke.sh --build
```

The image remains private-internal and production-blocked.

The focus/reframe command builds the exact private Remotion source tree and
executes actual tracked-magnification and speaker-reframe previews. It also
compiles every supported simple focus treatment and a multi-target reframe.
The outputs are private fixture evidence, not public or production renders.

Run the SAM authority, qualification-gate, and injected lifecycle checks with:

```sh
npm run test:track-all-sam3.1-operation-authority
npm run test:track-all-sam3.1-route-gates
npm run test:track-all-sam3.1-injected-session
```

These commands make no model or GPU request. The injected session command uses
only ephemeral in-memory bytes and explicitly test-only evidence.

## Real SAM route

Do not start a V2 private SAM session unless the content-addressed route-gate
report validates as `internal_execution_qualified`, internal execution is
authorized, and the runtime has an explicitly injected durable private store.
The current report is `blocked`.

Before any real route can be activated, obtain authorized human checkpoint
access and legal approval, ingest and reread exact source/checkpoint bytes,
pass malware/security and strict-load compatibility gates, release an immutable
offline signed image, and collect real private A100 evidence. Collect separate
equivalent L4 evidence or remove L4 from active fallback authority. Re-read the
current account-effective rates and private quality/privacy evidence.

Never use injected masklets as real inference evidence. Never use SAM2,
caller-selected commands, modules, checkpoints, GPUs, paths, URLs, prices, or
automatic retry after an unknown outcome. Reconcile the exact attempt first.
Every terminal path must append `close_session` after terminal observation.

## Failure handling

- Existing session: reconcile its exact plan, attempt, event, and close
  evidence; do not resubmit automatically.
- Unknown GPU result: record `reconciliation_required`; do not retry.
- Failed/cancelled/timed-out work: close the session in `finally`, retain
  create-only private evidence, and emit no accepted graph.
- Missing or under-qualified route evidence: fail closed without a model
  request.
- Missing durable private storage: leave canonical-private runtime
  unconfigured.
