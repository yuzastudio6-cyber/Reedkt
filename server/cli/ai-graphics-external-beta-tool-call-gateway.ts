import fs from 'node:fs'
import {
  evaluateAiGraphicsExternalBetaToolCallGateway,
  type AiGraphicsExternalBetaToolCallGatewayInput,
} from '../tool-registry/ai-graphics-external-beta-tool-call-gateway'
import type { AiGraphicsExternalBetaLaunchGoNoGo } from '../tool-registry/ai-graphics-external-beta-launch-go-no-go'
import type { AiGraphicsExternalBetaRuntimeAdmission } from '../tool-registry/ai-graphics-external-beta-runtime-admission'
import type {
  AiGraphicsExternalBetaCpuStaticRuntimeAdmission,
} from '../tool-registry/ai-graphics-external-beta-cpu-static-runtime-admission'

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

const input: AiGraphicsExternalBetaToolCallGatewayInput = {
  sourceExternalBetaCpuStaticRuntimeAdmissionPacket:
    readJsonFile<AiGraphicsExternalBetaCpuStaticRuntimeAdmission>(
      '--external-beta-cpu-static-runtime-admission-packet',
    ),
  sourceExternalBetaRuntimeAdmissionPacket:
    readJsonFile<AiGraphicsExternalBetaRuntimeAdmission>('--external-beta-runtime-admission-packet'),
  sourceExternalBetaLaunchGoNoGoPacket:
    readJsonFile<AiGraphicsExternalBetaLaunchGoNoGo>('--external-beta-launch-go-no-go-packet'),
  capabilityId: stringFlag('--capability-id') ?? 'background_removal',
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
  externalBetaFeatureFlagEnabled: hasFlag('--external-beta-feature-flag-enabled'),
  externalBetaFeatureFlagRef: stringFlag('--external-beta-feature-flag-ref'),
  externalBetaRuntimeAdmissionRef: stringFlag('--external-beta-runtime-admission-ref'),
  externalBetaToolAllowlistRef: stringFlag('--external-beta-tool-allowlist-ref'),
  externalBetaTrafficScopeRef: stringFlag('--external-beta-traffic-scope-ref'),
  externalBetaTelemetryRef: stringFlag('--external-beta-telemetry-ref'),
  externalBetaSupportRef: stringFlag('--external-beta-support-ref'),
  externalBetaCostGuardrailRef: stringFlag('--external-beta-cost-guardrail-ref'),
  externalBetaWorkerPoolRef: stringFlag('--external-beta-worker-pool-ref'),
  externalBetaGpuConcurrencyRef: stringFlag('--external-beta-gpu-concurrency-ref'),
  externalBetaUserId: stringFlag('--external-beta-user-id'),
  externalBetaWorkspaceId: stringFlag('--external-beta-workspace-id'),
  externalBetaRequestId: stringFlag('--external-beta-request-id'),
  externalBetaToolCallGatewayRef: stringFlag('--external-beta-tool-call-gateway-ref'),
  externalBetaFeatureFlagEvaluationRef:
    stringFlag('--external-beta-feature-flag-evaluation-ref'),
  externalBetaRolloutAssignmentRef: stringFlag('--external-beta-rollout-assignment-ref'),
  externalBetaRateLimitDecisionRef: stringFlag('--external-beta-rate-limit-decision-ref'),
  externalBetaCostCeilingDecisionRef: stringFlag('--external-beta-cost-ceiling-decision-ref'),
  externalBetaAuditEventRef: stringFlag('--external-beta-audit-event-ref'),
  externalBetaTraceId: stringFlag('--external-beta-trace-id'),
  externalBetaIdempotencyKey: stringFlag('--external-beta-idempotency-key'),
  externalBetaWorkerEnqueueCandidateRef:
    stringFlag('--external-beta-worker-enqueue-candidate-ref'),
}

const report = evaluateAiGraphicsExternalBetaToolCallGateway(input)

console.log(JSON.stringify({
  ...report,
  input: {
    evaluatorOnly: true,
    sourceRuntimeAdmissionPacketRead:
      Boolean(stringFlag('--external-beta-runtime-admission-packet')),
    sourceCpuStaticRuntimeAdmissionPacketRead:
      Boolean(stringFlag('--external-beta-cpu-static-runtime-admission-packet')),
    sourceLaunchGoNoGoPacketRead:
      Boolean(stringFlag('--external-beta-launch-go-no-go-packet')),
    dependencyInstallPerformed: false,
    packageLockMutationPerformed: false,
    toolExecutionPerformed: false,
    workerExecutionPerformed: false,
    workerEnqueuePerformed: false,
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
