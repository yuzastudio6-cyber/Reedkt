#!/usr/bin/env node
import { execFileSync, spawn } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const packet = 'RP-EXTERNAL-BETA-DEPLOYED-BROWSER-UI-SURFACE-1'
const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`
const outputDir = path.join('/tmp/reeditpro-rp-external-beta-deployed-browser-ui-surface-1', runId)
const distDir = path.resolve('dist')
const distServerDir = path.resolve('dist-server')
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const report = {
  packet,
  runId,
  outputDir,
  decision: null,
  execution: 'completed_local_browser_ui_static_surface_smoke_no_remote_mutation',
  blocker: null,
  integrationBase: safeGit(['rev-parse', 'HEAD']),
  sourceInputs: {
    controlledTesterUiFlowSmoke: 'blocked_deployed_browser_ui_surface_not_present',
    controlledTesterProductFlowSmoke: 'completed_external_beta_controlled_tester_product_flow_smoke',
    testerAccount: 'aiediting@reeditpro.com',
    cloudRunService: 'reeditpro-staging-api',
    cloudRunInvoker: 'group:external-beta-testers@reeditpro.com',
    pr577: 'open_draft_blocked_excluded',
  },
  localSurface: {
    distDir,
    distServerDir,
    rootHtmlFile: path.join(distDir, 'index.html'),
    assetProbePath: null,
    localPort: null,
    serverStdoutSnippet: null,
    serverStderrSnippet: null,
    probes: [],
  },
  dockerfilePackaging: {
    frontendBuildIncluded: false,
    distCopiedToRuntimeImage: false,
  },
  readiness: {
    externalProductBeta: 'blocked_pending_controlled_staging_browser_ui_deploy_and_resmoke',
    sourceReadiness: 'ready_for_controlled_staging_browser_ui_deploy_and_ui_flow_resmoke',
    nextMilestone: 'RP-EXTERNAL-BETA-DEPLOYED-BROWSER-UI-SURFACE-1R-STAGING-DEPLOY',
    productReadyEndToEndLocalOssTools: 0,
  },
  safety: {
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
  packageLock: 'unchanged',
  generatedArtifactsCommitted: 'none',
}

fs.mkdirSync(outputDir, { recursive: true })

function safeGit(args) {
  try {
    return execFileSync('git', args, { env: gitEnv, encoding: 'utf8' }).trim()
  } catch {
    return null
  }
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function fileBytes(file) {
  return fs.statSync(file).size
}

function writeReportAndExit(blocker, code = 1) {
  report.decision = blocker
    ? 'blocked_external_beta_deployed_browser_ui_surface_source_smoke'
    : 'completed_external_beta_deployed_browser_ui_surface_source_smoke'
  report.blocker = blocker
  const reportPath = path.join(outputDir, 'deployed-browser-ui-surface-report.json')
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`)
  const manifest = {
    packet,
    runId,
    files: [
      {
        fileName: path.basename(reportPath),
        bytes: fileBytes(reportPath),
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

async function requestText(url, accept = 'text/html') {
  const response = await fetch(url, {
    headers: { accept },
    redirect: 'manual',
  })
  const text = await response.text()
  return {
    url,
    status: response.status,
    contentType: response.headers.get('content-type') || null,
    bodyBytes: Buffer.byteLength(text),
    bodySnippet: text.slice(0, 300),
    htmlLike: /<!doctype html|<html[\s>]/i.test(text),
    hasRootMount: text.includes('<div id="root"></div>'),
    jsonLike: /^\s*\{/.test(text),
  }
}

function validateBuildOutputs() {
  if (!fs.existsSync(path.join(distDir, 'index.html'))) {
    writeReportAndExit('blocked_local_frontend_dist_missing')
  }

  if (!fs.existsSync(path.join(distServerDir, 'server.js'))) {
    writeReportAndExit('blocked_local_server_dist_missing')
  }

  const indexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8')
  const assetMatch = indexHtml.match(/(?:src|href)="(\/assets\/[^"]+)"/)
  if (!assetMatch) {
    writeReportAndExit('blocked_local_frontend_asset_reference_missing')
  }
  report.localSurface.assetProbePath = assetMatch[1]

  const dockerfile = fs.readFileSync('Dockerfile.backend', 'utf8')
  report.dockerfilePackaging.frontendBuildIncluded = dockerfile.includes('RUN npm run build && npm run build:server')
  report.dockerfilePackaging.distCopiedToRuntimeImage = dockerfile.includes('COPY --from=build /app/dist ./dist')
  if (!report.dockerfilePackaging.frontendBuildIncluded || !report.dockerfilePackaging.distCopiedToRuntimeImage) {
    writeReportAndExit('blocked_backend_image_frontend_dist_packaging_missing')
  }
}

async function smokeLocalSurface() {
  const port = 42000 + crypto.randomInt(1000)
  report.localSurface.localPort = port
  let stdout = ''
  let stderr = ''
  const child = spawn(process.execPath, [path.join(distServerDir, 'server.js')], {
    env: {
      ...process.env,
      PORT: String(port),
      SERVER_RUNTIME_MODE: 'mock',
      REEDITPRO_WEB_DIST_DIR: distDir,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  child.stdout.on('data', (chunk) => {
    stdout += String(chunk)
  })
  child.stderr.on('data', (chunk) => {
    stderr += String(chunk)
  })

  try {
    const baseUrl = `http://127.0.0.1:${port}`
    await waitForServer(baseUrl, child)
    for (const route of ['/', '/dashboard', '/projects', '/editor']) {
      report.localSurface.probes.push({
        name: `html_${route === '/' ? 'root' : route.slice(1)}`,
        ...(await requestText(`${baseUrl}${route}`)),
      })
    }
    report.localSurface.probes.push({
      name: 'asset_bundle',
      ...(await requestText(`${baseUrl}${report.localSurface.assetProbePath}`, '*/*')),
    })
    report.localSurface.probes.push({
      name: 'api_routes',
      ...(await requestText(`${baseUrl}/api/routes`, 'application/json')),
    })
  } finally {
    report.localSurface.serverStdoutSnippet = stdout.slice(0, 500)
    report.localSurface.serverStderrSnippet = stderr.slice(0, 500)
    if (!child.killed) {
      child.kill('SIGTERM')
    }
  }

  const htmlProbes = report.localSurface.probes.filter((probe) => probe.name.startsWith('html_'))
  if (htmlProbes.some((probe) => probe.status !== 200 || !probe.htmlLike || !probe.hasRootMount)) {
    writeReportAndExit('blocked_local_browser_ui_html_probe_failed')
  }

  const assetProbe = report.localSurface.probes.find((probe) => probe.name === 'asset_bundle')
  if (!assetProbe || assetProbe.status !== 200 || assetProbe.htmlLike) {
    writeReportAndExit('blocked_local_browser_ui_asset_probe_failed')
  }

  const apiProbe = report.localSurface.probes.find((probe) => probe.name === 'api_routes')
  if (!apiProbe || apiProbe.status !== 200 || !apiProbe.jsonLike || !apiProbe.contentType?.includes('application/json')) {
    writeReportAndExit('blocked_local_api_routes_regression')
  }
}

async function waitForServer(baseUrl, child) {
  const started = Date.now()
  while (Date.now() - started < 10000) {
    if (child.exitCode !== null) {
      writeReportAndExit('blocked_local_browser_ui_server_start_failed')
    }
    try {
      const probe = await requestText(`${baseUrl}/health`, 'application/json')
      if (probe.status === 200) return
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 150))
    }
  }
  writeReportAndExit('blocked_local_browser_ui_server_start_failed')
}

validateBuildOutputs()
await smokeLocalSurface()
writeReportAndExit(null, 0)
