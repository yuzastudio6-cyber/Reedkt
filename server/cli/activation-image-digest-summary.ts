import {
  buildArtifactImageDigestSummary,
  readArtifactDigestEvidenceFile,
  summarizeArtifactImageDigestSummary,
} from '../activation/artifact-push'

const jsonOutput = process.argv.includes('--json')
const imageTag = readArgValue('--image-tag') ?? process.env.REEDITPRO_IMAGE_TAG ?? 'staging-local-001'
const digestFile = readArgValue('--digest-file') ?? `activation-logs/artifact-push/phase23b-${imageTag}/digests.json`

try {
  const summary = buildArtifactImageDigestSummary(readArtifactDigestEvidenceFile(digestFile))
  if (!summary.requiredDigestsVerified) process.exitCode = 1
  if (jsonOutput) {
    console.log(JSON.stringify(summary, null, 2))
  } else {
    console.log(summarizeArtifactImageDigestSummary(summary))
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  if (jsonOutput) {
    console.log(JSON.stringify({ ok: false, error: message }, null, 2))
  } else {
    console.error(message)
  }
  process.exitCode = 1
}

function readArgValue(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}
