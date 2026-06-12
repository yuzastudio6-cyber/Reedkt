import {
  buildProductInternalTestingStartGateReports,
  writeProductInternalTestingStartGateArtifacts,
} from '../activation/product-internal-testing-start-gate'

const reports = buildProductInternalTestingStartGateReports()
await writeProductInternalTestingStartGateArtifacts(reports)
console.log(JSON.stringify(reports.readinessReport, null, 2))
