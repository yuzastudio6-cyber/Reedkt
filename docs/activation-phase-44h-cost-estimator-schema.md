# Phase 44H Cost Estimator Schema

The Phase 44H schema is `track-b-cost-estimator-v1`.

Inputs include tool, route, capability, runtime class, execution class, duration, CPU, memory, GPU, artifact/storage/image/build/request/egress quantities.

Outputs include compute, storage, Artifact Registry, build, network, and total USD estimates, plus confidence, cost risk, capacity risk, warnings, blockers, and `noExecutionPerformed=true`.

The schema only supports `synthetic_scenario`, `route_planning_metadata`, and `authoritative_billing_never` estimate modes.
