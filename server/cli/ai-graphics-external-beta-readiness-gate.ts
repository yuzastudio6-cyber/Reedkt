import {
  buildAiGraphicsExternalBetaReadinessGate,
  type AiGraphicsExternalBetaReadinessEvidence,
} from '../tool-registry/ai-graphics-external-beta-readiness-gate'
import type { AiGraphicsExternalBetaEvidencePacket } from '../tool-registry/ai-graphics-external-beta-evidence-packet'
import type { AiGraphicsExternalBetaEvidenceAdmissionBundle } from '../tool-registry/ai-graphics-external-beta-evidence-admission-bundle'
import type { AiGraphicsExternalBetaWorkerDispatchSmokeProof } from '../tool-registry/ai-graphics-external-beta-worker-dispatch-smoke-proof'
import fs from 'node:fs'

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag)
}

function stringFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  if (index === -1) return undefined
  return process.argv[index + 1]
}

function optionalBooleanFlag(flag: string, allFlagPassed = false): boolean | undefined {
  if (allFlagPassed || hasFlag(flag)) return true
  return undefined
}

function readExternalBetaEvidencePacket(): AiGraphicsExternalBetaEvidencePacket | undefined {
  const packetPath = stringFlag('--external-beta-evidence-packet')
  if (!packetPath) return undefined
  return JSON.parse(fs.readFileSync(packetPath, 'utf8')) as AiGraphicsExternalBetaEvidencePacket
}

function readExternalBetaEvidenceAdmissionBundle():
  AiGraphicsExternalBetaEvidenceAdmissionBundle | undefined {
  const packetPath = stringFlag('--external-beta-evidence-admission-bundle')
  if (!packetPath) return undefined
  return JSON.parse(fs.readFileSync(packetPath, 'utf8')) as AiGraphicsExternalBetaEvidenceAdmissionBundle
}

function readExternalBetaWorkerDispatchSmokeProof():
  AiGraphicsExternalBetaWorkerDispatchSmokeProof | undefined {
  const packetPath = stringFlag('--external-beta-worker-dispatch-smoke-proof')
  if (!packetPath) return undefined
  return JSON.parse(fs.readFileSync(packetPath, 'utf8')) as AiGraphicsExternalBetaWorkerDispatchSmokeProof
}

const sharedGatesPassed = hasFlag('--all-shared-gates-passed')
const allExternalBetaEvidencePassed = hasFlag('--all-external-beta-evidence-passed')
const externalBetaEvidencePacket = readExternalBetaEvidencePacket()
const externalBetaEvidenceAdmissionBundle = readExternalBetaEvidenceAdmissionBundle()
const externalBetaWorkerDispatchSmokeProof = readExternalBetaWorkerDispatchSmokeProof()

const evidence: AiGraphicsExternalBetaReadinessEvidence = {
  externalBetaEvidencePacket,
  externalBetaEvidenceAdmissionBundle,
  externalBetaWorkerDispatchSmokeProof,
  approvedPlanSnapshotGatePassed: sharedGatesPassed || hasFlag('--approved-plan-snapshot-gate-passed'),
  creditReservationGatePassed: sharedGatesPassed || hasFlag('--credit-reservation-gate-passed'),
  artifactBoundaryGatePassed: sharedGatesPassed || hasFlag('--artifact-boundary-gate-passed'),
  toolRouteGatePassed: sharedGatesPassed || hasFlag('--tool-route-gate-passed'),
  workerGatePassed: sharedGatesPassed || hasFlag('--worker-gate-passed'),
  browserCanvasWebglSandboxPassed: hasFlag('--browser-canvas-webgl-sandbox-passed'),
  nativeGpuRuntimeProofPassed: hasFlag('--native-gpu-runtime-proof-passed'),
  modelWeightManifestsApproved: hasFlag('--model-weight-manifests-approved'),
  modelWeightManifestReviewPacketAccepted: hasFlag('--model-weight-review-packet-accepted'),
  internalBetaOwnerApprovalGranted:
    sharedGatesPassed || hasFlag('--internal-beta-owner-approval-granted'),
  internalBetaRuntimeSoakAccepted: optionalBooleanFlag(
    '--internal-beta-runtime-soak-accepted',
    allExternalBetaEvidencePassed,
  ),
  externalBetaQaAccepted: optionalBooleanFlag(
    '--external-beta-qa-accepted',
    allExternalBetaEvidencePassed,
  ),
  externalBetaCostConcurrencyPrivacyRollbackAccepted: optionalBooleanFlag(
    '--external-beta-cost-concurrency-privacy-rollback-accepted',
    allExternalBetaEvidencePassed,
  ),
  externalBetaIncidentResponseAccepted: optionalBooleanFlag(
    '--external-beta-incident-response-accepted',
    allExternalBetaEvidencePassed,
  ),
  externalBetaOwnerApprovalGranted: optionalBooleanFlag(
    '--external-beta-owner-approval-granted',
    allExternalBetaEvidencePassed,
  ),
  externalBetaWorkerDispatchSmokeProofAccepted: optionalBooleanFlag(
    '--external-beta-worker-dispatch-smoke-proof-accepted',
    allExternalBetaEvidencePassed,
  ),
}

const gate = buildAiGraphicsExternalBetaReadinessGate(evidence)

console.log(JSON.stringify({
  ...gate,
  input: {
    evaluatorOnly: true,
    externalBetaEvidencePacketRead: Boolean(externalBetaEvidencePacket),
    externalBetaEvidenceAdmissionBundleRead: Boolean(externalBetaEvidenceAdmissionBundle),
    externalBetaWorkerDispatchSmokeProofRead: Boolean(externalBetaWorkerDispatchSmokeProof),
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
