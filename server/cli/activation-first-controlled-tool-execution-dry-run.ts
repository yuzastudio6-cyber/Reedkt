import {
  SELECTED_FIRST_CONTROLLED_TOOL_CANDIDATE,
  forbiddenConfirmationFragments,
  requiredConfirmations,
  summarizeFirstControlledToolExecutionDryRun,
  writeFirstControlledToolExecutionDryRunArtifacts,
} from '../activation/first-controlled-tool-execution-dry-run'

const execute = process.argv.includes('--execute')
const metadataOnly = process.argv.includes('--metadata-only')
const selectedCandidateIndex = process.argv.indexOf('--selected-candidate')
const selectedCandidate =
  selectedCandidateIndex >= 0 && process.argv[selectedCandidateIndex + 1]
    ? process.argv[selectedCandidateIndex + 1]
    : SELECTED_FIRST_CONTROLLED_TOOL_CANDIDATE

const required = requiredConfirmations()

if (!execute) {
  console.log(summarizeFirstControlledToolExecutionDryRun())
  process.exit(0)
}

if (!metadataOnly) {
  throw new Error('Use --metadata-only. This dry-run cannot execute broad tools, routes, workers, providers, Supabase writes, GCS uploads, media, public artifacts, signed URLs, or runtime paths.')
}

if (selectedCandidate !== SELECTED_FIRST_CONTROLLED_TOOL_CANDIDATE) {
  throw new Error(`Selected candidate must be ${SELECTED_FIRST_CONTROLLED_TOOL_CANDIDATE}; received ${selectedCandidate}`)
}

const missing = required.filter((name) => process.env[name] !== 'true')
if (missing.length) throw new Error(`Missing required confirmations: ${missing.join(', ')}`)

const forbidden = Object.entries(process.env)
  .filter(([name, value]) => name.startsWith('REEDITPRO_CONFIRM_') && value === 'true' && !required.includes(name))
  .map(([name]) => name)
  .filter((name) => forbiddenConfirmationFragments().some((fragment) => name.includes(fragment)))
if (forbidden.length) throw new Error(`Forbidden confirmations set: ${forbidden.join(', ')}`)

const reports = writeFirstControlledToolExecutionDryRunArtifacts(selectedCandidate)
console.log(summarizeFirstControlledToolExecutionDryRun(reports))
