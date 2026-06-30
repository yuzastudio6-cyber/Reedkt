import { buildBetaReadinessReport } from '../beta-readiness'
import { buildBetaReadinessBlockerCloseoutQueue } from '../beta-readiness/beta-readiness-blocker-closeout-queue'

const report = buildBetaReadinessReport()
const closeoutQueue = buildBetaReadinessBlockerCloseoutQueue()
const nextBatch = closeoutQueue.batches[0]

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
  `Next closeout batch: ${nextBatch.batchId} (${nextBatch.rowCount}) - ${nextBatch.title}`,
  `Next commands: ${nextBatch.nextCommands.join(' -> ')}`,
  'Production/external beta remains blocked until human-run deployment, readiness, model/license, security, and cost approvals pass.',
].join('\n'))
