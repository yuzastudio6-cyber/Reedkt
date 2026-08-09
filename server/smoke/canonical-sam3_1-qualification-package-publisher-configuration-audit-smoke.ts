import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
import {
  chmodSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const path =
  'scripts/gcp/prod/53-audit-sam31-qualification-package-publisher-configuration.sh'
const source = readFileSync(path, 'utf8')
const packageJson = readFileSync('package.json', 'utf8')
const aggregate = readFileSync(
  'scripts/verify-visual-intelligence-quality-gpu-release.mjs',
  'utf8',
)

for (const expected of [
  "readonly PROJECT_ID='reeditpro'",
  "readonly REGION='us-central1'",
  "readonly JOB='weeditpro-sam31-package-publisher'",
  'weeditpro-sam31-package-sa@reeditpro.iam.gserviceaccount.com',
  'gcloud run jobs describe',
  'gcloud run jobs executions list',
  'gcloud run jobs get-iam-policy',
  'canonical_job_definition_mismatch',
  'public_iam_principal_present',
  'active_package_publication_present',
  'desired_package_inputs_not_deployed',
  'configuration_matches_pending_source_build_provenance',
  'requires_reviewed_source_bound_redeploy',
  'sourceBoundBuildProvenanceClaimed: false',
  'cloudRunJobExecuted: false',
  'gpuOrModelRuntimeStarted: false',
  'customerCreditsMutated: false',
  'productionAuthorityGranted: false',
  'observationSha256',
] as const) {
  assert.ok(source.includes(expected), `missing ${expected}`)
}
assert.doesNotMatch(source,
  /gcloud run jobs (?:deploy|execute|update|delete)/u)
assert.doesNotMatch(source,
  /gcloud builds (?:submit|cancel)|gcloud storage (?:cp|mv|rm)/u)
assert.doesNotMatch(source, /--gpu|providerCall|walletMutation/u)
assert.match(packageJson,
  /"audit:sam3_1-qualification-package-publisher-configuration"/u)
assert.match(aggregate,
  /canonical-sam3_1-qualification-package-publisher-configuration-audit-smoke\.ts/u)

const desired = {
  WEEDITPRO_SAM31_QUALIFICATION_PACKAGE_CONFIRMATION:
    'publish-one-sam31-source-checkpoint-qualification-package-v1',
  WEEDITPRO_SAM31_QUALIFICATION_ID: 'sam31-qualification-next',
  WEEDITPRO_SAM31_QUALIFICATION_INGEST_ID: 'sam31-ingest',
  WEEDITPRO_SAM31_QUALIFICATION_INGEST_SHA256: '1'.repeat(64),
  WEEDITPRO_SAM31_QUALIFICATION_ARTIFACT_REVIEW_ID: 'sam31-review',
  WEEDITPRO_SAM31_QUALIFICATION_ARTIFACT_REVIEW_SHA256: '2'.repeat(64),
  WEEDITPRO_SAM31_QUALIFICATION_IMAGE_RELEASE_ID: 'sam31-image-release',
  WEEDITPRO_SAM31_QUALIFICATION_IMAGE_RELEASE_SHA256: '3'.repeat(64),
  WEEDITPRO_SAM31_QUALIFICATION_PACKAGE_ISSUED_AT:
    '2026-08-09T04:06:50Z',
} as const
const job = jobFixture(desired)
const temp = mkdtempSync(join(tmpdir(), 'sam31-package-audit-'))
const gcloud = join(temp, 'gcloud')
const log = join(temp, 'calls.log')
writeFileSync(gcloud, `#!/usr/bin/env bash
set -euo pipefail
printf '%s\\n' "$*" >>"$FAKE_GCLOUD_LOG"
case "$1 $2 $3" in
  'config get-value project') printf '%s\\n' 'reeditpro' ;;
  'run jobs describe') printf '%s' "$FAKE_JOB_JSON" ;;
  'run jobs executions') printf '%s' "$FAKE_EXECUTIONS_JSON" ;;
  'run jobs get-iam-policy') printf '%s' "$FAKE_POLICY_JSON" ;;
  *) exit 91 ;;
esac
`)
chmodSync(gcloud, 0o700)

try {
  const matching = runAudit(job, [], { bindings: [] }, temp, log)
  assert.equal(matching.disposition,
    'configuration_matches_pending_source_build_provenance')
  assert.deepEqual(matching.blockerCodes, [])
  assert.equal(matching.exactDesiredEnvironmentDeployed, true)
  assert.equal(matching.activeExecutionCount, 0)
  assert.equal(matching.cloudRunJobExecuted, false)
  assert.equal(matching.sourceBoundBuildProvenanceClaimed, false)
  assert.equal(matching.observationSha256, hashObservation(matching))

  const stale = jobFixture({
    ...desired,
    WEEDITPRO_SAM31_QUALIFICATION_IMAGE_RELEASE_ID:
      'sam31-old-image-release',
  })
  const blocked = runAudit(stale, [{ status: { runningCount: 1 } }], {
    bindings: [{ members: ['allUsers'] }],
  }, temp, log)
  assert.equal(blocked.disposition, 'requires_reviewed_source_bound_redeploy')
  assert.deepEqual(blocked.blockerCodes, [
    'public_iam_principal_present',
    'active_package_publication_present',
    'desired_package_inputs_not_deployed',
  ])
  assert.equal(blocked.exactDesiredEnvironmentDeployed, false)
  assert.equal(blocked.activeExecutionCount, 1)
  assert.equal(blocked.cloudRunJobExecuted, false)
  assert.equal(blocked.gpuOrModelRuntimeStarted, false)
  assert.equal(blocked.observationSha256, hashObservation(blocked))

  const calls = readFileSync(log, 'utf8')
  assert.match(calls, /run jobs describe/u)
  assert.match(calls, /run jobs executions list/u)
  assert.match(calls, /run jobs get-iam-policy/u)
  assert.doesNotMatch(calls, /deploy|execute|update|delete|builds/u)
} finally {
  rmSync(temp, { recursive: true, force: true })
}

process.stdout.write(`${JSON.stringify({
  smoke:
    'canonical-sam3_1-qualification-package-publisher-configuration-audit',
  checks: 39,
  cloudRunJobExecuted: false,
  gpuOrModelRuntimeStarted: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
})}\n`)

type AuditResult = Record<string, unknown> & {
  disposition: string
  blockerCodes: string[]
  exactDesiredEnvironmentDeployed: boolean
  activeExecutionCount: number
  sourceBoundBuildProvenanceClaimed: boolean
  cloudRunJobExecuted: boolean
  gpuOrModelRuntimeStarted: boolean
  observationSha256: string
}

function runAudit(
  job: ReturnType<typeof jobFixture>,
  executions: unknown[],
  policy: unknown,
  fakeBin: string,
  log: string,
): AuditResult {
  const result = spawnSync('bash', [path], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: {
      PATH: `${fakeBin}:${process.env.PATH ?? ''}`,
      FAKE_GCLOUD_LOG: log,
      FAKE_JOB_JSON: JSON.stringify(job),
      FAKE_EXECUTIONS_JSON: JSON.stringify(executions),
      FAKE_POLICY_JSON: JSON.stringify(policy),
      ...desired,
    },
  })
  assert.equal(result.status, 0, result.stderr)
  return JSON.parse(result.stdout.trim()) as AuditResult
}

