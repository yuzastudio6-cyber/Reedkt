import { execFile } from 'node:child_process'
import { mkdir, readFile, rm } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import {
  buildOcrModelAssetVerificationReport,
  collectOcrRuntimeArtifacts,
  copyPhase37BOcrAssetsFromPrivateGcs,
  ocrRuntimeConfig,
  safeExtractOcrModelArchive,
  writeOcrRuntimeJsonArtifact,
} from '../ocr-runtime'
import {
  buildControlledRealVideoOcrSafeZoneSampleManifest,
  getSelectedControlledRealVideoOcrSafeZoneSample,
} from './controlled-real-video-chain-registry'
import {
  buildControlledRealVideoOcrSafeZoneReport,
} from './controlled-real-video-ocr-safe-zone-report-builder'
import {
  CONTROLLED_REAL_VIDEO_OCR_EXECUTION_EXPECTED_ARTIFACTS,
  controlledRealVideoOcrExecutionConfig,
  phase37DControlledRealVideoOcrExecutionArtifactPrefix,
  validateControlledRealVideoOcrExecutionEnv,
} from './controlled-real-video-ocr-execution-policy'
import {
  describeControlledGcsObject,
  copyApprovedControlledRealVideoSourceFromPrivateGcs,
  parseControlledGcloudJson,
  runControlledGcloud,
} from './controlled-real-video-private-media-resolver'
import {
  ensureControlledRealVideoOcrRuntimeVenv,
  runControlledRealVideoOcrWorker,
} from './controlled-real-video-ocr-runtime-bridge'
import { buildControlledRealVideoOcrExecutionPlan } from './controlled-real-video-safe-zone-builder'
import type {
  ApprovedControlledRealVideoOcrExecutionEvidence,
  ControlledRealVideoGcsObjectMetadata,
  ControlledRealVideoOcrExecutionReport,
  ControlledRealVideoOcrExecutionResult,
  ControlledRealVideoOcrModelVerificationReport,
  ControlledRealVideoPrivateArtifactManifest,
} from './controlled-real-video-ocr-execution-types'

const execFileAsync = promisify(execFile)

