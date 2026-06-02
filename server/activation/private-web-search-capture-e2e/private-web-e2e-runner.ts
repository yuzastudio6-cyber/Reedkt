import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { mkdir, rm, stat, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { buildPrivateFixtureSearchResponse } from './private-fixture-search-service'
import { writePrivateFixturePages } from './private-page-fixture-builder'
import { runPrivateFixturePageCapture } from './private-capture-runner'
import { runPrivateReadabilityExtraction } from './private-readability-extraction-runner'
import { normalizePrivateSearchResults } from './private-search-result-normalizer'
import { resolvePrivateSearchProvider } from './private-search-provider-resolver'
import { validatePrivateSearxngContract } from './private-searxng-contract'
import {
  makePrivateWebE2ERunId,
  privateWebE2EArtifactPrefix,
  privateWebE2EConfig,
  privateWebE2ESafetyFlags,
  validatePrivateWebSearchCaptureE2EExecutionEnv,
} from './private-web-search-capture-e2e-policy'
import { buildPrivateWebE2EPlanSnapshot } from './private-web-e2e-plan-snapshot'
import { buildPrivateWebE2EManifest } from './private-web-e2e-manifest-builder'
import { buildPrivateWebE2EQaSummary } from './private-web-e2e-qa-summary'
import { PRIVATE_WEB_E2E_LOCAL_REPORT_PATH, privateWebE2EEvidenceToTypeScript } from './private-web-e2e-report-builder'
import { runPrivateSharpPostprocess } from './private-sharp-postprocess-runner'
import type {
  ApprovedPrivateWebE2EEvidence,
  PrivateWebE2EArtifact,
  PrivateWebE2EExecutionReport,
  PrivateWebE2EQaSummary,
  PrivateWebSearchProviderMode,
} from './private-web-search-capture-e2e-types'

const execFileAsync = promisify(execFile)

export async function runPrivateWebSearchCaptureE2E(input: { execute: boolean; runId?: string }) {
  if (!input.execute) throw new Error('Pass --execute to run Phase 49E controlled private web search/capture E2E.')
  const runId = input.runId ?? process.env.REEDITPRO_PHASE49E_RUN_ID ?? makePrivateWebE2ERunId()
  const artifactPrefix = privateWebE2EArtifactPrefix(runId)
  const localRoot = path.join(os.tmpdir(), `reeditpro-phase49e-private-web-e2e-${runId}`)
  await rm(localRoot, { recursive: true, force: true })
  await mkdir(localRoot, { recursive: true })

  const providerResolution = resolvePrivateSearchProvider({ endpoint: process.env.REEDITPRO_SEARXNG_PRIVATE_ENDPOINT })
  const providerMode = providerResolution.providerMode
  const preflight = await runPrivateWebE2EPreflight(providerMode)
  const planSnapshot = buildPrivateWebE2EPlanSnapshot({ runId, providerMode })
  const fixturePages = await writePrivateFixturePages(localRoot)
  const searchResponse = buildPrivateFixtureSearchResponse({ providerMode, pages: fixturePages })
  const contractBlockers = validatePrivateSearxngContract(searchResponse)
  const normalization = normalizePrivateSearchResults({ runId, response: searchResponse })
  const preflightBlockers = [
    ...providerResolution.blockers,
    ...preflight.blockers,
    ...contractBlockers,
    ...normalization.blockers,
  ]
  const artifacts: PrivateWebE2EArtifact[] = []

  if (!preflight.allowed || preflightBlockers.length) {
    const qa = buildPrivateWebE2EQaSummary({
      planSnapshot,
      searchResponse,
      normalizedSources: normalization.sources,
      sourceManifest: normalization.manifest,
      fixturePages,
      artifacts,
      publicAccessBlocked: preflight.publicAccessBlocked,
      preflightBlockers,
    })
    const executionReport = blockedReport(runId, providerMode, planSnapshot, searchResponse, normalization.sources, normalization.manifest, fixturePages, artifacts, qa, [...providerResolution.warnings, ...preflight.warnings, ...normalization.warnings])
    await writeLocalReport(executionReport)
    const evidence = buildEvidence(executionReport, artifactPrefix)
    return {
      evidence,
      executionReport,
      localReportPath: path.join(process.cwd(), PRIVATE_WEB_E2E_LOCAL_REPORT_PATH),
      iamChanges: ['not_applied: Phase 49E preflight failed before controlled private E2E capture/extraction upload'],
      evidenceModule: privateWebE2EEvidenceToTypeScript(evidence),
    }
  }

  const captures = []
  const sharpProcessing = []
  const extractions = []

  artifacts.push(await uploadFile(privateWebE2EConfig.generatedAssetsBucket, `${artifactPrefix}/plan/approved-web-e2e-plan-snapshot.json`, await writeJson(localRoot, 'approved_web_e2e_plan_snapshot', planSnapshot), 'private_json', 'approved_web_e2e_plan_snapshot'))
  artifacts.push(await uploadFile(privateWebE2EConfig.generatedAssetsBucket, `${artifactPrefix}/search/private-search-response.json`, await writeJson(localRoot, 'private_search_response', searchResponse), 'private_json', 'private_search_response'))
  artifacts.push(await uploadFile(privateWebE2EConfig.generatedAssetsBucket, `${artifactPrefix}/search/normalized-search-results.json`, await writeJson(localRoot, 'normalized_search_results', normalization.sources), 'private_json', 'normalized_search_results'))
  artifacts.push(await uploadFile(privateWebE2EConfig.generatedAssetsBucket, `${artifactPrefix}/sources/source-manifest.json`, await writeJson(localRoot, 'source_manifest', normalization.manifest), 'private_json', 'source_manifest'))

  for (const page of fixturePages) {
    artifacts.push(await uploadFile(privateWebE2EConfig.generatedAssetsBucket, `${artifactPrefix}/fixtures/pages/page-${page.sourceId.split('-')[1]}.html`, page.fixturePath, 'private_html', `${page.sourceId}_fixture_page`))
    const capture = await runPrivateFixturePageCapture({ page, outputRoot: localRoot })
    captures.push(capture)
    const sharpResult = await runPrivateSharpPostprocess({ capture, outputRoot: localRoot })
    sharpProcessing.push(sharpResult)
    const sourcePrefix = `${artifactPrefix}/captures/${page.sourceId}`
    artifacts.push(await uploadFile(privateWebE2EConfig.generatedAssetsBucket, `${sourcePrefix}/screenshot-original.png`, capture.screenshotPath, 'private_png', `${page.sourceId}_screenshot_original`))
    artifacts.push(await uploadFile(privateWebE2EConfig.generatedAssetsBucket, `${sourcePrefix}/screenshot-preview.png`, sharpResult.preview.path, 'private_png', `${page.sourceId}_screenshot_preview`))
    artifacts.push(await uploadFile(privateWebE2EConfig.generatedAssetsBucket, `${sourcePrefix}/screenshot-thumbnail.png`, sharpResult.thumbnail.path, 'private_png', `${page.sourceId}_screenshot_thumbnail`))
    artifacts.push(await uploadFile(privateWebE2EConfig.generatedAssetsBucket, `${sourcePrefix}/capture-metadata.json`, await writeJson(localRoot, `${page.sourceId}_capture_metadata`, capture), 'private_json', `${page.sourceId}_capture_metadata`))
    const sanitizedUri = `gs://${privateWebE2EConfig.generatedAssetsBucket}/${artifactPrefix}/extraction/${page.sourceId}/extracted-article-sanitized.json`
    const textUri = `gs://${privateWebE2EConfig.generatedAssetsBucket}/${artifactPrefix}/extraction/${page.sourceId}/extracted-article-text.txt`
    const extraction = await runPrivateReadabilityExtraction({ page, sanitizedHtmlPath: sanitizedUri, textPath: textUri })
    extractions.push(extraction.normalized)
    artifacts.push(await uploadFile(privateWebE2EConfig.generatedAssetsBucket, `${artifactPrefix}/extraction/${page.sourceId}/extracted-article-sanitized.json`, await writeJson(localRoot, `${page.sourceId}_extracted_article_sanitized`, extraction.sanitized), 'private_json', `${page.sourceId}_extracted_article_sanitized`))
    artifacts.push(await uploadText(privateWebE2EConfig.generatedAssetsBucket, `${artifactPrefix}/extraction/${page.sourceId}/extracted-article-text.txt`, extraction.sanitized.sanitizedText, localRoot, `${page.sourceId}_extracted_article_text`))
    artifacts.push(await uploadFile(privateWebE2EConfig.generatedAssetsBucket, `${artifactPrefix}/extraction/${page.sourceId}/extraction-metadata.json`, await writeJson(localRoot, `${page.sourceId}_extraction_metadata`, {
      phase: '49E',
      runId,
      sourceId: page.sourceId,
      raw: extraction.raw,
      normalized: extraction.normalized,
      publicWebExtractionUsed: false,
      liveSearchUsed: false,
      paidProviderUsed: false,
      createdAt: new Date().toISOString(),
    }), 'private_json', `${page.sourceId}_extraction_metadata`))
  }

  const manifest = buildPrivateWebE2EManifest({
    runId,
    providerMode,
    sources: normalization.sources,
    fixturePages,
    captures,
    sharpProcessing,
    extractions,
    artifacts,
    warnings: [...providerResolution.warnings, ...preflight.warnings, ...normalization.warnings],
    blockers: [],
  })
  artifacts.push(await uploadFile(privateWebE2EConfig.generatedAssetsBucket, `${artifactPrefix}/manifest/private-web-search-capture-e2e-manifest.json`, await writeJson(localRoot, 'private_web_search_capture_e2e_manifest', manifest), 'private_json', 'private_web_search_capture_e2e_manifest'))
  const qa = buildPrivateWebE2EQaSummary({
    planSnapshot,
    searchResponse,
    normalizedSources: normalization.sources,
    sourceManifest: normalization.manifest,
    fixturePages,
    captures,
    sharpProcessing,
    extractions,
    manifest,
    artifacts,
    publicAccessBlocked: preflight.publicAccessBlocked,
  })
  artifacts.push(await uploadFile(privateWebE2EConfig.qaBucket, `${artifactPrefix}/qa/private-web-search-capture-e2e-qa.json`, await writeJson(localRoot, 'private_web_search_capture_e2e_qa', qa), 'private_json', 'private_web_search_capture_e2e_qa'))
  const executionReport: PrivateWebE2EExecutionReport = {
    ok: qa.status === 'passed',
    phase: '49E',
    runId,
    projectId: 'reeditpro',
    mode: privateWebE2EConfig.mode,
    providerMode,
    query: privateWebE2EConfig.query,
    planSnapshot,
    searchResponse,
    normalizedSources: normalization.sources,
    sourceManifest: normalization.manifest,
    fixturePages,
    captures,
    sharpProcessing,
    extractions,
    manifest,
    artifacts,
    qa,
    phase49FReadiness: qa.status === 'passed' ? 'ready_for_web_search_capture_internal_readiness_gate' : 'blocked',
    safety: {
      ...privateWebE2ESafetyFlags,
      livePublicSearchExecuted: false,
      publicWebRequestMade: false,
      publicWebCaptureUsed: false,
      arbitraryUrlCaptureUsed: false,
      paidProviderCalled: false,
      publicAccessEnabled: false,
    },
    blockers: qa.blockers,
    warnings: Array.from(new Set([...qa.warnings, ...providerResolution.warnings, ...preflight.warnings, ...normalization.warnings])),
  }
  artifacts.push(await uploadFile(privateWebE2EConfig.qaBucket, `${artifactPrefix}/reports/phase49e-report.json`, await writeJson(localRoot, 'phase49e_report', executionReport), 'private_json', 'phase49e_report'))
  executionReport.artifacts = artifacts
  await writeLocalReport(executionReport)
  const evidence = buildEvidence(executionReport, artifactPrefix)
  return {
    evidence,
    executionReport,
    localReportPath: path.join(process.cwd(), PRIVATE_WEB_E2E_LOCAL_REPORT_PATH),
    iamChanges: ['not_required: active account uploaded controlled private web E2E artifacts using existing private GCS permissions'],
    evidenceModule: privateWebE2EEvidenceToTypeScript(evidence),
  }
}

export async function runPrivateWebE2EPreflight(providerMode: PrivateWebSearchProviderMode) {
  const blockers: string[] = []
  const warnings: string[] = []
  let activeProjectValue = ''
  let activeAccountValue = ''
  let publicAccessBlocked = false
  try {
    const [activeAccount, activeProject, projectDescribe, generatedAssetsBucket, qaBucket, phase49DReport] = await Promise.all([
      runGcloud(['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']),
      runGcloud(['config', 'get-value', 'project']),
      runGcloud(['projects', 'describe', privateWebE2EConfig.projectId, '--format=value(projectId)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${privateWebE2EConfig.generatedAssetsBucket}`, '--format=value(name)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${privateWebE2EConfig.qaBucket}`, '--format=value(name)']),
      runGcloud(['storage', 'objects', 'describe', privateWebE2EConfig.approvedPhase49DReportUri, '--format=value(name)']),
    ])
    activeAccountValue = firstGcloudValue(activeAccount)
    activeProjectValue = firstGcloudValue(activeProject)
    if (!activeAccountValue) blockers.push('No active gcloud account is visible.')
    if (activeProjectValue !== privateWebE2EConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
    if (firstGcloudValue(projectDescribe) !== privateWebE2EConfig.projectId) blockers.push('gcloud cannot describe project reeditpro.')
    if (firstGcloudValue(generatedAssetsBucket) !== privateWebE2EConfig.generatedAssetsBucket) blockers.push('Generated-assets bucket is not reachable.')
    if (firstGcloudValue(qaBucket) !== privateWebE2EConfig.qaBucket) blockers.push('QA bucket is not reachable.')
    if (!firstGcloudValue(phase49DReport)) blockers.push('Approved Phase 49D report is not reachable.')
    await assertNoPublicBucketPrincipals([privateWebE2EConfig.generatedAssetsBucket, privateWebE2EConfig.qaBucket], blockers)
    publicAccessBlocked = !blockers.some((blocker) => blocker.includes('public IAM principal'))
  } catch (error) {
    blockers.push(error instanceof Error ? error.message : String(error))
  }
  const validation = validatePrivateWebSearchCaptureE2EExecutionEnv({
    projectId: process.env.GCP_PROJECT_ID,
    activeProject: activeProjectValue,
    region: process.env.GCP_REGION,
    env: process.env.REEDITPRO_ENV,
    confirmation: process.env.REEDITPRO_CONFIRM_PRIVATE_WEB_SEARCH_CAPTURE_E2E,
    mode: process.env.REEDITPRO_PRIVATE_WEB_SEARCH_CAPTURE_E2E_MODE ?? privateWebE2EConfig.mode,
    providerMode,
    paidProvidersAllowed: process.env.PAID_PROVIDERS_ALLOWED ?? 'false',
    livePublicSearchAllowed: process.env.LIVE_PUBLIC_SEARCH_ALLOWED ?? 'false',
    publicWebCaptureAllowed: process.env.PUBLIC_WEB_CAPTURE_ALLOWED ?? 'false',
    arbitraryUrlCaptureAllowed: process.env.ARBITRARY_URL_CAPTURE_ALLOWED ?? 'false',
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

function blockedReport(
  runId: string,
  providerMode: PrivateWebSearchProviderMode,
  planSnapshot: PrivateWebE2EExecutionReport['planSnapshot'],
  searchResponse: PrivateWebE2EExecutionReport['searchResponse'],
  normalizedSources: PrivateWebE2EExecutionReport['normalizedSources'],
  sourceManifest: PrivateWebE2EExecutionReport['sourceManifest'],
  fixturePages: PrivateWebE2EExecutionReport['fixturePages'],
  artifacts: PrivateWebE2EArtifact[],
  qa: PrivateWebE2EQaSummary,
  warnings: string[],
): PrivateWebE2EExecutionReport {
  return {
    ok: false,
    phase: '49E',
    runId,
    projectId: 'reeditpro',
    mode: privateWebE2EConfig.mode,
    providerMode,
    query: privateWebE2EConfig.query,
    planSnapshot,
    searchResponse,
    normalizedSources,
    sourceManifest,
    fixturePages,
    captures: [],
    sharpProcessing: [],
    extractions: [],
    artifacts,
    qa,
    phase49FReadiness: 'blocked',
    safety: {
      ...privateWebE2ESafetyFlags,
      livePublicSearchExecuted: false,
      publicWebRequestMade: false,
      publicWebCaptureUsed: false,
      arbitraryUrlCaptureUsed: false,
      paidProviderCalled: false,
      publicAccessEnabled: false,
    },
    blockers: qa.blockers,
    warnings: Array.from(new Set([...qa.warnings, ...warnings])),
  }
}

function buildEvidence(executionReport: PrivateWebE2EExecutionReport, artifactPrefix: string): ApprovedPrivateWebE2EEvidence {
  const uri = (object: string) => `gs://${privateWebE2EConfig.generatedAssetsBucket}/${artifactPrefix}/${object}`
  const qaUri = (object: string) => `gs://${privateWebE2EConfig.qaBucket}/${artifactPrefix}/${object}`
  return {
    phase: '49E',
    status: executionReport.ok ? 'completed' : 'blocked',
    runId: executionReport.runId,
    providerMode: executionReport.providerMode,
    query: executionReport.query,
    sourceCount: executionReport.normalizedSources.length,
    captureCount: executionReport.captures.length,
    extractionCount: executionReport.extractions.length,
    planSnapshotUri: executionReport.ok ? uri('plan/approved-web-e2e-plan-snapshot.json') : undefined,
    searchResponseUri: executionReport.ok ? uri('search/private-search-response.json') : undefined,
    normalizedResultsUri: executionReport.ok ? uri('search/normalized-search-results.json') : undefined,
    sourceManifestUri: executionReport.ok ? uri('sources/source-manifest.json') : undefined,
    combinedManifestUri: executionReport.ok ? uri('manifest/private-web-search-capture-e2e-manifest.json') : undefined,
    qaReportUri: executionReport.ok ? qaUri('qa/private-web-search-capture-e2e-qa.json') : undefined,
    phase49eReportUri: executionReport.ok ? qaUri('reports/phase49e-report.json') : undefined,
    phase49FReadiness: executionReport.phase49FReadiness,
    blockers: executionReport.ok ? [] : executionReport.blockers,
    warnings: executionReport.warnings,
  }
}

async function writeLocalReport(executionReport: PrivateWebE2EExecutionReport) {
  const localReportPath = path.join(process.cwd(), PRIVATE_WEB_E2E_LOCAL_REPORT_PATH)
  await mkdir(path.dirname(localReportPath), { recursive: true })
  await writeFile(localReportPath, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')
}

async function uploadFile(bucket: string, object: string, filePath: string, kind: PrivateWebE2EArtifact['kind'], id: string): Promise<PrivateWebE2EArtifact> {
  await runGcloud(['storage', 'cp', filePath, `gs://${bucket}/${object}`])
  const stats = await stat(filePath)
  return {
    id,
    kind,
    bucket,
    object,
    gcsUri: `gs://${bucket}/${object}`,
    sizeBytes: stats.size,
    sha256: await sha256File(filePath),
  }
}

async function uploadText(bucket: string, object: string, text: string, root: string, id: string): Promise<PrivateWebE2EArtifact> {
  const filePath = path.join(root, `${id}.txt`)
  await writeFile(filePath, text, 'utf8')
  return uploadFile(bucket, object, filePath, 'private_text', id)
}

async function writeJson(root: string, id: string, payload: unknown): Promise<string> {
  const filePath = path.join(root, `${id}.json`)
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  return filePath
}

async function sha256File(filePath: string): Promise<string> {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex')
}

async function runGcloud(args: string[]): Promise<string> {
  const { stdout, stderr } = await execFileAsync('gcloud', args, { maxBuffer: 1024 * 1024 * 8 })
  return `${stdout}${stderr ? `\n${stderr}` : ''}`
}

function firstGcloudValue(output: string): string {
  const lines = output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  for (const line of lines) {
    if (isGcloudValueLine(line)) return line
  }
  return ''
}

function isGcloudValueLine(line: string): boolean {
  return !line.startsWith('WARNING:')
    && !line.startsWith('ERROR:')
    && !line.startsWith('To ')
    && !line.startsWith('If ')
    && !line.startsWith('/')
    && !line.startsWith('An error occurred:')
    && !line.startsWith('warnings.warn(')
    && !line.includes('Python version')
    && !line.includes('google.api_core')
    && !line.includes('CLOUDSDK_PYTHON')
}

async function assertNoPublicBucketPrincipals(buckets: string[], blockers: string[]) {
  for (const bucket of buckets) {
    const output = await runGcloud(['storage', 'buckets', 'get-iam-policy', `gs://${bucket}`, '--format=json'])
    const jsonStart = output.indexOf('{')
    const jsonEnd = output.lastIndexOf('}')
    if (jsonStart < 0 || jsonEnd < jsonStart) throw new Error(`Could not parse IAM policy JSON for ${bucket}.`)
    const policy = JSON.parse(output.slice(jsonStart, jsonEnd + 1)) as { bindings?: Array<{ members?: string[] }> }
    const publicMembers = (policy.bindings ?? [])
      .flatMap((binding) => binding.members ?? [])
      .filter((member) => member === 'allUsers' || member === 'allAuthenticatedUsers')
    if (publicMembers.length) blockers.push(`Bucket ${bucket} has public IAM principal(s): ${publicMembers.join(', ')}`)
  }
}
