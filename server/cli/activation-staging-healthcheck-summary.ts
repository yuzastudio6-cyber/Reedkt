import { existsSync, readFileSync } from 'node:fs'
import {
  buildStagingHealthcheckSummary,
  summarizeStagingHealthcheckSummary,
} from '../activation/staging-deploy'

const jsonOutput = process.argv.includes('--json')
const imageTag = readArgValue('--image-tag') ?? process.env.REEDITPRO_IMAGE_TAG ?? 'staging-amd64-001'
const logDir = `activation-logs/staging-deploy/phase24b-${imageTag}`
const deployedEvidence = readText(`${logDir}/verify-deployments.log`)
const authHealthEvidence = readText(`${logDir}/auth-health-user.log`)
const toolExecutionEvidence = readText(`${logDir}/tool-readiness-execution-describe.json`)
const deploymentReady = hasDeploymentEvidence(deployedEvidence)
const apiReady = deploymentReady && /reeditpro-staging-api/.test(deployedEvidence) && /HTTP code:\s*200/.test(authHealthEvidence)
const jobsReady = deploymentReady && [
  'reeditpro-staging-tool-readiness-job',
  'reeditpro-staging-cpu-analysis-job',
  'reeditpro-staging-qa-job',
  'reeditpro-staging-render-job',
].every((jobName) => deployedEvidence.includes(jobName))
const toolReadinessPassed = /"succeededCount":\s*1/.test(toolExecutionEvidence) && /"type":\s*"Completed"/.test(toolExecutionEvidence)
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
    ? ['Healthcheck summary is derived from local Phase 24B retry verification logs.']
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
