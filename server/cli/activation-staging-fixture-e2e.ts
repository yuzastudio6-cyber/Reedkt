import { execFile } from 'node:child_process'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { promisify } from 'node:util'
import {
  buildFixtureJobEnv,
  buildFixturePrefix,
  buildStagingFixtureE2EConfig,
  buildStagingFixtureE2EReport,
  createStagingGeneratedFixtureMedia,
  envRecordToGcloudFlag,
  expectedStagingFixtureArtifacts,
  stagingFixtureBuckets,
  summarizeStagingFixtureE2EReport,
  validateStagingFixtureE2EConfig,
} from '../activation/staging-fixture-e2e'

const execFileAsync = promisify(execFile)

const mode = (readArgValue('--mode') ?? 'plan') as 'plan' | 'report' | 'execute'
const defaultLogDir = path.join('activation-logs', 'staging-fixture-e2e', 'phase25')
const explicitRunId = readArgValue('--run-id') ?? process.env.STAGING_FIXTURE_RUN_ID
const runId = explicitRunId ?? (mode === 'report' ? readLatestRunId(defaultLogDir) : undefined) ?? createRunId()
const logDir = readArgValue('--log-dir') ?? defaultLogDir
const config = buildStagingFixtureE2EConfig({
  projectId: readArgValue('--project') ?? process.env.GCP_PROJECT_ID,
  region: readArgValue('--region') ?? process.env.GCP_REGION,
  imageTag: readArgValue('--image-tag') ?? process.env.REEDITPRO_IMAGE_TAG,
  mode,
  runId,
  logDir,
})

if (readFlag('--json')) {
  console.log(JSON.stringify(buildStagingFixtureE2EReport(config), null, 2))
} else if (mode === 'execute') {
  await executeStagingFixtureE2E()
} else {
  console.log(summarizeStagingFixtureE2EReport(buildStagingFixtureE2EReport(config)))
}

async function executeStagingFixtureE2E(): Promise<void> {
  const blockers = validateStagingFixtureE2EConfig(config)
  if (blockers.length > 0) {
    throw new Error(`Staging fixture E2E is blocked: ${blockers.join('; ')}`)
  }

  await mkdir(logDir, { recursive: true })
  await writeFile(path.join(logDir, 'latest-run-id.txt'), `${runId}\n`)

  await runLogged('preflight-gcloud.log', 'gcloud', ['auth', 'list'])
  const project = (await execFileAsync('gcloud', ['config', 'get-value', 'project'], { maxBuffer: 1024 * 1024 })).stdout.trim()
  await writeFile(path.join(logDir, 'active-project.log'), `${project}\n`)
  if (project !== 'reeditpro') throw new Error(`Active gcloud project must be exactly reeditpro, got ${project}.`)
  await runLogged('project-describe.log', 'gcloud', ['projects', 'describe', 'reeditpro'])
  await runLogged('api-service-describe.log', 'gcloud', ['run', 'services', 'describe', 'reeditpro-staging-api', '--region', config.region, '--project', config.projectId])
  for (const job of ['reeditpro-staging-tool-readiness-job', 'reeditpro-staging-cpu-analysis-job', 'reeditpro-staging-render-job', 'reeditpro-staging-qa-job']) {
    await runLogged(`${job}-describe.log`, 'gcloud', ['run', 'jobs', 'describe', job, '--region', config.region, '--project', config.projectId])
  }

  await runApiHealthCheck()

  const fixture = await createStagingGeneratedFixtureMedia({ logDir })
  if (!fixture.ok) throw new Error(`Generated fixture creation failed: ${fixture.reason}`)
  await writeFile(path.join(logDir, 'fixture-generation.log'), JSON.stringify(fixture, null, 2))

  const prefix = buildFixturePrefix(runId)
  const sourceObject = `${prefix}/fixture.mp4`
  await runLogged('gcs-upload.log', 'gcloud', [
    'storage',
    'cp',
    fixture.fixturePath,
    `gs://${stagingFixtureBuckets.source}/${sourceObject}`,
    '--content-type=video/mp4',
  ])
  await runLogged('source-object-describe.log', 'gcloud', ['storage', 'objects', 'describe', `gs://${stagingFixtureBuckets.source}/${sourceObject}`])

  const jobEnv = buildFixtureJobEnv({ runId, sourceObject, projectId: config.projectId })
  await executeJob('execute-tool-readiness.log', 'reeditpro-staging-tool-readiness-job', jobEnv)
  await executeJob('execute-cpu.log', 'reeditpro-staging-cpu-analysis-job', jobEnv)
  await executeJob('execute-render.log', 'reeditpro-staging-render-job', jobEnv)
  await executeJob('execute-qa.log', 'reeditpro-staging-qa-job', jobEnv)

  await verifyArtifacts()
  await rm(fixture.fixturePath, { force: true })
  await writeFile(path.join(logDir, 'local-cleanup.log'), `Removed local fixture: ${fixture.fixturePath}\n`)

  const report = buildStagingFixtureE2EReport(config)
  await writeFile(path.join(logDir, 'e2e-report.json'), `${JSON.stringify(report, null, 2)}\n`)
  console.log(summarizeStagingFixtureE2EReport(report))
}

