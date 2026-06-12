import {
  runSupabaseRegistryRestore,
  summarizeSupabaseRegistryRestoreReport,
} from '../activation/supabase-registry-restore'

const json = process.argv.includes('--json')
const report = await runSupabaseRegistryRestore()
console.log(json ? JSON.stringify(report, null, 2) : summarizeSupabaseRegistryRestoreReport(report))
