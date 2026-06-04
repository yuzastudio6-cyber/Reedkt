import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { mkdir, rm, stat, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { writeDeckGlLocalHtmlFixture } from './deckgl-local-html-builder'
import { buildDeckGlLocalOverlayCaptureManifest } from './deckgl-capture-artifact-manifest'
import { buildDeckGlLocalOverlayFixtureData } from './deckgl-local-overlay-fixture-data'
import {
  deckGlLocalOverlayArtifactPrefix,
  deckGlLocalOverlayConfig,
  deckGlLocalOverlaySafetyFlags,
  makeDeckGlLocalOverlayRunId,
  validateDeckGlLocalOverlayExecutionEnv,
} from './deckgl-local-overlay-policy'
import { buildDeckGlLocalOverlayQaSummary } from './deckgl-local-overlay-qa-summary'
import { DECKGL_LOCAL_OVERLAY_LOCAL_REPORT_PATH } from './deckgl-local-overlay-report-builder'
import { runDeckGlPlaywrightCapture } from './deckgl-playwright-capture-runner'
import { runDeckGlSharpScreenshotProcessing } from './deckgl-sharp-postprocess-runner'
import type {
  DeckGlLocalFixtureData,
  DeckGlLocalOverlayArtifact,
  DeckGlLocalOverlayExecutionReport,
  DeckGlRenderMetadata,
  SharpDeckGlScreenshotProcessing,
} from './deckgl-local-overlay-types'
import type { NetworkRequestRecord } from '../maplibre-local-render-fixture'

const execFileAsync = promisify(execFile)

export async function runDeckGlLocalOverlayFixture(input: { execute: boolean; runId?: string }) {
  if (!input.execute) throw new Error('Pass --execute to run Phase 50D deck.gl local overlay fixture.')
  const runId = input.runId ?? process.env.REEDITPRO_PHASE50D_RUN_ID ?? makeDeckGlLocalOverlayRunId()
  const artifactPrefix = deckGlLocalOverlayArtifactPrefix(runId)
  const localRoot = path.join(os.tmpdir(), `reeditpro-phase50d-deckgl-local-overlay-${runId}`)
  await rm(localRoot, { recursive: true, force: true })
  await mkdir(localRoot, { recursive: true })

  const fixtureData = buildDeckGlLocalOverlayFixtureData()
  const preflight = await runDeckGlLocalOverlayPreflight()
  if (preflight.blockers.length > 0) {
    const blockedReport = await writeBlockedLocalReport({ runId, fixtureData, preflight, localRoot })
    return {
      executionReport: blockedReport,
      localReportPath: path.join(process.cwd(), DECKGL_LOCAL_OVERLAY_LOCAL_REPORT_PATH),
      iamChanges: ['not_attempted: preflight blockers prevented private artifact upload'],
    }
  }

  const localFixture = await writeDeckGlLocalHtmlFixture({
    fixtureData,
    root: localRoot,
  })
  const artifacts: DeckGlLocalOverlayArtifact[] = []
  artifacts.push(await uploadJson(deckGlLocalOverlayConfig.generatedAssetsBucket, `${artifactPrefix}/plan/deckgl-local-overlay-plan.json`, buildExecutionPlan(runId), localRoot, 'deckgl_local_overlay_plan'))
  artifacts.push(await uploadFile(deckGlLocalOverlayConfig.generatedAssetsBucket, `${artifactPrefix}/fixture/generated-deckgl-map-page.html`, localFixture.htmlPath, 'deckgl_local_html_fixture', 'private_html'))
  artifacts.push(await uploadJson(deckGlLocalOverlayConfig.generatedAssetsBucket, `${artifactPrefix}/fixture/deckgl-local-assets-metadata.json`, localFixture, localRoot, 'deckgl_local_assets_metadata'))
  artifacts.push(await uploadJson(deckGlLocalOverlayConfig.generatedAssetsBucket, `${artifactPrefix}/geojson/generated-points.geojson`, fixtureData.fixture.points, localRoot, 'generated_points', 'private_geojson'))
  artifacts.push(await uploadJson(deckGlLocalOverlayConfig.generatedAssetsBucket, `${artifactPrefix}/geojson/generated-routes.geojson`, fixtureData.fixture.routes, localRoot, 'generated_routes', 'private_geojson'))
  artifacts.push(await uploadJson(deckGlLocalOverlayConfig.generatedAssetsBucket, `${artifactPrefix}/geojson/generated-polygons.geojson`, fixtureData.fixture.polygons, localRoot, 'generated_polygons', 'private_geojson'))
  artifacts.push(await uploadJson(deckGlLocalOverlayConfig.generatedAssetsBucket, `${artifactPrefix}/geojson/generated-combined.geojson`, fixtureData.fixture.combined, localRoot, 'generated_combined', 'private_geojson'))
  artifacts.push(await uploadJson(deckGlLocalOverlayConfig.generatedAssetsBucket, `${artifactPrefix}/deckgl/deckgl-overlay-data.json`, fixtureData.overlayData, localRoot, 'deckgl_overlay_data'))
  artifacts.push(await uploadJson(deckGlLocalOverlayConfig.generatedAssetsBucket, `${artifactPrefix}/deckgl/deckgl-layer-manifest.json`, fixtureData.layerManifest, localRoot, 'deckgl_layer_manifest'))
  artifacts.push(await uploadJson(deckGlLocalOverlayConfig.generatedAssetsBucket, `${artifactPrefix}/maplibre/local-offline-style.json`, fixtureData.style, localRoot, 'local_offline_style'))

  let renderMetadata: DeckGlRenderMetadata | undefined
  let networkRequestsObserved: NetworkRequestRecord[] = []
  let externalNetworkRequestsObserved: NetworkRequestRecord[] = []
  let sharpProcessing: SharpDeckGlScreenshotProcessing | undefined
  try {
    const capture = await runDeckGlPlaywrightCapture({ localFixture, outputRoot: localRoot })
    renderMetadata = capture.renderMetadata
    networkRequestsObserved = capture.networkRequestsObserved
    externalNetworkRequestsObserved = capture.externalNetworkRequestsObserved
    sharpProcessing = await runDeckGlSharpScreenshotProcessing({
      screenshotPath: renderMetadata.screenshotPath,
      outputRoot: localRoot,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    externalNetworkRequestsObserved = [
      ...externalNetworkRequestsObserved,
      { url: 'phase50d://capture-error', method: 'N/A', resourceType: 'capture_error', allowed: false, blockedReason: message },
    ]
  }

  if (renderMetadata) {
    artifacts.push(await uploadJson(deckGlLocalOverlayConfig.generatedAssetsBucket, `${artifactPrefix}/render/deckgl-render-metadata.json`, renderMetadata, localRoot, 'deckgl_render_metadata'))
    artifacts.push(await uploadFile(deckGlLocalOverlayConfig.generatedAssetsBucket, `${artifactPrefix}/capture/deckgl-local-overlay-screenshot.png`, renderMetadata.screenshotPath, 'deckgl_local_overlay_screenshot', 'private_png'))
  }
  artifacts.push(await uploadJson(deckGlLocalOverlayConfig.generatedAssetsBucket, `${artifactPrefix}/capture/network-requests-observed.json`, { networkRequestsObserved, externalNetworkRequestsObserved }, localRoot, 'network_requests_observed'))
  if (sharpProcessing) {
    artifacts.push(await uploadFile(deckGlLocalOverlayConfig.generatedAssetsBucket, `${artifactPrefix}/processed/deckgl-overlay-preview.png`, sharpProcessing.preview.path, 'deckgl_overlay_preview', 'private_png'))
    artifacts.push(await uploadFile(deckGlLocalOverlayConfig.generatedAssetsBucket, `${artifactPrefix}/processed/deckgl-overlay-thumbnail.png`, sharpProcessing.thumbnail.path, 'deckgl_overlay_thumbnail', 'private_png'))
    artifacts.push(await uploadJson(deckGlLocalOverlayConfig.generatedAssetsBucket, `${artifactPrefix}/processed/deckgl-overlay-image-metadata.json`, sharpProcessing, localRoot, 'deckgl_overlay_image_metadata'))
  }

  const preliminaryBlockers = renderMetadata && externalNetworkRequestsObserved.length === 0 ? [] : ['deck.gl local overlay render/capture did not complete cleanly.']
  const captureManifest = renderMetadata
    ? buildDeckGlLocalOverlayCaptureManifest({
      runId,
      style: fixtureData.style,
      renderMetadata,
      networkRequestsObserved,
      externalNetworkRequestsObserved,
      artifacts,
      warnings: preflight.warnings,
      blockers: preliminaryBlockers,
    })
    : undefined
  if (captureManifest) {
    artifacts.push(await uploadJson(deckGlLocalOverlayConfig.generatedAssetsBucket, `${artifactPrefix}/manifest/deckgl-local-overlay-capture-manifest.json`, captureManifest, localRoot, 'deckgl_local_overlay_capture_manifest'))
  }

  const qa = buildDeckGlLocalOverlayQaSummary({
    phase50cEvidencePresent: preflight.phase50cEvidencePresent,
    fixture: fixtureData.fixture,
    style: fixtureData.style,
    styleValidation: fixtureData.styleValidation,
    overlayData: fixtureData.overlayData,
    layerManifest: fixtureData.layerManifest,
    renderMetadata,
    networkRequestsObserved,
    externalNetworkRequestsObserved,
    sharpProcessing,
    captureManifest,
    artifacts,
    preflightBlockers: preflight.blockers,
    publicAccessBlocked: preflight.publicAccessBlocked,
  })
  artifacts.push(await uploadJson(deckGlLocalOverlayConfig.qaBucket, `${artifactPrefix}/qa/deckgl-local-overlay-qa.json`, qa, localRoot, 'deckgl_local_overlay_qa'))

  const executionReport: DeckGlLocalOverlayExecutionReport = {
    ok: qa.status === 'passed',
    phase: '50D',
    runId,
    projectId: 'reeditpro',
    mode: deckGlLocalOverlayConfig.mode,
    fixture: fixtureData.fixture,
    style: fixtureData.style,
    styleValidation: fixtureData.styleValidation,
    overlayData: fixtureData.overlayData,
    layerManifest: fixtureData.layerManifest,
    renderMetadata,
    networkRequestsObserved,
    externalNetworkRequestsObserved,
    sharpProcessing,
    captureManifest,
    artifacts,
    qa,
    phase50EReadiness: qa.status === 'passed' ? 'ready_for_cesiumjs_3d_planning_fixture' : 'blocked',
    safety: {
      ...deckGlLocalOverlaySafetyFlags,
      liveTileRequestMade: false,
      publicOsmTileRequestMade: false,
      geocodingRequestMade: false,
      routingRequestMade: false,
      paidProviderCalled: false,
      cesiumJsRuntimeUsed: false,
      d3RuntimeUsed: false,
      threeJsRuntimeUsed: false,
      publicAccessEnabled: false,
    },
    blockers: qa.blockers,
    warnings: Array.from(new Set([...qa.warnings, ...preflight.warnings])),
  }
  artifacts.push(await uploadJson(deckGlLocalOverlayConfig.qaBucket, `${artifactPrefix}/reports/phase50d-report.json`, executionReport, localRoot, 'phase50d_report'))
  executionReport.artifacts = artifacts

  const localReportPath = path.join(process.cwd(), DECKGL_LOCAL_OVERLAY_LOCAL_REPORT_PATH)
  await mkdir(path.dirname(localReportPath), { recursive: true })
  await writeFile(localReportPath, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')
  return {
    executionReport,
    localReportPath,
    iamChanges: ['not_required: active account uploaded generated/private deck.gl local overlay fixture artifacts using existing private GCS permissions'],
  }
}

export async function runDeckGlLocalOverlayPreflight() {
  const blockers: string[] = []
  const warnings: string[] = []
  let activeProjectValue = ''
  let publicAccessBlocked = false
  let phase50cEvidencePresent = false
  try {
    const [activeAccount, activeProject, projectDescribe, generatedAssetsBucket, qaBucket, phase50cReport] = await Promise.all([
      runGcloud(['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']),
      runGcloud(['config', 'get-value', 'project']),
      runGcloud(['projects', 'describe', deckGlLocalOverlayConfig.projectId, '--format=value(projectId)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${deckGlLocalOverlayConfig.generatedAssetsBucket}`, '--format=value(name)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${deckGlLocalOverlayConfig.qaBucket}`, '--format=value(name)']),
      runGcloud(['storage', 'objects', 'describe', deckGlLocalOverlayConfig.approvedPhase50CReportUri, '--format=value(name)']),
    ])
    const activeAccountValue = lastGcloudValue(activeAccount)
    activeProjectValue = lastGcloudValue(activeProject)
    if (!activeAccountValue) blockers.push('No active gcloud account is visible.')
    if (activeProjectValue !== deckGlLocalOverlayConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
    if (lastGcloudValue(projectDescribe) !== deckGlLocalOverlayConfig.projectId) blockers.push('gcloud cannot describe project reeditpro.')
    if (lastGcloudValue(generatedAssetsBucket) !== deckGlLocalOverlayConfig.generatedAssetsBucket) blockers.push('Generated-assets bucket is not reachable.')
    if (lastGcloudValue(qaBucket) !== deckGlLocalOverlayConfig.qaBucket) blockers.push('QA bucket is not reachable.')
    phase50cEvidencePresent = Boolean(lastGcloudValue(phase50cReport))
    if (!phase50cEvidencePresent) blockers.push(`Phase 50C canonical report is not reachable: ${deckGlLocalOverlayConfig.approvedPhase50CReportUri}`)
    await assertNoPublicBucketPrincipals([deckGlLocalOverlayConfig.generatedAssetsBucket, deckGlLocalOverlayConfig.qaBucket], blockers)
    publicAccessBlocked = !blockers.some((blocker) => blocker.includes('public IAM principal'))
  } catch (error) {
    blockers.push(error instanceof Error ? error.message : String(error))
  }

  const validation = validateDeckGlLocalOverlayExecutionEnv({
    projectId: process.env.GCP_PROJECT_ID,
    activeProject: activeProjectValue,
    region: process.env.GCP_REGION,
    env: process.env.REEDITPRO_ENV,
    confirmation: process.env.REEDITPRO_CONFIRM_DECKGL_LOCAL_OVERLAY_FIXTURE,
    mode: process.env.REEDITPRO_DECKGL_LOCAL_OVERLAY_MODE ?? deckGlLocalOverlayConfig.mode,
    externalNetworkRequestsAllowed: process.env.EXTERNAL_NETWORK_REQUESTS_ALLOWED ?? 'false',
    tileDownloadAllowed: process.env.TILE_DOWNLOAD_ALLOWED ?? 'false',
    liveTileProviderAllowed: process.env.LIVE_TILE_PROVIDER_ALLOWED ?? 'false',
    publicOsmTileAllowed: process.env.PUBLIC_OSM_TILE_ALLOWED ?? 'false',
    mapboxProviderAllowed: process.env.MAPBOX_PROVIDER_ALLOWED ?? 'false',
    googleMapsProviderAllowed: process.env.GOOGLE_MAPS_PROVIDER_ALLOWED ?? 'false',
    cesiumIonAllowed: process.env.CESIUM_ION_ALLOWED ?? 'false',
    geocodingAllowed: process.env.GEOCODING_ALLOWED ?? 'false',
    routingAllowed: process.env.ROUTING_ALLOWED ?? 'false',
    paidMapProviderAllowed: process.env.PAID_MAP_PROVIDER_ALLOWED ?? 'false',
    publicArtifactAllowed: process.env.PUBLIC_ARTIFACT_ALLOWED ?? process.env.PUBLIC_ACCESS_ENABLED ?? 'false',
    cesiumJsRuntimeAllowed: process.env.CESIUM_JS_RUNTIME_ALLOWED ?? 'false',
    d3RuntimeAllowed: process.env.D3_RUNTIME_ALLOWED ?? 'false',
    threeJsRuntimeAllowed: process.env.THREE_JS_RUNTIME_ALLOWED ?? 'false',
    productionReady: process.env.REEDITPRO_PRODUCTION_READY ?? 'false',
    externalBetaReady: process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false',
    paidProductionReady: process.env.REEDITPRO_PAID_PRODUCTION_READY ?? 'false',
    broadRealMediaReady: process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false',
  })

  return {
    allowed: blockers.length === 0 && validation.allowed,
    blockers: [...validation.blockers, ...blockers],
    warnings: [...validation.warnings, ...warnings],
    activeProject: activeProjectValue,
    publicAccessBlocked,
    phase50cEvidencePresent,
  }
}

function buildExecutionPlan(runId: string) {
  return {
    runId,
    phase: '50D',
    mode: deckGlLocalOverlayConfig.mode,
    sourceFixture: 'generated Phase 50B-style GeoJSON plus deterministic deck.gl flow records',
    approvedPhase50CRunId: deckGlLocalOverlayConfig.approvedPhase50CRunId,
    approvedPhase50CReportUri: deckGlLocalOverlayConfig.approvedPhase50CReportUri,
    localStaticServer: '127.0.0.1 only',
    localAssets: [
      'maplibre-gl/dist/maplibre-gl.js',
      'maplibre-gl/dist/maplibre-gl.css',
      '@deck.gl/core/dist.min.js',
      '@deck.gl/layers/dist.min.js',
      '@deck.gl/mapbox/dist.min.js',
    ],
    deckGlLayers: ['ScatterplotLayer', 'PathLayer', 'PolygonLayer', 'ArcLayer'],
    heatmapLayerDeferred: true,
    mapLibreStyle: 'inline generated GeoJSON sources only',
    labelsRenderedAsHtmlOverlay: true,
    browserCapture: 'Playwright Chromium headless against local fixture only',
    screenshotProcessing: 'Sharp processes only the Phase 50D screenshot',
    externalNetworkRequestsAllowed: false,
    tileDownloadAllowed: false,
    publicOsmTileAllowed: false,
    mapboxProviderAllowed: false,
    googleMapsProviderAllowed: false,
    cesiumIonAllowed: false,
    geocodingAllowed: false,
    routingAllowed: false,
    paidMapProviderAllowed: false,
    cesiumJsRuntimeAllowed: false,
    d3RuntimeAllowed: false,
    threeJsRuntimeAllowed: false,
    publicArtifactAllowed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    broadMediaAllowed: false,
  }
}

async function writeBlockedLocalReport(input: {
  runId: string
  fixtureData: DeckGlLocalFixtureData
  preflight: Awaited<ReturnType<typeof runDeckGlLocalOverlayPreflight>>
  localRoot: string
}): Promise<DeckGlLocalOverlayExecutionReport> {
  const qa = buildDeckGlLocalOverlayQaSummary({
    phase50cEvidencePresent: input.preflight.phase50cEvidencePresent,
    fixture: input.fixtureData.fixture,
    style: input.fixtureData.style,
    styleValidation: input.fixtureData.styleValidation,
    overlayData: input.fixtureData.overlayData,
    layerManifest: input.fixtureData.layerManifest,
    preflightBlockers: input.preflight.blockers,
    publicAccessBlocked: input.preflight.publicAccessBlocked,
  })
  const report: DeckGlLocalOverlayExecutionReport = {
    ok: false,
    phase: '50D',
    runId: input.runId,
    projectId: 'reeditpro',
    mode: deckGlLocalOverlayConfig.mode,
    fixture: input.fixtureData.fixture,
    style: input.fixtureData.style,
    styleValidation: input.fixtureData.styleValidation,
    overlayData: input.fixtureData.overlayData,
    layerManifest: input.fixtureData.layerManifest,
    networkRequestsObserved: [],
    externalNetworkRequestsObserved: [],
    artifacts: [],
    qa,
    phase50EReadiness: 'blocked',
    safety: {
      ...deckGlLocalOverlaySafetyFlags,
      liveTileRequestMade: false,
      publicOsmTileRequestMade: false,
      geocodingRequestMade: false,
      routingRequestMade: false,
      paidProviderCalled: false,
      cesiumJsRuntimeUsed: false,
      d3RuntimeUsed: false,
      threeJsRuntimeUsed: false,
      publicAccessEnabled: false,
    },
    blockers: qa.blockers,
    warnings: Array.from(new Set([...qa.warnings, ...input.preflight.warnings])),
  }
  const localReportPath = path.join(process.cwd(), DECKGL_LOCAL_OVERLAY_LOCAL_REPORT_PATH)
  await mkdir(path.dirname(localReportPath), { recursive: true })
  await mkdir(input.localRoot, { recursive: true })
  await writeFile(localReportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  return report
}

async function uploadJson(bucket: string, object: string, payload: unknown, root: string, id: string, kind: DeckGlLocalOverlayArtifact['kind'] = 'private_json'): Promise<DeckGlLocalOverlayArtifact> {
  const filePath = path.join(root, `${id}.json`)
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  return uploadFile(bucket, object, filePath, id, kind)
}

async function uploadFile(bucket: string, object: string, filePath: string, id: string, kind: DeckGlLocalOverlayArtifact['kind']): Promise<DeckGlLocalOverlayArtifact> {
  const stats = await stat(filePath)
  const sha256 = await sha256File(filePath)
  await runCommand('gcloud', ['storage', 'cp', filePath, `gs://${bucket}/${object}`])
  return { id, kind, bucket, object, gcsUri: `gs://${bucket}/${object}`, sizeBytes: stats.size, sha256 }
}

async function assertNoPublicBucketPrincipals(buckets: string[], blockers: string[]) {
  for (const bucket of buckets) {
    const policy = await runGcloud(['storage', 'buckets', 'get-iam-policy', `gs://${bucket}`, '--format=json'])
    if (policy.includes('allUsers') || policy.includes('allAuthenticatedUsers')) blockers.push(`Bucket ${bucket} has a public IAM principal.`)
  }
}

async function runGcloud(args: string[]): Promise<string> {
  const result = await execFileAsync('gcloud', args, { maxBuffer: 20 * 1024 * 1024 })
  return result.stdout ?? ''
}

async function runCommand(command: string, args: string[], timeout = 10 * 60 * 1000): Promise<string> {
  const result = await execFileAsync(command, args, { timeout, maxBuffer: 128 * 1024 * 1024 })
  return `${result.stdout ?? ''}${result.stderr ?? ''}`
}

async function sha256File(filePath: string): Promise<string> {
  const hash = createHash('sha256')
  hash.update(readFileSync(filePath))
  return hash.digest('hex')
}

function lastGcloudValue(output: string): string {
  const lines = output.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith('WARNING:') && !line.includes('Python 3.9.x'))
  return lines.at(-1) ?? ''
}
