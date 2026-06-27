#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const packet = 'RP-EXTERNAL-BETA-CONTROLLED-TESTER-UI-FLOW-SMOKE-1'
const confirmEnv = 'REEDITPRO_CONFIRM_EXTERNAL_BETA_CONTROLLED_TESTER_UI_FLOW_SMOKE'
const testerEmailEnv = 'REEDITPRO_EXTERNAL_BETA_TESTER_EMAIL'
const testerEmail = 'aiediting@reeditpro.com'
const groupEmail = 'external-beta-testers@reeditpro.com'
const project = 'reeditpro'
const service = 'reeditpro-staging-api'
const region = 'us-central1'
const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`
const outputDir = path.join('/tmp/reeditpro-rp-external-beta-controlled-tester-ui-flow-smoke-1', runId)
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const report = {
  packet,
  runId,
  outputDir,
  decision: null,
  execution: 'completed_guarded_authenticated_ui_surface_probe_no_runtime_mutation',
  blocker: null,
  confirmation: process.env[confirmEnv] === 'true',
  testerEmail: process.env[testerEmailEnv] || testerEmail,
  testerClassification: 'owner_approved_primary_real_tester_account',
  sourceInputs: {
    productFlowSmoke: 'completed_external_beta_controlled_tester_product_flow_smoke',
    testerAccountMembershipSmoke: 'completed_owner_approved_tester_account_membership_smoke',
    currentReadinessRollup: 'ready_for_controlled_owner_tester_product_walkthrough',
    pr577: 'open_draft_blocked_excluded',
  },
  cloudRun: {
    project,
    service,
    region,
    serviceUrl: null,
    latestReadyRevision: null,
    serviceReady: null,
    traffic: null,
    allServices: [],
    uiServiceCandidates: [],
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
  probes: [],
  readiness: {
    externalProductBeta: 'blocked_pending_deployed_browser_ui_surface_for_owner_walkthrough',
    productApiReadiness: 'ready_for_controlled_owner_tester_product_walkthrough',
    nextMilestone: 'RP-EXTERNAL-BETA-DEPLOYED-BROWSER-UI-SURFACE-1',
    productReadyEndToEndLocalOssTools: 0,
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
    workerDispatch: false,
    serviceRoleRouteExecution: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    creditMutation: false,
    persistentCreditMutation: false,
    persistentCreditReservationCreation: false,
    stripePaymentProcessing: false,
    renderExecution: false,
    mediaProcessing: false,
    remotionExecution: false,
    ffmpegExecution: false,
    ffprobeExecution: false,
    dockerExecution: false,
    browserCapture: false,
    internalBetaBroadUnlock: false,
    externalBetaBroadAudienceUnlock: false,
    productionUnlock: false,
    packageLockMutation: false,
  },
}

fs.mkdirSync(outputDir, { recursive: true })

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

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
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

async function requestText(url, { token, accept = 'text/html' } = {}) {
  const headers = { accept }
  if (token) headers.authorization = `Bearer ${token}`
  const response = await fetch(url, { headers, redirect: 'follow' })
  const text = await response.text()
  return {
    url,
    status: response.status,
    contentType: response.headers.get('content-type') || null,
    bodyBytes: Buffer.byteLength(text),
    bodySnippet: text.slice(0, 400),
    htmlLike: /<!doctype html|<html[\s>]/i.test(text),
  }
}

function serviceSummary(serviceItem) {
  return {
    name: serviceItem?.metadata?.name || null,
    location: serviceItem?.metadata?.labels?.['cloud.googleapis.com/location'] || null,
    url: serviceItem?.status?.url || null,
    ready: (serviceItem?.status?.conditions || []).find((condition) => condition.type === 'Ready')?.status || null,
    latestReadyRevision: serviceItem?.status?.latestReadyRevisionName || null,
  }
}

function writeReportAndExit(blocker, code = 1) {
  report.decision = blocker
    ? 'blocked_external_beta_controlled_tester_ui_flow_smoke'
    : 'completed_external_beta_controlled_tester_ui_flow_smoke'
  report.blocker = blocker
  const reportPath = path.join(outputDir, 'controlled-tester-ui-flow-smoke-report.json')
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`)
  const manifest = {
    packet,
    runId,
    note: 'Manifest checksum is recorded by source docs after the local run; the manifest does not self-checksum.',
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

if (!report.confirmation) {
  writeReportAndExit('blocked_pending_external_beta_controlled_tester_ui_flow_smoke_confirmation')
}

if (normalizeEmail(report.testerEmail) !== testerEmail) {
  writeReportAndExit('blocked_tester_email_not_owner_approved_primary_account')
}

const memberships = parseJsonCommand(
  ['gcloud', 'identity', 'groups', 'memberships', 'list', `--group-email=${groupEmail}`, `--project=${project}`, '--format=json'],
  'blocked_group_membership_readback_failed',
)
const actualTesterMemberPresent = memberships
  .map((item) => normalizeEmail(item?.preferredMemberKey?.id))
  .includes(testerEmail)
if (!actualTesterMemberPresent) {
  writeReportAndExit('blocked_pending_owner_approved_tester_group_membership')
}

const services = parseJsonCommand(
  ['gcloud', 'run', 'services', 'list', `--project=${project}`, '--format=json'],
  'blocked_cloud_run_service_discovery_failed',
)
report.cloudRun.allServices = services.map(serviceSummary)
report.cloudRun.uiServiceCandidates = report.cloudRun.allServices.filter((item) => {
  const name = item.name || ''
  return /ui|web|frontend|app/i.test(name) && !/api|worker|render|searxng/i.test(name)
})

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
report.cloudRun.serviceUrl = serviceStatus?.status?.url || null
report.cloudRun.latestReadyRevision = serviceStatus?.status?.latestReadyRevisionName || null
report.cloudRun.serviceReady = (serviceStatus?.status?.conditions || []).find((condition) => condition.type === 'Ready')?.status || null
report.cloudRun.traffic = (serviceStatus?.status?.traffic || [])
  .map((item) => `${item.percent}_percent_${item.revisionName}`)
  .join(',')
if (!report.cloudRun.serviceUrl || report.cloudRun.serviceReady !== 'True') {
  writeReportAndExit('blocked_cloud_run_service_not_ready')
}

const authList = parseJsonCommand(['gcloud', 'auth', 'list', '--format=json'], 'blocked_gcloud_auth_readback_failed')
report.auth.activeAccount = normalizeEmail(authList.find((item) => item.status === 'ACTIVE')?.account)
report.auth.testerAuthActive = report.auth.activeAccount === testerEmail
if (!report.auth.testerAuthActive) {
  writeReportAndExit('blocked_tester_auth_context_not_active')
}

let token
try {
  token = run(['gcloud', 'auth', 'print-identity-token', `--audiences=${report.cloudRun.serviceUrl}`]).trim()
  report.auth.identityTokenMode = 'audience_scoped'
} catch (error) {
  const firstError = String(error?.message || error)
  try {
    token = run(['gcloud', 'auth', 'print-identity-token']).trim()
    report.auth.identityTokenMode = 'user_account_default_audience'
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
  report.probes.push({
    name: 'unauthenticated_root_html_probe',
    ...(await requestText(`${report.cloudRun.serviceUrl}/`)),
  })
  for (const pathName of ['/', '/dashboard', '/projects', '/editor']) {
    report.probes.push({
      name: `authenticated_html_probe_${pathName === '/' ? 'root' : pathName.slice(1)}`,
      ...(await requestText(`${report.cloudRun.serviceUrl}${pathName}`, { token })),
    })
  }
} catch (error) {
  report.commandError = {
    command: 'controlled tester UI surface probe',
    message: String(error?.message || error),
  }
  writeReportAndExit('blocked_tester_ui_surface_probe_failed')
}

const authenticatedProbes = report.probes.filter((probe) => probe.name.startsWith('authenticated_html_probe'))
const hasBrowserUi = authenticatedProbes.some((probe) => probe.status === 200 && probe.htmlLike)
if (hasBrowserUi) {
  writeReportAndExit(null, 0)
}

if (report.cloudRun.uiServiceCandidates.length === 0) {
  writeReportAndExit('blocked_deployed_browser_ui_surface_not_present')
}

writeReportAndExit('blocked_deployed_browser_ui_surface_not_verified')
