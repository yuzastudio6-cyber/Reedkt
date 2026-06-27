#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const packet = 'RP-EXTERNAL-BETA-CONTROLLED-TESTER-PRODUCT-FLOW-SMOKE-1'
const confirmEnv = 'REEDITPRO_CONFIRM_EXTERNAL_BETA_CONTROLLED_TESTER_PRODUCT_FLOW_SMOKE'
const testerEmailEnv = 'REEDITPRO_EXTERNAL_BETA_TESTER_EMAIL'
const testerEmail = 'aiediting@reeditpro.com'
const groupEmail = 'external-beta-testers@reeditpro.com'
const groupResource = 'groups/0279ka651g62ifo'
const project = 'reeditpro'
const service = 'reeditpro-staging-api'
const region = 'us-central1'
const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`
const outputDir = path.join('/tmp/reeditpro-rp-external-beta-controlled-tester-product-flow-smoke-1', runId)
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const successRouteIds = [
  'planning.demo.chatNative.create',
  'credits.estimate.create',
  'credits.gate.check',
  'jobs.gate.check',
  'render.creditGate.check',
  'render.readiness.check',
]

const blockedRouteIds = [
  'planning.editPlan.approve',
  'render.preview.create',
]

const baseContext = {
  mode: 'mock',
  userId: 'external-beta-tester-aiediting',
  workspaceId: 'workspace-external-beta-controlled-smoke',
  projectId: 'project-external-beta-controlled-smoke',
  requestId: `external-beta-product-flow-${runId}`,
  mockOnly: true,
}

const report = {
  packet,
  runId,
  outputDir,
  decision: null,
  execution: 'guarded_authenticated_tester_mock_product_flow_smoke_no_persistent_runtime_mutation',
  blocker: null,
  confirmation: process.env[confirmEnv] === 'true',
  testerEmail: process.env[testerEmailEnv] || testerEmail,
  testerClassification: 'owner_approved_primary_real_tester_account',
  group: {
    email: groupEmail,
    resource: groupResource,
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
  routeMap: {
    status: null,
    totalRoutes: null,
    mockReadyRoutes: null,
    requiredRoutesPresent: false,
  },
  smoke: {
    unauthenticatedHealth: null,
    successRoutes: [],
    blockedRoutes: [],
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

async function requestJson(url, { token, method = 'GET', body } = {}) {
  const headers = token
    ? { authorization: `Bearer ${token}` }
    : {}
  if (body) headers['content-type'] = 'application/json'
  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await response.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = null
  }
  return {
    status: response.status,
    bodySnippet: text.slice(0, 300),
    json,
  }
}

function buildMockEnvelope(routeId) {
  return {
    routeId,
    context: baseContext,
    body: {
      workspaceId: baseContext.workspaceId,
      userId: baseContext.userId,
      projectTitle: 'External beta controlled tester mock product flow',
      prompt: 'Create a clean real estate listing edit plan, show source sequence, estimate credits, and stop before generation.',
      requestedStrokeMotion: false,
    },
  }
}

function summarizeApiEnvelope(routeId, apiEnvelope) {
  const data = apiEnvelope?.data || {}
  const summary = {
    routeId,
    ok: Boolean(apiEnvelope?.ok),
    statusCode: Number(apiEnvelope?.statusCode || 0),
    mockOnly: apiEnvelope?.mockOnly === true,
    errorCode: apiEnvelope?.error?.code || null,
    warningsCount: Array.isArray(apiEnvelope?.warnings) ? apiEnvelope.warnings.length : 0,
  }

  if (routeId.startsWith('planning.') && data?.nextRequiredAction) {
    summary.nextRequiredAction = data.nextRequiredAction
    summary.editPlanStatus = data.editPlan?.status || null
    summary.creditEstimateCredits = data.creditEstimate?.totalEstimatedCredits ?? null
    summary.sourceAssetCount = Array.isArray(data.sourceAssets) ? data.sourceAssets.length : null
  }

  if (routeId === 'credits.estimate.create') {
    summary.nextStep = data.nextStep || null
    summary.creditEstimateCredits = data.creditEstimate?.totalEstimatedCredits ?? null
  }

  if (data?.creditGateResult) {
    summary.creditGateOk = data.creditGateResult.ok === true
    summary.nextStep = data.nextStep || null
  }

  if (data?.gateCheck) {
    summary.jobGateOk = data.gateCheck.ok === true
    summary.nextStep = data.nextStep || null
  }

  return summary
}

async function callMockRoute(url, token, routeId) {
  const response = await requestJson(`${url}/api/mock`, {
    token,
    method: 'POST',
    body: buildMockEnvelope(routeId),
  })
  return {
    routeId,
    httpStatus: response.status,
    ...summarizeApiEnvelope(routeId, response.json),
  }
}

function writeReportAndExit(blocker, code = 1) {
  report.decision = blocker
    ? 'blocked_external_beta_controlled_tester_product_flow_smoke'
    : 'completed_external_beta_controlled_tester_product_flow_smoke'
  report.blocker = blocker
  const reportPath = path.join(outputDir, 'controlled-tester-product-flow-smoke-report.json')
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
  writeReportAndExit('blocked_pending_external_beta_controlled_tester_product_flow_smoke_confirmation')
}

if (normalizeEmail(report.testerEmail) !== testerEmail) {
  writeReportAndExit('blocked_tester_email_not_owner_approved_primary_account')
}

const memberships = parseJsonCommand(
  ['gcloud', 'identity', 'groups', 'memberships', 'list', `--group-email=${groupEmail}`, `--project=${project}`, '--format=json'],
  'blocked_group_membership_readback_failed',
)
report.group.actualTesterMemberPresent = memberships
  .map((item) => normalizeEmail(item?.preferredMemberKey?.id))
  .includes(testerEmail)
if (!report.group.actualTesterMemberPresent) {
  writeReportAndExit('blocked_pending_owner_approved_tester_group_membership')
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
report.cloudRun.traffic = (serviceStatus?.status?.traffic || [])
  .map((item) => `${item.percent}_percent_${item.revisionName}`)
  .join(',')
const ready = (serviceStatus?.status?.conditions || []).find((condition) => condition.type === 'Ready')
if (!report.cloudRun.url || ready?.status !== 'True') {
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
  token = run(['gcloud', 'auth', 'print-identity-token', `--audiences=${report.cloudRun.url}`]).trim()
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
  const unauthHealth = await requestJson(`${report.cloudRun.url}/health`)
  report.smoke.unauthenticatedHealth = unauthHealth.status === 403 ? 'blocked_403' : `unexpected_${unauthHealth.status}`

  const routes = await requestJson(`${report.cloudRun.url}/api/routes`, { token })
  report.routeMap.status = routes.status
  report.routeMap.totalRoutes = routes.json?.summary?.totalRoutes ?? null
  report.routeMap.mockReadyRoutes = routes.json?.summary?.mockReadyRoutes ?? null
  const routeIds = new Set((routes.json?.routes || []).map((route) => route.id))
  report.routeMap.requiredRoutesPresent = [...successRouteIds, ...blockedRouteIds].every((routeId) => routeIds.has(routeId))

  for (const routeId of successRouteIds) {
    report.smoke.successRoutes.push(await callMockRoute(report.cloudRun.url, token, routeId))
  }
  for (const routeId of blockedRouteIds) {
    report.smoke.blockedRoutes.push(await callMockRoute(report.cloudRun.url, token, routeId))
  }
} catch (error) {
  report.commandError = {
    command: 'controlled tester product-flow smoke',
    message: String(error?.message || error),
  }
  writeReportAndExit('blocked_tester_product_flow_request_failed')
}

if (report.smoke.unauthenticatedHealth !== 'blocked_403') writeReportAndExit('blocked_unauthenticated_health_not_forbidden')
if (report.routeMap.status !== 200 || !report.routeMap.requiredRoutesPresent) writeReportAndExit('blocked_product_flow_route_map_readback_failed')

for (const route of report.smoke.successRoutes) {
  if (route.httpStatus !== 200 || route.statusCode !== 200 || route.ok !== true || route.mockOnly !== true) {
    writeReportAndExit('blocked_mock_product_flow_route_failed')
  }
}

for (const route of report.smoke.blockedRoutes) {
  if (route.httpStatus !== 424 || route.statusCode !== 424 || route.ok !== false || route.mockOnly !== true || route.errorCode !== 'backend_runtime_required') {
    writeReportAndExit('blocked_backend_required_route_not_safely_blocked')
  }
}

const planning = report.smoke.successRoutes.find((route) => route.routeId === 'planning.demo.chatNative.create')
if (planning?.nextRequiredAction !== 'approve_plan_and_credits') writeReportAndExit('blocked_planning_flow_did_not_stop_before_approval')

const jobGate = report.smoke.successRoutes.find((route) => route.routeId === 'jobs.gate.check')
if (jobGate?.jobGateOk !== false) writeReportAndExit('blocked_job_gate_unexpectedly_allowed_execution')

writeReportAndExit(null, 0)
