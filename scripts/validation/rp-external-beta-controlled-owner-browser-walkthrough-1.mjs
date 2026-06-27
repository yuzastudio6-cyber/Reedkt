#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const packet = 'RP-EXTERNAL-BETA-CONTROLLED-OWNER-BROWSER-WALKTHROUGH-1'
const confirmEnv = 'REEDITPRO_CONFIRM_EXTERNAL_BETA_CONTROLLED_OWNER_BROWSER_WALKTHROUGH'
const ownerEmailEnv = 'REEDITPRO_EXTERNAL_BETA_OWNER_EMAIL'
const ownerEmail = 'aiediting@reeditpro.com'
const groupEmail = 'external-beta-testers@reeditpro.com'
const project = 'reeditpro'
const service = 'reeditpro-staging-api'
const region = 'us-central1'
const expectedRevision = 'reeditpro-staging-api-00006-6gw'
const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`
const outputDir = path.join('/tmp/reeditpro-rp-external-beta-controlled-owner-browser-walkthrough-1', runId)
const runEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const report = {
  packet,
  runId,
  outputDir,
  decision: null,
  execution: 'completed_guarded_authenticated_browser_surface_walkthrough_no_runtime_mutation',
  blocker: null,
  confirmation: process.env[confirmEnv] === 'true',
  ownerAccount: process.env[ownerEmailEnv] || ownerEmail,
  ownerClassification: 'real_reeditpro_owner_tester_account',
  sourceInputs: {
    deployedBrowserUiSurfaceStagingDeploy: 'completed_external_beta_deployed_browser_ui_surface_staging_deploy_and_controlled_tester_ui_smoke',
    controlledTesterUiFlowSmoke: 'completed_external_beta_controlled_tester_ui_flow_smoke',
    currentReadinessRollup: 'ready_for_controlled_owner_browser_walkthrough',
    mainSupabaseTarget: 'Reeditpro/wmyyttnynmteqgcdishd/staging',
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
    ownerAuthActive: false,
    identityTokenMode: null,
    identityTokenPrinted: false,
    identityTokenPersisted: false,
  },
  walkthrough: {
    routes: [],
    assetChecks: [],
    browserVisibleShell: false,
    rootElementPresent: false,
    moduleScriptPresent: false,
    stylesheetPresent: false,
  },
  readiness: {
    externalProductBeta: 'ready_for_controlled_owner_go_no_go',
    productApiReadiness: 'ready_for_controlled_owner_tester_product_walkthrough',
    broadExternalBetaAudience: 'blocked',
    paidProduction: 'blocked',
    finalDeliveryExport: 'blocked',
    nextMilestone: 'RP-EXTERNAL-BETA-CONTROLLED-OWNER-GO-NO-GO-1',
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

function run(args, options = {}) {
  return execFileSync(args[0], args.slice(1), {
    env: runEnv,
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

function bounded(value, limit = 500) {
  return String(value || '').replace(/\s+/g, ' ').slice(0, limit)
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
    bodySnippet: bounded(text),
    htmlLike: /<!doctype html|<html[\s>]/i.test(text),
    text,
  }
}

function extractAssetPaths(html) {
  const scripts = [...html.matchAll(/<script[^>]+src=["']([^"']+)["'][^>]*>/gi)].map((match) => match[1])
  const styles = [...html.matchAll(/<link[^>]+href=["']([^"']+)["'][^>]*rel=["']stylesheet["'][^>]*>/gi)].map((match) => match[1])
  const stylesAlt = [...html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi)].map((match) => match[1])
  return {
    scripts: [...new Set(scripts)],
    styles: [...new Set([...styles, ...stylesAlt])],
  }
}

function absoluteUrl(baseUrl, assetPath) {
  return new URL(assetPath, baseUrl).toString()
}

function writeReportAndExit(blocker, code = 1) {
  report.decision = blocker
    ? 'blocked_external_beta_controlled_owner_browser_walkthrough'
    : 'completed_external_beta_controlled_owner_browser_walkthrough'
  report.blocker = blocker
  if (blocker) {
    report.readiness.externalProductBeta = 'blocked_pending_controlled_owner_browser_walkthrough_closure'
    report.readiness.nextMilestone = 'RP-EXTERNAL-BETA-CONTROLLED-OWNER-BROWSER-WALKTHROUGH-1R'
  }
  const reportPath = path.join(outputDir, 'controlled-owner-browser-walkthrough-report.json')
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
  writeReportAndExit('blocked_pending_external_beta_controlled_owner_browser_walkthrough_confirmation')
}

if (normalizeEmail(report.ownerAccount) !== ownerEmail) {
  writeReportAndExit('blocked_owner_email_not_reeditpro_account')
}

const memberships = parseJsonCommand(
  ['gcloud', 'identity', 'groups', 'memberships', 'list', `--group-email=${groupEmail}`, `--project=${project}`, '--format=json'],
  'blocked_group_membership_readback_failed',
)
const ownerMemberPresent = memberships
  .map((item) => normalizeEmail(item?.preferredMemberKey?.id))
  .includes(ownerEmail)
if (!ownerMemberPresent) {
  writeReportAndExit('blocked_owner_account_not_in_external_beta_testers_group')
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
report.cloudRun.traffic = (serviceStatus?.status?.traffic || [])
  .map((item) => `${item.percent}_percent_${item.revisionName}`)
  .join(',')
if (!report.cloudRun.serviceUrl || report.cloudRun.serviceReady !== 'True') {
  writeReportAndExit('blocked_cloud_run_service_not_ready')
}
if (report.cloudRun.latestReadyRevision !== expectedRevision) {
  writeReportAndExit('blocked_unexpected_cloud_run_revision_for_owner_walkthrough')
}

const authList = parseJsonCommand(['gcloud', 'auth', 'list', '--format=json'], 'blocked_gcloud_auth_readback_failed')
report.auth.activeAccount = normalizeEmail(authList.find((item) => item.status === 'ACTIVE')?.account)
report.auth.ownerAuthActive = report.auth.activeAccount === ownerEmail
if (!report.auth.ownerAuthActive) {
  writeReportAndExit('blocked_owner_auth_context_not_active')
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
    writeReportAndExit('blocked_owner_identity_token_unavailable')
  }
}

try {
  const unauthenticated = await requestText(`${report.cloudRun.serviceUrl}/`)
  report.walkthrough.routes.push({
    name: 'unauthenticated_root_probe',
    path: '/',
    status: unauthenticated.status,
    contentType: unauthenticated.contentType,
    bodyBytes: unauthenticated.bodyBytes,
    htmlLike: unauthenticated.htmlLike,
  })
  if (unauthenticated.status !== 403) {
    writeReportAndExit('blocked_unauthenticated_root_not_403')
  }

  const routeResults = []
  for (const pathName of ['/', '/dashboard', '/projects', '/editor']) {
    const probe = await requestText(`${report.cloudRun.serviceUrl}${pathName}`, { token })
    const route = {
      name: `authenticated_browser_route_${pathName === '/' ? 'root' : pathName.slice(1)}`,
      path: pathName,
      status: probe.status,
      contentType: probe.contentType,
      bodyBytes: probe.bodyBytes,
      htmlLike: probe.htmlLike,
      bodySnippet: probe.bodySnippet,
    }
    report.walkthrough.routes.push(route)
    routeResults.push({ pathName, probe })
  }

  for (const { pathName, probe } of routeResults) {
    if (probe.status !== 200 || !probe.htmlLike) {
      report.walkthrough.failedRoute = pathName
      writeReportAndExit('blocked_authenticated_browser_route_failed')
    }
  }

  const rootHtml = routeResults.find((item) => item.pathName === '/')?.probe?.text || ''
  report.walkthrough.rootElementPresent = /id=["']root["']/.test(rootHtml)
  const assetPaths = extractAssetPaths(rootHtml)
  report.walkthrough.moduleScriptPresent = assetPaths.scripts.length > 0
  report.walkthrough.stylesheetPresent = assetPaths.styles.length > 0
  if (!report.walkthrough.rootElementPresent || !report.walkthrough.moduleScriptPresent) {
    writeReportAndExit('blocked_browser_shell_asset_contract_missing')
  }

  for (const assetPath of [...assetPaths.scripts.slice(0, 2), ...assetPaths.styles.slice(0, 2)]) {
    const assetUrl = absoluteUrl(report.cloudRun.serviceUrl, assetPath)
    const assetProbe = await requestText(assetUrl, { token, accept: '*/*' })
    const check = {
      path: assetPath,
      status: assetProbe.status,
      contentType: assetProbe.contentType,
      bodyBytes: assetProbe.bodyBytes,
    }
    report.walkthrough.assetChecks.push(check)
    if (assetProbe.status !== 200 || assetProbe.bodyBytes < 1) {
      report.walkthrough.failedAsset = assetPath
      writeReportAndExit('blocked_browser_asset_fetch_failed')
    }
  }

  report.walkthrough.browserVisibleShell = true
} catch (error) {
  report.commandError = {
    command: 'controlled owner browser surface walkthrough',
    message: String(error?.message || error),
  }
  writeReportAndExit('blocked_owner_browser_walkthrough_request_failed')
}

writeReportAndExit(null, 0)
