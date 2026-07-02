import { buildBetaReadinessReport } from '../beta-readiness'
import { buildBetaReadinessBlockerCloseoutQueue } from '../beta-readiness/beta-readiness-blocker-closeout-queue'
import { buildBetaReadinessExternalBetaOperatorLocalEnvPreflight } from './beta-readiness-external-beta-operator-local-env-preflight.mjs'

const report = buildBetaReadinessReport()
const closeoutQueue = buildBetaReadinessBlockerCloseoutQueue()
const nextBatch = closeoutQueue.batches[0]
const localOperatorEnvPath = process.env.REEDITPRO_BETA_OPERATOR_ENV_FILE
const localOperatorEnvProgress = localOperatorEnvPath
  ? buildBetaReadinessExternalBetaOperatorLocalEnvPreflight({ env: process.env })
  : undefined

console.log([
  `Beta readiness: ${report.overallStatus}`,
  `Internal dry-run allowed: ${report.goNoGo.internalDryRunTestingAllowed}`,
  `External beta allowed: ${report.goNoGo.externalBetaAllowed}`,
  `Real user media beta allowed: ${report.goNoGo.realUserMediaBetaAllowed}`,
  `Paid production allowed: ${report.goNoGo.paidProductionAllowed}`,
  `Scenarios: ${report.scenarioMatrix.length}`,
  `Tool execution: ${report.toolExecutionReadiness.ownerCoverageToolCount}/${report.toolExecutionReadiness.totalTools} owner-covered, ${report.toolExecutionReadiness.readinessSpecToolCount}/${report.toolExecutionReadiness.totalTools} readiness specs, external beta execution allowed: ${report.toolExecutionReadiness.externalBetaToolExecutionAllowed}`,
  `Tool execution blockers: ${report.toolExecutionReadiness.blockers.length}`,
  `Tool execution platform blockers: ${report.toolExecutionReadiness.platformBlockers.length}`,
  `Track B local bundle: ${closeoutQueue.sourceTruth.locallyAcceptedToolCount} bounded accepted-proven ready to record, ${closeoutQueue.sourceTruth.productReadyLocalOssCount} deployed product-ready`,
  `Track B product-ready source closeout: ${closeoutQueue.sourceTruth.trackBProductReadySourceCount} product-ready for ranked tool-call lane, deployed evidence recorded: ${closeoutQueue.sourceTruth.activeBetaProductReadyDeployedEvidenceCount}`,
  `Pending operator inputs: ${closeoutQueue.sourceTruth.pendingOperatorInputsInBlankEnv}/${closeoutQueue.sourceTruth.requiredOperatorInputs} (${closeoutQueue.sourceTruth.humanActionablePendingOperatorInputs} human-actionable, ${closeoutQueue.sourceTruth.autoFillablePendingOperatorInputs} auto-fillable constants/keys)`,
  ...(localOperatorEnvProgress ? [
    `Operator local env progress: ${localOperatorEnvProgress.operatorInputs.pending}/${localOperatorEnvProgress.operatorInputs.required} pending after auto-fill (${localOperatorEnvProgress.operatorInputs.humanActionablePending} human-actionable, ${localOperatorEnvProgress.operatorInputs.autoFillablePending} auto-fillable pending)`,
    `Operator local env safety: loaded=${localOperatorEnvProgress.envFile.loaded}, owner-only=${localOperatorEnvProgress.envFile.ownerOnlyPermissions ?? 'not_applicable'}, git-ignored=${localOperatorEnvProgress.envFile.gitIgnored ?? 'not_applicable'}, safety gaps=${localOperatorEnvProgress.safetyGaps.length}`,
    `Owner/deployed readiness from local env: owner pending=${localOperatorEnvProgress.ownerApprovalIntake.counts.pending}, deployed manifest pending=${localOperatorEnvProgress.deployedEvidenceInputManifest.pendingRequiredInputs}, collector ready=${localOperatorEnvProgress.readyForExternalBetaEvidenceCollector}`,
  ] : []),
  `Next closeout batch: ${nextBatch.batchId} (${nextBatch.rowCount}) - ${nextBatch.title}`,
  `Next commands: ${nextBatch.nextCommands.join(' -> ')}`,
  'Production/external beta remains blocked until human-run deployment, readiness, model/license, security, and cost approvals pass.',
].join('\n'))
