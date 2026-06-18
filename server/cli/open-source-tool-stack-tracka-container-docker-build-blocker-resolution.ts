import {
  forbiddenConfirmations,
  requiredConfirmations,
  summarizeTrackaContainerDockerBuildBlockerResolution,
  writeTrackaContainerDockerBuildBlockerResolutionArtifacts,
} from '../activation/open-source-tool-stack-tracka-container-docker-build-blocker-resolution'

const execute = process.argv.includes('--execute')
const metadataOnly = process.argv.includes('--metadata-only')
const required = requiredConfirmations()

if (!execute) {
  console.log(summarizeTrackaContainerDockerBuildBlockerResolution())
  process.exit(0)
}

if (!metadataOnly) {
  throw new Error('Use --execute --metadata-only. This packet does not run Docker, probes, or build-context generation.')
}

const missing = required.filter((name) => process.env[name] !== 'true')
if (missing.length) throw new Error(`Missing required confirmations: ${missing.join(', ')}`)

const forbidden = forbiddenConfirmations().filter((name) => process.env[name] === 'true')
if (forbidden.length) throw new Error(`Forbidden confirmations set: ${forbidden.join(', ')}`)

const reports = writeTrackaContainerDockerBuildBlockerResolutionArtifacts()
console.log(summarizeTrackaContainerDockerBuildBlockerResolution(reports))
