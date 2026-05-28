import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { buildFixturePrefix, stagingFixtureBuckets } from './staging-fixture-storage-client'

const execFileAsync = promisify(execFile)

export const stagingFixtureJobOrder = [
  'reeditpro-staging-tool-readiness-job',
  'reeditpro-staging-cpu-analysis-job',
  'reeditpro-staging-render-job',
  'reeditpro-staging-qa-job',
] as const

export function buildFixtureJobEnv(input: {
  runId: string
  sourceObject: string
  projectId?: string
}): Record<string, string> {
  const prefix = buildFixturePrefix(input.runId)
  return {
    GCP_PROJECT_ID: input.projectId ?? 'reeditpro',
    REEDITPRO_ENV: 'staging',
    REEDITPRO_CONFIRM_STAGING_E2E: 'true',
    PROVIDER_EXECUTION_ENABLED: 'false',
    MODEL_DOWNLOADS_ENABLED: 'false',
    STAGING_FIXTURE_RUN_ID: input.runId,
    STAGING_FIXTURE_PREFIX: prefix,
    STAGING_FIXTURE_SOURCE_BUCKET: stagingFixtureBuckets.source,
    STAGING_FIXTURE_SOURCE_OBJECT: input.sourceObject,
    STAGING_FIXTURE_PROXY_BUCKET: stagingFixtureBuckets.proxy,
    STAGING_FIXTURE_ANALYSIS_BUCKET: stagingFixtureBuckets.analysis,
    STAGING_FIXTURE_TRANSCRIPTS_BUCKET: stagingFixtureBuckets.transcripts,
    STAGING_FIXTURE_PREVIEWS_BUCKET: stagingFixtureBuckets.previews,
    STAGING_FIXTURE_FINAL_EXPORTS_BUCKET: stagingFixtureBuckets.finalExports,
    STAGING_FIXTURE_QA_BUCKET: stagingFixtureBuckets.qa,
  }
}

export function envRecordToGcloudFlag(env: Record<string, string>): string {
  return Object.entries(env).map(([key, value]) => `${key}=${value}`).join(',')
}

export function parseExecutionId(text: string): string | undefined {
  return text.match(/Execution \[([^\]]+)\]/)?.[1] ?? text.match(/executions\/([a-z0-9-]+)/i)?.[1]
}

export async function executeFixtureJob(input: {
  jobName: string
  region: string
  projectId: string
  env: Record<string, string>
}): Promise<{ stdout: string; stderr: string; executionId?: string }> {
  const result = await execFileAsync('gcloud', [
    'run',
    'jobs',
    'execute',
    input.jobName,
    '--region',
    input.region,
    '--project',
    input.projectId,
    '--wait',
    '--quiet',
    '--update-env-vars',
    envRecordToGcloudFlag(input.env),
  ], { timeout: 15 * 60_000, maxBuffer: 8 * 1024 * 1024 })

  const combined = `${result.stdout}\n${result.stderr}`
  return {
    stdout: result.stdout,
    stderr: result.stderr,
    executionId: parseExecutionId(combined),
  }
}
