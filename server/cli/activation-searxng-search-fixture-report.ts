import { buildSearxngSearchFixtureReport, summarizeSearxngSearchFixtureReport } from '../activation/searxng-search-fixture'

const json = process.argv.includes('--json')
const report = buildSearxngSearchFixtureReport()

if (json) {
  console.log(JSON.stringify(report, null, 2))
} else {
  console.log(summarizeSearxngSearchFixtureReport(report))
}
