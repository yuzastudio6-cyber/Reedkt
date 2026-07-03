import {
  forbiddenConfirmationFragments,
  requiredConfirmations,
  summarizeTrackaContainerFfmpegFfprobeBlockerResolution,
  writeTrackaContainerFfmpegFfprobeBlockerResolutionArtifacts,
} from '../activation/open-source-tool-stack-tracka-container-ffmpeg-ffprobe-blocker-resolution'

const execute = process.argv.includes('--execute')
const metadataOnly = process.argv.includes('--metadata-only')
const required = requiredConfirmations()

if (!execute) {
  console.log(summarizeTrackaContainerFfmpegFfprobeBlockerResolution())
  process.exit(0)
}

if (!metadataOnly) {
  throw new Error('Use --execute --metadata-only. This packet defines future commands only and does not run Docker or probes.')
}

const missing = required.filter((name) => process.env[name] !== 'true')
if (missing.length) throw new Error(`Missing required confirmations: ${missing.join(', ')}`)

const forbidden = Object.entries(process.env)
  .filter(([name, value]) => name.startsWith('REEDITPRO_CONFIRM_') && value === 'true' && !required.includes(name))
  .map(([name]) => name)
  .filter((name) => forbiddenConfirmationFragments().some((fragment) => name.includes(fragment.replace('=true', ''))))

if (forbidden.length) throw new Error(`Forbidden confirmations set: ${forbidden.join(', ')}`)

const reports = writeTrackaContainerFfmpegFfprobeBlockerResolutionArtifacts()
console.log(summarizeTrackaContainerFfmpegFfprobeBlockerResolution(reports))
