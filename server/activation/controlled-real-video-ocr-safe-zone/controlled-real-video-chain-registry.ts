import { getApprovedOcrRuntimeEvidence } from '../ocr-runtime'
import { controlledRealVideoOcrSafeZoneConfig, validateControlledRealVideoSampleCandidate } from './controlled-real-video-ocr-safe-zone-policy'
import type {
  ControlledRealVideoCaptionZone,
  ControlledRealVideoChainEvidence,
  ControlledRealVideoSampleCandidate,
} from './controlled-real-video-ocr-safe-zone-types'

const captionZones: ControlledRealVideoCaptionZone[] = [
  {
    zoneId: 'vertical_lower_caption_safe_zone',
    label: 'Future lower caption safe-zone review band',
    x: 0.08,
    y: 0.68,
    width: 0.84,
    height: 0.2,
    coordinateSpace: 'normalized',
    purpose: 'caption_safe_zone',
    required: true,
  },
  {
    zoneId: 'full_frame_ocr_review_zone',
    label: 'Future whole-frame text-region review zone',
    x: 0,
    y: 0,
    width: 1,
    height: 1,
    coordinateSpace: 'normalized',
    purpose: 'expected_ocr_review_zone',
    required: true,
  },
  {
    zoneId: 'top_ui_avoid_zone',
    label: 'Future upper UI/source-label avoid zone',
    x: 0,
    y: 0,
    width: 1,
    height: 0.14,
    coordinateSpace: 'normalized',
    purpose: 'avoid_region',
    required: false,
  },
]

export function getApprovedControlledRealVideoChainEvidence(): ControlledRealVideoChainEvidence {
  const ocrRuntimeEvidence = getApprovedOcrRuntimeEvidence()
  const blockers: string[] = []
  const warnings = [
    ...ocrRuntimeEvidence.warnings,
    'Phase 37D references prior Track A phase IDs only as inert metadata; no Track A modules are imported or executed.',
    'The 6.9s-8.9s future sample window is reused from prior controlled-chain metadata and is not extracted in Phase 37D.',
  ]

  if (ocrRuntimeEvidence.status !== 'verified') blockers.push('phase37c_generated_ocr_runtime_not_verified')
  if (!ocrRuntimeEvidence.runId) blockers.push('phase37c_run_id_missing')
  if (!ocrRuntimeEvidence.artifactPrefix) blockers.push('phase37c_artifact_prefix_missing')
  if (!ocrRuntimeEvidence.phase37DReadiness.readyForControlledRealVideoOcrSafeZone) blockers.push('phase37c_not_ready_for_controlled_real_video_ocr_safe_zone')

  return {
    chainId: controlledRealVideoOcrSafeZoneConfig.selectedChainId,
    status: blockers.length ? 'blocked' : 'approved_for_phase37d_metadata_gate',
    phaseRunIds: {
      phase28: 'phase28-20260528T01552',
      phase29: 'phase29-20260528T02254',
      phase30: 'phase30-20260528T12421',
      phase31: 'phase31-20260528T13060',
      phase32: 'phase32-20260528T13330',
    },
    phase32Export: {
      gcsUri: controlledRealVideoOcrSafeZoneConfig.selectedSourceGcsUri,
      sizeBytes: 94522751,
      sha256: controlledRealVideoOcrSafeZoneConfig.selectedSourceSha256,
      durationSeconds: controlledRealVideoOcrSafeZoneConfig.expectedSourceDurationSeconds,
      width: 2160,
      height: 3840,
      privateOnly: true,
      publicUrlCreated: false,
      signedUrlSourceOfTruthCreated: false,
    },
    phase37BAssets: {
      modelGcsPath: ocrRuntimeEvidence.modelGcsPath,
      aggregateSha256: ocrRuntimeEvidence.aggregateSha256,
    },
    phase37CRuntime: {
      runId: ocrRuntimeEvidence.runId ?? 'missing',
      artifactPrefix: ocrRuntimeEvidence.artifactPrefix ?? 'missing',
      readyForControlledRealVideoOcrSafeZone: ocrRuntimeEvidence.phase37DReadiness.readyForControlledRealVideoOcrSafeZone,
      dictionaryPathLimitationCarriedForward: true,
    },
    metadataReferences: [
      'docs/activation-phase-28-first-real-video-speech-caption-results.md',
      'docs/activation-phase-29-real-video-smart-cut-caption-results.md',
      'docs/activation-phase-30-real-video-private-export-results.md',
      'docs/activation-phase-31-real-video-audio-cleanup-results.md',
      'docs/activation-phase-32-real-video-color-correction-results.md',
      'docs/activation-phase-37b-paddleocr-exact-assets-download.md',
      'docs/activation-phase-37c-generated-ocr-runtime-verification.md',
      'docs/activation-readiness-state.md',
    ],
    trackAReferencesAreMetadataOnly: true,
    blockers,
    warnings,
  }
}

