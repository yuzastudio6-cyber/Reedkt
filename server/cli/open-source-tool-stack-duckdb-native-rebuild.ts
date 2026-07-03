import {
  forbiddenConfirmationFragments,
  refreshOpenSourceToolStackDuckdbNativeRebuildArtifactsFromReports,
  requiredConfirmations,
  writeOpenSourceToolStackDuckdbNativeRebuildArtifacts,
} from '../activation/open-source-tool-stack-duckdb-native-rebuild-execution'

const execute = process.argv.includes('--execute')
const duckdbOnly = process.argv.includes('--duckdb-only')
const refreshFromReports = process.argv.includes('--refresh-from-reports')
const required = requiredConfirmations()

if (refreshFromReports) {
  const reports = refreshOpenSourceToolStackDuckdbNativeRebuildArtifactsFromReports()
  console.log(JSON.stringify(reports.decision, null, 2))
  process.exit(0)
}

if (!execute) {
  const reports = writeOpenSourceToolStackDuckdbNativeRebuildArtifacts({ execute: false })
  console.log(JSON.stringify(reports.decision, null, 2))
  process.exit(0)
}

if (!duckdbOnly) throw new Error('Use --duckdb-only. This packet may rebuild and prove only DuckDB.')

const missing = required.filter((name) => process.env[name] !== 'true')
const forbidden = Object.entries(process.env)
  .filter(([name, value]) => name.startsWith('REEDITPRO_CONFIRM_') && value === 'true' && !required.includes(name))
  .map(([name]) => name)
  .filter((name) => forbiddenConfirmationFragments().some((fragment) => name.includes(fragment)))

if (missing.length || forbidden.length) {
  throw new Error(`DuckDB native rebuild confirmation gate failed. Missing: ${missing.join(', ')} Forbidden: ${forbidden.join(', ')}`)
}

const reports = writeOpenSourceToolStackDuckdbNativeRebuildArtifacts({ execute: true })
console.log(JSON.stringify(reports.decision, null, 2))
