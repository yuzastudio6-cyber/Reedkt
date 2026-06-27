#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const packet = 'RP-EXTERNAL-BETA-NAMED-INVITED-TESTER-WALKTHROUGH-1'
const confirmEnv = 'REEDITPRO_CONFIRM_EXTERNAL_BETA_NAMED_INVITED_TESTER_WALKTHROUGH'
const testerEmailEnv = 'REEDITPRO_EXTERNAL_BETA_NAMED_INVITED_TESTER_EMAIL'
const testerEmail = 'aiediting@reeditpro.com'
const groupEmail = 'external-beta-testers@reeditpro.com'
const project = 'reeditpro'
const service = 'reeditpro-staging-api'
const region = 'us-central1'
const expectedRevision = 'reeditpro-staging-api-00006-6gw'
const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`
const outputDir = path.join('/tmp/reeditpro-rp-external-beta-named-invited-tester-walkthrough-1', runId)
const runEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const report = {
  packet,
  runId,
  outputDir,
  decision: null,
  execution: 'completed_guarded_authenticated_named_tester_walkthrough_no_runtime_mutation',
  blocker: null,
  confirmation: process.env[confirmEnv] === 'true',
  namedTesterEmail: process.env[testerEmailEnv] || testerEmail,
  testerClassification: 'source_approved_primary_real_reeditpro_tester_account',
  sourceInputs: {
    controlledOwnerGoNoGo: 'approved_controlled_external_beta_owner_go_no_go_for_named_invited_tester_walkthrough',
    controlledOwnerBrowserWalkthrough: 'completed_external_beta_controlled_owner_browser_walkthrough',
    deployedBrowserUiSurface: 'completed_external_beta_deployed_browser_ui_surface_staging_deploy_and_controlled_tester_ui_smoke',
    testerAccountMembershipSmoke: 'completed_owner_approved_tester_account_membership_smoke',
    currentReadinessRollup: 'ready_for_named_invited_tester_identity_and_walkthrough',
    pr577: 'open_draft_blocked_excluded',
  },
  cloudRun: {
    project,
    service,
    region,
    serviceUrl: null,
    latestReadyRevision: null,
    expectedRevision,
    serviceReady: null,
    traffic: null,
    invokerMember: `group:${groupEmail}`,
    allUsersGrant: null,
    allAuthenticatedUsersGrant: null,
    broadPublicInvokerGrant: false,
  },
  auth: {
    activeAccount: null,
    namedTesterAuthActive: false,
    identityTokenMode: null,
    identityTokenPrinted: false,
    identityTokenPersisted: false,
  },
  membership: {
    groupEmail,
    namedTesterPresent: false,
    groupMembershipMutation: false,
  },
  browserWalkthrough: {
    unauthenticatedRoot: null,
    authenticatedRoot: null,
    authenticatedDashboard: null,
    authenticatedProjects: null,
    authenticatedEditor: null,
    browserVisibleShell: false,
    rootElementPresent: false,
    moduleScriptPresent: false,
    stylesheetPresent: false,
    assetFetches: null,
    routes: [],
    assetChecks: [],
  },
  apiReadback: {
    routesEndpointStatus: null,
    runtimeStatusEndpointStatus: null,
    routeExecutionMode: 'safe_get_readback_only',
  },
  readiness: {
    externalProductBeta: 'ready_for_bounded_external_beta_tester_expansion_decision',
    productApiReadiness: 'ready_for_controlled_owner_tester_product_walkthrough',
    broadExternalBetaAudience: 'blocked',
    paidProduction: 'blocked',
    finalDeliveryExport: 'blocked',
    nextMilestone: 'RP-EXTERNAL-BETA-BOUNDED-TESTER-EXPANSION-DECISION-1',
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
    productionUnlock: false,
    packageLockMutation: false,
  },
  packageLock: 'unchanged',
  generatedArtifactsCommitted: 'none',
}

fs.mkdirSync(outputDir, { recursive: true })

function run(args) {
  return execFileSync(args[0], args.slice(1), {
    env: runEnv,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 8 * 1024 * 1024,
  })
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

function bounded(value, limit = 500) {
  return String(value || '').replace(/\s+/g, ' ').slice(0, limit)
}

function parseJsonCommand(args, blocker) {
  try {
    return JSON.parse(run(args))
  } catch (error) {
    report.commandError = { command: args.join(' '), message: String(error?.message || error) }
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
    bodySnippet: bounded(text),
    htmlLike: /<!doctype html|<html[\s>]/i.test(text),
    jsonLike: /application\/json/i.test(response.headers.get('content-type') || '') || /^[\s\r\n]*[\[{]/.test(text),
    text,
  }
}

function extractAssetPaths(html) {
  const scripts = [...html.matchAll(/<script[^>]+src=["']([^"']+)["'][^>]*>/gi)].map((match) => match[1])
  const styles = [...html.matchAll(/<link[^>]+href=["']([^"']+)["'][^>]*rel=["']stylesheet["'][^>]*>/gi)].map((match) => match[1])
  const stylesAlt = [...html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi)].map((match) => match[1])
  return { scripts: [...new Set(scripts)], styles: [...new Set([...styles, ...stylesAlt])] }
}

function absoluteUrl(baseUrl, assetPath) {
  return new URL(assetPath, baseUrl).toString()
}

function writeReportAndExit(blocker, code = 1) {
  report.decision = blocker ? 'blocked_named_invited_tester_walkthrough' : 'completed_named_invited_tester_walkthrough'
  report.blocker = blocker
  if (blocker) {
    report.readiness.externalProductBeta = 'blocked_pending_named_invited_tester_walkthrough_closure'
    report.readiness.nextMilestone = 'RP-EXTERNAL-BETA-NAMED-INVITED-TESTER-WALKTHROUGH-1R'
  }
  const reportPath = path.join(outputDir, 'named-invited-tester-walkthrough-report.json')
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`)
  const manifest = {
    packet,
    runId,
    note: 'Manifest checksum is recorded by source docs after the local run; the manifest does not self-checksum.',
    files: [{ fileName: path.basename(reportPath), bytes: fs.statSync(reportPath).size, sha256: sha256(reportPath) }],
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
  writeReportAndExit('blocked_pending_external_beta_named_invited_tester_walkthrough_confirmation')
}

