import { createHash } from 'node:crypto'
import type { SoundEventAnchor, SoundFrameRange } from './sound-contracts'
import type { SoundAudioStudyReport } from './sound-local-audio-processor'

function stableId(prefix: string, ...parts: string[]): string {
  return `${prefix}.${createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 20)}`
}

export interface SourceSoundStudy {
  reportId: string
  sourceAudioHash: string
  speechRanges: SoundFrameRange[]
  importantSilenceRangesSeconds: Array<{ startSeconds: number; endSeconds: number }>
  emotionalPauseCandidatesSeconds: Array<{ startSeconds: number; endSeconds: number }>
  loudness: { integratedLufs?: number; truePeakDbtp?: number; rmsDbfs: number; peakDbfs: number }
  clipping: { sampleCount: number; detected: boolean }
  noiseAndHum: { requiresSpecializedReview: boolean; deterministicFinding: string }
  clicksAndTransients: { transientTimesSeconds: number[]; reviewCandidateCount: number }
  existingAmbience: { usableNaturalSoundCandidate: boolean; roomToneCandidateRangesSeconds: Array<{ startSeconds: number; endSeconds: number }> }
  continuity: { neighboringSceneContextRequired: true; wholeVideoReviewRequiredBeforeFinalMix: true }
  decodedEvidence: { sampleRate: number; channels: number; codecName: string; decodedSampleCount: number }
}

export function createSourceSoundStudy(input: {
  sourceAudioHash: string
  technical: SoundAudioStudyReport
  speechRanges: SoundFrameRange[]
}): SourceSoundStudy {
  const silence = input.technical.silenceRangesSeconds.filter(
    (range) => range.endSeconds - range.startSeconds >= 0.2,
  )
  return {
    reportId: stableId('source-sound-study', input.sourceAudioHash),
    sourceAudioHash: input.sourceAudioHash,
    speechRanges: structuredClone(input.speechRanges),
    importantSilenceRangesSeconds: silence,
    emotionalPauseCandidatesSeconds: silence.filter(
      (range) => range.endSeconds - range.startSeconds >= 0.45,
    ),
    loudness: {
      integratedLufs: input.technical.integratedLoudnessLufs,
      truePeakDbtp: input.technical.truePeakDbtp,
      rmsDbfs: input.technical.rmsDbfs,
      peakDbfs: input.technical.peakDbfs,
    },
    clipping: {
      sampleCount: input.technical.clippingSampleCount,
      detected: input.technical.clippingSampleCount > 0,
    },
    noiseAndHum: {
      requiresSpecializedReview: true,
      deterministicFinding: 'Broadband and tonal-noise classification requires the bounded cleanup/QA profile before mutation.',
    },
    clicksAndTransients: {
      transientTimesSeconds: input.technical.transientTimesSeconds,
      reviewCandidateCount: input.technical.transientTimesSeconds.length,
    },
    existingAmbience: {
      usableNaturalSoundCandidate: input.technical.rmsDbfs > -60,
      roomToneCandidateRangesSeconds: silence,
    },
    continuity: {
      neighboringSceneContextRequired: true,
      wholeVideoReviewRequiredBeforeFinalMix: true,
    },
    decodedEvidence: {
      sampleRate: input.technical.sampleRate,
      channels: input.technical.channels,
      codecName: input.technical.codecName,
      decodedSampleCount: input.technical.decodedSampleCount,
    },
  }
}

export interface VisualSoundEventStudy {
  studyId: string
  sourceVisualHash: string
  timingManifestHash: string
  events: Array<{
    anchorId: string
    frame: number
    endFrameExclusive?: number
    actionEvent: string
    contactPoint: boolean
    movement: boolean
    material?: string
    sizeAndWeight: 'unknown' | 'light' | 'medium' | 'heavy'
    velocity: 'unknown' | 'slow' | 'medium' | 'fast'
    perspective: SoundEventAnchor['perspective']
    environment?: string
    titleEvent: boolean
    transitionEvent: boolean
    animationAnchor: boolean
    soundWouldImproveEdit: boolean
  }>
}

