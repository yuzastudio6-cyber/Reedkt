import {
  forbiddenConfirmationFragments,
  requiredConfirmations,
  summarizeTrackaFfmpegFfprobeSourceOfTruth,
  writeTrackaFfmpegFfprobeSourceOfTruthArtifacts,
} from '../activation/tracka-ffmpeg-ffprobe-source-of-truth'

const execute = process.argv.includes('--execute')
const metadataOnly = process.argv.includes('--metadata-only')
const required = requiredConfirmations()

if (!execute) {
  console.log(summarizeTrackaFfmpegFfprobeSourceOfTruth())
  process.exit(0)
}

if (!metadataOnly) {
  throw new Error('Use --metadata-only. This reconciliation may not run probes, build Docker, process media, or replay PR #463.')
}

const missing = required.filter((name) => process.env[name] !== 'true')
if (missing.length) throw new Error(`Missing required confirmations: ${missing.join(', ')}`)

const forbidden = Object.entries(process.env)
  .filter(([name, value]) => name.startsWith('REEDITPRO_CONFIRM_') && value === 'true' && !required.includes(name))
  .map(([name]) => name)
  .filter((name) => forbiddenConfirmationFragments().some((fragment) => name.includes(fragment)))

if (forbidden.length) throw new Error(`Forbidden confirmations set: ${forbidden.join(', ')}`)

const reports = writeTrackaFfmpegFfprobeSourceOfTruthArtifacts()
console.log(summarizeTrackaFfmpegFfprobeSourceOfTruth(reports))
