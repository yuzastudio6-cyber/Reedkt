import { buildPrivateSearxngServiceReport, summarizePrivateSearxngServiceReport } from '../activation/private-searxng-service/private-searxng-report-builder'

const json = process.argv.includes('--json')
const report = buildPrivateSearxngServiceReport()

if (json) {
  console.log(JSON.stringify(report, null, 2))
} else {
  console.log(summarizePrivateSearxngServiceReport(report))
}
