import { buildHybridSearchConsensusReport, summarizeHybridSearchConsensusReport } from '../activation/hybrid-search-consensus-e2e'

const json = process.argv.includes('--json')
const report = buildHybridSearchConsensusReport()

if (json) {
  console.log(JSON.stringify(report, null, 2))
} else {
  console.log(summarizeHybridSearchConsensusReport(report))
}
