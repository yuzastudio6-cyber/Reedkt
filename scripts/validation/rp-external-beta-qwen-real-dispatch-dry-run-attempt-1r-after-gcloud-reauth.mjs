#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const packet = 'RP-EXTERNAL-BETA-QWEN-REAL-DISPATCH-DRY-RUN-ATTEMPT-1R-AFTER-GCLOUD-REAUTH'
const confirmationVar = 'REEDITPRO_CONFIRM_QWEN_REAL_DISPATCH_DRY_RUN_ATTEMPT_1R_AFTER_GCLOUD_REAUTH'
const expectedAccount = 'aiediting@reeditpro.com'
const expectedProject = 'reeditpro'
const region = 'us-central1'
const stagingService = 'reeditpro-staging-api'
const qwenService = 'reeditpro-qwen2-5-vl-l4-worker'
const baseOutputDir = '/tmp/reeditpro-rp-external-beta-qwen-real-dispatch-dry-run-attempt-1r-after-gcloud-reauth'
const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`
const outputDir = path.join(baseOutputDir, runId)
const runEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

fs.mkdirSync(outputDir, { recursive: true })

function sanitize(value) {
  return String(value ?? '')
    .replace(/ya29\.[A-Za-z0-9_-]+/g, 'ya29.[redacted]')
    .replace(/sbp_[A-Za-z0-9_./=-]+/g, 'sbp_[redacted]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, 'Bearer [redacted]')
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function writeJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`)
}

function runText(command, args) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    env: runEnv,
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 8 * 1024 * 1024,
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
      env: runEnv,
      stdio: ['ignore', fd, 'pipe'],
      encoding: 'utf8',
      maxBuffer: 1024 * 1024,
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

function describeCloudRunService(service) {
  const result = runText('gcloud', [
    'run',
    'services',
    'describe',
    service,
    `--project=${expectedProject}`,
    `--region=${region}`,
    '--format=json(metadata.name,metadata.generation,status.conditions,status.latestCreatedRevisionName,status.latestReadyRevisionName,status.observedGeneration,status.traffic,status.url)',
  ])
  if (!result.ok) return { ok: false, commandResult: result }
  try {
    const parsed = JSON.parse(result.stdout)
    const readyCondition = (parsed?.status?.conditions ?? []).find((condition) => condition.type === 'Ready')
    return {
      ok: true,
      service,
      metadataName: parsed?.metadata?.name ?? null,
      generation: parsed?.metadata?.generation ?? null,
      observedGeneration: parsed?.status?.observedGeneration ?? null,
      readyStatus: readyCondition?.status ?? null,
      latestCreatedRevisionName: parsed?.status?.latestCreatedRevisionName ?? null,
      latestReadyRevisionName: parsed?.status?.latestReadyRevisionName ?? null,
      traffic: (parsed?.status?.traffic ?? []).map((item) => ({
        percent: item.percent ?? null,
        revisionName: item.revisionName ?? null,
        latestRevision: item.latestRevision ?? null,
      })),
      urlHost: parsed?.status?.url ? new URL(parsed.status.url).host : null,
    }
  } catch (error) {
    return {
      ok: false,
      commandResult: result,
      parseError: sanitize(error.message),
    }
  }
}

function fileSummary(file) {
  return {
    fileName: path.basename(file),
    path: file,
    bytes: fs.statSync(file).size,
    sha256: sha256(file),
  }
}

