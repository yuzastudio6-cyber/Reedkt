import { buildTrackIntegrationAuditCommandPlans, runTrackIntegrationAudit } from '../activation/track-integration-audit'

const execute = process.argv.includes('--execute')

if (!execute) {
  console.log('Phase 47A Track integration audit is static/report-only by default. Pass --execute with REEDITPRO_CONFIRM_TRACK_INTEGRATION_AUDIT=true to upload one private JSON audit package.')
  console.log(JSON.stringify(buildTrackIntegrationAuditCommandPlans(), null, 2))
} else {
  const result = await runTrackIntegrationAudit({ execute })
  console.log(JSON.stringify({
    evidence: result.evidence,
    executionReport: result.executionReport,
    localReportPath: result.localReportPath,
    iamChanges: result.iamChanges,
  }, null, 2))
}