export async function runControlledRealVideoOcrSafeZoneExecution(input: {
  execute: boolean
  keepTemp?: boolean
  runId?: string
  localRoot?: string
}): Promise<ControlledRealVideoOcrExecutionResult> {
  if (!input.execute) throw new Error('Pass --execute to run the Phase 37D controlled real-video OCR safe-zone execution flow.')
  const runId = input.runId ?? `phase37d-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 15)}`
  const artifactPrefix = phase37DControlledRealVideoOcrExecutionArtifactPrefix(runId)
  const localRoot = input.localRoot ?? path.join(controlledRealVideoOcrExecutionConfig.localTempRoot, runId)
  const reportDir = path.join(localRoot, 'reports')
  const frameDir = path.join(localRoot, 'frames')
  const extractRoot = path.join(localRoot, 'models', 'extracted')
  const createdAt = new Date().toISOString()

  const preflight = await runControlledRealVideoOcrExecutionPreflight()
  if (!preflight.allowed) throw new Error(`Phase 37D controlled real-video OCR execution preflight blocked:\n- ${preflight.blockers.join('\n- ')}`)

  await rm(localRoot, { recursive: true, force: true })
  await mkdir(reportDir, { recursive: true })
  await mkdir(frameDir, { recursive: true })

  const executionPlan = buildControlledRealVideoOcrExecutionPlan(createdAt)
  const sampleManifest = buildControlledRealVideoOcrSafeZoneSampleManifest(createdAt)
  await writeOcrRuntimeJsonArtifact(path.join(reportDir, 'phase_37d_controlled_real_video_ocr_execution_plan.json'), executionPlan)
  await writeOcrRuntimeJsonArtifact(path.join(reportDir, 'phase_37d_controlled_real_video_sample_manifest.json'), {
    ...sampleManifest,
    executionRunId: runId,
    executionPerformed: true,
    mediaBytesRead: true,
    frameExtractionPerformed: true,
    realVideoOcrPerformed: true,
    artifactUploadExpected: true,
    arbitraryMediaUsed: false,
  })

  const sourceCopy = await copyApprovedControlledRealVideoSourceFromPrivateGcs({ runId, localRoot })
  if (!sourceCopy.verified) {
    throw new Error(`Phase 37D approved source verification failed: expected ${sourceCopy.expectedSha256}, got ${sourceCopy.actualSha256}.`)
  }

  const copiedAssets = await copyPhase37BOcrAssetsFromPrivateGcs({ runId, localRoot })
  const phase37CVerification = await buildOcrModelAssetVerificationReport({ runId, assets: copiedAssets })
  const verificationReport: ControlledRealVideoOcrModelVerificationReport = {
    ...phase37CVerification,
    phase: '37D',
  }
  await writeOcrRuntimeJsonArtifact(path.join(reportDir, 'phase_37d_ocr_model_asset_verification.json'), verificationReport)
  if (verificationReport.status !== 'verified') {
    throw new Error(`Phase 37D OCR model verification blocked:\n- ${verificationReport.blockers.join('\n- ')}`)
  }

  const detExtract = await safeExtractOcrModelArchive({
    archivePath: path.join(localRoot, 'models', 'raw', 'det', 'PP-OCRv5_mobile_det_infer.tar'),
    extractDir: path.join(extractRoot, 'det'),
    expectedRootPrefix: 'PP-OCRv5_mobile_det_infer/',
  })
  const recExtract = await safeExtractOcrModelArchive({
    archivePath: path.join(localRoot, 'models', 'raw', 'rec', 'PP-OCRv5_mobile_rec_infer.tar'),
    extractDir: path.join(extractRoot, 'rec'),
    expectedRootPrefix: 'PP-OCRv5_mobile_rec_infer/',
  })
  const dictionaryPath = path.join(localRoot, 'models', 'raw', 'dict', 'ppocrv5_dict.txt')
  const venvPython = await ensureControlledRealVideoOcrRuntimeVenv(localRoot)
  const workerOutput = await runControlledRealVideoOcrWorker({
    python: venvPython,
    runId,
    localRoot,
    reportDir,
    frameDir,
    videoPath: sourceCopy.localPath,
    detectionModelDir: detExtract.modelDir,
    recognitionModelDir: recExtract.modelDir,
    dictionaryPath,
    assetVerificationPath: path.join(reportDir, 'phase_37d_ocr_model_asset_verification.json'),
    sampleManifestPath: path.join(reportDir, 'phase_37d_controlled_real_video_sample_manifest.json'),
    executionPlanPath: path.join(reportDir, 'phase_37d_controlled_real_video_ocr_execution_plan.json'),
    offsetsSeconds: [...controlledRealVideoOcrExecutionConfig.selectedFrameOffsetsSeconds],
  })

  const reportPath = path.join(reportDir, 'phase_37d_controlled_real_video_ocr_execution_report.json')
  let executionReport = parseControlledExecutionReport(await readFile(reportPath, 'utf8'))
  executionReport.source = sourceCopy
  executionReport.modelVerification = verificationReport
  executionReport.ocrResults.runtime.stderrPreview = [
    executionReport.ocrResults.runtime.stderrPreview,
    workerOutput.stderr.slice(0, 1600),
  ].filter(Boolean).join('\n').slice(0, 4000)

  let uploadedArtifacts = await collectAndUploadExecutionArtifacts({
    reportDir,
    objectPrefix: artifactPrefix,
    executionReport,
    sourceCopy,
  })
  executionReport = parseControlledExecutionReport(await readFile(reportPath, 'utf8'))
  executionReport.artifacts = uploadedArtifacts
  await writeOcrRuntimeJsonArtifact(reportPath, executionReport)
  await uploadSingleReportArtifact(reportPath, `${artifactPrefix}/phase_37d_controlled_real_video_ocr_execution_report.json`)
  const finalReportObject = await describeControlledGcsObject(`gs://${controlledRealVideoOcrExecutionConfig.qaBucket}/${artifactPrefix}/phase_37d_controlled_real_video_ocr_execution_report.json`)
  uploadedArtifacts = replaceUploadedObject(uploadedArtifacts, finalReportObject)

  const evidence = controlledRealVideoOcrExecutionReportToEvidence(executionReport, uploadedArtifacts, artifactPrefix)
  if (input.keepTemp !== true) await rm(localRoot, { recursive: true, force: true })

  return {
    evidence,
    executionReport,
    localReportPath: reportPath,
    localArtifactDir: reportDir,
    uploadedArtifacts,
  }
}

