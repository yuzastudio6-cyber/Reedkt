import { existsSync, readFileSync } from 'node:fs'
import {
  buildArtifactPushReport,
  parseArtifactPushLog,
  readArtifactDigestEvidenceFile,
  summarizeArtifactPushReport,
} from '../activation/artifact-push'

const jsonOutput = process.argv.includes('--json')
const imageTag = readArgValue('--image-tag') ?? process.env.REEDITPRO_IMAGE_TAG
const digestFile = readArgValue('--digest-file') ?? defaultDigestFile(imageTag)
const logPaths = readRepeatedArgValues('--log')

try {
  const parsedLogs = logPaths.map((logPath) => ({
    logPath,
    parsedLog: parseArtifactPushLog(readFileSync(logPath, 'utf8'), logPath),
  }))
  const digestEvidence = digestFile && existsSync(digestFile)
    ? readArtifactDigestEvidenceFile(digestFile)
    : []
  const report = buildArtifactPushReport({
    project: readArgValue('--project') ?? process.env.GCP_PROJECT_ID,
    artifactRegion: readArgValue('--artifact-region') ?? process.env.GCP_ARTIFACT_REGION,
    repository: readArgValue('--repository') ?? process.env.REEDITPRO_ARTIFACT_REPOSITORY,
    imageTag,
    mode: parsedLogs.length > 0 ? 'report_from_logs' : 'static_plan',
    parsedLogs,
    digestEvidence,
  })

  if (report.blockers.length > 0) process.exitCode = 1

  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2))
  } else {
    console.log(summarizeArtifactPushReport(report))
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  if (jsonOutput) {
    console.log(JSON.stringify({
      ok: false,
      error: message,
      dockerPushExecuted: false,
      gcloudExecuted: false,
      deploymentExecuted: false,
      productionReadyAllowed: false,
      externalBetaAllowed: false,
      realUserMediaTestingAllowed: false,
    }, null, 2))
  } else {
    console.error(message)
  }
  process.exitCode = 1
}

function readArgValue(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function readRepeatedArgValues(name: string): string[] {
  const values: string[] = []
  for (let index = 0; index < process.argv.length; index += 1) {
    if (process.argv[index] === name && process.argv[index + 1]) values.push(process.argv[index + 1])
  }
  return values
}

function defaultDigestFile(tag?: string): string | undefined {
  return tag ? `activation-logs/artifact-push/phase23b-${tag}/digests.json` : undefined
}
