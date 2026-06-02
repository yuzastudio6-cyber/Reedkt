import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { mkdir, rm, stat, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { buildReadabilityExtractionArtifactManifest } from './extraction-artifact-manifest-builder'
import { writeGeneratedLocalArticleFixture } from './local-article-fixture-builder'
import { runReadabilityExtractionFromFixture } from './readability-extraction-runner-core'
import {
  makeReadabilityExtractionRunId,
  readabilityExtractionArtifactPrefix,
  readabilityExtractionConfig,
  readabilityExtractionSafetyFlags,
  validateReadabilityExtractionFixtureExecutionEnv,
} from './readability-extraction-policy'
import { buildApprovedReadabilityExtractionPlanSnapshot } from './readability-extraction-plan-snapshot'
import { buildReadabilityExtractionQaSummary } from './readability-extraction-qa-summary'
import { READABILITY_EXTRACTION_LOCAL_REPORT_PATH, readabilityExtractionEvidenceToTypeScript } from './readability-extraction-report-builder'
import { normalizeReadabilityExtraction } from './readability-normalizer'
import { sanitizeReadabilityExtraction } from './readability-sanitizer'
import type {
  ApprovedReadabilityExtractionEvidence,
  ReadabilityExtractionArtifact,
  ReadabilityExtractionExecutionReport,
} from './readability-extraction-types'

const execFileAsync = promisify(execFile)

export async function runReadabilityExtractionFixture(input: { execute: boolean; runId?: string }) {
  if (!input.execute) throw new Error('Pass --execute to run Phase 49D generated/local Readability extraction fixture.')
  const runId = input.runId ?? process.env.REEDITPRO_PHASE49D_RUN_ID ?? makeReadabilityExtractionRunId()
  const artifactPrefix = readabilityExtractionArtifactPrefix(runId)
  const localRoot = path.join(os.tmpdir(), `reeditpro-phase49d-readability-extraction-${runId}`)
  await rm(localRoot, { recursive: true, force: true })
  await mkdir(localRoot, { recursive: true })

  const preflight = await runReadabilityExtractionFixturePreflight()
  const planSnapshot = buildApprovedReadabilityExtractionPlanSnapshot(runId)
  const localFixture = await writeGeneratedLocalArticleFixture(localRoot)
  const artifacts: ReadabilityExtractionArtifact[] = []
  const preflightBlockers = [...preflight.blockers]

  let executionReport: ReadabilityExtractionExecutionReport
  if (!preflight.allowed) {
    const qa = buildReadabilityExtractionQaSummary({
      planSnapshot,
      localFixture,
      artifacts,
      publicAccessBlocked: preflight.publicAccessBlocked,
      preflightBlockers,
    })
    executionReport = blockedReport(runId, planSnapshot, localFixture, artifacts, qa, preflight.warnings)
    await writeBlockedLocalReport(localRoot, executionReport, artifactPrefix, artifacts)
    const evidence = buildEvidence(executionReport)
    return {
      evidence,
      executionReport,
      localReportPath: path.join(process.cwd(), READABILITY_EXTRACTION_LOCAL_REPORT_PATH),
      iamChanges: ['not_applied: preflight failed before Readability extraction'],
      evidenceModule: readabilityExtractionEvidenceToTypeScript(evidence),
    }
  }

  try {
    const rawExtraction = await runReadabilityExtractionFromFixture(localFixture)
    const sanitizedExtraction = sanitizeReadabilityExtraction(rawExtraction)
    const sanitizedExtractionUri = `gs://${readabilityExtractionConfig.generatedAssetsBucket}/${artifactPrefix}/extraction/extracted-article-sanitized.json`
    const textExtractionUri = `gs://${readabilityExtractionConfig.generatedAssetsBucket}/${artifactPrefix}/extraction/extracted-article-text.txt`
    const normalizedRecord = normalizeReadabilityExtraction({
      runId,
      rawExtraction,
      sanitizedExtraction,
      sanitizedHtmlPath: sanitizedExtractionUri,
      textPath: textExtractionUri,
    })
    const extractionMetadata = {
      phase: '49D',
      runId,
      fixtureMode: readabilityExtractionConfig.fixtureMode,
      readabilityVersion: readabilityExtractionConfig.readabilityVersion,
      domImplementation: readabilityExtractionConfig.domImplementation,
      sanitizer: readabilityExtractionConfig.sanitizer,
      normalizedRecord,
      publicWebExtractionUsed: false,
      liveSearchUsed: false,
      paidProviderUsed: false,
      browserCaptureUsed: false,
      screenshotCaptured: false,
      createdAt: new Date().toISOString(),
    }

    artifacts.push(await uploadFile(readabilityExtractionConfig.generatedAssetsBucket, `${artifactPrefix}/plan/approved-extraction-plan-snapshot.json`, await writeJson(localRoot, 'approved_extraction_plan_snapshot', planSnapshot), 'private_json', 'approved_extraction_plan_snapshot'))
    artifacts.push(await uploadFile(readabilityExtractionConfig.generatedAssetsBucket, `${artifactPrefix}/fixture/generated-local-article.html`, localFixture.fixturePath, 'private_html', 'generated_local_article'))
    artifacts.push(await uploadFile(readabilityExtractionConfig.generatedAssetsBucket, `${artifactPrefix}/extraction/extracted-article-raw.json`, await writeJson(localRoot, 'extracted_article_raw', rawExtraction), 'private_json', 'extracted_article_raw'))
    artifacts.push(await uploadFile(readabilityExtractionConfig.generatedAssetsBucket, `${artifactPrefix}/extraction/extracted-article-sanitized.json`, await writeJson(localRoot, 'extracted_article_sanitized', sanitizedExtraction), 'private_json', 'extracted_article_sanitized'))
    artifacts.push(await uploadText(readabilityExtractionConfig.generatedAssetsBucket, `${artifactPrefix}/extraction/extracted-article-text.txt`, sanitizedExtraction.sanitizedText, localRoot, 'extracted_article_text'))
    artifacts.push(await uploadFile(readabilityExtractionConfig.generatedAssetsBucket, `${artifactPrefix}/extraction/extraction-metadata.json`, await writeJson(localRoot, 'extraction_metadata', extractionMetadata), 'private_json', 'extraction_metadata'))

    const manifest = buildReadabilityExtractionArtifactManifest({
      runId,
      artifacts,
      warnings: preflight.warnings,
      blockers: preflightBlockers,
    })
    artifacts.push(await uploadFile(readabilityExtractionConfig.generatedAssetsBucket, `${artifactPrefix}/manifest/extraction-artifact-manifest.json`, await writeJson(localRoot, 'extraction_artifact_manifest', manifest), 'private_json', 'extraction_artifact_manifest'))
    const qa = buildReadabilityExtractionQaSummary({
      planSnapshot,
      localFixture,
      rawExtraction,
      sanitizedExtraction,
      normalizedRecord,
      artifactManifest: manifest,
      artifacts,
      publicAccessBlocked: preflight.publicAccessBlocked,
      preflightBlockers,
    })
    artifacts.push(await uploadFile(readabilityExtractionConfig.qaBucket, `${artifactPrefix}/qa/readability-extraction-qa.json`, await writeJson(localRoot, 'readability_extraction_qa', qa), 'private_json', 'readability_extraction_qa'))

    executionReport = {
      ok: qa.status === 'passed',
      phase: '49D',
      runId,
      projectId: 'reeditpro',
      fixtureMode: readabilityExtractionConfig.fixtureMode,
      planSnapshot,
      localFixture,
      rawExtraction,
      sanitizedExtraction,
      normalizedRecord,
      artifactManifest: manifest,
      artifacts,
      qa,
      phase49EReadiness: qa.status === 'passed' ? 'ready_for_controlled_private_web_search_capture_e2e' : 'blocked',
      safety: {
        ...readabilityExtractionSafetyFlags,
        liveSearchExecuted: false,
        publicWebRequestMade: false,
        publicWebExtractionUsed: false,
        browserLaunched: false,
        screenshotCaptured: false,
        paidProviderCalled: false,
        publicAccessEnabled: false,
      },
      blockers: qa.blockers,
      warnings: Array.from(new Set([...qa.warnings, ...preflight.warnings])),
    }
  } catch (error) {
    const blocker = error instanceof Error ? error.message : String(error)
    const qa = buildReadabilityExtractionQaSummary({
      planSnapshot,
      localFixture,
      artifacts,
      publicAccessBlocked: preflight.publicAccessBlocked,
      preflightBlockers: [...preflightBlockers, blocker],
    })
    try {
      artifacts.push(await uploadFile(readabilityExtractionConfig.generatedAssetsBucket, `${artifactPrefix}/plan/approved-extraction-plan-snapshot.json`, await writeJson(localRoot, 'approved_extraction_plan_snapshot', planSnapshot), 'private_json', 'approved_extraction_plan_snapshot'))
      artifacts.push(await uploadFile(readabilityExtractionConfig.generatedAssetsBucket, `${artifactPrefix}/fixture/generated-local-article.html`, localFixture.fixturePath, 'private_html', 'generated_local_article'))
      artifacts.push(await uploadFile(readabilityExtractionConfig.qaBucket, `${artifactPrefix}/qa/readability-extraction-qa.json`, await writeJson(localRoot, 'readability_extraction_qa', qa), 'private_json', 'readability_extraction_qa'))
    } catch {
      // If GCS access is part of the blocker, keep the local ignored report truthful.
    }
    executionReport = blockedReport(runId, planSnapshot, localFixture, artifacts, qa, preflight.warnings)
  }

  try {
    artifacts.push(await uploadFile(readabilityExtractionConfig.qaBucket, `${artifactPrefix}/reports/phase49d-report.json`, await writeJson(localRoot, 'phase49d_report', executionReport), 'private_json', 'phase49d_report'))
    executionReport.artifacts = artifacts
  } catch {
    // If report upload fails, the local ignored report still records the blocker state.
  }

  const localReportPath = path.join(process.cwd(), READABILITY_EXTRACTION_LOCAL_REPORT_PATH)
  await mkdir(path.dirname(localReportPath), { recursive: true })
  await writeFile(localReportPath, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')

  const evidence = buildEvidence(executionReport)
  return {
    evidence,
    executionReport,
    localReportPath,
    iamChanges: executionReport.ok
      ? ['not_required: active account uploaded generated/local Readability fixture artifacts using existing private GCS permissions']
      : ['not_applied: Phase 49D completed blocked or could not upload all private artifacts'],
    evidenceModule: readabilityExtractionEvidenceToTypeScript(evidence),
  }
}

export async function runReadabilityExtractionFixturePreflight() {
  const blockers: string[] = []
  const warnings: string[] = []
  let activeProjectValue = ''
  let activeAccountValue = ''
  let publicAccessBlocked = false
  try {
    const [activeAccount, activeProject, projectDescribe, generatedAssetsBucket, qaBucket, phase49CManifest, phase49CReport] = await Promise.all([
      runGcloud(['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']),
      runGcloud(['config', 'get-value', 'project']),
      runGcloud(['projects', 'describe', readabilityExtractionConfig.projectId, '--format=value(projectId)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${readabilityExtractionConfig.generatedAssetsBucket}`, '--format=value(name)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${readabilityExtractionConfig.qaBucket}`, '--format=value(name)']),
      runGcloud(['storage', 'objects', 'describe', readabilityExtractionConfig.approvedPhase49CManifestUri, '--format=value(name)']),
      runGcloud(['storage', 'objects', 'describe', readabilityExtractionConfig.approvedPhase49CReportUri, '--format=value(name)']),
    ])
    activeAccountValue = lastGcloudValue(activeAccount)
    activeProjectValue = lastGcloudValue(activeProject)
    if (!activeAccountValue) blockers.push('No active gcloud account is visible.')
    if (activeProjectValue !== readabilityExtractionConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
    if (lastGcloudValue(projectDescribe) !== readabilityExtractionConfig.projectId) blockers.push('gcloud cannot describe project reeditpro.')
    if (lastGcloudValue(generatedAssetsBucket) !== readabilityExtractionConfig.generatedAssetsBucket) blockers.push('Generated-assets bucket is not reachable.')
    if (lastGcloudValue(qaBucket) !== readabilityExtractionConfig.qaBucket) blockers.push('QA bucket is not reachable.')
    if (!lastGcloudValue(phase49CManifest)) blockers.push('Approved Phase 49C manifest is not reachable.')
    if (!lastGcloudValue(phase49CReport)) blockers.push('Approved Phase 49C report is not reachable.')
    await assertNoPublicBucketPrincipals([readabilityExtractionConfig.generatedAssetsBucket, readabilityExtractionConfig.qaBucket], blockers)
    publicAccessBlocked = !blockers.some((blocker) => blocker.includes('public IAM principal'))
  } catch (error) {
    blockers.push(error instanceof Error ? error.message : String(error))
  }

  const validation = validateReadabilityExtractionFixtureExecutionEnv({
    projectId: process.env.GCP_PROJECT_ID,
    activeProject: activeProjectValue,
    region: process.env.GCP_REGION,
    env: process.env.REEDITPRO_ENV,
    confirmation: process.env.REEDITPRO_CONFIRM_READABILITY_EXTRACTION_FIXTURE,
    fixtureMode: process.env.REEDITPRO_READABILITY_EXTRACTION_FIXTURE_MODE ?? readabilityExtractionConfig.fixtureMode,
    liveSearchAllowed: process.env.LIVE_SEARCH_ALLOWED ?? 'false',
    paidProvidersAllowed: process.env.PAID_PROVIDERS_ALLOWED ?? 'false',
    publicWebExtractionAllowed: process.env.PUBLIC_WEB_EXTRACTION_ALLOWED ?? 'false',
    browserCaptureAllowed: process.env.BROWSER_CAPTURE_ALLOWED ?? 'false',
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

async function writeBlockedLocalReport(
  localRoot: string,
  executionReport: ReadabilityExtractionExecutionReport,
  artifactPrefix: string,
  artifacts: ReadabilityExtractionArtifact[],
) {
  try {
    artifacts.push(await uploadFile(readabilityExtractionConfig.qaBucket, `${artifactPrefix}/reports/phase49d-report.json`, await writeJson(localRoot, 'phase49d_report', executionReport), 'private_json', 'phase49d_report'))
    executionReport.artifacts = artifacts
  } catch {
    // If GCS access is part of the blocker, still write the local ignored report.
  }
  const localReportPath = path.join(process.cwd(), READABILITY_EXTRACTION_LOCAL_REPORT_PATH)
  await mkdir(path.dirname(localReportPath), { recursive: true })
  await writeFile(localReportPath, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')
}

function blockedReport(
  runId: string,
  planSnapshot: ReadabilityExtractionExecutionReport['planSnapshot'],
  localFixture: ReadabilityExtractionExecutionReport['localFixture'],
  artifacts: ReadabilityExtractionArtifact[],
  qa: ReadabilityExtractionExecutionReport['qa'],
  warnings: string[],
): ReadabilityExtractionExecutionReport {
  return {
    ok: false,
    phase: '49D',
    runId,
    projectId: 'reeditpro',
    fixtureMode: readabilityExtractionConfig.fixtureMode,
    planSnapshot,
    localFixture,
    artifacts,
    qa,
    phase49EReadiness: 'blocked',
    safety: {
      ...readabilityExtractionSafetyFlags,
      liveSearchExecuted: false,
      publicWebRequestMade: false,
      publicWebExtractionUsed: false,
      browserLaunched: false,
      screenshotCaptured: false,
      paidProviderCalled: false,
      publicAccessEnabled: false,
    },
    blockers: qa.blockers,
    warnings: Array.from(new Set([...qa.warnings, ...warnings])),
  }
}

async function uploadText(bucket: string, object: string, text: string, root: string, id: string): Promise<ReadabilityExtractionArtifact> {
  const filePath = path.join(root, `${id}.txt`)
  await writeFile(filePath, `${text}\n`, 'utf8')
  return uploadFile(bucket, object, filePath, 'private_text', id)
}

async function writeJson(root: string, id: string, payload: unknown): Promise<string> {
  const filePath = path.join(root, `${id}.json`)
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  return filePath
}

async function uploadFile(bucket: string, object: string, filePath: string, kind: ReadabilityExtractionArtifact['kind'], id: string): Promise<ReadabilityExtractionArtifact> {
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

function buildEvidence(executionReport: ReadabilityExtractionExecutionReport): ApprovedReadabilityExtractionEvidence {
  const artifactUri = (id: string) => executionReport.artifacts.find((artifact) => artifact.id === id)?.gcsUri
  return {
    phase: '49D',
    status: executionReport.ok ? 'completed' : 'blocked',
    runId: executionReport.runId,
    fixtureMode: readabilityExtractionConfig.fixtureMode,
    localFixtureDescription: 'Generated local article fixture parsed through Mozilla Readability and jsdom; no public web extraction.',
    rawExtractionUri: artifactUri('extracted_article_raw'),
    sanitizedExtractionUri: artifactUri('extracted_article_sanitized'),
    textExtractionUri: artifactUri('extracted_article_text'),
    extractionMetadataUri: artifactUri('extraction_metadata'),
    extractionManifestUri: artifactUri('extraction_artifact_manifest'),
    qaReportUri: artifactUri('readability_extraction_qa'),
    phase49dReportUri: artifactUri('phase49d_report'),
    phase49EReadiness: executionReport.phase49EReadiness,
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
