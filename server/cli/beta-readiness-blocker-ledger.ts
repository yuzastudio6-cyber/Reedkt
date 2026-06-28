import { buildBetaReadinessBlockerLedger } from '../beta-readiness'

const report = buildBetaReadinessBlockerLedger()
console.log(JSON.stringify(report, null, 2))
