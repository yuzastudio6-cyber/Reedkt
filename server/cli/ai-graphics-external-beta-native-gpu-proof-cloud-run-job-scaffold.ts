import { chmodSync, mkdirSync, writeFileSync } from 'node:fs'
import fs from 'node:fs'
import { join, resolve } from 'node:path'
import {
  buildAiGraphicsExternalBetaNativeGpuProofCloudRunJobScaffold,
  type AiGraphicsExternalBetaNativeGpuProofCloudRunJobScaffoldInput,
} from '../tool-registry/ai-graphics-external-beta-native-gpu-proof-cloud-run-job-scaffold.ts'

function stringFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  if (index === -1) return undefined
  return process.argv[index + 1]
}

function requiredStringFlag(flag: string): string {
  const value = stringFlag(flag)
  if (!value) throw new Error(`Missing required flag: ${flag}`)
  return value
}

function readJsonFile<T>(flag: string): T | undefined {
  const packetPath = stringFlag(flag)
  if (!packetPath) return undefined
  return JSON.parse(fs.readFileSync(packetPath, 'utf8')) as T
}

function selectedDeliveryMode(): AiGraphicsExternalBetaNativeGpuProofCloudRunJobScaffoldInput['privateModelWeightDeliveryMode'] {
  const value = stringFlag('--private-model-weight-delivery-mode')
  if (!value) return 'prebaked_private_image_layer'
  if (value !== 'prebaked_private_image_layer' && value !== 'approved_private_runtime_mount') {
    throw new Error(`Unsupported --private-model-weight-delivery-mode: ${value}`)
  }
  return value
}

function deployScript(): string {
  return `#!/usr/bin/env bash
set -euo pipefail

if [[ "\${REEDITPRO_AI_GRAPHICS_CLOUD_RUN_GPU_PROOF_CONFIRM:-}" != "deploy-or-run-on-demand-l4-proof-job" ]]; then
  echo "Refusing to deploy Cloud Run GPU proof job. Set REEDITPRO_AI_GRAPHICS_CLOUD_RUN_GPU_PROOF_CONFIRM=deploy-or-run-on-demand-l4-proof-job." >&2
  exit 64
fi

: "\${GCP_PROJECT_ID:?Missing GCP_PROJECT_ID}"
: "\${GCP_REGION:?Missing GCP_REGION}"
: "\${REEDITPRO_AI_GRAPHICS_CLOUD_RUN_GPU_PROOF_JOB_NAME:=reeditpro-ai-graphics-native-gpu-proof}"
: "\${REEDITPRO_GPU_WORKER_IMAGE:?Missing REEDITPRO_GPU_WORKER_IMAGE}"
: "\${REEDITPRO_GPU_WORKER_SERVICE_ACCOUNT:?Missing REEDITPRO_GPU_WORKER_SERVICE_ACCOUNT}"

mkdir -p .local-artifacts/ai-graphics/cloud-run-native-gpu-proof

gcloud run jobs deploy "\${REEDITPRO_AI_GRAPHICS_CLOUD_RUN_GPU_PROOF_JOB_NAME}" \\
  --project="\${GCP_PROJECT_ID}" \\
  --region="\${GCP_REGION}" \\
  --image="\${REEDITPRO_GPU_WORKER_IMAGE}" \\
  --service-account="\${REEDITPRO_GPU_WORKER_SERVICE_ACCOUNT}" \\
  --cpu=4 \\
  --memory=16Gi \\
  --gpu=1 \\
  --gpu-type=nvidia-l4 \\
  --no-gpu-zonal-redundancy \\
  --tasks=1 \\
  --parallelism=1 \\
  --max-retries=0 \\
  --set-env-vars="REEDITPRO_AI_GRAPHICS_GPU_RUNTIME_PROOF=true,MODEL_DOWNLOADS_ENABLED=false,PROVIDER_EXECUTION_ENABLED=false,REAL_MEDIA_INPUT_ENABLED=false,PUBLIC_ARTIFACTS_ENABLED=false,SIGNED_URLS_ENABLED=false,TOOL_ROUTE_EXECUTION_ENABLED=false,WORKER_EXECUTION_ENABLED=false,SUPABASE_MUTATION_ENABLED=false,GCS_UPLOAD_ENABLED=false" \\
  --command=python3 \\
  --args="/usr/local/bin/ai-graphics-gpu-runtime-readiness.py,--profile,gpu_worker_ai_graphics,--min-compute-capability,8.9,--require-model-weight-manifests" \\
  --format=json > .local-artifacts/ai-graphics/cloud-run-native-gpu-proof/cloud-run-job-deploy-output.json

echo "Deployed on-demand L4 proof job metadata locally. No proof execution has run yet."
`
}

