import { buildCostControlSummary } from '../cost-controls'

const summary = buildCostControlSummary()

console.log([
  'Cost controls: static dry-run',
  `Production execution allowed: ${summary.productionExecutionAllowed}`,
  `GPU kill switch: ${summary.killSwitchPolicy.gpuWorkerKillSwitch}`,
  `Render kill switch: ${summary.killSwitchPolicy.renderWorkerKillSwitch}`,
  `Provider kill switch: ${summary.killSwitchPolicy.providerKillSwitch}`,
  `Max render concurrency: ${summary.renderPolicy.maxConcurrentRenderJobs}`,
  `Blockers: ${summary.blockers.length}`,
].join('\n'))
