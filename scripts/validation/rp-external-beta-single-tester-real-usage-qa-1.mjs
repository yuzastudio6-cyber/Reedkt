#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const packet = 'RP-EXTERNAL-BETA-SINGLE-TESTER-REAL-USAGE-QA-1'
const confirmEnv = 'REEDITPRO_CONFIRM_EXTERNAL_BETA_SINGLE_TESTER_REAL_USAGE_QA'
const testerEmail = 'aiediting@reeditpro.com'
const groupEmail = 'external-beta-testers@reeditpro.com'
const project = 'reeditpro'
const service = 'reeditpro-staging-api'
const region = 'us-central1'
const runId = `single-tester-real-usage-qa-1-${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`
const outputDir = path.join('/tmp/reeditpro-rp-external-beta-single-tester-real-usage-qa-1', runId)
const runEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const safeHtmlRoutes = ['/', '/dashboard', '/projects', '/editor']
const safeJsonRoutes = ['/api/runtime/status', '/api/routes']
const requiredRouteIds = [
  'planning.demo.chatNative.create',
  'credits.estimate.create',
  'credits.gate.check',
  'jobs.gate.check',
  'render.creditGate.check',
  'render.readiness.check',
]

const report = {
  packet,
  runId,
  outputDir,
  decision: 'blocked_pending_single_tester_real_usage_qa_confirmation',
  execution: 'blocked_confirmation_absent_no_runtime_execution',
  blocker: 'blocked_pending_single_tester_real_usage_qa_confirmation',
  confirmationGate: {
    env: confirmEnv,
    requiredValue: 'true',
    confirmed: process.env[confirmEnv] === 'true',
  },
  target: {
    project,
    service,
    region,
    projectRef: 'wmyyttnynmteqgcdishd',
    environment: 'staging',
    serviceUrl: null,
    ready: null,
    latestReadyRevision: null,
    traffic: null,
  },
  tester: {
    email: testerEmail,
    group: groupEmail,
    activeAccount: null,
    activeAccountMatches: false,
  },
  readback: {
    unauthenticatedRootStatus: null,
    authenticatedHtmlRoutes: [],
    authenticatedJsonRoutes: [],
    requiredRoutesPresent: false,
    routeMapTotalRoutes: null,
    routeMapMockReadyRoutes: null,
    staticAssetFetches: [],
  },
  readiness: {
    singleTesterRealUsageQa: 'blocked_pending_confirmation',
    currentLane: 'go_single_tester_only',
    additionalTesterExpansion: 'blocked_no_additional_named_tester_list',
    nextMilestone: 'RP-EXTERNAL-BETA-SINGLE-TESTER-FEEDBACK-ISSUE-FIX-1',
    productReadyEndToEndLocalOssTools: 0,
  },
  safety: {
    authenticatedStagingReadbackOnly: true,
    safeGetRouteExecutionOnly: false,
    groupMembershipMutation: false,
    cloudRunIamMutation: false,
    cloudRunServiceUpdate: false,
    deployment: false,
    supabaseMutation: false,
    sqlExecution: false,
    secretPayloadAccess: false,
    identityTokenPrinted: false,
    identityTokenPersisted: false,
    providerCall: false,
    modelCall: false,
    workerExecution: false,
    workerDispatch: false,
    serviceRoleRouteExecution: false,
    browserCapture: false,
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
    paidProductionUnlock: false,
    productionUnlock: false,
    packageLockMutation: false,
  },
  packageLock: 'unchanged',
  generatedArtifactsCommitted: 'none',
}

fs.mkdirSync(outputDir, { recursive: true })

function run(args, blocker) {
  try {
    return execFileSync(args[0], args.slice(1), {
      env: runEnv,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 8 * 1024 * 1024,
    })
  } catch (error) {
    const stderr = String(error?.stderr || '')
    report.commandError = {
      command: args.join(' '),
      message: String(error?.message || error),
      stderrSnippet: stderr.slice(-600),
    }
    if (args[0] === 'gcloud' && /Reauthentication failed|cannot prompt during non-interactive execution/i.test(stderr)) {
      finalize('blocked_gcloud_reauthentication_required_before_single_tester_real_usage_qa', 1)
    }
    finalize(blocker, 1)
  }
}

