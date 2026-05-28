import { existsSync, readFileSync } from 'node:fs'
import {
  buildStagingHealthcheckSummary,
  summarizeStagingHealthcheckSummary,
} from '../activation/staging-deploy'

const jsonOutput = process.argv.includes('--json')
const imageTag = readArgValue('--image-tag') ?? process.env.REEDITPRO_IMAGE_TAG ?? 'staging-amd64-001'
const logDir = `activation-logs/staging-deploy/phase24b-${imageTag}`
const fixtureLogDir = 'activation-logs/staging-fixture-e2e/phase25'
const deployedEvidence = readText(`${logDir}/verify-deployments.log`)
const authHealthEvidence = readText(`${logDir}/auth-health-user.log`)
const toolExecutionEvidence = readText(`${logDir}/tool-readiness-execution-describe.json`)
const fixtureHealthEvidence = readText(`${fixtureLogDir}/api-health.log`)
const fixtureToolExecutionEvidence = readText(`${fixtureLogDir}/execute-tool-readiness.log`)
const fixtureCpuEvidence = readText(`${fixtureLogDir}/execute-cpu.log`)
const fixtureRenderEvidence = readText(`${fixtureLogDir}/execute-render.log`)
const fixtureQaEvidence = readText(`${fixtureLogDir}/execute-qa.log`)
const phase24DeploymentReady = hasDeploymentEvidence(deployedEvidence)
const phase25ExecutionReady = [
  fixtureToolExecutionEvidence,
  fixtureCpuEvidence,
  fixtureRenderEvidence,
  fixtureQaEvidence,
].every(jobLogPassed)
const deploymentReady = phase24DeploymentReady || phase25ExecutionReady
const apiReady = (phase24DeploymentReady && /reeditpro-staging-api/.test(deployedEvidence) && /HTTP code:\s*200/.test(authHealthEvidence)) ||
  /HTTP_CODE=200/.test(fixtureHealthEvidence)
const jobsReady = (phase24DeploymentReady && [
  'reeditpro-staging-tool-readiness-job',
  'reeditpro-staging-cpu-analysis-job',
  'reeditpro-staging-qa-job',
  'reeditpro-staging-render-job',
].every((jobName) => deployedEvidence.includes(jobName))) || phase25ExecutionReady
const toolReadinessPassed = (/"succeededCount":\s*1/.test(toolExecutionEvidence) && /"type":\s*"Completed"/.test(toolExecutionEvidence)) ||
  jobLogPassed(fixtureToolExecutionEvidence)
const blockers = deploymentReady
  ? [
      ...(apiReady ? [] : ['Authenticated API health check evidence is missing or not passing.']),
      ...(jobsReady ? [] : ['One or more non-GPU Cloud Run jobs are missing from verification evidence.']),
      ...(toolReadinessPassed ? [] : ['Tool-readiness job execution evidence is missing or not passing.']),
    ]
  : ['Phase 24B deployment verification logs are missing.']

const summary = buildStagingHealthcheckSummary({
  projectId: readArgValue('--project') ?? process.env.GCP_PROJECT_ID,
  region: readArgValue('--region') ?? process.env.GCP_REGION,
  apiServiceReady: apiReady,
  jobsReady,
  toolReadinessExecutionStatus: toolReadinessPassed ? 'passed' : deploymentReady ? 'blocked' : 'skipped',
  blockers,
  warnings: deploymentReady
    ? [phase24DeploymentReady
        ? 'Healthcheck summary is derived from local Phase 24B retry verification logs.'
        : 'Healthcheck summary is derived from local Phase 25 generated-fixture execution logs.']
    : ['API and Cloud Run job health checks are skipped until deploy succeeds.'],
})

if (jsonOutput) console.log(JSON.stringify(summary, null, 2))
else console.log(summarizeStagingHealthcheckSummary(summary))

function readArgValue(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function readText(path: string): string {
  return existsSync(path) ? readFileSync(path, 'utf8') : ''
}

function hasDeploymentEvidence(text: string): boolean {
  return /reeditpro-staging-api/.test(text) &&
    /reeditpro-staging-tool-readiness-job/.test(text) &&
    /reeditpro-staging-cpu-analysis-job/.test(text) &&
    /reeditpro-staging-qa-job/.test(text) &&
    /reeditpro-staging-render-job/.test(text) &&
    /GPU job not found, as expected/.test(text)
}

function jobLogPassed(text: string): boolean {
  const failed = /ERROR:|Traceback|NonZeroExitCode|exit code:\s*[1-9]|completed with failed|Task .* failed/i.test(text)
  return /completed successfully|succeededCount['"]?\s*:\s*1|runningState['"]?\s*:\s*['"]?Succeeded|Execution completed successfully/i.test(text) && !failed
}
