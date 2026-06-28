import fs from 'node:fs'
import {
  buildAiGraphicsExternalBetaEndToEndReadiness,
} from '../tool-registry/ai-graphics-external-beta-end-to-end-readiness'
import type { AiGraphicsExternalBetaEvidenceAdmissionBundle } from '../tool-registry/ai-graphics-external-beta-evidence-admission-bundle'
import type { AiGraphicsExternalBetaEvidencePacket } from '../tool-registry/ai-graphics-external-beta-evidence-packet'
import type { AiGraphicsExternalBetaReadinessEvidence } from '../tool-registry/ai-graphics-external-beta-readiness-gate'
import type { AiGraphicsExternalBetaWorkerDispatchSmokeProof } from '../tool-registry/ai-graphics-external-beta-worker-dispatch-smoke-proof'

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag)
}

function stringFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function readJsonFile<T>(flag: string): T | undefined {
  const packetPath = stringFlag(flag)
  if (!packetPath) return undefined
  return JSON.parse(fs.readFileSync(packetPath, 'utf8')) as T
}

function optionalBooleanFlag(flag: string, allFlagPassed = false): boolean | undefined {
  if (allFlagPassed || hasFlag(flag)) return true
  return undefined
}

const sharedGatesPassed = hasFlag('--all-shared-gates-passed')
const allExternalBetaEvidencePassed = hasFlag('--all-external-beta-evidence-passed')

const evidence: AiGraphicsExternalBetaReadinessEvidence = {
  externalBetaEvidencePacket:
    readJsonFile<AiGraphicsExternalBetaEvidencePacket>('--external-beta-evidence-packet'),
  externalBetaEvidenceAdmissionBundle:
    readJsonFile<AiGraphicsExternalBetaEvidenceAdmissionBundle>(
      '--external-beta-evidence-admission-bundle',
    ),
  externalBetaWorkerDispatchSmokeProof:
    readJsonFile<AiGraphicsExternalBetaWorkerDispatchSmokeProof>(
      '--external-beta-worker-dispatch-smoke-proof',
    ),
  approvedPlanSnapshotGatePassed:
    sharedGatesPassed || hasFlag('--approved-plan-snapshot-gate-passed'),
  creditReservationGatePassed:
    sharedGatesPassed || hasFlag('--credit-reservation-gate-passed'),
  artifactBoundaryGatePassed:
    sharedGatesPassed || hasFlag('--artifact-boundary-gate-passed'),
  toolRouteGatePassed:
    sharedGatesPassed || hasFlag('--tool-route-gate-passed'),
  workerGatePassed:
    sharedGatesPassed || hasFlag('--worker-gate-passed'),
  browserCanvasWebglSandboxPassed:
    hasFlag('--browser-canvas-webgl-sandbox-passed'),
  nativeGpuRuntimeProofPassed:
    hasFlag('--native-gpu-runtime-proof-passed'),
  modelWeightManifestsApproved:
    hasFlag('--model-weight-manifests-approved'),
  modelWeightManifestReviewPacketAccepted:
    hasFlag('--model-weight-review-packet-accepted'),
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

const report = buildAiGraphicsExternalBetaEndToEndReadiness(evidence)

console.log(JSON.stringify({
  ...report,
  input: {
    reportOnly: true,
    externalBetaEvidencePacketRead: Boolean(stringFlag('--external-beta-evidence-packet')),
    externalBetaEvidenceAdmissionBundleRead:
      Boolean(stringFlag('--external-beta-evidence-admission-bundle')),
    externalBetaWorkerDispatchSmokeProofRead:
      Boolean(stringFlag('--external-beta-worker-dispatch-smoke-proof')),
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
    supabaseMutationPerformed: false,
    gcsUploadPerformed: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
  },
}, null, 2))
