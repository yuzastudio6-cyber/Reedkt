import fs from 'node:fs'
import {
  buildAiGraphicsExternalAgentExecutionGate,
  type AiGraphics21ToolProperInstallAudit,
  type AiGraphicsExternalAgentExecutionGateInput,
  type AiGraphicsExternalBetaToolCallRouteBrowserRuntimeControlledExecutionSmokePacket,
  type AiGraphicsExternalBetaToolCallRouteCpuStaticControlledExecutionSmokePacket,
  type AiGraphicsExternalBetaToolCallRouteGpuModelRuntimeAdmissionSmokePacket,
  type AiGraphicsExternalBetaToolCallRouteMockQueueWorkerClaimSmokePacket,
  type AiGraphicsExternalBetaToolCallRouteReadinessProbeSmokePacket,
} from '../tool-registry/ai-graphics-external-agent-execution-gate'
import type {
  AiGraphicsExternalAgentToolAdapterAuthorizationReport,
} from '../tool-registry/ai-graphics-external-agent-tool-adapter-authorization'
import type {
  AiGraphicsExternalBetaCallableRequestAdmission,
} from '../tool-registry/ai-graphics-external-beta-callable-request-admission'
import type {
  AiGraphicsExternalBetaApiRouteMountReadiness,
} from '../tool-registry/ai-graphics-external-beta-api-route-mount-readiness'
import type {
  AiGraphicsExternalBetaControlledOnDemandStatusBridge,
} from '../tool-registry/ai-graphics-external-beta-controlled-on-demand-status-bridge'
import type {
  AiGraphicsExternalAgentCpuStaticPrivateWorkerLiveAdapterInvocationQueueWriteProofReport,
} from '../tool-registry/ai-graphics-external-agent-cpu-static-private-worker-live-adapter-invocation-queue-write-proof'
import type {
  AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionReport,
} from '../tool-registry/ai-graphics-external-agent-cpu-static-private-worker-exact-execution-admission'
import type {
  AiGraphicsExternalAgentCpuStaticPrivateWorkerAdapterInvocationEnqueueAdmissionReport,
} from '../tool-registry/ai-graphics-external-agent-cpu-static-private-worker-adapter-invocation-enqueue-admission'
import type {
  AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflightReport,
} from '../tool-registry/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight'
import type {
  AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionEvidenceSequencePacket,
} from '../tool-registry/ai-graphics-external-agent-execution-gate'
import type {
  AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeProofReport,
} from '../tool-registry/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof'
import type {
  AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimAndDispatchSmokeProofReport,
} from '../tool-registry/ai-graphics-external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof'
import type {
  AiGraphicsExternalAgentCpuStaticPrivateWorkerToolExecutionDryRunProofReport,
} from '../tool-registry/ai-graphics-external-agent-cpu-static-private-worker-tool-execution-dry-run-proof'
import type {
  AiGraphicsExternalAgentCpuStaticPrivateWorkerControlledToolExecutionProofReport,
} from '../tool-registry/ai-graphics-external-agent-cpu-static-private-worker-controlled-tool-execution-proof'

function valueAfterFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function readJsonFile<T>(flag: string): T | undefined {
  const packetPath = valueAfterFlag(flag)
  if (!packetPath) return undefined
  return JSON.parse(fs.readFileSync(packetPath, 'utf8')) as T
}

