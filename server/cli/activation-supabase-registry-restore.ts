import {
  runSupabaseRegistryRestore,
  summarizeSupabaseRegistryRestoreReport,
} from '../activation/supabase-registry-restore'

const json = process.argv.includes('--json')
const execute = process.argv.includes('--execute')
const report = await runSupabaseRegistryRestore({ execute })
console.log(json ? JSON.stringify(report, null, 2) : summarizeSupabaseRegistryRestoreReport(report))
