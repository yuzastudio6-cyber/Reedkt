import { createHash, randomUUID } from 'node:crypto'
import { constants as fsConstants } from 'node:fs'
import { lstat, open, realpath } from 'node:fs/promises'
import path from 'node:path'
import type {
  EditReferenceAudioSoundDesignProvider,
  EditReferenceAudioSoundDesignProviderInput,
  EditReferenceAudioSoundDesignProviderObservation,
  EditReferenceAudioSoundDesignProviderResult,
  EditReferenceAudioSoundDesignStructuredContext,
} from '../services/edit-reference-audio-sound-design-provider'
import {
  EDIT_REFERENCE_AUDIO_SOUND_DESIGN_PROVIDER_INPUT_VERSION,
  EDIT_REFERENCE_AUDIO_SOUND_DESIGN_STRUCTURED_CONTEXT_VERSION,
  assertEditReferenceAudioSoundDesignProviderInput,
  assertEditReferenceAudioSoundDesignProviderResult,
  editReferenceAudioSoundDesignStructuredContextSchema,
} from '../services/edit-reference-audio-sound-design-provider'
import {
  EDIT_REFERENCE_AUDIO_SOUND_DESIGN_STUDY_RESULT_VERSION,
  assertEditReferenceAudioSoundDesignStudyRequest,
  assertEditReferenceAudioSoundDesignStudyResult,
  computeEditReferenceAudioSoundDesignStudyRequestDigest,
  createBlockedEditReferenceAudioSoundDesignStudyResult,
  createNeedsMoreEvidenceAudioSoundDesignStudyResult,
  type EditReferenceAnalyzedAudioSoundDesignStudyResult,
  type EditReferenceAudioSoundDesignAudioSample,
  type EditReferenceAudioSoundDesignEvidenceManifest,
  type EditReferenceAudioSoundDesignFinding,
  type EditReferenceAudioSoundDesignStudyAdapter,
  type EditReferenceAudioSoundDesignStudyBlockerCode,
  type EditReferenceAudioSoundDesignStudyRequest,
  type EditReferenceAudioSoundDesignStudyResult,
  type EditReferenceAudioSoundDesignTechnicalLoudnessAuthority,
  type EditReferenceAudioSoundDesignTechnicalLowLevelAuthority,
} from './edit-reference-audio-sound-design-study-contract'

export const EDIT_REFERENCE_AUDIO_SOUND_DESIGN_ADAPTER_ID =
  'edit_reference_audio_sound_design_adapter' as const
export const EDIT_REFERENCE_AUDIO_SOUND_DESIGN_ADAPTER_VERSION = 'v1' as const

export interface EditReferenceResolvedAudioSoundDesignSample {
  readonly privateAudioArtifactId: string
  readonly localFilePath: string
  readonly contentType: 'audio/wav'
}

export interface EditReferenceAudioSoundDesignUsageAuthorization {
  readonly usageEventIds: readonly string[]
  readonly internalCostRecordIds: readonly string[]
}

export interface EditReferenceAudioSoundDesignUsageReceipt
  extends EditReferenceAudioSoundDesignUsageAuthorization {
  readonly meteredInternalCostMicros: string
}

export interface EditReferenceAudioSoundDesignProductionUsageAuthority {
  authorize(
    request: EditReferenceAudioSoundDesignStudyRequest,
  ): Promise<EditReferenceAudioSoundDesignUsageAuthorization>
  reconcile(input: {
    readonly request: EditReferenceAudioSoundDesignStudyRequest
    readonly providerResult: EditReferenceAudioSoundDesignProviderResult
    readonly authorization: EditReferenceAudioSoundDesignUsageAuthorization
  }): Promise<EditReferenceAudioSoundDesignUsageReceipt>
}

export interface EditReferenceAudioSoundDesignAdapterOptions {
  readonly provider: EditReferenceAudioSoundDesignProvider
  readonly privateAudioRoot: string
  readonly resolvePrivateAudio: (
    sample: EditReferenceAudioSoundDesignAudioSample,
  ) => Promise<EditReferenceResolvedAudioSoundDesignSample>
  readonly cleanupPrivateAudio: (
    samples: readonly EditReferenceResolvedAudioSoundDesignSample[],
  ) => Promise<void>
  readonly productionUsageAuthority?: EditReferenceAudioSoundDesignProductionUsageAuthority
  readonly now?: () => string
  readonly createExecutionId?: () => string
}

interface PendingBlockedResult {
  readonly kind: 'blocked'
  readonly blockerCode: EditReferenceAudioSoundDesignStudyBlockerCode
  readonly blockerMessage: string
  readonly retryAvailable: boolean
  readonly retryReason?: string
  readonly providerResult?: EditReferenceAudioSoundDesignProviderResult
  readonly execution?: {
    readonly providerCallMade: boolean
    readonly modelCallMade: boolean
    readonly workerJobCreated: boolean
  }
  readonly usage?: {
    readonly internalCostStatus: 'metered' | 'unverified'
    readonly meteredInternalCostMicros: string | null
    readonly usageEventIds: readonly string[]
    readonly internalCostRecordIds: readonly string[]
  }
}

interface PendingAnalyzedResult {
  readonly kind: 'analyzed'
  readonly providerResult: EditReferenceAudioSoundDesignProviderResult
  readonly usageReceipt?: EditReferenceAudioSoundDesignUsageReceipt
}

type PendingResult = PendingBlockedResult | PendingAnalyzedResult

