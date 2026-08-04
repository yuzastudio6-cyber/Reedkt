import { performance } from 'node:perf_hooks'
import {
  analyzePrivateMusicArtifact,
  selectMusicCandidate,
  type CanonicalMusicArtifactResolver,
  type MusicCandidateSelectionDecision,
} from '../../music/music-analysis'
import {
  createMusicArtifact,
  createMusicFinalHandoff,
  hashMusicValue,
  type CanonicalMusicSkillRequest,
  type CanonicalMusicSkillResult,
  type MusicArtifactEnvelope,
  type MusicArtifactRef,
  type MusicCandidateAnalysis,
  type MusicExecutionUnitReceipt,
  type MusicRouteBinding,
  type MusicSoundSupportReceipt,
} from '../../music/music-contracts'
import {
  CanonicalLyria3ProviderAdapter,
  createMusicCompositionBrief,
  type MusicProviderAttempt,
} from '../../music/lyria-provider'
import { compileMusicSync, type MusicBeatAndPhraseMap, type MusicEditorialPlan, type MusicPlacementManifest } from '../../music/music-sync'
import { createMusicSoundSupportRequest, type MusicSoundSupportPort } from '../../music/music-sound-support-port'
import { runCanonicalMusicQa, type CanonicalMusicQaReport } from '../../music/music-qa'
import type {
  MusicContextStudyPayload,
  MusicCueSheetPayload,
  MusicNarrativeArcPayload,
  MusicNeedDecisionPayload,
} from '../../music/music-supervision'
import { musicSkillCapabilityManifest } from './music-capability-manifest'
import { assertMusicRouteAdmission } from './music-admission'
import {
  topologicalMusicExecutionUnits,
  type MusicExecutionGraph,
  type MusicExecutionUnit,
} from './music-execution-graph'
import { validateMusicResultAuthority } from '../../music/music-scope-guard'

export interface ApprovedMusicExecutionPackage {
  schemaVersion: 'approved-music-execution-package-v1'
  packageId: string
  approvedWorkItemId: string
  request: CanonicalMusicSkillRequest
  context: MusicArtifactEnvelope<MusicContextStudyPayload>
  need: MusicArtifactEnvelope<MusicNeedDecisionPayload>
  arc: MusicArtifactEnvelope<MusicNarrativeArcPayload>
  cueSheet: MusicArtifactEnvelope<MusicCueSheetPayload>
  routeBindings: MusicRouteBinding[]
  executionGraph: MusicExecutionGraph
}

interface ExecutionState {
  artifacts: MusicArtifactEnvelope[]
  providerAttempts: MusicProviderAttempt[]
  candidatesByCue: Map<string, MusicArtifactRef[]>
  analysesByCue: Map<string, MusicCandidateAnalysis[]>
  selectionsByCue: Map<string, MusicCandidateSelectionDecision>
  selectedByCue: Map<string, MusicArtifactRef>
  beatMaps: MusicBeatAndPhraseMap[]
  editorials: MusicEditorialPlan[]
  placements: MusicPlacementManifest[]
  soundReceipts: MusicSoundSupportReceipt[]
  unitReceipts: MusicExecutionUnitReceipt[]
  failedUnits: Set<string>
  qa?: CanonicalMusicQaReport
}

