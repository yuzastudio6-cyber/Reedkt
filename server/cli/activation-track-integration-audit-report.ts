import { buildTrackIntegrationAuditReport, summarizeTrackIntegrationAuditReport } from '../activation/track-integration-audit'

const json = process.argv.includes('--json')
const report = buildTrackIntegrationAuditReport()

if (json) {
  console.log(JSON.stringify(report, null, 2))
} else {
  console.log(summarizeTrackIntegrationAuditReport(report))
}
