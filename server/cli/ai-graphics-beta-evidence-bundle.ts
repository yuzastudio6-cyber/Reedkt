import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  buildAiGraphicsBetaEvidenceBundle,
  type AiGraphicsBetaEvidenceBundleInput,
} from '../tool-registry/ai-graphics-beta-evidence-bundle'

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag)
}

function valueAfterFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function readJsonFile(flag: string): unknown | undefined {
  const filePath = valueAfterFlag(flag)
  if (!filePath) return undefined

  const resolvedPath = resolve(filePath)
  if (!existsSync(resolvedPath)) {
    throw new Error(`Evidence packet file does not exist for ${flag}: ${filePath}`)
  }

  return JSON.parse(readFileSync(resolvedPath, 'utf8'))
}

const allSharedGatesPassed = hasFlag('--all-shared-gates-passed')
const input: AiGraphicsBetaEvidenceBundleInput = {
  approvedPlanSnapshotGatePassed: allSharedGatesPassed || hasFlag('--approved-plan-snapshot-gate-passed'),
  creditReservationGatePassed: allSharedGatesPassed || hasFlag('--credit-reservation-gate-passed'),
  artifactBoundaryGatePassed: allSharedGatesPassed || hasFlag('--artifact-boundary-gate-passed'),
  toolRouteGatePassed: allSharedGatesPassed || hasFlag('--tool-route-gate-passed'),
  workerGatePassed: allSharedGatesPassed || hasFlag('--worker-gate-passed'),
  browserCanvasWebglSandboxPassed: hasFlag('--browser-canvas-webgl-sandbox-passed'),
  internalBetaOwnerApprovalGranted: allSharedGatesPassed || hasFlag('--internal-beta-owner-approval-granted'),
  modelWeightManifestReviewPacket: readJsonFile('--model-weight-manifest-review-packet') as AiGraphicsBetaEvidenceBundleInput['modelWeightManifestReviewPacket'],
  gpuRuntimeProofResultPacket: readJsonFile('--gpu-runtime-proof-result-packet') as AiGraphicsBetaEvidenceBundleInput['gpuRuntimeProofResultPacket'],
  modelWeightManifestsApprovedOverride: hasFlag('--model-weight-manifests-approved'),
  nativeGpuRuntimeProofPassedOverride: hasFlag('--native-gpu-runtime-proof-passed'),
}

const bundle = buildAiGraphicsBetaEvidenceBundle(input)
const output = {
  ...bundle,
  input: {
    validatorOnly: true,
    evidencePacketFilesRead: [
      valueAfterFlag('--model-weight-manifest-review-packet'),
      valueAfterFlag('--gpu-runtime-proof-result-packet'),
    ].filter(Boolean).length,
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
    mediaProcessingPerformed: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
  },
}

console.log(JSON.stringify(output, null, 2))

if (hasFlag('--require-all-21-beta-ready') && !bundle.all21BetaEvidenceReady) {
  process.exitCode = 2
}
