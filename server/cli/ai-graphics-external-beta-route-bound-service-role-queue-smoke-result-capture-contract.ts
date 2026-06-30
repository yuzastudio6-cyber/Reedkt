import fs from 'node:fs'
import {
  evaluateAiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeResultCaptureContract,
  type AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeResultCaptureContractInput,
} from '../routes/ai-graphics-external-beta-route-bound-service-role-queue-smoke-result-capture-contract'

function stringFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  if (index === -1) return undefined
  return process.argv[index + 1]
}

function readJsonFile(flag: string): Record<string, unknown> | undefined {
  const packetPath = stringFlag(flag)
  if (!packetPath) return undefined
  return JSON.parse(fs.readFileSync(packetPath, 'utf8')) as Record<string, unknown>
}

const input: AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeResultCaptureContractInput = {
  sourceRouteBoundServiceRoleQueueSmokeRunbookAuthorizationPacket:
    readJsonFile('--route-bound-service-role-queue-smoke-runbook-authorization-packet'),
  sourceServiceRoleQueueSmokeProofValidatorPacket:
    readJsonFile('--service-role-queue-smoke-proof-validator-packet'),
  routeBoundServiceRoleQueueSmokeResultCaptureRef:
    stringFlag('--route-bound-service-role-queue-smoke-result-capture-ref'),
  routeBoundServiceRoleQueueSmokeEvidenceCaptureRef:
    stringFlag('--route-bound-service-role-queue-smoke-evidence-capture-ref'),
  routeBoundServiceRoleQueueSmokeTelemetryCaptureRef:
    stringFlag('--route-bound-service-role-queue-smoke-telemetry-capture-ref'),
  routeBoundServiceRoleQueueSmokeCleanupProofCaptureRef:
    stringFlag('--route-bound-service-role-queue-smoke-cleanup-proof-capture-ref'),
  routeBoundServiceRoleQueueSmokeProofValidatorRef:
    stringFlag('--route-bound-service-role-queue-smoke-proof-validator-ref'),
  routeBoundServiceRoleQueueSmokePostRunReviewRef:
    stringFlag('--route-bound-service-role-queue-smoke-post-run-review-ref'),
}

const report =
  evaluateAiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeResultCaptureContract(input)

console.log(JSON.stringify({
  ...report,
  input: {
    evaluatorOnly: true,
    sourceRouteBoundServiceRoleQueueSmokeRunbookAuthorizationPacketRead:
      Boolean(stringFlag('--route-bound-service-role-queue-smoke-runbook-authorization-packet')),
    sourceServiceRoleQueueSmokeProofValidatorPacketRead:
      Boolean(stringFlag('--service-role-queue-smoke-proof-validator-packet')),
    routeBoundServiceRoleQueueSmokeResultCaptureRefRead:
      Boolean(stringFlag('--route-bound-service-role-queue-smoke-result-capture-ref')),
    routeBoundServiceRoleQueueSmokeEvidenceCaptureRefRead:
      Boolean(stringFlag('--route-bound-service-role-queue-smoke-evidence-capture-ref')),
    routeBoundServiceRoleQueueSmokeTelemetryCaptureRefRead:
      Boolean(stringFlag('--route-bound-service-role-queue-smoke-telemetry-capture-ref')),
    routeBoundServiceRoleQueueSmokeCleanupProofCaptureRefRead:
      Boolean(stringFlag('--route-bound-service-role-queue-smoke-cleanup-proof-capture-ref')),
    routeBoundServiceRoleQueueSmokeProofValidatorRefRead:
      Boolean(stringFlag('--route-bound-service-role-queue-smoke-proof-validator-ref')),
    routeBoundServiceRoleQueueSmokePostRunReviewRefRead:
      Boolean(stringFlag('--route-bound-service-role-queue-smoke-post-run-review-ref')),
    dependencyInstallPerformed: false,
    packageLockMutationPerformed: false,
    privateArtifactWritePerformed: false,
    toolExecutionPerformed: false,
    workerExecutionPerformed: false,
    routeExecutionPerformed: false,
    backendQueueSubmissionPerformed: false,
    serviceRoleQueueSmokePerformed: false,
    serviceRoleTransactionPerformed: false,
    supabaseMutationPerformed: false,
    liveQueueWritePerformed: false,
    providerRuntimePerformed: false,
    browserWebglCanvasRuntimePerformed: false,
    gpuRuntimePerformed: false,
    modelWeightsDownloaded: false,
    modelWeightsLoaded: false,
    mediaProcessingPerformed: false,
    gcsUploadPerformed: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
  },
}, null, 2))
