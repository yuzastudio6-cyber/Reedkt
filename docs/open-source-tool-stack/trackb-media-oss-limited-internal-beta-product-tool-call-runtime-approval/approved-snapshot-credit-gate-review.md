# Approved Snapshot And Credit Gate Review

The existing Track B callable worker contract requires `approvedSnapshotId`, `editPlanId`, `idempotencyKey`, and `creditReservationId`.

Those gates are sufficient for the next controlled product tool-call runtime dry-run execution phase to attempt a no-user-media-by-default product-path dry run. This phase does not reserve, spend, release, or refund credits, and it does not dispatch a worker.
