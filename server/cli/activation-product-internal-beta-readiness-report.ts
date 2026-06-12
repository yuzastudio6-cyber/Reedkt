import {
  buildProductInternalBetaReadinessReports,
  writeProductInternalBetaReadinessArtifacts,
} from '../activation/product-internal-beta-readiness'

const reports = buildProductInternalBetaReadinessReports()
await writeProductInternalBetaReadinessArtifacts(reports)
console.log(JSON.stringify(reports.summary, null, 2))