export function getControlledRealVideoOcrSafeZoneSampleCandidates(): ControlledRealVideoSampleCandidate[] {
  const sample: ControlledRealVideoSampleCandidate = {
    sampleId: controlledRealVideoOcrSafeZoneConfig.selectedSampleId,
    chainId: controlledRealVideoOcrSafeZoneConfig.selectedChainId,
    sourceGcsUri: controlledRealVideoOcrSafeZoneConfig.selectedSourceGcsUri,
    sourceSha256: controlledRealVideoOcrSafeZoneConfig.selectedSourceSha256,
    sourceDurationSeconds: controlledRealVideoOcrSafeZoneConfig.expectedSourceDurationSeconds,
    plannedWindow: {
      startSeconds: controlledRealVideoOcrSafeZoneConfig.selectedWindowStartSeconds,
      endSeconds: controlledRealVideoOcrSafeZoneConfig.selectedWindowEndSeconds,
      durationSeconds: 2,
    },
    plannedFrameOffsetsSeconds: controlledRealVideoOcrSafeZoneConfig.selectedFrameOffsetsSeconds,
    maxSampledFrames: controlledRealVideoOcrSafeZoneConfig.selectedMaxSampledFrames,
    selected: true,
    privateGcsSourceOnly: true,
    mediaBytesRead: false,
    frameExtractionPerformed: false,
    realVideoOcrPerformed: false,
    artifactUploadPerformed: false,
    captionRenderIntegrationPerformed: false,
    expectedCaptionZones: captionZones.map((zone) => ({ ...zone })),
    blockers: [],
    warnings: [
      'Future execution must verify actual frame count and duration before extraction.',
      'Future OCR must preserve the Phase 37C network/model-download guard and block if PP-LCNet_x1_0_textline_ori is auto-downloaded.',
    ],
  }
  const validation = validateControlledRealVideoSampleCandidate(sample)
  return [{
    ...sample,
    expectedCaptionZones: sample.expectedCaptionZones.map((zone) => ({ ...zone })),
    blockers: [...validation.blockers],
    warnings: [...sample.warnings, ...validation.warnings],
  }]
}

export function getSelectedControlledRealVideoOcrSafeZoneSample(): ControlledRealVideoSampleCandidate {
  const [sample] = getControlledRealVideoOcrSafeZoneSampleCandidates()
  if (!sample) throw new Error('Phase 37D selected sample is missing.')
  return {
    ...sample,
    plannedWindow: { ...sample.plannedWindow },
    plannedFrameOffsetsSeconds: [...sample.plannedFrameOffsetsSeconds] as unknown as ControlledRealVideoSampleCandidate['plannedFrameOffsetsSeconds'],
    expectedCaptionZones: sample.expectedCaptionZones.map((zone) => ({ ...zone })),
    blockers: [...sample.blockers],
    warnings: [...sample.warnings],
  }
}

export function buildControlledRealVideoOcrSafeZoneSampleManifest(createdAt = new Date().toISOString()) {
  return {
    manifestId: 'phase37d_selected_controlled_real_video_sample_manifest',
    createdAt,
    selectedOnly: true,
    candidates: getControlledRealVideoOcrSafeZoneSampleCandidates(),
  }
}

export function buildControlledRealVideoOcrSafeZoneFrameSamplingManifest(createdAt = new Date().toISOString()) {
  const sample = getSelectedControlledRealVideoOcrSafeZoneSample()
  return {
    manifestId: 'phase37d_future_frame_sampling_manifest',
    createdAt,
    sampleId: sample.sampleId,
    sourceGcsUri: sample.sourceGcsUri,
    metadataOnly: true,
    noFrameExtractionPerformed: true,
    plannedWindow: sample.plannedWindow,
    plannedFrameOffsetsSeconds: [...sample.plannedFrameOffsetsSeconds],
    maxSampledFrames: sample.maxSampledFrames,
    hardLimits: {
      maxWindows: controlledRealVideoOcrSafeZoneConfig.maxWindows,
      maxFramesAcrossAllWindows: controlledRealVideoOcrSafeZoneConfig.maxSampledFrames,
      selectedWindowCount: 1,
    },
  }
}
