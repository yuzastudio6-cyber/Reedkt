import { buildProColorImageFeatureE2EReport, summarizeProColorImageFeatureE2EReport } from '../activation/pro-color-image-feature-e2e'

const report = buildProColorImageFeatureE2EReport()
if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2))
else console.log(summarizeProColorImageFeatureE2EReport(report))
