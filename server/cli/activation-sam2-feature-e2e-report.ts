import {
  buildSam2FeatureE2EReport,
  summarizeSam2FeatureE2EReport,
} from '../activation/sam2-feature-e2e'

const json = process.argv.includes('--json')
const report = buildSam2FeatureE2EReport()

console.log(json ? JSON.stringify(report, null, 2) : summarizeSam2FeatureE2EReport(report))
