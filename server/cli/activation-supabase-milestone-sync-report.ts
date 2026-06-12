import { buildSupabaseMilestoneSyncReport, summarizeSupabaseMilestoneSyncReport } from '../activation/supabase-milestone-sync'

const json = process.argv.includes('--json')
const report = buildSupabaseMilestoneSyncReport()
console.log(json ? JSON.stringify(report, null, 2) : summarizeSupabaseMilestoneSyncReport(report))