if (normalizeEmail(report.namedTesterEmail) !== testerEmail) {
  writeReportAndExit('blocked_named_invited_tester_identity_not_source_approved')
}

const memberships = parseJsonCommand(
  ['gcloud', 'identity', 'groups', 'memberships', 'list', `--group-email=${groupEmail}`, `--project=${project}`, '--format=json'],
  'blocked_group_membership_readback_failed',
)
report.membership.namedTesterPresent = memberships
  .map((item) => normalizeEmail(item?.preferredMemberKey?.id))
  .includes(testerEmail)
if (!report.membership.namedTesterPresent) {
  writeReportAndExit('blocked_named_invited_tester_not_in_external_beta_testers_group')
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
  report.cloudRun.broadPublicInvokerGrant = true
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
report.cloudRun.traffic = (serviceStatus?.status?.traffic || []).map((item) => `${item.percent}_percent_${item.revisionName}`).join(',')
if (!report.cloudRun.serviceUrl || report.cloudRun.serviceReady !== 'True') writeReportAndExit('blocked_cloud_run_service_not_ready')
if (report.cloudRun.latestReadyRevision !== expectedRevision) writeReportAndExit('blocked_unexpected_cloud_run_revision_for_named_tester_walkthrough')

const authList = parseJsonCommand(['gcloud', 'auth', 'list', '--format=json'], 'blocked_gcloud_auth_readback_failed')
report.auth.activeAccount = normalizeEmail(authList.find((item) => item.status === 'ACTIVE')?.account)
report.auth.namedTesterAuthActive = report.auth.activeAccount === testerEmail
if (!report.auth.namedTesterAuthActive) writeReportAndExit('blocked_named_invited_tester_auth_unavailable')

let token
try {
  token = run(['gcloud', 'auth', 'print-identity-token', `--audiences=${report.cloudRun.serviceUrl}`]).trim()
  report.auth.identityTokenMode = 'audience_scoped'
} catch {
  try {
    token = run(['gcloud', 'auth', 'print-identity-token']).trim()
    report.auth.identityTokenMode = 'user_account_default_audience'
  } catch (error) {
    report.commandError = { command: 'gcloud auth print-identity-token', message: String(error?.message || error) }
    writeReportAndExit('blocked_identity_token_creation_failed')
  }
}
if (!token || token.length < 20) writeReportAndExit('blocked_identity_token_creation_failed')

try {
  const unauth = await requestText(`${report.cloudRun.serviceUrl}/`, { accept: 'text/html' })
  report.browserWalkthrough.unauthenticatedRoot = unauth.status === 403 ? 'blocked_403' : `unexpected_${unauth.status}`
  if (unauth.status !== 403) writeReportAndExit('blocked_unauthenticated_root_not_403')

  const routeExpectations = [
    ['authenticatedRoot', '/'],
    ['authenticatedDashboard', '/dashboard'],
    ['authenticatedProjects', '/projects'],
    ['authenticatedEditor', '/editor'],
  ]
  let rootHtml = ''
  for (const [key, routePath] of routeExpectations) {
    const response = await requestText(`${report.cloudRun.serviceUrl}${routePath}`, { token, accept: 'text/html' })
    report.browserWalkthrough.routes.push({
      path: routePath,
      status: response.status,
      contentType: response.contentType,
      bodyBytes: response.bodyBytes,
      htmlLike: response.htmlLike,
      bodySnippet: response.bodySnippet,
    })
    report.browserWalkthrough[key] = response.status === 200 && response.htmlLike ? 'passed_200_html' : `failed_${response.status}`
    if (routePath === '/') rootHtml = response.text
    if (response.status !== 200 || !response.htmlLike) writeReportAndExit('blocked_named_invited_tester_walkthrough_failed')
  }

  report.browserWalkthrough.browserVisibleShell = /<div id=["']root["']><\/div>/i.test(rootHtml)
  report.browserWalkthrough.rootElementPresent = report.browserWalkthrough.browserVisibleShell
  const assets = extractAssetPaths(rootHtml)
  report.browserWalkthrough.moduleScriptPresent = assets.scripts.length > 0
  report.browserWalkthrough.stylesheetPresent = assets.styles.length > 0
  if (!report.browserWalkthrough.moduleScriptPresent || !report.browserWalkthrough.stylesheetPresent) {
    writeReportAndExit('blocked_browser_shell_asset_contract_missing')
  }
  for (const assetPath of [...assets.scripts, ...assets.styles]) {
    const assetResponse = await requestText(absoluteUrl(report.cloudRun.serviceUrl, assetPath), {
      token,
      accept: assetPath.endsWith('.css') ? 'text/css,*/*' : 'application/javascript,*/*',
    })
    report.browserWalkthrough.assetChecks.push({
      path: assetPath,
      status: assetResponse.status,
      contentType: assetResponse.contentType,
      bodyBytes: assetResponse.bodyBytes,
    })
    if (assetResponse.status !== 200 || assetResponse.bodyBytes <= 0) writeReportAndExit('blocked_browser_asset_fetch_failed')
  }
  report.browserWalkthrough.assetFetches = 'passed'

  const routes = await requestText(`${report.cloudRun.serviceUrl}/api/routes`, { token, accept: 'application/json' })
  report.apiReadback.routesEndpointStatus = routes.status
  if (routes.status !== 200 || !routes.jsonLike) writeReportAndExit('blocked_named_invited_tester_product_flow_readback_failed')

  const runtime = await requestText(`${report.cloudRun.serviceUrl}/api/runtime/status`, { token, accept: 'application/json' })
  report.apiReadback.runtimeStatusEndpointStatus = runtime.status
  if (runtime.status !== 200 || !runtime.jsonLike) writeReportAndExit('blocked_named_invited_tester_product_flow_readback_failed')
} catch (error) {
  report.requestError = String(error?.message || error)
  writeReportAndExit('blocked_named_invited_tester_walkthrough_failed')
}

writeReportAndExit(null, 0)