export async function runControlledRealVideoOcrExecutionPreflight(): Promise<{
  allowed: boolean
  blockers: string[]
  warnings: string[]
  activeAccount: string
  activeProject: string
}> {
  const sample = getSelectedControlledRealVideoOcrSafeZoneSample()
  const gateReport = buildControlledRealVideoOcrSafeZoneReport()
  const [
    activeAccount,
    activeProject,
    packageLockStatus,
    branch,
    sourceObject,
    qaBucket,
    qaIam,
    detObject,
    recObject,
    dictObject,
  ] = await Promise.all([
    runControlledGcloud(['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']),
    runControlledGcloud(['config', 'get-value', 'project']),
    runGit(['status', '--short', '--', 'package-lock.json']),
    runGit(['rev-parse', '--abbrev-ref', 'HEAD']),
    describeControlledGcsObject(sample.sourceGcsUri),
    runControlledGcloud(['storage', 'buckets', 'describe', `gs://${controlledRealVideoOcrExecutionConfig.qaBucket}`, '--format=json']),
    runControlledGcloud(['storage', 'buckets', 'get-iam-policy', `gs://${controlledRealVideoOcrExecutionConfig.qaBucket}`, '--format=json']),
    describeControlledGcsObject(`${ocrRuntimeConfig.modelGcsPath}det/PP-OCRv5_mobile_det_infer.tar`),
    describeControlledGcsObject(`${ocrRuntimeConfig.modelGcsPath}rec/PP-OCRv5_mobile_rec_infer.tar`),
    describeControlledGcsObject(`${ocrRuntimeConfig.modelGcsPath}dict/ppocrv5_dict.txt`),
  ])
  const blockers: string[] = []
  const warnings: string[] = []
  const activeProjectValue = lastValue(activeProject)
  const activeAccountValue = lastValue(activeAccount)
  const branchValue = lastValue(branch)
  const qaBucketJson = parseControlledGcloudJson(qaBucket)
  const publicAccessPrevention = getNestedString(qaBucketJson, ['iamConfiguration', 'publicAccessPrevention'])
    ?? getNestedString(qaBucketJson, ['public_access_prevention'])
  const gateBlockersOtherThanExpectedExecutionConfirmations = gateReport.blockers.filter((blocker) => ![
    'REEDITPRO_CONFIRM_CONTROLLED_REAL_VIDEO_OCR_EXECUTE must not be true in the Phase 37D metadata-only gate.',
    'REEDITPRO_CONFIRM_CONTROLLED_REAL_VIDEO_FRAME_EXTRACTION must not be true in the Phase 37D metadata-only gate.',
    'REEDITPRO_CONFIRM_CONTROLLED_REAL_VIDEO_ARTIFACT_UPLOAD must not be true in the Phase 37D metadata-only gate.',
  ].includes(blocker))

  if (branchValue !== 'codex/rp-activation-37d-controlled-real-video-ocr-safe-zone-execution') blockers.push(`Execution must run from the Phase 37D execution branch, got ${branchValue || 'unknown'}.`)
  if (packageLockStatus.trim()) blockers.push('package-lock.json has uncommitted changes before Phase 37D execution.')
  if (!gateReport.phase37DMetadataPlanningPassed && gateBlockersOtherThanExpectedExecutionConfirmations.length > 0) {
    blockers.push(`Phase 37D metadata planning gate has non-execution blockers: ${gateBlockersOtherThanExpectedExecutionConfirmations.join('; ')}`)
  }
  if (CONTROLLED_REAL_VIDEO_OCR_EXECUTION_EXPECTED_ARTIFACTS.length !== 10) blockers.push('Phase 37D execution expected-artifact contract must contain exactly 10 JSON reports.')
  if (sourceObject.sizeBytes !== controlledRealVideoOcrExecutionConfig.sourceObjectSizeBytes) blockers.push(`Approved source object size mismatch: ${sourceObject.sizeBytes}.`)
  if (sourceObject.contentType && sourceObject.contentType !== controlledRealVideoOcrExecutionConfig.sourceContentType) blockers.push(`Approved source object content type mismatch: ${sourceObject.contentType}.`)
  if (publicAccessPrevention !== 'enforced') blockers.push('QA artifact bucket public access prevention must be enforced.')
  if (/allUsers|allAuthenticatedUsers/.test(qaIam)) blockers.push('QA artifact bucket IAM contains a public principal.')
  for (const object of [detObject, recObject, dictObject]) {
    if (!Number.isFinite(object.sizeBytes) || object.sizeBytes <= 0) blockers.push(`OCR model object is missing or empty: ${object.gcsUri}`)
  }

  const envValidation = validateControlledRealVideoOcrExecutionEnv({
    projectId: process.env.GCP_PROJECT_ID,
    activeProject: activeProjectValue,
    region: process.env.GCP_REGION,
    env: process.env.REEDITPRO_ENV,
    sourceGcsUri: sample.sourceGcsUri,
    ocrExecuteConfirmation: process.env.REEDITPRO_CONFIRM_CONTROLLED_REAL_VIDEO_OCR_EXECUTE,
    frameExtractionConfirmation: process.env.REEDITPRO_CONFIRM_CONTROLLED_REAL_VIDEO_FRAME_EXTRACTION,
    artifactUploadConfirmation: process.env.REEDITPRO_CONFIRM_CONTROLLED_REAL_VIDEO_ARTIFACT_UPLOAD,
    privateGcsReadConfirmation: process.env.REEDITPRO_CONFIRM_OCR_PRIVATE_GCS_READ,
    runtimeExecuteConfirmation: process.env.REEDITPRO_CONFIRM_OCR_RUNTIME_EXECUTE,
    arbitraryMediaEnabled: process.env.ARBITRARY_MEDIA_ENABLED ?? 'false',
    broadRealMediaReady: process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false',
    providerExecutionEnabled: process.env.PROVIDER_EXECUTION_ENABLED ?? 'false',
    publicOutputEnabled: process.env.PUBLIC_OUTPUT_ENABLED ?? 'false',
    signedUrlSourceOfTruthEnabled: process.env.SIGNED_URL_SOURCE_OF_TRUTH_ENABLED ?? 'false',
    trackAExecutionEnabled: process.env.TRACK_A_EXECUTION_ENABLED ?? 'false',
    productionReady: process.env.REEDITPRO_PRODUCTION_READY ?? 'false',
    externalBetaReady: process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false',
  })
  warnings.push(...envValidation.warnings)
  warnings.push('Phase 37D preflight reads GCS/IAM metadata only and does not mutate IAM.')
  return {
    allowed: blockers.length === 0 && envValidation.allowed,
    blockers: [...envValidation.blockers, ...blockers],
    warnings,
    activeAccount: activeAccountValue,
    activeProject: activeProjectValue,
  }
}

