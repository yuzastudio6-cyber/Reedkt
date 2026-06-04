import { buildSupabaseDataPlaneAuditReport, summarizeSupabaseDataPlaneAuditReport } from '../activation/supabase-data-plane-audit'

console.log(summarizeSupabaseDataPlaneAuditReport(buildSupabaseDataPlaneAuditReport()))
