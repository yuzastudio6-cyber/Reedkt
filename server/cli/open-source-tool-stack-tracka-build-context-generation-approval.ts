import {
  forbiddenConfirmations,
  requiredConfirmations,
  summarizeTrackaBuildContextGenerationApproval,
  writeTrackaBuildContextGenerationApprovalArtifacts,
} from '../activation/open-source-tool-stack-tracka-build-context-generation-approval'

const execute = process.argv.includes('--execute')
const metadataOnly = process.argv.includes('--metadata-only')
const required = requiredConfirmations()

if (!execute) {
  console.log(summarizeTrackaBuildContextGenerationApproval())
  process.exit(0)
}

if (!metadataOnly) {
  throw new Error('Use --execute --metadata-only. This packet does not generate dist outputs, run Docker, or run probes.')
}

const missing = required.filter((name) => process.env[name] !== 'true')
if (missing.length) throw new Error(`Missing required confirmations: ${missing.join(', ')}`)

const forbidden = forbiddenConfirmations().filter((name) => process.env[name] === 'true')
if (forbidden.length) throw new Error(`Forbidden confirmations set: ${forbidden.join(', ')}`)

const reports = writeTrackaBuildContextGenerationApprovalArtifacts()
console.log(summarizeTrackaBuildContextGenerationApproval(reports))
