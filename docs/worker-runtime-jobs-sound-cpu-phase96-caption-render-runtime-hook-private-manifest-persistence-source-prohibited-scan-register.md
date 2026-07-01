# WORKER_RUNTIME_JOBS SOUND CPU Phase 96 Private Manifest Persistence Source Prohibited Scan Register

```json worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-prohibited-scan-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-prohibited-scan-register",
  "decision": "worker_runtime_jobs_sound_cpu_phase96_caption_render_runtime_hook_private_manifest_persistence_source_static_validation_passed_with_warnings_ready_for_private_manifest_persistence_source_owner_review_no_execution",
  "validatedSourcePath": "server/workers/sound-cpu/runtime/privateManifestPersistence.ts",
  "forbiddenSnippetsAbsent": [
    "createClient(",
    ".from(",
    ".insert(",
    ".upsert(",
    "storage.from",
    "createSignedUrl",
    "fs.readFile",
    "fetch(",
    "spawn(",
    "exec(",
    "workerDispatch"
  ],
  "forbiddenArtifactsAbsent": {
    "sqlOrMigrationCreated": true,
    "supabaseFileChanged": true,
    "storageClientCreated": true,
    "mediaReaderCreated": true,
    "routeOrProviderCallCreated": true,
    "dockerOrGcpConfigCreated": true,
    "envSecretCreated": true
  }
}
```

The static scan rejects persistence, storage, media, worker dispatch, route/provider/model, Docker/GCP, SQL, migration, and secret surfaces.
