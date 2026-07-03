import {
  SECOND_CONTROLLED_DRY_RUN_CANDIDATE_ID,
  forbiddenConfirmationFragments,
  requiredConfirmations,
  summarizeSecondControlledCandidateDryRun,
  writeSecondControlledCandidateDryRunArtifacts,
} from '../activation/second-controlled-candidate-dry-run'

const execute = process.argv.includes('--execute')
const metadataOnly = process.argv.includes('--metadata-only')
const selectedCandidateIndex = process.argv.indexOf('--selected-candidate')
const selectedCandidate =
  selectedCandidateIndex >= 0 && process.argv[selectedCandidateIndex + 1]
    ? process.argv[selectedCandidateIndex + 1]
    : SECOND_CONTROLLED_DRY_RUN_CANDIDATE_ID
const required = requiredConfirmations()

if (!execute) {
  console.log(summarizeSecondControlledCandidateDryRun())
  process.exit(0)
}

if (!metadataOnly) {
  throw new Error(
    'Use --metadata-only. This dry-run cannot execute broad tools, real routes, workers, providers, media/audio/render/image/browser/map paths, Supabase writes, SQL, GCS uploads, public artifacts, signed URLs, raw prompts, or runtime paths.'
  )
}

if (selectedCandidate !== SECOND_CONTROLLED_DRY_RUN_CANDIDATE_ID) {
  throw new Error(`Selected candidate must be ${SECOND_CONTROLLED_DRY_RUN_CANDIDATE_ID}; received ${selectedCandidate}`)
}

const missing = required.filter((name) => process.env[name] !== 'true')
if (missing.length) throw new Error(`Missing required confirmations: ${missing.join(', ')}`)

const forbidden = Object.entries(process.env)
  .filter(([name, value]) => name.startsWith('REEDITPRO_CONFIRM_') && value === 'true' && !required.includes(name))
  .map(([name]) => name)
  .filter((name) => forbiddenConfirmationFragments().some((fragment) => name.includes(fragment)))
if (forbidden.length) throw new Error(`Forbidden confirmations set: ${forbidden.join(', ')}`)

const reports = writeSecondControlledCandidateDryRunArtifacts(selectedCandidate)
console.log(summarizeSecondControlledCandidateDryRun(reports))
