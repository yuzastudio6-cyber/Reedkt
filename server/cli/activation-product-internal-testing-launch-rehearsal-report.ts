import {
  buildProductInternalTestingLaunchRehearsalReports,
  writeProductInternalTestingLaunchRehearsalArtifacts,
} from '../activation/product-internal-testing-launch-rehearsal'

const reports = buildProductInternalTestingLaunchRehearsalReports()
await writeProductInternalTestingLaunchRehearsalArtifacts(reports)
console.log(JSON.stringify(reports.readinessReport, null, 2))
