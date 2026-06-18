import {
  forbiddenConfirmationFragments,
  requiredConfirmations,
  summarizeTrackaContainerFfmpegFfprobeVersionProbe,
  writeTrackaContainerFfmpegFfprobeVersionProbeArtifacts,
} from '../activation/open-source-tool-stack-tracka-container-ffmpeg-ffprobe-version-probe-execution'

const execute = process.argv.includes('--execute')
const versionOnly = process.argv.includes('--version-only')
const trackaContainerOnly = process.argv.includes('--tracka-container-only')
const noMedia = process.argv.includes('--no-media')
const required = requiredConfirmations()

if (!execute) {
  console.log(summarizeTrackaContainerFfmpegFfprobeVersionProbe())
  process.exit(0)
}

if (!versionOnly || !trackaContainerOnly || !noMedia) {
  throw new Error('Use --execute --version-only --tracka-container-only --no-media. This packet blocks before probes until an exact container invocation exists.')
}

const missing = required.filter((name) => process.env[name] !== 'true')
if (missing.length) throw new Error(`Missing required confirmations: ${missing.join(', ')}`)

const forbidden = Object.entries(process.env)
  .filter(([name, value]) => name.startsWith('REEDITPRO_CONFIRM_') && value === 'true' && !required.includes(name))
  .map(([name]) => name)
  .filter((name) => forbiddenConfirmationFragments().some((fragment) => name.includes(fragment)))

if (forbidden.length) throw new Error(`Forbidden confirmations set: ${forbidden.join(', ')}`)

const reports = writeTrackaContainerFfmpegFfprobeVersionProbeArtifacts()
console.log(summarizeTrackaContainerFfmpegFfprobeVersionProbe(reports))
