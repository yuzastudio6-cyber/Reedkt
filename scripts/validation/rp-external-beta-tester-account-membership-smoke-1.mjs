#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const packet = 'RP-EXTERNAL-BETA-TESTER-ACCOUNT-MEMBERSHIP-SMOKE-1'
const confirmEnv = 'REEDITPRO_CONFIRM_EXTERNAL_BETA_TESTER_ACCOUNT_SMOKE'
const testerEmailEnv = 'REEDITPRO_EXTERNAL_BETA_TESTER_EMAIL'
const groupEmail = 'external-beta-testers@reeditpro.com'
const groupResource = 'groups/0279ka651g62ifo'
const project = 'reeditpro'
const service = 'reeditpro-staging-api'
const region = 'us-central1'
const ownerMemberEmail = 'aiediting@reeditpro.com'
const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`
const outputDir = path.join('/tmp/reeditpro-rp-external-beta-tester-account-membership-smoke-1', runId)
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

fs.mkdirSync(outputDir, { recursive: true })

const report = {
  packet,
  runId,
  outputDir,
  decision: null,
  execution: 'guarded_external_beta_tester_account_membership_and_authenticated_smoke',
  blocker: null,
  confirmation: process.env[confirmEnv] === 'true',
  testerEmail: process.env[testerEmailEnv] || null,
  ownerApprovedPrimaryTesterEmail: ownerMemberEmail,
  testerClassification: null,
  group: {
    email: groupEmail,
    resource: groupResource,
    memberIds: [],
    actualTesterMemberPresent: false,
  },
  cloudRun: {
    project,
    service,
    region,
    url: null,
    latestReadyRevision: null,
    traffic: null,
    iamMember: `group:${groupEmail}`,
    allUsersGrant: null,
    allAuthenticatedUsersGrant: null,
  },
  auth: {
    activeAccount: null,
    testerAuthActive: false,
    identityTokenMode: null,
    identityTokenPrinted: false,
    identityTokenPersisted: false,
  },
  smoke: {
    unauthenticatedHealth: null,
    authenticatedHealth: null,
    authenticatedReady: null,
    authenticatedRuntimeStatus: null,
  },
  safety: {
    groupMembershipMutation: false,
    cloudRunIamMutation: false,
    cloudRunServiceUpdate: false,
    deployment: false,
    broadPublicInvokerGrant: false,
    supabaseMutation: false,
    sqlExecution: false,
    secretPayloadAccess: false,
    providerCall: false,
    modelCall: false,
    workerExecution: false,
    serviceRoleRouteExecution: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    creditMutation: false,
    stripePaymentProcessing: false,
    productionUnlock: false,
    packageLockMutation: false,
  },
}

function run(args, options = {}) {
  return execFileSync(args[0], args.slice(1), {
    env: gitEnv,
    encoding: options.encoding || 'utf8',
    stdio: options.stdio || ['ignore', 'pipe', 'pipe'],
    maxBuffer: 8 * 1024 * 1024,
  })
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function writeReportAndExit(blocker, code = 1) {
  report.decision = blocker ? 'blocked_external_beta_tester_account_membership_smoke' : 'completed_external_beta_tester_account_membership_and_authenticated_smoke'
  report.blocker = blocker
  const reportPath = path.join(outputDir, 'tester-account-membership-smoke-report.json')
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`)
  const manifest = {
    packet,
    runId,
    note: 'Manifest checksum is recorded by the source packet after the local run; the manifest does not self-checksum.',
    files: [
      {
        fileName: path.basename(reportPath),
        bytes: fs.statSync(reportPath).size,
        sha256: sha256(reportPath),
      },
    ],
  }
  const manifestPath = path.join(outputDir, 'artifact-manifest.json')
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
  console.log(`${packet} result: ${report.decision}`)
  if (blocker) console.log(`Blocker: ${blocker}`)
  console.log(`Run ID: ${runId}`)
  console.log(`Output: ${outputDir}`)
  process.exit(code)
}

