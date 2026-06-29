import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  buildAiGraphicsExternalBetaEvidenceAdmissionBundle,
  type AiGraphicsExternalBetaEvidenceAdmissionBundleInput,
} from '../tool-registry/ai-graphics-external-beta-evidence-admission-bundle'

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag)
}

function valueAfterFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function readJsonFile(flag: string): Record<string, unknown> | undefined {
  const filePath = valueAfterFlag(flag)
  if (!filePath) return undefined

  const resolvedPath = resolve(filePath)
  if (!existsSync(resolvedPath)) {
    throw new Error(`Evidence packet file does not exist for ${flag}: ${filePath}`)
  }

  const parsed = JSON.parse(readFileSync(resolvedPath, 'utf8'))
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error(`Evidence packet for ${flag} must be a JSON object: ${filePath}`)
  }
  return parsed as Record<string, unknown>
}

function readJsonPath(filePath: string): Record<string, unknown> {
  const resolvedPath = resolve(filePath)
  if (!existsSync(resolvedPath)) {
    throw new Error(`Evidence packet file does not exist: ${filePath}`)
  }

  const parsed = JSON.parse(readFileSync(resolvedPath, 'utf8'))
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error(`Evidence packet must be a JSON object: ${filePath}`)
  }
  return parsed as Record<string, unknown>
}

function readProofPacket(flag: string, committedPath: string): Record<string, unknown> | undefined {
  const fromFlag = readJsonFile(flag)
  if (fromFlag) return fromFlag
  if (hasFlag('--use-committed-js-runtime-proofs')) return readJsonPath(committedPath)
  return undefined
}

const allSharedGatesPassed = hasFlag('--all-shared-gates-passed')
const allTechnicalGatesPassed = allSharedGatesPassed || hasFlag('--all-technical-gates-passed')
const input: AiGraphicsExternalBetaEvidenceAdmissionBundleInput = {
  betaEvidenceBundlePacket: readJsonFile('--beta-evidence-bundle-packet') as
    AiGraphicsExternalBetaEvidenceAdmissionBundleInput['betaEvidenceBundlePacket'],
  externalBetaEvidencePacket: readJsonFile('--external-beta-evidence-packet') as
    AiGraphicsExternalBetaEvidenceAdmissionBundleInput['externalBetaEvidencePacket'],
  sourceProofPacketsRequired: hasFlag('--require-source-proof-packets'),
  approvedPlanSnapshotGatePassed: allTechnicalGatesPassed || hasFlag('--approved-plan-snapshot-gate-passed'),
  creditReservationGatePassed: allTechnicalGatesPassed || hasFlag('--credit-reservation-gate-passed'),
  artifactBoundaryGatePassed: allTechnicalGatesPassed || hasFlag('--artifact-boundary-gate-passed'),
  toolRouteGatePassed: allTechnicalGatesPassed || hasFlag('--tool-route-gate-passed'),
  workerGatePassed: allTechnicalGatesPassed || hasFlag('--worker-gate-passed'),
  browserCanvasWebglSandboxPassed: hasFlag('--browser-canvas-webgl-sandbox-passed'),
  internalBetaOwnerApprovalGranted: allSharedGatesPassed || hasFlag('--internal-beta-owner-approval-granted'),
  modelWeightManifestReviewPacket: readJsonFile('--model-weight-manifest-review-packet') as
    AiGraphicsExternalBetaEvidenceAdmissionBundleInput['modelWeightManifestReviewPacket'],
  gpuRuntimeProofResultPacket: readJsonFile('--gpu-runtime-proof-result-packet') as
    AiGraphicsExternalBetaEvidenceAdmissionBundleInput['gpuRuntimeProofResultPacket'],
  sourceExternalBetaNativeGpuProofCollectionPacket:
    readJsonFile('--external-beta-native-gpu-proof-collection-packet') as
      AiGraphicsExternalBetaEvidenceAdmissionBundleInput['sourceExternalBetaNativeGpuProofCollectionPacket'],
  nodeRuntimeProofPacket: readProofPacket(
    '--node-runtime-proof-packet',
    'docs/tool-intelligence/ai-graphics/node-runtime-proof.json',
  ) as AiGraphicsExternalBetaEvidenceAdmissionBundleInput['nodeRuntimeProofPacket'],
  browserRuntimeProofPacket: readProofPacket(
    '--browser-runtime-proof-packet',
    'docs/tool-intelligence/ai-graphics/browser-runtime-proof.json',
  ) as AiGraphicsExternalBetaEvidenceAdmissionBundleInput['browserRuntimeProofPacket'],
  satoriFontRuntimeProofPacket: readProofPacket(
    '--satori-font-runtime-proof-packet',
    'docs/tool-intelligence/ai-graphics/satori-font-runtime-proof.json',
  ) as AiGraphicsExternalBetaEvidenceAdmissionBundleInput['satoriFontRuntimeProofPacket'],
}

const bundle = buildAiGraphicsExternalBetaEvidenceAdmissionBundle(input)

console.log(JSON.stringify({
  ...bundle,
  input: {
    evaluatorOnly: true,
    betaEvidenceBundlePacketRead: Boolean(input.betaEvidenceBundlePacket),
    externalBetaEvidencePacketRead: Boolean(input.externalBetaEvidencePacket),
    sourceProofPacketsRequired: input.sourceProofPacketsRequired === true,
    sourceProofPacketFilesRead: [
      valueAfterFlag('--model-weight-manifest-review-packet'),
      valueAfterFlag('--gpu-runtime-proof-result-packet'),
      valueAfterFlag('--external-beta-native-gpu-proof-collection-packet'),
      valueAfterFlag('--node-runtime-proof-packet'),
      valueAfterFlag('--browser-runtime-proof-packet'),
      valueAfterFlag('--satori-font-runtime-proof-packet'),
    ].filter(Boolean).length,
    committedJsRuntimeProofsRead: hasFlag('--use-committed-js-runtime-proofs'),
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
}, null, 2))
