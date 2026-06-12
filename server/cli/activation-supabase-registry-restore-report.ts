import {
  runSupabaseRegistryRestore,
  summarizeSupabaseRegistryRestoreReport,
} from '../activation/supabase-registry-restore'

const json = process.argv.includes('--json')
const report = await runSupabaseRegistryRestore({
  runId: process.env.REEDITPRO_SUPABASE_REGISTRY1_RUN_ID ?? 'registry1-planned',
  writeLocalArtifacts: false,
})

console.log(json ? JSON.stringify(report, null, 2) : summarizeSupabaseRegistryRestoreReport(report))
