import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { mkdir, rm, stat, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { buildGeneratedPlanningSourceRecords } from './planning-source-fixture-builder'
import { normalizePlanningSourcesToLocationCandidates } from './location-candidate-normalizer'
import { buildWebSearchMapPlanningGeoJson } from './map-planning-geojson-builder'
import { runWebSearchMapPlanningTurfCalculations } from './map-planning-turf-runner'
import { runWebSearchMapPlanningCaptures } from './map-planning-capture-runner'
import { buildWebSearchDeckGlPlanningOverlay } from './deckgl-planning-overlay-runner'
import { buildCesiumPlanningData, buildCesiumSceneConfig } from './cesiumjs-planning-scene-runner'
import { resolveWebSearchMapPlanningEvidenceChain } from './web-search-map-evidence-resolver'
import { buildWebSearchMapPlanningManifest } from './web-search-map-planning-manifest-builder'
import {
  makeWebSearchMapPlanningRunId,
  validateWebSearchMapPlanningExecutionEnv,
  webSearchMapPlanningArtifactPrefix,
  webSearchMapPlanningConfig,
  webSearchMapPlanningSafetyFlags,
} from './web-search-map-planning-policy'
import { buildWebSearchMapPlanningQaSummary } from './web-search-map-planning-qa-summary'
import { WEB_SEARCH_MAP_PLANNING_LOCAL_REPORT_PATH } from './web-search-map-planning-report-builder'
import type {
  WebSearchMap2DRenderResult,
  WebSearchMap3DRenderResult,
  WebSearchMapPlanningArtifact,
  WebSearchMapPlanningExecutionReport,
  WebSearchMapPlanningGeoJson,
} from './web-search-map-planning-types'
import { buildMapLibreLocalStyle, validateMapLibreLocalStyle } from '../maplibre-local-render-fixture'

const execFileAsync = promisify(execFile)

export async function runWebSearchMapPlanningE2E(input: { execute: boolean; runId?: string }) {
  if (!input.execute) throw new Error('Pass --execute to run Phase 50F web search + map planning private E2E.')
  const runId = input.runId ?? process.env.REEDITPRO_PHASE50F_RUN_ID ?? makeWebSearchMapPlanningRunId()
  const artifactPrefix = webSearchMapPlanningArtifactPrefix(runId)
  const localRoot = path.join(os.tmpdir(), `reeditpro-phase50f-web-search-map-planning-${runId}`)
  await rm(localRoot, { recursive: true, force: true })
  await mkdir(localRoot, { recursive: true })

  const evidenceChain = resolveWebSearchMapPlanningEvidenceChain()
  const planningSources = buildGeneratedPlanningSourceRecords()
  const locationCandidates = normalizePlanningSourcesToLocationCandidates(planningSources)
  const geojson = buildWebSearchMapPlanningGeoJson(locationCandidates)
  const turfCalculations = runWebSearchMapPlanningTurfCalculations(geojson)
  const preflight = await runWebSearchMapPlanningPreflight()
  if (preflight.blockers.length > 0) {
    const blockedReport = await writeBlockedLocalReport({ runId, evidenceChain, geojson, preflight, localRoot })
    return {
      executionReport: blockedReport,
      localReportPath: path.join(process.cwd(), WEB_SEARCH_MAP_PLANNING_LOCAL_REPORT_PATH),
      iamChanges: ['not_attempted: preflight blockers prevented private artifact upload'],
    }
  }

  const artifacts: WebSearchMapPlanningArtifact[] = []
  artifacts.push(await uploadJson(webSearchMapPlanningConfig.generatedAssetsBucket, `${artifactPrefix}/plan/web-search-map-planning-e2e-plan.json`, buildExecutionPlan(runId), localRoot, 'web_search_map_planning_e2e_plan'))
  artifacts.push(await uploadJson(webSearchMapPlanningConfig.generatedAssetsBucket, `${artifactPrefix}/sources/planning-source-records.json`, planningSources, localRoot, 'planning_source_records'))
  artifacts.push(await uploadJson(webSearchMapPlanningConfig.generatedAssetsBucket, `${artifactPrefix}/locations/location-candidates.json`, locationCandidates, localRoot, 'location_candidates'))
  artifacts.push(await uploadJson(webSearchMapPlanningConfig.generatedAssetsBucket, `${artifactPrefix}/geojson/planning-points.geojson`, geojson.points, localRoot, 'planning_points', 'private_geojson'))
  artifacts.push(await uploadJson(webSearchMapPlanningConfig.generatedAssetsBucket, `${artifactPrefix}/geojson/planning-routes.geojson`, geojson.routes, localRoot, 'planning_routes', 'private_geojson'))
  artifacts.push(await uploadJson(webSearchMapPlanningConfig.generatedAssetsBucket, `${artifactPrefix}/geojson/planning-polygons.geojson`, geojson.polygons, localRoot, 'planning_polygons', 'private_geojson'))
  artifacts.push(await uploadJson(webSearchMapPlanningConfig.generatedAssetsBucket, `${artifactPrefix}/geojson/planning-combined.geojson`, geojson.combined, localRoot, 'planning_combined', 'private_geojson'))
  artifacts.push(await uploadJson(webSearchMapPlanningConfig.generatedAssetsBucket, `${artifactPrefix}/turf/turf-planning-calculations.json`, turfCalculations, localRoot, 'turf_planning_calculations'))

  let map2D: WebSearchMap2DRenderResult = failed2DResult()
  let map3D: WebSearchMap3DRenderResult = failed3DResult(geojson)
  try {
    const captures = await runWebSearchMapPlanningCaptures({
      geojson,
      root2d: path.join(localRoot, 'map2d'),
      root3d: path.join(localRoot, 'map3d'),
    })
    map2D = captures.map2D
    map3D = captures.map3D
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    map2D.externalNetworkRequestsObserved.push({ url: 'phase50f://capture-error', method: 'N/A', resourceType: 'capture_error', allowed: false, blockedReason: message })
  }

  artifacts.push(await uploadJson(webSearchMapPlanningConfig.generatedAssetsBucket, `${artifactPrefix}/maplibre/maplibre-planning-style.json`, map2D.style, localRoot, 'maplibre_planning_style'))
  artifacts.push(await uploadJson(webSearchMapPlanningConfig.generatedAssetsBucket, `${artifactPrefix}/deckgl/deckgl-planning-overlay-data.json`, map2D.overlayData, localRoot, 'deckgl_planning_overlay_data'))
  artifacts.push(await uploadJson(webSearchMapPlanningConfig.generatedAssetsBucket, `${artifactPrefix}/cesium/cesium-planning-scene-config.json`, map3D.sceneConfig, localRoot, 'cesium_planning_scene_config'))
  if (map2D.renderMetadata) {
    artifacts.push(await uploadJson(webSearchMapPlanningConfig.generatedAssetsBucket, `${artifactPrefix}/render/maplibre-deckgl-render-metadata.json`, map2D.renderMetadata, localRoot, 'maplibre_deckgl_render_metadata'))
    artifacts.push(await uploadFile(webSearchMapPlanningConfig.generatedAssetsBucket, `${artifactPrefix}/capture/map-planning-2d-screenshot.png`, map2D.renderMetadata.screenshotPath, 'map_planning_2d_screenshot', 'private_png'))
  }
  if (map3D.renderMetadata) {
    artifacts.push(await uploadJson(webSearchMapPlanningConfig.generatedAssetsBucket, `${artifactPrefix}/render/cesium-render-metadata.json`, map3D.renderMetadata, localRoot, 'cesium_render_metadata'))
    artifacts.push(await uploadFile(webSearchMapPlanningConfig.generatedAssetsBucket, `${artifactPrefix}/capture/map-planning-3d-screenshot.png`, map3D.renderMetadata.screenshotPath, 'map_planning_3d_screenshot', 'private_png'))
  }
  artifacts.push(await uploadJson(webSearchMapPlanningConfig.generatedAssetsBucket, `${artifactPrefix}/capture/network-requests-observed.json`, {
    map2D: map2D.networkRequestsObserved,
    map2DExternal: map2D.externalNetworkRequestsObserved,
    map3D: map3D.networkRequestsObserved,
    map3DExternal: map3D.externalNetworkRequestsObserved,
  }, localRoot, 'network_requests_observed'))
  if (map2D.sharpProcessing) {
    artifacts.push(await uploadFile(webSearchMapPlanningConfig.generatedAssetsBucket, `${artifactPrefix}/processed/map-planning-2d-preview.png`, map2D.sharpProcessing.preview.path, 'map_planning_2d_preview', 'private_png'))
    artifacts.push(await uploadFile(webSearchMapPlanningConfig.generatedAssetsBucket, `${artifactPrefix}/processed/map-planning-2d-thumbnail.png`, map2D.sharpProcessing.thumbnail.path, 'map_planning_2d_thumbnail', 'private_png'))
  }
  if (map3D.sharpProcessing) {
    artifacts.push(await uploadFile(webSearchMapPlanningConfig.generatedAssetsBucket, `${artifactPrefix}/processed/map-planning-3d-preview.png`, map3D.sharpProcessing.preview.path, 'map_planning_3d_preview', 'private_png'))
    artifacts.push(await uploadFile(webSearchMapPlanningConfig.generatedAssetsBucket, `${artifactPrefix}/processed/map-planning-3d-thumbnail.png`, map3D.sharpProcessing.thumbnail.path, 'map_planning_3d_thumbnail', 'private_png'))
  }

  const preliminaryBlockers = [
    ...(map2D.renderMetadata ? [] : ['MapLibre + deck.gl local/offline planning render did not complete.']),
    ...(map3D.renderMetadata ? [] : ['CesiumJS local/offline planning render did not complete.']),
    ...(map2D.externalNetworkRequestsObserved.length === 0 && map3D.externalNetworkRequestsObserved.length === 0 ? [] : ['Network guard observed forbidden external requests.']),
  ]
  const manifest = buildWebSearchMapPlanningManifest({
    runId,
    planningSources,
    locationCandidates,
    turfCalculations,
    map2D,
    map3D,
    artifacts,
    warnings: preflight.warnings,
    blockers: preliminaryBlockers,
  })
  artifacts.push(await uploadJson(webSearchMapPlanningConfig.generatedAssetsBucket, `${artifactPrefix}/manifest/web-search-map-planning-e2e-manifest.json`, manifest, localRoot, 'web_search_map_planning_e2e_manifest'))

  const qa = buildWebSearchMapPlanningQaSummary({
    evidenceChain,
    planningSources,
    locationCandidates,
    geojson,
    turfCalculations,
    map2D,
    map3D,
    manifest,
    artifacts,
    preflightBlockers: preflight.blockers,
    publicAccessBlocked: preflight.publicAccessBlocked,
  })
  artifacts.push(await uploadJson(webSearchMapPlanningConfig.qaBucket, `${artifactPrefix}/qa/web-search-map-planning-e2e-qa.json`, qa, localRoot, 'web_search_map_planning_e2e_qa'))

  const executionReport: WebSearchMapPlanningExecutionReport = {
    ok: qa.status === 'passed',
    phase: '50F',
    runId,
    projectId: 'reeditpro',
    mode: webSearchMapPlanningConfig.mode,
    evidenceChain,
    planningSources,
    locationCandidates,
    geojson,
    turfCalculations,
    map2D,
    map3D,
    manifest,
    artifacts,
    qa,
    phase50GReadiness: qa.status === 'passed' ? 'ready_for_map_geospatial_internal_readiness_gate' : 'blocked',
    safety: buildSafetySummary(),
    blockers: qa.blockers,
    warnings: Array.from(new Set([...qa.warnings, ...preflight.warnings])),
  }
  artifacts.push(await uploadJson(webSearchMapPlanningConfig.qaBucket, `${artifactPrefix}/reports/phase50f-report.json`, executionReport, localRoot, 'phase50f_report'))
  executionReport.artifacts = artifacts
  if (executionReport.manifest) executionReport.manifest.artifacts = artifacts

  const localReportPath = path.join(process.cwd(), WEB_SEARCH_MAP_PLANNING_LOCAL_REPORT_PATH)
  await mkdir(path.dirname(localReportPath), { recursive: true })
  await writeFile(localReportPath, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')
  return {
    executionReport,
    localReportPath,
    iamChanges: ['not_required: active account uploaded generated/private Phase 50F web-search map-planning artifacts using existing private GCS permissions'],
  }
}

export async function runWebSearchMapPlanningPreflight() {
  const blockers: string[] = []
  const warnings: string[] = []
  let activeProjectValue = ''
  let publicAccessBlocked = false
  try {
    const [activeAccount, activeProject, projectDescribe, generatedAssetsBucket, qaBucket, phase49pReport, phase50eReport] = await Promise.all([
      runGcloud(['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']),
      runGcloud(['config', 'get-value', 'project']),
      runGcloud(['projects', 'describe', webSearchMapPlanningConfig.projectId, '--format=value(projectId)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${webSearchMapPlanningConfig.generatedAssetsBucket}`, '--format=value(name)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${webSearchMapPlanningConfig.qaBucket}`, '--format=value(name)']),
      runGcloud(['storage', 'objects', 'describe', `gs://${webSearchMapPlanningConfig.qaBucket}/activation-web-search/phase49p/${webSearchMapPlanningConfig.canonicalPhase49PRunId}/reports/phase49p-report.json`, '--format=value(name)']),
      runGcloud(['storage', 'objects', 'describe', `gs://${webSearchMapPlanningConfig.qaBucket}/activation-map-geospatial/phase50e/${webSearchMapPlanningConfig.canonicalPhase50ERunId}/reports/phase50e-report.json`, '--format=value(name)']),
    ])
    const activeAccountValue = lastGcloudValue(activeAccount)
    activeProjectValue = lastGcloudValue(activeProject)
    if (!activeAccountValue) blockers.push('No active gcloud account is visible.')
    if (activeProjectValue !== webSearchMapPlanningConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
    if (lastGcloudValue(projectDescribe) !== webSearchMapPlanningConfig.projectId) blockers.push('gcloud cannot describe project reeditpro.')
    if (lastGcloudValue(generatedAssetsBucket) !== webSearchMapPlanningConfig.generatedAssetsBucket) blockers.push('Generated-assets bucket is not reachable.')
    if (lastGcloudValue(qaBucket) !== webSearchMapPlanningConfig.qaBucket) blockers.push('QA bucket is not reachable.')
    if (!lastGcloudValue(phase49pReport)) blockers.push('Phase 49P canonical report is not reachable.')
    if (!lastGcloudValue(phase50eReport)) blockers.push('Phase 50E canonical report is not reachable.')
    await assertNoPublicBucketPrincipals([webSearchMapPlanningConfig.generatedAssetsBucket, webSearchMapPlanningConfig.qaBucket], blockers)
    publicAccessBlocked = !blockers.some((blocker) => blocker.includes('public IAM principal'))
  } catch (error) {
    blockers.push(error instanceof Error ? error.message : String(error))
  }

  const validation = validateWebSearchMapPlanningExecutionEnv({
    projectId: process.env.GCP_PROJECT_ID,
    activeProject: activeProjectValue,
    region: process.env.GCP_REGION,
    env: process.env.REEDITPRO_ENV,
    confirmation: process.env.REEDITPRO_CONFIRM_WEB_SEARCH_MAP_PLANNING_E2E,
    mode: process.env.REEDITPRO_WEB_SEARCH_MAP_PLANNING_MODE ?? webSearchMapPlanningConfig.mode,
  })
  return {
    allowed: blockers.length === 0 && validation.allowed,
    blockers: [...validation.blockers, ...blockers],
    warnings: [...validation.warnings, ...warnings],
    activeProject: activeProjectValue,
    publicAccessBlocked,
  }
}

async function writeBlockedLocalReport(input: {
  runId: string
  evidenceChain: ReturnType<typeof resolveWebSearchMapPlanningEvidenceChain>
  geojson: WebSearchMapPlanningGeoJson
  preflight: Awaited<ReturnType<typeof runWebSearchMapPlanningPreflight>>
  localRoot: string
}): Promise<WebSearchMapPlanningExecutionReport> {
  const planningSources = buildGeneratedPlanningSourceRecords()
  const locationCandidates = normalizePlanningSourcesToLocationCandidates(planningSources)
  const turfCalculations = runWebSearchMapPlanningTurfCalculations(input.geojson)
  const map2D = failed2DResult()
  const map3D = failed3DResult(input.geojson)
  const qa = buildWebSearchMapPlanningQaSummary({
    evidenceChain: input.evidenceChain,
    planningSources,
    locationCandidates,
    geojson: input.geojson,
    turfCalculations,
    map2D,
    map3D,
    preflightBlockers: input.preflight.blockers,
    publicAccessBlocked: input.preflight.publicAccessBlocked,
  })
  const report: WebSearchMapPlanningExecutionReport = {
    ok: false,
    phase: '50F',
    runId: input.runId,
    projectId: 'reeditpro',
    mode: webSearchMapPlanningConfig.mode,
    evidenceChain: input.evidenceChain,
    planningSources,
    locationCandidates,
    geojson: input.geojson,
    turfCalculations,
    map2D,
    map3D,
    artifacts: [],
    qa,
    phase50GReadiness: 'blocked',
    safety: buildSafetySummary(),
    blockers: qa.blockers,
    warnings: Array.from(new Set([...qa.warnings, ...input.preflight.warnings])),
  }
  const localReportPath = path.join(process.cwd(), WEB_SEARCH_MAP_PLANNING_LOCAL_REPORT_PATH)
  await mkdir(path.dirname(localReportPath), { recursive: true })
  await mkdir(input.localRoot, { recursive: true })
  await writeFile(localReportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  return report
}

function buildExecutionPlan(runId: string) {
  return {
    runId,
    phase: '50F',
    mode: webSearchMapPlanningConfig.mode,
    webSearchEvidenceRunId: webSearchMapPlanningConfig.canonicalPhase49PRunId,
    mapStackEvidenceRunId: webSearchMapPlanningConfig.canonicalPhase50ERunId,
    rawPromptExecution: false,
    generatedPlanningSourcesOnly: true,
    generatedLocationCandidatesOnly: true,
    liveSearchAllowed: false,
    liveGeocodingAllowed: false,
    liveRoutingAllowed: false,
    liveTilesAllowed: false,
    mapLibreDeckGlRender: 'local/offline 127.0.0.1 fixture only',
    cesiumJsRender: 'local/offline 127.0.0.1 fixture only',
    capturePolicy: 'Playwright captures generated local fixtures only',
    artifactPolicy: 'private GCS artifacts only',
    blocked: {
      publicSearxng: false,
      broadCrawling: false,
      arbitraryUrlCapture: false,
      publicOsmTiles: false,
      paidMapProviders: false,
      cesiumIon: false,
      liveTerrain: false,
      liveImagery: false,
      threeDTiles: false,
      production: false,
      externalBeta: false,
      broadMedia: false,
    },
  }
}

function failed2DResult(): WebSearchMap2DRenderResult {
  const geojson = buildWebSearchMapPlanningGeoJson(normalizePlanningSourcesToLocationCandidates(buildGeneratedPlanningSourceRecords()))
  const style = buildMapLibreLocalStyle(geojson.fixture)
  const { overlayData, layerManifest } = buildWebSearchDeckGlPlanningOverlay(geojson)
  return {
    style,
    styleValidation: validateMapLibreLocalStyle(style),
    overlayData,
    layerManifest,
    networkRequestsObserved: [],
    externalNetworkRequestsObserved: [],
  }
}

function failed3DResult(geojson: WebSearchMapPlanningGeoJson): WebSearchMap3DRenderResult {
  const planningData = buildCesiumPlanningData(geojson)
  return {
    planningData,
    sceneConfig: buildCesiumSceneConfig(planningData),
    networkRequestsObserved: [],
    externalNetworkRequestsObserved: [],
  }
}

async function uploadJson(bucket: string, object: string, payload: unknown, root: string, id: string, kind: WebSearchMapPlanningArtifact['kind'] = 'private_json'): Promise<WebSearchMapPlanningArtifact> {
  const filePath = path.join(root, `${id}.json`)
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  return uploadFile(bucket, object, filePath, id, kind)
}

async function uploadFile(bucket: string, object: string, filePath: string, id: string, kind: WebSearchMapPlanningArtifact['kind']): Promise<WebSearchMapPlanningArtifact> {
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

function buildSafetySummary(): WebSearchMapPlanningExecutionReport['safety'] {
  return {
    ...webSearchMapPlanningSafetyFlags,
    liveSearchExecuted: false,
    liveGeocodingRequestMade: false,
    liveRoutingRequestMade: false,
    liveTileRequestMade: false,
    publicOsmTileRequestMade: false,
    paidMapProviderCalled: false,
    publicSearxngUsed: false,
    publicAccessEnabled: false,
  }
}
