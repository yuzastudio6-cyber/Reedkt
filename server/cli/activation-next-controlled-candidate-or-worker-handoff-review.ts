import {
  forbiddenConfirmationFragments,
  requiredConfirmations,
  summarizeNextControlledCandidateOrWorkerHandoffReview,
  writeNextControlledCandidateOrWorkerHandoffArtifacts,
} from '../activation/next-controlled-candidate-or-worker-handoff-review'

const execute = process.argv.includes('--execute')
const metadataOnly = process.argv.includes('--metadata-only')
const required = requiredConfirmations()

if (!execute) {
  console.log(summarizeNextControlledCandidateOrWorkerHandoffReview())
  process.exit(0)
}

if (!metadataOnly) {
  throw new Error('Use --metadata-only. This review cannot execute tools, routes, workers, providers, media, Supabase writes, GCS uploads, public artifacts, signed URLs, or runtime paths.')
}

const missing = required.filter((name) => process.env[name] !== 'true')
if (missing.length) throw new Error(`Missing required confirmations: ${missing.join(', ')}`)

const forbidden = Object.entries(process.env)
  .filter(([name, value]) => name.startsWith('REEDITPRO_CONFIRM_') && value === 'true' && !required.includes(name))
  .map(([name]) => name)
  .filter((name) => forbiddenConfirmationFragments().some((fragment) => name.includes(fragment)))
if (forbidden.length) throw new Error(`Forbidden confirmations set: ${forbidden.join(', ')}`)

const reports = writeNextControlledCandidateOrWorkerHandoffArtifacts()
console.log(summarizeNextControlledCandidateOrWorkerHandoffReview(reports))