function executeScript(runtimeProfiles: readonly string[]): string {
  const profileLines = runtimeProfiles.map((profile) => `  "${profile}"`).join('\n')
  return `#!/usr/bin/env bash
set -euo pipefail

if [[ "\${REEDITPRO_AI_GRAPHICS_CLOUD_RUN_GPU_PROOF_CONFIRM:-}" != "deploy-or-run-on-demand-l4-proof-job" ]]; then
  echo "Refusing to execute Cloud Run GPU proof job. Set REEDITPRO_AI_GRAPHICS_CLOUD_RUN_GPU_PROOF_CONFIRM=deploy-or-run-on-demand-l4-proof-job." >&2
  exit 64
fi

: "\${GCP_PROJECT_ID:?Missing GCP_PROJECT_ID}"
: "\${GCP_REGION:?Missing GCP_REGION}"
: "\${REEDITPRO_AI_GRAPHICS_CLOUD_RUN_GPU_PROOF_JOB_NAME:=reeditpro-ai-graphics-native-gpu-proof}"

mkdir -p .local-artifacts/ai-graphics/cloud-run-native-gpu-proof/profile-results

profiles=(
${profileLines}
)

for profile in "\${profiles[@]}"; do
  echo "== Running on-demand native GPU proof profile: \${profile} =="
  gcloud run jobs update "\${REEDITPRO_AI_GRAPHICS_CLOUD_RUN_GPU_PROOF_JOB_NAME}" \\
    --project="\${GCP_PROJECT_ID}" \\
    --region="\${GCP_REGION}" \\
    --command=python3 \\
    --args="/usr/local/bin/ai-graphics-gpu-runtime-readiness.py,--profile,\${profile},--min-compute-capability,8.9,--require-model-weight-manifests" \\
    --format=json > ".local-artifacts/ai-graphics/cloud-run-native-gpu-proof/profile-results/native-gpu-profile-\${profile}-job-update.json"

  gcloud run jobs execute "\${REEDITPRO_AI_GRAPHICS_CLOUD_RUN_GPU_PROOF_JOB_NAME}" \\
    --project="\${GCP_PROJECT_ID}" \\
    --region="\${GCP_REGION}" \\
    --wait \\
    --format=json > ".local-artifacts/ai-graphics/cloud-run-native-gpu-proof/profile-results/native-gpu-profile-\${profile}-execution.json"

  execution_name="$(gcloud run jobs executions list \\
    --project="\${GCP_PROJECT_ID}" \\
    --region="\${GCP_REGION}" \\
    --job="\${REEDITPRO_AI_GRAPHICS_CLOUD_RUN_GPU_PROOF_JOB_NAME}" \\
    --limit=1 \\
    --format='value(name)')"

  gcloud run jobs executions logs read "\${execution_name}" \\
    --project="\${GCP_PROJECT_ID}" \\
    --region="\${GCP_REGION}" \\
    > ".local-artifacts/ai-graphics/cloud-run-native-gpu-proof/profile-results/native-gpu-profile-\${profile}-logs.txt"
done

echo "Cloud Run native GPU proof profile executions finished. Review local logs before assembling the GPU proof result packet."
`
}

function checklistMarkdown(): string {
  return `# AI Graphics Cloud Run Native GPU Proof Checklist

This checklist is for the external-beta native GPU proof path. It does not approve runtime, beta, or production.

Before running the generated scripts:

- Use a private project/region approved for external-beta proof work.
- Use a GPU worker image built from the reviewed GPU worker Dockerfile.
- Use an on-demand Cloud Run Job with one NVIDIA L4 GPU, not a long-lived service.
- Provide reviewed model manifests and private model weights through either a private image layer or an approved private runtime mount.
- Keep raw \`gs://\`, \`gcs://\`, \`http://\`, \`https://\`, \`signed-url://\`, and \`public://\` refs out of committed evidence.
- Set \`REEDITPRO_AI_GRAPHICS_CLOUD_RUN_GPU_PROOF_CONFIRM=deploy-or-run-on-demand-l4-proof-job\` only when ready to deploy or execute the proof job.

The generated scripts keep these runtime side-effect flags false inside the proof job:

- \`MODEL_DOWNLOADS_ENABLED=false\`
- \`PROVIDER_EXECUTION_ENABLED=false\`
- \`REAL_MEDIA_INPUT_ENABLED=false\`
- \`PUBLIC_ARTIFACTS_ENABLED=false\`
- \`SIGNED_URLS_ENABLED=false\`
- \`TOOL_ROUTE_EXECUTION_ENABLED=false\`
- \`WORKER_EXECUTION_ENABLED=false\`
- \`SUPABASE_MUTATION_ENABLED=false\`
- \`GCS_UPLOAD_ENABLED=false\`

Expected local outputs stay under \`.local-artifacts/ai-graphics/cloud-run-native-gpu-proof/\`. Do not stage them.

After the proof job writes profile logs, run:

\`\`\`sh
npm run --silent ai-graphics:external-beta-native-gpu-proof-cloud-run-result-collector -- \\
  --source-cloud-run-job-scaffold-packet docs/tool-intelligence/ai-graphics/external-beta-native-gpu-proof-cloud-run-job-scaffold.json \\
  --logs-dir .local-artifacts/ai-graphics/cloud-run-native-gpu-proof/profile-results \\
  --out-dir .local-artifacts/ai-graphics/gpu-runtime-proof-results/cloud-run-extracted-profile-results
\`\`\`
`
}

