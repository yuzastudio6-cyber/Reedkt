import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { chmod, lstat, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type {
  PreferenceTechnicalAudioLowLevelEvidence,
  PreferenceTechnicalCaptionRegionSignalEvidence,
  PreferenceTechnicalColorSignalEvidence,
  PreferenceTechnicalMotionSignalEvidence,
  PreferenceTechnicalSourceConditionEvidence,
} from '../../src/types/edit-reference'
import type { RuntimeEnv } from '../config/env'
import {
  buildFFmpegAudioTrimCommand,
  runFFmpegAudioCommand,
} from '../workers/audio/ffmpeg-audio-adapter'
import { runFFmpegCommand } from '../workers/media/ffmpeg-media-adapter'
import {
  assertOutputPathInsideRoot,
  assertSourceNotOverwritten,
} from '../workers/media/media-path-safety'
import { runMediaProbeProductionWorker } from '../workers/media/media-probe-production-worker'
import type { MediaFoundationArtifactSummary } from '../workers/media/media-worker-types'
import { runEditReferenceAudioLowLevelStudy } from './edit-reference-audio-low-level-study'
import { runEditReferenceCaptionRegionSignalStudy } from './edit-reference-caption-region-signal-study'
import { runEditReferenceColorSignalStudy } from './edit-reference-color-signal-study'
import {
  editReferenceLongFormDependencyArtifactKey,
  type ExecuteEditReferenceLongFormChunkMediaStageInput,
} from './edit-reference-long-form-chunk-media-executor'
import {
  validateEditReferenceLongFormSemanticWindowPlan,
  type EditReferenceLongFormSemanticWindow,
  type EditReferenceLongFormSemanticWindowPlan,
} from './edit-reference-long-form-semantic-window-contract'
import {
  validateEditReferenceLongFormStudyWorkOutputAgainstPlan,
  type EditReferenceLongFormStudyOutputArtifact,
  type EditReferenceLongFormStudyWorkOutput,
} from './edit-reference-long-form-study-work-output'
import { runEditReferenceMotionSignalStudy } from './edit-reference-motion-signal-study'
import {
  runEditReferenceSceneBoundaryStudy,
  type EditReferenceSceneBoundaryStudyResult,
} from './edit-reference-scene-boundary-study'
import { runEditReferenceSourceConditionStudy } from './edit-reference-source-condition-study'

export const EDIT_REFERENCE_LONG_FORM_SEMANTIC_WINDOW_EVIDENCE_VERSION =
  'edit-reference-long-form-semantic-window-evidence-v1' as const

const MAX_PRIVATE_FRAME_BYTES = 2 * 1024 * 1024
const MAX_WINDOW_FRAME_COUNT = 24
const SHA256_PATTERN = /^[a-f0-9]{64}$/

/**
 * Runtime-only evidence for one provider-local semantic window. Local paths
 * are intentionally confined to this callback lifetime and are never part of
 * a work output, semantic checkpoint, or API response.
 */
export interface EditReferenceLongFormSemanticWindowEvidenceBundle {
  readonly schemaVersion: typeof EDIT_REFERENCE_LONG_FORM_SEMANTIC_WINDOW_EVIDENCE_VERSION
  readonly semanticWindowId: string
  readonly sourceStartSeconds: number
  readonly sourceEndSeconds: number
  readonly sourceTimeOffsetSeconds: number
  readonly providerLocalStartSeconds: 0
  readonly providerLocalEndSeconds: number
  readonly durationSeconds: number
  readonly outputRoot: string
  readonly analysisProxy: MediaFoundationArtifactSummary
  readonly representativeFrames: readonly MediaFoundationArtifactSummary[]
  readonly keyframes: readonly MediaFoundationArtifactSummary[]
  readonly privateAudioArtifact?: MediaFoundationArtifactSummary
  readonly sampleRate?: 16000
  readonly channels?: 1
  readonly sceneBoundaries: EditReferenceSceneBoundaryStudyResult
  readonly technicalCaptionRegions: PreferenceTechnicalCaptionRegionSignalEvidence
  readonly technicalColor: PreferenceTechnicalColorSignalEvidence
  readonly technicalMotion: PreferenceTechnicalMotionSignalEvidence
  readonly technicalSourceCondition: PreferenceTechnicalSourceConditionEvidence
  readonly technicalAudioLowLevel: PreferenceTechnicalAudioLowLevelEvidence
  readonly dependencyOutputDigestsSha256: readonly string[]
  readonly frameChecksumsSha256: readonly string[]
  readonly exactProviderLocalEvidencePrepared: true
  readonly originalRemainsImmutable: true
  readonly rawProcessOutputPersisted: false
  readonly signedUrlPersisted: false
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
}

export interface EditReferenceLongFormSemanticWindowEvidenceReceipt {
  readonly schemaVersion: typeof EDIT_REFERENCE_LONG_FORM_SEMANTIC_WINDOW_EVIDENCE_VERSION
  readonly semanticWindowId: string
  readonly evidenceDigestSha256: string
  readonly analysisProxyChecksumSha256: string
  readonly privateAudioChecksumSha256: string | null
  readonly frameChecksumsSha256: readonly string[]
  readonly technicalEvidenceDigestSha256: string
  readonly temporaryInputsCleaned: true
  readonly originalRemainsImmutable: true
  readonly localFilePathPersisted: false
  readonly rawMediaPersisted: false
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
}

export interface WithEditReferenceLongFormSemanticWindowEvidenceInput {
  readonly env: RuntimeEnv
  readonly stageInput: ExecuteEditReferenceLongFormChunkMediaStageInput
  readonly semanticWindowPlan: EditReferenceLongFormSemanticWindowPlan
  readonly semanticWindowId: string
}

export interface WithEditReferenceLongFormSemanticWindowEvidenceResult<T> {
  readonly value: T
  readonly receipt: EditReferenceLongFormSemanticWindowEvidenceReceipt
}

/**
 * Creates an exact <=120 second analysis copy from the already-normalized
 * section proxy, copies only the planned checksummed JPEG evidence, creates a
 * matching private audio derivative when audio exists, reruns technical
 * signals against this exact provider-local window, invokes the consumer, and
 * then deletes every temporary input even when the consumer fails.
 */
export async function withEditReferenceLongFormSemanticWindowEvidence<T>(
  input: WithEditReferenceLongFormSemanticWindowEvidenceInput,
  consume: (bundle: EditReferenceLongFormSemanticWindowEvidenceBundle) => Promise<T>,
): Promise<WithEditReferenceLongFormSemanticWindowEvidenceResult<T>> {
  const context = validateAndResolveContext(input)
  const windowRoot = assertOutputPathInsideRoot(
    path.join(
      input.stageInput.outputDirectory,
      `semantic-window-${String(context.window.ordinal).padStart(2, '0')}-${sha256(context.window.semanticWindowId).slice(0, 12)}`,
    ),
    input.stageInput.outputDirectory,
  )
  await resetPrivateGeneratedDirectory(windowRoot, input.stageInput.outputDirectory)
  await mkdir(windowRoot, { recursive: false, mode: 0o700 })
  await chmod(windowRoot, 0o700)

  try {
    const bundle = await prepareBundle({ input, context, windowRoot })
    const receiptDraft = createReceiptDraft(bundle)
    const value = await consume(bundle)
    await removePrivateGeneratedDirectory(windowRoot, input.stageInput.outputDirectory)
    return {
      value,
      receipt: {
        ...receiptDraft,
        temporaryInputsCleaned: true,
      },
    }
  } catch (error) {
    await removePrivateGeneratedDirectory(windowRoot, input.stageInput.outputDirectory).catch(() => undefined)
    throw error
  }
}

interface ResolvedContext {
  readonly window: EditReferenceLongFormSemanticWindow
  readonly analysisProxyOutput: EditReferenceLongFormStudyWorkOutput
  readonly audioOutput?: EditReferenceLongFormStudyWorkOutput
  readonly sceneOutput: EditReferenceLongFormStudyWorkOutput
  readonly visualOutput: EditReferenceLongFormStudyWorkOutput
  readonly colorMotionOutput: EditReferenceLongFormStudyWorkOutput
}

async function prepareBundle(input: {
  readonly input: WithEditReferenceLongFormSemanticWindowEvidenceInput
  readonly context: ResolvedContext
  readonly windowRoot: string
}): Promise<EditReferenceLongFormSemanticWindowEvidenceBundle> {
  const { stageInput } = input.input
  const { window } = input.context
  const timeoutMs = windowStageTimeoutMs(window.durationSeconds)
  const sectionStartSeconds = stageInput.workItem.sourceCoverageStartSeconds
  const localStartSeconds = rounded(window.coreStartSeconds - sectionStartSeconds)
  const sectionProxyPath = await requireVerifiedDependencyArtifactPath({
    stageInput,
    output: input.context.analysisProxyOutput,
    role: 'analysis_proxy',
  })
  const proxyPath = path.join(input.windowRoot, 'analysis-proxy.mp4')
  const analysisProxy = await createWindowProxy({
    env: input.input.env,
    sourceLocalPath: sectionProxyPath,
    outputLocalPath: proxyPath,
    safeOutputRoot: input.windowRoot,
    localStartSeconds,
    durationSeconds: window.durationSeconds,
    timeoutMs,
    semanticWindowId: window.semanticWindowId,
  })
  const frames = await prepareWindowFrames({
    stageInput,
    window,
    visualOutput: input.context.visualOutput,
    windowRoot: input.windowRoot,
  })
  let privateAudioArtifact: MediaFoundationArtifactSummary | undefined
  if (stageInput.plan.source.hasAudio) {
    const audioOutput = input.context.audioOutput
    if (!audioOutput) throw new Error('Semantic-window evidence lacks the exact private section audio output.')
    const sectionAudioPath = await requireVerifiedDependencyArtifactPath({
      stageInput,
      output: audioOutput,
      role: 'study_audio',
    })
    privateAudioArtifact = await createWindowAudio({
      env: input.input.env,
      sourceLocalPath: sectionAudioPath,
      outputLocalPath: path.join(input.windowRoot, 'study-audio.wav'),
      safeOutputRoot: input.windowRoot,
      localStartSeconds,
      durationSeconds: window.durationSeconds,
      timeoutMs,
      semanticWindowId: window.semanticWindowId,
    })
  }
  const [
    sceneBoundaries,
    technicalCaptionRegions,
    technicalColor,
    technicalMotion,
    technicalSourceCondition,
    technicalAudioLowLevel,
  ] = await Promise.all([
    runEditReferenceSceneBoundaryStudy({
      sourceLocalPath: proxyPath,
      ffmpegBin: input.input.env.ffmpegBin,
      timeoutMs,
      durationSeconds: window.durationSeconds,
      maxScanDurationSeconds: window.durationSeconds,
      maxBoundaryCount: 50,
    }),
    runEditReferenceCaptionRegionSignalStudy({
      sourceLocalPath: proxyPath,
      ffmpegBin: input.input.env.ffmpegBin,
      timeoutMs,
      durationSeconds: window.durationSeconds,
      maxScanDurationSeconds: window.durationSeconds,
      maxSampleCount: 24,
    }),
    runEditReferenceColorSignalStudy({
      sourceLocalPath: proxyPath,
      ffmpegBin: input.input.env.ffmpegBin,
      ffprobeBin: input.input.env.ffprobeBin,
      timeoutMs,
      durationSeconds: window.durationSeconds,
      maxScanDurationSeconds: window.durationSeconds,
      maxSampleCount: 12,
    }),
    runEditReferenceMotionSignalStudy({
      sourceLocalPath: proxyPath,
      ffmpegBin: input.input.env.ffmpegBin,
      timeoutMs,
      durationSeconds: window.durationSeconds,
      maxScanDurationSeconds: window.durationSeconds,
      maxSampleCount: 24,
    }),
    runEditReferenceSourceConditionStudy({
      sourceLocalPath: proxyPath,
      ffmpegBin: input.input.env.ffmpegBin,
      timeoutMs,
      durationSeconds: window.durationSeconds,
      maxScanDurationSeconds: window.durationSeconds,
    }),
    runEditReferenceAudioLowLevelStudy({
      sourceAudioLocalPath: privateAudioArtifact?.localFilePath,
      ffmpegBin: input.input.env.ffmpegBin,
      timeoutMs,
      durationSeconds: window.durationSeconds,
      maxScanDurationSeconds: window.durationSeconds,
      hasAudioStream: stageInput.plan.source.hasAudio,
    }),
  ])
  assertTechnicalWindowCoverage({
    sourceHasAudio: stageInput.plan.source.hasAudio,
    durationSeconds: window.durationSeconds,
    sceneBoundaries,
    technicalCaptionRegions,
    technicalColor,
    technicalMotion,
    technicalSourceCondition,
    technicalAudioLowLevel,
  })
  const dependencyOutputDigestsSha256 = [...new Set(stageInput.dependencyOutputs.map((output) => (
    output.outputDigestSha256
  )))]
  if (
    dependencyOutputDigestsSha256.length < 4
    || dependencyOutputDigestsSha256.some((digest) => !SHA256_PATTERN.test(digest))
  ) throw new Error('Semantic-window evidence lost exact dependency-output lineage.')
  return {
    schemaVersion: EDIT_REFERENCE_LONG_FORM_SEMANTIC_WINDOW_EVIDENCE_VERSION,
    semanticWindowId: window.semanticWindowId,
    sourceStartSeconds: window.coreStartSeconds,
    sourceEndSeconds: window.coreEndSeconds,
    sourceTimeOffsetSeconds: window.coreStartSeconds,
    providerLocalStartSeconds: 0,
    providerLocalEndSeconds: window.durationSeconds,
    durationSeconds: window.durationSeconds,
    outputRoot: input.windowRoot,
    analysisProxy,
    representativeFrames: frames.filter((frame) => frame.artifactType === 'representative_frame'),
    keyframes: frames.filter((frame) => frame.artifactType === 'keyframe_image'),
    ...(privateAudioArtifact ? {
      privateAudioArtifact,
      sampleRate: 16000 as const,
      channels: 1 as const,
    } : {}),
    sceneBoundaries,
    technicalCaptionRegions,
    technicalColor,
    technicalMotion,
    technicalSourceCondition,
    technicalAudioLowLevel,
    dependencyOutputDigestsSha256,
    frameChecksumsSha256: frames.map((frame) => frame.checksum as string),
    exactProviderLocalEvidencePrepared: true,
    originalRemainsImmutable: true,
    rawProcessOutputPersisted: false,
    signedUrlPersisted: false,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
  }
}

function validateAndResolveContext(
  input: WithEditReferenceLongFormSemanticWindowEvidenceInput,
): ResolvedContext {
  validateEditReferenceLongFormSemanticWindowPlan(input.semanticWindowPlan)
  const { stageInput } = input
  const window = input.semanticWindowPlan.windows.find((candidate) => (
    candidate.semanticWindowId === input.semanticWindowId
  ))
  if (
    !window
    || stageInput.workItem.stageId !== 'semantic_chunk_synthesis'
    || !stageInput.workItem.chunkId
    || stageInput.workItem.chunkId !== input.semanticWindowPlan.chunkId
    || stageInput.plan.planId !== input.semanticWindowPlan.planId
    || stageInput.plan.planDigestSha256 !== input.semanticWindowPlan.planDigestSha256
    || stageInput.workItem.sourceCoverageStartSeconds !== input.semanticWindowPlan.sourceCoverageStartSeconds
    || stageInput.workItem.sourceCoverageEndSeconds !== input.semanticWindowPlan.sourceCoverageEndSeconds
    || window.durationSeconds <= 0
    || window.durationSeconds > 120
  ) throw new Error('Semantic-window evidence is not bound to the exact semantic work item and window plan.')

  const requireOutput = (stageId: EditReferenceLongFormStudyWorkOutput['stageId']) => {
    const output = stageInput.dependencyOutputs.find((candidate) => (
      candidate.stageId === stageId && candidate.chunkId === stageInput.workItem.chunkId
    ))
    const dependencyItem = output && stageInput.run.workItems.find((candidate) => (
      candidate.workItemId === output.workItemId
    ))
    if (
      !output
      || !dependencyItem
      || dependencyItem.status !== 'completed'
      || !stageInput.workItem.dependencyWorkItemIds.includes(output.workItemId)
    ) throw new Error(`Semantic-window evidence lacks the exact completed ${stageId} dependency.`)
    validateEditReferenceLongFormStudyWorkOutputAgainstPlan({
      output,
      plan: stageInput.plan,
      workItem: dependencyItem,
    })
    return output
  }
  const analysisProxyOutput = requireOutput('analysis_proxy')
  const sceneOutput = requireOutput('scene_boundary_scan')
  const visualOutput = requireOutput('visual_sampling')
  const colorMotionOutput = requireOutput('color_motion_signals')
  const audioOutput = stageInput.plan.source.hasAudio ? requireOutput('audio_extract') : undefined
  if (
    analysisProxyOutput.result.kind !== 'analysis_proxy'
    || sceneOutput.result.kind !== 'scene_boundary_scan'
    || visualOutput.result.kind !== 'visual_sampling'
    || colorMotionOutput.result.kind !== 'color_motion_signals'
    || (audioOutput && audioOutput.result.kind !== 'audio_extract')
    || visualOutput.outputDigestSha256 !== input.semanticWindowPlan.visualSamplingOutputDigestSha256
    || sceneOutput.outputDigestSha256 !== input.semanticWindowPlan.sceneBoundaryOutputDigestSha256
  ) throw new Error('Semantic-window evidence dependency shapes or exact plan digests are invalid.')
  return { window, analysisProxyOutput, audioOutput, sceneOutput, visualOutput, colorMotionOutput }
}

async function prepareWindowFrames(input: {
  readonly stageInput: ExecuteEditReferenceLongFormChunkMediaStageInput
  readonly window: EditReferenceLongFormSemanticWindow
  readonly visualOutput: EditReferenceLongFormStudyWorkOutput
  readonly windowRoot: string
}): Promise<MediaFoundationArtifactSummary[]> {
  if (
    input.window.frames.length < 3
    || input.window.frames.length > MAX_WINDOW_FRAME_COUNT
    || input.visualOutput.result.kind !== 'visual_sampling'
  ) throw new Error('Semantic-window frame plan cannot satisfy all bounded specialists.')
  const framesRoot = path.join(input.windowRoot, 'frames')
  await mkdir(framesRoot, { recursive: false, mode: 0o700 })
  await chmod(framesRoot, 0o700)
  const prepared: MediaFoundationArtifactSummary[] = []
  for (const [index, frame] of input.window.frames.entries()) {
    const artifact = input.visualOutput.artifacts.find((candidate) => (
      candidate.role === 'visual_sample'
      && candidate.sourceTimeSeconds === frame.sourceTimeSeconds
      && candidate.checksumSha256 === frame.frameChecksumSha256
    ))
    if (!artifact) throw new Error('Semantic-window frame lacks its exact checksummed visual-sampling artifact.')
    const sourcePath = await requireVerifiedDependencyArtifactPath({
      stageInput: input.stageInput,
      output: input.visualOutput,
      artifact,
    })
    const bytes = await readFile(sourcePath)
    if (bytes.length < 4 || bytes.length > MAX_PRIVATE_FRAME_BYTES || !validJpeg(bytes)) {
      throw new Error('Semantic-window visual evidence is not a bounded valid private JPEG.')
    }
    const targetPath = assertOutputPathInsideRoot(
      path.join(framesRoot, `frame-${String(index + 1).padStart(2, '0')}.jpg`),
      input.windowRoot,
    )
    await writeFile(targetPath, bytes, { flag: 'wx', mode: 0o600 })
    const checksum = sha256(bytes)
    if (checksum !== frame.frameChecksumSha256) {
      throw new Error('Semantic-window private frame copy changed its exact checksum.')
    }
    prepared.push({
      artifactId: frame.frameEvidenceId,
      artifactType: frame.role === 'keyframe_candidate' ? 'keyframe_image' : 'representative_frame',
      storageBucketPurpose: 'analysis_artifacts',
      storageObjectPath: `semantic-window/${input.window.semanticWindowId}/frame-${index + 1}.jpg`,
      localFilePath: targetPath,
      contentType: 'image/jpeg',
      sizeBytes: bytes.length,
      checksum,
      timeSeconds: frame.providerLocalTimeSeconds,
      sourceOfTruth: true,
      isPrivate: true,
    })
  }
  if (
    prepared.filter((frame) => frame.artifactType === 'representative_frame').length < 2
    || prepared.filter((frame) => frame.artifactType === 'keyframe_image').length !== 1
  ) throw new Error('Semantic-window evidence lacks one keyframe and two distinct representative contexts.')
  return prepared
}

async function createWindowProxy(input: {
  readonly env: RuntimeEnv
  readonly sourceLocalPath: string
  readonly outputLocalPath: string
  readonly safeOutputRoot: string
  readonly localStartSeconds: number
  readonly durationSeconds: number
  readonly timeoutMs: number
  readonly semanticWindowId: string
}): Promise<MediaFoundationArtifactSummary> {
  const output = assertOutputPathInsideRoot(input.outputLocalPath, input.safeOutputRoot)
  assertSourceNotOverwritten(input.sourceLocalPath, output)
  await runFFmpegCommand({
    ffmpegBin: input.env.ffmpegBin,
    timeoutMs: input.timeoutMs,
    expectedOutputPaths: [output],
    purpose: 'create_proxy',
    args: [
      '-hide_banner', '-nostdin', '-loglevel', 'error', '-n',
      '-ss', seconds(input.localStartSeconds),
      '-i', input.sourceLocalPath,
      '-t', seconds(input.durationSeconds),
      '-map', '0:v:0',
      '-an',
      '-vf', 'setpts=PTS-STARTPTS',
      '-fpsmax', '30',
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-crf', '28',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      output,
    ],
  })
  const probe = await runMediaProbeProductionWorker({
    localFilePath: output,
    ffprobeBin: input.env.ffprobeBin,
    timeoutMs: input.timeoutMs,
  })
  const tolerance = Math.max(0.25, 2 / Math.max(1, probe.fps))
  if (
    probe.videoStreams.length !== 1
    || probe.audioStreams.length !== 0
    || probe.width < 1
    || probe.height < 1
    || probe.width > 1280
    || probe.height > 1280
    || probe.fps <= 0
    || probe.fps > 30.01
    || Math.abs(probe.durationSeconds - input.durationSeconds) > tolerance
  ) throw new Error('Semantic-window analysis proxy failed its exact normalized-media validation.')
  await chmod(output, 0o600)
  return artifactSummary({
    artifactId: `semantic-window-proxy-${sha256(input.semanticWindowId).slice(0, 24)}`,
    artifactType: 'proxy_video',
    storageBucketPurpose: 'analysis_artifacts',
    storageObjectPath: `semantic-window/${input.semanticWindowId}/analysis-proxy.mp4`,
    localFilePath: output,
    contentType: 'video/mp4',
  })
}

async function createWindowAudio(input: {
  readonly env: RuntimeEnv
  readonly sourceLocalPath: string
  readonly outputLocalPath: string
  readonly safeOutputRoot: string
  readonly localStartSeconds: number
  readonly durationSeconds: number
  readonly timeoutMs: number
  readonly semanticWindowId: string
}): Promise<MediaFoundationArtifactSummary> {
  const output = assertOutputPathInsideRoot(input.outputLocalPath, input.safeOutputRoot)
  assertSourceNotOverwritten(input.sourceLocalPath, output)
  await runFFmpegAudioCommand({
    ...buildFFmpegAudioTrimCommand({
      sourceAudioLocalPath: input.sourceLocalPath,
      outputAudioLocalPath: output,
      safeOutputRoot: input.safeOutputRoot,
      ffmpegBin: input.env.ffmpegBin,
      timeoutMs: input.timeoutMs,
      operation: 'trim_audio',
      trimStartSeconds: input.localStartSeconds,
      trimDurationSeconds: input.durationSeconds,
      sampleRate: 16000,
      channels: 1,
      runMode: 'local_dev',
    }),
    timeoutMs: input.timeoutMs,
  })
  const probe = await runMediaProbeProductionWorker({
    localFilePath: output,
    ffprobeBin: input.env.ffprobeBin,
    timeoutMs: input.timeoutMs,
  })
  const audio = probe.audioStreams[0]
  if (
    probe.videoStreams.length !== 0
    || probe.audioStreams.length !== 1
    || audio?.sampleRate !== 16000
    || audio?.channels !== 1
    || Math.abs(probe.durationSeconds - input.durationSeconds) > 0.25
  ) throw new Error('Semantic-window private audio failed its exact 16 kHz mono validation.')
  await chmod(output, 0o600)
  return artifactSummary({
    artifactId: `semantic-window-audio-${sha256(input.semanticWindowId).slice(0, 24)}`,
    artifactType: 'extracted_audio',
    storageBucketPurpose: 'analysis_artifacts',
    storageObjectPath: `semantic-window/${input.semanticWindowId}/study-audio.wav`,
    localFilePath: output,
    contentType: 'audio/wav',
  })
}

async function artifactSummary(input: Omit<MediaFoundationArtifactSummary,
  'sizeBytes' | 'checksum' | 'sourceOfTruth' | 'isPrivate'
>): Promise<MediaFoundationArtifactSummary> {
  const file = await lstat(input.localFilePath as string)
  if (!file.isFile() || file.isSymbolicLink() || file.size <= 0) {
    throw new Error('Semantic-window generated derivative is missing, empty, or unsafe.')
  }
  return {
    ...input,
    sizeBytes: file.size,
    checksum: await checksumFile(input.localFilePath as string),
    sourceOfTruth: true,
    isPrivate: true,
  }
}

async function requireVerifiedDependencyArtifactPath(input: {
  readonly stageInput: ExecuteEditReferenceLongFormChunkMediaStageInput
  readonly output: EditReferenceLongFormStudyWorkOutput
  readonly role?: EditReferenceLongFormStudyOutputArtifact['role']
  readonly artifact?: EditReferenceLongFormStudyOutputArtifact
}): Promise<string> {
  const artifact = input.artifact ?? input.output.artifacts.find((candidate) => candidate.role === input.role)
  if (!artifact) throw new Error('Semantic-window dependency artifact is unavailable.')
  const localPath = input.stageInput.dependencyArtifactLocalPaths[
    editReferenceLongFormDependencyArtifactKey(input.output.workItemId, artifact.storageObjectPath)
  ]
  if (!localPath || !path.isAbsolute(localPath)) {
    throw new Error('Semantic-window dependency artifact lacks private local worker authority.')
  }
  const file = await lstat(localPath)
  if (!file.isFile() || file.isSymbolicLink() || file.size !== artifact.sizeBytes || file.size <= 0) {
    throw new Error('Semantic-window dependency artifact identity is unsafe or changed.')
  }
  if (await checksumFile(localPath) !== artifact.checksumSha256) {
    throw new Error('Semantic-window dependency artifact checksum changed before specialist study.')
  }
  return localPath
}

function assertTechnicalWindowCoverage(input: {
  readonly sourceHasAudio: boolean
  readonly durationSeconds: number
  readonly sceneBoundaries: EditReferenceSceneBoundaryStudyResult
  readonly technicalCaptionRegions: PreferenceTechnicalCaptionRegionSignalEvidence
  readonly technicalColor: PreferenceTechnicalColorSignalEvidence
  readonly technicalMotion: PreferenceTechnicalMotionSignalEvidence
  readonly technicalSourceCondition: PreferenceTechnicalSourceConditionEvidence
  readonly technicalAudioLowLevel: PreferenceTechnicalAudioLowLevelEvidence
}): void {
  const verified = [
    input.sceneBoundaries,
    input.technicalCaptionRegions,
    input.technicalColor,
    input.technicalMotion,
    input.technicalSourceCondition,
  ]
  if (verified.some((result) => result.status !== 'verified_local_bounded' || result.coverage !== 'full')) {
    throw new Error('Semantic-window technical evidence did not cover the exact provider-local window.')
  }
  for (const result of verified) {
    if (Math.abs(result.scannedDurationSeconds - input.durationSeconds) > 0.01) {
      throw new Error('Semantic-window technical evidence duration does not match its exact local window.')
    }
  }
  if (input.sourceHasAudio) {
    if (
      input.technicalAudioLowLevel.status !== 'verified_local_bounded'
      || input.technicalAudioLowLevel.coverage !== 'full'
      || Math.abs(input.technicalAudioLowLevel.scannedDurationSeconds - input.durationSeconds) > 0.01
    ) throw new Error('Semantic-window audio evidence did not cover the exact provider-local window.')
  } else if (input.technicalAudioLowLevel.status !== 'not_applicable') {
    throw new Error('Audio-absent semantic-window evidence claimed an audio scan.')
  }
}

function createReceiptDraft(
  bundle: EditReferenceLongFormSemanticWindowEvidenceBundle,
): Omit<EditReferenceLongFormSemanticWindowEvidenceReceipt, 'temporaryInputsCleaned'> {
  const analysisProxyChecksumSha256 = bundle.analysisProxy.checksum as string
  const privateAudioChecksumSha256 = bundle.privateAudioArtifact?.checksum ?? null
  const technicalEvidenceDigestSha256 = sha256(stableJson({
    sceneBoundaries: bundle.sceneBoundaries,
    technicalCaptionRegions: bundle.technicalCaptionRegions,
    technicalColor: bundle.technicalColor,
    technicalMotion: bundle.technicalMotion,
    technicalSourceCondition: bundle.technicalSourceCondition,
    technicalAudioLowLevel: bundle.technicalAudioLowLevel,
  }))
  const evidenceDigestSha256 = sha256(stableJson({
    schemaVersion: bundle.schemaVersion,
    semanticWindowId: bundle.semanticWindowId,
    sourceStartSeconds: bundle.sourceStartSeconds,
    sourceEndSeconds: bundle.sourceEndSeconds,
    sourceTimeOffsetSeconds: bundle.sourceTimeOffsetSeconds,
    providerLocalStartSeconds: bundle.providerLocalStartSeconds,
    providerLocalEndSeconds: bundle.providerLocalEndSeconds,
    analysisProxyChecksumSha256,
    privateAudioChecksumSha256,
    frameChecksumsSha256: bundle.frameChecksumsSha256,
    dependencyOutputDigestsSha256: bundle.dependencyOutputDigestsSha256,
    technicalEvidenceDigestSha256,
  }))
  return {
    schemaVersion: EDIT_REFERENCE_LONG_FORM_SEMANTIC_WINDOW_EVIDENCE_VERSION,
    semanticWindowId: bundle.semanticWindowId,
    evidenceDigestSha256,
    analysisProxyChecksumSha256,
    privateAudioChecksumSha256,
    frameChecksumsSha256: [...bundle.frameChecksumsSha256],
    technicalEvidenceDigestSha256,
    originalRemainsImmutable: true,
    localFilePathPersisted: false,
    rawMediaPersisted: false,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
  }
}

async function resetPrivateGeneratedDirectory(root: string, safeOutputRoot: string): Promise<void> {
  assertOutputPathInsideRoot(root, safeOutputRoot)
  try {
    const file = await lstat(root)
    if (!file.isDirectory() || file.isSymbolicLink()) {
      throw new Error('Semantic-window temporary root is not a private directory.')
    }
    await rm(root, { recursive: true, force: true })
  } catch (error) {
    if (!isNodeError(error, 'ENOENT')) throw error
  }
}

async function removePrivateGeneratedDirectory(root: string, safeOutputRoot: string): Promise<void> {
  assertOutputPathInsideRoot(root, safeOutputRoot)
  try {
    const file = await lstat(root)
    if (!file.isDirectory() || file.isSymbolicLink()) {
      throw new Error('Semantic-window cleanup target is not a private directory.')
    }
    await rm(root, { recursive: true, force: true })
  } catch (error) {
    if (!isNodeError(error, 'ENOENT')) throw error
  }
}

function windowStageTimeoutMs(durationSeconds: number): number {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || durationSeconds > 120) {
    throw new Error('Semantic-window duration is invalid for bounded technical execution.')
  }
  return Math.min(30 * 60 * 1_000, Math.max(2 * 60 * 1_000, Math.ceil(durationSeconds * 8_000)))
}

function validJpeg(bytes: Buffer): boolean {
  return bytes[0] === 0xff
    && bytes[1] === 0xd8
    && bytes.at(-2) === 0xff
    && bytes.at(-1) === 0xd9
}

async function checksumFile(file: string): Promise<string> {
  const hash = createHash('sha256')
  for await (const chunk of createReadStream(file)) hash.update(chunk as Buffer)
  return hash.digest('hex')
}

function seconds(value: number): string {
  return Math.max(0, value).toFixed(3)
}

function rounded(value: number): number {
  return Number(value.toFixed(3))
}

function sha256(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

function isNodeError(error: unknown, code: string): boolean {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === code)
}