function parseJson(args, blocker) {
  return JSON.parse(run(args, blocker))
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

function boundedText(value, limit = 500) {
  return String(value || '').replace(/\s+/g, ' ').slice(0, limit)
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function fileSummary(file) {
  return {
    fileName: path.basename(file),
    bytes: fs.statSync(file).size,
    sha256: sha256(file),
  }
}

function absoluteUrl(baseUrl, routePath) {
  return new URL(routePath, baseUrl).toString()
}

function extractAssetPaths(html) {
  const scripts = [...html.matchAll(/<script[^>]+src=["']([^"']+)["'][^>]*>/gi)].map((match) => match[1])
  const styleHrefFirst = [...html.matchAll(/<link[^>]+href=["']([^"']+)["'][^>]*rel=["']stylesheet["'][^>]*>/gi)].map(
    (match) => match[1],
  )
  const styleRelFirst = [...html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi)].map(
    (match) => match[1],
  )
  return [...new Set([...scripts, ...styleHrefFirst, ...styleRelFirst])]
}

async function request(url, { token, accept = '*/*' } = {}) {
  const headers = { accept }
  if (token) headers.authorization = `Bearer ${token}`
  const response = await fetch(url, { headers, redirect: 'follow' })
  const text = await response.text()
  return {
    url,
    status: response.status,
    contentType: response.headers.get('content-type') || null,
    bodyBytes: Buffer.byteLength(text),
    bodySnippet: boundedText(text),
    text,
  }
}

function finalize(blocker, code = 0) {
  report.blocker = blocker
  if (blocker) {
    report.decision = blocker
    report.execution =
      blocker === 'blocked_gcloud_reauthentication_required_before_single_tester_real_usage_qa'
        ? 'blocked_gcloud_reauth_no_staging_route_readback'
        : report.execution || 'blocked_single_tester_real_usage_qa'
    report.readiness.singleTesterRealUsageQa = 'blocked'
    if (blocker === 'blocked_gcloud_reauthentication_required_before_single_tester_real_usage_qa') {
      report.readiness.nextMilestone = 'RP-EXTERNAL-BETA-SINGLE-TESTER-REAL-USAGE-QA-1R-AFTER-GCLOUD-REAUTH'
    }
  } else {
    report.decision = 'completed_single_tester_real_usage_qa_authenticated_staging_readback'
    report.execution = 'completed_guarded_authenticated_single_tester_real_usage_qa_readonly'
    report.readiness.singleTesterRealUsageQa = 'qa_passed_authenticated_staging_readback'
    report.safety.safeGetRouteExecutionOnly = true
  }

  const reportPath = path.join(outputDir, 'single-tester-real-usage-qa-1-report.json')
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`)
  const manifestPath = path.join(outputDir, 'single-tester-real-usage-qa-1-manifest.json')
  fs.writeFileSync(
    manifestPath,
    `${JSON.stringify(
      {
        packet,
        runId,
        outputDir,
        artifacts: [fileSummary(reportPath)],
      },
      null,
      2,
    )}\n`,
  )
  const checksumsPath = path.join(outputDir, 'single-tester-real-usage-qa-1-checksums.json')
  fs.writeFileSync(
    checksumsPath,
    `${JSON.stringify(
      {
        packet,
        runId,
        outputDir,
        artifacts: [fileSummary(reportPath), fileSummary(manifestPath)],
      },
      null,
      2,
    )}\n`,
  )

  console.log(
    JSON.stringify(
      {
        packet,
        decision: report.decision,
        blocker: report.blocker,
        runId,
        outputDir,
        artifacts: [fileSummary(reportPath), fileSummary(manifestPath), fileSummary(checksumsPath)],
      },
      null,
      2,
    ),
  )
  process.exit(code)
}

if (process.env[confirmEnv] !== 'true') {
  finalize('blocked_pending_single_tester_real_usage_qa_confirmation', 2)
}

report.execution = 'completed_guarded_authenticated_single_tester_real_usage_qa_readonly'

const activeAccount = run(['gcloud', 'config', 'get-value', 'account'], 'blocked_gcloud_account_readback_failed').trim()
report.tester.activeAccount = activeAccount
report.tester.activeAccountMatches = normalizeEmail(activeAccount) === testerEmail
if (!report.tester.activeAccountMatches) {
  finalize('blocked_gcloud_active_account_not_approved_tester', 1)
}

const serviceStatus = parseJson(
  ['gcloud', 'run', 'services', 'describe', service, `--project=${project}`, `--region=${region}`, '--format=json(status.url,status.conditions,status.latestReadyRevisionName,status.traffic)'],
  'blocked_cloud_run_service_readback_failed',
)
report.target.serviceUrl = serviceStatus?.status?.url || null
report.target.ready = (serviceStatus?.status?.conditions || []).find((condition) => condition.type === 'Ready')?.status || null
report.target.latestReadyRevision = serviceStatus?.status?.latestReadyRevisionName || null
report.target.traffic = (serviceStatus?.status?.traffic || [])
  .map((item) => `${item.percent}_percent_${item.revisionName || 'latest'}`)
  .join(',')

if (!report.target.serviceUrl || report.target.ready !== 'True') {
  finalize('blocked_cloud_run_service_not_ready', 1)
}

const token = run(['gcloud', 'auth', 'print-identity-token'], 'blocked_identity_token_readback_failed').trim()
if (!token) {
  finalize('blocked_identity_token_empty', 1)
}

const unauthRoot = await request(absoluteUrl(report.target.serviceUrl, '/'), { accept: 'text/html' })
report.readback.unauthenticatedRootStatus = unauthRoot.status
if (unauthRoot.status !== 403) {
  finalize('blocked_unauthenticated_root_not_403', 1)
}

let assetCandidates = []
for (const routePath of safeHtmlRoutes) {
  const response = await request(absoluteUrl(report.target.serviceUrl, routePath), {
    token,
    accept: 'text/html',
  })
  report.readback.authenticatedHtmlRoutes.push({
    route: routePath,
    status: response.status,
    contentType: response.contentType,
    bodyBytes: response.bodyBytes,
    htmlLike: /<!doctype html|<html[\s>]/i.test(response.text),
  })
  if (response.status !== 200 || !/<!doctype html|<html[\s>]/i.test(response.text)) {
    finalize('blocked_authenticated_html_route_readback_failed', 1)
  }
  if (routePath === '/') assetCandidates = extractAssetPaths(response.text)
}

for (const routePath of safeJsonRoutes) {
  const response = await request(absoluteUrl(report.target.serviceUrl, routePath), {
    token,
    accept: 'application/json',
  })
  let json = null
  try {
    json = response.text ? JSON.parse(response.text) : null
  } catch {
    json = null
  }
  const summary = {
    route: routePath,
    status: response.status,
    contentType: response.contentType,
    bodyBytes: response.bodyBytes,
    jsonLike: json !== null,
  }
  if (routePath === '/api/runtime/status') {
    summary.runtimeMode = json?.runtimeMode || json?.data?.runtimeMode || null
    summary.mockOnly = json?.mockOnly ?? json?.data?.mockOnly ?? null
  }
  if (routePath === '/api/routes') {
    const routes = Array.isArray(json?.routes) ? json.routes : Array.isArray(json?.data?.routes) ? json.data.routes : []
    report.readback.routeMapTotalRoutes = routes.length
    report.readback.routeMapMockReadyRoutes = routes.filter((route) => route?.mockReady === true).length
    report.readback.requiredRoutesPresent = requiredRouteIds.every((routeId) =>
      routes.some((route) => route?.id === routeId || route?.routeId === routeId),
    )
    summary.totalRoutes = report.readback.routeMapTotalRoutes
    summary.mockReadyRoutes = report.readback.routeMapMockReadyRoutes
    summary.requiredRoutesPresent = report.readback.requiredRoutesPresent
  }
  report.readback.authenticatedJsonRoutes.push(summary)
  if (response.status !== 200 || json === null) {
    finalize('blocked_authenticated_json_route_readback_failed', 1)
  }
}

if (!report.readback.requiredRoutesPresent) {
  finalize('blocked_required_product_routes_missing', 1)
}

for (const assetPath of assetCandidates.slice(0, 6)) {
  const response = await request(absoluteUrl(report.target.serviceUrl, assetPath), {
    token,
    accept: '*/*',
  })
  report.readback.staticAssetFetches.push({
    assetPath,
    status: response.status,
    contentType: response.contentType,
    bodyBytes: response.bodyBytes,
  })
  if (response.status !== 200 || response.bodyBytes < 1) {
    finalize('blocked_authenticated_static_asset_readback_failed', 1)
  }
}

report.blocker = null
finalize(null, 0)
