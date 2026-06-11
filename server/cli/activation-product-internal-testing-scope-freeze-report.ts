import {
  buildProductInternalTestingScopeFreezeReports,
  writeProductInternalTestingScopeFreezeArtifacts,
} from '../activation/product-internal-testing-scope-freeze'

const reports = buildProductInternalTestingScopeFreezeReports()
await writeProductInternalTestingScopeFreezeArtifacts(reports)
console.log(JSON.stringify(reports.readinessReport, null, 2))
