import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { composeSegmentTextBehindSubjectPreviewFrame } from '../segment-text-behind-subject-preview/segment-text-behind-local-compositor'
import { buildSegmentTextBehindSubjectPreviewCompositionPlan } from '../segment-text-behind-subject-preview/segment-text-behind-composition-plan'
import type { SegmentTextBehindSubjectPreviewCompositionPlan } from '../segment-text-behind-subject-preview/segment-text-behind-subject-preview-types'
import { buildSam2FeatureE2EIamPlan } from './sam2-feature-iam-plan'
import { buildSam2FeatureApprovedPlanSnapshot } from './sam2-feature-plan-snapshot'
import { buildSam2FeaturePreviewScope } from './sam2-feature-preview-scope'
import { buildSam2FeatureExecutionQa } from './sam2-feature-qa-summary'
import { resolveSam2FeatureSource } from './sam2-feature-source-resolver'
import {
  phase35fPrefix,
  sam2FeatureE2EConfig,
  validateSam2FeatureE2EExecutionEnv,
} from './sam2-feature-e2e-policy'
import type {
  ApprovedSam2FeatureE2EEvidence,
  Sam2FeatureArtifact,
  Sam2FeatureE2EExecutionReport,
  Sam2FeatureRuntimeReport,
} from './sam2-feature-e2e-types'

const execFileAsync = promisify(execFile)

