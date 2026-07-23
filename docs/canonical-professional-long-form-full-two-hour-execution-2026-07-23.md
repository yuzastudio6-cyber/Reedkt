# Canonical Professional Long-Form Full Two-Hour Execution — 2026-07-23

Status: `full_local_private_graph_verified_production_false`

## Outcome

`npm run smoke:canonical-professional-long-form-post-approval:full-two-hour`
completed the exact `routine_two_hour` 4K graph end to end under the canonical
private package, queue, lease, one-use execution, artifact, QA, reconciliation,
and internal-cost authorities.

This is the destructive engineering lane. The ordinary representative command
remains available for faster break/fix feedback, while
`qa:canonical-private-pipeline -- --full` selects this complete lane.

## Exact Receipt

- smoke schema: `canonical-professional-long-form-post-approval-smoke-v10`;
- checks: 120/120;
- duration authority: 7,200 seconds / 216,000 frames at 30 fps;
- source ranges: 200 across eight immutable source assets;
- object chunks: 60;
- canonical child jobs: 127/127 complete, zero remaining;
- total delivery attempts: 128, comprising 127 successful terminal attempts
  plus one retained expired-attempt failure and cost;
- adjacent color boundaries: 59/59;
- cross-chunk color digest:
  `bf18a03f4e6029d0ca36df6dbe71cffd7068201048527244d0d5ae7037b40b47`;
- private master byte length: 393,016,049;
- private master SHA-256:
  `29307761055ab1270705208a3f34da861a3649314904f0d1ebf2c2a5994dedc8`;
- independent private-master QA digest:
  `9b0b802f93a5d08fc5f52fa10eecf7f192e3ca50248939376c325b0333b0b75a`;
- final exact replay: no duplicate job, artifact, attempt, lease, or cost.

## Break/Fix Findings

### Approved reservation lifetime

The first complete attempt reached chunk 46 before the synthetic approved
reservation expired. The reservation had incorrectly reused the estimate's
preapproval `validUntil` timestamp. Quote validity answers how long a user may
wait before approval; it is not a safe execution deadline for an already
approved asynchronous graph.

Approval now creates a separate, bounded 24-hour internal-test execution hold.
The source makes no production credit-renewal claim. Live wallet, ledger,
renewal, settlement, and billing policy remain gated.

### Integrity failure recovery

The second attempt reached all 60 chunk pairs and then deliberately corrupted a
middle private artifact. The original test expected same-authority retry, but
the canonical recovery policy correctly classifies checksum divergence as a
non-retryable validation failure requiring user review or new approval.

The final proof copies the completed pre-color graph into an isolated state
fork, tampers only that fork, verifies fail-closed validation and no retry, then
continues the untouched genuine graph through color, master assembly, and QA.

## What This Proves

- every two-hour child is selected by server-owned graph order;
- each render and QA uses the approved snapshot/package/job/lease lineage;
- failed-attempt internal cost is retained;
- completed-proposal recovery does not rerender or create a second cost;
- private byte tampering cannot be relabeled as retryable infrastructure
  failure;
- all chunk QA and color dependencies finish before final master assembly;
- the final master is independently reopened and verified; and
- restart replay is exact after the whole graph is terminal.

## Closed Gates

This evidence is local/private and non-promotable. It authorizes no provider or
Secret Manager access, remote Supabase mutation, Google Cloud worker, live
object-storage claim, customer credit settlement, billing, deployment, public
delivery, external beta, or production readiness. The six-hour/255-job release
ceiling remains retained evidence and was not rerun.
