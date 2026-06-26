# RP-INTERNAL-BETA-LOCAL-E2E-CHAIN-SMOKE-1 Source Audit

Decision: `completed_local_internal_beta_e2e_chain_smoke_no_remote_runtime`

Execution: `completed_backend_local_e2e_chain_metadata_composition_no_remote_execution`

Base source: integration after `RP-INTERNAL-BETA-PRIVATE-ARTIFACT-ACCESS-POLICY-LOCAL-RUNTIME-1`.

This packet composes the existing backend-local internal beta runtimes:

- approved snapshot local runtime
- credit reservation local runtime
- job queue local runtime
- private artifact manifest local runtime
- private artifact access policy local runtime
- Remotion private preview/export metadata local runtime
- QA cleanup observability local runtime

PR #577 remains open/draft/blocked and excluded as source-of-truth.

Pre-validation caveat: a local pre-validation smoke probe used `npx tsx` before dependency validation and fetched `tsx` into npm cache because the fresh worktree had no `node_modules`. That probe did not modify the repository, is not accepted validation evidence, and must not be repeated for this packet. Accepted validation evidence must use `npm ci` followed by package scripts.
