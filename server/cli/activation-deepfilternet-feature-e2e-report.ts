import {
  buildDeepFilterNetFeatureE2EReport,
  summarizeDeepFilterNetFeatureE2EReport,
} from '../activation/deepfilternet-feature-e2e'

const report = buildDeepFilterNetFeatureE2EReport()
if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2))
else console.log(summarizeDeepFilterNetFeatureE2EReport(report))