const sourceOperatorHandoff = readJsonFile<{
  decision?: string
  currentStatus?: string
}>('--source-operator-handoff-packet')

const input: AiGraphicsExternalBetaNativeGpuProofCloudRunJobScaffoldInput = {
  sourceOperatorHandoffDecision: sourceOperatorHandoff?.decision,
  sourceOperatorHandoffStatus: sourceOperatorHandoff?.currentStatus,
  cloudRunProjectRef: stringFlag('--cloud-run-project-ref'),
  cloudRunRegionRef: stringFlag('--cloud-run-region-ref'),
  cloudRunServiceAccountRef: stringFlag('--cloud-run-service-account-ref'),
  gpuWorkerImageRef: stringFlag('--gpu-worker-image-ref'),
  privateModelWeightDeliveryMode: selectedDeliveryMode(),
  privateModelManifestRootRef: stringFlag('--private-model-manifest-root-ref'),
  privateTelemetryRef: stringFlag('--private-telemetry-ref'),
  rollbackRef: stringFlag('--rollback-ref'),
}

const outDir = resolve(requiredStringFlag('--out-dir'))
const packet = buildAiGraphicsExternalBetaNativeGpuProofCloudRunJobScaffold(input)
mkdirSync(outDir, { recursive: true })

const jobPlanPath = join(outDir, packet.generatedFiles.jobPlan)
const deployScriptPath = join(outDir, packet.generatedFiles.deployScript)
const executeScriptPath = join(outDir, packet.generatedFiles.executeScript)
const checklistPath = join(outDir, packet.generatedFiles.checklist)

writeFileSync(jobPlanPath, `${JSON.stringify(packet, null, 2)}\n`, 'utf8')
writeFileSync(deployScriptPath, deployScript(), 'utf8')
chmodSync(deployScriptPath, 0o700)
writeFileSync(executeScriptPath, executeScript(packet.runtimeProfilesRequired), 'utf8')
chmodSync(executeScriptPath, 0o700)
writeFileSync(checklistPath, checklistMarkdown(), 'utf8')

console.log(JSON.stringify({
  decision: packet.decision,
  currentStatus: packet.currentStatus,
  outputDirectory: outDir,
  generatedFiles: {
    jobPlan: jobPlanPath,
    deployScript: deployScriptPath,
    executeScript: executeScriptPath,
    checklist: checklistPath,
  },
  sourceOperatorHandoffAccepted: packet.booleans.sourceOperatorHandoffAccepted,
  gpuRuntimeTargetedTools: packet.gpuRuntimeTargetedTools.length,
  runtimeProfilesRequired: packet.runtimeProfilesRequired.length,
  cloudRunRuntimeTarget: packet.cloudRunRuntimeTarget,
  generatedOnly: true,
  scriptRequiresExplicitCloudRunGpuProofConfirmation: true,
  cloudRunDeploymentPerformed: false,
  cloudRunJobExecutionPerformed: false,
  dependencyInstallPerformed: false,
  packageLockMutationPerformed: false,
  toolExecutionPerformed: false,
  workerExecutionPerformed: false,
  routeExecutionPerformed: false,
  providerRuntimePerformed: false,
  browserWebglCanvasRuntimePerformed: false,
  gpuRuntimePerformed: false,
  modelWeightsDownloaded: false,
  modelWeightsLoaded: false,
  modelInferencePerformed: false,
  mediaProcessingPerformed: false,
  supabaseMutationPerformed: false,
  gcsUploadPerformed: false,
  publicArtifactCreated: false,
  signedUrlCreated: false,
}, null, 2))
