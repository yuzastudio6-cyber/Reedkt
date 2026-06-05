import { buildSystemReadinessReport, summarizeSystemReadinessReport } from '../activation/system-readiness-reconciliation'

console.log(summarizeSystemReadinessReport(buildSystemReadinessReport()))
