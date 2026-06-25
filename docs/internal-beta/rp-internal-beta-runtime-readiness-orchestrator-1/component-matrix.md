# Component Matrix

| Component | Source module | Operations | Status |
| --- | --- | ---: | --- |
| `service_role_runtime` | `server/services/internal-beta-service-role-runtime-scaffold.ts` | 8 | `disabled_pending_runtime_gate` |
| `credit_ledger_runtime` | `server/services/internal-beta-credit-ledger-runtime-scaffold.ts` | 6 | `disabled_pending_credit_ledger_runtime_gate` |
| `job_queue_runtime` | `server/services/internal-beta-job-queue-runtime-scaffold.ts` | 8 | `disabled_pending_job_queue_runtime_gate` |
| `private_artifact_manifest` | `server/services/internal-beta-private-artifact-manifest-scaffold.ts` | 8 | `disabled_pending_private_artifact_manifest_runtime_gate` |
| `remotion_render_worker` | `server/services/internal-beta-remotion-render-worker-scaffold.ts` | 8 | `disabled_pending_remotion_render_worker_runtime_gate` |
| `provider_adapter` | `server/services/internal-beta-disabled-provider-adapter-scaffold.ts` | 8 | `disabled_pending_provider_adapter_runtime_gate` |

## Runtime Flags

All of the following are required to remain false in this phase:

- `remoteSupabaseMutation`
- `sqlExecution`
- `migrationApply`
- `serviceRoleRouteExecution`
- `routeExecution`
- `workerExecution`
- `workerDispatch`
- `providerModelCall`
- `modelCall`
- `secretPayloadAccess`
- `rawPromptExecution`
- `remotionExecution`
- `ffmpegExecution`
- `ffprobeExecution`
- `mediaProcessing`
- `renderExportExecution`
- `previewArtifactCreation`
- `finalExportCreation`
- `storageWrite`
- `storageRead`
- `signedUrlCreation`
- `publicArtifactCreation`
- `creditMutation`
- `stripePaymentProcessing`
- `internalBetaUnlock`
- `externalBetaUnlock`
- `productionUnlock`
