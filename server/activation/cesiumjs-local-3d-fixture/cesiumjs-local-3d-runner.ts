import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { mkdir, rm, stat, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { buildCesiumJsLocal3DCaptureManifest } from './cesiumjs-capture-artifact-manifest'
import { buildCesiumJsLocal3DFixtureData } from './cesiumjs-3d-fixture-data'
import { writeCesiumJsLocalHtmlFixture } from './cesiumjs-local-html-builder'
import {
  cesiumJsLocal3DArtifactPrefix,
  cesiumJsLocal3DConfig,
  cesiumJsLocal3DSafetyFlags,
  makeCesiumJsLocal3DRunId,
  validateCesiumJsLocal3DExecutionEnv,
} from './cesiumjs-local-3d-policy'
import { buildCesiumJsLocal3DQaSummary } from './cesiumjs-local-3d-qa-summary'
import { CESIUMJS_LOCAL_3D_LOCAL_REPORT_PATH } from './cesiumjs-local-3d-report-builder'
import { runCesiumJsPlaywrightCapture } from './cesiumjs-playwright-capture-runner'
import { runCesiumJsSharpScreenshotProcessing } from './cesiumjs-sharp-postprocess-runner'
import type {
  CesiumJsLocal3DArtifact,
  CesiumJsLocal3DExecutionReport,
  CesiumJsLocalFixtureData,
  CesiumRenderMetadata,
  SharpCesiumScreenshotProcessing,
} from './cesiumjs-local-3d-types'
import type { NetworkRequestRecord } from '../maplibre-local-render-fixture'

const execFileAsync = promisify(execFile)

export async function runCesiumJsLocal3DFixture(input: { execute: boolean; runId?: string }) {
  if (!input.execute) throw new Error('Pass --execute to run Phase 50E CesiumJS local 3D planning fixture.')
  const runId = input.runId ?? process.env.REEDITPRO_PHASE50E_RUN_ID ?? makeCesiumJsLocal3DRunId()
  const artifactPrefix = cesiumJsLocal3DArtifactPrefix(runId)
  const localRoot = path.join(os.tmpdir(), `reeditpro-phase50e-cesiumjs-local-3d-${runId}`)
  await rm(localRoot, { recursive: true, force: true })
  await mkdir(localRoot, { recursive: true })

  const fixtureData = buildCesiumJsLocal3DFixtureData()
  const preflight = await runCesiumJsLocal3DPreflight()
  if (preflight.blockers.length > 0) {
    const blockedReport = await writeBlockedLocalReport({ runId, fixtureData, preflight, localRoot })
    return {
      executionReport: blockedReport,
      localReportPath: path.join(process.cwd(), CESIUMJS_LOCAL_3D_LOCAL_REPORT_PATH),
      iamChanges: ['not_attempted: preflight blockers prevented private artifact upload'],
    }
  }

  const localFixture = await writeCesiumJsLocalHtmlFixture({ fixtureData, root: localRoot })
  const artifacts: CesiumJsLocal3DArtifact[] = []
  artifacts.push(await uploadJson(cesiumJsLocal3DConfig.generatedAssetsBucket, `${artifactPrefix}/plan/cesiumjs-local-3d-plan.json`, buildExecutionPlan(runId), localRoot, 'cesiumjs_local_3d_plan'))
  artifacts.push(await uploadFile(cesiumJsLocal3DConfig.generatedAssetsBucket, `${artifactPrefix}/fixture/generated-cesium-3d-page.html`, localFixture.htmlPath, 'cesiumjs_local_html_fixture', 'private_html'))
  artifacts.push(await uploadJson(cesiumJsLocal3DConfig.generatedAssetsBucket, `${artifactPrefix}/fixture/cesiumjs-local-assets-metadata.json`, localFixture, localRoot, 'cesiumjs_local_assets_metadata'))
  artifacts.push(await uploadJson(cesiumJsLocal3DConfig.generatedAssetsBucket, `${artifactPrefix}/geojson/generated-points.geojson`, fixtureData.fixture.points, localRoot, 'generated_points', 'private_geojson'))
  artifacts.push(await uploadJson(cesiumJsLocal3DConfig.generatedAssetsBucket, `${artifactPrefix}/geojson/generated-routes.geojson`, fixtureData.fixture.routes, localRoot, 'generated_routes', 'private_geojson'))
  artifacts.push(await uploadJson(cesiumJsLocal3DConfig.generatedAssetsBucket, `${artifactPrefix}/geojson/generated-polygons.geojson`, fixtureData.fixture.polygons, localRoot, 'generated_polygons', 'private_geojson'))
  artifacts.push(await uploadJson(cesiumJsLocal3DConfig.generatedAssetsBucket, `${artifactPrefix}/geojson/generated-combined.geojson`, fixtureData.fixture.combined, localRoot, 'generated_combined', 'private_geojson'))
  artifacts.push(await uploadJson(cesiumJsLocal3DConfig.generatedAssetsBucket, `${artifactPrefix}/cesium/cesium-entity-data.json`, fixtureData.planningData, localRoot, 'cesium_entity_data'))
  artifacts.push(await uploadJson(cesiumJsLocal3DConfig.generatedAssetsBucket, `${artifactPrefix}/cesium/cesium-scene-config.json`, fixtureData.sceneConfig, localRoot, 'cesium_scene_config'))

  let renderMetadata: CesiumRenderMetadata | undefined
  let networkRequestsObserved: NetworkRequestRecord[] = []
  let externalNetworkRequestsObserved: NetworkRequestRecord[] = []
  let sharpProcessing: SharpCesiumScreenshotProcessing | undefined
  try {
    const capture = await runCesiumJsPlaywrightCapture({ localFixture, outputRoot: localRoot })
    renderMetadata = capture.renderMetadata
    networkRequestsObserved = capture.networkRequestsObserved
    externalNetworkRequestsObserved = capture.externalNetworkRequestsObserved
    sharpProcessing = await runCesiumJsSharpScreenshotProcessing({
      screenshotPath: renderMetadata.screenshotPath,
      outputRoot: localRoot,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    externalNetworkRequestsObserved = [
      ...externalNetworkRequestsObserved,
      { url: 'phase50e://capture-error', method: 'N/A', resourceType: 'capture_error', allowed: false, blockedReason: message },
    ]
  }

  if (renderMetadata) {
    artifacts.push(await uploadJson(cesiumJsLocal3DConfig.generatedAssetsBucket, `${artifactPrefix}/render/cesium-render-metadata.json`, renderMetadata, localRoot, 'cesium_render_metadata'))
    artifacts.push(await uploadFile(cesiumJsLocal3DConfig.generatedAssetsBucket, `${artifactPrefix}/capture/cesiumjs-local-3d-screenshot.png`, renderMetadata.screenshotPath, 'cesiumjs_local_3d_screenshot', 'private_png'))
  }
  artifacts.push(await uploadJson(cesiumJsLocal3DConfig.generatedAssetsBucket, `${artifactPrefix}/capture/network-requests-observed.json`, { networkRequestsObserved, externalNetworkRequestsObserved }, localRoot, 'network_requests_observed'))
  if (sharpProcessing) {
    artifacts.push(await uploadFile(cesiumJsLocal3DConfig.generatedAssetsBucket, `${artifactPrefix}/processed/cesiumjs-3d-preview.png`, sharpProcessing.preview.path, 'cesiumjs_3d_preview', 'private_png'))
    artifacts.push(await uploadFile(cesiumJsLocal3DConfig.generatedAssetsBucket, `${artifactPrefix}/processed/cesiumjs-3d-thumbnail.png`, sharpProcessing.thumbnail.path, 'cesiumjs_3d_thumbnail', 'private_png'))
    artifacts.push(await uploadJson(cesiumJsLocal3DConfig.generatedAssetsBucket, `${artifactPrefix}/processed/cesiumjs-3d-image-metadata.json`, sharpProcessing, localRoot, 'cesiumjs_3d_image_metadata'))
  }

  const preliminaryBlockers = renderMetadata && externalNetworkRequestsObserved.length === 0 ? [] : ['CesiumJS local/offline 3D render/capture did not complete cleanly.']
  const captureManifest = renderMetadata
    ? buildCesiumJsLocal3DCaptureManifest({
      runId,
      sceneConfig: fixtureData.sceneConfig,
      renderMetadata,
      networkRequestsObserved,
      externalNetworkRequestsObserved,
      artifacts,
      warnings: preflight.warnings,
      blockers: preliminaryBlockers,
    })
    : undefined
  if (captureManifest) artifacts.push(await uploadJson(cesiumJsLocal3DConfig.generatedAssetsBucket, `${artifactPrefix}/manifest/cesiumjs-local-3d-capture-manifest.json`, captureManifest, localRoot, 'cesiumjs_local_3d_capture_manifest'))

  const qa = buildCesiumJsLocal3DQaSummary({
    phase50dEvidencePresent: preflight.phase50dEvidencePresent,
    fixture: fixtureData.fixture,
    planningData: fixtureData.planningData,
    sceneConfig: fixtureData.sceneConfig,
    renderMetadata,
    networkRequestsObserved,
    externalNetworkRequestsObserved,
    sharpProcessing,
    captureManifest,
    artifacts,
    preflightBlockers: preflight.blockers,
    publicAccessBlocked: preflight.publicAccessBlocked,
  })
  artifacts.push(await uploadJson(cesiumJsLocal3DConfig.qaBucket, `${artifactPrefix}/qa/cesiumjs-local-3d-qa.json`, qa, localRoot, 'cesiumjs_local_3d_qa'))

  const executionReport: CesiumJsLocal3DExecutionReport = {
    ok: qa.status === 'passed',
    phase: '50E',
    runId,
    projectId: 'reeditpro',
    mode: cesiumJsLocal3DConfig.mode,
    fixture: fixtureData.fixture,
    planningData: fixtureData.planningData,
    sceneConfig: fixtureData.sceneConfig,
    renderMetadata,
    networkRequestsObserved,
    externalNetworkRequestsObserved,
    sharpProcessing,
    captureManifest,
    artifacts,
    qa,
    phase50FReadiness: qa.status === 'passed' ? 'ready_for_web_search_map_planning_private_e2e' : 'blocked',
    safety: buildSafetySummary(),
    blockers: qa.blockers,
    warnings: Array.from(new Set([...qa.warnings, ...preflight.warnings])),
  }
  artifacts.push(await uploadJson(cesiumJsLocal3DConfig.qaBucket, `${artifactPrefix}/reports/phase50e-report.json`, executionReport, localRoot, 'phase50e_report'))
  executionReport.artifacts = artifacts

  const localReportPath = path.join(process.cwd(), CESIUMJS_LOCAL_3D_LOCAL_REPORT_PATH)
  await mkdir(path.dirname(localReportPath), { recursive: true })
  await writeFile(localReportPath, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')
  return {
    executionReport,
    localReportPath,
    iamChanges: ['not_required: active account uploaded generated/private CesiumJS local 3D fixture artifacts using existing private GCS permissions'],
  }
}

export async function runCesiumJsLocal3DPreflight() {
  const blockers: string[] = []
  const warnings: string[] = []
  let activeProjectValue = ''
  let publicAccessBlocked = false
  let phase50dEvidencePresent = false
  try {
    const [activeAccount, activeProject, projectDescribe, generatedAssetsBucket, qaBucket, phase50dReport] = await Promise.all([
      runGcloud(['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']),
      runGcloud(['config', 'get-value', 'project']),
      runGcloud(['projects', 'describe', cesiumJsLocal3DConfig.projectId, '--format=value(projectId)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${cesiumJsLocal3DConfig.generatedAssetsBucket}`, '--format=value(name)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${cesiumJsLocal3DConfig.qaBucket}`, '--format=value(name)']),
      runGcloud(['storage', 'objects', 'describe', cesiumJsLocal3DConfig.approvedPhase50DReportUri, '--format=value(name)']),
    ])
    const activeAccountValue = lastGcloudValue(activeAccount)
    activeProjectValue = lastGcloudValue(activeProject)
    if (!activeAccountValue) blockers.push('No active gcloud account is visible.')
    if (activeProjectValue !== cesiumJsLocal3DConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
    if (lastGcloudValue(projectDescribe) !== cesiumJsLocal3DConfig.projectId) blockers.push('gcloud cannot describe project reeditpro.')
    if (lastGcloudValue(generatedAssetsBucket) !== cesiumJsLocal3DConfig.generatedAssetsBucket) blockers.push('Generated-assets bucket is not reachable.')
    if (lastGcloudValue(qaBucket) !== cesiumJsLocal3DConfig.qaBucket) blockers.push('QA bucket is not reachable.')
    phase50dEvidencePresent = Boolean(lastGcloudValue(phase50dReport))
    if (!phase50dEvidencePresent) blockers.push(`Phase 50D canonical report is not reachable: ${cesiumJsLocal3DConfig.approvedPhase50DReportUri}`)
    await assertNoPublicBucketPrincipals([cesiumJsLocal3DConfig.generatedAssetsBucket, cesiumJsLocal3DConfig.qaBucket], blockers)
    publicAccessBlocked = !blockers.some((blocker) => blocker.includes('public IAM principal'))
  } catch (error) {
    blockers.push(error instanceof Error ? error.message : String(error))
  }

  const validation = validateCesiumJsLocal3DExecutionEnv({
    projectId: process.env.GCP_PROJECT_ID,
    activeProject: activeProjectValue,
    region: process.env.GCP_REGION,
    env: process.env.REEDITPRO_ENV,
    confirmation: process.env.REEDITPRO_CONFIRM_CESIUMJS_LOCAL_3D_FIXTURE,
    mode: process.env.REEDITPRO_CESIUMJS_LOCAL_3D_MODE ?? cesiumJsLocal3DConfig.mode,
    cesiumIonAllowed: process.env.CESIUM_ION_ALLOWED ?? 'false',
    cesiumIonTokenAllowed: process.env.CESIUM_ION_TOKEN_ALLOWED ?? 'false',
    liveImageryProviderAllowed: process.env.LIVE_IMAGERY_PROVIDER_ALLOWED ?? 'false',
    liveTerrainProviderAllowed: process.env.LIVE_TERRAIN_PROVIDER_ALLOWED ?? 'false',
    threeDTilesAllowed: process.env.THREE_D_TILES_ALLOWED ?? 'false',
    externalNetworkRequestsAllowed: process.env.EXTERNAL_NETWORK_REQUESTS_ALLOWED ?? 'false',
    tileDownloadAllowed: process.env.TILE_DOWNLOAD_ALLOWED ?? 'false',
    liveTileProviderAllowed: process.env.LIVE_TILE_PROVIDER_ALLOWED ?? 'false',
    publicOsmTileAllowed: process.env.PUBLIC_OSM_TILE_ALLOWED ?? 'false',
    mapboxProviderAllowed: process.env.MAPBOX_PROVIDER_ALLOWED ?? 'false',
    googleMapsProviderAllowed: process.env.GOOGLE_MAPS_PROVIDER_ALLOWED ?? 'false',
    geocodingAllowed: process.env.GEOCODING_ALLOWED ?? 'false',
    routingAllowed: process.env.ROUTING_ALLOWED ?? 'false',
    deckGlRuntimeAllowed: process.env.DECK_GL_RUNTIME_ALLOWED ?? 'false',
    d3RuntimeAllowed: process.env.D3_RUNTIME_ALLOWED ?? 'false',
    threeJsRuntimeAllowed: process.env.THREE_JS_RUNTIME_ALLOWED ?? 'false',
    paidMapProviderAllowed: process.env.PAID_MAP_PROVIDER_ALLOWED ?? 'false',
    publicArtifactAllowed: process.env.PUBLIC_ARTIFACT_ALLOWED ?? process.env.PUBLIC_ACCESS_ENABLED ?? 'false',
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
    phase50dEvidencePresent,
  }
}

function buildExecutionPlan(runId: string) {
  return {
    runId,
    phase: '50E',
    mode: cesiumJsLocal3DConfig.mode,
    sourceFixture: 'generated Phase 50B-style GeoJSON plus deterministic CesiumJS 3D planning entity records',
    approvedPhase50DRunId: cesiumJsLocal3DConfig.approvedPhase50DRunId,
    approvedPhase50DReportUri: cesiumJsLocal3DConfig.approvedPhase50DReportUri,
    localStaticServer: '127.0.0.1 only',
    localAssets: ['cesium/Build/Cesium copied into temp vendor/cesium'],
    cesiumScene: 'Viewer with baseLayer=false, EllipsoidTerrainProvider, no imagery, no terrain, no ion, no 3D Tiles, no geocoder',
    cesiumEntities: ['points', 'polylines', 'polygons', 'cylinders'],
    browserCapture: 'Playwright Chromium headless against local fixture only',
    screenshotProcessing: 'Sharp processes only the Phase 50E screenshot',
    ...blockedPlanFlags(),
  }
}

async function writeBlockedLocalReport(input: {
  runId: string
  fixtureData: CesiumJsLocalFixtureData
  preflight: Awaited<ReturnType<typeof runCesiumJsLocal3DPreflight>>
  localRoot: string
}): Promise<CesiumJsLocal3DExecutionReport> {
  const qa = buildCesiumJsLocal3DQaSummary({
    phase50dEvidencePresent: input.preflight.phase50dEvidencePresent,
    fixture: input.fixtureData.fixture,
    planningData: input.fixtureData.planningData,
    sceneConfig: input.fixtureData.sceneConfig,
    preflightBlockers: input.preflight.blockers,
    publicAccessBlocked: input.preflight.publicAccessBlocked,
  })
  const report: CesiumJsLocal3DExecutionReport = {
    ok: false,
    phase: '50E',
    runId: input.runId,
    projectId: 'reeditpro',
    mode: cesiumJsLocal3DConfig.mode,
    fixture: input.fixtureData.fixture,
    planningData: input.fixtureData.planningData,
    sceneConfig: input.fixtureData.sceneConfig,
    networkRequestsObserved: [],
    externalNetworkRequestsObserved: [],
    artifacts: [],
    qa,
    phase50FReadiness: 'blocked',
    safety: buildSafetySummary(),
    blockers: qa.blockers,
    warnings: Array.from(new Set([...qa.warnings, ...input.preflight.warnings])),
  }
  const localReportPath = path.join(process.cwd(), CESIUMJS_LOCAL_3D_LOCAL_REPORT_PATH)
  await mkdir(path.dirname(localReportPath), { recursive: true })
  await mkdir(input.localRoot, { recursive: true })
  await writeFile(localReportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  return report
}

async function uploadJson(bucket: string, object: string, payload: unknown, root: string, id: string, kind: CesiumJsLocal3DArtifact['kind'] = 'private_json'): Promise<CesiumJsLocal3DArtifact> {
  const filePath = path.join(root, `${id}.json`)
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  return uploadFile(bucket, object, filePath, id, kind)
}

async function uploadFile(bucket: string, object: string, filePath: string, id: string, kind: CesiumJsLocal3DArtifact['kind']): Promise<CesiumJsLocal3DArtifact> {
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

function blockedPlanFlags() {
  return {
    cesiumIonAllowed: false,
    cesiumIonTokenAllowed: false,
    liveImageryProviderAllowed: false,
    liveTerrainProviderAllowed: false,
    threeDTilesAllowed: false,
    externalNetworkRequestsAllowed: false,
    tileDownloadAllowed: false,
    publicOsmTileAllowed: false,
    mapboxProviderAllowed: false,
    googleMapsProviderAllowed: false,
    geocodingAllowed: false,
    routingAllowed: false,
    paidMapProviderAllowed: false,
    deckGlRuntimeAllowed: false,
    d3RuntimeAllowed: false,
    threeJsRuntimeAllowed: false,
    publicArtifactAllowed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    broadMediaAllowed: false,
  }
}

function buildSafetySummary(): CesiumJsLocal3DExecutionReport['safety'] {
  return {
    ...cesiumJsLocal3DSafetyFlags,
    cesiumIonTokenUsed: false,
    liveImageryRequestMade: false,
    liveTerrainRequestMade: false,
    threeDTilesRequestMade: false,
    liveTileRequestMade: false,
    geocodingRequestMade: false,
    routingRequestMade: false,
    paidProviderCalled: false,
    deckGlRuntimeUsed: false,
    d3RuntimeUsed: false,
    threeJsRuntimeUsed: false,
    publicAccessEnabled: false,
  }
}
