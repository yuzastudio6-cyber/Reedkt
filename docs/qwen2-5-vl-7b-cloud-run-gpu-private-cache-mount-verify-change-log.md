# Qwen2.5-VL 7B Cloud Run GPU Private Cache Mount Verify Change Log

```json qwen2-5-vl-7b-cloud-run-gpu-private-cache-mount-verify-change-log
{
  "decision": "qwen2_5_vl_7b_cloud_run_gpu_private_cache_mount_verified_for_no_deploy_mount_spec",
  "verifiedPrivateCache": {
    "project": "reeditpro",
    "bucket": "reeditpro-staging-reeditpro-generated-assets",
    "bucketLocation": "US-CENTRAL1",
    "objectPrefix": "model-weights/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5/",
    "model": "Qwen/Qwen2.5-VL-7B-Instruct",
    "revision": "cc594898137f460bfe9f0759e9844b3ce807cfb5",
    "objectCount": 16,
    "totalBytes": 16595981281,
    "expectedAggregateSha256": "46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b",
    "cloudAggregateSha256RecomputedNow": false,
    "configJsonGeneration": "1782514722459524",
    "configJsonSize": 1374
  },
  "runtimeIdentityAndIam": {
    "runtimeIdentity": "reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com",
    "iamRole": "roles/storage.objectViewer",
    "iamConditionTitle": "qwen25vl_model_read",
    "iamConditionScope": "selected_qwen25vl_private_model_prefix_only",
    "prefixScopedReadIamBindingPresent": true,
    "serviceAccountKeyFileCreated": false,
    "publicPrincipalGranted": false,
    "broadStorageAdminGranted": false,
    "secretManagerReadPerformed": false,
    "tokenCreatorGrantedForProbe": false
  },
  "readPathProbe": {
    "currentUserObjectMetadataRead": true,
    "currentUserPrefixInventoryRead": true,
    "impersonatedRuntimeReadPassed": false,
    "impersonatedRuntimeReadBlockedByTokenCreator": true,
    "policyTroubleshooterMembershipMatched": true,
    "policyTroubleshooterRolePermissionIncluded": true,
    "policyTroubleshooterConditionGranted": false
  },
  "cloudRunState": {
    "regionChecked": "us-central1",
    "servicesObserved": [
      "reeditpro-api",
      "reeditpro-staging-api",
      "reeditpro-staging-private-searxng"
    ],
    "qwenCloudRunServiceExists": false,
    "cloudRunVolumeMountCreatedNow": false,
    "cloudRunDeployCommandExecuted": false,
    "cloudRunJobCreated": false,
    "artifactRegistryImageCreated": false
  },
  "runtimeFlags": {
    "privateCacheMountVerifyCreated": true,
    "finalPrivateCacheVerified": true,
    "prefixScopedReadIamBindingPresent": true,
    "runtimeIdentitySelected": true,
    "currentUserObjectMetadataRead": true,
    "currentUserPrefixInventoryRead": true,
    "cloudRunServiceAbsenceVerified": true,
    "impersonatedRuntimeReadPassed": false,
    "impersonatedRuntimeReadBlockedByTokenCreator": true,
    "policyTroubleshooterMembershipMatched": true,
    "policyTroubleshooterRolePermissionIncluded": true,
    "policyTroubleshooterConditionGranted": false,
    "cloudRunVolumeMountCreated": false,
    "cloudRunDeployCommandExecuted": false,
    "cloudRunServiceCreated": false,
    "cloudRunJobCreated": false,
    "artifactRegistryImageCreated": false,
    "reservationCreated": false,
    "vmCreated": false,
    "dockerBuildRun": false,
    "dockerPushRun": false,
    "dependencyInstallRun": false,
    "modelImportRun": false,
    "modelLoadRun": false,
    "modelInferenceRun": false,
    "apiServerStarted": false,
    "providerCallsMade": false,
    "workersDispatched": false,
    "supabaseTouched": false,
    "sqlExecuted": false,
    "publicArtifactsCreated": false,
    "signedUrlsCreated": false,
    "creditMutationCreated": false,
    "betaUnlocked": false,
    "productionUnlocked": false,
    "dryRunPassedClaimed": false,
    "generatedLocalFixturePassedClaimed": false
  },
  "nextPrompt": "QWEN2_5_VL_STACK_TOOL_22-CLOUD-RUN-GPU-NO-DEPLOY-MOUNT-SPEC: author Cloud Run service revision mount/IAM spec with completed private cache, no deploy/no inference"
}
```
