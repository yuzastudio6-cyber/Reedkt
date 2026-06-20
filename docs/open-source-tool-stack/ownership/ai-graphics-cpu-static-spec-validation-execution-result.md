# AI Graphics CPU Static Spec Validation Execution Result

Decision: `blocked_pending_cpu_static_dependency_install_from_lock`

Run id: `ai-graphics-cpu-static-spec-validation-local-static`

The execution gate was attempted but not allowed to proceed beyond dependency availability checks. The six approved CPU/static packages are absent from the current source branch package manifests, and this lane cannot add dependencies or mutate `package-lock.json`.

Result booleans:

| Boolean | Value |
| --- | --- |
| `cpuStaticSpecValidationExecutionAttempted` | true |
| `sourceApprovalAccepted` | true |
| `canonicalPackageProofAccepted` | true |
| `dependencyLockfileGateEvaluated` | true |
| `blockedPacketCommitted` | true |
| `cpuStaticSpecValidationExecutionPassed` | false |
| `all6CpuStaticToolsValidated` | false |
| `dependencyInstallPerformed` | false |
| `packageLockMutationPerformed` | false |
| `importSmokeExecutedNow` | false |
| `syntheticFixtureExecutedNow` | false |
| `staticFixtureExecutionPerformed` | false |
| `toolExecutionPerformed` | false |
| `workerExecutionPerformed` | false |
| `routeExecutionPerformed` | false |
| `providerRuntimePerformed` | false |
| `browserWebglCanvasRuntimePerformed` | false |
| `gpuRuntimePerformed` | false |
| `modelWeightDownloadPerformed` | false |
| `supabaseMutationPerformed` | false |
| `sqlExecutionPerformed` | false |
| `gcsUploadPerformed` | false |
| `publicArtifactCreated` | false |
| `signedUrlCreated` | false |
| `runtimeReadyNow` | false |
| `internalBetaReadyNow` | false |
| `externalBetaReadyNow` | false |
| `productionReadyNow` | false |

`npm ci` was attempted from the clean execution worktree using the existing lockfile and `DEVELOPER_DIR=/Library/Developer/CommandLineTools`. It entered the existing `duckdb` native fallback build and was interrupted after several minutes. No package-lock mutation was made.

No worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
