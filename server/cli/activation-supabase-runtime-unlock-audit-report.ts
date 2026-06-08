import {
  SUPABASE_RUNTIME_UNLOCK_AUDIT_REPORT_DIR,
  buildSupabaseRuntimeUnlockAuditReports,
  writeSupabaseRuntimeUnlockAuditArtifacts,
} from '../activation/supabase-runtime-unlock-audit'

const reports = buildSupabaseRuntimeUnlockAuditReports()
await writeSupabaseRuntimeUnlockAuditArtifacts(reports)

console.log(JSON.stringify({
  status: reports.repoAudit.status,
  reportDir: SUPABASE_RUNTIME_UNLOCK_AUDIT_REPORT_DIR,
  reportsWritten: true,
  ownerAccepted: reports.repoAudit.ownerAccepted,
  currentUnlockStage: reports.repoAudit.currentUnlockStage,
  recommendedNextUnlockStage: reports.repoAudit.recommendedNextUnlockStage,
  selectedTransportStrategy: reports.deployTransportBlockerInventory.selectedStrategy,
  blockers: reports.deployTransportBlockerInventory.activeBlockers,
  sqlExecuted: false,
  migrationDeployed: false,
  secretPayloadAccess: false,
}, null, 2))
