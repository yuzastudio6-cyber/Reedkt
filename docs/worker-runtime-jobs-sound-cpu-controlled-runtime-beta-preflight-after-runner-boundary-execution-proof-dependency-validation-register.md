# WORKER_RUNTIME_JOBS SOUND CPU Controlled Runtime Beta Preflight After Runner Boundary Execution Proof Dependency Validation Register

```json worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-runner-boundary-execution-proof-dependency-validation-register
{
  "label": "worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-runner-boundary-execution-proof-dependency-validation-register",
  "decision": "worker_runtime_jobs_sound_cpu_controlled_runtime_beta_preflight_after_runner_boundary_execution_proof_passed_with_warnings_ready_for_runtime_beta_preflight_owner_review_after_runner_boundary_execution_proof",
  "validationMode": "dependency_backed_static_only",
  "packageLockHash": "bbc17b3cb96f642deb5316c680074b1c7e76fd8410bf30ea7db516f10db5ebe3",
  "commands": [
    {
      "command": "npm ci --no-audit --no-fund",
      "status": "passed",
      "scope": "dependency hydration only"
    },
    {
      "command": "npm run worker-runtime-jobs:sound-cpu-controlled-runtime-beta-preflight-after-runner-boundary-execution-proof:diagnostics",
      "status": "passed",
      "scope": "new packet diagnostics"
    },
    {
      "command": "npm run worker-runtime-jobs:sound-cpu-runtime-beta-readiness-reconciliation-after-runner-boundary-execution-proof:diagnostics",
      "status": "passed",
      "scope": "source reconciliation diagnostics"
    },
    {
      "command": "npm run worker-runtime-jobs:sound-cpu-limited-internal-runner-boundary-execution-completion-decision-after-image-import-proof:diagnostics",
      "status": "passed",
      "scope": "runner-boundary completion source diagnostics"
    },
    {
      "command": "npm run worker-runtime-jobs:sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-owner-review-after-image-import-proof:diagnostics",
      "status": "passed",
      "scope": "runner-boundary proof owner review diagnostics"
    },
    {
      "command": "npm run worker-runtime-jobs:sound-cpu-controlled-beta-tool-call-preflight-after-image-import-proof:diagnostics",
      "status": "passed",
      "scope": "existing tool-call preflight diagnostics reused"
    },
    {
      "command": "npm run cross-chat-tool-ownership:diagnostics",
      "status": "passed",
      "scope": "duplicate ownership guard"
    },
    {
      "command": "npm run prod:readiness:summary",
      "status": "passed_with_blocked_readiness",
      "summary": "overall blocked; hard blockers remain"
    },
    {
      "command": "npm run prod:beta:summary",
      "status": "passed_with_external_beta_blocked",
      "summary": "internal testing ready; external beta, real user media beta, paid production remain false"
    },
    {
      "command": "npm run lint",
      "status": "passed"
    },
    {
      "command": "npm run typecheck:server",
      "status": "passed"
    },
    {
      "command": "npx tsc -b",
      "status": "passed"
    },
    {
      "command": "npm run build",
      "status": "passed_with_existing_warnings"
    },
    {
      "command": "npm run build:server",
      "status": "passed"
    },
    {
      "command": "git diff --check",
      "status": "passed"
    },
    {
      "command": "git diff --cached --check",
      "status": "passed"
    }
  ],
  "artifactPolicy": {
    "nodeModulesStaged": false,
    "distStaged": false,
    "distServerStaged": false,
    "sidecarsStaged": false
  }
}
```
