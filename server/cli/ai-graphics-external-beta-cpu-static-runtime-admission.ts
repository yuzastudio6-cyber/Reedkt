import fs from 'node:fs'
import {
  evaluateAiGraphicsExternalBetaCpuStaticRuntimeAdmission,
  type AiGraphicsExternalBetaCpuStaticRuntimeAdmissionInput,
} from '../tool-registry/ai-graphics-external-beta-cpu-static-runtime-admission'
import type {
  AiGraphicsExternalBetaCpuStaticCohortAdmission,
} from '../tool-registry/ai-graphics-external-beta-cpu-static-cohort-admission'

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag)
}

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

const input: AiGraphicsExternalBetaCpuStaticRuntimeAdmissionInput = {
  sourceExternalBetaCpuStaticCohortAdmissionPacket:
    readJsonFile<AiGraphicsExternalBetaCpuStaticCohortAdmission>(
      '--external-beta-cpu-static-cohort-admission-packet',
    ),
  capabilityId: stringFlag('--capability-id') ?? 'chart_overlay',
  requestedToolId: stringFlag('--requested-tool-id'),
  executionRequested: hasFlag('--execution-requested'),
  approvedPlanSnapshotId: stringFlag('--approved-plan-snapshot-id'),
  creditReservationId: stringFlag('--credit-reservation-id'),
  artifactBoundaryApprovalRef: stringFlag('--artifact-boundary-approval-ref'),
  toolRouteApprovalRef: stringFlag('--tool-route-approval-ref'),
  workerApprovalRef: stringFlag('--worker-approval-ref'),
  runtimeEnqueueApprovalRef: stringFlag('--runtime-enqueue-approval-ref'),
  ownerRuntimeApprovalRef: stringFlag('--owner-runtime-approval-ref'),
  privateArtifactManifestRef: stringFlag('--private-artifact-manifest-ref'),
  nodeRuntimeProofRef: stringFlag('--node-runtime-proof-ref'),
  browserRuntimeProofRef: stringFlag('--browser-runtime-proof-ref'),
  satoriFontRuntimeProofRef: stringFlag('--satori-font-runtime-proof-ref'),
  nativeGpuRuntimeProofRef: stringFlag('--native-gpu-runtime-proof-ref'),
  modelWeightManifestRef: stringFlag('--model-weight-manifest-ref'),
  externalBetaCpuStaticFeatureFlagEnabled:
    hasFlag('--external-beta-cpu-static-feature-flag-enabled'),
  externalBetaCpuStaticFeatureFlagRef:
    stringFlag('--external-beta-cpu-static-feature-flag-ref'),
  externalBetaCpuStaticRuntimeAdmissionRef:
    stringFlag('--external-beta-cpu-static-runtime-admission-ref'),
  externalBetaCpuStaticToolAllowlistRef:
    stringFlag('--external-beta-cpu-static-tool-allowlist-ref'),
  externalBetaCpuStaticTrafficScopeRef:
    stringFlag('--external-beta-cpu-static-traffic-scope-ref'),
  externalBetaCpuStaticTelemetryRef:
    stringFlag('--external-beta-cpu-static-telemetry-ref'),
  externalBetaCpuStaticSupportRef:
    stringFlag('--external-beta-cpu-static-support-ref'),
  externalBetaCpuStaticCostGuardrailRef:
    stringFlag('--external-beta-cpu-static-cost-guardrail-ref'),
  externalBetaCpuStaticWorkerPoolRef:
    stringFlag('--external-beta-cpu-static-worker-pool-ref'),
}

const report = evaluateAiGraphicsExternalBetaCpuStaticRuntimeAdmission(input)

console.log(JSON.stringify({
  ...report,
  input: {
    evaluatorOnly: true,
    sourceCpuStaticCohortAdmissionPacketRead:
      Boolean(stringFlag('--external-beta-cpu-static-cohort-admission-packet')),
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