const input: AiGraphicsExternalAgentExecutionGateInput = {
  source21ToolProperInstallAuditPacket:
    readJsonFile<Partial<AiGraphics21ToolProperInstallAudit>>(
      '--proper-install-audit-packet',
    ),
  sourceExternalBetaCallableRequestAdmissionPacket:
    readJsonFile<Partial<AiGraphicsExternalBetaCallableRequestAdmission>>(
      '--external-beta-callable-request-admission-packet',
    ),
  sourceExternalBetaApiRouteMountReadinessPacket:
    readJsonFile<Partial<AiGraphicsExternalBetaApiRouteMountReadiness>>(
      '--external-beta-api-route-mount-readiness-packet',
    ),
  sourceExternalBetaControlledOnDemandStatusBridgePacket:
    readJsonFile<Partial<AiGraphicsExternalBetaControlledOnDemandStatusBridge>>(
      '--external-beta-controlled-on-demand-status-bridge-packet',
    ),
  sourceExternalAgentCpuStaticLiveAdapterQueueWriteProofPacket:
    readJsonFile<Partial<AiGraphicsExternalAgentCpuStaticPrivateWorkerLiveAdapterInvocationQueueWriteProofReport>>(
      '--external-agent-cpu-static-live-adapter-queue-write-proof-packet',
    ),
  sourceExternalAgentCpuStaticExactExecutionAdmissionPacket:
    readJsonFile<Partial<AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionReport>>(
      '--external-agent-cpu-static-exact-execution-admission-packet',
    ),
  sourceExternalAgentCpuStaticAdapterInvocationEnqueueAdmissionPacket:
    readJsonFile<Partial<AiGraphicsExternalAgentCpuStaticPrivateWorkerAdapterInvocationEnqueueAdmissionReport>>(
      '--external-agent-cpu-static-adapter-invocation-enqueue-admission-packet',
    ),
  sourceExternalAgentCpuStaticNonProductionServiceRoleQueueWriteSmokePreflightPacket:
    readJsonFile<Partial<AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflightReport>>(
      '--external-agent-cpu-static-non-production-service-role-queue-write-smoke-preflight-packet',
    ),
  sourceExternalAgentCpuStaticNonProductionEvidenceSequencePacket:
    readJsonFile<Partial<AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionEvidenceSequencePacket>>(
      '--external-agent-cpu-static-non-production-evidence-sequence-packet',
    ),
  sourceExternalAgentCpuStaticNonProductionServiceRoleQueueWriteSmokeProofPacket:
    readJsonFile<Partial<AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeProofReport>>(
      '--external-agent-cpu-static-non-production-service-role-queue-write-smoke-proof-packet',
    ),
  sourceExternalAgentCpuStaticWorkerClaimAndDispatchSmokeProofPacket:
    readJsonFile<Partial<AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimAndDispatchSmokeProofReport>>(
      '--external-agent-cpu-static-worker-claim-and-dispatch-smoke-proof-packet',
    ),
  sourceExternalAgentCpuStaticToolExecutionDryRunProofPacket:
    readJsonFile<Partial<AiGraphicsExternalAgentCpuStaticPrivateWorkerToolExecutionDryRunProofReport>>(
      '--external-agent-cpu-static-tool-execution-dry-run-proof-packet',
    ),
  sourceExternalAgentCpuStaticControlledToolExecutionProofPacket:
    readJsonFile<Partial<AiGraphicsExternalAgentCpuStaticPrivateWorkerControlledToolExecutionProofReport>>(
      '--external-agent-cpu-static-controlled-tool-execution-proof-packet',
    ),
  sourceExternalBetaToolCallRouteReadinessProbeSmokePacket:
    readJsonFile<Partial<AiGraphicsExternalBetaToolCallRouteReadinessProbeSmokePacket>>(
      '--external-beta-tool-call-route-readiness-probe-smoke-packet',
    ),
  sourceExternalBetaToolCallRouteCpuStaticControlledExecutionSmokePacket:
    readJsonFile<Partial<AiGraphicsExternalBetaToolCallRouteCpuStaticControlledExecutionSmokePacket>>(
      '--external-beta-tool-call-route-cpu-static-controlled-execution-smoke-packet',
    ),
  sourceExternalBetaToolCallRouteBrowserRuntimeControlledExecutionSmokePacket:
    readJsonFile<Partial<AiGraphicsExternalBetaToolCallRouteBrowserRuntimeControlledExecutionSmokePacket>>(
      '--external-beta-tool-call-route-browser-runtime-controlled-execution-smoke-packet',
    ),
  sourceExternalBetaToolCallRouteGpuModelRuntimeAdmissionSmokePacket:
    readJsonFile<Partial<AiGraphicsExternalBetaToolCallRouteGpuModelRuntimeAdmissionSmokePacket>>(
      '--external-beta-tool-call-route-gpu-model-runtime-admission-smoke-packet',
    ),
  sourceExternalBetaToolCallRouteMockQueueWorkerClaimSmokePacket:
    readJsonFile<Partial<AiGraphicsExternalBetaToolCallRouteMockQueueWorkerClaimSmokePacket>>(
      '--external-beta-tool-call-route-mock-queue-worker-claim-smoke-packet',
    ),
  sourceExternalAgentToolAdapterAuthorizationPacket:
    readJsonFile<Partial<AiGraphicsExternalAgentToolAdapterAuthorizationReport>>(
      '--external-agent-tool-adapter-authorization-packet',
    ),
}