export async function runSam2FeatureE2E(input: {
  execute: boolean
  runId?: string
}): Promise<{
  evidence: ApprovedSam2FeatureE2EEvidence
  executionReport: Sam2FeatureE2EExecutionReport
  localReportPath: string
  imageDigest: string
  iamChanges: string[]
}> {
  if (!input.execute) throw new Error('Pass --execute to run the Phase 35F SAM2 feature E2E flow.')
  const runId = input.runId ?? process.env.REEDITPRO_PHASE35F_RUN_ID ?? `phase35f-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 14)}`
  const artifactPrefix = phase35fPrefix(runId)
  const sourceValidation = await resolveSam2FeatureSource()
  const previewScope = buildSam2FeaturePreviewScope({ sourceDurationSeconds: sam2FeatureE2EConfig.controlledPreviewDurationSeconds })
  const planSnapshot = buildSam2FeatureApprovedPlanSnapshot({ runId, sourceValidation, previewScope })
  const preflight = await runSam2FeatureE2EPreflight({ sourceValidation, frameCount: previewScope.frameCount, fps: previewScope.fps })
  if (!preflight.allowed) throw new Error(`Phase 35F SAM2 feature E2E preflight blocked:\n- ${preflight.blockers.join('\n- ')}`)

  const iamChanges = await ensureSam2FeatureE2EIamBindings()
  const planSnapshotUri = `gs://${sam2FeatureE2EConfig.generatedAssetsBucket}/${artifactPrefix}/plan/approved-plan-snapshot.json`
  await uploadJson(sam2FeatureE2EConfig.generatedAssetsBucket, `${artifactPrefix}/plan/approved-plan-snapshot.json`, planSnapshot)
  await runCommand('npm', ['run', 'build:staging-sam2-runtime-worker'])
  await runCommand('docker', [
    'buildx',
    'build',
    '--platform',
    'linux/amd64',
    '--provenance=false',
    '--sbom=false',
    '-f',
    'docker/prod/sam2-runtime/Dockerfile',
    '-t',
    sam2FeatureE2EConfig.runtimeTargetImage,
    '--push',
    '.',
  ], 3 * 60 * 60 * 1000)
  const imageInspect = await runCommand('docker', ['buildx', 'imagetools', 'inspect', sam2FeatureE2EConfig.runtimeTargetImage])
  const imageDigest = parseImageDigest(imageInspect)
  const imageRef = `${sam2FeatureE2EConfig.runtimeImageRepository}@${imageDigest}`
  await runCommand('gcloud', [
    'run',
    'jobs',
    'deploy',
    sam2FeatureE2EConfig.runtimeJobName,
    '--project',
    sam2FeatureE2EConfig.projectId,
    '--region',
    sam2FeatureE2EConfig.region,
    '--image',
    imageRef,
    '--service-account',
    sam2FeatureE2EConfig.gpuServiceAccountEmail,
    '--gpu=1',
    '--gpu-type=nvidia-l4',
    '--cpu=4',
    '--memory=16Gi',
    '--parallelism=1',
    '--max-retries=0',
    '--no-gpu-zonal-redundancy',
    '--set-env-vars',
    buildRuntimeEnvVars({ runId, imageRef, imageDigest, previewScope }),
  ], 15 * 60 * 1000)
  const executionOutput = await runCommand('gcloud', ['run', 'jobs', 'execute', sam2FeatureE2EConfig.runtimeJobName, '--region', sam2FeatureE2EConfig.region, '--project', sam2FeatureE2EConfig.projectId, '--wait'], 90 * 60 * 1000)
  const executionId = parseExecutionId(executionOutput)
  const runtimeReportPath = path.join(os.tmpdir(), `reeditpro-sam2-feature-e2e-${runId}`, 'runtime-report.json')
  await mkdir(path.dirname(runtimeReportPath), { recursive: true })
  const runtimeReportUri = `gs://${sam2FeatureE2EConfig.qaBucket}/${artifactPrefix}/reports/phase35f-runtime-report.json`
  await runCommand('gcloud', ['storage', 'cp', runtimeReportUri, runtimeReportPath])
  const runtimeReport = JSON.parse(await readFile(runtimeReportPath, 'utf8')) as Sam2FeatureRuntimeReport
  runtimeReport.executionId ??= executionId
  runtimeReport.image = { image: imageRef, digest: imageDigest }

  const composed = await composeSam2FeaturePreviewFrames({ runId, runtimeReport, artifactPrefix })
  const qa = buildSam2FeatureExecutionQa({
    sourceOk: sourceValidation.blockers.length === 0,
    planSnapshotOk: true,
    frameCount: runtimeReport.previewScope.frameCount,
    maskCount: runtimeReport.masks.frameCount,
    previewFrameCount: composed.previewFrameUris.length,
    width: runtimeReport.previewScope.width,
    height: runtimeReport.previewScope.height,
    fps: runtimeReport.previewScope.fps,
    fullControlledClip: runtimeReport.previewScope.fullControlledClip,
    previewClipGenerated: composed.previewClipGenerated,
    publicAccessEnabled: false,
    runtimeQaBlockers: runtimeReport.qa.blockers,
  })
  const featureReadiness = qa.blockers.length > 0
    ? {
      status: 'blocked' as const,
      reason: 'Phase 35F QA has blocking failures.',
    }
    : runtimeReport.previewScope.fullControlledClip
      ? {
        status: 'ready_for_internal_sam2_feature_testing' as const,
        reason: 'Full controlled private preview scope completed with SAM2 masks, text-behind-subject preview frames, private review manifest, and no blocking QA failures.',
      }
      : {
        status: 'ready_for_segment_level_internal_testing_only' as const,
        reason: runtimeReport.previewScope.fallbackReason ?? 'Only fallback segment scope completed.',
      }

  const finalReport: Sam2FeatureE2EExecutionReport = {
    ...runtimeReport,
    ok: runtimeReport.ok && qa.blockers.length === 0,
    sourceValidation,
    planSnapshot: {
      planId: planSnapshot.planId,
      gcsUri: planSnapshotUri,
      approvedPlanSnapshot: true,
      rawPromptExecution: false,
    },
    textLayerPlan: {
      text: sam2FeatureE2EConfig.approvedText,
      renderer: 'native_node_png_compositor',
      compositionStrategy: 'native_node_png_alpha_composite_with_sam2_mask_foreground',
    },
    composition: composed,
    qa,
    featureReadiness,
    blockers: qa.blockers,
    warnings: Array.from(new Set([...runtimeReport.warnings, ...qa.warnings])),
  }
  const finalReportObject = `${artifactPrefix}/reports/phase35f-report.json`
  finalReport.uploadedReport = {
    bucket: sam2FeatureE2EConfig.qaBucket,
    object: finalReportObject,
    gcsUri: `gs://${sam2FeatureE2EConfig.qaBucket}/${finalReportObject}`,
  }
  const finalReportArtifact = await uploadJson(sam2FeatureE2EConfig.qaBucket, finalReportObject, finalReport)
  finalReport.artifacts.push({ id: 'phase35f-report', kind: 'phase35f_report', ...finalReportArtifact })
  await uploadJson(sam2FeatureE2EConfig.qaBucket, `${artifactPrefix}/qa/sam2-feature-e2e-qa.json`, {
    phase: '35F',
    runId,
    qa,
    featureReadiness,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadRealUserMediaAllowed: false,
  })

  const localReportPath = path.join(os.tmpdir(), `reeditpro-sam2-feature-e2e-${runId}`, 'phase35f-report.json')
  await writeFile(localReportPath, `${JSON.stringify(finalReport, null, 2)}\n`, 'utf8')
  const evidence: ApprovedSam2FeatureE2EEvidence = {
    phase: '35F',
    status: featureReadiness.status === 'ready_for_internal_sam2_feature_testing'
      ? 'verified'
      : featureReadiness.status === 'ready_for_segment_level_internal_testing_only'
        ? 'segment_only'
        : 'blocked',
    runId,
    source: sam2FeatureE2EConfig.approvedPreviewSource,
    previewScope: {
      mode: runtimeReport.previewScope.mode,
      startSeconds: runtimeReport.previewScope.startSeconds,
      endSeconds: runtimeReport.previewScope.endSeconds,
      durationSeconds: runtimeReport.previewScope.durationSeconds,
      frameCount: runtimeReport.previewScope.frameCount,
      width: runtimeReport.previewScope.width,
      height: runtimeReport.previewScope.height,
      fps: runtimeReport.previewScope.fps,
    },
    runtimeImage: imageRef,
    runtimeImageDigest: imageDigest,
    cloudRunJobName: sam2FeatureE2EConfig.runtimeJobName,
    cloudRunExecutionId: finalReport.executionId,
    planSnapshotUri,
    generatedAssetsPrefix: `gs://${sam2FeatureE2EConfig.generatedAssetsBucket}/${artifactPrefix}/`,
    masksPrefix: `gs://${sam2FeatureE2EConfig.masksBucket}/${artifactPrefix}/`,
    previewsPrefix: `gs://${sam2FeatureE2EConfig.previewsBucket}/${artifactPrefix}/`,
    qaReportUri: finalReport.uploadedReport.gcsUri,
    previewFrameCount: composed.previewFrameUris.length,
    previewClipGenerated: composed.previewClipGenerated,
    featureReadiness,
    blockers: finalReport.blockers,
    warnings: finalReport.warnings,
  }

  return { evidence, executionReport: finalReport, localReportPath, imageDigest, iamChanges }
}

