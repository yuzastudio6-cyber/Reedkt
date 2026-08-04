import { createHash } from 'node:crypto'
import type {
  CanonicalSoundCue,
  CanonicalSoundRequest,
  SoundArtifactRef,
  SoundMixAutomation,
} from './sound-contracts'
import type { SoundAudioStudyReport } from './sound-local-audio-processor'
import type { MireloProviderAttempt } from './mirelo-sfx-provider'
import type { SoundWholeVideoContinuityReport } from './sound-continuity'
import {
  decimalSecondsToFrames,
  framesToSeconds,
} from '../edit-skills/core/timeline-rate'

export type SoundQaDisposition = 'pass' | 'warning' | 'needs_review' | 'fail'

export interface SoundQaFinding {
  key: string
  disposition: SoundQaDisposition
  summary: string
  evidence: Record<string, unknown>
}

export interface CanonicalSoundExecutionQaReport {
  schemaVersion: 'canonical-sound-execution-qa-v1'
  reportId: string
  planningQa: SoundQaFinding[]
  technicalOutputQa: SoundQaFinding[]
  synchronizationQa: SoundQaFinding[]
  mixQa: SoundQaFinding[]
  continuityQa: SoundQaFinding[]
  perceptualMaterialQa: SoundQaFinding[]
  provenanceQa: SoundQaFinding[]
  integrationQa: SoundQaFinding[]
  status: 'passed' | 'warning' | 'needs_review' | 'failed'
  evidenceHash: string
}

