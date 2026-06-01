import { listToolReadiness } from '../foundation/tool-readiness'

const result = listToolReadiness()

console.log(JSON.stringify({
  ok: result.diagnostics.status === 'passed',
  status: result.diagnostics.status,
  registrySize: result.tools.length,
  failedCheckIds: result.diagnostics.failedCheckIds,
  warningCheckIds: result.diagnostics.warningCheckIds,
  runtimeExecutionAllowed: result.policy.runtimeExecutionAllowed,
  providerExecutionAllowed: result.policy.providerExecutionAllowed,
  productionAllowed: result.policy.productionAllowed,
  externalBetaAllowed: result.policy.externalBetaAllowed,
  broadRealMediaAllowed: result.policy.broadRealMediaAllowed,
}, null, 2))

if (result.diagnostics.status !== 'passed') {
  process.exitCode = 1
}
