import { chmodSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import {
  buildAiGraphicsExternalBetaNativeGpuProofOperatorHandoff,
  type AiGraphicsExternalBetaNativeGpuProofOperatorHandoffInput,
} from '../tool-registry/ai-graphics-external-beta-native-gpu-proof-operator-handoff.ts'
import type {
  AiGraphicsExternalBetaNativeGpuProofCollection,
} from '../tool-registry/ai-graphics-external-beta-native-gpu-proof-collection.ts'
import fs from 'node:fs'

function stringFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  if (index === -1) return undefined
  return process.argv[index + 1]
}

function readJsonFile<T>(flag: string): T | undefined {
  const packetPath = stringFlag(flag)
  if (!packetPath) return undefined
  return JSON.parse(fs.readFileSync(packetPath, 'utf8')) as T
}

function requiredStringFlag(flag: string): string {
  const value = stringFlag(flag)
  if (!value) {
    throw new Error(`Missing required flag: ${flag}`)
  }
  return value
}

function scriptForSteps(steps: Array<{ stepId: string; command: string; performsRuntimeExecution: boolean }>): string {
  const lines = [
    '#!/usr/bin/env bash',
    'set -euo pipefail',
    '',
    'if [[ "${REEDITPRO_AI_GRAPHICS_NATIVE_GPU_OPERATOR_CONFIRM:-}" != "run-native-gpu-proof-on-approved-l4-host" ]]; then',
    '  echo "Refusing to run native GPU proof. Set REEDITPRO_AI_GRAPHICS_NATIVE_GPU_OPERATOR_CONFIRM=run-native-gpu-proof-on-approved-l4-host on an approved native linux/amd64 NVIDIA L4 host." >&2',
    '  exit 64',
    'fi',
    '',
    'if [[ -z "${REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT:-}" ]]; then',
    '  echo "Missing REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT. Set it to the private model weight root before running." >&2',
    '  exit 65',
    'fi',
    '',
    'mkdir -p .local-artifacts/ai-graphics/model-weight-checksum-evidence',
    'mkdir -p .local-artifacts/ai-graphics/model-weight-manifests',
    'mkdir -p .local-artifacts/ai-graphics/gpu-runtime-proof-results',
    '',
  ]

  for (const step of steps) {
    lines.push(`echo "== ${step.stepId} =="`)
    if (step.performsRuntimeExecution) {
      lines.push('echo "This step runs native GPU proof containers on demand; no idle GPU service is approved."')
    }
    lines.push(step.command)
    lines.push('')
  }

  lines.push('echo "Native GPU proof operator handoff complete. Review generated JSON packets before feeding them into later gates."')
  return `${lines.join('\n')}\n`
}

function checklistMarkdown(): string {
  return `# AI Graphics Native GPU Proof Operator Checklist

Before running \`run-native-gpu-proof-operator.sh\`:

- Use an approved native \`linux/amd64\` NVIDIA L4 host.
- Confirm \`nvidia-smi\` works on the host.
- Set \`REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT\` to the private model weight root.
- Fill and review private checksum evidence for \`sam2\`, \`birefnet\`, \`real_esrgan\`, \`rembg\`, and \`transparent_background\`.
- Ensure private artifact refs use \`private://\`, \`reeditpro-private://\`, \`backend-evidence://\`, or \`external-beta-evidence://\`.
- Do not use \`http://\`, \`https://\`, \`signed-url://\`, \`public://\`, raw \`gs://\`, or raw \`gcs://\` refs as evidence.
- Set \`REEDITPRO_AI_GRAPHICS_NATIVE_GPU_OPERATOR_CONFIRM=run-native-gpu-proof-on-approved-l4-host\` only when ready to run the native proof.

Expected outputs stay local under \`.local-artifacts/ai-graphics/\`:

- \`model-weight-checksum-evidence/model-weight-checksum-evidence-packet.json\`
- \`model-weight-manifests/model-weight-manifest-review-packet.json\`
- \`gpu-runtime-proof-results/gpu-runtime-proof-command-plan-packet.json\`
- \`gpu-runtime-proof-results/native-gpu-host-preflight.json\`
- \`gpu-runtime-proof-results/gpu-runtime-proof-result-packet.json\`
- \`gpu-runtime-proof-results/external-beta-native-gpu-proof-collection-packet.json\`
- \`gpu-runtime-proof-results/external-beta-per-tool-runtime-proof-recheck-packet.json\`

This scaffold does not approve external beta or production. External beta ready now remains 0 tools and production ready now remains 0 tools. GPU remains on-demand only, no idle GPU runtime is approved, and CPU fallback for heavy/model tools remains blocked.
`
}

const outDir = resolve(requiredStringFlag('--out-dir'))
const input: AiGraphicsExternalBetaNativeGpuProofOperatorHandoffInput = {
  sourceNativeGpuProofCollectionPacket:
    readJsonFile<AiGraphicsExternalBetaNativeGpuProofCollection>(
      '--external-beta-native-gpu-proof-collection-packet',
    ),
  operatorRunbookPolicyRef:
    stringFlag('--operator-runbook-policy-ref'),
  operatorAccessControlRef:
    stringFlag('--operator-access-control-ref'),
  nativeGpuHostPoolRef:
    stringFlag('--native-gpu-host-pool-ref'),
  privateModelWeightRootRef:
    stringFlag('--private-model-weight-root-ref'),
  privateTelemetryRef:
    stringFlag('--private-telemetry-ref'),
  rollbackRef:
    stringFlag('--rollback-ref'),
}

const handoff = buildAiGraphicsExternalBetaNativeGpuProofOperatorHandoff(input)
mkdirSync(outDir, { recursive: true })

const handoffPacketPath = join(outDir, 'operator-handoff-packet.json')
const scriptPath = join(outDir, 'run-native-gpu-proof-operator.sh')
const envPath = join(outDir, 'operator.env.example')
const checklistPath = join(outDir, 'operator-checklist.md')

writeFileSync(handoffPacketPath, `${JSON.stringify(handoff, null, 2)}\n`, 'utf8')
writeFileSync(scriptPath, scriptForSteps(handoff.operatorSteps), 'utf8')
chmodSync(scriptPath, 0o700)
writeFileSync(envPath, [
  '# Copy to a private untracked env file before running.',
  '# Set only on an approved native linux/amd64 NVIDIA L4 host.',
  'REEDITPRO_AI_GRAPHICS_NATIVE_GPU_OPERATOR_CONFIRM=',
  'REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT=',
  '',
].join('\n'), 'utf8')
writeFileSync(checklistPath, checklistMarkdown(), 'utf8')

console.log(JSON.stringify({
  decision: 'ai_graphics_external_beta_native_gpu_proof_operator_scaffold_prepared_local_only',
  outputDirectory: outDir,
  generatedFiles: {
    handoffPacket: handoffPacketPath,
    runScript: scriptPath,
    envExample: envPath,
    checklist: checklistPath,
  },
  sourceHandoffDecision: handoff.decision,
  gpuRuntimeTargetedTools: handoff.gpuRuntimeTargetedTools.length,
  modelWeightManifestRequiredTools: handoff.modelWeightManifestRequiredTools.length,
  runtimeProfilesRequired: handoff.runtimeProfilesRequired.length,
  operatorSteps: handoff.operatorSteps.length,
  generatedOnly: true,
  scriptRequiresExplicitNativeGpuOperatorConfirmation: true,
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
