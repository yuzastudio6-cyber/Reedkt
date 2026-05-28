import { existsSync, readFileSync } from 'node:fs'
import {
  buildStagingDeployImageRefs,
  buildStagingDeployReport,
  parseImageArchitectureEvidence,
  parseStagingDeployConfig,
  parseStagingDeployLog,
  summarizeStagingDeployReport,
} from '../activation/staging-deploy'
import type { StagingDeployTargetId, StagingImageArchitectureResult } from '../activation/staging-deploy'

const jsonOutput = process.argv.includes('--json')
const imageTag = readArgValue('--image-tag') ?? process.env.REEDITPRO_IMAGE_TAG ?? 'staging-local-001'
const config = parseStagingDeployConfig({
  projectId: readArgValue('--project') ?? process.env.GCP_PROJECT_ID,
  region: readArgValue('--region') ?? process.env.GCP_REGION,
  imageTag,
  confirmDeploy: process.env.REEDITPRO_CONFIRM_STAGING_DEPLOY === 'true',
})

try {
  const report = buildStagingDeployReport({
    projectId: config.projectId,
    region: config.region,
    imageTag: config.imageTag,
    confirmDeploy: config.confirmDeploy,
    architectureResults: readArchitectureResults(),
    deployLogs: readDeployLogPaths().map((logPath) => ({
      logPath,
      parsedLog: parseStagingDeployLog(readFileSync(logPath, 'utf8'), logPath),
    })),
  })

  if (jsonOutput) console.log(JSON.stringify(report, null, 2))
  else console.log(summarizeStagingDeployReport(report))
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  if (jsonOutput) console.log(JSON.stringify({ ok: false, error: message }, null, 2))
  else console.error(message)
  process.exitCode = 1
}

function readArchitectureResults(): StagingImageArchitectureResult[] | undefined {
  const explicit = readRepeatedArgValues('--architecture-log')
  const imageRefs = buildStagingDeployImageRefs(config)
  const entries = explicit.length > 0
    ? explicit.map((value) => {
        const [targetId, logPath] = value.split(':', 2)
        return { targetId: targetId as StagingDeployTargetId, logPath }
      })
    : imageRefs.map((imageRef) => ({
        targetId: imageRef.targetId,
        logPath: `activation-logs/staging-deploy/phase24b-${config.imageTag}/${imageRef.targetId}-architecture.txt`,
      }))
  const available = entries.filter((entry) => existsSync(entry.logPath))
  if (available.length === 0) return undefined
  return available.map((entry) => {
    const imageRef = imageRefs.find((candidate) => candidate.targetId === entry.targetId)
    return parseImageArchitectureEvidence({
      targetId: entry.targetId,
      imageRef: imageRef?.fullImageRef ?? entry.targetId,
      evidenceText: readFileSync(entry.logPath, 'utf8'),
      rawEvidencePath: entry.logPath,
    })
  })
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

function readDeployLogPaths(): string[] {
  const explicit = readRepeatedArgValues('--log')
  if (explicit.length > 0) return explicit
  const logDir = `activation-logs/staging-deploy/phase24b-${config.imageTag}`
  return [
    `${logDir}/deploy-api.log`,
    `${logDir}/deploy-tool-readiness-job.log`,
    `${logDir}/deploy-cpu-analysis-job.log`,
    `${logDir}/deploy-qa-job.log`,
    `${logDir}/deploy-render-job.log`,
    `${logDir}/execute-tool-readiness-job.log`,
  ].filter((logPath) => existsSync(logPath))
}