export function controlledRealVideoOcrExecutionReportToEvidence(
  report: ControlledRealVideoOcrExecutionReport,
  uploadedArtifacts: ControlledRealVideoGcsObjectMetadata[],
  artifactPrefix: string,
): ApprovedControlledRealVideoOcrExecutionEvidence {
  const frames = report.frameExtraction.extractedFrameCount
  const totalRegions = report.ocrResults.totalTextRegionCount
  const framesWithCollision = report.collisionReport.framesWithLowerThirdCollision
  return {
    phase: '37D',
    status: report.ok && report.qa.status === 'passed' ? 'passed' : 'blocked',
    runId: report.runId,
    sampleId: report.sample.sampleId,
    controlledChainId: report.sample.controlledChainId,
    sourceGcsUri: report.sample.sourceGcsUri,
    window: { ...report.sample.window },
    frameOffsetsSeconds: [...report.sample.frameOffsetsSeconds],
    frameCount: frames,
    artifactPrefix: `gs://${controlledRealVideoOcrExecutionConfig.qaBucket}/${artifactPrefix}/`,
    privateArtifactObjectCount: uploadedArtifacts.length,
    sourceObject: { ...report.source.gcs },
    modelAggregateSha256: report.modelVerification.aggregateSha256,
    modelAssetSha256: {
      detection: ocrRuntimeConfig.detectionArchiveSha256,
      recognition: ocrRuntimeConfig.recognitionArchiveSha256,
      dictionary: ocrRuntimeConfig.dictionarySha256,
    },
    ocrSummary: {
      totalTextRegionCount: totalRegions,
      framesWithTextCount: report.ocrResults.framesWithTextCount,
      framesWithoutText: report.collisionReport.framesWithoutText,
      framesWithLowerThirdCollision: framesWithCollision,
      recommendationsAvailable: report.collisionReport.recommendationsAvailable,
      averageRegionsPerFrame: frames > 0 ? Number((totalRegions / frames).toFixed(3)) : 0,
    },
    phase37EReadiness: { ...report.phase37EReadiness },
    blockers: [...report.qa.blockers],
    warnings: [...report.qa.warnings],
  }
}