const gate = buildAiGraphicsExternalAgentExecutionGate(input)
const requireGo = process.argv.includes('--require-go')

console.log(JSON.stringify({
  ...gate,
  input: {
    evaluatorOnly: true,
    requireGo,
    properInstallAuditPacketRead:
      Boolean(valueAfterFlag('--proper-install-audit-packet')),
    callableRequestAdmissionPacketRead:
      Boolean(valueAfterFlag('--external-beta-callable-request-admission-packet')),
    apiRouteMountReadinessPacketRead:
      Boolean(valueAfterFlag('--external-beta-api-route-mount-readiness-packet')),
    controlledOnDemandStatusBridgePacketRead:
      Boolean(valueAfterFlag('--external-beta-controlled-on-demand-status-bridge-packet')),
    externalAgentCpuStaticLiveAdapterQueueWriteProofPacketRead:
      Boolean(valueAfterFlag('--external-agent-cpu-static-live-adapter-queue-write-proof-packet')),
    externalAgentCpuStaticExactExecutionAdmissionPacketRead:
      Boolean(valueAfterFlag('--external-agent-cpu-static-exact-execution-admission-packet')),
    externalAgentCpuStaticAdapterInvocationEnqueueAdmissionPacketRead:
      Boolean(valueAfterFlag('--external-agent-cpu-static-adapter-invocation-enqueue-admission-packet')),
    externalAgentCpuStaticNonProductionServiceRoleQueueWriteSmokePreflightPacketRead:
      Boolean(valueAfterFlag('--external-agent-cpu-static-non-production-service-role-queue-write-smoke-preflight-packet')),
    externalAgentCpuStaticNonProductionEvidenceSequencePacketRead:
      Boolean(valueAfterFlag('--external-agent-cpu-static-non-production-evidence-sequence-packet')),
    externalAgentCpuStaticNonProductionServiceRoleQueueWriteSmokeProofPacketRead:
      Boolean(valueAfterFlag('--external-agent-cpu-static-non-production-service-role-queue-write-smoke-proof-packet')),
    externalAgentCpuStaticWorkerClaimAndDispatchSmokeProofPacketRead:
      Boolean(valueAfterFlag('--external-agent-cpu-static-worker-claim-and-dispatch-smoke-proof-packet')),
    externalAgentCpuStaticToolExecutionDryRunProofPacketRead:
      Boolean(valueAfterFlag('--external-agent-cpu-static-tool-execution-dry-run-proof-packet')),
    externalAgentCpuStaticControlledToolExecutionProofPacketRead:
      Boolean(valueAfterFlag('--external-agent-cpu-static-controlled-tool-execution-proof-packet')),
    externalBetaToolCallRouteReadinessProbeSmokePacketRead:
      Boolean(valueAfterFlag('--external-beta-tool-call-route-readiness-probe-smoke-packet')),
    externalBetaToolCallRouteCpuStaticControlledExecutionSmokePacketRead:
      Boolean(valueAfterFlag('--external-beta-tool-call-route-cpu-static-controlled-execution-smoke-packet')),
    externalBetaToolCallRouteBrowserRuntimeControlledExecutionSmokePacketRead:
      Boolean(valueAfterFlag('--external-beta-tool-call-route-browser-runtime-controlled-execution-smoke-packet')),
    externalBetaToolCallRouteGpuModelRuntimeAdmissionSmokePacketRead:
      Boolean(valueAfterFlag('--external-beta-tool-call-route-gpu-model-runtime-admission-smoke-packet')),
    externalBetaToolCallRouteMockQueueWorkerClaimSmokePacketRead:
      Boolean(valueAfterFlag('--external-beta-tool-call-route-mock-queue-worker-claim-smoke-packet')),
    externalAgentToolAdapterAuthorizationPacketRead:
      Boolean(valueAfterFlag('--external-agent-tool-adapter-authorization-packet')),
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
    supabaseMutationPerformed: false,
    gcsUploadPerformed: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
  },
}, null, 2))

if (requireGo && !gate.executionAllowedNow) {
  process.exitCode = gate.requireGoExitCodeWhenBlocked
}