function receipt(input: {
  unit: MusicExecutionUnit
  status: MusicExecutionUnitReceipt['status']
  startedAt: string
  completedAt: string
  elapsedMilliseconds: number
  inputArtifacts?: MusicArtifactRef[]
  outputArtifacts?: MusicArtifactRef[]
  outputHashes?: string[]
  runtimeEvidence?: string[]
  qaEvidence?: string[]
  providerAttemptId?: string
  providerCostUsd?: number
  reason?: string
}): MusicExecutionUnitReceipt {
  return {
    unitId: input.unit.unitId,
    ...(input.unit.cueId ? { cueId: input.unit.cueId } : {}),
    status: input.status,
    routeKey: input.unit.route.routeKey,
    routeVersion: input.unit.route.routeVersion,
    routeHash: input.unit.route.routeHash,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    elapsedMilliseconds: Math.max(0, Math.round(input.elapsedMilliseconds)),
    inputArtifactIds: input.inputArtifacts?.map((item) => item.artifactId) ?? input.unit.inputArtifactIds,
    inputArtifactHashes: input.inputArtifacts?.map((item) => item.checksumSha256) ?? input.unit.inputArtifactHashes,
    outputArtifactIds: input.outputArtifacts?.map((item) => item.artifactId) ?? [],
    outputArtifactHashes: [
      ...(input.outputArtifacts?.map((item) => item.checksumSha256) ?? []),
      ...(input.outputHashes ?? []),
    ],
    runtimeEvidence: input.runtimeEvidence ?? [],
    costEvidence: { actualCredits: 0, internalToolCostUsd: 0, providerCostUsd: input.providerCostUsd ?? 0 },
    qaEvidence: input.qaEvidence ?? [],
    ...(input.providerAttemptId ? { providerAttemptId: input.providerAttemptId } : {}),
    ...(input.reason ? { reason: input.reason } : {}),
  }
}

function cueFor(request: CanonicalMusicSkillRequest, cueId: string) {
  return request.proposedCues.find((cue) => cue.cueId === cueId)
}

function sourceForBinding(request: CanonicalMusicSkillRequest, binding: MusicRouteBinding): MusicArtifactRef {
  const sourceKind = binding.acquisitionDecision === 'preserve_source_music' ? 'source_media'
    : binding.acquisitionDecision === 'user_provided_music' ? 'user_upload'
      : binding.acquisitionDecision === 'project_music' ? 'project_library'
        : binding.acquisitionDecision === 'workspace_music' ? 'workspace_library'
          : binding.acquisitionDecision === 'internal_music' ? 'internal_library' : undefined
  if (!sourceKind) throw new Error(`Music acquisition ${binding.acquisitionDecision} is not a source route.`)
  const eligibleIds = request.rightsAndProvenanceRefs.filter((rights) =>
    rights.source === sourceKind && rights.commercialUse === 'allowed' &&
    rights.platformUse === 'allowed' && rights.editingPermission === 'allowed').map((rights) => rights.assetId)
  const matches = request.inputAssetRefs.filter((asset) =>
    eligibleIds.includes(asset.artifactId) && binding.sourceBindings.includes(asset.artifactId))
  if (matches.length !== 1) throw new Error(`Music cue ${binding.cueId} source binding is ambiguous or unavailable.`)
  return matches[0]!
}

function artifactFromPayload(input: {
  request: CanonicalMusicSkillRequest
  artifactType: string
  artifactId: string
  cueId?: string
  payload: unknown
  evidence: string[]
}): MusicArtifactEnvelope {
  return createMusicArtifact({
    artifactId: input.artifactId, artifactVersion: 1,
    schemaVersion: `${input.artifactType}.schema.v1`, artifactType: input.artifactType,
    requestId: input.request.requestId,
    sourceArtifactHashes: input.request.inputAssetRefs.map((item) => item.checksumSha256),
    timelineHash: input.request.timelineBinding.timelineManifestHash,
    timelineRate: input.request.timelineBinding.rationalTimelineRate,
    ...(input.cueId ? { cueId: input.cueId } : {}),
    qualificationEvidence: input.evidence,
    createdAt: new Date().toISOString(),
    invalidationKeys: ['timeline_hash', 'source_hash', 'speech_evidence', 'rights', 'provider_profile', 'sound_result'],
    revisionLineage: [], payload: input.payload,
  })
}

export class CanonicalMusicRouteExecutor {
  readonly #artifacts: CanonicalMusicArtifactResolver
  readonly #provider?: CanonicalLyria3ProviderAdapter
  readonly #sound?: MusicSoundSupportPort
  readonly #replays = new Map<string, CanonicalMusicSkillResult>()

