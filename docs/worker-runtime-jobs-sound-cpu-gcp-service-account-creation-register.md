# WORKER_RUNTIME_JOBS SOUND CPU GCP Service Account Creation Register

```json worker-runtime-jobs-sound-cpu-gcp-service-account-creation-register
{
  "label": "worker-runtime-jobs-sound-cpu-gcp-service-account-creation-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_gcp_foundation_resource_creation_result_completed_with_blockers_ready_for_iam_role_binding_plan",
  "serviceAccount": {
    "projectId": "reeditpro",
    "email": "reeditpro-cpu-worker-sa@reeditpro.iam.gserviceaccount.com",
    "name": "projects/reeditpro/serviceAccounts/reeditpro-cpu-worker-sa@reeditpro.iam.gserviceaccount.com",
    "displayName": "ReEditPro SOUND CPU worker",
    "description": "CPU worker service account for ReEditPro SOUND CPU Cloud Run job templates; created by controlled Codex goal step with no Cloud Run execution.",
    "uniqueId": "102190881435179482338",
    "oauth2ClientId": "102190881435179482338",
    "existsAfterCreation": true,
    "projectLevelIamRolesBoundAfterCreation": false
  },
  "allowedUse": {
    "futureCloudRunJobServiceAccount": true,
    "futureSoundCpuAnalysisWorker": true,
    "futureSoundAudioMetadataWorker": true,
    "futureNoMediaImportProof": true
  },
  "notAllowedByThisGate": {
    "secretAccess": false,
    "storageAccess": false,
    "supabaseAccess": false,
    "workerExecution": false,
    "routeExecution": false,
    "mediaProcessing": false,
    "dockerBuildOrPush": false,
    "cloudRunDeployOrExecute": false,
    "externalBetaUnlock": false
  }
}
```

The service account is created as a least-surface identity anchor only. Role binding, image push, Cloud Run deployment, and any execution proof remain separate gates.
