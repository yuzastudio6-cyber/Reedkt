# AI Video B-roll Generation Controlled Model Weight Download Rollback Report

Decision: `ai_video_broll_gen_6_controlled_model_weight_download_completed_ready_for_model_loader_import_proof`

Rollback has two parts: remove the tracked AI-VIDEO-BROLL-GEN-6 evidence files and, if a future owner chooses to reclaim disk, remove the outside-repo private cache path. Because this milestone adds docs/diagnostics only and keeps model files outside the repository, rollback does not require package-lock regeneration, npm dependency removal, Supabase rollback, SQL rollback, storage cleanup, runtime job cleanup, provider cleanup, or public artifact cleanup.

```json ai-video-broll-gen-6-controlled-weight-download-rollback-report
{
  "phase": "AI-VIDEO-BROLL-GEN-6",
  "decision": "ai_video_broll_gen_6_controlled_model_weight_download_completed_ready_for_model_loader_import_proof",
  "rollbackScope": "remove_ai_video_broll_gen_6_docs_prompt_diagnostic_package_script_and_optional_private_cache",
  "rollbackFiles": [
    "docs/ai-video-broll-generation-controlled-model-weight-download-result.md",
    "docs/ai-video-broll-generation-controlled-model-weight-download-manifest.md",
    "docs/ai-video-broll-generation-controlled-model-weight-download-change-log.md",
    "docs/ai-video-broll-generation-controlled-model-weight-download-rollback-report.md",
    "docs/implementation-prompts/prompt-ai-video-broll-gen-7-model-loader-import-proof.md",
    "scripts/validation/ai-video-broll-gen-6-diagnostics.mjs"
  ],
  "rollbackPackageJsonChange": "remove script ai-video-broll-gen-6:diagnostics",
  "privateCacheRollback": {
    "path": "/Volumes/backup/reeditpro-model-cache/ai-video-broll/Wan-AI__Wan2.1-T2V-1.3B/37ec512624d61f7aa208f7ea8140a131f93afc9a",
    "requiredForRepositoryCleanliness": false,
    "safeCleanupCommandDescription": "remove only the recorded Wan 1.3B revision cache directory after confirming no later Gate 7 proof depends on it",
    "containsCommittedFiles": false,
    "containsGeneratedVideo": false,
    "containsPublicArtifacts": false
  },
  "packageLockRollbackRequired": false,
  "runtimeRollbackRequired": false,
  "supabaseRollbackRequired": false,
  "sqlRollbackRequired": false,
  "artifactRollbackRequired": false,
  "generatedVideoRollbackRequired": false,
  "blockedRuntimeGatesAfterRollback": [
    "model_import",
    "model_inference",
    "generated_video",
    "route_execution",
    "worker_execution",
    "provider_model_calls",
    "media_processing",
    "supabase_mutation",
    "sql",
    "signed_urls",
    "public_artifacts",
    "beta_production"
  ],
  "nextPrompt": "AI-VIDEO-BROLL-GEN-7: model loader import proof, no inference/no generated video"
}
```