const MONEY_MICROS = /^(?:0|[1-9][0-9]{0,15})$/
const EXACT_AUDIO_DATA = /\b\d+(?:\.\d+)?\s*(?:bpm|db|lufs|hz|khz|frames?|milliseconds?|ms|seconds?|secs?|%)\b/i
const QUOTED_SOURCE_LANGUAGE = /["“”][^"“”]{3,}["“”]/
const UNSAFE_SUMMARY = /https?:\/\/|file:\/\/|(?:^|[\s"'`])\/(?:Users|Volumes|home|private|tmp|var)\/|signed[_ -]?url|authorization|bearer\s+|api[_ -]?key|private[_ -]?key|password|credential/i
const MAX_AUDIO_BYTES = 64 * 1024 * 1024

export function createEditReferenceAudioSoundDesignAdapter(
  options: EditReferenceAudioSoundDesignAdapterOptions,
): EditReferenceAudioSoundDesignStudyAdapter {
  return {
    adapterId: EDIT_REFERENCE_AUDIO_SOUND_DESIGN_ADAPTER_ID,
    adapterVersion: EDIT_REFERENCE_AUDIO_SOUND_DESIGN_ADAPTER_VERSION,
    async analyze(request): Promise<EditReferenceAudioSoundDesignStudyResult> {
      assertEditReferenceAudioSoundDesignStudyRequest(request)
      if (request.evidenceMode === 'technical_signals_only') {
        return createNeedsMoreEvidenceAudioSoundDesignStudyResult(
          request,
          'Prepare one exact bounded private-audio sample, then retry semantic Audio/Sound Design analysis.',
        )
      }

      const startedAt = currentTime(options)
      const executionId = options.createExecutionId?.()
        ?? `edit-reference-audio-sound-design-${randomUUID()}`
      const resolvedAudio: EditReferenceResolvedAudioSoundDesignSample[] = []
      let boundedPrivateAudioRead = false
      let technicalLoudnessResultRead = false
      let technicalLowLevelResultRead = false
      let temporaryAudioCleaned = false
      let authorization: EditReferenceAudioSoundDesignUsageAuthorization | undefined
      let usageReceipt: EditReferenceAudioSoundDesignUsageReceipt | undefined
      let providerResult: EditReferenceAudioSoundDesignProviderResult | undefined
      let pending: PendingResult | undefined

      try {
        assertExactRequestAuthority(request)
        technicalLoudnessResultRead = true
        technicalLowLevelResultRead = true

        if (options.provider.executionMode === 'unavailable') {
          pending = unavailableRuntimeBlocker()
        } else if (
          request.executionScope === 'controlled_test'
          && options.provider.executionMode !== 'controlled_local'
        ) {
          pending = {
            kind: 'blocked',
            blockerCode: 'model_routing_unavailable',
            blockerMessage: 'Controlled Audio/Sound Design analysis cannot call a live provider.',
            retryAvailable: true,
            retryReason: 'Use a reviewed controlled local semantic-audio analyzer or an approved metered production route.',
          }
        } else if (
          request.executionScope === 'production'
          && options.provider.executionMode !== 'live_provider'
        ) {
          pending = {
            kind: 'blocked',
            blockerCode: 'model_routing_unavailable',
            blockerMessage: 'Production Audio/Sound Design requires a reviewed live semantic-audio route.',
            retryAvailable: true,
            retryReason: 'Restore the approved live semantic-audio route and retry under exact internal-cost authority.',
          }
        } else if (request.executionScope === 'production' && !options.productionUsageAuthority) {
          pending = {
            kind: 'blocked',
            blockerCode: 'cost_authority_unavailable',
            blockerMessage: 'Canonical internal-cost authority is unavailable, so no semantic-audio provider call was made.',
            retryAvailable: true,
            retryReason: 'Restore the exact estimate, budget, rate-card snapshot, and attempt-level usage authority.',
          }
        } else {
          if (request.executionScope === 'production') {
            try {
              authorization = await options.productionUsageAuthority!.authorize(request)
              assertUsageAuthorization(authorization)
            } catch {
              pending = {
                kind: 'blocked',
                blockerCode: 'cost_authority_unavailable',
                blockerMessage: 'Canonical internal-cost authority did not authorize this exact Audio/Sound Design request.',
                retryAvailable: true,
                retryReason: 'Refresh the exact estimate, budget, and immutable rate-card authority before retrying.',
              }
            }
          }

          if (!pending) {
            await resolveExactPrivateAudio(options, request, resolvedAudio)
            const audioBytes = await verifyExactAudioBytes(options.privateAudioRoot, request, resolvedAudio)
            boundedPrivateAudioRead = true
            const providerInput = createProviderInput(request, audioBytes)
            assertEditReferenceAudioSoundDesignProviderInput(providerInput)
            try {
              providerResult = await options.provider.analyze(providerInput)
              assertEditReferenceAudioSoundDesignProviderResult(providerInput, providerResult)
            } catch {
              if (request.executionScope === 'production' && authorization) {
                pending = {
                  kind: 'blocked',
                  blockerCode: 'internal_cost_usage_unverified',
                  blockerMessage: 'The live semantic-audio attempt failed without a reconcilable provider result.',
                  retryAvailable: false,
                  execution: {
                    providerCallMade: true,
                    modelCallMade: false,
                    workerJobCreated: false,
                  },
                  usage: {
                    internalCostStatus: 'unverified',
                    meteredInternalCostMicros: null,
                    usageEventIds: authorization.usageEventIds,
                    internalCostRecordIds: authorization.internalCostRecordIds,
                  },
                }
              } else {
                pending = {
                  kind: 'blocked',
                  blockerCode: 'runtime_response_invalid',
                  blockerMessage: 'The controlled semantic-audio analyzer failed closed without a valid result.',
                  retryAvailable: false,
                }
              }
            }

            if (providerResult && !pending && request.executionScope === 'production' && authorization) {
              const executionStarted = providerResult.execution.providerCallMade
                || providerResult.execution.modelCallMade
                || providerResult.execution.workerJobCreated
              if (executionStarted || providerResult.status === 'completed') {
                try {
                  usageReceipt = await options.productionUsageAuthority!.reconcile({
                    request,
                    providerResult,
                    authorization,
                  })
                  assertUsageReceipt(request, authorization, usageReceipt, providerResult.status === 'completed')
                } catch {
                  pending = {
                    kind: 'blocked',
                    blockerCode: 'internal_cost_usage_unverified',
                    blockerMessage: 'The semantic-audio attempt ran, but canonical internal-cost usage could not be reconciled.',
                    retryAvailable: false,
                    providerResult,
                    usage: {
                      internalCostStatus: 'unverified',
                      meteredInternalCostMicros: null,
                      usageEventIds: authorization.usageEventIds,
                      internalCostRecordIds: authorization.internalCostRecordIds,
                    },
                  }
                }
              }
            }

            if (providerResult && !pending) {
              pending = providerResult.status === 'completed'
                ? { kind: 'analyzed', providerResult, ...(usageReceipt ? { usageReceipt } : {}) }
                : {
                    ...blockedProviderResult(providerResult),
                    ...(usageReceipt ? { usage: meteredUsage(usageReceipt) } : {}),
                  }
            }
          }
        }
      } catch (error) {
        pending = {
          kind: 'blocked',
          blockerCode: classifyAdapterError(error),
          blockerMessage: safeAdapterError(error),
          retryAvailable: false,
          providerResult,
          ...(providerResult
            ? {
                execution: {
                  providerCallMade: providerResult.execution.providerCallMade,
                  modelCallMade: providerResult.execution.modelCallMade,
                  workerJobCreated: providerResult.execution.workerJobCreated,
                },
              }
            : {}),
          ...(pending?.kind === 'blocked' && pending.usage
            ? { usage: pending.usage }
            : usageReceipt
              ? { usage: meteredUsage(usageReceipt) }
              : authorization && providerResult?.execution.providerCallMade
              ? {
                  usage: {
                    internalCostStatus: 'unverified' as const,
                    meteredInternalCostMicros: null,
                    usageEventIds: authorization.usageEventIds,
                    internalCostRecordIds: authorization.internalCostRecordIds,
                  },
                }
                : {}),
        }
      } finally {
        try {
          await options.cleanupPrivateAudio(resolvedAudio)
          temporaryAudioCleaned = true
        } catch {
          // The default remains false when cleanup does not complete.
        }
      }

      if (!temporaryAudioCleaned) {
        pending = {
          kind: 'blocked',
          blockerCode: 'ephemeral_cleanup_failed',
          blockerMessage: 'The specialist-owned bounded audio sample could not be deleted, so the study failed closed.',
          retryAvailable: false,
          providerResult,
          ...(pending?.kind === 'blocked' && pending.execution
            ? { execution: pending.execution }
            : providerResult
              ? {
                  execution: {
                    providerCallMade: providerResult.execution.providerCallMade,
                    modelCallMade: providerResult.execution.modelCallMade,
                    workerJobCreated: providerResult.execution.workerJobCreated,
                  },
                }
              : {}),
          ...(usageReceipt
            ? { usage: meteredUsage(usageReceipt) }
            : authorization && providerResult?.execution.providerCallMade
              ? {
                  usage: {
                    internalCostStatus: 'unverified' as const,
                    meteredInternalCostMicros: null,
                    usageEventIds: authorization.usageEventIds,
                    internalCostRecordIds: authorization.internalCostRecordIds,
                  },
                }
              : {}),
        }
      }

      if (!pending) pending = unavailableRuntimeBlocker()
      if (pending.kind === 'blocked') {
        return createBlockedEditReferenceAudioSoundDesignStudyResult({
          request,
          blockerCode: pending.blockerCode,
          blockerMessage: pending.blockerMessage,
          retryAvailable: pending.retryAvailable,
          retryReason: pending.retryReason,
          execution: {
            boundedPrivateAudioRead,
            technicalLoudnessResultRead,
            technicalLowLevelResultRead,
            providerCallMade: pending.execution?.providerCallMade
              ?? pending.providerResult?.execution.providerCallMade
              ?? false,
            modelCallMade: pending.execution?.modelCallMade
              ?? pending.providerResult?.execution.modelCallMade
              ?? false,
            workerJobCreated: pending.execution?.workerJobCreated
              ?? pending.providerResult?.execution.workerJobCreated
              ?? false,
            temporaryAudioCleaned,
          },
          usage: pending.usage,
        })
      }

      try {
        return buildAnalyzedResult({
          request,
          providerResult: pending.providerResult,
          usageReceipt: pending.usageReceipt,
          executionId,
          startedAt,
          completedAt: currentTime(options),
        })
      } catch (error) {
        return createBlockedEditReferenceAudioSoundDesignStudyResult({
          request,
          blockerCode: classifyAdapterError(error),
          blockerMessage: safeAdapterError(error),
          retryAvailable: false,
          execution: {
            boundedPrivateAudioRead,
            technicalLoudnessResultRead,
            technicalLowLevelResultRead,
            providerCallMade: pending.providerResult.execution.providerCallMade,
            modelCallMade: pending.providerResult.execution.modelCallMade,
            workerJobCreated: pending.providerResult.execution.workerJobCreated,
            temporaryAudioCleaned,
          },
          ...(pending.usageReceipt ? { usage: meteredUsage(pending.usageReceipt) } : {}),
        })
      }
    },
  }
}

export function hashEditReferenceAudioSoundDesignEvidenceManifest(
  evidence: EditReferenceAudioSoundDesignEvidenceManifest,
): string {
  return sha256(JSON.stringify(normalizeEvidence(evidence)))
}

export function hashEditReferenceAudioSoundDesignAudioManifest(
  samples: readonly EditReferenceAudioSoundDesignAudioSample[],
): string {
  return sha256(JSON.stringify([...samples].sort((left, right) => (
    left.audioEvidenceId.localeCompare(right.audioEvidenceId)
  ))))
}

export function hashEditReferenceAudioSoundDesignTechnicalLoudnessAuthority(
  authority: Omit<EditReferenceAudioSoundDesignTechnicalLoudnessAuthority, 'resultDigestSha256'>,
): string {
  return sha256(JSON.stringify({ ...authority, toolIds: [...authority.toolIds].sort() }))
}

export function hashEditReferenceAudioSoundDesignTechnicalLowLevelAuthority(
  authority: Omit<EditReferenceAudioSoundDesignTechnicalLowLevelAuthority, 'resultDigestSha256'>,
): string {
  return sha256(JSON.stringify({
    ...authority,
    toolIds: [...authority.toolIds].sort(),
    intervals: [...authority.intervals].sort((left, right) => left.startSeconds - right.startSeconds),
  }))
}

export function createEditReferenceAudioSoundDesignStructuredContext(
  request: EditReferenceAudioSoundDesignStudyRequest,
): EditReferenceAudioSoundDesignStructuredContext {
  assertEditReferenceAudioSoundDesignStudyRequest(request)
  const items: EditReferenceAudioSoundDesignStructuredContext['evidenceItems'] = [
    ...evidenceItems(request.evidence.mediaStructureEvidenceIds, 'media_structure', 'Private media structure and bounded analysis duration were verified.'),
    ...evidenceItems(request.evidence.privateAudioEvidenceIds, 'private_audio', 'One exact bounded private reference mix is authorized for ephemeral semantic analysis only.'),
    ...evidenceItems(request.evidence.technicalLoudnessEvidenceIds, 'technical_loudness', 'FFmpeg measured bounded technical loudness; this signal is nonsemantic.'),
    ...evidenceItems(request.evidence.technicalLowLevelIntervalEvidenceIds, 'technical_low_level_interval', 'FFmpeg measured bounded low-level intervals; these are not speech pauses or edit instructions.'),
    ...evidenceItems(request.evidence.transcriptTimingEvidenceIds, 'transcript_timing', 'Separately verified speech timing is available for speech-related observations.'),
    ...evidenceItems(request.evidence.beatGridEvidenceIds, 'beat_grid', 'Separately verified beat-grid evidence is available for beat-related observations.'),
    ...evidenceItems(request.evidence.visualCueTimingEvidenceIds, 'visual_cue_timing', 'Separately verified visual-cue evidence is available for SFX-timing observations.'),
    ...evidenceItems(request.evidence.studyChatGoalEvidenceIds, 'study_goal', 'The saved study goal authorizes generalized Audio/Sound Design analysis without copying source assets or settings.'),
    ...evidenceItems(request.evidence.rightsAndAssetEvidenceIds, 'rights_and_asset', `Source audio rights basis is ${request.sourceAudioRightsBasis}; exact assets remain non-transferable unless separately approved in the target workflow.`),
  ]
  const context: EditReferenceAudioSoundDesignStructuredContext = {
    schemaVersion: EDIT_REFERENCE_AUDIO_SOUND_DESIGN_STRUCTURED_CONTEXT_VERSION,
    evidenceManifestDigestSha256: request.evidenceManifestDigestSha256,
    audioManifestDigestSha256: request.audioManifestDigestSha256,
    technicalLoudnessResultDigestSha256: request.technicalLoudnessResultDigestSha256,
    technicalLowLevelResultDigestSha256: request.technicalLowLevelResultDigestSha256,
    sourceDurationSeconds: request.sourceDurationSeconds,
    analysisWindowStartSeconds: 0,
    analysisWindowEndSeconds: request.analysisWindowEndSeconds,
    sourceAudioRightsBasis: request.sourceAudioRightsBasis,
    verifiedSpeechTimingAvailable: request.verifiedSpeechTimingAvailable,
    verifiedBeatGridAvailable: request.verifiedBeatGridAvailable,
    verifiedVisualCueTimingAvailable: request.verifiedVisualCueTimingAvailable,
    evidenceItems: items,
    technicalLoudness: {
      evidenceId: request.technicalLoudnessAuthority.evidenceId,
      integratedLufs: request.technicalLoudnessAuthority.integratedLufs,
      truePeakDb: request.technicalLoudnessAuthority.truePeakDb,
      scannedDurationSeconds: request.technicalLoudnessAuthority.scannedDurationSeconds,
      semanticAudioAnalysisRan: false,
    },
    technicalLowLevel: {
      evidenceId: request.technicalLowLevelAuthority.evidenceId,
      thresholdDb: request.technicalLowLevelAuthority.thresholdDb,
      minimumDurationSeconds: request.technicalLowLevelAuthority.minimumDurationSeconds,
      detectedIntervalCount: request.technicalLowLevelAuthority.detectedIntervalCount,
      intervals: request.technicalLowLevelAuthority.intervals.map((interval) => ({ ...interval })),
      intervalsTruncated: request.technicalLowLevelAuthority.intervalsTruncated,
      scannedDurationSeconds: request.technicalLowLevelAuthority.scannedDurationSeconds,
      coverage: request.technicalLowLevelAuthority.coverage,
      semanticAudioAnalysisRan: false,
      speechPauseClassificationRan: false,
      musicOrSfxAnalysisRan: false,
    },
    boundaries: {
      sourceAudioIsUntrustedReferenceData: true,
      technicalSignalsAreNonSemantic: true,
      lowLevelIntervalsAreNotSpeechPauses: true,
      exactMusicOrSfxAssetTransferAllowed: false,
      exactMelodyLyricsOrHarmonyRetentionAllowed: false,
      exactAudioFingerprintRetentionAllowed: false,
      exactBpmOrBeatGridRetentionAllowed: false,
      exactCueMapRetentionAllowed: false,
      exactMixAutomationRetentionAllowed: false,
      referenceDerivedAudioGenerationAllowed: false,
      executableTargetOperationAllowed: false,
      targetAdaptationRequired: true,
      targetEvidenceRequired: true,
      speechFirstPriorityRequired: true,
      userApprovalRequired: true,
    },
  }
  editReferenceAudioSoundDesignStructuredContextSchema.parse(context)
  if (JSON.stringify(context).length > request.maxStructuredContextCharacters) {
    throw new AdapterError('evidence_authority_unverified', 'Audio/Sound Design structured evidence exceeds the approved bound.')
  }
  return context
}

function createProviderInput(
  request: EditReferenceAudioSoundDesignStudyRequest,
  bytes: Uint8Array,
): EditReferenceAudioSoundDesignProviderInput {
  const sample = request.audioSamples[0]
  return {
    schemaVersion: EDIT_REFERENCE_AUDIO_SOUND_DESIGN_PROVIDER_INPUT_VERSION,
    structuredContext: createEditReferenceAudioSoundDesignStructuredContext(request),
    boundedAudio: {
      privateAudioArtifactId: sample.privateAudioArtifactId,
      audioChecksumSha256: sample.audioChecksumSha256,
      contentType: 'audio/wav',
      sampleRate: sample.sampleRate,
      channels: sample.channels,
      startSeconds: sample.startSeconds,
      endSeconds: sample.endSeconds,
      bytes,
    },
  }
}

function buildAnalyzedResult(input: {
  readonly request: EditReferenceAudioSoundDesignStudyRequest
  readonly providerResult: EditReferenceAudioSoundDesignProviderResult
  readonly usageReceipt?: EditReferenceAudioSoundDesignUsageReceipt
  readonly executionId: string
  readonly startedAt: string
  readonly completedAt: string
}): EditReferenceAnalyzedAudioSoundDesignStudyResult {
  const { request, providerResult } = input
  const runtime = providerResult.runtimeProvenance
  if (!runtime || providerResult.status !== 'completed' || providerResult.observations.length < 1) {
    throw new AdapterError('runtime_response_invalid', 'Audio/Sound Design result lacks reviewed semantic runtime provenance or observations.')
  }
  if (!providerResult.execution.boundedPrivateAudioRead || !providerResult.execution.structuredEvidenceRead || !providerResult.execution.modelCallMade) {
    throw new AdapterError('runtime_response_invalid', 'Audio/Sound Design result cannot prove bounded audio, evidence, and semantic model reads.')
  }
  if (request.executionScope === 'controlled_test') {
    if (
      runtime.runtimeSource !== 'verified_local'
      || runtime.providerId !== null
      || providerResult.execution.providerCallMade
      || providerResult.execution.workerJobCreated
      || input.usageReceipt
    ) throw new AdapterError('runtime_response_invalid', 'Controlled Audio/Sound Design provenance is invalid.')
  } else if (
    runtime.runtimeSource !== 'verified_live'
    || !runtime.providerId
    || !providerResult.execution.providerCallMade
    || !input.usageReceipt
  ) throw new AdapterError('runtime_response_invalid', 'Production Audio/Sound Design provenance is invalid.')

  assertObservationSafety(request, providerResult.observations)
  const observations = withRightsWarning(request, providerResult.observations)
  const findings = observations.map((observation, index): EditReferenceAudioSoundDesignFinding => ({
    findingId: `audio-sound-design-finding-${index + 1}`,
    category: observation.category,
    summary: observation.summary,
    evidenceIds: [...observation.evidenceIds],
    sourceRanges: observation.sourceRanges.map((range, rangeIndex) => ({
      rangeId: `audio-sound-design-range-${index + 1}-${rangeIndex + 1}`,
      startSeconds: range.startSeconds,
      endSeconds: range.endSeconds,
      evidenceIds: [...range.evidenceIds],
      sourceEvidenceOnly: true,
      targetCueMapCreated: false,
      targetMixAutomationCreated: false,
      audioAssetSegmentCopied: false,
      executableAudioOperationCreated: false,
    })),
    confidence: observation.confidence,
    transferability: observation.transferability,
    targetAdaptationRequired: true,
    requiresUserReview: observation.requiresUserReview,
    speechRelated: SPEECH_CATEGORIES.has(observation.category),
    beatRelated: observation.category === 'beat_alignment',
    sfxRelated: SFX_CATEGORIES.has(observation.category),
    nonTransferableAssetWarning: observation.nonTransferableAssetWarning,
    observedAudioCharacterOnly: true,
    generalizedPrincipleOnly: true,
    technicalSignalsContextOnly: true,
    exactMusicOrSfxAssetIdentityRetained: false,
    exactMelodyLyricsOrHarmonyRetained: false,
    exactAudioFingerprintRetained: false,
    exactBpmOrBeatGridRetained: false,
    exactCueTimingMapRetained: false,
    exactDuckingCurveOrGainValuesRetained: false,
    exactMixSettingsRetained: false,
    sourceAudioPromotedToLibrary: false,
    referenceDerivedGenerationInstructionCreated: false,
    executableTargetAudioOperationCreated: false,
  }))
  const controlled = request.executionScope === 'controlled_test'
  const averageConfidence = findings.reduce((sum, finding) => sum + finding.confidence, 0) / findings.length
  const partial = request.technicalLowLevelAuthority.coverage === 'partial'
  const result: EditReferenceAnalyzedAudioSoundDesignStudyResult = {
    schemaVersion: EDIT_REFERENCE_AUDIO_SOUND_DESIGN_STUDY_RESULT_VERSION,
    requestDigestSha256: computeEditReferenceAudioSoundDesignStudyRequestDigest(request),
    status: 'analyzed',
    runtimeSource: runtime.runtimeSource,
    workspaceId: request.workspaceId,
    editReferenceId: request.editReferenceId,
    studySessionId: request.studySessionId,
    orchestrationId: request.orchestrationId,
    privateMediaArtifactId: request.privateMediaArtifactId,
    mediaChecksumSha256: request.mediaChecksumSha256,
    evidenceManifestDigestSha256: request.evidenceManifestDigestSha256,
    audioManifestDigestSha256: request.audioManifestDigestSha256,
    technicalLoudnessResultDigestSha256: request.technicalLoudnessResultDigestSha256,
    technicalLowLevelResultDigestSha256: request.technicalLowLevelResultDigestSha256,
    consumedAudioEvidenceIds: request.audioSamples.map((sample) => sample.audioEvidenceId),
    evidence: copyEvidence(request.evidence),
    technicalLoudnessAuthority: structuredClone(request.technicalLoudnessAuthority),
    technicalLowLevelAuthority: structuredClone(request.technicalLowLevelAuthority),
    findings,
    coverage: {
      evidenceItemCount: allEvidenceIds(request.evidence).length,
      audioSampleCount: request.audioSamples.length,
      technicalLowLevelIntervalCount: request.technicalLowLevelAuthority.intervals.length,
      sourceDurationSeconds: request.sourceDurationSeconds,
      analysisWindowStartSeconds: request.analysisWindowStartSeconds,
      analysisWindowEndSeconds: request.analysisWindowEndSeconds,
      analyzedDurationSeconds: request.analysisWindowEndSeconds - request.analysisWindowStartSeconds,
      evidenceMode: 'bounded_audio_and_technical_signals',
      speechTimingAvailable: request.verifiedSpeechTimingAvailable,
      beatGridAvailable: request.verifiedBeatGridAvailable,
      visualCueTimingAvailable: request.verifiedVisualCueTimingAvailable,
      partial,
      missingEvidenceKinds: partial ? ['technical_low_level_partial_coverage'] : [],
    },
    summary: {
      findingCount: findings.length,
      categoryCount: new Set(findings.map((finding) => finding.category)).size,
      transferablePrincipleCount: findings.filter((finding) => finding.transferability === 'transferable_principle').length,
      contextOnlyCount: findings.filter((finding) => finding.transferability === 'context_only').length,
      nonTransferableCount: findings.filter((finding) => finding.transferability === 'non_transferable').length,
      assetWarningCount: findings.filter((finding) => finding.nonTransferableAssetWarning).length,
      averageConfidence,
    },
    execution: {
      boundedPrivateAudioRead: true,
      technicalLoudnessResultRead: true,
      technicalLowLevelResultRead: true,
      semanticAudioSoundDesignModelExecuted: true,
      rawFullMediaRead: false,
      rawWaveformOrSpectrogramRead: false,
      externalUrlFetched: false,
      providerCallMade: providerResult.execution.providerCallMade,
      modelCallMade: true,
      workerJobCreated: providerResult.execution.workerJobCreated,
      temporaryAudioCleaned: true,
      remoteMutationMade: false,
    },
    analyzer: {
      adapterId: EDIT_REFERENCE_AUDIO_SOUND_DESIGN_ADAPTER_ID,
      adapterVersion: EDIT_REFERENCE_AUDIO_SOUND_DESIGN_ADAPTER_VERSION,
      providerId: runtime.providerId,
      modelId: runtime.modelId,
      modelRevision: runtime.modelRevision,
      modelAggregateSha256: runtime.modelAggregateSha256,
      modelRoutingPolicyVersion: runtime.modelRoutingPolicyVersion,
      analysisInstructionDigestSha256: runtime.analysisInstructionDigestSha256,
    },
    provenance: { executionId: input.executionId, startedAt: input.startedAt, completedAt: input.completedAt },
    usage: controlled ? {
      mode: 'controlled_test_unmetered',
      approvedUsageEstimateId: null,
      internalCostBudgetId: null,
      immutableRateCardSnapshotId: null,
      maximumAuthorizedInternalCostMicros: null,
      meteredInternalCostMicros: '0',
      usageEventIds: [],
      internalCostRecordIds: [],
      customerPriceCalculated: false,
      customerCreditsMutated: false,
      serviceFeeIncluded: false,
    } : {
      mode: 'production_metered',
      approvedUsageEstimateId: request.approvedUsageEstimateId,
      internalCostBudgetId: request.internalCostBudgetId,
      immutableRateCardSnapshotId: request.immutableRateCardSnapshotId,
      maximumAuthorizedInternalCostMicros: request.maximumAuthorizedInternalCostMicros,
      meteredInternalCostMicros: input.usageReceipt!.meteredInternalCostMicros,
      usageEventIds: [...input.usageReceipt!.usageEventIds],
      internalCostRecordIds: [...input.usageReceipt!.internalCostRecordIds],
      customerPriceCalculated: false,
      customerCreditsMutated: false,
      serviceFeeIncluded: false,
    },
    privacy: {
      rawFullMediaPersisted: false,
      rawAudioPersisted: false,
      rawWaveformOrSpectrogramPersisted: false,
      rawProviderPayloadPersisted: false,
      signedUrlPersisted: false,
      hiddenChainOfThoughtPersisted: false,
      temporaryAudioCleaned: true,
    },
    copySafety: {
      exactMusicAssetTransferInstructionCreated: false,
      exactSfxAssetTransferInstructionCreated: false,
      exactMelodyLyricsOrHarmonyRetained: false,
      exactAudioFingerprintRetained: false,
      exactBpmOrBeatGridTransferInstructionCreated: false,
      exactCueTimingMapTransferInstructionCreated: false,
      exactDuckingCurveOrGainTransferInstructionCreated: false,
      exactMixSettingTransferInstructionCreated: false,
      sourceAudioPromotedToInternalLibrary: false,
      referenceDerivedAudioGenerationInstructionCreated: false,
    },
    audioSafety: {
      technicalSignalsTreatedAsSemanticIntent: false,
      lowLevelIntervalsTreatedAsSpeechPauses: false,
      speechMeaningInferredWithoutVerifiedTiming: false,
      beatAlignmentClaimedWithoutBeatAuthority: false,
      sfxTimingClaimedWithoutVisualCueAuthority: false,
      speechFirstPriorityRequired: true,
      targetVoiceClarityQaRequired: true,
      targetMusicOverVoiceQaRequired: true,
      targetSfxJustificationQaRequired: true,
      targetTimingValidationRequired: true,
      randomSfxInstructionCreated: false,
    },
    transferBoundary: {
      findingsMayBecomeTargetInstructionsWithoutApplication: false,
      targetEvidenceRequired: true,
      targetAudioAnalysisRequired: true,
      targetSpeechPresenceAndTimingReviewRequired: true,
      targetBeatAndOnsetAnalysisRequiredForBeatAlignment: true,
      targetVisualCueLinkageRequiredForSfx: true,
      masterTimingPlanRequired: true,
      soundSyncTransitionTimingPlanRequired: true,
      timingValidationRequired: true,
      userApprovalRequired: true,
      userOwnedOrLicensedAudioRequiresSeparateTargetAssetApproval: true,
      exactReferenceMusicOrSfxTransferAllowed: false,
    },
  }
  assertEditReferenceAudioSoundDesignStudyResult(request, result)
  return result
}

function assertExactRequestAuthority(request: EditReferenceAudioSoundDesignStudyRequest): void {
  if (hashEditReferenceAudioSoundDesignEvidenceManifest(request.evidence) !== request.evidenceManifestDigestSha256) {
    throw new AdapterError('evidence_authority_unverified', 'Audio/Sound Design evidence manifest digest is not exact.')
  }
  if (hashEditReferenceAudioSoundDesignAudioManifest(request.audioSamples) !== request.audioManifestDigestSha256) {
    throw new AdapterError('audio_authority_unverified', 'Audio/Sound Design sample manifest digest is not exact.')
  }
  const { resultDigestSha256: loudnessDigest, ...loudness } = request.technicalLoudnessAuthority
  if (
    loudnessDigest !== request.technicalLoudnessResultDigestSha256
    || hashEditReferenceAudioSoundDesignTechnicalLoudnessAuthority(loudness) !== loudnessDigest
  ) throw new AdapterError('technical_loudness_authority_unverified', 'Audio/Sound Design loudness authority digest is not exact.')
  const { resultDigestSha256: lowLevelDigest, ...lowLevel } = request.technicalLowLevelAuthority
  if (
    lowLevelDigest !== request.technicalLowLevelResultDigestSha256
    || hashEditReferenceAudioSoundDesignTechnicalLowLevelAuthority(lowLevel) !== lowLevelDigest
  ) throw new AdapterError('technical_low_level_authority_unverified', 'Audio/Sound Design low-level authority digest is not exact.')
}

async function resolveExactPrivateAudio(
  options: EditReferenceAudioSoundDesignAdapterOptions,
  request: EditReferenceAudioSoundDesignStudyRequest,
  resolved: EditReferenceResolvedAudioSoundDesignSample[],
): Promise<void> {
  for (const sample of request.audioSamples) {
    const value = await options.resolvePrivateAudio(sample)
    if (value.privateAudioArtifactId !== sample.privateAudioArtifactId || value.contentType !== 'audio/wav') {
      throw new AdapterError('audio_authority_unverified', 'Resolved bounded audio does not match the exact private artifact authority.')
    }
    resolved.push(value)
  }
}

async function verifyExactAudioBytes(
  configuredRoot: string,
  request: EditReferenceAudioSoundDesignStudyRequest,
  resolved: readonly EditReferenceResolvedAudioSoundDesignSample[],
): Promise<Uint8Array> {
  if (resolved.length !== 1) throw new AdapterError('bounded_private_audio_unavailable', 'Exactly one bounded audio sample is required.')
  const rootPath = path.resolve(configuredRoot)
  const rootStat = await lstat(rootPath)
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) throw new AdapterError('privacy_policy_denied', 'Private audio root is invalid.')
  const root = await realpath(rootPath)
  const filePath = path.resolve(resolved[0].localFilePath)
  const fileStat = await lstat(filePath)
  if (!fileStat.isFile() || fileStat.isSymbolicLink()) throw new AdapterError('privacy_policy_denied', 'Private audio sample is invalid.')
  const resolvedPath = await realpath(filePath)
  const relative = path.relative(root, resolvedPath)
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new AdapterError('privacy_policy_denied', 'Private audio sample is outside the specialist root.')
  }
  const handle = await open(resolvedPath, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW)
  try {
    const stat = await handle.stat()
    if (!stat.isFile() || stat.size < 44 || stat.size > MAX_AUDIO_BYTES) {
      throw new AdapterError('bounded_private_audio_unavailable', 'Bounded private audio bytes are outside the approved size limit.')
    }
    const bytes = await handle.readFile()
    const checksum = sha256(bytes)
    if (checksum !== request.audioSamples[0].audioChecksumSha256) {
      throw new AdapterError('audio_authority_unverified', 'Bounded private audio checksum does not match the exact request.')
    }
    if (bytes[0] !== 0x52 || bytes[1] !== 0x49 || bytes[2] !== 0x46 || bytes[3] !== 0x46
      || bytes[8] !== 0x57 || bytes[9] !== 0x41 || bytes[10] !== 0x56 || bytes[11] !== 0x45) {
      throw new AdapterError('bounded_private_audio_unavailable', 'Bounded private audio is not a verified WAV artifact.')
    }
    return bytes
  } finally {
    await handle.close()
  }
}

function assertObservationSafety(
  request: EditReferenceAudioSoundDesignStudyRequest,
  observations: readonly EditReferenceAudioSoundDesignProviderObservation[],
): void {
  const allowedEvidence = new Set(allEvidenceIds(request.evidence))
  for (const observation of observations) {
    if (UNSAFE_SUMMARY.test(observation.summary) || EXACT_AUDIO_DATA.test(observation.summary) || QUOTED_SOURCE_LANGUAGE.test(observation.summary)) {
      throw new AdapterError('copy_safety_violation', 'Audio/Sound Design observation retained unsafe source text, exact timing, or exact mix data.')
    }
    if (observation.evidenceIds.some((id) => !allowedEvidence.has(id))) {
      throw new AdapterError('evidence_authority_unverified', 'Audio/Sound Design observation cites evidence outside the exact manifest.')
    }
    for (const range of observation.sourceRanges) {
      if (
        range.startSeconds < request.analysisWindowStartSeconds
        || range.endSeconds <= range.startSeconds
        || range.endSeconds > request.analysisWindowEndSeconds
        || range.evidenceIds.some((id) => !observation.evidenceIds.includes(id))
      ) throw new AdapterError('evidence_authority_unverified', 'Audio/Sound Design observation range is outside its exact evidence authority.')
    }
    if (SPEECH_CATEGORIES.has(observation.category)) {
      if (!request.verifiedSpeechTimingAvailable
        || !observation.evidenceIds.some((id) => request.evidence.transcriptTimingEvidenceIds.includes(id))) {
        throw new AdapterError('speech_timing_evidence_required', 'Speech-related Audio/Sound Design observations require exact speech-timing evidence.')
      }
    }
    if (observation.category === 'beat_alignment') {
      if (!request.verifiedBeatGridAvailable
        || !observation.evidenceIds.some((id) => request.evidence.beatGridEvidenceIds.includes(id))) {
        throw new AdapterError('beat_grid_evidence_required', 'Beat-alignment observations require exact beat-grid evidence.')
      }
    }
    if (observation.category === 'sfx_timing') {
      if (!request.verifiedVisualCueTimingAvailable
        || !observation.evidenceIds.some((id) => request.evidence.visualCueTimingEvidenceIds.includes(id))) {
        throw new AdapterError('visual_cue_timing_evidence_required', 'SFX-timing observations require exact visual-cue evidence.')
      }
    }
    if (observation.nonTransferableAssetWarning && (
      observation.transferability !== 'non_transferable'
      || !observation.requiresUserReview
      || !observation.evidenceIds.some((id) => request.evidence.rightsAndAssetEvidenceIds.includes(id))
    )) throw new AdapterError('rights_or_asset_evidence_required', 'Audio asset warnings require exact rights evidence and user review.')
  }
}

function withRightsWarning(
  request: EditReferenceAudioSoundDesignStudyRequest,
  observations: readonly EditReferenceAudioSoundDesignProviderObservation[],
): EditReferenceAudioSoundDesignProviderObservation[] {
  const values = observations.map((value) => structuredClone(value))
  if (
    ['reference_only', 'unknown'].includes(request.sourceAudioRightsBasis)
    && !values.some((value) => value.nonTransferableAssetWarning)
  ) {
    const evidenceIds = [request.evidence.privateAudioEvidenceIds[0], request.evidence.rightsAndAssetEvidenceIds[0]]
    values.push({
      category: 'music_mood',
      summary: 'The source audio asset is reference-only and cannot become a target asset or reusable library sound.',
      evidenceIds,
      sourceRanges: [{
        startSeconds: request.analysisWindowStartSeconds,
        endSeconds: request.analysisWindowEndSeconds,
        evidenceIds,
      }],
      confidence: 1,
      transferability: 'non_transferable',
      requiresUserReview: true,
      nonTransferableAssetWarning: true,
    })
  }
  assertObservationSafety(request, values)
  return values
}

function unavailableRuntimeBlocker(): PendingBlockedResult {
  return {
    kind: 'blocked',
    blockerCode: 'semantic_audio_runtime_unavailable',
    blockerMessage: 'The provider-neutral Audio/Sound Design adapter is installed, but no reviewed semantic-audio model route is configured.',
    retryAvailable: true,
    retryReason: 'Restore a reviewed controlled-local or metered live semantic-audio route, then retry.',
  }
}

function blockedProviderResult(result: EditReferenceAudioSoundDesignProviderResult): PendingBlockedResult {
  return {
    kind: 'blocked',
    blockerCode: mapProviderBlocker(result.blockers),
    blockerMessage: 'The reviewed semantic-audio runtime returned a bounded blocked result.',
    retryAvailable: true,
    retryReason: 'Retry after restoring the exact audio, model-routing, privacy, and cost authority named by the runtime blocker.',
    providerResult: result,
  }
}

function mapProviderBlocker(blockers: readonly string[]): EditReferenceAudioSoundDesignStudyBlockerCode {
  const joined = blockers.join(' ').toLowerCase()
  if (joined.includes('semantic_audio_runtime_unavailable')) return 'semantic_audio_runtime_unavailable'
  if (joined.includes('privacy') || joined.includes('secret')) return 'privacy_policy_denied'
  if (joined.includes('model') || joined.includes('route') || joined.includes('transport')) return 'model_routing_unavailable'
  if (joined.includes('audio')) return 'audio_authority_unverified'
  return 'runtime_response_invalid'
}

function assertUsageAuthorization(value: EditReferenceAudioSoundDesignUsageAuthorization): void {
  if (value.usageEventIds.length < 1 || value.internalCostRecordIds.length < 1) {
    throw new AdapterError('cost_authority_unavailable', 'Audio/Sound Design production authorization requires attempt usage and internal-cost identities.')
  }
}

function assertUsageReceipt(
  request: EditReferenceAudioSoundDesignStudyRequest,
  authorization: EditReferenceAudioSoundDesignUsageAuthorization,
  receipt: EditReferenceAudioSoundDesignUsageReceipt,
  completed: boolean,
): void {
  if (
    !MONEY_MICROS.test(receipt.meteredInternalCostMicros)
    || (completed && BigInt(receipt.meteredInternalCostMicros) <= 0n)
    || BigInt(receipt.meteredInternalCostMicros) > BigInt(request.maximumAuthorizedInternalCostMicros!)
    || JSON.stringify(receipt.usageEventIds) !== JSON.stringify(authorization.usageEventIds)
    || JSON.stringify(receipt.internalCostRecordIds) !== JSON.stringify(authorization.internalCostRecordIds)
  ) throw new AdapterError('internal_cost_usage_unverified', 'Audio/Sound Design production usage receipt is invalid.')
}

function meteredUsage(
  receipt: EditReferenceAudioSoundDesignUsageReceipt,
): NonNullable<PendingBlockedResult['usage']> {
  return {
    internalCostStatus: 'metered',
    meteredInternalCostMicros: receipt.meteredInternalCostMicros,
    usageEventIds: [...receipt.usageEventIds],
    internalCostRecordIds: [...receipt.internalCostRecordIds],
  }
}

function normalizeEvidence(
  evidence: EditReferenceAudioSoundDesignEvidenceManifest,
): EditReferenceAudioSoundDesignEvidenceManifest {
  return {
    mediaStructureEvidenceIds: [...evidence.mediaStructureEvidenceIds].sort(),
    privateAudioEvidenceIds: [...evidence.privateAudioEvidenceIds].sort(),
    technicalLoudnessEvidenceIds: [...evidence.technicalLoudnessEvidenceIds].sort(),
    technicalLowLevelIntervalEvidenceIds: [...evidence.technicalLowLevelIntervalEvidenceIds].sort(),
    transcriptTimingEvidenceIds: [...evidence.transcriptTimingEvidenceIds].sort(),
    beatGridEvidenceIds: [...evidence.beatGridEvidenceIds].sort(),
    visualCueTimingEvidenceIds: [...evidence.visualCueTimingEvidenceIds].sort(),
    studyChatGoalEvidenceIds: [...evidence.studyChatGoalEvidenceIds].sort(),
    rightsAndAssetEvidenceIds: [...evidence.rightsAndAssetEvidenceIds].sort(),
  }
}

function copyEvidence(
  evidence: EditReferenceAudioSoundDesignEvidenceManifest,
): EditReferenceAudioSoundDesignEvidenceManifest {
  return Object.fromEntries(Object.entries(evidence).map(([key, ids]) => [key, [...ids]])) as unknown as EditReferenceAudioSoundDesignEvidenceManifest
}

function allEvidenceIds(evidence: EditReferenceAudioSoundDesignEvidenceManifest): string[] {
  return Object.values(evidence).flatMap((ids) => [...ids])
}

function evidenceItems(
  ids: readonly string[],
  kind: EditReferenceAudioSoundDesignStructuredContext['evidenceItems'][number]['kind'],
  summary: string,
): EditReferenceAudioSoundDesignStructuredContext['evidenceItems'] {
  return ids.map((evidenceId) => ({ evidenceId, kind, summary }))
}

function classifyAdapterError(error: unknown): EditReferenceAudioSoundDesignStudyBlockerCode {
  return error instanceof AdapterError ? error.code : 'runtime_response_invalid'
}

function safeAdapterError(error: unknown): string {
  return error instanceof AdapterError
    ? error.message
    : 'The bounded Audio/Sound Design adapter failed closed without retaining audio bytes, provider payloads, or target instructions.'
}

function currentTime(options: EditReferenceAudioSoundDesignAdapterOptions): string {
  return options.now?.() ?? new Date().toISOString()
}

function sha256(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

const SPEECH_CATEGORIES = new Set([
  'voice_music_balance', 'ducking_behavior', 'silence_breathing_room', 'speech_protection',
])
const SFX_CATEGORIES = new Set(['sfx_density', 'sfx_timing'])

class AdapterError extends Error {
  readonly code: EditReferenceAudioSoundDesignStudyBlockerCode

  constructor(code: EditReferenceAudioSoundDesignStudyBlockerCode, message: string) {
    super(message)
    this.code = code
  }
}
