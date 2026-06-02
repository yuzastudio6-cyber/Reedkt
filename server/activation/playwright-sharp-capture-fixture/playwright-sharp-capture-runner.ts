import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { mkdir, rm, stat, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { buildCaptureArtifactManifest } from './capture-artifact-manifest-builder'
import { writeGeneratedLocalHtmlFixture } from './local-html-fixture-builder'
import { runPlaywrightLocalFixtureCapture } from './playwright-capture-runner'
import {
  makePlaywrightSharpCaptureRunId,
  playwrightSharpCaptureArtifactPrefix,
  playwrightSharpCaptureConfig,
  playwrightSharpCaptureSafetyFlags,
  validatePlaywrightSharpCaptureFixtureExecutionEnv,
} from './playwright-sharp-capture-policy'
import { buildApprovedPlaywrightSharpCapturePlanSnapshot } from './playwright-sharp-capture-plan-snapshot'
import { buildPlaywrightSharpCaptureQaSummary } from './playwright-sharp-capture-qa-summary'
import { PLAYWRIGHT_SHARP_CAPTURE_LOCAL_REPORT_PATH, playwrightSharpCaptureEvidenceToTypeScript } from './playwright-sharp-capture-report-builder'
import { runSharpScreenshotPostprocess } from './sharp-postprocess-runner'
import type {
  ApprovedPlaywrightSharpCaptureEvidence,
  PlaywrightSharpCaptureArtifact,
  PlaywrightSharpCaptureExecutionReport,
} from './playwright-sharp-capture-types'

const execFileAsync = promisify(execFile)

export async function runPlaywrightSharpCaptureFixture(input: { execute: boolean; runId?: string }) {
  if (!input.execute) throw new Error('Pass --execute to run Phase 49C generated/local Playwright + Sharp capture fixture.')
  const runId = input.runId ?? process.env.REEDITPRO_PHASE49C_RUN_ID ?? makePlaywrightSharpCaptureRunId()
  const artifactPrefix = playwrightSharpCaptureArtifactPrefix(runId)
  const localRoot = path.join(os.tmpdir(), `reeditpro-phase49c-playwright-sharp-capture-${runId}`)
  await rm(localRoot, { recursive: true, force: true })
  await mkdir(localRoot, { recursive: true })

  const preflight = await runPlaywrightSharpCaptureFixturePreflight()
  const planSnapshot = buildApprovedPlaywrightSharpCapturePlanSnapshot(runId)
  const localFixture = await writeGeneratedLocalHtmlFixture(localRoot)
  const artifacts: PlaywrightSharpCaptureArtifact[] = []
  const preflightBlockers = [...preflight.blockers]

  let executionReport: PlaywrightSharpCaptureExecutionReport
  if (!preflight.allowed) {
    const qa = buildPlaywrightSharpCaptureQaSummary({
      planSnapshot,
      localFixture,
      artifacts,
      publicAccessBlocked: preflight.publicAccessBlocked,
      preflightBlockers,
    })
    try {
      artifacts.push(await uploadFile(playwrightSharpCaptureConfig.generatedAssetsBucket, `${artifactPrefix}/plan/approved-capture-plan-snapshot.json`, await writeJson(localRoot, 'approved_capture_plan_snapshot', planSnapshot), 'private_json', 'approved_capture_plan_snapshot'))
      artifacts.push(await uploadFile(playwrightSharpCaptureConfig.generatedAssetsBucket, `${artifactPrefix}/fixture/generated-local-page.html`, localFixture.fixturePath, 'private_html', 'generated_local_page'))
      artifacts.push(await uploadFile(playwrightSharpCaptureConfig.qaBucket, `${artifactPrefix}/qa/playwright-sharp-capture-qa.json`, await writeJson(localRoot, 'playwright_sharp_capture_qa', qa), 'private_json', 'playwright_sharp_capture_qa'))
    } catch {
      // Preflight can fail because GCS is inaccessible; keep the local report truthful and non-capturing.
    }
    executionReport = {
      ok: false,
      phase: '49C',
      runId,
      projectId: 'reeditpro',
      fixtureMode: playwrightSharpCaptureConfig.fixtureMode,
      planSnapshot,
      localFixture,
      artifacts,
      qa,
      phase49DReadiness: 'blocked',
      safety: {
        ...playwrightSharpCaptureSafetyFlags,
        liveSearchExecuted: false,
        publicWebRequestMade: false,
        publicBrowserCaptureUsed: false,
        paidProviderCalled: false,
        readabilityExtractionRun: false,
        publicAccessEnabled: false,
      },
      blockers: qa.blockers,
      warnings: Array.from(new Set([...qa.warnings, ...preflight.warnings])),
    }
    await writeBlockedLocalReport(localRoot, executionReport, artifactPrefix, artifacts)
    const evidence = buildEvidence(executionReport, artifactPrefix)
    return {
      evidence,
      executionReport,
      localReportPath: path.join(process.cwd(), PLAYWRIGHT_SHARP_CAPTURE_LOCAL_REPORT_PATH),
      iamChanges: ['not_applied: preflight failed before browser capture or Sharp processing'],
      evidenceModule: playwrightSharpCaptureEvidenceToTypeScript(evidence),
    }
  }

  try {
    const playwrightCapture = await runPlaywrightLocalFixtureCapture({ localFixture, outputRoot: localRoot })
    const sharpProcessing = await runSharpScreenshotPostprocess({
      screenshotPath: playwrightCapture.screenshotPath,
      outputRoot: localRoot,
    })

    artifacts.push(await uploadFile(playwrightSharpCaptureConfig.generatedAssetsBucket, `${artifactPrefix}/plan/approved-capture-plan-snapshot.json`, await writeJson(localRoot, 'approved_capture_plan_snapshot', planSnapshot), 'private_json', 'approved_capture_plan_snapshot'))
    artifacts.push(await uploadFile(playwrightSharpCaptureConfig.generatedAssetsBucket, `${artifactPrefix}/fixture/generated-local-page.html`, localFixture.fixturePath, 'private_html', 'generated_local_page'))
    artifacts.push(await uploadFile(playwrightSharpCaptureConfig.generatedAssetsBucket, `${artifactPrefix}/capture/playwright-page-metadata.json`, await writeJson(localRoot, 'playwright_page_metadata', playwrightCapture), 'private_json', 'playwright_page_metadata'))
    artifacts.push(await uploadFile(playwrightSharpCaptureConfig.generatedAssetsBucket, `${artifactPrefix}/capture/screenshot-original.png`, playwrightCapture.screenshotPath, 'private_png', 'screenshot_original'))
    artifacts.push(await uploadFile(playwrightSharpCaptureConfig.generatedAssetsBucket, `${artifactPrefix}/processed/screenshot-preview.png`, sharpProcessing.preview.path, 'private_png', 'screenshot_preview'))
    artifacts.push(await uploadFile(playwrightSharpCaptureConfig.generatedAssetsBucket, `${artifactPrefix}/processed/screenshot-thumbnail.png`, sharpProcessing.thumbnail.path, 'private_png', 'screenshot_thumbnail'))
    artifacts.push(await uploadFile(playwrightSharpCaptureConfig.generatedAssetsBucket, `${artifactPrefix}/processed/sharp-image-metadata.json`, await writeJson(localRoot, 'sharp_image_metadata', sharpProcessing), 'private_json', 'sharp_image_metadata'))

    const manifest = buildCaptureArtifactManifest({
      runId,
      playwrightCapture,
      sharpProcessing,
      artifacts,
      warnings: preflight.warnings,
      blockers: preflightBlockers,
    })
    artifacts.push(await uploadFile(playwrightSharpCaptureConfig.generatedAssetsBucket, `${artifactPrefix}/manifest/capture-artifact-manifest.json`, await writeJson(localRoot, 'capture_artifact_manifest', manifest), 'private_json', 'capture_artifact_manifest'))
    const qa = buildPlaywrightSharpCaptureQaSummary({
      planSnapshot,
      localFixture,
      playwrightCapture,
      sharpProcessing,
      artifactManifest: manifest,
      artifacts,
      publicAccessBlocked: preflight.publicAccessBlocked,
      preflightBlockers,
    })
    artifacts.push(await uploadFile(playwrightSharpCaptureConfig.qaBucket, `${artifactPrefix}/qa/playwright-sharp-capture-qa.json`, await writeJson(localRoot, 'playwright_sharp_capture_qa', qa), 'private_json', 'playwright_sharp_capture_qa'))

    executionReport = {
      ok: qa.status === 'passed',
      phase: '49C',
      runId,
      projectId: 'reeditpro',
      fixtureMode: playwrightSharpCaptureConfig.fixtureMode,
      planSnapshot,
      localFixture,
      playwrightCapture,
      sharpProcessing,
      artifactManifest: manifest,
      artifacts,
      qa,
      phase49DReadiness: qa.status === 'passed' ? 'ready_for_readability_extraction_fixture' : 'blocked',
      safety: {
        ...playwrightSharpCaptureSafetyFlags,
        liveSearchExecuted: false,
        publicWebRequestMade: false,
        publicBrowserCaptureUsed: false,
        paidProviderCalled: false,
        readabilityExtractionRun: false,
        publicAccessEnabled: false,
      },
      blockers: qa.blockers,
      warnings: Array.from(new Set([...qa.warnings, ...preflight.warnings])),
    }
  } catch (error) {
    const blocker = error instanceof Error ? error.message : String(error)
    const qa = buildPlaywrightSharpCaptureQaSummary({
      planSnapshot,
      localFixture,
      artifacts,
      publicAccessBlocked: preflight.publicAccessBlocked,
      preflightBlockers: [...preflightBlockers, blocker],
    })
    artifacts.push(await uploadFile(playwrightSharpCaptureConfig.generatedAssetsBucket, `${artifactPrefix}/plan/approved-capture-plan-snapshot.json`, await writeJson(localRoot, 'approved_capture_plan_snapshot', planSnapshot), 'private_json', 'approved_capture_plan_snapshot'))
    artifacts.push(await uploadFile(playwrightSharpCaptureConfig.generatedAssetsBucket, `${artifactPrefix}/fixture/generated-local-page.html`, localFixture.fixturePath, 'private_html', 'generated_local_page'))
    artifacts.push(await uploadFile(playwrightSharpCaptureConfig.qaBucket, `${artifactPrefix}/qa/playwright-sharp-capture-qa.json`, await writeJson(localRoot, 'playwright_sharp_capture_qa', qa), 'private_json', 'playwright_sharp_capture_qa'))
    executionReport = {
      ok: false,
      phase: '49C',
      runId,
      projectId: 'reeditpro',
      fixtureMode: playwrightSharpCaptureConfig.fixtureMode,
      planSnapshot,
      localFixture,
      artifacts,
      qa,
      phase49DReadiness: 'blocked',
      safety: {
        ...playwrightSharpCaptureSafetyFlags,
        liveSearchExecuted: false,
        publicWebRequestMade: false,
        publicBrowserCaptureUsed: false,
        paidProviderCalled: false,
        readabilityExtractionRun: false,
        publicAccessEnabled: false,
      },
      blockers: qa.blockers,
      warnings: Array.from(new Set([...qa.warnings, ...preflight.warnings])),
    }
  }

  artifacts.push(await uploadFile(playwrightSharpCaptureConfig.qaBucket, `${artifactPrefix}/reports/phase49c-report.json`, await writeJson(localRoot, 'phase49c_report', executionReport), 'private_json', 'phase49c_report'))
  executionReport.artifacts = artifacts

  const localReportPath = path.join(process.cwd(), PLAYWRIGHT_SHARP_CAPTURE_LOCAL_REPORT_PATH)
  await mkdir(path.dirname(localReportPath), { recursive: true })
  await writeFile(localReportPath, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')

  const evidence = buildEvidence(executionReport, artifactPrefix)
  return {
    evidence,
    executionReport,
    localReportPath,
    iamChanges: ['not_required: active account uploaded generated/local capture fixture artifacts using existing private GCS permissions'],
    evidenceModule: playwrightSharpCaptureEvidenceToTypeScript(evidence),
  }
}

async function writeBlockedLocalReport(
  localRoot: string,
  executionReport: PlaywrightSharpCaptureExecutionReport,
  artifactPrefix: string,
  artifacts: PlaywrightSharpCaptureArtifact[],
) {
  try {
    artifacts.push(await uploadFile(playwrightSharpCaptureConfig.qaBucket, `${artifactPrefix}/reports/phase49c-report.json`, await writeJson(localRoot, 'phase49c_report', executionReport), 'private_json', 'phase49c_report'))
    executionReport.artifacts = artifacts
  } catch {
    // If GCS access is part of the blocker, still write the local ignored report.
  }
  const localReportPath = path.join(process.cwd(), PLAYWRIGHT_SHARP_CAPTURE_LOCAL_REPORT_PATH)
  await mkdir(path.dirname(localReportPath), { recursive: true })
  await writeFile(localReportPath, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')
}

export async function runPlaywrightSharpCaptureFixturePreflight() {
  const blockers: string[] = []
  const warnings: string[] = []
  let activeProjectValue = ''
  let activeAccountValue = ''
  let publicAccessBlocked = false
  try {
    const [activeAccount, activeProject, projectDescribe, generatedAssetsBucket, qaBucket, phase49BManifest] = await Promise.all([
      runGcloud(['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']),
      runGcloud(['config', 'get-value', 'project']),
      runGcloud(['projects', 'describe', playwrightSharpCaptureConfig.projectId, '--format=value(projectId)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${playwrightSharpCaptureConfig.generatedAssetsBucket}`, '--format=value(name)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${playwrightSharpCaptureConfig.qaBucket}`, '--format=value(name)']),
      runGcloud(['storage', 'objects', 'describe', playwrightSharpCaptureConfig.approvedPhase49BSourceManifestUri, '--format=value(name)']),
    ])
    activeAccountValue = lastGcloudValue(activeAccount)
    activeProjectValue = lastGcloudValue(activeProject)
    if (!activeAccountValue) blockers.push('No active gcloud account is visible.')
    if (activeProjectValue !== playwrightSharpCaptureConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
    if (lastGcloudValue(projectDescribe) !== playwrightSharpCaptureConfig.projectId) blockers.push('gcloud cannot describe project reeditpro.')
    if (lastGcloudValue(generatedAssetsBucket) !== playwrightSharpCaptureConfig.generatedAssetsBucket) blockers.push('Generated-assets bucket is not reachable.')
    if (lastGcloudValue(qaBucket) !== playwrightSharpCaptureConfig.qaBucket) blockers.push('QA bucket is not reachable.')
    if (!lastGcloudValue(phase49BManifest)) blockers.push('Approved Phase 49B source manifest is not reachable.')
    await assertNoPublicBucketPrincipals([playwrightSharpCaptureConfig.generatedAssetsBucket, playwrightSharpCaptureConfig.qaBucket], blockers)
    publicAccessBlocked = !blockers.some((blocker) => blocker.includes('public IAM principal'))
  } catch (error) {
    blockers.push(error instanceof Error ? error.message : String(error))
  }

  const validation = validatePlaywrightSharpCaptureFixtureExecutionEnv({
    projectId: process.env.GCP_PROJECT_ID,
    activeProject: activeProjectValue,
    region: process.env.GCP_REGION,
    env: process.env.REEDITPRO_ENV,
    confirmation: process.env.REEDITPRO_CONFIRM_PLAYWRIGHT_SHARP_CAPTURE_FIXTURE,
    fixtureMode: process.env.REEDITPRO_PLAYWRIGHT_SHARP_CAPTURE_FIXTURE_MODE ?? playwrightSharpCaptureConfig.fixtureMode,
    liveSearchAllowed: process.env.LIVE_SEARCH_ALLOWED ?? 'false',
    paidProvidersAllowed: process.env.PAID_PROVIDERS_ALLOWED ?? 'false',
    publicWebCaptureAllowed: process.env.PUBLIC_WEB_CAPTURE_ALLOWED ?? 'false',
    readabilityExtractionAllowed: process.env.READABILITY_EXTRACTION_ALLOWED ?? 'false',
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
    activeAccount: activeAccountValue,
    activeProject: activeProjectValue,
    publicAccessBlocked,
  }
}

async function writeJson(root: string, id: string, payload: unknown): Promise<string> {
  const filePath = path.join(root, `${id}.json`)
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  return filePath
}

async function uploadFile(bucket: string, object: string, filePath: string, kind: PlaywrightSharpCaptureArtifact['kind'], id: string): Promise<PlaywrightSharpCaptureArtifact> {
  const stats = await stat(filePath)
  const sha256 = sha256File(filePath)
  await runCommand('gcloud', ['storage', 'cp', filePath, `gs://${bucket}/${object}`])
  return {
    id,
    kind,
    bucket,
    object,
    gcsUri: `gs://${bucket}/${object}`,
    sizeBytes: stats.size,
    sha256,
  }
}

function buildEvidence(executionReport: PlaywrightSharpCaptureExecutionReport, artifactPrefix: string): ApprovedPlaywrightSharpCaptureEvidence {
  return {
    phase: '49C',
    status: executionReport.ok ? 'completed' : 'blocked',
    runId: executionReport.runId,
    fixtureMode: playwrightSharpCaptureConfig.fixtureMode,
    localFixtureDescription: 'Generated local HTML page rendered through file:// only; no public web capture.',
    playwrightBrowser: executionReport.playwrightCapture?.browser,
    viewport: executionReport.playwrightCapture?.viewport,
    originalScreenshotUri: executionReport.playwrightCapture ? `gs://${playwrightSharpCaptureConfig.generatedAssetsBucket}/${artifactPrefix}/capture/screenshot-original.png` : undefined,
    previewScreenshotUri: executionReport.sharpProcessing ? `gs://${playwrightSharpCaptureConfig.generatedAssetsBucket}/${artifactPrefix}/processed/screenshot-preview.png` : undefined,
    thumbnailScreenshotUri: executionReport.sharpProcessing ? `gs://${playwrightSharpCaptureConfig.generatedAssetsBucket}/${artifactPrefix}/processed/screenshot-thumbnail.png` : undefined,
    captureManifestUri: executionReport.artifactManifest ? `gs://${playwrightSharpCaptureConfig.generatedAssetsBucket}/${artifactPrefix}/manifest/capture-artifact-manifest.json` : undefined,
    qaReportUri: `gs://${playwrightSharpCaptureConfig.qaBucket}/${artifactPrefix}/qa/playwright-sharp-capture-qa.json`,
    phase49cReportUri: `gs://${playwrightSharpCaptureConfig.qaBucket}/${artifactPrefix}/reports/phase49c-report.json`,
    phase49DReadiness: executionReport.phase49DReadiness,
    blockers: executionReport.ok ? [] : executionReport.blockers,
    warnings: executionReport.warnings,
  }
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

function sha256File(filePath: string): string {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex')
}

function lastGcloudValue(output: string): string {
  const lines = output.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith('WARNING:') && !line.includes('Python 3.9.x'))
  return lines.at(-1) ?? ''
}
