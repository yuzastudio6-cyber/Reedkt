import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { mkdir, rm, stat, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { buildLocalMapFixtureData } from './local-map-fixture-data'
import { writeLocalMapHtmlFixture } from './local-map-html-builder'
import { buildMapLibreLocalCaptureManifest } from './maplibre-capture-artifact-manifest'
import {
  makeMapLibreLocalRenderRunId,
  mapLibreLocalRenderArtifactPrefix,
  mapLibreLocalRenderConfig,
  mapLibreLocalRenderSafetyFlags,
  validateMapLibreLocalRenderExecutionEnv,
} from './maplibre-local-render-policy'
import { buildMapLibreLocalRenderQaSummary } from './maplibre-local-render-qa-summary'
import { MAPLIBRE_LOCAL_RENDER_LOCAL_REPORT_PATH } from './maplibre-local-render-report-builder'
import { runMapLibrePlaywrightCapture } from './maplibre-playwright-capture-runner'
import { runMapLibreSharpScreenshotProcessing } from './maplibre-sharp-postprocess-runner'
import type {
  LocalMapFixtureData,
  MapLibreLocalRenderArtifact,
  MapLibreLocalRenderExecutionReport,
  MapLibreRenderMetadata,
  NetworkRequestRecord,
  SharpMapScreenshotProcessing,
} from './maplibre-local-render-types'

const execFileAsync = promisify(execFile)

export async function runMapLibreLocalRenderFixture(input: { execute: boolean; runId?: string }) {
  if (!input.execute) throw new Error('Pass --execute to run Phase 50C MapLibre local render + capture fixture.')
  const runId = input.runId ?? process.env.REEDITPRO_PHASE50C_RUN_ID ?? makeMapLibreLocalRenderRunId()
  const artifactPrefix = mapLibreLocalRenderArtifactPrefix(runId)
  const localRoot = path.join(os.tmpdir(), `reeditpro-phase50c-maplibre-local-render-${runId}`)
  await rm(localRoot, { recursive: true, force: true })
  await mkdir(localRoot, { recursive: true })

  const fixtureData = buildLocalMapFixtureData()
  const preflight = await runMapLibreLocalRenderPreflight()
  if (preflight.blockers.length > 0) {
    const blockedReport = await writeBlockedLocalReport({ runId, fixtureData, preflight, localRoot })
    return {
      executionReport: blockedReport,
      localReportPath: path.join(process.cwd(), MAPLIBRE_LOCAL_RENDER_LOCAL_REPORT_PATH),
      iamChanges: ['not_attempted: preflight blockers prevented private artifact upload'],
    }
  }

  const localFixture = await writeLocalMapHtmlFixture({
    fixtureData,
    root: localRoot,
  })
  const artifacts: MapLibreLocalRenderArtifact[] = []
  artifacts.push(await uploadJson(mapLibreLocalRenderConfig.generatedAssetsBucket, `${artifactPrefix}/plan/maplibre-local-render-plan.json`, buildExecutionPlan(runId), localRoot, 'maplibre_local_render_plan'))
  artifacts.push(await uploadFile(mapLibreLocalRenderConfig.generatedAssetsBucket, `${artifactPrefix}/fixture/generated-map-page.html`, localFixture.htmlPath, 'local_html_fixture', 'private_html'))
  artifacts.push(await uploadJson(mapLibreLocalRenderConfig.generatedAssetsBucket, `${artifactPrefix}/fixture/maplibre-local-assets-metadata.json`, localFixture, localRoot, 'maplibre_local_assets_metadata'))
  artifacts.push(await uploadJson(mapLibreLocalRenderConfig.generatedAssetsBucket, `${artifactPrefix}/geojson/generated-points.geojson`, fixtureData.fixture.points, localRoot, 'generated_points', 'private_geojson'))
  artifacts.push(await uploadJson(mapLibreLocalRenderConfig.generatedAssetsBucket, `${artifactPrefix}/geojson/generated-routes.geojson`, fixtureData.fixture.routes, localRoot, 'generated_routes', 'private_geojson'))
  artifacts.push(await uploadJson(mapLibreLocalRenderConfig.generatedAssetsBucket, `${artifactPrefix}/geojson/generated-polygons.geojson`, fixtureData.fixture.polygons, localRoot, 'generated_polygons', 'private_geojson'))
  artifacts.push(await uploadJson(mapLibreLocalRenderConfig.generatedAssetsBucket, `${artifactPrefix}/geojson/generated-combined.geojson`, fixtureData.fixture.combined, localRoot, 'generated_combined', 'private_geojson'))
  artifacts.push(await uploadJson(mapLibreLocalRenderConfig.generatedAssetsBucket, `${artifactPrefix}/maplibre/local-offline-style.json`, fixtureData.style, localRoot, 'local_offline_style'))

  let renderMetadata: MapLibreRenderMetadata | undefined
  let networkRequestsObserved: NetworkRequestRecord[] = []
  let externalNetworkRequestsObserved: NetworkRequestRecord[] = []
  let sharpProcessing: SharpMapScreenshotProcessing | undefined
  try {
    const capture = await runMapLibrePlaywrightCapture({ localFixture, outputRoot: localRoot })
    renderMetadata = capture.renderMetadata
    networkRequestsObserved = capture.networkRequestsObserved
    externalNetworkRequestsObserved = capture.externalNetworkRequestsObserved
    sharpProcessing = await runMapLibreSharpScreenshotProcessing({
      screenshotPath: renderMetadata.screenshotPath,
      outputRoot: localRoot,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    externalNetworkRequestsObserved = [
      ...externalNetworkRequestsObserved,
      { url: 'phase50c://capture-error', method: 'N/A', resourceType: 'capture_error', allowed: false, blockedReason: message },
    ]
  }

  if (renderMetadata) {
    artifacts.push(await uploadJson(mapLibreLocalRenderConfig.generatedAssetsBucket, `${artifactPrefix}/render/maplibre-render-metadata.json`, renderMetadata, localRoot, 'maplibre_render_metadata'))
    artifacts.push(await uploadFile(mapLibreLocalRenderConfig.generatedAssetsBucket, `${artifactPrefix}/capture/maplibre-local-render-screenshot.png`, renderMetadata.screenshotPath, 'maplibre_local_render_screenshot', 'private_png'))
  }
  artifacts.push(await uploadJson(mapLibreLocalRenderConfig.generatedAssetsBucket, `${artifactPrefix}/capture/network-requests-observed.json`, { networkRequestsObserved, externalNetworkRequestsObserved }, localRoot, 'network_requests_observed'))
  if (sharpProcessing) {
    artifacts.push(await uploadFile(mapLibreLocalRenderConfig.generatedAssetsBucket, `${artifactPrefix}/processed/maplibre-render-preview.png`, sharpProcessing.preview.path, 'maplibre_render_preview', 'private_png'))
    artifacts.push(await uploadFile(mapLibreLocalRenderConfig.generatedAssetsBucket, `${artifactPrefix}/processed/maplibre-render-thumbnail.png`, sharpProcessing.thumbnail.path, 'maplibre_render_thumbnail', 'private_png'))
    artifacts.push(await uploadJson(mapLibreLocalRenderConfig.generatedAssetsBucket, `${artifactPrefix}/processed/maplibre-render-image-metadata.json`, sharpProcessing, localRoot, 'maplibre_render_image_metadata'))
  }

  const preliminaryBlockers = renderMetadata && externalNetworkRequestsObserved.length === 0 ? [] : ['MapLibre local render/capture did not complete cleanly.']
  const captureManifest = renderMetadata
    ? buildMapLibreLocalCaptureManifest({
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
    artifacts.push(await uploadJson(mapLibreLocalRenderConfig.generatedAssetsBucket, `${artifactPrefix}/manifest/maplibre-local-render-capture-manifest.json`, captureManifest, localRoot, 'maplibre_local_render_capture_manifest'))
  }

  const qa = buildMapLibreLocalRenderQaSummary({
    phase50bEvidencePresent: preflight.phase50bEvidencePresent,
    fixture: fixtureData.fixture,
    style: fixtureData.style,
    styleValidation: fixtureData.styleValidation,
    renderMetadata,
    networkRequestsObserved,
    externalNetworkRequestsObserved,
    sharpProcessing,
    captureManifest,
    artifacts,
    preflightBlockers: preflight.blockers,
    publicAccessBlocked: preflight.publicAccessBlocked,
  })
  artifacts.push(await uploadJson(mapLibreLocalRenderConfig.qaBucket, `${artifactPrefix}/qa/maplibre-local-render-qa.json`, qa, localRoot, 'maplibre_local_render_qa'))

  const executionReport: MapLibreLocalRenderExecutionReport = {
    ok: qa.status === 'passed',
    phase: '50C',
    runId,
    projectId: 'reeditpro',
    mode: mapLibreLocalRenderConfig.mode,
    fixture: fixtureData.fixture,
    style: fixtureData.style,
    styleValidation: fixtureData.styleValidation,
    renderMetadata,
    networkRequestsObserved,
    externalNetworkRequestsObserved,
    sharpProcessing,
    captureManifest,
    artifacts,
    qa,
    phase50DReadiness: qa.status === 'passed' ? 'ready_for_deckgl_overlay_fixture' : 'blocked',
    safety: {
      ...mapLibreLocalRenderSafetyFlags,
      liveTileRequestMade: false,
      publicOsmTileRequestMade: false,
      geocodingRequestMade: false,
      routingRequestMade: false,
      paidProviderCalled: false,
      deckGlRuntimeUsed: false,
      cesiumJsRuntimeUsed: false,
      publicAccessEnabled: false,
    },
    blockers: qa.blockers,
    warnings: Array.from(new Set([...qa.warnings, ...preflight.warnings])),
  }
  artifacts.push(await uploadJson(mapLibreLocalRenderConfig.qaBucket, `${artifactPrefix}/reports/phase50c-report.json`, executionReport, localRoot, 'phase50c_report'))
  executionReport.artifacts = artifacts

  const localReportPath = path.join(process.cwd(), MAPLIBRE_LOCAL_RENDER_LOCAL_REPORT_PATH)
  await mkdir(path.dirname(localReportPath), { recursive: true })
  await writeFile(localReportPath, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')
  return {
    executionReport,
    localReportPath,
    iamChanges: ['not_required: active account uploaded generated/private local render fixture artifacts using existing private GCS permissions'],
  }
}

export async function runMapLibreLocalRenderPreflight() {
  const blockers: string[] = []
  const warnings: string[] = []
  let activeProjectValue = ''
  let publicAccessBlocked = false
  let phase50bEvidencePresent = false
  try {
    const [activeAccount, activeProject, projectDescribe, generatedAssetsBucket, qaBucket, phase50bReport] = await Promise.all([
      runGcloud(['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']),
      runGcloud(['config', 'get-value', 'project']),
      runGcloud(['projects', 'describe', mapLibreLocalRenderConfig.projectId, '--format=value(projectId)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${mapLibreLocalRenderConfig.generatedAssetsBucket}`, '--format=value(name)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${mapLibreLocalRenderConfig.qaBucket}`, '--format=value(name)']),
      runGcloud(['storage', 'objects', 'describe', mapLibreLocalRenderConfig.approvedPhase50BReportUri, '--format=value(name)']),
    ])
    const activeAccountValue = lastGcloudValue(activeAccount)
    activeProjectValue = lastGcloudValue(activeProject)
    if (!activeAccountValue) blockers.push('No active gcloud account is visible.')
    if (activeProjectValue !== mapLibreLocalRenderConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
    if (lastGcloudValue(projectDescribe) !== mapLibreLocalRenderConfig.projectId) blockers.push('gcloud cannot describe project reeditpro.')
    if (lastGcloudValue(generatedAssetsBucket) !== mapLibreLocalRenderConfig.generatedAssetsBucket) blockers.push('Generated-assets bucket is not reachable.')
    if (lastGcloudValue(qaBucket) !== mapLibreLocalRenderConfig.qaBucket) blockers.push('QA bucket is not reachable.')
    phase50bEvidencePresent = Boolean(lastGcloudValue(phase50bReport))
    if (!phase50bEvidencePresent) blockers.push(`Phase 50B canonical report is not reachable: ${mapLibreLocalRenderConfig.approvedPhase50BReportUri}`)
    await assertNoPublicBucketPrincipals([mapLibreLocalRenderConfig.generatedAssetsBucket, mapLibreLocalRenderConfig.qaBucket], blockers)
    publicAccessBlocked = !blockers.some((blocker) => blocker.includes('public IAM principal'))
  } catch (error) {
    blockers.push(error instanceof Error ? error.message : String(error))
  }

  const validation = validateMapLibreLocalRenderExecutionEnv({
    projectId: process.env.GCP_PROJECT_ID,
    activeProject: activeProjectValue,
    region: process.env.GCP_REGION,
    env: process.env.REEDITPRO_ENV,
    confirmation: process.env.REEDITPRO_CONFIRM_MAPLIBRE_LOCAL_RENDER_CAPTURE,
    mode: process.env.REEDITPRO_MAPLIBRE_LOCAL_RENDER_MODE ?? mapLibreLocalRenderConfig.mode,
    externalNetworkRequestsAllowed: process.env.EXTERNAL_NETWORK_REQUESTS_ALLOWED ?? 'false',
    tileDownloadAllowed: process.env.TILE_DOWNLOAD_ALLOWED ?? 'false',
    liveTileProviderAllowed: process.env.LIVE_TILE_PROVIDER_ALLOWED ?? 'false',
    publicOsmTileAllowed: process.env.PUBLIC_OSM_TILE_ALLOWED ?? 'false',
    geocodingAllowed: process.env.GEOCODING_ALLOWED ?? 'false',
    routingAllowed: process.env.ROUTING_ALLOWED ?? 'false',
    paidMapProviderAllowed: process.env.PAID_MAP_PROVIDER_ALLOWED ?? 'false',
    publicArtifactAllowed: process.env.PUBLIC_ARTIFACT_ALLOWED ?? process.env.PUBLIC_ACCESS_ENABLED ?? 'false',
    deckGlRuntimeAllowed: process.env.DECK_GL_RUNTIME_ALLOWED ?? 'false',
    cesiumJsRuntimeAllowed: process.env.CESIUM_JS_RUNTIME_ALLOWED ?? 'false',
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
    phase50bEvidencePresent,
  }
}

function buildExecutionPlan(runId: string) {
  return {
    runId,
    phase: '50C',
    mode: mapLibreLocalRenderConfig.mode,
    sourceFixture: 'generated Phase 50B-style GeoJSON',
    approvedPhase50BRunId: mapLibreLocalRenderConfig.approvedPhase50BRunId,
    localStaticServer: '127.0.0.1 only',
    mapLibreAssets: 'copied from local node_modules into temporary fixture directory',
    mapLibreStyle: 'inline generated GeoJSON sources only',
    labelsRenderedAsHtmlOverlay: true,
    browserCapture: 'Playwright Chromium headless against local fixture only',
    screenshotProcessing: 'Sharp processes only the Phase 50C screenshot',
    externalNetworkRequestsAllowed: false,
    tileDownloadAllowed: false,
    publicOsmTileAllowed: false,
    geocodingAllowed: false,
    routingAllowed: false,
    paidMapProviderAllowed: false,
    deckGlRuntimeAllowed: false,
    cesiumJsRuntimeAllowed: false,
    publicArtifactAllowed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    broadMediaAllowed: false,
  }
}

async function writeBlockedLocalReport(input: {
  runId: string
  fixtureData: LocalMapFixtureData
  preflight: Awaited<ReturnType<typeof runMapLibreLocalRenderPreflight>>
  localRoot: string
}): Promise<MapLibreLocalRenderExecutionReport> {
  const qa = buildMapLibreLocalRenderQaSummary({
    phase50bEvidencePresent: input.preflight.phase50bEvidencePresent,
    fixture: input.fixtureData.fixture,
    style: input.fixtureData.style,
    styleValidation: input.fixtureData.styleValidation,
    preflightBlockers: input.preflight.blockers,
    publicAccessBlocked: input.preflight.publicAccessBlocked,
  })
  const report: MapLibreLocalRenderExecutionReport = {
    ok: false,
    phase: '50C',
    runId: input.runId,
    projectId: 'reeditpro',
    mode: mapLibreLocalRenderConfig.mode,
    fixture: input.fixtureData.fixture,
    style: input.fixtureData.style,
    styleValidation: input.fixtureData.styleValidation,
    networkRequestsObserved: [],
    externalNetworkRequestsObserved: [],
    artifacts: [],
    qa,
    phase50DReadiness: 'blocked',
    safety: {
      ...mapLibreLocalRenderSafetyFlags,
      liveTileRequestMade: false,
      publicOsmTileRequestMade: false,
      geocodingRequestMade: false,
      routingRequestMade: false,
      paidProviderCalled: false,
      deckGlRuntimeUsed: false,
      cesiumJsRuntimeUsed: false,
      publicAccessEnabled: false,
    },
    blockers: qa.blockers,
    warnings: Array.from(new Set([...qa.warnings, ...input.preflight.warnings])),
  }
  const localReportPath = path.join(process.cwd(), MAPLIBRE_LOCAL_RENDER_LOCAL_REPORT_PATH)
  await mkdir(path.dirname(localReportPath), { recursive: true })
  await mkdir(input.localRoot, { recursive: true })
  await writeFile(localReportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  return report
}

async function uploadJson(bucket: string, object: string, payload: unknown, root: string, id: string, kind: MapLibreLocalRenderArtifact['kind'] = 'private_json'): Promise<MapLibreLocalRenderArtifact> {
  const filePath = path.join(root, `${id}.json`)
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  return uploadFile(bucket, object, filePath, id, kind)
}

async function uploadFile(bucket: string, object: string, filePath: string, id: string, kind: MapLibreLocalRenderArtifact['kind']): Promise<MapLibreLocalRenderArtifact> {
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