  constructor(input: {
    artifacts: CanonicalMusicArtifactResolver
    provider?: CanonicalLyria3ProviderAdapter
    sound?: MusicSoundSupportPort
  }) {
    this.#artifacts = input.artifacts
    this.#provider = input.provider
    this.#sound = input.sound
  }

  async execute(input: ApprovedMusicExecutionPackage): Promise<CanonicalMusicSkillResult> {
    const replay = this.#replays.get(input.request.idempotencyKey)
    if (replay) return structuredClone(replay)
    if (input.request.requestedExecutionMode === 'planning') throw new Error('Planning-only Music requests cannot execute.')
    if (input.executionGraph.requestId !== input.request.requestId) throw new Error('Music graph/request binding mismatch.')
    const state: ExecutionState = {
      artifacts: [input.context, input.need, input.arc, input.cueSheet], providerAttempts: [],
      candidatesByCue: new Map(), analysesByCue: new Map(), selectionsByCue: new Map(), selectedByCue: new Map(),
      beatMaps: [], editorials: [], placements: [], soundReceipts: [], unitReceipts: [], failedUnits: new Set(),
    }
    const startedAt = new Date().toISOString()
    const startClock = performance.now()
    for (const unit of topologicalMusicExecutionUnits(input.executionGraph)) {
      const blocked = unit.dependencyUnitIds.some((id) => state.failedUnits.has(id) ||
        state.unitReceipts.some((item) => item.unitId === id && (item.status === 'failed' || item.status === 'blocked')))
      if (blocked) {
        const now = new Date().toISOString()
        state.unitReceipts.push(receipt({ unit, status: 'blocked', startedAt: now, completedAt: now,
          elapsedMilliseconds: 0, reason: 'blocked_dependency' }))
        state.failedUnits.add(unit.unitId)
        continue
      }
      const unitStart = performance.now()
      const unitStartedAt = new Date().toISOString()
      try {
        const unitMode = [
          'context_study', 'music_need_decision', 'narrative_arc_planning', 'cue_planning', 'planning_only',
        ].includes(unit.unitKind) ? 'planning' : input.request.requestedExecutionMode
        assertMusicRouteAdmission({ ...unit.route, jobType: unit.jobType, mode: unitMode })
        const details = await this.#executeUnit({ package: input, unit, state })
        state.unitReceipts.push(receipt({
          unit, status: 'completed', startedAt: unitStartedAt, completedAt: new Date().toISOString(),
          elapsedMilliseconds: performance.now() - unitStart, ...details,
        }))
      } catch (error) {
        state.failedUnits.add(unit.unitId)
        state.unitReceipts.push(receipt({
          unit, status: 'failed', startedAt: unitStartedAt, completedAt: new Date().toISOString(),
          elapsedMilliseconds: performance.now() - unitStart,
          reason: error instanceof Error ? error.message : String(error),
        }))
        if (unit.failurePolicy === 'fail_graph') break
      }
    }
    const result = this.#buildResult({ package: input, state, startedAt, elapsedMilliseconds: performance.now() - startClock })
    const authority = validateMusicResultAuthority({ request: input.request, result })
    if (!authority.ok) throw new Error(`Canonical Music result authority failed: ${authority.code}:${authority.errors.join(',')}`)
    this.#replays.set(input.request.idempotencyKey, structuredClone(result))
    return result
  }