function baseSafety(overrides = {}) {
  return {
    localGcloudConfigRead: false,
    userAccessTokenProbe: false,
    adcAccessTokenProbe: false,
    tokenValuePrinted: false,
    tokenValuePersistedInRepo: false,
    tokenTempFileDeleted: true,
    cloudRunServiceMetadataReadback: false,
    cloudRunInvocation: false,
    cloudRunDeployment: false,
    cloudRunServiceUpdate: false,
    identityTokenFetch: false,
    requestSent: false,
    qwen25VlExecution: false,
    providerCall: false,
    modelCall: false,
    workerExecution: false,
    workerDispatch: false,
    serviceRoleRouteExecution: false,
    supabaseMutation: false,
    sqlExecution: false,
    secretPayloadAccess: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    generatedAssetCreation: false,
    creditMutation: false,
    stripePaymentProcessing: false,
    broadExternalBetaAudienceUnlock: false,
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

function finish(report, exitCode) {
  const finalReport = {
    packet,
    runId,
    outputDir,
    generatedAt: new Date().toISOString(),
    expectedContext: {
      account: expectedAccount,
      project: expectedProject,
      region,
      stagingService,
      qwenService,
    },
    ...report,
  }
  const reportPath = path.join(outputDir, 'qwen-real-dispatch-dry-run-attempt-1r-after-gcloud-reauth-report.json')
  writeJson(reportPath, finalReport)
  const manifestPath = path.join(outputDir, 'qwen-real-dispatch-dry-run-attempt-1r-after-gcloud-reauth-manifest.json')
  writeJson(manifestPath, {
    packet,
    runId,
    outputDir,
    generatedAt: new Date().toISOString(),
    artifacts: [fileSummary(reportPath)],
  })
  const checksumsPath = path.join(outputDir, 'qwen-real-dispatch-dry-run-attempt-1r-after-gcloud-reauth-checksums.json')
  writeJson(checksumsPath, {
    packet,
    runId,
    outputDir,
    generatedAt: new Date().toISOString(),
    artifacts: [fileSummary(reportPath), fileSummary(manifestPath)],
  })

  console.log(`${packet} result: ${finalReport.decision}`)
  console.log(`Run ID: ${runId}`)
  console.log(`Output directory: ${outputDir}`)
  console.log(`Report: ${reportPath}`)
  console.log(`Manifest: ${manifestPath}`)
  console.log(`Checksums: ${checksumsPath}`)
  process.exit(exitCode)
}

if (process.env[confirmationVar] !== 'true') {
  finish(
    {
      decision: 'blocked_pending_qwen_real_dispatch_dry_run_attempt_1r_confirmation',
      execution: 'blocked_confirmation_absent_no_transport_readback',
      blocker: 'blocked_pending_qwen_real_dispatch_dry_run_attempt_1r_confirmation',
      confirmationGate: {
        env: confirmationVar,
        requiredValue: 'true',
        confirmed: false,
      },
      safety: baseSafety(),
      productReadyEndToEndLocalOssTools: 0,
      packageLock: 'unchanged',
      generatedArtifactsCommitted: 'none',
    },
    1,
  )
}

const account = runText('gcloud', ['config', 'get-value', 'account'])
const project = runText('gcloud', ['config', 'get-value', 'project'])
const accountValue = account.stdout.split('\n').at(-1)?.trim()
const projectValue = project.stdout.split('\n').at(-1)?.trim()
const contextSafety = baseSafety({ localGcloudConfigRead: true })

if (!account.ok || !project.ok || accountValue !== expectedAccount || projectValue !== expectedProject) {
  finish(
    {
      decision: 'blocked_gcloud_account_or_project_mismatch_before_qwen_real_dispatch_1r',
      execution: 'blocked_gcloud_context_mismatch_no_transport_readback',
      blocker: 'blocked_gcloud_account_or_project_mismatch_before_qwen_real_dispatch_1r',
      confirmationGate: {
        env: confirmationVar,
        requiredValue: 'true',
        confirmed: true,
      },
      observedContext: {
        account: accountValue ?? null,
        project: projectValue ?? null,
      },
      commandResults: { account, project },
      safety: contextSafety,
      productReadyEndToEndLocalOssTools: 0,
      packageLock: 'unchanged',
      generatedArtifactsCommitted: 'none',
    },
    1,
  )
}

const userToken = runTokenProbe(['auth', 'print-access-token', '--quiet'], 'qwen-user-access')
if (!userToken.ok) {
  finish(
    {
      decision: 'blocked_gcloud_user_reauthentication_required_before_qwen_real_dispatch_1r',
      execution: 'blocked_user_access_token_preflight_no_transport_readback',
      blocker: 'blocked_gcloud_user_reauthentication_required_before_qwen_real_dispatch_1r',
      confirmationGate: {
        env: confirmationVar,
        requiredValue: 'true',
        confirmed: true,
      },
      observedContext: {
        account: accountValue,
        project: projectValue,
      },
      tokenProbes: {
        userAccessToken: userToken,
        applicationDefaultCredential: 'not_run_user_token_blocked',
      },
      safety: baseSafety({
        localGcloudConfigRead: true,
        userAccessTokenProbe: true,
        tokenTempFileDeleted: userToken.tempFileDeleted,
      }),
      productReadyEndToEndLocalOssTools: 0,
      packageLock: 'unchanged',
      generatedArtifactsCommitted: 'none',
    },
    1,
  )
}

const adcToken = runTokenProbe(['auth', 'application-default', 'print-access-token', '--quiet'], 'qwen-adc-access')
if (!adcToken.ok) {
  finish(
    {
      decision: 'blocked_gcloud_adc_reauthentication_required_before_qwen_real_dispatch_1r',
      execution: 'blocked_adc_access_token_preflight_no_transport_readback',
      blocker: 'blocked_gcloud_adc_reauthentication_required_before_qwen_real_dispatch_1r',
      confirmationGate: {
        env: confirmationVar,
        requiredValue: 'true',
        confirmed: true,
      },
      observedContext: {
        account: accountValue,
        project: projectValue,
      },
      tokenProbes: {
        userAccessToken: userToken,
        applicationDefaultCredential: adcToken,
      },
      safety: baseSafety({
        localGcloudConfigRead: true,
        userAccessTokenProbe: true,
        adcAccessTokenProbe: true,
        tokenTempFileDeleted: userToken.tempFileDeleted && adcToken.tempFileDeleted,
      }),
      productReadyEndToEndLocalOssTools: 0,
      packageLock: 'unchanged',
      generatedArtifactsCommitted: 'none',
    },
    1,
  )
}

const stagingReadback = describeCloudRunService(stagingService)
if (!stagingReadback.ok) {
  finish(
    {
      decision: 'blocked_staging_service_metadata_readback_failed_before_qwen_real_dispatch_1r',
      execution: 'blocked_staging_service_metadata_readback_no_runtime_invocation',
      blocker: 'blocked_staging_service_metadata_readback_failed_before_qwen_real_dispatch_1r',
      confirmationGate: {
        env: confirmationVar,
        requiredValue: 'true',
        confirmed: true,
      },
      observedContext: {
        account: accountValue,
        project: projectValue,
      },
      tokenProbes: {
        userAccessToken: userToken,
        applicationDefaultCredential: adcToken,
      },
      serviceReadback: {
        staging: stagingReadback,
      },
      safety: baseSafety({
        localGcloudConfigRead: true,
        userAccessTokenProbe: true,
        adcAccessTokenProbe: true,
        tokenTempFileDeleted: userToken.tempFileDeleted && adcToken.tempFileDeleted,
        cloudRunServiceMetadataReadback: true,
      }),
      productReadyEndToEndLocalOssTools: 0,
      packageLock: 'unchanged',
      generatedArtifactsCommitted: 'none',
    },
    1,
  )
}

const qwenReadback = describeCloudRunService(qwenService)
if (!qwenReadback.ok) {
  finish(
    {
      decision: 'blocked_qwen_worker_service_metadata_readback_failed_before_qwen_real_dispatch_1r',
      execution: 'blocked_qwen_worker_service_metadata_readback_no_runtime_invocation',
      blocker: 'blocked_qwen_worker_service_metadata_readback_failed_before_qwen_real_dispatch_1r',
      confirmationGate: {
        env: confirmationVar,
        requiredValue: 'true',
        confirmed: true,
      },
      observedContext: {
        account: accountValue,
        project: projectValue,
      },
      tokenProbes: {
        userAccessToken: userToken,
        applicationDefaultCredential: adcToken,
      },
      serviceReadback: {
        staging: stagingReadback,
        qwenWorker: qwenReadback,
      },
      safety: baseSafety({
        localGcloudConfigRead: true,
        userAccessTokenProbe: true,
        adcAccessTokenProbe: true,
        tokenTempFileDeleted: userToken.tempFileDeleted && adcToken.tempFileDeleted,
        cloudRunServiceMetadataReadback: true,
      }),
      productReadyEndToEndLocalOssTools: 0,
      packageLock: 'unchanged',
      generatedArtifactsCommitted: 'none',
    },
    1,
  )
}

finish(
  {
    decision: 'completed_qwen_real_dispatch_dry_run_attempt_1r_after_gcloud_reauth_transport_readback',
    execution: 'completed_authenticated_transport_metadata_readback_no_runtime_invocation',
    blocker: 'none',
    confirmationGate: {
      env: confirmationVar,
      requiredValue: 'true',
      confirmed: true,
    },
    observedContext: {
      account: accountValue,
      project: projectValue,
    },
    tokenProbes: {
      userAccessToken: {
        ok: userToken.ok,
        exitCode: userToken.exitCode,
        tempFileDeleted: userToken.tempFileDeleted,
      },
      applicationDefaultCredential: {
        ok: adcToken.ok,
        exitCode: adcToken.exitCode,
        tempFileDeleted: adcToken.tempFileDeleted,
      },
      tokenValuePrinted: false,
      tokenValuePersistedInRepo: false,
    },
    serviceReadback: {
      staging: stagingReadback,
      qwenWorker: qwenReadback,
    },
    readiness: {
      qwenAuthPath: 'closed_gcloud_user_and_adc_reauth_preflight_passed',
      qwenRealDispatchDryRunAttempt1r: 'transport_metadata_readback_passed_runtime_invocation_still_blocked',
      qwen25VlExecution: 'blocked_pending_separate_confirmed_runtime_dispatch_execution_packet',
      workerDispatch: 'blocked_pending_separate_confirmed_runtime_dispatch_execution_packet',
      broadExternalBetaExpansion: 'blocked_no_additional_named_tester_list',
      externalProduction: 'blocked_pending_broad_beta_tool_runtime_billing_support_legal_security_and_final_export_gates',
      productReadyEndToEndLocalOssTools: 0,
      nextMilestone: 'QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_EXECUTION_ATTEMPT_1R',
    },
    safety: baseSafety({
      localGcloudConfigRead: true,
      userAccessTokenProbe: true,
      adcAccessTokenProbe: true,
      tokenTempFileDeleted: userToken.tempFileDeleted && adcToken.tempFileDeleted,
      cloudRunServiceMetadataReadback: true,
    }),
    packageLock: 'unchanged',
    generatedArtifactsCommitted: 'none',
  },
  0,
)
