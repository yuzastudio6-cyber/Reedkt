import {
  forbiddenConfirmationFragments,
  readOpenSourceToolStackPackageBinaryExecutionArtifacts,
  requiredConfirmations,
  summarizeOpenSourceToolStackPackageBinaryExecution,
  writeOpenSourceToolStackPackageBinaryExecutionArtifacts,
} from '../activation/open-source-missing-optional-package-binary-execution'

const execute = process.argv.includes('--execute')
const approvedPackagesOnly = process.argv.includes('--approved-packages-only')
const required = requiredConfirmations()

if (!execute) {
  console.log(
    summarizeOpenSourceToolStackPackageBinaryExecution(
      readOpenSourceToolStackPackageBinaryExecutionArtifacts() ?? undefined
    )
  )
  process.exit(0)
}

if (!approvedPackagesOnly) {
  throw new Error('Use --approved-packages-only. This packet may install only duckdb and nodejs-polars.')
}

const missing = required.filter((name) => process.env[name] !== 'true')
if (missing.length) throw new Error(`Missing required confirmations: ${missing.join(', ')}`)

const forbidden = Object.entries(process.env)
  .filter(([name, value]) => name.startsWith('REEDITPRO_CONFIRM_') && value === 'true' && !required.includes(name))
  .map(([name]) => name)
  .filter((name) => forbiddenConfirmationFragments().some((fragment) => name.includes(fragment)))

if (forbidden.length) throw new Error(`Forbidden confirmations set: ${forbidden.join(', ')}`)

const reports = writeOpenSourceToolStackPackageBinaryExecutionArtifacts({ execute: true })
console.log(summarizeOpenSourceToolStackPackageBinaryExecution(reports))