export function createVisualSoundEventStudy(input: {
  sourceVisualHash: string
  timingManifestHash: string
  events: Array<SoundEventAnchor & {
    contactPoint?: boolean
    movement?: boolean
    sizeAndWeight?: 'unknown' | 'light' | 'medium' | 'heavy'
    velocity?: 'unknown' | 'slow' | 'medium' | 'fast'
    animationAnchor?: boolean
  }>
}): VisualSoundEventStudy {
  return {
    studyId: stableId('visual-sound-study', input.sourceVisualHash, input.timingManifestHash),
    sourceVisualHash: input.sourceVisualHash,
    timingManifestHash: input.timingManifestHash,
    events: input.events.map((event) => ({
      anchorId: event.anchorId,
      frame: event.frame,
      endFrameExclusive: event.endFrameExclusive,
      actionEvent: event.eventType,
      contactPoint: event.contactPoint ?? event.eventType === 'object_contact',
      movement: event.movement ?? true,
      material: event.material,
      sizeAndWeight: event.sizeAndWeight ?? 'unknown',
      velocity: event.velocity ?? 'unknown',
      perspective: event.perspective,
      environment: event.environment,
      titleEvent: event.eventType === 'title',
      transitionEvent: event.eventType === 'transition',
      animationAnchor: event.animationAnchor ?? true,
      soundWouldImproveEdit: event.soundWouldImproveEdit,
    })),
  }
}

export interface ReferenceSoundDna {
  soundDnaId: string
  referenceSoundHash: string
  onsetSeconds?: number
  attackMilliseconds: number
  decayClass: 'short' | 'medium' | 'long'
  durationSeconds: number
  material: string
  texture: 'smooth' | 'mixed' | 'rough'
  spectralCharacter: 'dark' | 'balanced' | 'bright'
  lowFrequencyWeight: 'light' | 'medium' | 'heavy'
  density: 'sparse' | 'medium' | 'dense'
  perspective: 'close' | 'medium' | 'distant'
  room: 'dry' | 'small' | 'large' | 'exterior' | 'unknown'
  rhythm: 'single' | 'periodic' | 'continuous'
  intensity: 'subtle' | 'medium' | 'strong'
  emotionalFunction: string
  copyProvenanceRisk: 'low' | 'review_required' | 'blocked'
}

export function createReferenceSoundDna(input: {
  referenceSoundHash: string
  technical: SoundAudioStudyReport
  declaredMaterial?: string
  declaredPerspective?: ReferenceSoundDna['perspective']
  declaredRoom?: ReferenceSoundDna['room']
  emotionalFunction: string
  provenanceApproved: boolean
  directCopyRequested: boolean
}): ReferenceSoundDna {
  const onset = input.technical.transientTimesSeconds[0]
  const densityPerSecond = input.technical.transientTimesSeconds.length /
    Math.max(0.001, input.technical.durationSeconds)
  return {
    soundDnaId: stableId('reference-sound-dna', input.referenceSoundHash),
    referenceSoundHash: input.referenceSoundHash,
    onsetSeconds: onset,
    attackMilliseconds: onset === undefined ? 100 : Math.max(1, Math.round(onset * 1_000)),
    decayClass: input.technical.durationSeconds < 1 ? 'short' :
      input.technical.durationSeconds < 4 ? 'medium' : 'long',
    durationSeconds: input.technical.durationSeconds,
    material: input.declaredMaterial ?? 'unknown',
    texture: input.technical.zeroCrossingRate < 0.03 ? 'smooth' :
      input.technical.zeroCrossingRate < 0.12 ? 'mixed' : 'rough',
    spectralCharacter: input.technical.zeroCrossingRate < 0.03 ? 'dark' :
      input.technical.zeroCrossingRate < 0.12 ? 'balanced' : 'bright',
    lowFrequencyWeight: input.technical.rmsDbfs > -12 ? 'heavy' :
      input.technical.rmsDbfs > -28 ? 'medium' : 'light',
    density: densityPerSecond < 0.5 ? 'sparse' : densityPerSecond < 3 ? 'medium' : 'dense',
    perspective: input.declaredPerspective ?? 'medium',
    room: input.declaredRoom ?? 'unknown',
    rhythm: densityPerSecond < 0.5 ? 'single' : densityPerSecond < 3 ? 'periodic' : 'continuous',
    intensity: input.technical.peakDbfs > -3 ? 'strong' : input.technical.peakDbfs > -12 ? 'medium' : 'subtle',
    emotionalFunction: input.emotionalFunction,
    copyProvenanceRisk: !input.provenanceApproved ? 'blocked' :
      input.directCopyRequested ? 'review_required' : 'low',
  }
}