export async function runSam2FeatureE2EPreflight(input: {
  sourceValidation?: { blockers: string[] }
  frameCount?: number
  fps?: number
} = {}) {
  const [
    activeAccount,
    activeProject,
    projectDescribe,
    sourceBucket,
    finalExportsBucket,
    generatedBucket,
    masksBucket,
    previewsBucket,
    qaBucket,
    tempBucket,
    approvedSource,
    approvedPreview,
    checkpoint,
    config,
    manifest,
    jobDescribe,
    serviceAccount,
  ] = await Promise.all([
    runGcloud(['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']),
    runGcloud(['config', 'get-value', 'project']),
    runGcloud(['projects', 'describe', 'reeditpro', '--format=value(projectId)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${sam2FeatureE2EConfig.sourceMediaBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${sam2FeatureE2EConfig.finalExportsBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${sam2FeatureE2EConfig.generatedAssetsBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${sam2FeatureE2EConfig.masksBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${sam2FeatureE2EConfig.previewsBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${sam2FeatureE2EConfig.qaBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${sam2FeatureE2EConfig.workerTempBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'objects', 'describe', sam2FeatureE2EConfig.approvedGcsSource, '--format=value(size)']),
    runGcloud(['storage', 'objects', 'describe', sam2FeatureE2EConfig.approvedPreviewSource, '--format=value(size)']),
    runGcloud(['storage', 'objects', 'describe', `${sam2FeatureE2EConfig.modelGcsPath}${sam2FeatureE2EConfig.checkpointFileName}`, '--format=value(size)']),
    runGcloud(['storage', 'objects', 'describe', `${sam2FeatureE2EConfig.modelGcsPath}${sam2FeatureE2EConfig.configFileName}`, '--format=value(size)']),
    runGcloud(['storage', 'objects', 'describe', `${sam2FeatureE2EConfig.modelGcsPath}model_tree_manifest.json`, '--format=value(size)']),
    runGcloud(['run', 'jobs', 'describe', sam2FeatureE2EConfig.runtimeJobName, '--region', sam2FeatureE2EConfig.region, '--project', sam2FeatureE2EConfig.projectId, '--format=value(metadata.name)']),
    runGcloud(['iam', 'service-accounts', 'describe', sam2FeatureE2EConfig.gpuServiceAccountEmail, '--project', sam2FeatureE2EConfig.projectId, '--format=value(email)']),
  ])
  const blockers: string[] = [...(input.sourceValidation?.blockers ?? [])]
  const activeAccountValue = lastGcloudValue(activeAccount)
  const activeProjectValue = lastGcloudValue(activeProject)
  if (!activeAccountValue) blockers.push('No active gcloud account is visible.')
  if (lastGcloudValue(projectDescribe) !== sam2FeatureE2EConfig.projectId) blockers.push('gcloud cannot describe project reeditpro.')
  for (const [label, output, expected] of [
    ['source media bucket', sourceBucket, sam2FeatureE2EConfig.sourceMediaBucket],
    ['final exports bucket', finalExportsBucket, sam2FeatureE2EConfig.finalExportsBucket],
    ['generated-assets bucket', generatedBucket, sam2FeatureE2EConfig.generatedAssetsBucket],
    ['masks bucket', masksBucket, sam2FeatureE2EConfig.masksBucket],
    ['previews bucket', previewsBucket, sam2FeatureE2EConfig.previewsBucket],
    ['QA bucket', qaBucket, sam2FeatureE2EConfig.qaBucket],
    ['worker temp bucket', tempBucket, sam2FeatureE2EConfig.workerTempBucket],
  ] as const) {
    if (lastGcloudValue(output) !== expected) blockers.push(`${label} is not reachable.`)
    await assertBucketPrivate(expected, blockers)
  }
  for (const [label, output] of [
    ['approved Phase 28 source video', approvedSource],
    ['approved Phase 32 preview export', approvedPreview],
    ['approved SAM2 checkpoint', checkpoint],
    ['approved SAM2 config', config],
    ['approved SAM2 manifest', manifest],
  ] as const) {
    if (Number(lastGcloudValue(output)) <= 0) blockers.push(`${label} is missing or empty.`)
  }
  if (lastGcloudValue(jobDescribe) !== sam2FeatureE2EConfig.runtimeJobName) blockers.push('SAM2 runtime Cloud Run job is not reachable.')
  if (lastGcloudValue(serviceAccount) !== sam2FeatureE2EConfig.gpuServiceAccountEmail) blockers.push('GPU worker service account is not reachable.')

  const validation = validateSam2FeatureE2EExecutionEnv({
    projectId: process.env.GCP_PROJECT_ID,
    activeProject: activeProjectValue,
    region: process.env.GCP_REGION,
    env: process.env.REEDITPRO_ENV,
    confirmation: process.env.REEDITPRO_CONFIRM_SAM2_FEATURE_E2E,
    runtimeMode: sam2FeatureE2EConfig.runtimeMode,
    selectedSource: sam2FeatureE2EConfig.approvedPreviewSource,
    modelGcsPath: sam2FeatureE2EConfig.modelGcsPath,
    checkpointSha256: sam2FeatureE2EConfig.checkpointSha256,
    configSha256: sam2FeatureE2EConfig.configSha256,
    aggregateSha256: sam2FeatureE2EConfig.aggregateSha256,
    text: sam2FeatureE2EConfig.approvedText,
    previewWidth: sam2FeatureE2EConfig.previewWidth,
    previewHeight: sam2FeatureE2EConfig.previewHeight,
    fps: input.fps ?? sam2FeatureE2EConfig.preferredFps,
    frameCount: input.frameCount,
    maxFrames: sam2FeatureE2EConfig.maxFrames,
    providerExecutionEnabled: process.env.PROVIDER_EXECUTION_ENABLED ?? 'false',
    publicAccessEnabled: process.env.PUBLIC_ACCESS_ENABLED ?? 'false',
    productionReady: process.env.REEDITPRO_PRODUCTION_READY ?? 'false',
    externalBeta: process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false',
    paidProduction: process.env.REEDITPRO_PAID_PRODUCTION_READY ?? 'false',
    broadRealMedia: process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false',
    fullVideoMaskEnabled: process.env.FULL_VIDEO_MASK_ENABLED ?? 'false',
    fullVideoTextBehindSubjectEnabled: process.env.FULL_VIDEO_TEXT_BEHIND_SUBJECT_ENABLED ?? 'false',
    finalExportEnabled: process.env.FINAL_EXPORT_ENABLED ?? 'false',
    realEsrganEnabled: process.env.REAL_ESRGAN_EXECUTION_ENABLED ?? 'false',
  })

  return {
    allowed: blockers.length === 0 && validation.allowed,
    blockers: [...validation.blockers, ...blockers],
    warnings: validation.warnings,
    activeAccount: activeAccountValue,
    activeProject: activeProjectValue,
  }
}

async function ensureSam2FeatureE2EIamBindings(): Promise<string[]> {
  const changes: string[] = []
  const runtimePlans = buildSam2FeatureE2EIamPlan().filter((plan) => plan.member === `serviceAccount:${sam2FeatureE2EConfig.gpuServiceAccountEmail}`)
  for (const plan of runtimePlans) {
    const policy = await runGcloud(['storage', 'buckets', 'get-iam-policy', `gs://${plan.bucket}`, '--format=json'])
    if (/allUsers|allAuthenticatedUsers/.test(policy)) throw new Error(`Bucket ${plan.bucket} has a public principal in IAM policy.`)
    if (policy.includes(plan.member) && policy.includes(plan.role) && policy.includes(plan.conditionTitle)) {
      changes.push(`existing:${plan.bindingId}`)
      continue
    }
    await runGcloud([
      'storage',
      'buckets',
      'add-iam-policy-binding',
      `gs://${plan.bucket}`,
      `--member=${plan.member}`,
      `--role=${plan.role}`,
      `--condition=title=${plan.conditionTitle},expression=${plan.conditionExpression},description=${plan.description}`,
    ])
    changes.push(`added:${plan.bindingId}`)
  }
  return changes
}

async function composeSam2FeaturePreviewFrames(input: {
  runId: string
  runtimeReport: Sam2FeatureRuntimeReport
  artifactPrefix: string
}): Promise<Sam2FeatureE2EExecutionReport['composition']> {
  const mediaDir = path.join(os.tmpdir(), `reeditpro-phase35f-composition-${input.runId}`)
  const frameDir = path.join(mediaDir, 'frames')
  const maskDir = path.join(mediaDir, 'masks')
  const previewDir = path.join(mediaDir, 'preview-frames')
  await mkdir(frameDir, { recursive: true })
  await mkdir(maskDir, { recursive: true })
  await mkdir(previewDir, { recursive: true })
  const basePlan = buildSegmentTextBehindSubjectPreviewCompositionPlan()
  const plan = {
    ...basePlan,
    frameCount: input.runtimeReport.previewScope.frameCount,
    frameWidth: input.runtimeReport.previewScope.width,
    frameHeight: input.runtimeReport.previewScope.height,
    promptBoundingBox: input.runtimeReport.prompt.scaledBoundingBox,
  } as unknown as SegmentTextBehindSubjectPreviewCompositionPlan
  const previewFrameUris: string[] = []
  const frameMaskMap: Array<{ frameIndex: number; sourceFrameUri: string; sourceMaskUri: string; previewFrameUri: string }> = []
  const artifacts: Sam2FeatureArtifact[] = []
  try {
    for (let index = 0; index < input.runtimeReport.frames.frameUris.length; index += 1) {
      const sourceFrameUri = input.runtimeReport.frames.frameUris[index]
      const sourceMaskUri = input.runtimeReport.masks.maskUris[index]
      const framePath = path.join(frameDir, `frame-${String(index).padStart(3, '0')}.png`)
      const maskPath = path.join(maskDir, `frame-${String(index).padStart(3, '0')}-mask.png`)
      const previewPath = path.join(previewDir, `frame-${String(index).padStart(3, '0')}-preview.png`)
      await downloadGcsFile(sourceFrameUri, framePath)
      await downloadGcsFile(sourceMaskUri, maskPath)
      await composeSegmentTextBehindSubjectPreviewFrame({ framePath, maskPath, outputPath: previewPath, plan })
      const artifact = await uploadFile(sam2FeatureE2EConfig.previewsBucket, `${input.artifactPrefix}/preview-frames/frame-${String(index).padStart(3, '0')}-preview.png`, previewPath)
      artifacts.push({ id: `preview-frame-${index}`, kind: 'preview_frame', ...artifact })
      previewFrameUris.push(artifact.gcsUri)
      frameMaskMap.push({ frameIndex: index, sourceFrameUri, sourceMaskUri, previewFrameUri: artifact.gcsUri })
    }

    const textStyleArtifact = await uploadJson(sam2FeatureE2EConfig.generatedAssetsBucket, `${input.artifactPrefix}/metadata/text-style.json`, {
      phase: '35F',
      runId: input.runId,
      text: plan.text,
      textStyle: plan.textStyle,
      position: plan.position,
      renderer: plan.renderer,
    })
    const sourceFrameMaskMapArtifact = await uploadJson(sam2FeatureE2EConfig.generatedAssetsBucket, `${input.artifactPrefix}/metadata/source-frame-mask-map.json`, {
      phase: '35F',
      runId: input.runId,
      frameMaskPairs: frameMaskMap,
    })
    const compositionManifestArtifact = await uploadJson(sam2FeatureE2EConfig.generatedAssetsBucket, `${input.artifactPrefix}/composition/composition-manifest.json`, {
      phase: '35F',
      runId: input.runId,
      manifestKind: 'sam2_feature_e2e_text_behind_subject_composition_manifest',
      textLayerPlan: plan,
      previewScope: input.runtimeReport.previewScope,
      outputPreviewFrames: previewFrameUris,
      previewClipGenerated: false,
      renderMode: 'private_bounded_preview_frames',
      full4KProcessingAllowed: false,
      finalExportAllowed: false,
      providerAllowed: false,
      revideoAllowed: false,
    })
    const privateReviewManifestArtifact = await uploadJson(sam2FeatureE2EConfig.previewsBucket, `${input.artifactPrefix}/review/private-review-manifest.json`, {
      phase: '35F',
      runId: input.runId,
      source: input.runtimeReport.source.inputVideoGcsUri,
      previewScope: input.runtimeReport.previewScope,
      previewFrameUris,
      previewClipGenerated: false,
      privateReviewOnly: true,
      publicAccessAllowed: false,
    })
    await uploadJson(sam2FeatureE2EConfig.generatedAssetsBucket, `${input.artifactPrefix}/metadata/sam2-feature-e2e-metadata.json`, {
      phase: '35F',
      runId: input.runId,
      runtimeReportUri: input.runtimeReport.uploadedReport.gcsUri,
      previewFrameCount: previewFrameUris.length,
      previewClipGenerated: false,
    })
    return {
      method: 'native_node_png_alpha_composite',
      previewFrameUris,
      previewClipGenerated: false,
      compositionManifestUri: compositionManifestArtifact.gcsUri,
      privateReviewManifestUri: privateReviewManifestArtifact.gcsUri,
      sourceFrameMaskMapUri: sourceFrameMaskMapArtifact.gcsUri,
      textStyleUri: textStyleArtifact.gcsUri,
    }
  } finally {
    await rm(mediaDir, { recursive: true, force: true })
  }
}

function buildRuntimeEnvVars(input: {
  runId: string
  imageRef: string
  imageDigest: string
  previewScope: { startSeconds: number; durationSeconds: number; frameCount: number; width: number; height: number; fps: number; fullControlledClip: boolean; mode: string }
}): string {
  return [
    'REEDITPRO_ENV=staging',
    'REEDITPRO_CONFIRM_SAM2_FEATURE_E2E=true',
    'REEDITPRO_SAM2_RUNTIME_MODE=sam2_feature_e2e_preview',
    `REEDITPRO_PHASE35F_RUN_ID=${input.runId}`,
    `REEDITPRO_PHASE35F_SOURCE_GCS_URI=${sam2FeatureE2EConfig.approvedPreviewSource}`,
    `REEDITPRO_PHASE35F_TEXT=${sam2FeatureE2EConfig.approvedText}`,
    `REEDITPRO_PHASE35F_SCOPE_MODE=${input.previewScope.mode}`,
    `REEDITPRO_PHASE35F_START_SECONDS=${input.previewScope.startSeconds}`,
    `REEDITPRO_PHASE35F_DURATION_SECONDS=${input.previewScope.durationSeconds}`,
    `REEDITPRO_PHASE35F_FPS=${input.previewScope.fps}`,
    `REEDITPRO_PHASE35F_FRAME_COUNT=${input.previewScope.frameCount}`,
    `REEDITPRO_PHASE35F_MAX_FRAMES=${sam2FeatureE2EConfig.maxFrames}`,
    `REEDITPRO_PHASE35F_FRAME_WIDTH=${input.previewScope.width}`,
    `REEDITPRO_PHASE35F_FRAME_HEIGHT=${input.previewScope.height}`,
    `REEDITPRO_PHASE35F_FULL_CONTROLLED_CLIP=${input.previewScope.fullControlledClip}`,
    `REEDITPRO_SAM2_MODEL_GCS_PATH=${sam2FeatureE2EConfig.modelGcsPath}`,
    `REEDITPRO_SAM2_MODEL_RUNTIME_PATH=${sam2FeatureE2EConfig.modelRuntimePath}`,
    `REEDITPRO_SAM2_CHECKPOINT_SHA256=${sam2FeatureE2EConfig.checkpointSha256}`,
    `REEDITPRO_SAM2_CONFIG_SHA256=${sam2FeatureE2EConfig.configSha256}`,
    `REEDITPRO_SAM2_AGGREGATE_SHA256=${sam2FeatureE2EConfig.aggregateSha256}`,
    `REEDITPRO_IMAGE_REF=${input.imageRef}`,
    `REEDITPRO_IMAGE_DIGEST=${input.imageDigest}`,
    'PROVIDER_EXECUTION_ENABLED=false',
    'MODEL_DOWNLOADS_ENABLED=false',
    'REAL_MEDIA_INPUT_SCOPE=approved_phase35f_controlled_preview_only',
    'FULL_VIDEO_MASK_ENABLED=false',
    'FULL_VIDEO_TEXT_BEHIND_SUBJECT_ENABLED=false',
    'TEXT_BEHIND_SUBJECT_VIDEO_ENABLED=false',
    'FINAL_EXPORT_ENABLED=false',
    'REAL_ESRGAN_EXECUTION_ENABLED=false',
    'PUBLIC_ACCESS_ENABLED=false',
    'REEDITPRO_PRODUCTION_READY=false',
    'REEDITPRO_EXTERNAL_BETA_READY=false',
    'REEDITPRO_PAID_PRODUCTION_READY=false',
    'REEDITPRO_BROAD_REAL_MEDIA_READY=false',
    'HF_HUB_OFFLINE=1',
  ].join(',')
}

async function assertBucketPrivate(bucketName: string, blockers: string[]): Promise<void> {
  try {
    const policy = await runGcloud(['storage', 'buckets', 'get-iam-policy', `gs://${bucketName}`, '--format=json'])
    if (/allUsers|allAuthenticatedUsers/.test(policy)) blockers.push(`Bucket ${bucketName} has a public principal in IAM policy.`)
  } catch (error) {
    blockers.push(`Could not verify bucket ${bucketName} IAM: ${error instanceof Error ? error.message : String(error)}`)
  }
}

async function downloadGcsFile(uri: string, destination: string): Promise<void> {
  await runGcloud(['storage', 'cp', uri, destination])
}

async function uploadJson(bucket: string, object: string, payload: unknown): Promise<Omit<Sam2FeatureArtifact, 'id' | 'kind'>> {
  const body = Buffer.from(`${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  const uploadPath = path.join(os.tmpdir(), `reeditpro-phase35f-upload-${process.pid}-${Date.now()}.json`)
  await writeFile(uploadPath, body)
  await runGcloud(['storage', 'cp', uploadPath, `gs://${bucket}/${object}`])
  await rm(uploadPath, { force: true })
  return { bucket, object, gcsUri: `gs://${bucket}/${object}`, sizeBytes: body.byteLength, sha256: sha256(body) }
}

async function uploadFile(bucket: string, object: string, sourcePath: string): Promise<Omit<Sam2FeatureArtifact, 'id' | 'kind'>> {
  const body = await readFile(sourcePath)
  await runGcloud(['storage', 'cp', sourcePath, `gs://${bucket}/${object}`])
  return { bucket, object, gcsUri: `gs://${bucket}/${object}`, sizeBytes: body.byteLength, sha256: sha256(body) }
}

async function runGcloud(args: string[]): Promise<string> {
  return runCommand('gcloud', args)
}

async function runCommand(command: string, args: string[], timeout = 10 * 60 * 1000): Promise<string> {
  const { stdout } = await execFileAsync(command, args, {
    timeout,
    maxBuffer: 128 * 1024 * 1024,
    env: {
      ...process.env,
      PATH: `/private/tmp/codex-node-runtime/bin:${process.env.PATH ?? ''}`,
      CLOUDSDK_CORE_DISABLE_PROMPTS: '1',
    },
  })
  return stdout
}

function parseImageDigest(output: string): string {
  const match = output.match(/Digest:\s*(sha256:[a-f0-9]{64})/i) ?? output.match(/"(sha256:[a-f0-9]{64})"/i)
  if (!match) throw new Error(`Could not parse image digest from docker inspect output: ${output.slice(0, 500)}`)
  return match[1]
}

function parseExecutionId(output: string): string | undefined {
  return output.match(/Execution \[([^\]]+)\]/)?.[1] ?? output.match(/executions\/([A-Za-z0-9_-]+)/)?.[1]
}

function lastGcloudValue(output: string): string {
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .at(-1) ?? ''
}

function sha256(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex')
}

export function sam2FeatureE2EEvidenceToTypeScript(evidence: ApprovedSam2FeatureE2EEvidence): string {
  return [
    'import type { ApprovedSam2FeatureE2EEvidence } from \'./sam2-feature-e2e-types\'',
    '',
    'export const approvedSam2FeatureE2EEvidence: ApprovedSam2FeatureE2EEvidence = {',
    `  phase: '35F',`,
    `  status: '${evidence.status}',`,
    evidence.runId ? `  runId: '${evidence.runId}',` : undefined,
    evidence.source ? `  source: '${evidence.source}',` : undefined,
    evidence.previewScope ? `  previewScope: ${JSON.stringify(evidence.previewScope, null, 2).replace(/\n/g, '\n  ')},` : undefined,
    evidence.runtimeImage ? `  runtimeImage: '${evidence.runtimeImage}',` : undefined,
    evidence.runtimeImageDigest ? `  runtimeImageDigest: '${evidence.runtimeImageDigest}',` : undefined,
    evidence.cloudRunJobName ? `  cloudRunJobName: '${evidence.cloudRunJobName}',` : undefined,
    evidence.cloudRunExecutionId ? `  cloudRunExecutionId: '${evidence.cloudRunExecutionId}',` : undefined,
    evidence.planSnapshotUri ? `  planSnapshotUri: '${evidence.planSnapshotUri}',` : undefined,
    evidence.generatedAssetsPrefix ? `  generatedAssetsPrefix: '${evidence.generatedAssetsPrefix}',` : undefined,
    evidence.masksPrefix ? `  masksPrefix: '${evidence.masksPrefix}',` : undefined,
    evidence.previewsPrefix ? `  previewsPrefix: '${evidence.previewsPrefix}',` : undefined,
    evidence.qaReportUri ? `  qaReportUri: '${evidence.qaReportUri}',` : undefined,
    evidence.previewFrameCount !== undefined ? `  previewFrameCount: ${evidence.previewFrameCount},` : undefined,
    evidence.previewClipGenerated !== undefined ? `  previewClipGenerated: ${evidence.previewClipGenerated},` : undefined,
    `  featureReadiness: ${JSON.stringify(evidence.featureReadiness, null, 2).replace(/\n/g, '\n  ')},`,
    `  blockers: ${JSON.stringify(evidence.blockers, null, 2).replace(/\n/g, '\n  ')},`,
    `  warnings: ${JSON.stringify(evidence.warnings, null, 2).replace(/\n/g, '\n  ')},`,
    '}',
    '',
    'export function getApprovedSam2FeatureE2EEvidence(): ApprovedSam2FeatureE2EEvidence {',
    '  return {',
    '    ...approvedSam2FeatureE2EEvidence,',
    '    previewScope: approvedSam2FeatureE2EEvidence.previewScope ? { ...approvedSam2FeatureE2EEvidence.previewScope } : undefined,',
    '    featureReadiness: { ...approvedSam2FeatureE2EEvidence.featureReadiness },',
    '    blockers: [...approvedSam2FeatureE2EEvidence.blockers],',
    '    warnings: [...approvedSam2FeatureE2EEvidence.warnings],',
    '  }',
    '}',
    '',
  ].filter((line): line is string => line !== undefined).join('\n')
}