async function executeJob(logName: string, jobName: string, env: Record<string, string>): Promise<void> {
  await runLogged(logName, 'gcloud', [
    'run',
    'jobs',
    'execute',
    jobName,
    '--region',
    config.region,
    '--project',
    config.projectId,
    '--async',
    '--quiet',
    '--update-env-vars',
    envRecordToGcloudFlag(env),
  ], 20 * 60_000)
  const executionText = readLog(logName)
  const executionId = executionText.match(/Execution \[([^\]]+)\]/)?.[1]
  if (executionId) await waitForExecution(logName, executionId)
}

async function verifyArtifacts(): Promise<void> {
  const objects: string[] = []
  const failures: string[] = []
  for (const artifact of expectedStagingFixtureArtifacts(runId)) {
    const uri = `gs://${artifact.bucket}/${artifact.object}`
    try {
      await execFileAsync('gcloud', ['storage', 'objects', 'describe', uri], { timeout: 60_000, maxBuffer: 2 * 1024 * 1024 })
      objects.push(uri)
    } catch (error) {
      failures.push(`${uri}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  await writeFile(path.join(logDir, 'artifact-verification.json'), `${JSON.stringify({ objects, failures }, null, 2)}\n`)
  if (failures.length > 0) throw new Error(`Artifact verification failed: ${failures.join('; ')}`)
}

async function runApiHealthCheck(): Promise<void> {
  const serviceUrl = (await execFileAsync('gcloud', [
    'run',
    'services',
    'describe',
    'reeditpro-staging-api',
    '--region',
    config.region,
    '--project',
    config.projectId,
    '--format=value(status.url)',
  ], { maxBuffer: 1024 * 1024 })).stdout.trim()
  const token = (await execFileAsync('gcloud', ['auth', 'print-identity-token'], { maxBuffer: 1024 * 1024 })).stdout.trim()
  const response = await fetch(`${serviceUrl}/health`, { headers: { Authorization: `Bearer ${token}` } })
  const text = await response.text()
  await writeFile(path.join(logDir, 'api-health.log'), [`SERVICE_URL=${serviceUrl}`, `HTTP_CODE=${response.status}`, text].join('\n'))
  if (response.status !== 200) throw new Error(`Authenticated API health check failed with HTTP ${response.status}.`)
}

async function runLogged(logName: string, command: string, args: string[], timeout = 120_000): Promise<void> {
  const logPath = path.join(logDir, logName)
  try {
    const result = await execFileAsync(command, args, { timeout, maxBuffer: 16 * 1024 * 1024 })
    await writeFile(logPath, `${result.stdout}\n${result.stderr}`)
  } catch (error) {
    const typed = error as Error & { stdout?: string; stderr?: string }
    await writeFile(logPath, `${typed.stdout ?? ''}\n${typed.stderr ?? ''}\n${typed.stack ?? typed.message}`)
    throw error
  }
}

async function waitForExecution(logName: string, executionId: string): Promise<void> {
  const logPath = path.join(logDir, logName)
  const startedAt = Date.now()
  while (Date.now() - startedAt < 15 * 60_000) {
    const result = await execFileAsync('gcloud', [
      'run',
      'jobs',
      'executions',
      'tasks',
      'list',
      '--execution',
      executionId,
      '--region',
      config.region,
      '--project',
      config.projectId,
      '--format=json',
    ], { timeout: 60_000, maxBuffer: 4 * 1024 * 1024 })
    const tasks = JSON.parse(result.stdout || '[]') as Array<{
      metadata?: { labels?: Record<string, string> }
      status?: { completionTime?: string; conditions?: Array<{ type?: string; status?: string; reason?: string }> }
    }>
    const completed = tasks.length > 0 && tasks.every((task) => task.status?.completionTime)
    const failed = tasks.some((task) => {
      const runningState = task.metadata?.labels?.['run.googleapis.com/runningState']
      const failedCondition = task.status?.conditions?.some((condition) => (
        (condition.type === 'Completed' || condition.type === 'Ready')
        && condition.status === 'False'
      ))
      return runningState === 'Failed' || failedCondition
    })
    if (completed) {
      await writeFile(logPath, `${readLog(logName)}\n\nTask poll:\n${JSON.stringify(tasks, null, 2)}\n`)
      if (failed) throw new Error(`${executionId} completed with failed task state.`)
      return
    }
    await new Promise((resolve) => setTimeout(resolve, 5000))
  }
  throw new Error(`${executionId} did not complete within the Phase 25 wait window.`)
}

function readLog(logName: string): string {
  const logPath = path.join(logDir, logName)
  return existsSync(logPath) ? readFileSync(logPath, 'utf8') : ''
}

function createRunId(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').replace(/[^a-zA-Z0-9-]/g, '').toLowerCase()
}

function readLatestRunId(logDirPath: string): string | undefined {
  const latestPath = path.join(logDirPath, 'latest-run-id.txt')
  return existsSync(latestPath) ? readFileSync(latestPath, 'utf8').trim() : undefined
}

function readArgValue(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function readFlag(name: string): boolean {
  return process.argv.includes(name)
}
