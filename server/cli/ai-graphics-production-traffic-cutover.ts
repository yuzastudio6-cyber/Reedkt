import fs from 'node:fs'
import {
  buildAiGraphicsProductionTrafficCutover,
} from '../tool-registry/ai-graphics-production-traffic-cutover'
import type {
  AiGraphicsProductionLaunchGoNoGo,
} from '../tool-registry/ai-graphics-production-launch-go-no-go'

function valueAfterFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function readJsonFile<T>(flag: string): T | undefined {
  const packetPath = valueAfterFlag(flag)
  if (!packetPath) return undefined
  return JSON.parse(fs.readFileSync(packetPath, 'utf8')) as T
}

const report = buildAiGraphicsProductionTrafficCutover({
  sourceProductionLaunchGoNoGoPacket:
    readJsonFile<AiGraphicsProductionLaunchGoNoGo>(
      '--production-launch-go-no-go-packet',
    ),
  productionTrafficSwitchApprovalRef:
    valueAfterFlag('--production-traffic-switch-approval-ref'),
  productionRouteReadinessRef:
    valueAfterFlag('--production-route-readiness-ref'),
  productionWorkerReadinessRef:
    valueAfterFlag('--production-worker-readiness-ref'),
  productionPrivateArtifactStoreRef:
    valueAfterFlag('--production-private-artifact-store-ref'),
  productionMonitoringLiveDashboardRef:
    valueAfterFlag('--production-monitoring-live-dashboard-ref'),
  productionRollbackDrillRef:
    valueAfterFlag('--production-rollback-drill-ref'),
  productionCanaryCohortActiveRef:
    valueAfterFlag('--production-canary-cohort-active-ref'),
  productionSupportOnCallActiveRef:
    valueAfterFlag('--production-support-on-call-active-ref'),
  productionCostGuardrailLiveRef:
    valueAfterFlag('--production-cost-guardrail-live-ref'),
  productionPrivacyRetentionLiveRef:
    valueAfterFlag('--production-privacy-retention-live-ref'),
  productionPostCutoverReviewOwnerRef:
    valueAfterFlag('--production-post-cutover-review-owner-ref'),
  productionLaunchApproverRole:
    valueAfterFlag('--production-launch-approver-role') ??
    'AI_GRAPHICS_PRODUCTION_LAUNCH_OWNER',
})

console.log(JSON.stringify({
  ...report,
  input: {
    evaluatorOnly: true,
    productionLaunchGoNoGoPacketRead:
      Boolean(valueAfterFlag('--production-launch-go-no-go-packet')),
    productionTrafficCutoverMetadataOnly: true,
    directAgentToolExecutionPerformed: false,
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
