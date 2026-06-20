# REEDITPRO-E2E-MERGE-HYGIENE-4: Merge Queue 2 Validated PRs, No Execution

Use this prompt after PR #539 is merged. Queue 2 has two dependency-backed merge-hygiene candidates: PR #245 and PR #263. PR #264 and PR #300 remain blocked and must not be included.

```json reeditpro-e2e-merge-hygiene-4-merge-queue-2-validated-prs
{
  "prompt": "REEDITPRO-E2E-MERGE-HYGIENE-4: merge queue 2 validated PRs, no execution",
  "sourcePrerequisite": "REEDITPRO-E2E-VALIDATION-QUEUE-2-HYDRATION-FIX",
  "currentPrerequisiteDecision": "reeditpro_e2e_validation_queue_2_hydration_fix_passed_with_warnings_ready_for_merge_hygiene_4",
  "currentMergeReadyCount": 2,
  "readyNow": true,
  "mergeReadyPrs": [
    {
      "prNumber": 245,
      "headRefOid": "bce1c0283b41ea5e3ca653617e1bafb7176ad563",
      "requiredFinalRequery": true
    },
    {
      "prNumber": 263,
      "headRefOid": "163a90669d87bc605f1e72e4e1903a9526f9778c",
      "requiredFinalRequery": true
    }
  ],
  "dependencySafeMergeOrder": [245, 263],
  "excludedFromMergeHygiene4": [
    {"prNumber": 264, "reason": "git_diff_check_whitespace"},
    {"prNumber": 300, "reason": "environment_owner_blocked_dependency_hydration_enospc"},
    {"prNumber": 305, "reason": "environment_owner_blocked_native_optional_hydration"}
  ],
  "requiredBeforeUse": [
    "Re-query PR #245 and PR #263 immediately before any mutation.",
    "Require open, non-draft or review-accepted, clean/mergeable, exact head SHA, expected file scope, and no blocking comments/reviews/checks.",
    "Do not rerun runtime, media, Supabase, provider, worker, route, artifact, billing, beta, or production paths.",
    "Do not merge PR #264, PR #300, or PR #305 through this prompt."
  ],
  "runtimeGates": {
    "supabaseMutationAllowed": false,
    "sqlExecutionAllowed": false,
    "providerCallAllowed": false,
    "modelCallAllowed": false,
    "workerExecutionAllowed": false,
    "routeExecutionAllowed": false,
    "toolExecutionAllowed": false,
    "mediaProcessingAllowed": false,
    "ffmpegOrFfprobeAllowed": false,
    "dockerOrCloudRunAllowed": false,
    "signedUrlCreationAllowed": false,
    "publicArtifactCreationAllowed": false,
    "internalBetaUnlockAllowed": false,
    "externalBetaUnlockAllowed": false,
    "productionUnlockAllowed": false,
    "finalRenderExportAllowed": false
  },
  "noScopeStatement": "No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled."
}
```
