import fs from 'node:fs'
import {
  buildAiGraphicsExternalAgentExecutionGate,
  type AiGraphics21ToolProperInstallAudit,
  type AiGraphicsExternalAgentExecutionGateInput,
} from '../tool-registry/ai-graphics-external-agent-execution-gate'
import type {
  AiGraphicsExternalBetaCallableRequestAdmission,
} from '../tool-registry/ai-graphics-external-beta-callable-request-admission'
import type {
  AiGraphicsExternalBetaApiRouteMountReadiness,
} from '../tool-registry/ai-graphics-external-beta-api-route-mount-readiness'
import type {
  AiGraphicsExternalBetaControlledOnDemandStatusBridge,
} from '../tool-registry/ai-graphics-external-beta-controlled-on-demand-status-bridge'

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
