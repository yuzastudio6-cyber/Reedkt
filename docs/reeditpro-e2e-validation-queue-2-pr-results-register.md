# REEDITPRO-E2E-VALIDATION-QUEUE-2 PR Results Register

This register records the live-inspected queue-2 candidates selected from PR #523's continuation path.

```json reeditpro-e2e-validation-queue-2-pr-results-register
{
  "decision": "reeditpro_e2e_validation_queue_2_blocked_dependency_hydration_failures",
  "sourcePr": 523,
  "excludedPrs": [
    {
      "prNumber": 305,
      "bucket": "environment_owner_blocked_native_optional_hydration",
      "reason": "Do not retry PR #305 hydration in queue 2."
    }
  ],
  "selectedPrs": [300, 264, 263, 245],
  "records": [
    {
      "prNumber": 245,
      "title": "[ai-tools] GD-6 creative graphics execution approval gate",
      "url": "https://github.com/yuzastudio6-cyber/Reedkt/pull/245",
      "state": "OPEN",
      "draft": false,
      "mergeable": "MERGEABLE",
      "mergeStateStatus": "CLEAN",
      "headRefName": "codex/rp-gd-6-ai-tools-creative-graphics-execution-approval-gate",
      "headRefOid": "bce1c0283b41ea5e3ca653617e1bafb7176ad563",
      "baseRefName": "codex/rp-gd-5-ai-tools-creative-graphics-controlled-fixture-execution-plan",
      "baseRefOid": "dd9da65835cc79bd7ab79f5601402e25d3c1751d",
      "changedFiles": 31,
      "comments": 0,
      "reviews": 0,
      "statusChecks": [{"name": "foundation-validation", "conclusion": "SUCCESS"}],
      "fileScope": {
        "packageJsonChanged": true,
        "packageLockChanged": false,
        "workflowChanged": true,
        "diagnosticsChanged": true,
        "docsStatusChanged": true,
        "runtimeProviderWorkerRouteChanged": false,
        "supabaseSqlChanged": false,
        "mediaArtifactChanged": false
      },
      "worktree": "/Volumes/backup/codex-worktrees/reeditpro-e2e-validation-queue-2-pr-245",
      "validationCommands": [
        "npm ci",
        "npm run foundation:validate",
        "npm run lint",
        "npm run typecheck:server",
        "npx tsc -b",
        "npm run prod:readiness:summary",
        "npm run prod:beta:summary",
        "npm run build",
        "npm run build:server",
        "git diff --check",
        "git diff --cached --check"
      ],
      "commandsRun": [
        {"command": "node --version", "result": "passed", "output": "v26.3.0"},
        {"command": "npm --version", "result": "passed", "output": "11.16.0"},
        {"command": "npm ci", "result": "blocked", "blockerCategory": "dependency_hydration_no_completion", "exitCode": 143},
        {"command": "npm ci", "result": "blocked", "blockerCategory": "dependency_hydration_no_completion", "exitCode": 137, "runContext": "second_clean_attempt"},
        {"command": "git diff --check", "result": "passed"},
        {"command": "git diff --cached --check", "result": "passed"},
        {"command": "changed-file secret scan", "result": "passed"}
      ],
      "packageLockStatus": "unchanged",
      "packageJsonStatus": "unchanged",
      "nodeModulesStatus": "removed_after_interrupted_hydration",
      "safetyScanResult": "passed_no_secret_shaped_markers",
      "decision": "validation_failed",
      "blockerCategory": "dependency_hydration_no_completion",
      "mergeReadinessRecommendation": "not_ready_dependency_hydration_blocked"
    },
    {
      "prNumber": 263,
      "title": "[track-a] Creative graphics handoff review",
      "url": "https://github.com/yuzastudio6-cyber/Reedkt/pull/263",
      "state": "OPEN",
      "draft": false,
      "mergeable": "MERGEABLE",
      "mergeStateStatus": "CLEAN",
      "headRefName": "codex/rp-tracka-gd-handoff-0-creative-graphics-review",
      "headRefOid": "163a90669d87bc605f1e72e4e1903a9526f9778c",
      "baseRefName": "codex/rp-gd-7-retry-ai-tools-creative-graphics-controlled-local-fixture-execution",
      "baseRefOid": "3c0ab2383108c2b3bde904a58285cb7cfa69a067",
      "changedFiles": 30,
      "comments": 0,
      "reviews": 0,
      "statusChecks": [{"name": "foundation-validation", "conclusion": "SUCCESS"}],
      "fileScope": {
        "packageJsonChanged": true,
        "packageLockChanged": false,
        "workflowChanged": true,
        "diagnosticsChanged": true,
        "docsStatusChanged": true,
        "runtimeProviderWorkerRouteChanged": false,
        "supabaseSqlChanged": false,
        "mediaArtifactChanged": false
      },
      "worktree": "/Volumes/backup/codex-worktrees/reeditpro-e2e-validation-queue-2-pr-263",
      "validationCommands": [
        "npm ci",
        "npm run foundation:validate",
        "npm run tracka:creative-graphics:handoff:diagnostics",
        "npm run lint",
        "npm run typecheck:server",
        "npx tsc -b",
        "npm run prod:readiness:summary",
        "npm run prod:beta:summary",
        "npm run build",
        "npm run build:server",
        "git diff --check",
        "git diff --cached --check"
      ],
      "commandsRun": [
        {"command": "node --version", "result": "passed", "output": "v26.3.0"},
        {"command": "npm --version", "result": "passed", "output": "11.16.0"},
        {"command": "npm ci", "result": "blocked", "blockerCategory": "dependency_hydration_no_completion", "exitCode": 137},
        {"command": "git diff --check", "result": "passed"},
        {"command": "git diff --cached --check", "result": "passed"},
        {"command": "changed-file secret scan", "result": "passed"}
      ],
      "packageLockStatus": "unchanged",
      "packageJsonStatus": "unchanged",
      "nodeModulesStatus": "removed_after_interrupted_hydration",
      "safetyScanResult": "passed_no_secret_shaped_markers",
      "decision": "validation_failed",
      "blockerCategory": "dependency_hydration_no_completion",
      "mergeReadinessRecommendation": "not_ready_dependency_hydration_blocked"
    },
    {
      "prNumber": 264,
      "title": "[track-a] Private preview composition plan for creative graphics fixtures",
      "url": "https://github.com/yuzastudio6-cyber/Reedkt/pull/264",
      "state": "OPEN",
      "draft": false,
      "mergeable": "MERGEABLE",
      "mergeStateStatus": "CLEAN",
      "headRefName": "codex/rp-tracka-gd-handoff-1-private-preview-composition-plan",
      "headRefOid": "905977ce42172dbd3b196dec68009535c812087b",
      "baseRefName": "codex/rp-tracka-gd-handoff-0-creative-graphics-review",
      "baseRefOid": "163a90669d87bc605f1e72e4e1903a9526f9778c",
      "changedFiles": 33,
      "comments": 0,
      "reviews": 0,
      "statusChecks": [{"name": "foundation-validation", "conclusion": "SUCCESS"}],
      "fileScope": {
        "packageJsonChanged": true,
        "packageLockChanged": false,
        "workflowChanged": true,
        "diagnosticsChanged": true,
        "docsStatusChanged": true,
        "runtimeProviderWorkerRouteChanged": false,
        "supabaseSqlChanged": false,
        "mediaArtifactChanged": false
      },
      "worktree": "/Volumes/backup/codex-worktrees/reeditpro-e2e-validation-queue-2-pr-264",
      "validationCommands": [
        "npm ci",
        "npm run foundation:validate",
        "npm run tracka:creative-graphics:private-preview-plan:diagnostics",
        "npm run tracka:creative-graphics:handoff:diagnostics",
        "npm run lint",
        "npm run typecheck:server",
        "npx tsc -b",
        "npm run prod:readiness:summary",
        "npm run prod:beta:summary",
        "npm run build",
        "npm run build:server",
        "git diff --check",
        "git diff --cached --check"
      ],
      "commandsRun": [
        {"command": "node --version", "result": "passed", "output": "v26.3.0"},
        {"command": "npm --version", "result": "passed", "output": "11.16.0"},
        {"command": "npm ci", "result": "blocked", "blockerCategory": "dependency_hydration_no_completion", "exitCode": 137},
        {
          "command": "git diff --check",
          "result": "failed",
          "blockerCategory": "git_diff_check_whitespace",
          "details": [
            "docs/track-a/creative-graphics-accepted-fixture-layout-timing-plan.md:44: new blank line at EOF.",
            "docs/track-a/creative-graphics-handoff-2-allowed-blocked-scope.md:58: new blank line at EOF.",
            "docs/track-a/creative-graphics-private-preview-composition-plan.md:74: new blank line at EOF.",
            "docs/track-a/creative-graphics-private-preview-execution-gate-packet.md:51: new blank line at EOF.",
            "docs/track-a/creative-graphics-private-preview-manifest-template.md:85: new blank line at EOF.",
            "docs/track-a/creative-graphics-private-preview-missing-metadata-remediation-plan.md:47: new blank line at EOF.",
            "docs/track-a/creative-graphics-private-preview-qa-checklist.md:51: new blank line at EOF.",
            "scripts/validation/tracka-creative-graphics-private-preview-plan-diagnostics.mjs:208: new blank line at EOF."
          ]
        },
        {"command": "git diff --cached --check", "result": "passed"},
        {"command": "changed-file secret scan", "result": "passed"}
      ],
      "packageLockStatus": "unchanged",
      "packageJsonStatus": "unchanged",
      "nodeModulesStatus": "removed_after_interrupted_hydration",
      "safetyScanResult": "passed_no_secret_shaped_markers",
      "decision": "validation_failed",
      "blockerCategory": "dependency_hydration_no_completion_and_git_diff_check_whitespace",
      "mergeReadinessRecommendation": "not_ready_dependency_hydration_and_whitespace_blocked"
    },
    {
      "prNumber": 300,
      "title": "[ai-tools] GD-9 Group B package runtime review and fixture gate",
      "url": "https://github.com/yuzastudio6-cyber/Reedkt/pull/300",
      "state": "OPEN",
      "draft": false,
      "mergeable": "MERGEABLE",
      "mergeStateStatus": "CLEAN",
      "headRefName": "codex/rp-gd-9-group-b-package-runtime-review-fixture-gate",
      "headRefOid": "3a3f02e2dcb02a51c205711416f266ff0bdcf34e",
      "baseRefName": "codex/rp-cross-beta-0-cross-workstream-internal-beta-gate-review",
      "baseRefOid": "f06172a50924e630f0e909914d45d5e6c7a41396",
      "changedFiles": 29,
      "comments": 0,
      "reviews": 0,
      "statusChecks": [{"name": "foundation-validation", "conclusion": "SUCCESS"}],
      "fileScope": {
        "packageJsonChanged": true,
        "packageLockChanged": false,
        "workflowChanged": true,
        "diagnosticsChanged": true,
        "docsStatusChanged": true,
        "runtimeProviderWorkerRouteChanged": false,
        "supabaseSqlChanged": false,
        "mediaArtifactChanged": false
      },
      "worktree": "/Volumes/backup/codex-worktrees/reeditpro-e2e-validation-queue-2-pr-300",
      "validationCommands": [
        "npm ci",
        "npm run foundation:validate",
        "npm run ai-tools:creative-graphics:group-b-runtime-gate:diagnostics",
        "npm run ai-tools:creative-graphics:package-runtime:diagnostics",
        "npm run ai-tools:creative-graphics:gd7-retry-local-execution:diagnostics",
        "npm run cross-beta:internal-gate:diagnostics",
        "npm run internal-beta:cross-workstream-gate:diagnostics",
        "npm run lint",
        "npm run typecheck:server",
        "npx tsc -b",
        "npm run prod:readiness:summary",
        "npm run prod:beta:summary",
        "npm run build",
        "npm run build:server",
        "git diff --check",
        "git diff --cached --check"
      ],
      "commandsRun": [
        {"command": "node --version", "result": "passed", "output": "v26.3.0"},
        {"command": "npm --version", "result": "passed", "output": "11.16.0"},
        {"command": "npm ci", "result": "blocked", "blockerCategory": "dependency_hydration_no_completion", "exitCode": 137},
        {
          "command": "git diff --check",
          "result": "failed",
          "blockerCategory": "git_diff_check_whitespace",
          "details": [
            "docs/ai-tools/creative-graphics-group-b-fixture-gate.md:37: new blank line at EOF.",
            "docs/ai-tools/creative-graphics-group-b-gd10-allowed-scope.md:53: new blank line at EOF.",
            "docs/ai-tools/creative-graphics-group-b-gd10-blocked-scope.md:49: new blank line at EOF.",
            "docs/ai-tools/creative-graphics-group-b-qa-evidence-requirements.md:31: new blank line at EOF.",
            "docs/ai-tools/creative-graphics-group-b-warning-blocker-register.md:25: new blank line at EOF."
          ]
        },
        {"command": "git diff --cached --check", "result": "passed"},
        {"command": "changed-file secret scan", "result": "passed"}
      ],
      "packageLockStatus": "unchanged",
      "packageJsonStatus": "unchanged",
      "nodeModulesStatus": "removed_after_interrupted_hydration",
      "safetyScanResult": "passed_no_secret_shaped_markers",
      "decision": "validation_failed",
      "blockerCategory": "dependency_hydration_no_completion_and_git_diff_check_whitespace",
      "mergeReadinessRecommendation": "not_ready_dependency_hydration_and_whitespace_blocked"
    }
  ],
  "mergeReadyAfterValidationCount": 0,
  "packageLockStatus": "unchanged_for_all_attempted_candidates",
  "supabaseNoOpClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextSupabaseAction": "none"
  }
}
```