function jobFixture(environment: Record<string, string>) {
  return {
    metadata: {
      name: 'weeditpro-sam31-package-publisher',
      generation: 2,
      labels: {
        app: 'weeditpro',
        operation: 'sam31-package-publisher',
        scale: 'zero',
      },
    },
    spec: {
      template: {
        metadata: {
          labels: {
            app: 'weeditpro',
            operation: 'sam31-package-publisher',
            scale: 'zero',
          },
        },
        spec: {
          taskCount: 1,
          parallelism: 1,
          template: {
            spec: {
              maxRetries: 0,
              timeoutSeconds: '900',
              serviceAccountName:
                'weeditpro-sam31-package-sa@reeditpro.iam.gserviceaccount.com',
              containers: [{
                image:
                  `us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/${
                    'weeditpro-sam31-qualification-package-publisher'}@sha256:${
                    '4'.repeat(64)}`,
                resources: { limits: { cpu: '1', memory: '2Gi' } },
                env: Object.entries(environment).map(([name, value]) => ({
                  name,
                  value,
                })),
              }],
            },
          },
        },
      },
    },
    status: {
      observedGeneration: 2,
      executionCount: 1,
      conditions: [{ type: 'Ready', status: 'True' }],
    },
  }
}

function hashObservation(value: Record<string, unknown>): string {
  const { observationSha256: ignored, ...payload } = value
  void ignored
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex')
}
