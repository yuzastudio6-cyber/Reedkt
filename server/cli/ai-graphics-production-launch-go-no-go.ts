import fs from 'node:fs'
import {
  buildAiGraphicsProductionLaunchGoNoGo,
} from '../tool-registry/ai-graphics-production-launch-go-no-go'
import type {
  AiGraphicsProductionLaunchControls,
} from '../tool-registry/ai-graphics-production-launch-controls'

function valueAfterFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function readJsonFile<T>(flag: string): T | undefined {
  const packetPath = valueAfterFlag(flag)
  if (!packetPath) return undefined
  return JSON.parse(fs.readFileSync(packetPath, 'utf8')) as T
}

const report = buildAiGraphicsProductionLaunchGoNoGo({
  sourceProductionLaunchControlsPacket:
    readJsonFile<AiGraphicsProductionLaunchControls>(
      '--production-launch-controls-packet',
    ),
  productionFinalGoNoGoApprovalRef:
    valueAfterFlag('--production-final-go-no-go-approval-ref'),
  productionTrafficCutoverPlanRef:
    valueAfterFlag('--production-traffic-cutover-plan-ref'),
  productionFeatureFlagCutoverRef:
    valueAfterFlag('--production-feature-flag-cutover-ref'),
  productionCanaryRampPlanRef:
    valueAfterFlag('--production-canary-ramp-plan-ref'),
  productionRollbackOperatorAckRef:
    valueAfterFlag('--production-rollback-operator-ack-ref'),
  productionMonitoringOnCallAckRef:
    valueAfterFlag('--production-monitoring-on-call-ack-ref'),
  productionCostCeilingFinalAckRef:
    valueAfterFlag('--production-cost-ceiling-final-ack-ref'),
  productionPrivacyRetentionFinalAckRef:
    valueAfterFlag('--production-privacy-retention-final-ack-ref'),
  productionPostCutoverReviewScheduleRef:
    valueAfterFlag('--production-post-cutover-review-schedule-ref'),
  productionLaunchApproverRole:
    valueAfterFlag('--production-launch-approver-role') ??
    'AI_GRAPHICS_PRODUCTION_LAUNCH_OWNER',
})

console.log(JSON.stringify({
  ...report,
  input: {
    evaluatorOnly: true,
    productionLaunchControlsPacketRead:
      Boolean(valueAfterFlag('--production-launch-controls-packet')),
    productionGoNoGoMetadataOnly: true,
    productionTrafficCutoverPerformed: false,
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
