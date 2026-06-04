import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { mkdir, rm, stat, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { buildMapGeospatialApprovalReport } from '../map-geospatial-approval'
import { buildGeneratedGeoJsonFixture } from './generated-geojson-fixture'
import { buildMapPlanningManifest } from './map-planning-manifest-builder'
import { buildMapLibreStyleManifest } from './maplibre-style-manifest-builder'
import {
  makeMapLibreTurfFixtureRunId,
  mapLibreTurfFixtureArtifactPrefix,
  mapLibreTurfFixtureConfig,
  mapLibreTurfFixtureSafetyFlags,
  validateMapLibreTurfFixtureExecutionEnv,
} from './maplibre-turf-fixture-policy'
import { MAPLIBRE_TURF_FIXTURE_LOCAL_REPORT_PATH } from './maplibre-turf-report-builder'
import { buildMapLibreTurfFixtureQaSummary } from './maplibre-turf-qa-summary'
import { runTurfGeospatialCalculations } from './turf-geospatial-runner'
import type { MapLibreTurfFixtureArtifact, MapLibreTurfFixtureExecutionReport } from './maplibre-turf-fixture-types'

const execFileAsync = promisify(execFile)

export async function runMapLibreTurfFixture(input: { execute: boolean; runId?: string }) {
  if (!input.execute) throw new Error('Pass --execute to run Phase 50B MapLibre + Turf generated fixture.')
  const runId = input.runId ?? process.env.REEDITPRO_PHASE50B_RUN_ID ?? makeMapLibreTurfFixtureRunId()
  const artifactPrefix = mapLibreTurfFixtureArtifactPrefix(runId)
  const localRoot = path.join(os.tmpdir(), `reeditpro-phase50b-maplibre-turf-fixture-${runId}`)
  await rm(localRoot, { recursive: true, force: true })
  await mkdir(localRoot, { recursive: true })

  const preflight = await runMapLibreTurfFixturePreflight()
  const phase50a = buildMapGeospatialApprovalReport()
  const fixture = buildGeneratedGeoJsonFixture()
  const turfCalculations = runTurfGeospatialCalculations(fixture)
  const mapLibreManifest = buildMapLibreStyleManifest(fixture, turfCalculations)
  const planningManifest = buildMapPlanningManifest({ runId, fixture, turfCalculations, mapLibreManifest })
  const initialQa = buildMapLibreTurfFixtureQaSummary({
    phase50aApproved: phase50a.status === 'approval_review_complete',
    fixture,
    turfCalculations,
    mapLibreManifest,
    preflightBlockers: preflight.blockers,
    publicAccessBlocked: preflight.publicAccessBlocked,
  })
  const artifacts: MapLibreTurfFixtureArtifact[] = []
  artifacts.push(await uploadJson(mapLibreTurfFixtureConfig.generatedAssetsBucket, `${artifactPrefix}/plan/maplibre-turf-fixture-plan.json`, buildExecutionPlan(runId), localRoot, 'maplibre_turf_fixture_plan'))
  artifacts.push(await uploadJson(mapLibreTurfFixtureConfig.generatedAssetsBucket, `${artifactPrefix}/geojson/generated-points.geojson`, fixture.points, localRoot, 'generated_points', 'private_geojson'))
  artifacts.push(await uploadJson(mapLibreTurfFixtureConfig.generatedAssetsBucket, `${artifactPrefix}/geojson/generated-routes.geojson`, fixture.routes, localRoot, 'generated_routes', 'private_geojson'))
  artifacts.push(await uploadJson(mapLibreTurfFixtureConfig.generatedAssetsBucket, `${artifactPrefix}/geojson/generated-polygons.geojson`, fixture.polygons, localRoot, 'generated_polygons', 'private_geojson'))
  artifacts.push(await uploadJson(mapLibreTurfFixtureConfig.generatedAssetsBucket, `${artifactPrefix}/geojson/generated-combined.geojson`, fixture.combined, localRoot, 'generated_combined', 'private_geojson'))
  artifacts.push(await uploadJson(mapLibreTurfFixtureConfig.generatedAssetsBucket, `${artifactPrefix}/turf/turf-calculations.json`, turfCalculations, localRoot, 'turf_calculations'))
  artifacts.push(await uploadJson(mapLibreTurfFixtureConfig.generatedAssetsBucket, `${artifactPrefix}/maplibre/maplibre-style-manifest.json`, mapLibreManifest, localRoot, 'maplibre_style_manifest'))
  artifacts.push(await uploadJson(mapLibreTurfFixtureConfig.generatedAssetsBucket, `${artifactPrefix}/manifest/map-planning-manifest.json`, planningManifest, localRoot, 'map_planning_manifest'))

  const finalQa = buildMapLibreTurfFixtureQaSummary({
    phase50aApproved: phase50a.status === 'approval_review_complete',
    fixture,
    turfCalculations,
    mapLibreManifest,
    artifacts,
    preflightBlockers: preflight.blockers,
    publicAccessBlocked: preflight.publicAccessBlocked,
  })
  artifacts.push(await uploadJson(mapLibreTurfFixtureConfig.qaBucket, `${artifactPrefix}/qa/maplibre-turf-fixture-qa.json`, finalQa, localRoot, 'maplibre_turf_fixture_qa'))

  const executionReport: MapLibreTurfFixtureExecutionReport = {
    ok: initialQa.status === 'passed' && finalQa.status === 'passed',
    phase: '50B',
    runId,
    projectId: 'reeditpro',
    fixture,
    turfCalculations,
    mapLibreManifest,
    planningManifest,
    artifacts,
    qa: finalQa,
    phase50CReadiness: finalQa.status === 'passed' ? 'ready_for_maplibre_local_render_capture_fixture' : 'blocked',
    safety: {
      ...mapLibreTurfFixtureSafetyFlags,
      mapRendered: false,
      tilesDownloaded: false,
      liveTileRequestMade: false,
      geocodingRequestMade: false,
      routingRequestMade: false,
      paidProviderCalled: false,
      playwrightLaunched: false,
      screenshotCaptured: false,
      publicAccessEnabled: false,
    },
    blockers: finalQa.blockers,
    warnings: Array.from(new Set([...finalQa.warnings, ...preflight.warnings])),
  }
  artifacts.push(await uploadJson(mapLibreTurfFixtureConfig.qaBucket, `${artifactPrefix}/reports/phase50b-report.json`, executionReport, localRoot, 'phase50b_report'))
  executionReport.artifacts = artifacts

  const localReportPath = path.join(process.cwd(), MAPLIBRE_TURF_FIXTURE_LOCAL_REPORT_PATH)
  await mkdir(path.dirname(localReportPath), { recursive: true })
  await writeFile(localReportPath, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')
  return { executionReport, localReportPath, iamChanges: ['not_required: active account uploaded generated/private fixture JSON using existing private GCS permissions'] }
}

export async function runMapLibreTurfFixturePreflight() {
  const blockers: string[] = []
  const warnings: string[] = []
  let activeProjectValue = ''
  let publicAccessBlocked = false
  try {
    const [activeAccount, activeProject, projectDescribe, generatedAssetsBucket, qaBucket] = await Promise.all([
      runGcloud(['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']),
      runGcloud(['config', 'get-value', 'project']),
      runGcloud(['projects', 'describe', mapLibreTurfFixtureConfig.projectId, '--format=value(projectId)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${mapLibreTurfFixtureConfig.generatedAssetsBucket}`, '--format=value(name)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${mapLibreTurfFixtureConfig.qaBucket}`, '--format=value(name)']),
    ])
    const activeAccountValue = lastGcloudValue(activeAccount)
    activeProjectValue = lastGcloudValue(activeProject)
    if (!activeAccountValue) blockers.push('No active gcloud account is visible.')
    if (activeProjectValue !== mapLibreTurfFixtureConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
    if (lastGcloudValue(projectDescribe) !== mapLibreTurfFixtureConfig.projectId) blockers.push('gcloud cannot describe project reeditpro.')
    if (lastGcloudValue(generatedAssetsBucket) !== mapLibreTurfFixtureConfig.generatedAssetsBucket) blockers.push('Generated-assets bucket is not reachable.')
    if (lastGcloudValue(qaBucket) !== mapLibreTurfFixtureConfig.qaBucket) blockers.push('QA bucket is not reachable.')
    await assertNoPublicBucketPrincipals([mapLibreTurfFixtureConfig.generatedAssetsBucket, mapLibreTurfFixtureConfig.qaBucket], blockers)
    publicAccessBlocked = !blockers.some((blocker) => blocker.includes('public IAM principal'))
  } catch (error) {
    blockers.push(error instanceof Error ? error.message : String(error))
  }

  const validation = validateMapLibreTurfFixtureExecutionEnv({
    projectId: process.env.GCP_PROJECT_ID,
    activeProject: activeProjectValue,
    region: process.env.GCP_REGION,
    env: process.env.REEDITPRO_ENV,
    confirmation: process.env.REEDITPRO_CONFIRM_MAPLIBRE_TURF_GENERATED_FIXTURE,
    mode: process.env.REEDITPRO_MAPLIBRE_TURF_FIXTURE_MODE ?? mapLibreTurfFixtureConfig.mode,
    tileDownloadAllowed: process.env.TILE_DOWNLOAD_ALLOWED ?? 'false',
    liveTileProviderAllowed: process.env.LIVE_TILE_PROVIDER_ALLOWED ?? 'false',
    geocodingAllowed: process.env.GEOCODING_ALLOWED ?? 'false',
    routingAllowed: process.env.ROUTING_ALLOWED ?? 'false',
    paidMapProviderAllowed: process.env.PAID_MAP_PROVIDER_ALLOWED ?? 'false',
    publicArtifactAllowed: process.env.PUBLIC_ARTIFACT_ALLOWED ?? process.env.PUBLIC_ACCESS_ENABLED ?? 'false',
    mapRenderingAllowed: process.env.MAP_RENDERING_ALLOWED ?? 'false',
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
  }
}

function buildExecutionPlan(runId: string) {
  return {
    runId,
    phase: '50B',
    mode: mapLibreTurfFixtureConfig.mode,
    generatedFixture: true,
    mapLibreBrowserRuntimeAllowed: false,
    mapRenderingAllowed: false,
    tileDownloadAllowed: false,
    liveTileProviderAllowed: false,
    geocodingAllowed: false,
    routingAllowed: false,
    paidMapProviderAllowed: false,
    publicArtifactAllowed: false,
  }
}

async function uploadJson(bucket: string, object: string, payload: unknown, root: string, id: string, kind: MapLibreTurfFixtureArtifact['kind'] = 'private_json'): Promise<MapLibreTurfFixtureArtifact> {
  const filePath = path.join(root, `${id}.json`)
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
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
