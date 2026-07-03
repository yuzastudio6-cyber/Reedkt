# Media Render Blocked Scope QA

```json
{
  "schema": "reeditpro.openSourceToolStack.trackaDockerBuildProbeQa.mediaRenderBlockedScope.v1",
  "generatedAt": "2026-06-18T17:20:38.139Z",
  "status": "accepted",
  "accepted": true,
  "details": {
    "decisionChecks": [
      {
        "field": "localHostProbingRun",
        "passed": true
      },
      {
        "field": "mediaInputUsed",
        "passed": true
      },
      {
        "field": "mediaProcessingRun",
        "passed": true
      },
      {
        "field": "renderExportRun",
        "passed": true
      },
      {
        "field": "dockerImagePushRun",
        "passed": true
      },
      {
        "field": "publicArtifactsCreated",
        "passed": true
      },
      {
        "field": "signedUrlsCreated",
        "passed": true
      },
      {
        "field": "rawPromptsRun",
        "passed": true
      }
    ],
    "sideEffectChecks": [
      {
        "field": "localHostProbingRun",
        "passed": true
      },
      {
        "field": "mediaInputUsed",
        "passed": true
      },
      {
        "field": "mediaProbeRun",
        "passed": true
      },
      {
        "field": "mediaDecodeEncodeRun",
        "passed": true
      },
      {
        "field": "captionBurnInRun",
        "passed": true
      },
      {
        "field": "renderExportRun",
        "passed": true
      },
      {
        "field": "outputMediaCreated",
        "passed": true
      },
      {
        "field": "npmInstallRun",
        "passed": true
      },
      {
        "field": "npmRebuildRun",
        "passed": true
      },
      {
        "field": "duckdbProofRerun",
        "passed": true
      },
      {
        "field": "polarsProofRerun",
        "passed": true
      },
      {
        "field": "workerExecutionRun",
        "passed": true
      },
      {
        "field": "routeExecutionRun",
        "passed": true
      },
      {
        "field": "providerModelCallsRun",
        "passed": true
      },
      {
        "field": "supabaseWritesRun",
        "passed": true
      },
      {
        "field": "sqlRun",
        "passed": true
      },
      {
        "field": "gcsUploadRun",
        "passed": true
      },
      {
        "field": "publicArtifactsCreated",
        "passed": true
      },
      {
        "field": "signedUrlsCreated",
        "passed": true
      },
      {
        "field": "betaProductionUnlocked",
        "passed": true
      },
      {
        "field": "rawPromptsRun",
        "passed": true
      },
      {
        "field": "prMergesRun",
        "passed": true
      },
      {
        "field": "secretsPrinted",
        "passed": true
      }
    ],
    "mediaProcessingAccepted": false,
    "captionBurnInAccepted": false,
    "renderExportAccepted": false,
    "workerRuntimeAccepted": false,
    "routeRuntimeAccepted": false,
    "providerRuntimeAccepted": false,
    "supabaseGcsPublicDeliveryAccepted": false
  },
  "warnings": [
    "media_processing_render_export_and_production_scope_remain_blocked"
  ],
  "blockers": [],
  "followUp": "OPEN_SOURCE_TOOL_STACK_BATCH1_FINAL_ROLLUP_AFTER_FFMPEG_FFPROBE_PROOF",
  "supabaseClassification": {
    "updateRequired": "no write",
    "updateStatus": "not_applicable",
    "environmentTouched": "none",
    "sqlExecuted": "none",
    "migrationDeployed": "no"
  }
}
```
