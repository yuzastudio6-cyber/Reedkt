import { execFile } from 'node:child_process'
import { mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import {
  describeControlledGcsObject,
  runControlledGcloud,
} from '../controlled-real-video-ocr-safe-zone'
import {
  collectOcrRuntimeArtifacts,
  writeOcrRuntimeJsonArtifact,
} from '../ocr-runtime'
import { buildOcrCaptionRenderQaPrivateArtifactManifest } from './ocr-caption-render-qa-private-artifact-manifest-writer'
import {
  OCR_CAPTION_RENDER_QA_EXPECTED_ARTIFACTS,
  ocrCaptionRenderQaConfig,
  phase37EOcrCaptionRenderQaArtifactPrefix,
  phase37EOcrCaptionRenderQaArtifactPrefixUri,
  validateOcrCaptionRenderQaEnv,
} from './ocr-caption-render-qa-policy'
import { buildOcrCaptionRenderQaReport } from './ocr-caption-render-qa-report-builder'
import type {
  ApprovedOcrCaptionRenderQaEvidence,
  OcrCaptionRenderQaReport,
  OcrCaptionRenderQaRunnerResult,
} from './ocr-caption-render-qa-types'

const execFileAsync = promisify(execFile)

export async function runOcrCaptionRenderQa(input: {
  execute: boolean
  keepTemp?: boolean
  runId?: string
  localRoot?: string
}): Promise<OcrCaptionRenderQaRunnerResult> {
  if (!input.execute) throw new Error('Pass --execute to run the Phase 37E OCR caption/render QA metadata integration flow.')
  const runId = input.runId ?? `phase37e-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 15)}`
  const objectPrefix = phase37EOcrCaptionRenderQaArtifactPrefix(runId)
  const localRoot = input.localRoot ?? path.join(ocrCaptionRenderQaConfig.localTempRoot, runId)
  const reportDir = path.join(localRoot, 'reports')
  const inputDir = path.join(localRoot, 'private-inputs')
  const createdAt = new Date().toISOString()

  const preflight = await runOcrCaptionRenderQaPreflight()
  if (!preflight.allowed) throw new Error(`Phase 37E OCR caption/render QA preflight blocked:\n- ${preflight.blockers.join('\n- ')}`)

  await rm(localRoot, { recursive: true, force: true })
  await mkdir(reportDir, { recursive: true })
  await mkdir(inputDir, { recursive: true })

  const report = await buildOcrCaptionRenderQaReport({
    runId,
    createdAt,
    readPrivateArtifacts: true,
    localInputDir: inputDir,
  })
  await writeOcrCaptionRenderQaReports(reportDir, report)

  const preliminaryManifest = await buildOcrCaptionRenderQaPrivateArtifactManifest({
    runId,
    reportDir,
    objectPrefix,
  })
  const reportWithManifest: OcrCaptionRenderQaReport = {
    ...report,
    privateArtifactManifest: preliminaryManifest,
  }
  await writeOcrRuntimeJsonArtifact(path.join(reportDir, 'phase_37e_private_artifact_manifest.json'), preliminaryManifest)
  await writeOcrRuntimeJsonArtifact(path.join(reportDir, 'phase_37e_ocr_caption_render_qa_report.json'), reportWithManifest)

  const uploadedArtifacts = await uploadOcrCaptionRenderQaArtifacts(reportDir, objectPrefix)
  const finalManifest = await buildOcrCaptionRenderQaPrivateArtifactManifest({
    runId,
    reportDir,
    objectPrefix,
    uploadedArtifacts,
  })
  const finalReport: OcrCaptionRenderQaReport = {
    ...reportWithManifest,
    privateArtifactManifest: finalManifest,
    phase37FReadiness: {
      readyForCaptionRenderRuntimeHookPlanning: reportWithManifest.ok,
      reason: reportWithManifest.ok
        ? 'Phase 37E metadata integration passed and private JSON QA artifacts were uploaded; Phase 37F may plan Track B caption/render runtime hook contracts only.'
        : reportWithManifest.phase37FReadiness.reason,
    },
  }
  await writeOcrRuntimeJsonArtifact(path.join(reportDir, 'phase_37e_private_artifact_manifest.json'), finalManifest)
  await writeOcrRuntimeJsonArtifact(path.join(reportDir, 'phase_37e_ocr_caption_render_qa_report.json'), finalReport)
  await uploadSingleOcrCaptionRenderQaArtifact(path.join(reportDir, 'phase_37e_private_artifact_manifest.json'), `${objectPrefix}/phase_37e_private_artifact_manifest.json`)
  await uploadSingleOcrCaptionRenderQaArtifact(path.join(reportDir, 'phase_37e_ocr_caption_render_qa_report.json'), `${objectPrefix}/phase_37e_ocr_caption_render_qa_report.json`)
  const finalUploadedArtifacts = await Promise.all(OCR_CAPTION_RENDER_QA_EXPECTED_ARTIFACTS.map((artifactName) => describeControlledGcsObject(`gs://${ocrCaptionRenderQaConfig.qaBucket}/${objectPrefix}/${artifactName}`)))
  const evidence = ocrCaptionRenderQaReportToEvidence(finalReport, finalUploadedArtifacts, phase37EOcrCaptionRenderQaArtifactPrefixUri(runId))

  if (input.keepTemp !== true) await rm(localRoot, { recursive: true, force: true })
  return {
    evidence,
    report: finalReport,
    localArtifactDir: reportDir,
    localReportPath: path.join(reportDir, 'phase_37e_ocr_caption_render_qa_report.json'),
    uploadedArtifacts: finalUploadedArtifacts,
  }
}

export async function runOcrCaptionRenderQaPreflight(): Promise<{
  allowed: boolean
  blockers: string[]
  warnings: string[]
  activeProject: string
  activeAccount: string
}> {
  const [
    activeAccount,
    activeProject,
    branch,
    packageLockStatus,
    qaBucket,
    qaIam,
  ] = await Promise.all([
    runControlledGcloud(['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']),
    runControlledGcloud(['config', 'get-value', 'project']),
    runGit(['rev-parse', '--abbrev-ref', 'HEAD']),
    runGit(['status', '--short', '--', 'package-lock.json']),
    runControlledGcloud(['storage', 'buckets', 'describe', `gs://${ocrCaptionRenderQaConfig.qaBucket}`, '--format=json']),
    runControlledGcloud(['storage', 'buckets', 'get-iam-policy', `gs://${ocrCaptionRenderQaConfig.qaBucket}`, '--format=json']),
  ])
  const blockers: string[] = []
  const warnings: string[] = []
  const activeProjectValue = lastValue(activeProject)
  const activeAccountValue = lastValue(activeAccount)
  const branchValue = lastValue(branch)
  const qaBucketJson = parseGcloudJson(qaBucket)
  const publicAccessPrevention = getNestedString(qaBucketJson, ['iamConfiguration', 'publicAccessPrevention'])
    ?? getNestedString(qaBucketJson, ['public_access_prevention'])

  if (branchValue !== ocrCaptionRenderQaConfig.requiredBranch) blockers.push(`Phase 37E execution must run from ${ocrCaptionRenderQaConfig.requiredBranch}, got ${branchValue || 'unknown'}.`)
  if (packageLockStatus.trim()) blockers.push('package-lock.json has uncommitted changes before Phase 37E execution.')
  if (publicAccessPrevention !== 'enforced') blockers.push('QA artifact bucket public access prevention must be enforced.')
  if (/allUsers|allAuthenticatedUsers/.test(qaIam)) blockers.push('QA artifact bucket IAM contains a public principal.')
  if (OCR_CAPTION_RENDER_QA_EXPECTED_ARTIFACTS.length !== 10) blockers.push('Phase 37E expected-artifact contract must contain exactly 10 JSON reports.')

  const envValidation = validateOcrCaptionRenderQaEnv({
    projectId: process.env.GCP_PROJECT_ID,
    activeProject: activeProjectValue,
    region: process.env.GCP_REGION,
    env: process.env.REEDITPRO_ENV,
    executeConfirmation: process.env.REEDITPRO_CONFIRM_OCR_CAPTION_RENDER_QA_EXECUTE,
    privateArtifactReadConfirmation: process.env.REEDITPRO_CONFIRM_OCR_QA_PRIVATE_ARTIFACT_READ,
    privateArtifactUploadConfirmation: process.env.REEDITPRO_CONFIRM_OCR_QA_PRIVATE_ARTIFACT_UPLOAD,
    ocrRuntimeExecuteConfirmation: process.env.REEDITPRO_CONFIRM_OCR_RUNTIME_EXECUTE ?? 'false',
    controlledRealVideoOcrExecuteConfirmation: process.env.REEDITPRO_CONFIRM_CONTROLLED_REAL_VIDEO_OCR_EXECUTE ?? 'false',
    controlledRealVideoFrameExtractionConfirmation: process.env.REEDITPRO_CONFIRM_CONTROLLED_REAL_VIDEO_FRAME_EXTRACTION ?? 'false',
    arbitraryMediaEnabled: process.env.ARBITRARY_MEDIA_ENABLED ?? 'false',
    publicOutputEnabled: process.env.PUBLIC_OUTPUT_ENABLED ?? 'false',
    signedUrlSourceOfTruthEnabled: process.env.SIGNED_URL_SOURCE_OF_TRUTH_ENABLED ?? 'false',
    trackAExecutionEnabled: process.env.TRACK_A_EXECUTION_ENABLED ?? 'false',
    productionReady: process.env.REEDITPRO_PRODUCTION_READY ?? 'false',
    internalBetaReady: process.env.REEDITPRO_INTERNAL_BETA_READY ?? 'false',
    externalBetaReady: process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false',
    requireExecutionConfirmations: true,
  })
  warnings.push(...envValidation.warnings)
  warnings.push('Phase 37E preflight reads GCS/IAM metadata only and does not mutate IAM.')

  return {
    allowed: blockers.length === 0 && envValidation.allowed,
    blockers: [...envValidation.blockers, ...blockers],
    warnings,
    activeProject: activeProjectValue,
    activeAccount: activeAccountValue,
  }
}

export function ocrCaptionRenderQaReportToEvidence(
  report: OcrCaptionRenderQaReport,
  uploadedArtifacts: Array<{ gcsUri: string }>,
  artifactPrefix: string,
): ApprovedOcrCaptionRenderQaEvidence {
  const generatedFixtureCount = report.normalizationReport.normalizedFixtures.filter((fixture) => fixture.kind === 'generated_metadata').length
  const controlledFixtureCount = report.normalizationReport.normalizedFixtures.filter((fixture) => fixture.kind === 'controlled_phase37d_metadata').length
  const blockedGuardFixtureCount = report.normalizationReport.normalizedFixtures.filter((fixture) => fixture.kind === 'blocked_guard').length
  return {
    phase: '37E',
    status: report.ok ? 'passed' : 'blocked',
    runId: report.runId,
    artifactPrefix,
    privateArtifactObjectCount: uploadedArtifacts.length,
    phase37CRunId: report.inputManifest.phase37C.runId,
    phase37DRunId: report.inputManifest.phase37D.runId,
    generatedFixtureCount,
    controlledFixtureCount,
    blockedGuardFixtureCount,
    framesChecked: report.overlapQaReport.framesChecked,
    textRegionCount: report.normalizationReport.textRegionCount,
    lowerThirdCollisionFixtureCount: report.overlapQaReport.lowerThirdCollisionFixtures.length,
    manualReviewFixtureCount: report.overlapQaReport.manualReviewFixtures.length,
    phase37FReadiness: { ...report.phase37FReadiness },
    blockers: [...report.blockers],
    warnings: [...report.warnings],
  }
}

export function ocrCaptionRenderQaEvidenceToTypeScript(evidence: ApprovedOcrCaptionRenderQaEvidence): string {
  return [
    'import type { ApprovedOcrCaptionRenderQaEvidence } from \'./ocr-caption-render-qa-types\'',
    '',
    'export const approvedOcrCaptionRenderQaEvidence: ApprovedOcrCaptionRenderQaEvidence = ' + JSON.stringify(evidence, null, 2),
    '',
    'export function getApprovedOcrCaptionRenderQaEvidence(): ApprovedOcrCaptionRenderQaEvidence {',
    '  return cloneApprovedOcrCaptionRenderQaEvidence(approvedOcrCaptionRenderQaEvidence)',
    '}',
    '',
    'export function cloneApprovedOcrCaptionRenderQaEvidence(',
    '  evidence: ApprovedOcrCaptionRenderQaEvidence,',
    '): ApprovedOcrCaptionRenderQaEvidence {',
    '  return {',
    '    ...evidence,',
    '    phase37FReadiness: { ...evidence.phase37FReadiness },',
    '    blockers: [...evidence.blockers],',
    '    warnings: [...evidence.warnings],',
    '  }',
    '}',
    '',
  ].join('\n')
}

async function writeOcrCaptionRenderQaReports(reportDir: string, report: OcrCaptionRenderQaReport): Promise<void> {
  await writeOcrRuntimeJsonArtifact(path.join(reportDir, 'phase_37e_ocr_caption_render_qa_plan.json'), report.plan)
  await writeOcrRuntimeJsonArtifact(path.join(reportDir, 'phase_37e_ocr_safe_zone_input_manifest.json'), report.inputManifest)
  await writeOcrRuntimeJsonArtifact(path.join(reportDir, 'phase_37e_ocr_text_region_normalization_report.json'), report.normalizationReport)
  await writeOcrRuntimeJsonArtifact(path.join(reportDir, 'phase_37e_caption_constraint_manifest.json'), report.captionConstraintManifest)
  await writeOcrRuntimeJsonArtifact(path.join(reportDir, 'phase_37e_caption_candidate_zone_report.json'), report.candidateZoneReport)
  await writeOcrRuntimeJsonArtifact(path.join(reportDir, 'phase_37e_caption_overlap_qa_report.json'), report.overlapQaReport)
  await writeOcrRuntimeJsonArtifact(path.join(reportDir, 'phase_37e_render_qa_compatibility_manifest.json'), report.renderCompatibilityManifest)
  await writeOcrRuntimeJsonArtifact(path.join(reportDir, 'phase_37e_qa_gate_report.json'), report.qaGateReport)
}

async function uploadOcrCaptionRenderQaArtifacts(reportDir: string, objectPrefix: string) {
  if (process.env.REEDITPRO_CONFIRM_OCR_QA_PRIVATE_ARTIFACT_UPLOAD !== 'true') {
    throw new Error('REEDITPRO_CONFIRM_OCR_QA_PRIVATE_ARTIFACT_UPLOAD=true is required before uploading Phase 37E private JSON QA artifacts.')
  }
  const artifacts = (await collectOcrRuntimeArtifacts({
    rootDir: reportDir,
    bucket: ocrCaptionRenderQaConfig.qaBucket,
    objectPrefix,
  })).filter((artifact) => artifact.localPath?.endsWith('.json'))
  for (const artifact of artifacts) {
    if (!artifact.localPath || !artifact.object) continue
    const relative = path.relative(reportDir, artifact.localPath)
    if (relative.startsWith('..')) throw new Error(`Refusing to upload artifact outside report dir: ${artifact.localPath}`)
    if (!artifact.localPath.endsWith('.json')) throw new Error(`Refusing to upload non-JSON Phase 37E artifact: ${artifact.localPath}`)
    await uploadSingleOcrCaptionRenderQaArtifact(artifact.localPath, artifact.object)
  }
  return Promise.all(artifacts.map((artifact) => describeControlledGcsObject(`gs://${ocrCaptionRenderQaConfig.qaBucket}/${artifact.object}`)))
}

async function uploadSingleOcrCaptionRenderQaArtifact(localPath: string, object: string): Promise<void> {
  await runControlledGcloud(['storage', 'cp', localPath, `gs://${ocrCaptionRenderQaConfig.qaBucket}/${object}`])
}

async function runGit(args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('git', args, {
    maxBuffer: 20 * 1024 * 1024,
    env: {
      ...process.env,
      GIT_OPTIONAL_LOCKS: '0',
    },
  })
  return stdout
}

function lastValue(output: string): string {
  return output.split('\n').map((line) => line.trim()).filter(Boolean).at(-1) ?? ''
}

function parseGcloudJson(output: string): Record<string, unknown> {
  const objectStart = output.indexOf('{')
  const arrayStart = output.indexOf('[')
  const starts = [objectStart, arrayStart].filter((index) => index >= 0)
  const jsonStart = starts.length ? Math.min(...starts) : -1
  if (jsonStart < 0) throw new Error(`gcloud did not return JSON: ${output.slice(0, 160)}`)
  const parsed = JSON.parse(output.slice(jsonStart)) as unknown
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('gcloud JSON response was not an object.')
  return parsed as Record<string, unknown>
}

function getNestedString(value: Record<string, unknown>, pathParts: string[]): string | undefined {
  let current: unknown = value
  for (const part of pathParts) {
    if (!current || typeof current !== 'object' || Array.isArray(current)) return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return typeof current === 'string' ? current : undefined
}
