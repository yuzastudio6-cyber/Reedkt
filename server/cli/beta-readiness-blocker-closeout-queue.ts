import { buildBetaReadinessBlockerCloseoutQueue } from '../beta-readiness'

const report = buildBetaReadinessBlockerCloseoutQueue()
console.log(JSON.stringify(report, null, 2))
