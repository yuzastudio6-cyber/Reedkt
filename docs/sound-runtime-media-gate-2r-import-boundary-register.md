# SOUND Runtime Media Gate 2R Import Boundary Register

```json sound-runtime-media-gate-2r-import-boundary-register
{
  "decision": "sound_runtime_media_gate_2r_controlled_static_integration_import_proof_passed_with_warnings_ready_for_import_proof_owner_review",
  "allowedInGate2r": {
    "importStaticIntegrationSource": true,
    "callStaticEvaluationFunction": true,
    "inspectReturnedStaticSummary": true
  },
  "notAllowedInGate2r": {
    "importRouteResolver": true,
    "executeServerRoute": true,
    "dispatchWorker": true,
    "executeWorker": true,
    "executeTool": true,
    "openMedia": true,
    "processMedia": true,
    "runFfmpegOrFfprobe": true,
    "runDocker": true,
    "callGcpOrCloudRun": true,
    "touchSupabase": true,
    "executeSql": true,
    "createArtifact": true,
    "createSignedOrPublicUrl": true,
    "callProviderOrModel": true,
    "unlockBetaOrProduction": true
  },
  "observedInGate2r": {
    "importStaticIntegrationSource": true,
    "callStaticEvaluationFunction": true,
    "importRouteResolver": false,
    "executeServerRoute": false,
    "dispatchWorker": false,
    "executeWorker": false,
    "executeTool": false,
    "openMedia": false,
    "processMedia": false,
    "runDocker": false,
    "callGcpOrCloudRun": false,
    "touchSupabase": false,
    "executeSql": false,
    "createArtifact": false,
    "createSignedOrPublicUrl": false,
    "callProviderOrModel": false,
    "unlockBetaOrProduction": false
  }
}
```
