# owner Pr Stack Order

Status: `accepted`
Accepted: `true`

## Warnings
- AI graphics source-chain ordering is advisory until draft PRs are explicitly resolved by their owner.

## Blockers
- none

## Details
```json
{
  "aiGraphics": {
    "recommendedOrder": [
      491,
      493,
      496,
      498,
      500,
      503,
      506,
      509,
      511,
      515,
      517,
      521,
      524
    ],
    "toolsAcceptedWithWarnings": [
      "d3",
      "echarts",
      "vega-lite",
      "vega",
      "satori",
      "@svgdotjs/svg.js",
      "@viz-js/viz",
      "lottie-web",
      "animejs",
      "three",
      "pixi.js",
      "konva",
      "babylonjs"
    ],
    "state": [
      {
        "number": 491,
        "title": "[worker] AI graphics metadata job payload schema validation execution",
        "state": "OPEN",
        "isDraft": true,
        "mergedAt": null,
        "mergeCommitOid": null,
        "baseRefName": "codex/rp-worker-ai-graphics-metadata-job-payload-schema-validation-approval",
        "headRefName": "codex/rp-worker-ai-graphics-metadata-job-payload-schema-validation-execution",
        "mergeStateStatus": "CLEAN",
        "url": "https://github.com/yuzastudio6-cyber/Reedkt/pull/491"
      },
      {
        "number": 493,
        "title": "[worker] AI graphics metadata job payload schema validation QA review",
        "state": "OPEN",
        "isDraft": true,
        "mergedAt": null,
        "mergeCommitOid": null,
        "baseRefName": "codex/rp-worker-ai-graphics-metadata-job-payload-schema-validation-execution",
        "headRefName": "codex/rp-worker-ai-graphics-metadata-job-payload-schema-validation-qa-review",
        "mergeStateStatus": "CLEAN",
        "url": "https://github.com/yuzastudio6-cyber/Reedkt/pull/493"
      },
      {
        "number": 496,
        "title": "[worker] AI graphics metadata job payload owner approval",
        "state": "OPEN",
        "isDraft": true,
        "mergedAt": null,
        "mergeCommitOid": null,
        "baseRefName": "codex/rp-worker-ai-graphics-metadata-job-payload-schema-validation-qa-review",
        "headRefName": "codex/rp-worker-ai-graphics-metadata-job-payload-owner-approval",
        "mergeStateStatus": "CLEAN",
        "url": "https://github.com/yuzastudio6-cyber/Reedkt/pull/496"
      },
      {
        "number": 498,
        "title": "[worker] AI graphics metadata job payload dry-run approval",
        "state": "OPEN",
        "isDraft": true,
        "mergedAt": null,
        "mergeCommitOid": null,
        "baseRefName": "codex/rp-worker-ai-graphics-metadata-job-payload-owner-approval",
        "headRefName": "codex/rp-worker-ai-graphics-metadata-job-payload-dry-run-approval",
        "mergeStateStatus": "CLEAN",
        "url": "https://github.com/yuzastudio6-cyber/Reedkt/pull/498"
      },
      {
        "number": 500,
        "title": "[worker] AI graphics metadata job payload dry-run execution",
        "state": "OPEN",
        "isDraft": true,
        "mergedAt": null,
        "mergeCommitOid": null,
        "baseRefName": "codex/rp-worker-ai-graphics-metadata-job-payload-dry-run-approval",
        "headRefName": "codex/rp-worker-ai-graphics-metadata-job-payload-dry-run-execution",
        "mergeStateStatus": "CLEAN",
        "url": "https://github.com/yuzastudio6-cyber/Reedkt/pull/500"
      },
      {
        "number": 503,
        "title": "[worker] AI graphics metadata job payload dry-run QA review",
        "state": "OPEN",
        "isDraft": true,
        "mergedAt": null,
        "mergeCommitOid": null,
        "baseRefName": "codex/rp-worker-ai-graphics-metadata-job-payload-dry-run-execution",
        "headRefName": "codex/rp-worker-ai-graphics-metadata-job-payload-dry-run-qa-review",
        "mergeStateStatus": "CLEAN",
        "url": "https://github.com/yuzastudio6-cyber/Reedkt/pull/503"
      },
      {
        "number": 506,
        "title": "[worker] AI graphics metadata job payload owner review after dry-run",
        "state": "OPEN",
        "isDraft": true,
        "mergedAt": null,
        "mergeCommitOid": null,
        "baseRefName": "codex/rp-worker-ai-graphics-metadata-job-payload-dry-run-qa-review",
        "headRefName": "codex/rp-worker-ai-graphics-metadata-job-payload-owner-review-after-dry-run",
        "mergeStateStatus": "CLEAN",
        "url": "https://github.com/yuzastudio6-cyber/Reedkt/pull/506"
      },
      {
        "number": 509,
        "title": "[worker] AI graphics metadata job payload dry-run gate status packet",
        "state": "OPEN",
        "isDraft": true,
        "mergedAt": null,
        "mergeCommitOid": null,
        "baseRefName": "codex/rp-worker-ai-graphics-metadata-job-payload-owner-review-after-dry-run",
        "headRefName": "codex/rp-worker-ai-graphics-metadata-job-payload-dry-run-gate-status-packet",
        "mergeStateStatus": "CLEAN",
        "url": "https://github.com/yuzastudio6-cyber/Reedkt/pull/509"
      },
      {
        "number": 511,
        "title": "[worker] AI graphics metadata job payload dry-run gate status QA review",
        "state": "OPEN",
        "isDraft": true,
        "mergedAt": null,
        "mergeCommitOid": null,
        "baseRefName": "codex/rp-worker-ai-graphics-metadata-job-payload-dry-run-gate-status-packet",
        "headRefName": "codex/rp-worker-ai-graphics-metadata-job-payload-dry-run-gate-status-qa-review",
        "mergeStateStatus": "CLEAN",
        "url": "https://github.com/yuzastudio6-cyber/Reedkt/pull/511"
      },
      {
        "number": 515,
        "title": "[worker] AI graphics metadata job payload dry-run gate status owner approval",
        "state": "OPEN",
        "isDraft": true,
        "mergedAt": null,
        "mergeCommitOid": null,
        "baseRefName": "codex/rp-worker-ai-graphics-metadata-job-payload-dry-run-gate-status-qa-review",
        "headRefName": "codex/rp-worker-ai-graphics-metadata-job-payload-dry-run-gate-status-owner-approval",
        "mergeStateStatus": "CLEAN",
        "url": "https://github.com/yuzastudio6-cyber/Reedkt/pull/515"
      },
      {
        "number": 517,
        "title": "[worker] AI graphics metadata job payload dry-run runtime gate packet",
        "state": "OPEN",
        "isDraft": true,
        "mergedAt": null,
        "mergeCommitOid": null,
        "baseRefName": "codex/rp-worker-ai-graphics-metadata-job-payload-dry-run-gate-status-owner-approval",
        "headRefName": "codex/rp-worker-ai-graphics-metadata-job-payload-dry-run-runtime-gate-packet",
        "mergeStateStatus": "CLEAN",
        "url": "https://github.com/yuzastudio6-cyber/Reedkt/pull/517"
      },
      {
        "number": 521,
        "title": "[worker] AI graphics metadata job payload dry-run runtime gate QA review",
        "state": "OPEN",
        "isDraft": true,
        "mergedAt": null,
        "mergeCommitOid": null,
        "baseRefName": "codex/rp-worker-ai-graphics-metadata-job-payload-dry-run-runtime-gate-packet",
        "headRefName": "codex/rp-worker-ai-graphics-metadata-job-payload-dry-run-runtime-gate-qa-review",
        "mergeStateStatus": "CLEAN",
        "url": "https://github.com/yuzastudio6-cyber/Reedkt/pull/521"
      },
      {
        "number": 524,
        "title": "[worker] AI graphics metadata job payload dry-run runtime gate owner approval",
        "state": "OPEN",
        "isDraft": true,
        "mergedAt": null,
        "mergeCommitOid": null,
        "baseRefName": "codex/rp-worker-ai-graphics-metadata-job-payload-dry-run-runtime-gate-qa-review",
        "headRefName": "codex/rp-worker-ai-graphics-metadata-job-payload-dry-run-runtime-gate-owner-approval",
        "mergeStateStatus": "CLEAN",
        "url": "https://github.com/yuzastudio6-cyber/Reedkt/pull/524"
      }
    ],
    "centralTruth": "accepted_with_warnings for worker metadata dry-run lane only; not runtime proof"
  },
  "sound": {
    "recommendedOrder": [
      495,
      507
    ],
    "state": [
      {
        "number": 495,
        "title": "[sound] OSS final scoped evidence rollup",
        "state": "MERGED",
        "isDraft": false,
        "mergedAt": "2026-06-18T12:05:36Z",
        "mergeCommitOid": "83a45c3532f803bb0f291e16541bdaa2e4fea45b",
        "baseRefName": "codex/rp-model-orchestration-plan-snapshot-dry-run-validation",
        "headRefName": "codex/sound-oss-tools-13-final-scoped-evidence-rollup",
        "mergeStateStatus": "UNKNOWN",
        "url": "https://github.com/yuzastudio6-cyber/Reedkt/pull/495"
      },
      {
        "number": 507,
        "title": "[sound] OSS scoped lane post-archive handoff",
        "state": "MERGED",
        "isDraft": false,
        "mergedAt": "2026-06-18T15:16:45Z",
        "mergeCommitOid": "06532ed131c15ec88a01a6e6b36d3ae2d8e6782e",
        "baseRefName": "codex/rp-model-orchestration-plan-snapshot-dry-run-validation",
        "headRefName": "codex/sound-oss-tools-15-post-archive-handoff-review",
        "mergeStateStatus": "UNKNOWN",
        "url": "https://github.com/yuzastudio6-cyber/Reedkt/pull/507"
      }
    ],
    "centralReconciliationNeed": "record scoped SOUND evidence without claiming real audio/media processing"
  },
  "tracka": {
    "recommendedOrder": [
      497,
      502,
      505,
      510,
      513,
      516,
      520
    ],
    "state": [
      {
        "number": 497,
        "title": "[internal-beta] Track A restricted beta scope decision",
        "state": "MERGED",
        "isDraft": false,
        "mergedAt": "2026-06-18T11:58:46Z",
        "mergeCommitOid": "59f82beb641fd772bfeddc8a244f148c3dbb267a",
        "baseRefName": "codex/rp-model-orchestration-qwen-schema-timeout-target-calibration",
        "headRefName": "codex/rp-internal-beta-tracka-scope-decision-1",
        "mergeStateStatus": "UNKNOWN",
        "url": "https://github.com/yuzastudio6-cyber/Reedkt/pull/497"
      },
      {
        "number": 502,
        "title": "[track-a] Private E2E revalidation planning",
        "state": "MERGED",
        "isDraft": false,
        "mergedAt": "2026-06-18T14:13:03Z",
        "mergeCommitOid": "e23a56d3ff76122ff5dd5edaae59156e422ffe03",
        "baseRefName": "codex/rp-model-orchestration-qwen-schema-timeout-target-calibration",
        "headRefName": "codex/rp-tracka-private-e2e-revalidation-1-planning",
        "mergeStateStatus": "UNKNOWN",
        "url": "https://github.com/yuzastudio6-cyber/Reedkt/pull/502"
      },
      {
        "number": 505,
        "title": "[worker] Track A private E2E execution gate audit",
        "state": "MERGED",
        "isDraft": false,
        "mergedAt": "2026-06-18T15:05:51Z",
        "mergeCommitOid": "7436ffd1de24d9666150aa552464997d3eedaddf",
        "baseRefName": "codex/rp-model-orchestration-qwen-schema-timeout-target-calibration",
        "headRefName": "codex/rp-worker-runtime-tracka-private-e2e-execution-gate-1",
        "mergeStateStatus": "UNKNOWN",
        "url": "https://github.com/yuzastudio6-cyber/Reedkt/pull/505"
      },
      {
        "number": 510,
        "title": "[tool-route] Track A private E2E execution gate audit",
        "state": "MERGED",
        "isDraft": false,
        "mergedAt": "2026-06-18T15:46:07Z",
        "mergeCommitOid": "0c7eab149615b3700a0eea38a2d10c34420fe6da",
        "baseRefName": "codex/rp-model-orchestration-qwen-schema-timeout-target-calibration",
        "headRefName": "codex/rp-tool-route-tracka-private-e2e-execution-gate-1",
        "mergeStateStatus": "UNKNOWN",
        "url": "https://github.com/yuzastudio6-cyber/Reedkt/pull/510"
      },
      {
        "number": 513,
        "title": "[tool-route] Track A private E2E route contract dry-run gate",
        "state": "MERGED",
        "isDraft": false,
        "mergedAt": "2026-06-18T16:36:44Z",
        "mergeCommitOid": "eed130e64b680c30b26a020099f3b51f58e2b339",
        "baseRefName": "codex/rp-model-orchestration-qwen-schema-timeout-target-calibration",
        "headRefName": "codex/rp-tool-route-tracka-private-e2e-execution-gate-2",
        "mergeStateStatus": "UNKNOWN",
        "url": "https://github.com/yuzastudio6-cyber/Reedkt/pull/513"
      },
      {
        "number": 516,
        "title": "[worker] Track A private E2E transactional runtime gate",
        "state": "MERGED",
        "isDraft": false,
        "mergedAt": "2026-06-18T17:24:28Z",
        "mergeCommitOid": "73eb9f808920d7c8acb8c9a7e390b5a0442a0f26",
        "baseRefName": "codex/rp-model-orchestration-qwen-schema-timeout-target-calibration",
        "headRefName": "codex/rp-worker-runtime-tracka-private-e2e-execution-gate-2",
        "mergeStateStatus": "UNKNOWN",
        "url": "https://github.com/yuzastudio6-cyber/Reedkt/pull/516"
      },
      {
        "number": 520,
        "title": "[worker] Transactional worker contract for Track A private E2E",
        "state": "MERGED",
        "isDraft": false,
        "mergedAt": "2026-06-18T18:22:06Z",
        "mergeCommitOid": "2fa54b4de1db19be85400eb6ca3af3374e0d254d",
        "baseRefName": "codex/rp-model-orchestration-qwen-schema-timeout-target-calibration",
        "headRefName": "codex/rp-worker-runtime-transactional-contract-1-tracka-private-e2e",
        "mergeStateStatus": "UNKNOWN",
        "url": "https://github.com/yuzastudio6-cyber/Reedkt/pull/520"
      }
    ],
    "centralReconciliationNeed": "record private E2E gates while runtime, render/export, and beta stay blocked"
  },
  "e2e": {
    "recommendedOrder": [
      519,
      523,
      305
    ],
    "state": [
      {
        "number": 519,
        "title": "[e2e] Open PR merge hygiene ready queue",
        "state": "MERGED",
        "isDraft": false,
        "mergedAt": "2026-06-18T17:42:26Z",
        "mergeCommitOid": "61dc4940340db9508012f74294fd6723accb3d36",
        "baseRefName": "codex/rp-model-orchestration-plan-snapshot-dry-run-validation",
        "headRefName": "codex/reeditpro-e2e-merge-hygiene-1-open-pr-ready-queue",
        "mergeStateStatus": "UNKNOWN",
        "url": "https://github.com/yuzastudio6-cyber/Reedkt/pull/519"
      },
      {
        "number": 523,
        "title": "[e2e] Validation queue batch 1",
        "state": "MERGED",
        "isDraft": false,
        "mergedAt": "2026-06-19T02:04:29Z",
        "mergeCommitOid": "f258967676c4877d3e1627b5710b789cff04b451",
        "baseRefName": "codex/rp-model-orchestration-plan-snapshot-dry-run-validation",
        "headRefName": "codex/reeditpro-e2e-validation-queue-1-run-missing-validations",
        "mergeStateStatus": "UNKNOWN",
        "url": "https://github.com/yuzastudio6-cyber/Reedkt/pull/523"
      },
      {
        "number": 305,
        "title": "[track-a] Group B creative graphics handoff review",
        "state": "OPEN",
        "isDraft": false,
        "mergedAt": null,
        "mergeCommitOid": null,
        "baseRefName": "codex/rp-gd-10-group-b-controlled-local-fixture-execution",
        "headRefName": "codex/rp-tracka-gd-groupb-handoff-0-review",
        "mergeStateStatus": "CLEAN",
        "url": "https://github.com/yuzastudio6-cyber/Reedkt/pull/305"
      }
    ],
    "blocker": "pr_305_validation_blocked_npm_ci_failed",
    "mergeReadyValidations": 0,
    "pr523SourceEvidence": "PR #523 is merged and now serves as source evidence for the unresolved PR #305 hydration blocker."
  }
}
```
