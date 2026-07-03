import {
  forbiddenConfirmations,
  requiredConfirmations,
  summarizeTrackaBuildContextGenerationExecution,
  writeTrackaBuildContextGenerationArtifacts,
} from '../activation/open-source-tool-stack-tracka-build-context-generation-execution'

const execute = process.argv.includes('--execute')
const generateOnly = process.argv.includes('--generate-only')
const scan = process.argv.includes('--scan')
const cleanup = process.argv.includes('--cleanup')
const noDocker = process.argv.includes('--no-docker')
const noMedia = process.argv.includes('--no-media')

if (!execute) {
  console.log(summarizeTrackaBuildContextGenerationExecution())
  process.exit(0)
}

if (!generateOnly || !scan || !cleanup || !noDocker || !noMedia) {
  throw new Error('Use --execute --generate-only --scan --cleanup --no-docker --no-media.')
}

const missing = requiredConfirmations().filter((name) => process.env[name] !== 'true')
if (missing.length) throw new Error(`Missing required confirmations: ${missing.join(', ')}`)

const forbidden = forbiddenConfirmations().filter((name) => process.env[name] === 'true')
if (forbidden.length) throw new Error(`Forbidden confirmations set: ${forbidden.join(', ')}`)

const reports = writeTrackaBuildContextGenerationArtifacts({ execute: true })
console.log(summarizeTrackaBuildContextGenerationExecution(reports))