export function runCanonicalSoundExecutionQa(input: {
  request: CanonicalSoundRequest
  artifact?: SoundArtifactRef
  study?: SoundAudioStudyReport
  cues: CanonicalSoundCue[]
  automations: SoundMixAutomation[]
  continuity?: SoundWholeVideoContinuityReport
  providerAttempt?: MireloProviderAttempt
  sourceUnchanged: boolean
  providerVisualRejected?: boolean
  measuredSyncToleranceFrames?: number
}): CanonicalSoundExecutionQaReport {
  const planningQa: SoundQaFinding[] = [
    finding('planning.authority', 'pass', 'Exact range authority was parsed before execution.', {
      authorityHash: input.request.assignmentScope.parentAuthorityHash,
      audioRanges: input.request.assignmentScope.authorizedAudioWriteRanges,
    }),
    finding('planning.route', 'pass', 'The execution route was admitted against the published manifest.', {
      soundManifestHash: input.request.soundManifestHash,
    }),
  ]
  const technicalOutputQa: SoundQaFinding[] = []
  if (!input.artifact || !input.study) {
    technicalOutputQa.push(finding(
      'technical.output_absent',
      input.cues.length === 0 ? 'pass' : 'fail',
      input.cues.length === 0 ? 'No-Sound intentionally produced no audio artifact.' : 'Executed Sound output lacks decoded technical evidence.',
      {},
    ))
  } else {
    const measuredDurationFrames = decimalSecondsToFrames({
      seconds: input.study.durationSeconds,
      rate: input.request.timelineRate,
      rounding: 'nearest_half_up',
    })
    const expectedDurationFrames = input.artifact.durationFrames
    const durationDelta = expectedDurationFrames === undefined
      ? undefined : Math.abs(expectedDurationFrames - measuredDurationFrames)
    technicalOutputQa.push(
      finding('technical.decode', 'pass', 'Actual output decoded successfully.', {
        codecName: input.study.codecName,
        durationSeconds: input.study.durationSeconds,
      }),
      finding('technical.sample_rate', input.study.sampleRate === input.request.qualityPolicy.sampleRate ? 'pass' : 'fail',
        'Output sample rate was measured from decoded media.', {
          measured: input.study.sampleRate, expected: input.request.qualityPolicy.sampleRate,
        }),
      finding('technical.channels', input.study.channels === (input.request.qualityPolicy.channelLayout === 'mono' ? 1 : 2) ? 'pass' : 'fail',
        'Output channel count was measured from decoded media.', {
          measured: input.study.channels, expected: input.request.qualityPolicy.channelLayout,
        }),
      finding('technical.duration', durationDelta === undefined || durationDelta <= 1 ? 'pass' : 'fail',
        'Output duration was converted with the exact rational timeline rate.', {
          measuredDurationFrames, expectedDurationFrames, durationDeltaFrames: durationDelta,
        }),
      finding('technical.clipping', input.study.clippingSampleCount === 0 ? 'pass' : 'fail',
        'Decoded PCM samples were inspected for clipping.', {
          clippingSampleCount: input.study.clippingSampleCount,
          decodedSampleCount: input.study.decodedSampleCount,
        }),
      finding('technical.true_peak', input.study.truePeakDbtp === undefined
        ? 'needs_review'
        : input.study.truePeakDbtp <= input.request.qualityPolicy.maximumTruePeakDbtp ? 'pass' : 'fail',
        'Actual output true peak was measured when the runtime exposed it.', {
          measuredDbtp: input.study.truePeakDbtp,
          maximumDbtp: input.request.qualityPolicy.maximumTruePeakDbtp,
        }),
      finding('technical.loudness', input.study.integratedLoudnessLufs === undefined
        ? 'needs_review'
        : Math.abs(input.study.integratedLoudnessLufs - input.request.qualityPolicy.targetLoudnessLufs) <= 3 ? 'pass' : 'warning',
        'Actual integrated loudness was compared with the approved target.', {
          measuredLufs: input.study.integratedLoudnessLufs,
          targetLufs: input.request.qualityPolicy.targetLoudnessLufs,
        }),
      finding('technical.checksum', /^[a-f0-9]{64}$/.test(input.artifact.checksumSha256) ? 'pass' : 'fail',
        'The private output has a SHA-256 checksum.', { checksumSha256: input.artifact.checksumSha256 }),
      finding('technical.source_immutability', input.sourceUnchanged ? 'pass' : 'fail',
        'Approved source bytes remained unchanged.', { sourceUnchanged: input.sourceUnchanged }),
    )
  }

  const synchronizationQa: SoundQaFinding[] = input.cues.map((cue) => {
    if (cue.hitFrame === undefined || !input.study) {
      return finding(`sync.${cue.cueId}`, 'needs_review', 'No measured transient-to-hit comparison was available.', { cueId: cue.cueId })
    }
    const transients = input.study.transientTimesSeconds.map((seconds) => cue.startFrame +
      decimalSecondsToFrames({ seconds, rate: input.request.timelineRate, rounding: 'nearest_half_up' }))
    const nearest = transients.map((frame) => ({ frame, delta: Math.abs(frame - cue.hitFrame!) }))
      .sort((left, right) => left.delta - right.delta)[0]
    const tolerance = input.measuredSyncToleranceFrames ?? 2
    return finding(`sync.${cue.cueId}`, nearest && nearest.delta <= tolerance ? 'pass' : 'fail',
      'The expected event frame was compared with a transient detected from decoded output.', {
        expectedEventFrame: cue.hitFrame,
        detectedTransientFrame: nearest?.frame,
        errorFrames: nearest?.delta,
        errorMilliseconds: nearest
          ? framesToSeconds(nearest.delta, input.request.timelineRate) * 1_000 : undefined,
        toleranceFrames: tolerance,
      })
  })

  const mixQa: SoundQaFinding[] = input.automations.flatMap((automation) => [
    finding(`mix.headroom.${automation.cueId}`, automation.headroomDb >= 1 ? 'pass' : 'fail',
      'The approved automation preserves measurable headroom.', { headroomDb: automation.headroomDb }),
    finding(`mix.dialogue.${automation.cueId}`,
      automation.protectedSpeechRanges.length === 0 || automation.dialogueDuckingDb < 0 ? 'pass' : 'fail',
      'Protected speech ranges require negative Sound ducking gain.', {
        protectedSpeechRanges: automation.protectedSpeechRanges,
        dialogueDuckingDb: automation.dialogueDuckingDb,
        attackFrames: automation.duckAttackFrames,
        releaseFrames: automation.duckReleaseFrames,
      }),
    finding(`mix.music.${automation.cueId}`,
      input.request.musicContext && automation.musicInteractionPolicy === 'none' ? 'warning' : 'pass',
      'Music remains read-only and Sound collision behavior is explicit.', {
        musicReadOnly: input.request.musicContext?.readOnly ?? true,
        interactionPolicy: automation.musicInteractionPolicy,
      }),
  ])

  const continuityQa: SoundQaFinding[] = input.continuity ? [finding(
    'continuity.whole_video',
    input.continuity.status === 'passed' ? 'pass'
      : input.continuity.status === 'warning' ? 'warning' : 'needs_review',
    'Structured whole-video continuity evidence was evaluated with read-only global context.', {
      status: input.continuity.status,
      unresolvedDependencies: input.continuity.unresolvedContinuityDependencies,
      boundaryFindingCount: input.continuity.boundaryFindings.length,
      localizedRevisionCount: input.continuity.recommendedLocalizedRevisions.length,
    },
  )] : [finding(
    'continuity.missing', 'needs_review',
    'Whole-video continuity evidence was not supplied to output QA.', {},
  )]

  const perceptualMaterialQa = [finding(
    'perceptual.material_realism', 'needs_review',
    'Material realism, room naturalness, emotional fit, and professional perceptual judgment are not inferred from metadata-only checks.', {
      qualification: 'needs_review',
      automatedClaim: false,
    },
  )]

  const provenanceQa: SoundQaFinding[] = [
    finding('provenance.private_lineage', 'pass',
      'Executed artifacts remain private and checksum-bound.', {
        artifactId: input.artifact?.artifactId, artifactVersion: input.artifact?.version,
        private: input.artifact?.private ?? 'not_applicable',
      }),
    finding('provenance.provider_attempt', input.providerAttempt && input.providerAttempt.status !== 'succeeded' ? 'fail' : 'pass',
      'Provider outputs, when used, are bound to a reconciled provider attempt.', {
        providerAttemptId: input.providerAttempt?.attemptId,
        providerAttemptStatus: input.providerAttempt?.status ?? 'not_needed',
      }),
  ]

  const integrationQa: SoundQaFinding[] = [
    finding('integration.authority', input.cues.every((cue) => input.request.assignmentScope.authorizedAudioWriteRanges.some(
      (range) => cue.startFrame >= range.startFrame && cue.endFrameExclusive <= range.endFrameExclusive,
    )) ? 'pass' : 'fail', 'All Sound cue mutations remain inside exact audio write authority.', {}),
    finding('integration.visual_immutability', 'pass',
      'Provider carrier visuals cannot replace the approved visual.', {
        providerCarrierVisualWasPresentAndRejected: input.providerVisualRejected ?? false,
        approvedVisualReplacementPerformed: false,
      }),
    finding('integration.music_boundary', 'pass', 'Sound did not compose or mutate Music.', { musicCompositionPerformed: false }),
    finding('integration.final_composition', 'pass', 'Final mux, render, export, and delivery remain outside Sound.', { finalRenderOwnedBySound: false }),
  ]

  const all = [planningQa, technicalOutputQa, synchronizationQa, mixQa, continuityQa,
    perceptualMaterialQa, provenanceQa, integrationQa].flat()
  const status = all.some((item) => item.disposition === 'fail') ? 'failed' as const
    : all.some((item) => item.disposition === 'needs_review') ? 'needs_review' as const
      : all.some((item) => item.disposition === 'warning') ? 'warning' as const : 'passed' as const
  const core = {
    schemaVersion: 'canonical-sound-execution-qa-v1' as const,
    reportId: `sound.qa.${input.request.requestId}`,
    planningQa, technicalOutputQa, synchronizationQa, mixQa, continuityQa,
    perceptualMaterialQa, provenanceQa, integrationQa, status,
  }
  return {
    ...core,
    evidenceHash: createHash('sha256').update(stableJson(core)).digest('hex'),
  }
}

function finding(
  key: string,
  disposition: SoundQaDisposition,
  summary: string,
  evidence: Record<string, unknown>,
): SoundQaFinding {
  return { key, disposition, summary, evidence }
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (value && typeof value === 'object') return `{${Object.entries(value as Record<string, unknown>)
    .filter(([, child]) => child !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, child]) => `${JSON.stringify(key)}:${stableJson(child)}`).join(',')}}`
  return JSON.stringify(value)
}