  async #executeUnit(input: {
    package: ApprovedMusicExecutionPackage
    unit: MusicExecutionUnit
    state: ExecutionState
  }): Promise<Partial<Parameters<typeof receipt>[0]>> {
    const request = input.package.request
    const cueId = input.unit.cueId
    if (['context_study', 'music_need_decision', 'narrative_arc_planning', 'cue_planning', 'planning_only'].includes(input.unit.unitKind)) {
      return { outputHashes: [input.unit.operationSpec.operationSpecHash], runtimeEvidence: ['deterministic_supervision_artifact'] }
    }
    if (input.unit.unitKind === 'no_music') {
      return { outputHashes: [hashMusicValue({ cueId, route: input.unit.route })], runtimeEvidence: ['typed_no_music_or_ambience_handoff'] }
    }
    if (!cueId) {
      if (input.unit.unitKind === 'continuity_qa') {
        input.state.qa = runCanonicalMusicQa({
          request, routes: input.package.routeBindings,
          analyses: [...input.state.analysesByCue.values()].flat(), placements: input.state.placements,
          soundReceipts: input.state.soundReceipts, selectedArtifactIds: [...input.state.selectedByCue.values()].map((item) => item.artifactId),
        })
        const artifact = artifactFromPayload({ request, artifactType: 'music_qa_report_v1', artifactId: `music.qa.${request.requestId}`,
          payload: input.state.qa, evidence: ['actual_audio_and_sound_receipts'] })
        input.state.artifacts.push(artifact)
        return { outputHashes: [artifact.artifactHash], qaEvidence: [input.state.qa.reportHash] }
      }
      if (input.unit.unitKind === 'handoff') return { outputHashes: [hashMusicValue(input.state.placements)] }
      return { outputHashes: [input.unit.operationSpec.operationSpecHash] }
    }
    const binding = input.package.routeBindings.find((item) => item.cueId === cueId)
    const cue = cueFor(request, cueId)
    if (!binding || !cue) throw new Error(`Music execution unit lost exact cue binding ${cueId}.`)
    if (input.unit.unitKind === 'acquisition') {
      const source = sourceForBinding(request, binding)
      input.state.candidatesByCue.set(cueId, [source])
      return { inputArtifacts: [source], outputArtifacts: [source], runtimeEvidence: ['rights_bound_private_source_reuse'] }
    }
    if (input.unit.unitKind === 'provider_attempt') {
      if (!this.#provider) throw new Error('Canonical Lyria 3 provider adapter was not injected.')
      const brief = createMusicCompositionBrief({
        briefId: `music.brief.${request.requestId}.${cueId}`, briefVersion: '1.0.0', cueId,
        exactRange: cue.exactRange, timelineRate: request.timelineBinding.rationalTimelineRate,
        narrativeFunction: cue.narrativeFunction, viewerEmotionTarget: cue.targetStoryState,
        cueRole: cue.cueRole, motifRole: cue.motifRole,
        durationFrames: cue.exactRange.endFrameExclusive - cue.exactRange.startFrame,
        ...(cue.tempoRangeBpm ? { tempoRange: cue.tempoRangeBpm } : {}),
        harmonicDirection: cue.harmonicDirection, energyArc: cue.energyArc,
        instrumentation: cue.instrumentation, arrangementDensity: cue.arrangementDensity,
        rhythmProfile: cue.rhythmProfile, performanceFeel: 'professional restrained performance',
        vocalPolicy: cue.vocalPolicy, lyricPolicy: cue.lyricPolicy, languagePolicy: cue.languagePolicy,
        speechSafety: cue.protectedSpeechRanges.length > 0 ? 'voice first; instrumental and sparse' : 'avoid masking story sound',
        introBehavior: 'enter cleanly at an editorial boundary', developmentBehavior: 'develop without repeated artificial builds',
        transitionBehavior: 'support the approved picture transition without owning it',
        endingBehavior: cue.cueRole === 'outro' ? 'resolve musically' : 'provide a clean editorial exit',
        loopPolicy: 'loop only when measured continuity supports it', ambienceRelationship: 'preserve natural Sound priority',
        sfxRelationship: 'avoid collision with approved Sound accents',
        styleConstraints: request.userMusicPolicy.customDirectives,
        doNotCopyConstraints: ['no_melody_copy', 'no_lyric_copy', 'no_hook_copy', 'no_artist_imitation', 'no_recognizable_arrangement_copy'],
        qualityRequirements: ['clean_output', 'speech_safe', 'editorially_usable_ending'],
        sourceEvidenceRefs: request.contextEvidence.map((item) => item.evidenceHash),
        approvalRef: request.approvedSnapshotRef.snapshotId,
      })
      const attempt = await this.#provider.execute({
        request, cueId, route: input.unit.route, brief,
        candidateCount: request.approvalAndBudget.maximumCandidates,
        mode: request.requestedExecutionMode === 'production' ? 'production' : 'fixture',
      })
      input.state.providerAttempts.push(attempt)
      if (attempt.status !== 'succeeded') throw new Error(`Music provider attempt ${attempt.status}; reconciliation required before retry.`)
      input.state.candidatesByCue.set(cueId, attempt.candidateArtifacts)
      const briefArtifact = artifactFromPayload({ request, artifactType: 'music_composition_brief_v1', artifactId: brief.briefId,
        cueId, payload: brief, evidence: ['provider_neutral_brief'] })
      input.state.artifacts.push(briefArtifact)
      return {
        outputArtifacts: attempt.candidateArtifacts, outputHashes: [brief.briefHash],
        runtimeEvidence: ['lyria3_injected_transport_same_route_graph', 'private_output_ingest', 'store_false'],
        providerAttemptId: attempt.attemptId, providerCostUsd: attempt.actualCostUsd,
      }
    }
    if (input.unit.unitKind === 'candidate_analysis') {
      const candidates = input.state.candidatesByCue.get(cueId) ?? []
      if (candidates.length === 0) throw new Error(`Music cue ${cueId} has no candidate artifacts.`)
      const analyses: MusicCandidateAnalysis[] = []
      for (const candidate of candidates) {
        const resolved = await this.#artifacts.resolve(candidate)
        const analysis = await analyzePrivateMusicArtifact({ resolved, timelineRate: request.timelineBinding.rationalTimelineRate })
        analyses.push(analysis)
        input.state.artifacts.push(artifactFromPayload({
          request, artifactType: 'music_candidate_analysis_v1', artifactId: `music.analysis.${candidate.artifactId}`,
          cueId, payload: analysis, evidence: analysis.qualificationEvidence,
        }))
      }
      input.state.analysesByCue.set(cueId, analyses)
      return { inputArtifacts: candidates, outputHashes: analyses.map((analysis) => hashMusicValue(analysis)),
        runtimeEvidence: ['every_candidate_independently_decoded_and_measured'] }
    }
    if (input.unit.unitKind === 'candidate_selection') {
      const analyses = input.state.analysesByCue.get(cueId) ?? []
      const selection = selectMusicCandidate({
        analyses,
        expectedDurationFrames: cue.exactRange.endFrameExclusive - cue.exactRange.startFrame,
        timelineRate: request.timelineBinding.rationalTimelineRate,
        speechProtected: cue.protectedSpeechRanges.length > 0,
      })
      input.state.selectionsByCue.set(cueId, selection)
      if (!selection.selectedCandidateId) throw new Error(`Music cue ${cueId} has no qualified candidate.`)
      const selected = (input.state.candidatesByCue.get(cueId) ?? []).find((item) => item.artifactId === selection.selectedCandidateId)
      if (!selected) throw new Error(`Music selection ${selection.selectedCandidateId} is unavailable.`)
      input.state.selectedByCue.set(cueId, selected)
      input.state.artifacts.push(artifactFromPayload({ request, artifactType: 'music_candidate_selection_decision_v1',
        artifactId: `music.selection.${request.requestId}.${cueId}`, cueId, payload: selection,
        evidence: ['ranking_independent_of_provider_array_order', selection.evidenceHash] }))
      return { outputArtifacts: [selected], outputHashes: [selection.evidenceHash], runtimeEvidence: ['typed_measured_candidate_selection'] }
    }
    if (input.unit.unitKind === 'music_sync') {
      const selected = input.state.selectedByCue.get(cueId)
      const analysis = (input.state.analysesByCue.get(cueId) ?? []).find((item) =>
        item.candidateArtifact.artifactId === selected?.artifactId)
      if (!selected || !analysis) throw new Error(`MusicSync lacks selected candidate evidence for ${cueId}.`)
      const sync = compileMusicSync({ cue, analysis, timelineHash: request.timelineBinding.timelineManifestHash,
        timelineRate: request.timelineBinding.rationalTimelineRate })
      input.state.beatMaps.push(sync.beatMap)
      input.state.editorials.push(sync.editorial)
      input.state.placements.push(sync.placement)
      for (const [type, value, id] of [
        ['music_beat_phrase_map_v1', sync.beatMap, sync.beatMap.mapId],
        ['music_editorial_plan_v1', sync.editorial, sync.editorial.planId],
        ['music_placement_manifest_v1', sync.placement, sync.placement.placementId],
      ] as const) input.state.artifacts.push(artifactFromPayload({ request, artifactType: type, artifactId: id, cueId,
        payload: value, evidence: ['exact_rational_frame_sample_binding'] }))
      return { outputHashes: [sync.beatMap.mapHash, sync.editorial.planHash, sync.placement.placementHash],
        runtimeEvidence: ['frame_accurate_music_sync', 'no_forced_cut_to_beat', 'no_visual_mutation'] }
    }
    if (input.unit.unitKind === 'sound_support') {
      if (!this.#sound) throw new Error('Canonical Sound v4 public port was not injected.')
      const selected = input.state.selectedByCue.get(cueId)
      const editorial = input.state.editorials.find((item) => item.cueId === cueId)
      if (!selected || !editorial) throw new Error(`Sound support lacks selected Music/editorial plan for ${cueId}.`)
      const supportRequest = createMusicSoundSupportRequest({
        request, cueId, delegatedRange: cue.exactRange, selectedMusicArtifact: selected,
        requiredOperations: editorial.technicalOperations.filter((item): item is Parameters<typeof createMusicSoundSupportRequest>[0]['requiredOperations'][number] => [
          'trim', 'cut', 'fade', 'crossfade', 'gain', 'normalize', 'loop', 'resample', 'channel_conversion',
          'time_stretch', 'pitch_shift', 'place', 'dialogue_ducking', 'eq', 'dynamics', 'pan', 'stem_rendering', 'technical_qa',
        ].includes(item)),
        operationParameters: {
          targetDurationFrames: cue.exactRange.endFrameExclusive - cue.exactRange.startFrame,
          fadeInFrames: cue.fadeInFrames, fadeOutFrames: cue.fadeOutFrames, gainDb: -3,
          tempoRatio: editorial.timeStretchRatio,
          loopCrossfadeFrames: Math.max(1, Math.min(cue.fadeInFrames || 1, cue.fadeOutFrames || 1)),
        },
      })
      const result = await this.#sound.execute(supportRequest)
      input.state.soundReceipts.push(result.receipt)
      return { inputArtifacts: [selected], outputArtifacts: [...result.receipt.processedMusicAssets, ...result.receipt.musicStemAssets],
        outputHashes: [result.receipt.soundResultHash, result.receipt.callerReceiptHash],
        runtimeEvidence: ['canonical_sound_v4_public_service_only'], qaEvidence: [
          ...result.receipt.technicalQaRefs, ...result.receipt.synchronizationQaRefs, ...result.receipt.mixQaRefs,
        ] }
    }
    if (input.unit.unitKind === 'cue_qa') {
      const sound = input.state.soundReceipts.find((item) => item.cueId === cueId)
      if (!sound) throw new Error(`Music cue ${cueId} lacks actual Sound receipt for QA.`)
      return { outputHashes: [sound.soundResultHash], qaEvidence: [
        ...sound.technicalQaRefs, ...sound.synchronizationQaRefs, ...sound.mixQaRefs,
      ], runtimeEvidence: ['actual_sound_output_qa_consumed'] }
    }
    return { outputHashes: [input.unit.operationSpec.operationSpecHash] }
  }

  #buildResult(input: {
    package: ApprovedMusicExecutionPackage
    state: ExecutionState
    startedAt: string
    elapsedMilliseconds: number
  }): CanonicalMusicSkillResult {
    const request = input.package.request
    const noMusicBindings = input.package.routeBindings.filter((binding) =>
      binding.acquisitionDecision === 'no_music' || binding.acquisitionDecision === 'intentional_silence')
    const ambienceBindings = input.package.routeBindings.filter((binding) => binding.acquisitionDecision === 'ambience_only')
    const selected = [...input.state.selectedByCue.values()]
    const processed = input.state.soundReceipts.flatMap((receipt) => receipt.processedMusicAssets)
    const stems = input.state.soundReceipts.flatMap((receipt) => receipt.musicStemAssets)
    const mutationRanges = input.state.soundReceipts.flatMap((receipt) => receipt.mutationRanges)
    const successfulCueCount = input.package.routeBindings.filter((binding) =>
      noMusicBindings.includes(binding) || ambienceBindings.includes(binding) || input.state.soundReceipts.some((receipt) => receipt.cueId === binding.cueId)).length
    const failed = input.state.failedUnits.size > 0
    const allNoMusic = input.package.routeBindings.length > 0 && noMusicBindings.length === input.package.routeBindings.length
    const allAmbience = input.package.routeBindings.length > 0 && ambienceBindings.length === input.package.routeBindings.length
    const requiredCompleted = successfulCueCount === input.package.routeBindings.length
    const status: CanonicalMusicSkillResult['status'] = allNoMusic ? 'no_music' : allAmbience ? 'ambience_only'
      : failed && successfulCueCount > 0 ? 'partial' : failed ? 'blocked'
        : requiredCompleted && (processed.length > 0 || selected.length > 0) ? 'completed' : 'blocked'
    const qa = input.state.qa ?? runCanonicalMusicQa({
      request, routes: input.package.routeBindings,
      analyses: [...input.state.analysesByCue.values()].flat(), placements: input.state.placements,
      soundReceipts: input.state.soundReceipts, selectedArtifactIds: selected.map((item) => item.artifactId),
    })
    const intentionalRanges = request.proposedCues.flatMap((cue) => cue.intentionalNoMusicRanges)
    const handoff = createMusicFinalHandoff({
      handoffId: `music.handoff.${request.requestId}`,
      requestId: request.requestId,
      approvedSnapshotRef: request.approvedSnapshotRef,
      timelineBinding: request.timelineBinding,
      selectedMusicAssets: selected,
      processedMusicAssets: processed,
      musicStemAssets: stems,
      musicNarrativeArcRef: input.package.arc.artifactId,
      cueSheetRef: input.package.cueSheet.artifactId,
      placementManifestRefs: input.state.placements.map((item) => item.placementHash),
      beatAndPhraseMapRefs: input.state.beatMaps.map((item) => item.mapHash),
      mixIntentManifestRef: input.state.editorials.length > 0 ? `music.mix-intent.${request.requestId}` : undefined,
      soundSupportReceiptRefs: input.state.soundReceipts.map((item) => item.soundResultHash),
      cueQaRefs: input.state.soundReceipts.flatMap((item) => item.technicalQaRefs),
      continuityQaRef: qa.reportHash,
      provenanceRefs: request.rightsAndProvenanceRefs.map((item) => item.rightsId),
      usagePolicyRefs: selected.map(() => 'music.usage.project_only.v1'),
      actualMusicMutationRanges: mutationRanges,
      intentionalNoMusicRanges: intentionalRanges.length > 0 ? intentionalRanges : allNoMusic
        ? request.scopeAuthority.authorizedMusicWriteRanges : [],
      unresolvedReviewItems: qa.findings.filter((item) => item.status === 'needs_review').map((item) => item.code),
      intentionalNoMusic: allNoMusic,
      ambienceOnly: allAmbience,
      createdAt: new Date().toISOString(),
    })
    if (status === 'completed' && handoff.selectedMusicAssets.length === 0) throw new Error('Music handoff cannot complete without a real selected artifact.')
    const actualMusicCredits = input.state.providerAttempts.reduce((sum, attempt) => sum + attempt.actualCostUsd / 0.1, 0)
    const nestedSoundCredits = input.state.soundReceipts.reduce((sum, item) => sum + item.nestedActualCredits, 0)
    const callerReceiptBase = {
      callerSkillKey: request.caller.callerSkillKey,
      parentWorkItemId: request.caller.parentWorkItemId,
      exactAuthorityRef: request.scopeAuthority.parentAuthorityRef,
      resultHash: '',
      finalRenderOutsideMusic: true as const,
      musicDidNotOwnSoundTools: true as const,
    }
    const result: CanonicalMusicSkillResult = {
      schemaVersion: 'canonical-music-result-v1', requestId: request.requestId,
      musicSkillKey: 'music', musicSkillVersion: musicSkillCapabilityManifest.skillVersion,
      musicManifestHash: musicSkillCapabilityManifest.manifestHash,
      capabilityKey: `music.${request.jobType}`, capabilityVersion: musicSkillCapabilityManifest.skillVersion,
      qualificationStatusUsed: request.requestedExecutionMode === 'production' ? 'production_qualified'
        : request.requestedExecutionMode === 'private_internal' ? 'internal_execution_qualified' : 'planning_qualified',
      status,
      contextStudyRef: input.package.context.artifactId, musicNeedDecisionRef: input.package.need.artifactId,
      musicNarrativeArcRef: input.package.arc.artifactId, cueSheetRef: input.package.cueSheet.artifactId,
      acquisitionPlanRef: hashMusicValue(input.package.routeBindings),
      providerAttemptRefs: input.state.providerAttempts.map((item) => item.attemptId),
      candidateArtifactRefs: [...input.state.candidatesByCue.values()].flat(),
      candidateAnalysisRefs: [...input.state.analysesByCue.values()].flat().map((item) => hashMusicValue(item)),
      selectionDecisionRefs: [...input.state.selectionsByCue.values()].map((item) => item.evidenceHash),
      beatAndPhraseMapRefs: input.state.beatMaps.map((item) => item.mapHash),
      placementManifestRefs: input.state.placements.map((item) => item.placementHash),
      musicMixIntentManifestRef: input.state.editorials.length > 0 ? `music.mix-intent.${request.requestId}` : undefined,
      soundSupportReceipts: input.state.soundReceipts,
      selectedMusicAssetRefs: selected,
      processedMusicAssetRefs: processed,
      musicStemAssetRefs: stems,
      cueQaRefs: input.state.soundReceipts.flatMap((item) => item.technicalQaRefs),
      continuityQaRef: qa.reportHash,
      provenanceRefs: request.rightsAndProvenanceRefs.map((item) => item.rightsId),
      actualMusicMutationRanges: mutationRanges,
      intentionalNoMusicRanges: handoff.intentionalNoMusicRanges,
      finalCompositionHandoff: handoff,
      artifacts: input.state.artifacts,
      unitReceipts: input.state.unitReceipts,
      routeReceipts: input.state.unitReceipts.map((item) => hashMusicValue(item)),
      costEvidence: {
        estimatedCredits: input.package.routeBindings.reduce((sum, item) => sum + item.estimatedCredits, 0),
        actualMusicCredits, nestedSoundCredits, totalActualCredits: actualMusicCredits + nestedSoundCredits,
      },
      elapsedTimeEvidence: { startedAt: input.startedAt, completedAt: new Date().toISOString(), actualMilliseconds: Math.round(input.elapsedMilliseconds) },
      unresolvedDependencies: input.state.unitReceipts.filter((item) => item.status === 'blocked').map((item) => item.unitId),
      reviewRequiredItems: qa.findings.filter((item) => item.status === 'needs_review').map((item) => item.code),
      callerReceipt: callerReceiptBase,
    }
    result.callerReceipt.resultHash = hashMusicValue({ ...result, callerReceipt: callerReceiptBase })
    return Object.freeze(result)
  }
}
