# REEDITPRO-E2E-BLOCKER-UNLOCK-0 Cross-Workstream Audit

Decision: `reeditpro_e2e_blocker_audit_completed_with_warnings_ready_for_merge_queue`

This docs/diagnostics-only audit starts from merged PR #507 and records the remaining cross-workstream blockers for internal/private E2E, internal beta, external beta, paid production, and production readiness. The SOUND-OSS-TOOLS scoped metadata/synthetic-fixture lane is complete with warnings; no SOUND-OSS-TOOLS-16 implementation prompt is created.

```json reeditpro-e2e-blocker-unlock-0-cross-workstream-audit
{
  "decision": "reeditpro_e2e_blocker_audit_completed_with_warnings_ready_for_merge_queue",
  "generatedAt": "2026-06-18T16:06:55.980Z",
  "sourceBranch": "codex/rp-model-orchestration-plan-snapshot-dry-run-validation",
  "sourceHead": "06532ed131c15ec88a01a6e6b36d3ae2d8e6782e",
  "sourceEvidence": {
    "pr507": {
      "state": "MERGED",
      "mergeCommit": "06532ed131c15ec88a01a6e6b36d3ae2d8e6782e",
      "decision": "sound_oss_tools_15_post_archive_handoff_review_passed_scoped_lane_complete_with_warnings"
    },
    "pr508": {
      "number": 508,
      "title": "[tools] Open-source tool stack Track A build-context generation execution",
      "state": "MERGED",
      "draft": false,
      "mergeable": "UNKNOWN",
      "mergeStateStatus": "UNKNOWN",
      "baseBranch": "codex/rp-github-merge-hygiene-open-pr-stack-audit",
      "headBranch": "codex/rp-open-source-tool-stack-tracka-build-context-generation-execution",
      "headSha": "0133ef8a21f62d8074cab329da3f261105301ff8",
      "mergeCommit": "9225347e636a50aa0ef241badbf51f9a3947b1f8",
      "mergedAt": "2026-06-18T15:43:34Z",
      "ownerWorkstream": "classified_in_open_register_if_open",
      "decision": "build_context_generation_execution_passed_ready_for_docker_build_probe_execution",
      "nextPrompt": "not_recorded_in_pr_body",
      "note": "Already merged before this audit; treat as Track A source evidence.",
      "url": "https://github.com/yuzastudio6-cyber/Reedkt/pull/508"
    },
    "pr510": {
      "number": 510,
      "title": "[tool-route] Track A private E2E execution gate audit",
      "state": "MERGED",
      "draft": false,
      "mergeable": "UNKNOWN",
      "mergeStateStatus": "UNKNOWN",
      "baseBranch": "codex/rp-model-orchestration-qwen-schema-timeout-target-calibration",
      "headBranch": "codex/rp-tool-route-tracka-private-e2e-execution-gate-1",
      "headSha": "edb0eacd4a575e59bc28fb1fc250effdb64a5c06",
      "mergeCommit": "0c7eab149615b3700a0eea38a2d10c34420fe6da",
      "mergedAt": "2026-06-18T15:46:07Z",
      "ownerWorkstream": "classified_in_open_register_if_open",
      "decision": "completed_repo_audit_gate_planning",
      "nextPrompt": "not_recorded_in_pr_body",
      "note": "Merged during audit window; treat as source evidence, not current open blocker.",
      "url": "https://github.com/yuzastudio6-cyber/Reedkt/pull/510"
    }
  },
  "soundScopedLane": {
    "status": "complete_with_warnings",
    "scopedStatus": "sound_oss_tools_synthetic_fixture_validation_passed_with_warnings",
    "humanWording": "SOUND OSS scoped synthetic fixture validation passed with warnings",
    "noFurtherSoundOssToolsPromptRequired": true,
    "futureSoundRuntimeMediaRequiresNewPromptFamily": true,
    "soundOssTools16PromptExists": false
  },
  "openPrAudit": {
    "openPrCount": 375,
    "initialCollectedOpenListCount": 375,
    "ownerCounts": {
      "AI_TOOLS_CREATIVE_GRAPHICS": 27,
      "BILLING_STRIPE_CREDITS": 1,
      "COMPLIANCE_SECURITY": 1,
      "FRONTEND_PRODUCT_UX": 6,
      "OBSERVABILITY_AUDIT_COST": 9,
      "PRODUCT_BETA_READINESS": 105,
      "PROVIDER_GATEWAY_MODELS": 26,
      "PUBLIC_ARTIFACT_DELIVERY_POLICY": 3,
      "SOUND_MUSIC_AUDIO": 49,
      "SUPABASE_RLS_STORAGE_DATABASE": 59,
      "TOOL_ROUTE_EXECUTION": 18,
      "TRACK_A_RENDER_EXPORT": 26,
      "TRACK_B_MEDIA_PROCESSING": 16,
      "WORKER_RUNTIME_JOBS": 29
    },
    "dirtyOrConflictingCount": 7,
    "readyNonDraftCount": 294,
    "criticalPrs": [
      {
        "number": 510,
        "title": "[tool-route] Track A private E2E execution gate audit",
        "state": "MERGED",
        "draft": false,
        "mergeable": "UNKNOWN",
        "mergeStateStatus": "UNKNOWN",
        "baseBranch": "codex/rp-model-orchestration-qwen-schema-timeout-target-calibration",
        "headBranch": "codex/rp-tool-route-tracka-private-e2e-execution-gate-1",
        "headSha": "edb0eacd4a575e59bc28fb1fc250effdb64a5c06",
        "mergeCommit": "0c7eab149615b3700a0eea38a2d10c34420fe6da",
        "mergedAt": "2026-06-18T15:46:07Z",
        "ownerWorkstream": "classified_in_open_register_if_open",
        "decision": "completed_repo_audit_gate_planning",
        "nextPrompt": "not_recorded_in_pr_body",
        "note": "Merged during audit window; treat as source evidence, not current open blocker.",
        "url": "https://github.com/yuzastudio6-cyber/Reedkt/pull/510"
      },
      {
        "number": 509,
        "title": "[worker] AI graphics metadata job payload dry-run gate status packet",
        "state": "OPEN",
        "draft": true,
        "mergeable": "MERGEABLE",
        "mergeStateStatus": "CLEAN",
        "baseBranch": "codex/rp-worker-ai-graphics-metadata-job-payload-owner-review-after-dry-run",
        "headBranch": "codex/rp-worker-ai-graphics-metadata-job-payload-dry-run-gate-status-packet",
        "headSha": "06acd79d71f2bebb4648dfe6c5bb55d66a27bbb5",
        "mergeCommit": null,
        "mergedAt": null,
        "ownerWorkstream": "classified_in_open_register_if_open",
        "decision": "not_recorded_in_pr_body",
        "nextPrompt": "not_recorded_in_pr_body",
        "url": "https://github.com/yuzastudio6-cyber/Reedkt/pull/509"
      },
      {
        "number": 508,
        "title": "[tools] Open-source tool stack Track A build-context generation execution",
        "state": "MERGED",
        "draft": false,
        "mergeable": "UNKNOWN",
        "mergeStateStatus": "UNKNOWN",
        "baseBranch": "codex/rp-github-merge-hygiene-open-pr-stack-audit",
        "headBranch": "codex/rp-open-source-tool-stack-tracka-build-context-generation-execution",
        "headSha": "0133ef8a21f62d8074cab329da3f261105301ff8",
        "mergeCommit": "9225347e636a50aa0ef241badbf51f9a3947b1f8",
        "mergedAt": "2026-06-18T15:43:34Z",
        "ownerWorkstream": "classified_in_open_register_if_open",
        "decision": "build_context_generation_execution_passed_ready_for_docker_build_probe_execution",
        "nextPrompt": "not_recorded_in_pr_body",
        "note": "Already merged before this audit; treat as Track A source evidence.",
        "url": "https://github.com/yuzastudio6-cyber/Reedkt/pull/508"
      },
      {
        "number": 506,
        "title": "[worker] AI graphics metadata job payload owner review after dry-run",
        "state": "OPEN",
        "draft": true,
        "mergeable": "MERGEABLE",
        "mergeStateStatus": "CLEAN",
        "baseBranch": "codex/rp-worker-ai-graphics-metadata-job-payload-dry-run-qa-review",
        "headBranch": "codex/rp-worker-ai-graphics-metadata-job-payload-owner-review-after-dry-run",
        "headSha": "915ac654e612eec120e7397373478c84aea42b9f",
        "mergeCommit": null,
        "mergedAt": null,
        "ownerWorkstream": "classified_in_open_register_if_open",
        "decision": "not_recorded_in_pr_body",
        "nextPrompt": "not_recorded_in_pr_body",
        "url": "https://github.com/yuzastudio6-cyber/Reedkt/pull/506"
      },
      {
        "number": 503,
        "title": "[worker] AI graphics metadata job payload dry-run QA review",
        "state": "OPEN",
        "draft": true,
        "mergeable": "MERGEABLE",
        "mergeStateStatus": "CLEAN",
        "baseBranch": "codex/rp-worker-ai-graphics-metadata-job-payload-dry-run-execution",
        "headBranch": "codex/rp-worker-ai-graphics-metadata-job-payload-dry-run-qa-review",
        "headSha": "d189f8be0634eaff62baacb8e18c842f997fa3dd",
        "mergeCommit": null,
        "mergedAt": null,
        "ownerWorkstream": "classified_in_open_register_if_open",
        "decision": "not_recorded_in_pr_body",
        "nextPrompt": "not_recorded_in_pr_body",
        "url": "https://github.com/yuzastudio6-cyber/Reedkt/pull/503"
      },
      {
        "number": 500,
        "title": "[worker] AI graphics metadata job payload dry-run execution",
        "state": "OPEN",
        "draft": true,
        "mergeable": "MERGEABLE",
        "mergeStateStatus": "CLEAN",
        "baseBranch": "codex/rp-worker-ai-graphics-metadata-job-payload-dry-run-approval",
        "headBranch": "codex/rp-worker-ai-graphics-metadata-job-payload-dry-run-execution",
        "headSha": "3e4a4f6900a26c22972d8e0859f1f8c3391063c1",
        "mergeCommit": null,
        "mergedAt": null,
        "ownerWorkstream": "classified_in_open_register_if_open",
        "decision": "not_recorded_in_pr_body",
        "nextPrompt": "not_recorded_in_pr_body",
        "url": "https://github.com/yuzastudio6-cyber/Reedkt/pull/500"
      },
      {
        "number": 498,
        "title": "[worker] AI graphics metadata job payload dry-run approval",
        "state": "OPEN",
        "draft": true,
        "mergeable": "MERGEABLE",
        "mergeStateStatus": "CLEAN",
        "baseBranch": "codex/rp-worker-ai-graphics-metadata-job-payload-owner-approval",
        "headBranch": "codex/rp-worker-ai-graphics-metadata-job-payload-dry-run-approval",
        "headSha": "23017a7f35a088de2fc77fd0c1427378fd7aa373",
        "mergeCommit": null,
        "mergedAt": null,
        "ownerWorkstream": "classified_in_open_register_if_open",
        "decision": "worker_ai_graphics_metadata_job_payload_dry_run_approved_with_warnings",
        "nextPrompt": "not_recorded_in_pr_body",
        "url": "https://github.com/yuzastudio6-cyber/Reedkt/pull/498"
      },
      {
        "number": 496,
        "title": "[worker] AI graphics metadata job payload owner approval",
        "state": "OPEN",
        "draft": true,
        "mergeable": "MERGEABLE",
        "mergeStateStatus": "CLEAN",
        "baseBranch": "codex/rp-worker-ai-graphics-metadata-job-payload-schema-validation-qa-review",
        "headBranch": "codex/rp-worker-ai-graphics-metadata-job-payload-owner-approval",
        "headSha": "ce204a63fc08412af212609eecf0c8201ae88794",
        "mergeCommit": null,
        "mergedAt": null,
        "ownerWorkstream": "classified_in_open_register_if_open",
        "decision": "not_recorded_in_pr_body",
        "nextPrompt": "not_recorded_in_pr_body",
        "url": "https://github.com/yuzastudio6-cyber/Reedkt/pull/496"
      },
      {
        "number": 493,
        "title": "[worker] AI graphics metadata job payload schema validation QA review",
        "state": "OPEN",
        "draft": true,
        "mergeable": "MERGEABLE",
        "mergeStateStatus": "CLEAN",
        "baseBranch": "codex/rp-worker-ai-graphics-metadata-job-payload-schema-validation-execution",
        "headBranch": "codex/rp-worker-ai-graphics-metadata-job-payload-schema-validation-qa-review",
        "headSha": "58f4e7839057d8c9e54d52c81f0e791e40e2574c",
        "mergeCommit": null,
        "mergedAt": null,
        "ownerWorkstream": "classified_in_open_register_if_open",
        "decision": "not_recorded_in_pr_body",
        "nextPrompt": "not_recorded_in_pr_body",
        "url": "https://github.com/yuzastudio6-cyber/Reedkt/pull/493"
      },
      {
        "number": 491,
        "title": "[worker] AI graphics metadata job payload schema validation execution",
        "state": "OPEN",
        "draft": true,
        "mergeable": "MERGEABLE",
        "mergeStateStatus": "CLEAN",
        "baseBranch": "codex/rp-worker-ai-graphics-metadata-job-payload-schema-validation-approval",
        "headBranch": "codex/rp-worker-ai-graphics-metadata-job-payload-schema-validation-execution",
        "headSha": "1bd6ed2a4d276066d0ca134ce674358e18f64b7a",
        "mergeCommit": null,
        "mergedAt": null,
        "ownerWorkstream": "classified_in_open_register_if_open",
        "decision": "not_recorded_in_pr_body",
        "nextPrompt": "not_recorded_in_pr_body",
        "url": "https://github.com/yuzastudio6-cyber/Reedkt/pull/491"
      },
      {
        "number": 487,
        "title": "[worker] AI graphics metadata job payload schema validation approval",
        "state": "OPEN",
        "draft": true,
        "mergeable": "MERGEABLE",
        "mergeStateStatus": "CLEAN",
        "baseBranch": "codex/rp-worker-ai-graphics-metadata-job-payload-shape-qa-review",
        "headBranch": "codex/rp-worker-ai-graphics-metadata-job-payload-schema-validation-approval",
        "headSha": "0dbb1b3617af9d33bd066cdef2ad385376c383a6",
        "mergeCommit": null,
        "mergedAt": null,
        "ownerWorkstream": "classified_in_open_register_if_open",
        "decision": "worker_ai_graphics_metadata_job_payload_schema_validation_approved_with_warnings",
        "nextPrompt": "not_recorded_in_pr_body",
        "url": "https://github.com/yuzastudio6-cyber/Reedkt/pull/487"
      },
      {
        "number": 485,
        "title": "[worker] AI graphics metadata job payload shape QA review",
        "state": "OPEN",
        "draft": true,
        "mergeable": "MERGEABLE",
        "mergeStateStatus": "CLEAN",
        "baseBranch": "codex/rp-worker-ai-graphics-metadata-job-payload-shape-approval",
        "headBranch": "codex/rp-worker-ai-graphics-metadata-job-payload-shape-qa-review",
        "headSha": "34c57b9a4ea68f7dbd26fd9671a8d183c6fc8da0",
        "mergeCommit": null,
        "mergedAt": null,
        "ownerWorkstream": "classified_in_open_register_if_open",
        "decision": "worker_ai_graphics_metadata_job_payload_shape_qa_passed_with_warnings",
        "nextPrompt": "not_recorded_in_pr_body",
        "url": "https://github.com/yuzastudio6-cyber/Reedkt/pull/485"
      },
      {
        "number": 482,
        "title": "[worker] AI graphics metadata job payload shape approval",
        "state": "OPEN",
        "draft": true,
        "mergeable": "MERGEABLE",
        "mergeStateStatus": "CLEAN",
        "baseBranch": "codex/rp-worker-ai-graphics-metadata-handoff-qa-review",
        "headBranch": "codex/rp-worker-ai-graphics-metadata-job-payload-shape-approval",
        "headSha": "15615ae99f0968b84cb63b615ce4243771fda45d",
        "mergeCommit": null,
        "mergedAt": null,
        "ownerWorkstream": "classified_in_open_register_if_open",
        "decision": "worker_ai_graphics_metadata_job_payload_shape_approved_with_warnings",
        "nextPrompt": "not_recorded_in_pr_body",
        "url": "https://github.com/yuzastudio6-cyber/Reedkt/pull/482"
      },
      {
        "number": 330,
        "title": "[model] Qwen schema timeout target calibration",
        "state": "OPEN",
        "draft": false,
        "mergeable": "CONFLICTING",
        "mergeStateStatus": "DIRTY",
        "baseBranch": "codex/rp-model-orchestration-qwen-dashscope-auth-repair",
        "headBranch": "codex/rp-model-orchestration-qwen-schema-timeout-target-calibration",
        "headSha": "0c7eab149615b3700a0eea38a2d10c34420fe6da",
        "mergeCommit": null,
        "mergedAt": null,
        "ownerWorkstream": "classified_in_open_register_if_open",
        "decision": "not_recorded_in_pr_body",
        "nextPrompt": "not_recorded_in_pr_body",
        "url": "https://github.com/yuzastudio6-cyber/Reedkt/pull/330"
      },
      {
        "number": 350,
        "title": "[coordination] GitHub merge hygiene open PR stack audit",
        "state": "OPEN",
        "draft": false,
        "mergeable": "MERGEABLE",
        "mergeStateStatus": "CLEAN",
        "baseBranch": "codex/rp-activation-52h-cross-workstream-handoff-tracking",
        "headBranch": "codex/rp-github-merge-hygiene-open-pr-stack-audit",
        "headSha": "9225347e636a50aa0ef241badbf51f9a3947b1f8",
        "mergeCommit": null,
        "mergedAt": null,
        "ownerWorkstream": "classified_in_open_register_if_open",
        "decision": "not_recorded_in_pr_body",
        "nextPrompt": "not_recorded_in_pr_body",
        "url": "https://github.com/yuzastudio6-cyber/Reedkt/pull/350"
      },
      {
        "number": 366,
        "title": "[tool-route] TOOL-ROUTE-EXECUTION-UNLOCK-0 repo audit",
        "state": "OPEN",
        "draft": true,
        "mergeable": "CONFLICTING",
        "mergeStateStatus": "DIRTY",
        "baseBranch": "codex/rp-model-orchestration-plan-snapshot-dry-run-validation",
        "headBranch": "codex/rp-tool-route-execution-unlock-0-repo-audit",
        "headSha": "d8747433383487abe48572c34101675a93507ed8",
        "mergeCommit": null,
        "mergedAt": null,
        "ownerWorkstream": "classified_in_open_register_if_open",
        "decision": "not_recorded_in_pr_body",
        "nextPrompt": "TOOL-ROUTE-1 - Tool Route Dry-Run Fixture Plan / Contract Tests",
        "url": "https://github.com/yuzastudio6-cyber/Reedkt/pull/366"
      },
      {
        "number": 315,
        "title": "[supabase] Restore activation milestone registry availability in staging",
        "state": "OPEN",
        "draft": false,
        "mergeable": "MERGEABLE",
        "mergeStateStatus": "CLEAN",
        "baseBranch": "codex/rp-foundation-supabase-staging-schema-deploy-after-target-reference",
        "headBranch": "codex/rp-supabase-registry-1-activation-milestone-registry-staging-restoration",
        "headSha": "28f3eae667bb3db7a2f7a0499e1b42ddc64a22b4",
        "mergeCommit": null,
        "mergedAt": null,
        "ownerWorkstream": "classified_in_open_register_if_open",
        "decision": "not_recorded_in_pr_body",
        "nextPrompt": "not_recorded_in_pr_body",
        "url": "https://github.com/yuzastudio6-cyber/Reedkt/pull/315"
      },
      {
        "number": 307,
        "title": "[provider] DeepSeek Qwen API approval policy",
        "state": "OPEN",
        "draft": false,
        "mergeable": "MERGEABLE",
        "mergeStateStatus": "CLEAN",
        "baseBranch": "codex/rp-provider-0-provider-gateway-models-repo-audit",
        "headBranch": "codex/rp-provider-1-deepseek-qwen-api-approval-policy",
        "headSha": "75106a9bab048b64538bd8e132cb33fee1acd1fe",
        "mergeCommit": null,
        "mergedAt": null,
        "ownerWorkstream": "classified_in_open_register_if_open",
        "decision": "not_recorded_in_pr_body",
        "nextPrompt": "not_recorded_in_pr_body",
        "url": "https://github.com/yuzastudio6-cyber/Reedkt/pull/307"
      },
      {
        "number": 297,
        "title": "[beta] CROSS-BETA-0 cross-workstream internal beta gate review",
        "state": "OPEN",
        "draft": false,
        "mergeable": "MERGEABLE",
        "mergeStateStatus": "CLEAN",
        "baseBranch": "codex/rp-tracka-gd-handoff-7-controlled-private-sample-qa-internal-beta-readiness",
        "headBranch": "codex/rp-cross-beta-0-cross-workstream-internal-beta-gate-review",
        "headSha": "f06172a50924e630f0e909914d45d5e6c7a41396",
        "mergeCommit": null,
        "mergedAt": null,
        "ownerWorkstream": "classified_in_open_register_if_open",
        "decision": "not_recorded_in_pr_body",
        "nextPrompt": "not_recorded_in_pr_body",
        "url": "https://github.com/yuzastudio6-cyber/Reedkt/pull/297"
      }
    ]
  },
  "completedLanes": [
    "SOUND_MUSIC_AUDIO scoped metadata/synthetic-fixture lane complete with warnings after PR #507",
    "Track A build-context generation execution evidence merged in PR #508",
    "Tool Route Track A private E2E execution gate audit merged in PR #510 during audit window"
  ],
  "blockedWorkstreams": [
    {
      "owner": "SOUND_MUSIC_AUDIO",
      "blockers": [
        "future runtime/media work requires new prompt family"
      ]
    },
    {
      "owner": "TOOL_ROUTE_EXECUTION",
      "blockers": [
        "#366 conflict",
        "route execution remains blocked",
        "contract/dry-run gates not globally merged"
      ]
    },
    {
      "owner": "WORKER_RUNTIME_JOBS",
      "blockers": [
        "worker execution blocked",
        "job claim/lease mutation blocked",
        "payload gates need merge/validation order"
      ]
    },
    {
      "owner": "TRACK_A_RENDER_EXPORT",
      "blockers": [
        "Docker/Cloud Run blocked",
        "FFmpeg/ffprobe probing blocked",
        "Remotion render/export blocked"
      ]
    },
    {
      "owner": "TRACK_B_MEDIA_PROCESSING",
      "blockers": [
        "real media processing blocked",
        "browser/WebGL/canvas runtime blocked",
        "sidecar/artifact policy gates"
      ]
    },
    {
      "owner": "AI_TOOLS_CREATIVE_GRAPHICS",
      "blockers": [
        "tool execution blocked",
        "route manifest stack not merged",
        "duplicate stack risk"
      ]
    },
    {
      "owner": "PROVIDER_GATEWAY_MODELS",
      "blockers": [
        "provider/model runtime calls blocked",
        "#330 conflict",
        "Qwen/DeepSeek secret/provider dry-run gates unresolved"
      ]
    },
    {
      "owner": "SUPABASE_RLS_STORAGE_DATABASE",
      "blockers": [
        "Supabase writes blocked",
        "SQL/migrations blocked",
        "RLS/storage owner validation required"
      ]
    },
    {
      "owner": "OBSERVABILITY_AUDIT_COST",
      "blockers": [
        "#350 comments",
        "large open stack needs ordering"
      ]
    },
    {
      "owner": "BILLING_STRIPE_CREDITS",
      "blockers": [
        "credits/Stripe blocked",
        "billing owner approval required"
      ]
    },
    {
      "owner": "PUBLIC_ARTIFACT_DELIVERY_POLICY",
      "blockers": [
        "signed URLs blocked",
        "public artifacts blocked",
        "storage writes blocked"
      ]
    },
    {
      "owner": "COMPLIANCE_SECURITY",
      "blockers": [
        "license/security gates",
        "service-role boundary review"
      ]
    },
    {
      "owner": "FRONTEND_PRODUCT_UX",
      "blockers": [
        "runtime/backend gates precede beta unlock",
        "approval UX must remain no-execution"
      ]
    },
    {
      "owner": "PRODUCT_BETA_READINESS",
      "blockers": [
        "internal beta blocked",
        "external beta blocked",
        "paid production blocked",
        "production blocked"
      ]
    }
  ],
  "mergeOrderRisks": [
    {
      "number": 366,
      "title": "[tool-route] TOOL-ROUTE-EXECUTION-UNLOCK-0 repo audit",
      "owner": "TOOL_ROUTE_EXECUTION",
      "mergeable": "CONFLICTING",
      "mergeStateStatus": "DIRTY",
      "baseRefName": "codex/rp-model-orchestration-plan-snapshot-dry-run-validation",
      "headRefName": "codex/rp-tool-route-execution-unlock-0-repo-audit"
    },
    {
      "number": 333,
      "title": "[model] MODEL-DRYRUN-2 calibrated Qwen DeepSeek synthetic provider dry run",
      "owner": "PROVIDER_GATEWAY_MODELS",
      "mergeable": "CONFLICTING",
      "mergeStateStatus": "DIRTY",
      "baseRefName": "codex/rp-model-orchestration-qwen-schema-timeout-target-calibration",
      "headRefName": "codex/rp-model-dryrun-2-calibrated-qwen-deepseek-synthetic-provider-dry-run"
    },
    {
      "number": 330,
      "title": "[model] Qwen schema timeout target calibration",
      "owner": "PROVIDER_GATEWAY_MODELS",
      "mergeable": "CONFLICTING",
      "mergeStateStatus": "DIRTY",
      "baseRefName": "codex/rp-model-orchestration-qwen-dashscope-auth-repair",
      "headRefName": "codex/rp-model-orchestration-qwen-schema-timeout-target-calibration"
    },
    {
      "number": 324,
      "title": "[model] Qwen DeepSeek synthetic provider dry run",
      "owner": "PROVIDER_GATEWAY_MODELS",
      "mergeable": "CONFLICTING",
      "mergeStateStatus": "DIRTY",
      "baseRefName": "codex/rp-model-orchestration-qwen-deepseek-dry-run-approval",
      "headRefName": "codex/rp-model-orchestration-qwen-deepseek-synthetic-provider-dry-run"
    },
    {
      "number": 323,
      "title": "[model] Qwen DeepSeek provider dry-run fix",
      "owner": "PROVIDER_GATEWAY_MODELS",
      "mergeable": "CONFLICTING",
      "mergeStateStatus": "DIRTY",
      "baseRefName": "codex/rp-model-orchestration-qwen-deepseek-provider-dry-run",
      "headRefName": "codex/rp-model-orchestration-qwen-deepseek-provider-dry-run-fix"
    },
    {
      "number": 207,
      "title": "[foundation] Prompt 26D RLS no-policy table classification contract",
      "owner": "SUPABASE_RLS_STORAGE_DATABASE",
      "mergeable": "CONFLICTING",
      "mergeStateStatus": "DIRTY",
      "baseRefName": "codex/rp-foundation-26c-supabase-advisor-draft-remediation-packet",
      "headRefName": "codex/rp-foundation-26d-rls-no-policy-table-classification-contract"
    },
    {
      "number": 1,
      "title": "[codex] Publish ReeditPro planning and backend readiness stack",
      "owner": "PRODUCT_BETA_READINESS",
      "mergeable": "CONFLICTING",
      "mergeStateStatus": "DIRTY",
      "baseRefName": "codex/reeditpro-web-ui-shell",
      "headRefName": "codex/reeditpro-planning-stack"
    }
  ],
  "duplicateRisks": [
    {
      "owner": "AI_TOOLS_CREATIVE_GRAPHICS",
      "openPrCount": 27,
      "risk": "high_same_owner_stack"
    },
    {
      "owner": "PRODUCT_BETA_READINESS",
      "openPrCount": 105,
      "risk": "high_same_owner_stack"
    },
    {
      "owner": "PROVIDER_GATEWAY_MODELS",
      "openPrCount": 26,
      "risk": "high_same_owner_stack"
    },
    {
      "owner": "SOUND_MUSIC_AUDIO",
      "openPrCount": 49,
      "risk": "high_same_owner_stack"
    },
    {
      "owner": "SUPABASE_RLS_STORAGE_DATABASE",
      "openPrCount": 59,
      "risk": "high_same_owner_stack"
    },
    {
      "owner": "TOOL_ROUTE_EXECUTION",
      "openPrCount": 18,
      "risk": "high_same_owner_stack"
    },
    {
      "owner": "TRACK_A_RENDER_EXPORT",
      "openPrCount": 26,
      "risk": "high_same_owner_stack"
    },
    {
      "owner": "TRACK_B_MEDIA_PROCESSING",
      "openPrCount": 16,
      "risk": "high_same_owner_stack"
    },
    {
      "owner": "WORKER_RUNTIME_JOBS",
      "openPrCount": 29,
      "risk": "high_same_owner_stack"
    }
  ],
  "blockersPreventingInternalPrivateE2E": [
    "worker execution",
    "tool route execution",
    "job claim/lease mutation",
    "private E2E execution gate"
  ],
  "blockersPreventingInternalBeta": [
    "private E2E evidence missing",
    "runtime gates blocked",
    "owner workstream approvals missing"
  ],
  "blockersPreventingExternalBeta": [
    "external beta blocked",
    "real user media blocked",
    "artifact/signed URL policy blocked",
    "security/compliance incomplete"
  ],
  "blockersPreventingPaidProduction": [
    "paid production blocked",
    "credits/Stripe blocked",
    "production readiness hard blockers"
  ],
  "recommendedNextActions": [
    "Run REEDITPRO-E2E-MERGE-HYGIENE-1 to process open PRs in dependency-safe order.",
    "Run REEDITPRO-E2E-BLOCKER-UNLOCK-1 to convert blocker map into owner-specific gate plans.",
    "Do not start runtime/media/Supabase/provider/worker execution until owner gates and merge hygiene are complete."
  ],
  "forbiddenStatuses": {
    "generated_local_fixture_passed": "blocked_unclaimed",
    "dry_run_passed": "blocked_unclaimed",
    "runtime_ready": "blocked_unclaimed",
    "production_ready": "blocked_unclaimed",
    "beta_ready": "blocked_unclaimed",
    "media_processing_ready": "blocked_unclaimed",
    "supabase_readiness": "blocked_unclaimed",
    "artifact_readiness": "blocked_unclaimed",
    "provider_readiness": "blocked_unclaimed",
    "worker_readiness": "blocked_unclaimed",
    "route_readiness": "blocked_unclaimed"
  },
  "runtimeGates": {
    "workerExecutionAllowed": false,
    "routeExecutionAllowed": false,
    "toolExecutionAllowed": false,
    "mediaProcessingAllowed": false,
    "ffmpegProbeAllowed": false,
    "dockerCloudRunAllowed": false,
    "providerModelCallsAllowed": false,
    "supabaseMutationAllowed": false,
    "sqlExecutionAllowed": false,
    "storageWritesAllowed": false,
    "signedUrlsAllowed": false,
    "publicArtifactsAllowed": false,
    "creditsStripeAllowed": false,
    "internalBetaUnlocked": false,
    "externalBetaUnlocked": false,
    "paidProductionUnlocked": false,
    "productionUnlocked": false
  },
  "noScope": "No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled."
}
```
