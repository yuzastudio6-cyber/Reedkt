import type {
  MediaAnalysisReport,
  MediaAnalysisReportStatus,
  MediaAudioStream,
  MediaKeyframeInfo,
  MediaVideoStream,
} from '../../../src/backend/contracts/media-analysis-report'
import type { ProductionToolIssue } from '../../../src/backend/contracts/production-tool-runtime-contracts'
import type {
  ExtractedAudioResult,
  ExtractedFrameResult,
  MediaProbeResult,
  MediaProxyResult,
} from './media-worker-types'

export interface BuildMediaAnalysisReportInput {
  id?: string
  workspaceId: string
  projectId: string
  mediaAssetId: string
  sourceStorageObjectId: string
  probe: MediaProbeResult
  proxy?: MediaProxyResult
  audio?: ExtractedAudioResult
  keyframes?: ExtractedFrameResult
  representativeFrames?: ExtractedFrameResult
  status?: MediaAnalysisReportStatus
  createdAt?: string
  updatedAt?: string
}

export function buildMediaAnalysisReport(input: BuildMediaAnalysisReportInput): MediaAnalysisReport {
  const now = new Date().toISOString()
  const keyframeArtifacts = input.keyframes?.artifacts ?? []
  const representativeArtifacts = input.representativeFrames?.artifacts ?? []
  const qualityIssues = buildNotRunIssues(input)

  return {
    id: input.id ?? `media-analysis-${input.mediaAssetId}`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    sourceStorageObjectId: input.sourceStorageObjectId,
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
    metadata: {
      durationSeconds: input.probe.durationSeconds,
      width: input.probe.width,
      height: input.probe.height,
      fps: input.probe.fps,
      codecName: input.probe.codecName,
      formatName: input.probe.formatName,
      rotation: input.probe.rotation,
      aspectRatio: input.probe.aspectRatio,
      sizeBytes: input.probe.sizeBytes,
    },
    videoStreams: input.probe.videoStreams.map((stream): MediaVideoStream => ({
      streamIndex: stream.streamIndex,
      codecName: stream.codecName,
      width: stream.width,
      height: stream.height,
      fps: stream.fps,
      durationSeconds: stream.durationSeconds,
      pixelFormat: stream.pixelFormat,
      colorSpace: stream.colorSpace,
      rotation: stream.rotation,
      metadata: {},
    })),
    audioStreams: input.probe.audioStreams.map((stream): MediaAudioStream => ({
      streamIndex: stream.streamIndex,
      codecName: stream.codecName,
      sampleRate: stream.sampleRate,
      channels: stream.channels,
      durationSeconds: stream.durationSeconds,
      metadata: {},
    })),
    proxy: {
      proxyArtifactId: input.proxy?.artifact?.artifactId,
      status: input.proxy?.status === 'created' ? 'created' : 'planned',
      width: input.proxy?.width,
      height: input.proxy?.height,
      durationSeconds: input.proxy?.durationSeconds,
      notes: input.proxy?.status === 'created'
        ? 'Milestone 6 local/dev proxy artifact created.'
        : 'Proxy creation not run or skipped in this report.',
    },
    keyframes: keyframeArtifacts.map((artifact, index): MediaKeyframeInfo => ({
      artifactId: artifact.artifactId,
      timeSeconds: artifact.timeSeconds ?? 0,
      frameNumber: artifact.frameNumber ?? index + 1,
      reason: 'Milestone 6 bounded keyframe/sample extraction artifact.',
      confidence: 0.5,
    })),
    sceneAnalysis: {
      sceneCount: 0,
      boundaries: [],
      transitionCandidates: [],
      confidence: 0,
    },
    speechAnalysis: {
      speechDetected: false,
      transcriptArtifactId: undefined,
      wordTimestampArtifactId: undefined,
      language: undefined,
      confidence: 0,
      fillerSegments: [],
      repeatedTakeCandidates: [],
    },
    audioAnalysis: {
      noiseLevel: undefined,
      loudness: undefined,
      clippingDetected: false,
      musicDetected: false,
      musicSpeechOverlap: false,
      silenceSegments: [],
      energyCurveArtifactId: input.audio?.artifact?.artifactId,
      issues: [{
        code: 'audio_analysis_not_run',
        message: 'Milestone 6 extracts audio when requested but does not run cleanup/noise/loudness analysis yet.',
        severity: 'info',
      }],
    },
    visualAnalysis: {
      blurScoresArtifactId: representativeArtifacts[0]?.artifactId,
      motionCurveArtifactId: undefined,
      faceRegionsArtifactId: undefined,
      safeZoneReportArtifactId: undefined,
      productOrObjectRegionsArtifactId: undefined,
      issues: [{
        code: 'visual_cv_not_run',
        message: 'Milestone 6 extracts frames but does not run OpenCV visual analysis yet.',
        severity: 'info',
      }],
    },
    colorAnalysis: {
      colorSpaceAssumption: input.probe.videoStreams[0]?.colorSpace,
      transferAssumption: undefined,
      hdrDetected: false,
      underexposed: false,
      overexposed: false,
      whiteBalanceIssue: false,
      shotMismatch: false,
      skinToneRisk: false,
      histogramArtifactId: undefined,
      representativeFramesArtifactId: representativeArtifacts[0]?.artifactId,
      issues: [{
        code: 'color_analysis_not_run',
        message: 'Milestone 6 extracts representative frames but does not run grading, OpenColorIO, or histogram analysis.',
        severity: 'info',
      }],
    },
    ocrAnalysis: {
      ocrNeeded: false,
      sampledFrameCount: representativeArtifacts.length,
      textRegionsArtifactId: undefined,
      importantTextRegions: [],
      confidence: 0,
    },
    qualityIssues,
    recommendedRecipeIds: [],
    status: input.status ?? 'partial',
  }
}

function buildNotRunIssues(input: BuildMediaAnalysisReportInput): ProductionToolIssue[] {
  const issues: ProductionToolIssue[] = [{
    code: 'media_analysis_foundation_partial',
    message: 'Milestone 6 report includes probe/proxy/audio/frame foundation only; later speech, scene, audio, color, OCR, mask, and render QA workers have not run.',
    severity: 'info',
  }]

  if (input.probe.audioStreams.length > 0 && input.audio?.status !== 'created') {
    issues.push({
      code: 'audio_stream_present_audio_extract_not_run',
      message: 'Audio stream exists, but extracted audio artifact is not present in this report.',
      severity: 'warning',
    })
  }

  return issues
}
