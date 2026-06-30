#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const packet = 'RP-EXTERNAL-BETA-OPERATOR-GCLOUD-AUTH-PREFLIGHT-1'
const confirmationVar = 'REEDITPRO_CONFIRM_EXTERNAL_BETA_OPERATOR_GCLOUD_AUTH_PREFLIGHT'
const expectedAccount = 'aiediting@reeditpro.com'
const expectedProject = 'reeditpro'
const baseOutputDir = '/tmp/reeditpro-rp-external-beta-operator-gcloud-auth-preflight-1'
const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`
const outputDir = path.join(baseOutputDir, runId)

fs.mkdirSync(outputDir, { recursive: true })

function sanitize(value) {
  return String(value ?? '')
    .replace(/ya29\.[A-Za-z0-9_-]+/g, 'ya29.[redacted]')
    .replace(/sbp_[A-Za-z0-9_./=-]+/g, 'sbp_[redacted]')
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function writeJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`)
}

function runText(args) {
  const result = spawnSync('gcloud', args, {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  return {
    ok: result.status === 0,
    exitCode: typeof result.status === 'number' ? result.status : 1,
    stdout: sanitize(result.stdout).trim(),
    stderr: sanitize(result.stderr).trim(),
    error: result.error?.message ? sanitize(result.error.message) : null,
  }
}

function runTokenProbe(args, label) {
  const tempFile = path.join(os.tmpdir(), `reeditpro-${label}-${process.pid}-${crypto.randomBytes(4).toString('hex')}.token`)
  const fd = fs.openSync(tempFile, 'w', 0o600)
  let result
  try {
    result = spawnSync('gcloud', args, {
      env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
      stdio: ['ignore', fd, 'pipe'],
      encoding: 'utf8',
    })
  } finally {
    fs.closeSync(fd)
  }

  let bytes = 0
  try {
    bytes = fs.existsSync(tempFile) ? fs.statSync(tempFile).size : 0
  } finally {
    if (fs.existsSync(tempFile)) fs.rmSync(tempFile, { force: true })
  }

  return {
    ok: result.status === 0 && bytes > 0,
    exitCode: typeof result.status === 'number' ? result.status : 1,
    tokenBytesObserved: bytes,
    tempFileDeleted: !fs.existsSync(tempFile),
    stderr: sanitize(result.stderr ?? '').trim(),
    error: result.error?.message ? sanitize(result.error.message) : null,
  }
}

function finish(report, exitCode) {
  const reportPath = path.join(outputDir, 'operator-gcloud-auth-preflight-report.json')
  const finalReport = {
    packet,
    runId,
    outputDir,
    generatedAt: new Date().toISOString(),
    expectedContext: {
      account: expectedAccount,
      project: expectedProject,
      service: 'reeditpro-staging-api',
      region: 'us-central1',
    },
    ...report,
  }
  writeJson(reportPath, finalReport)
  const manifestPath = path.join(outputDir, 'operator-gcloud-auth-preflight-manifest.json')
  const manifest = {
    packet,
    runId,
    outputDir,
    generatedAt: new Date().toISOString(),
    artifacts: [
      {
        fileName: path.basename(reportPath),
        path: reportPath,
        bytes: fs.statSync(reportPath).size,
        sha256: sha256(reportPath),
      },
    ],
  }
  writeJson(manifestPath, manifest)
  manifest.artifacts.push({
    fileName: path.basename(manifestPath),
    path: manifestPath,
    bytes: fs.statSync(manifestPath).size,
    sha256: sha256(manifestPath),
  })
  writeJson(manifestPath, manifest)

  console.log(`${packet} result: ${finalReport.decision}`)
  console.log(`Run ID: ${runId}`)
  console.log(`Output directory: ${outputDir}`)
  console.log(`Report: ${reportPath}`)
  console.log(`Manifest: ${manifestPath}`)
  process.exit(exitCode)
}

function safety(overrides = {}) {
  return {
    localGcloudConfigRead: false,
    userAccessTokenProbe: false,
    adcAccessTokenProbe: false,
    tokenValuePrinted: false,
    tokenValuePersistedInRepo: false,
    tokenTempFileDeleted: true,
    cloudRunInvocation: false,
    cloudRunDeployment: false,
    identityTokenFetch: false,
    requestSent: false,
    qwen25VlExecution: false,
    workerExecution: false,
    workerDispatch: false,
    supabaseMutation: false,
    sqlExecution: false,
    secretPayloadAccess: false,
    providerCall: false,
    modelCall: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    creditMutation: false,
    externalBetaBroadAudienceUnlock: false,
    paidProductionUnlock: false,
    productionUnlock: false,
    finalRenderExport: false,
    mediaProcessing: false,
    dockerExecution: false,
    remotionExecution: false,
    dependencyMutation: false,
    packageLockMutation: false,
    iamMutation: false,
    groupMembershipMutation: false,
    ...overrides,
  }
}

if (process.env[confirmationVar] !== 'true') {
  finish(
    {
      decision: 'blocked_pending_operator_gcloud_auth_preflight_confirmation',
      execution: 'blocked_no_local_auth_preflight_confirmation_absent',
      blocker: 'blocked_pending_operator_gcloud_auth_preflight_confirmation',
      confirmationVar,
      confirmationObserved: 'absent_or_not_true',
      safety: safety(),
      productReadyEndToEndLocalOssTools: 0,
    },
    1,
  )
}

const version = runText(['--version'])
if (!version.ok) {
  finish(
    {
      decision: 'blocked_gcloud_cli_unavailable',
      execution: 'blocked_gcloud_cli_unavailable_no_runtime_invocation',
      blocker: 'blocked_gcloud_cli_unavailable',
      gcloudVersion: version,
      safety: safety(),
      productReadyEndToEndLocalOssTools: 0,
    },
    1,
  )
}

const account = runText(['config', 'get-value', 'account'])
const project = runText(['config', 'get-value', 'project'])
const accountValue = account.stdout.split('\n').at(-1)?.trim()
const projectValue = project.stdout.split('\n').at(-1)?.trim()

if (!account.ok || !project.ok || accountValue !== expectedAccount || projectValue !== expectedProject) {
  finish(
    {
      decision: 'blocked_gcloud_account_or_project_mismatch',
      execution: 'blocked_gcloud_context_mismatch_no_runtime_invocation',
      blocker: 'blocked_gcloud_account_or_project_mismatch',
      observedContext: {
        account: accountValue ?? null,
        project: projectValue ?? null,
      },
      commandResults: { account, project },
      safety: safety({ localGcloudConfigRead: true }),
      productReadyEndToEndLocalOssTools: 0,
    },
    1,
  )
}

const userToken = runTokenProbe(['auth', 'print-access-token', '--quiet'], 'user-access')
if (!userToken.ok) {
  finish(
    {
      decision: 'blocked_gcloud_user_reauthentication_required',
      execution: 'blocked_user_access_token_preflight_no_runtime_invocation',
      blocker: 'blocked_gcloud_user_reauthentication_required',
      observedContext: { account: accountValue, project: projectValue },
      userTokenProbe: userToken,
      safety: safety({ localGcloudConfigRead: true, userAccessTokenProbe: true, tokenTempFileDeleted: userToken.tempFileDeleted }),
      productReadyEndToEndLocalOssTools: 0,
    },
    1,
  )
}

const adcToken = runTokenProbe(['auth', 'application-default', 'print-access-token', '--quiet'], 'adc-access')
if (!adcToken.ok) {
  finish(
    {
      decision: 'blocked_gcloud_adc_reauthentication_required',
      execution: 'blocked_adc_access_token_preflight_no_runtime_invocation',
      blocker: 'blocked_gcloud_adc_reauthentication_required',
      observedContext: { account: accountValue, project: projectValue },
      userTokenProbe: { ...userToken, tokenBytesObserved: 'nonzero_redacted' },
      adcTokenProbe: adcToken,
      safety: safety({
        localGcloudConfigRead: true,
        userAccessTokenProbe: true,
        adcAccessTokenProbe: true,
        tokenTempFileDeleted: userToken.tempFileDeleted && adcToken.tempFileDeleted,
      }),
      productReadyEndToEndLocalOssTools: 0,
    },
    1,
  )
}

finish(
  {
    decision: 'completed_operator_gcloud_user_and_adc_auth_preflight_ready_for_single_tester_qa_and_qwen_dispatch_retry',
    execution: 'completed_local_gcloud_auth_preflight_no_runtime_invocation',
    blocker: 'none',
    observedContext: { account: accountValue, project: projectValue },
    userTokenProbe: { ...userToken, tokenBytesObserved: 'nonzero_redacted' },
    adcTokenProbe: { ...adcToken, tokenBytesObserved: 'nonzero_redacted' },
    readiness: {
      singleTesterRealUsageQa1r: 'ready_for_guarded_retry',
      qwenRealDispatch1rAfterGcloudReauth: 'ready_for_guarded_retry',
      broadExternalBetaExpansion: 'blocked_no_additional_named_tester_list',
    },
    safety: safety({
      localGcloudConfigRead: true,
      userAccessTokenProbe: true,
      adcAccessTokenProbe: true,
      tokenTempFileDeleted: userToken.tempFileDeleted && adcToken.tempFileDeleted,
    }),
    productReadyEndToEndLocalOssTools: 0,
  },
  0,
)
