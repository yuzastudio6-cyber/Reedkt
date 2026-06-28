import fs from 'node:fs'
import {
  buildAiGraphicsExternalBetaLaunchGoNoGo,
  type AiGraphicsExternalBetaLaunchGoNoGoInput,
} from '../tool-registry/ai-graphics-external-beta-launch-go-no-go'
import type { AiGraphicsExternalBetaEvidencePacket } from '../tool-registry/ai-graphics-external-beta-evidence-packet'
import type { AiGraphicsExternalBetaLaunchGapReport } from '../tool-registry/ai-graphics-external-beta-launch-gap-report'
import type {
  AiGraphicsExternalBetaEvidenceAdmissionBundle,
} from '../tool-registry/ai-graphics-external-beta-evidence-admission-bundle'
import type {
  AiGraphicsExternalBetaWorkerDispatchSmokeProof,
} from '../tool-registry/ai-graphics-external-beta-worker-dispatch-smoke-proof'

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

function readJsonFile<T>(flag: string): T | undefined {
  const packetPath = stringFlag(flag)
  if (!packetPath) return undefined
  return JSON.parse(fs.readFileSync(packetPath, 'utf8')) as T
}

const sharedGatesPassed = hasFlag('--all-shared-gates-passed')
const allExternalBetaEvidencePassed = hasFlag('--all-external-beta-evidence-passed')
const allExternalBetaLaunchGatesApproved = hasFlag('--all-external-beta-launch-gates-approved')

const input: AiGraphicsExternalBetaLaunchGoNoGoInput = {
  sourceExternalBetaLaunchGapReportPacket:
    readJsonFile<AiGraphicsExternalBetaLaunchGapReport>('--external-beta-launch-gap-report-packet'),
  sourceExternalBetaEvidenceAdmissionBundlePacket:
    readJsonFile<AiGraphicsExternalBetaEvidenceAdmissionBundle>(
      '--external-beta-evidence-admission-bundle-packet',
    ),
  externalBetaEvidenceAdmissionBundle:
    readJsonFile<AiGraphicsExternalBetaEvidenceAdmissionBundle>(
      '--external-beta-evidence-admission-bundle',
    ),
  externalBetaWorkerDispatchSmokeProof:
    readJsonFile<AiGraphicsExternalBetaWorkerDispatchSmokeProof>(
      '--external-beta-worker-dispatch-smoke-proof',
    ),
  externalBetaEvidencePacket:
    readJsonFile<AiGraphicsExternalBetaEvidencePacket>('--external-beta-evidence-packet'),
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
  browserCanvasWebglSandboxPassed: hasFlag('--browser-canvas-webgl-sandbox-passed'),
  nativeGpuRuntimeProofPassed: hasFlag('--native-gpu-runtime-proof-passed'),
  modelWeightManifestsApproved: hasFlag('--model-weight-manifests-approved'),
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
  externalBetaLaunchSwitchApproved:
    allExternalBetaLaunchGatesApproved ||
    hasFlag('--external-beta-launch-switch-approved'),
  externalBetaLaunchRef: stringFlag('--external-beta-launch-ref'),
  externalBetaRolloutCohortApproved:
    allExternalBetaLaunchGatesApproved ||
    hasFlag('--external-beta-rollout-cohort-approved'),
  externalBetaRolloutCohortRef: stringFlag('--external-beta-rollout-cohort-ref'),
  externalBetaCostConcurrencyCeilingApproved:
    allExternalBetaLaunchGatesApproved ||
    hasFlag('--external-beta-cost-concurrency-ceiling-approved'),
  externalBetaCostConcurrencyCeilingRef:
    stringFlag('--external-beta-cost-concurrency-ceiling-ref'),
  externalBetaRollbackIncidentRunbookApproved:
    allExternalBetaLaunchGatesApproved ||
    hasFlag('--external-beta-rollback-incident-runbook-approved'),
  externalBetaRollbackIncidentRunbookRef:
    stringFlag('--external-beta-rollback-incident-runbook-ref'),
  externalBetaPrivateArtifactRetentionSupportApproved:
    allExternalBetaLaunchGatesApproved ||
    hasFlag('--external-beta-private-artifact-retention-support-approved'),
  externalBetaPrivateArtifactRetentionSupportRef:
    stringFlag('--external-beta-private-artifact-retention-support-ref'),
  externalBetaLaunchApproverRole:
    stringFlag('--external-beta-launch-approver-role') ??
    'AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_OWNER',
}

const report = buildAiGraphicsExternalBetaLaunchGoNoGo(input)

console.log(JSON.stringify({
  ...report,
  input: {
    evaluatorOnly: true,
    sourceLaunchGapReportPacketRead:
      Boolean(stringFlag('--external-beta-launch-gap-report-packet')),
    sourceEvidenceAdmissionBundlePacketRead:
      Boolean(stringFlag('--external-beta-evidence-admission-bundle-packet')),
    externalBetaEvidenceAdmissionBundleRead:
      Boolean(stringFlag('--external-beta-evidence-admission-bundle')),
    externalBetaWorkerDispatchSmokeProofRead:
      Boolean(stringFlag('--external-beta-worker-dispatch-smoke-proof')),
    externalBetaEvidencePacketRead:
      Boolean(stringFlag('--external-beta-evidence-packet')),
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
