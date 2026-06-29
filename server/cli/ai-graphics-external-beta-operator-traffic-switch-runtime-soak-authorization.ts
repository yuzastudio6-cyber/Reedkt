import fs from 'node:fs'
import {
  evaluateAiGraphicsExternalBetaOperatorTrafficSwitchRuntimeSoakAuthorization,
} from '../tool-registry/ai-graphics-external-beta-operator-traffic-switch-runtime-soak-authorization'
import type {
  AiGraphicsExternalBetaPerToolTrafficEnablementGate,
} from '../tool-registry/ai-graphics-external-beta-per-tool-traffic-enablement-gate'

function valueAfterFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function readJsonFile<T>(flag: string): T | undefined {
  const packetPath = valueAfterFlag(flag)
  if (!packetPath) return undefined
  return JSON.parse(fs.readFileSync(packetPath, 'utf8')) as T
}

const gate =
  evaluateAiGraphicsExternalBetaOperatorTrafficSwitchRuntimeSoakAuthorization({
    sourcePerToolTrafficEnablementGatePacket:
      readJsonFile<AiGraphicsExternalBetaPerToolTrafficEnablementGate>(
        '--external-beta-per-tool-traffic-enablement-gate-packet',
      ),
    externalBetaOperatorTrafficSwitchApprovalRef:
      valueAfterFlag('--external-beta-operator-traffic-switch-approval-ref'),
    externalBetaRuntimeSoakPlanRef:
      valueAfterFlag('--external-beta-runtime-soak-plan-ref'),
    externalBetaRuntimeSoakWindowRef:
      valueAfterFlag('--external-beta-runtime-soak-window-ref'),
    externalBetaCanaryCohortRef:
      valueAfterFlag('--external-beta-canary-cohort-ref'),
    externalBetaMonitoringDashboardRef:
      valueAfterFlag('--external-beta-monitoring-dashboard-ref'),
    externalBetaAlertPolicyRef:
      valueAfterFlag('--external-beta-alert-policy-ref'),
    externalBetaRollbackPlaybookRef:
      valueAfterFlag('--external-beta-rollback-playbook-ref'),
    externalBetaSupportPagerRef:
      valueAfterFlag('--external-beta-support-pager-ref'),
    externalBetaCostBudgetRef:
      valueAfterFlag('--external-beta-cost-budget-ref'),
    externalBetaKillSwitchDrillRef:
      valueAfterFlag('--external-beta-kill-switch-drill-ref'),
    externalBetaPostSoakReviewRef:
      valueAfterFlag('--external-beta-post-soak-review-ref'),
  })

console.log(JSON.stringify({
  ...gate,
  input: {
    evaluatorOnly: true,
    trafficEnablementGatePacketRead:
      Boolean(valueAfterFlag('--external-beta-per-tool-traffic-enablement-gate-packet')),
    externalBetaTrafficSwitchEnabledByThisCommand: false,
    externalBetaRuntimeSoakStartedByThisCommand: false,
    dependencyInstallPerformed: false,
    packageLockMutationPerformed: false,
    apiRouteExecutionPerformed: false,
    toolExecutionPerformed: false,
    workerExecutionPerformed: false,
    workerEnqueuePerformed: false,
    routeExecutionPerformed: false,
    backendQueueSubmissionPerformed: false,
    privateArtifactWritePerformed: false,
    serviceRoleQueueSmokePerformed: false,
    serviceRoleTransactionPerformed: false,
    supabaseMutationPerformed: false,
    liveQueueWritePerformed: false,
    workerLeaseCreatedByThisCommand: false,
    workerDispatchPerformedByThisCommand: false,
    providerRuntimePerformed: false,
    browserWebglCanvasRuntimePerformed: false,
    gpuRuntimePerformedByThisCommand: false,
    modelWeightsDownloaded: false,
    modelWeightsLoaded: false,
    mediaProcessingPerformed: false,
    gcsUploadPerformed: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
  },
}, null, 2))
