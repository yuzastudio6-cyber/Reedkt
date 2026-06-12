import {
  buildProductInternalTestingSession0Reports,
  writeProductInternalTestingSession0Artifacts,
} from '../activation/product-internal-testing-session-0'

const reports = buildProductInternalTestingSession0Reports()
await writeProductInternalTestingSession0Artifacts(reports)
console.log(JSON.stringify(reports.readinessReport, null, 2))