function parseJsonCommand(args, blocker) {
  try {
    return JSON.parse(run(args))
  } catch (error) {
    report.commandError = {
      command: args.join(' '),
      message: String(error?.message || error),
    }
    writeReportAndExit(blocker)
  }
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

function validateTesterEmail(email) {
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return false
  return true
}

async function request(url, token) {
  const headers = token ? { authorization: `Bearer ${token}` } : {}
  const response = await fetch(url, { method: 'GET', headers })
  const text = await response.text()
  return {
    status: response.status,
    bodySnippet: text.slice(0, 240),
  }
}

if (!report.confirmation) {
  writeReportAndExit('blocked_pending_external_beta_tester_account_smoke_confirmation')
}

const testerEmail = normalizeEmail(process.env[testerEmailEnv])
report.testerEmail = testerEmail
if (!validateTesterEmail(testerEmail)) {
  writeReportAndExit('blocked_missing_valid_external_tester_email')
}
report.testerClassification =
  testerEmail === ownerMemberEmail ? 'owner_approved_primary_real_tester_account' : 'external_tester_account'

const memberships = parseJsonCommand(
  ['gcloud', 'identity', 'groups', 'memberships', 'list', `--group-email=${groupEmail}`, `--project=${project}`, '--format=json'],
  'blocked_group_membership_readback_failed',
)
report.group.memberIds = memberships.map((item) => normalizeEmail(item?.preferredMemberKey?.id)).filter(Boolean)
report.group.actualTesterMemberPresent = report.group.memberIds.includes(testerEmail)
if (!report.group.actualTesterMemberPresent) {
  writeReportAndExit('blocked_pending_actual_external_tester_account_membership')
}

const iamPolicy = parseJsonCommand(
  ['gcloud', 'run', 'services', 'get-iam-policy', service, `--project=${project}`, `--region=${region}`, '--format=json'],
  'blocked_cloud_run_iam_readback_failed',
)
const invokerMembers = (iamPolicy.bindings || [])
  .filter((binding) => binding.role === 'roles/run.invoker')
  .flatMap((binding) => binding.members || [])
report.cloudRun.allUsersGrant = invokerMembers.includes('allUsers')
report.cloudRun.allAuthenticatedUsersGrant = invokerMembers.includes('allAuthenticatedUsers')
if (!invokerMembers.includes(`group:${groupEmail}`)) {
  writeReportAndExit('blocked_cloud_run_group_invoker_binding_missing')
}
if (report.cloudRun.allUsersGrant || report.cloudRun.allAuthenticatedUsersGrant) {
  report.safety.broadPublicInvokerGrant = true
  writeReportAndExit('blocked_broad_cloud_run_invoker_binding_present')
}

const serviceStatus = parseJsonCommand(
  ['gcloud', 'run', 'services', 'describe', service, `--project=${project}`, `--region=${region}`, '--format=json(status.url,status.conditions,status.latestReadyRevisionName,status.traffic)'],
  'blocked_cloud_run_service_readback_failed',
)
report.cloudRun.url = serviceStatus?.status?.url || null
report.cloudRun.latestReadyRevision = serviceStatus?.status?.latestReadyRevisionName || null
const traffic = serviceStatus?.status?.traffic || []
report.cloudRun.traffic = traffic.map((item) => `${item.percent}_percent_${item.revisionName}`).join(',')
const ready = (serviceStatus?.status?.conditions || []).find((condition) => condition.type === 'Ready')
if (!report.cloudRun.url || ready?.status !== 'True') {
  writeReportAndExit('blocked_cloud_run_service_not_ready')
}

const authList = parseJsonCommand(['gcloud', 'auth', 'list', '--format=json'], 'blocked_gcloud_auth_readback_failed')
const activeAccount = normalizeEmail(authList.find((item) => item.status === 'ACTIVE')?.account)
report.auth.activeAccount = activeAccount
report.auth.testerAuthActive = activeAccount === testerEmail
if (!report.auth.testerAuthActive) {
  writeReportAndExit('blocked_tester_auth_context_not_active')
}

let token
try {
  token = run(['gcloud', 'auth', 'print-identity-token', `--audiences=${report.cloudRun.url}`]).trim()
  report.auth.identityTokenMode = 'audience_scoped'
  report.auth.identityTokenPrinted = false
  report.auth.identityTokenPersisted = false
} catch (error) {
  const firstError = String(error?.message || error)
  try {
    token = run(['gcloud', 'auth', 'print-identity-token']).trim()
    report.auth.identityTokenMode = 'user_account_default_audience'
    report.auth.identityTokenPrinted = false
    report.auth.identityTokenPersisted = false
    report.auth.identityTokenFallbackReason = 'audience_scoped_identity_token_requires_service_account'
  } catch (fallbackError) {
    report.commandError = {
      command: 'gcloud auth print-identity-token',
      message: `${firstError}\nFallback error: ${String(fallbackError?.message || fallbackError)}`,
    }
    writeReportAndExit('blocked_tester_identity_token_unavailable')
  }
}

try {
  const unauthHealth = await request(`${report.cloudRun.url}/health`)
  report.smoke.unauthenticatedHealth = unauthHealth.status === 403 ? 'blocked_403' : `unexpected_${unauthHealth.status}`
  const authHealth = await request(`${report.cloudRun.url}/health`, token)
  report.smoke.authenticatedHealth = authHealth.status === 200 ? 'passed_200' : `failed_${authHealth.status}`
  const authReady = await request(`${report.cloudRun.url}/ready`, token)
  report.smoke.authenticatedReady = authReady.status === 200 ? 'passed_200' : `failed_${authReady.status}`
  const authRuntimeStatus = await request(`${report.cloudRun.url}/api/runtime/status`, token)
  report.smoke.authenticatedRuntimeStatus = authRuntimeStatus.status === 200 ? 'passed_200' : `failed_${authRuntimeStatus.status}`
} catch (error) {
  report.commandError = {
    command: 'safe staging API GET smoke',
    message: String(error?.message || error),
  }
  writeReportAndExit('blocked_tester_authenticated_smoke_request_failed')
}

if (report.smoke.unauthenticatedHealth !== 'blocked_403') writeReportAndExit('blocked_unauthenticated_health_not_forbidden')
if (report.smoke.authenticatedHealth !== 'passed_200') writeReportAndExit('blocked_tester_authenticated_health_failed')
if (report.smoke.authenticatedReady !== 'passed_200') writeReportAndExit('blocked_tester_authenticated_ready_failed')
if (report.smoke.authenticatedRuntimeStatus !== 'passed_200') writeReportAndExit('blocked_tester_authenticated_runtime_status_failed')

writeReportAndExit(null, 0)
