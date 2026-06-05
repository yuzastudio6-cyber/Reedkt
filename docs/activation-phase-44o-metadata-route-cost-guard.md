# Phase 44O Metadata Route Cost Guard

The cost guard uses the committed Phase 44H cost estimator metadata.

DuckDB must remain `metadata_only`, `estimateAllowed=true`, and `free_or_negligible`. Billing APIs, project billing data, Cloud Run jobs, workers, and cloud calls are not used.

Any future route that requires cloud runtime cost, GPU cost, provider cost, broad-media cost, or over-threshold cost must use a separate approval phase.
