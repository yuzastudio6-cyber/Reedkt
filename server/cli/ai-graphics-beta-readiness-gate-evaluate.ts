import {
  buildAiGraphicsBetaReadinessGate,
  type AiGraphicsBetaReadinessEvidence,
} from '../tool-registry/ai-graphics-beta-readiness-gate'

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag)
}

const sharedGatesPassed = hasFlag('--all-shared-gates-passed')

const evidence: AiGraphicsBetaReadinessEvidence = {
  approvedPlanSnapshotGatePassed: sharedGatesPassed || hasFlag('--approved-plan-snapshot-gate-passed'),
  creditReservationGatePassed: sharedGatesPassed || hasFlag('--credit-reservation-gate-passed'),
  artifactBoundaryGatePassed: sharedGatesPassed || hasFlag('--artifact-boundary-gate-passed'),
  toolRouteGatePassed: sharedGatesPassed || hasFlag('--tool-route-gate-passed'),
  workerGatePassed: sharedGatesPassed || hasFlag('--worker-gate-passed'),
  browserCanvasWebglSandboxPassed: hasFlag('--browser-canvas-webgl-sandbox-passed'),
  nativeGpuRuntimeProofPassed: hasFlag('--native-gpu-runtime-proof-passed'),
  modelWeightManifestsApproved: hasFlag('--model-weight-manifests-approved'),
  internalBetaOwnerApprovalGranted: sharedGatesPassed || hasFlag('--internal-beta-owner-approval-granted'),
}

const gate = buildAiGraphicsBetaReadinessGate(evidence)

console.log(JSON.stringify({
  ...gate,
  input: {
    evaluatorOnly: true,
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
  },
}, null, 2))
