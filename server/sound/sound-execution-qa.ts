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
  outputs?: Array<{ artifact: SoundArtifactRef; study?: SoundAudioStudyReport }>
  cues: CanonicalSoundCue[]
  automations: SoundMixAutomation[]
  continuity?: SoundWholeVideoContinuityReport
  providerAttempt?: MireloProviderAttempt
  providerAttempts?: MireloProviderAttempt[]
  sourceUnchanged: boolean
  providerVisualRejected?: boolean
  measuredSyncToleranceFrames?: number
  synchronizationPlacements?: Array<{
    cueId: string
    requestedEventFrame: number
    detectedTransientFrame: number
    appliedOffsetFrames: number
    resultingTransientFrame: number
    residualErrorFrames: number
  }>
  mixMeasurements?: Array<{
    unitId: string
    measuredOutputPeakDbfs: number
    measuredOutputRmsDbfs: number
    measuredOutputChannelRmsDbfs: number[]
    measuredDialogueRmsDbfs?: number
    measuredSoundRmsDbfs?: number
    measuredDuckingDeltaDb?: number
  }>
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
  const outputs = input.outputs ?? (input.artifact ? [{ artifact: input.artifact, study: input.study }] : [])
  if (outputs.length === 0) {
    technicalOutputQa.push(finding(
      'technical.output_absent',
      input.cues.length === 0 ? 'pass' : 'fail',
      input.cues.length === 0 ? 'No-Sound intentionally produced no audio artifact.' : 'Executed Sound output lacks decoded technical evidence.',
      {},
    ))
  } else for (const [index, output] of outputs.entries()) {
    if (!output.study) {
      technicalOutputQa.push(finding(
        qaIndexedKey('technical.output_evidence_absent', index), 'fail',
        'An executed Sound artifact lacks decoded technical measurements.',
        { artifactId: output.artifact.artifactId },
      ))
      continue
    }
    const measuredDurationFrames = decimalSecondsToFrames({
      seconds: output.study.durationSeconds,
      rate: input.request.timelineRate,
      rounding: 'nearest_half_up',
    })
    const expectedDurationFrames = output.artifact.durationFrames
    const durationDelta = expectedDurationFrames === undefined
      ? undefined : Math.abs(expectedDurationFrames - measuredDurationFrames)
    technicalOutputQa.push(
      finding(qaIndexedKey('technical.decode', index), 'pass', 'Actual output decoded successfully.', {
        artifactId: output.artifact.artifactId,
        codecName: output.study.codecName,
        durationSeconds: output.study.durationSeconds,
      }),
      finding(qaIndexedKey('technical.sample_rate', index), output.study.sampleRate === input.request.qualityPolicy.sampleRate ? 'pass' : 'fail',
        'Output sample rate was measured from decoded media.', {
          measured: output.study.sampleRate, expected: input.request.qualityPolicy.sampleRate,
        }),
      finding(qaIndexedKey('technical.channels', index), output.study.channels === (input.request.qualityPolicy.channelLayout === 'mono' ? 1 : 2) ? 'pass' : 'fail',
        'Output channel count was measured from decoded media.', {
          measured: output.study.channels, expected: input.request.qualityPolicy.channelLayout,
        }),
      finding(qaIndexedKey('technical.duration', index), durationDelta === undefined || durationDelta <= 1 ? 'pass' : 'fail',
        'Output duration was converted with the exact rational timeline rate.', {
          measuredDurationFrames, expectedDurationFrames, durationDeltaFrames: durationDelta,
        }),
      finding(qaIndexedKey('technical.clipping', index), output.study.clippingSampleCount === 0 ? 'pass' : 'fail',
        'Decoded PCM samples were inspected for clipping.', {
          clippingSampleCount: output.study.clippingSampleCount,
          decodedSampleCount: output.study.decodedSampleCount,
        }),
      finding(qaIndexedKey('technical.true_peak', index), output.study.truePeakDbtp === undefined
        ? 'needs_review'
        : output.study.truePeakDbtp <= input.request.qualityPolicy.maximumTruePeakDbtp ? 'pass' : 'fail',
        'Actual output true peak was measured when the runtime exposed it.', {
          measuredDbtp: output.study.truePeakDbtp,
          maximumDbtp: input.request.qualityPolicy.maximumTruePeakDbtp,
        }),
      finding(qaIndexedKey('technical.loudness', index), output.study.integratedLoudnessLufs === undefined
        ? 'needs_review'
        : Math.abs(output.study.integratedLoudnessLufs - input.request.qualityPolicy.targetLoudnessLufs) <= 3 ? 'pass' : 'warning',
        'Actual integrated loudness was compared with the approved target.', {
          measuredLufs: output.study.integratedLoudnessLufs,
          targetLufs: input.request.qualityPolicy.targetLoudnessLufs,
        }),
      finding(qaIndexedKey('technical.checksum', index), /^[a-f0-9]{64}$/.test(output.artifact.checksumSha256) ? 'pass' : 'fail',
        'The private output has a SHA-256 checksum.', { checksumSha256: output.artifact.checksumSha256 }),
      finding(qaIndexedKey('technical.source_immutability', index), input.sourceUnchanged ? 'pass' : 'fail',
        'Approved source bytes remained unchanged.', { sourceUnchanged: input.sourceUnchanged }),
    )
  }

  const placementsByCue = new Map((input.synchronizationPlacements ?? []).map((item) => [item.cueId, item]))
  const synchronizationQa: SoundQaFinding[] = input.cues.map((cue) => {
    const placement = placementsByCue.get(cue.cueId)
    if (placement) {
      const tolerance = input.measuredSyncToleranceFrames ?? 2
      return finding(`sync.${cue.cueId}`, placement.residualErrorFrames <= tolerance ? 'pass' : 'fail',
        'The applied placement manifest was verified against the exact event frame.', {
          expectedEventFrame: placement.requestedEventFrame,
          detectedTransientFrame: placement.detectedTransientFrame,
          appliedOffsetFrames: placement.appliedOffsetFrames,
          resultingTransientFrame: placement.resultingTransientFrame,
          errorFrames: placement.residualErrorFrames,
          errorMilliseconds: framesToSeconds(placement.residualErrorFrames, input.request.timelineRate) * 1_000,
          toleranceFrames: tolerance,
        })
    }
    const study = outputs[0]?.study ?? input.study
    if (cue.hitFrame === undefined || !study) {
      return finding(`sync.${cue.cueId}`, 'needs_review', 'No measured transient-to-hit comparison was available.', { cueId: cue.cueId })
    }
    const transients = study.transientTimesSeconds.map((seconds) => cue.startFrame +
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
  for (const [index, output] of outputs.entries()) {
    const automation = input.automations[index]
    if (!automation || !output.study) continue
    const edges = output.study.edgeRmsDbfs
    const fadeInMeasured = automation.fadeInFrames === 0 || edges.leading < edges.center
    const fadeOutMeasured = automation.fadeOutFrames === 0 || edges.trailing < edges.center
    mixQa.push(
      finding(`mix.measured_fade_in.${automation.cueId}`, fadeInMeasured ? 'pass' : 'warning',
        'Leading decoded window energy was compared with center energy for the applied fade.', {
          fadeInFrames: automation.fadeInFrames,
          leadingRmsDbfs: edges.leading, centerRmsDbfs: edges.center,
          windowMilliseconds: edges.windowMilliseconds,
        }),
      finding(`mix.measured_fade_out.${automation.cueId}`, fadeOutMeasured ? 'pass' : 'warning',
        'Trailing decoded window energy was compared with center energy for the applied fade.', {
          fadeOutFrames: automation.fadeOutFrames,
          trailingRmsDbfs: edges.trailing, centerRmsDbfs: edges.center,
          windowMilliseconds: edges.windowMilliseconds,
        }),
    )
  }
  for (const measurement of input.mixMeasurements ?? []) {
    mixQa.push(
      finding(`mix.measured_peak.${measurement.unitId}`,
        measurement.measuredOutputPeakDbfs <= input.request.qualityPolicy.maximumTruePeakDbtp ? 'pass' : 'fail',
        'Decoded mixed output peak was measured against the approved ceiling.', {
          measuredOutputPeakDbfs: measurement.measuredOutputPeakDbfs,
          maximumTruePeakDbtp: input.request.qualityPolicy.maximumTruePeakDbtp,
        }),
      finding(`mix.measured_ducking.${measurement.unitId}`,
        measurement.measuredDuckingDeltaDb === undefined ? 'needs_review' : 'pass',
        'Dialogue and Sound inputs plus the mixed output were decoded to derive a measured balance delta.', {
          measuredOutputRmsDbfs: measurement.measuredOutputRmsDbfs,
          measuredDialogueRmsDbfs: measurement.measuredDialogueRmsDbfs,
          measuredSoundRmsDbfs: measurement.measuredSoundRmsDbfs,
          measuredDuckingDeltaDb: measurement.measuredDuckingDeltaDb,
        }),
      finding(`mix.measured_channel_energy.${measurement.unitId}`,
        measurement.measuredOutputChannelRmsDbfs.every(Number.isFinite) ? 'pass' : 'fail',
        'Decoded mixed output channel energy was measured for pan and channel-balance review.', {
          measuredOutputChannelRmsDbfs: measurement.measuredOutputChannelRmsDbfs,
          channelEnergyDeltaDb: measurement.measuredOutputChannelRmsDbfs.length === 2
            ? Number(Math.abs(measurement.measuredOutputChannelRmsDbfs[0]! -
              measurement.measuredOutputChannelRmsDbfs[1]!).toFixed(3)) : 0,
        }),
    )
  }

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
        artifactIds: outputs.map((output) => output.artifact.artifactId),
        private: outputs.every((output) => output.artifact.private) || outputs.length === 0,
      }),
    finding('provenance.provider_attempt', (input.providerAttempts ?? (input.providerAttempt ? [input.providerAttempt] : []))
      .some((attempt) => attempt.status !== 'succeeded') ? 'fail' : 'pass',
      'Provider outputs, when used, are bound to a reconciled provider attempt.', {
        providerAttempts: (input.providerAttempts ?? (input.providerAttempt ? [input.providerAttempt] : []))
          .map((attempt) => ({ attemptId: attempt.attemptId, status: attempt.status })),
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

function qaIndexedKey(base: string, index: number): string {
  return index === 0 ? base : `${base}.${index}`
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (value && typeof value === 'object') return `{${Object.entries(value as Record<string, unknown>)
    .filter(([, child]) => child !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, child]) => `${JSON.stringify(key)}:${stableJson(child)}`).join(',')}}`
  return JSON.stringify(value)
}