export function controlledRealVideoOcrExecutionEvidenceToTypeScript(
  evidence: ApprovedControlledRealVideoOcrExecutionEvidence,
): string {
  return [
    'import type { ApprovedControlledRealVideoOcrExecutionEvidence } from \'./controlled-real-video-ocr-execution-types\'',
    '',
    'export const approvedControlledRealVideoOcrExecutionEvidence: ApprovedControlledRealVideoOcrExecutionEvidence = ' + JSON.stringify(evidence, null, 2),
    '',
    'export function getApprovedControlledRealVideoOcrExecutionEvidence(): ApprovedControlledRealVideoOcrExecutionEvidence {',
    '  return {',
    '    ...approvedControlledRealVideoOcrExecutionEvidence,',
    '    window: { ...approvedControlledRealVideoOcrExecutionEvidence.window },',
    '    frameOffsetsSeconds: [...approvedControlledRealVideoOcrExecutionEvidence.frameOffsetsSeconds],',
    '    sourceObject: approvedControlledRealVideoOcrExecutionEvidence.sourceObject ? { ...approvedControlledRealVideoOcrExecutionEvidence.sourceObject } : undefined,',
    '    modelAssetSha256: { ...approvedControlledRealVideoOcrExecutionEvidence.modelAssetSha256 },',
    '    ocrSummary: { ...approvedControlledRealVideoOcrExecutionEvidence.ocrSummary },',
    '    phase37EReadiness: { ...approvedControlledRealVideoOcrExecutionEvidence.phase37EReadiness },',
    '    blockers: [...approvedControlledRealVideoOcrExecutionEvidence.blockers],',
    '    warnings: [...approvedControlledRealVideoOcrExecutionEvidence.warnings],',
    '  }',
    '}',
    '',
  ].join('\n')
}

async function collectAndUploadExecutionArtifacts(input: {
  reportDir: string
  objectPrefix: string
  executionReport: ControlledRealVideoOcrExecutionReport
  sourceCopy: ControlledRealVideoOcrExecutionReport['source']
}): Promise<ControlledRealVideoGcsObjectMetadata[]> {
  const preliminaryArtifacts = await collectOcrRuntimeArtifacts({
    rootDir: input.reportDir,
    bucket: controlledRealVideoOcrExecutionConfig.qaBucket,
    objectPrefix: input.objectPrefix,
  })
  const privateManifest: ControlledRealVideoPrivateArtifactManifest = {
    phase: '37D',
    runId: input.executionReport.runId,
    privateOnly: true,
    bucket: controlledRealVideoOcrExecutionConfig.qaBucket,
    prefix: input.objectPrefix,
    artifactCount: preliminaryArtifacts.length,
    jsonOnly: true,
    rawFramesUploaded: false,
    overlaysUploaded: false,
    artifacts: preliminaryArtifacts,
    uploadedArtifacts: [],
    blocked: {
      publicAccess: true,
      signedUrls: true,
      rawFrameUpload: true,
      overlayUpload: true,
      arbitraryMedia: true,
      phase37EIntegration: true,
      beta: true,
      production: true,
    },
  }
  await writeOcrRuntimeJsonArtifact(path.join(input.reportDir, 'phase_37d_private_artifact_manifest.json'), privateManifest)
  input.executionReport.source = input.sourceCopy
  await writeOcrRuntimeJsonArtifact(path.join(input.reportDir, 'phase_37d_controlled_real_video_ocr_execution_report.json'), input.executionReport)

  const artifacts = (await collectOcrRuntimeArtifacts({
    rootDir: input.reportDir,
    bucket: controlledRealVideoOcrExecutionConfig.qaBucket,
    objectPrefix: input.objectPrefix,
  })).filter((artifact) => artifact.localPath?.endsWith('.json'))
  await uploadOcrExecutionArtifacts(input.reportDir, artifacts)
  const uploaded = await Promise.all(artifacts.map((artifact) => describeControlledGcsObject(`gs://${controlledRealVideoOcrExecutionConfig.qaBucket}/${artifact.object}`)))

  const finalManifest: ControlledRealVideoPrivateArtifactManifest = {
    ...privateManifest,
    artifactCount: artifacts.length,
    artifacts,
    uploadedArtifacts: uploaded,
  }
  await writeOcrRuntimeJsonArtifact(path.join(input.reportDir, 'phase_37d_private_artifact_manifest.json'), finalManifest)
  const finalReport: ControlledRealVideoOcrExecutionReport = {
    ...input.executionReport,
    artifacts: uploaded,
  }
  await writeOcrRuntimeJsonArtifact(path.join(input.reportDir, 'phase_37d_controlled_real_video_ocr_execution_report.json'), finalReport)
  await uploadSingleReportArtifact(path.join(input.reportDir, 'phase_37d_private_artifact_manifest.json'), `${input.objectPrefix}/phase_37d_private_artifact_manifest.json`)
  await uploadSingleReportArtifact(path.join(input.reportDir, 'phase_37d_controlled_real_video_ocr_execution_report.json'), `${input.objectPrefix}/phase_37d_controlled_real_video_ocr_execution_report.json`)
  const manifestObject = await describeControlledGcsObject(`gs://${controlledRealVideoOcrExecutionConfig.qaBucket}/${input.objectPrefix}/phase_37d_private_artifact_manifest.json`)
  return replaceUploadedObject(uploaded, manifestObject)
}

async function uploadOcrExecutionArtifacts(rootDir: string, artifacts: Array<{ localPath?: string; object?: string }>): Promise<void> {
  if (process.env.REEDITPRO_CONFIRM_CONTROLLED_REAL_VIDEO_ARTIFACT_UPLOAD !== 'true') {
    throw new Error('REEDITPRO_CONFIRM_CONTROLLED_REAL_VIDEO_ARTIFACT_UPLOAD=true is required before uploading Phase 37D private JSON QA artifacts.')
  }
  for (const artifact of artifacts) {
    if (!artifact.localPath || !artifact.object) continue
    const relative = path.relative(rootDir, artifact.localPath)
    if (relative.startsWith('..')) throw new Error(`Refusing to upload artifact outside report dir: ${artifact.localPath}`)
    if (!artifact.localPath.endsWith('.json')) throw new Error(`Refusing to upload non-JSON Phase 37D artifact: ${artifact.localPath}`)
    await uploadSingleReportArtifact(artifact.localPath, artifact.object)
  }
}

async function uploadSingleReportArtifact(localPath: string, object: string): Promise<void> {
  await runControlledGcloud(['storage', 'cp', localPath, `gs://${controlledRealVideoOcrExecutionConfig.qaBucket}/${object}`])
}

function replaceUploadedObject(
  objects: ControlledRealVideoGcsObjectMetadata[],
  replacement: ControlledRealVideoGcsObjectMetadata,
): ControlledRealVideoGcsObjectMetadata[] {
  return objects.map((object) => (object.gcsUri === replacement.gcsUri ? replacement : object))
}

function parseControlledExecutionReport(contents: string): ControlledRealVideoOcrExecutionReport {
  return JSON.parse(contents) as ControlledRealVideoOcrExecutionReport
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

function getNestedString(value: Record<string, unknown>, pathParts: string[]): string | undefined {
  let current: unknown = value
  for (const part of pathParts) {
    if (!current || typeof current !== 'object' || Array.isArray(current)) return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return typeof current === 'string' ? current : undefined
}
