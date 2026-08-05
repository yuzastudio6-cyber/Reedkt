import { performance } from 'node:perf_hooks'
import { samplesToFrames } from '../core/timeline-rate'
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
  type MusicFinalCompositionHandoff,
  type MusicRouteStepReceipt,
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
import type { CanonicalMusicContextPackage } from '../../music/music-context'
import { getMusicToolRouteManifest, type MusicRouteStep } from '../../music/music-tool-routes'
import { resolveMusicExactOperationHandler, type MusicExactOperationHandler } from './music-operation-handler-registry'
import { createMusicCostEvidence, providerUsdToCredits } from '../../music/music-rate-card'

export interface ApprovedMusicExecutionPackage {
  schemaVersion: 'approved-music-execution-package-v2'
  packageId: string
  approvedWorkItemId: string
  request: CanonicalMusicSkillRequest
  resolvedContext: CanonicalMusicContextPackage
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
  handoff?: MusicFinalCompositionHandoff
}

function buildExecutionHandoff(input: {
  package: ApprovedMusicExecutionPackage
  state: ExecutionState
}): MusicFinalCompositionHandoff {
  const request = input.package.request
  const noMusicBindings = input.package.routeBindings.filter((binding) =>
    binding.acquisitionDecision === 'no_music' || binding.acquisitionDecision === 'intentional_silence')
  const ambienceBindings = input.package.routeBindings.filter((binding) => binding.acquisitionDecision === 'ambience_only')
  const allNoMusic = input.package.routeBindings.length > 0 && noMusicBindings.length === input.package.routeBindings.length
  const allAmbience = input.package.routeBindings.length > 0 && ambienceBindings.length === input.package.routeBindings.length
  const selected = [...input.state.selectedByCue.values()]
  const processed = input.state.soundReceipts.flatMap((receipt) => receipt.processedMusicAssets)
  const stems = input.state.soundReceipts.flatMap((receipt) => receipt.musicStemAssets)
  const qa = input.state.qa ?? runCanonicalMusicQa({
    request, routes: input.package.routeBindings,
    analyses: [...input.state.analysesByCue.values()].flat(), placements: input.state.placements,
    soundReceipts: input.state.soundReceipts, selectedArtifactIds: selected.map((item) => item.artifactId),
  })
  input.state.qa = qa
  const intentionalRanges = input.package.cueSheet.payload.cues.flatMap((cue) => cue.intentionalNoMusicRanges)
  return createMusicFinalHandoff({
    handoffId: `music.handoff.${request.requestId}`, requestId: request.requestId,
    approvedSnapshotRef: request.approvedSnapshotRef, timelineBinding: request.timelineBinding,
    selectedMusicAssets: selected, processedMusicAssets: processed, musicStemAssets: stems,
    musicNarrativeArcRef: input.package.arc.artifactId, cueSheetRef: input.package.cueSheet.artifactId,
    placementManifestRefs: input.state.placements.map((item) => item.placementHash),
    beatAndPhraseMapRefs: input.state.beatMaps.map((item) => item.mapHash),
    mixIntentManifestRef: input.state.artifacts.find((artifact) => artifact.artifactType === 'music_mix_intent_manifest_v2')?.artifactHash,
    soundSupportReceiptRefs: input.state.soundReceipts.map((item) => item.soundResultHash),
    cueQaRefs: input.state.soundReceipts.flatMap((item) => item.technicalQaRefs),
    continuityQaRef: qa.reportHash,
    provenanceRefs: request.rightsAndProvenanceRefs.map((item) => item.rightsId),
    usagePolicyRefs: selected.map(() => 'music.usage.project_only.v2'),
    actualMusicMutationRanges: input.state.soundReceipts.flatMap((receipt) => receipt.mutationRanges),
    intentionalNoMusicRanges: intentionalRanges.length > 0 ? intentionalRanges
      : allNoMusic ? request.scopeAuthority.authorizedMusicWriteRanges : [],
    unresolvedReviewItems: qa.findings.filter((item) => item.status === 'needs_review').map((item) => item.code),
    intentionalNoMusic: allNoMusic, ambienceOnly: allAmbience, createdAt: new Date().toISOString(),
  })
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
  stepReceipts?: MusicRouteStepReceipt[]
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
    costEvidence: { actualCredits: providerUsdToCredits(input.providerCostUsd ?? 0),
      internalToolCostUsd: 0, providerCostUsd: input.providerCostUsd ?? 0 },
    qaEvidence: input.qaEvidence ?? [],
    stepReceipts: input.stepReceipts ?? [],
    ...(input.providerAttemptId ? { providerAttemptId: input.providerAttemptId } : {}),
    ...(input.reason ? { reason: input.reason } : {}),
  }
}

function routeStepReceipt(input: {
  step: MusicRouteStep
  handler: MusicExactOperationHandler
  status: MusicRouteStepReceipt['status']
  startedAt: string
  completedAt: string
  elapsedMilliseconds: number
  inputArtifactIds: string[]
  inputArtifactHashes: string[]
  outputArtifactIds: string[]
  outputArtifactHashes: string[]
  runtimeEvidence: string[]
  qaEvidence: string[]
  providerCostUsd: number
  providerAttemptId?: string
  reason?: string
}): MusicRouteStepReceipt {
  const base = {
    stepKey: input.step.stepKey, handlerIdentity: input.handler.handlerIdentity,
    toolKey: input.step.toolKey, toolVersion: input.step.toolVersion,
    operationKey: input.step.operationKey, operationVersion: input.step.operationVersion,
    operationProfileKey: input.step.operationProfileKey,
    operationProfileVersion: input.step.operationProfileVersion,
    status: input.status, startedAt: input.startedAt, completedAt: input.completedAt,
    elapsedMilliseconds: Math.max(0, Math.round(input.elapsedMilliseconds)),
    inputArtifactIds: input.inputArtifactIds, inputArtifactHashes: input.inputArtifactHashes,
    outputArtifactIds: input.outputArtifactIds, outputArtifactHashes: input.outputArtifactHashes,
    runtimeEvidence: input.runtimeEvidence,
    costEvidence: { actualCredits: providerUsdToCredits(input.providerCostUsd),
      internalToolCostUsd: 0, providerCostUsd: input.providerCostUsd },
    qaEvidence: input.qaEvidence,
    ...(input.providerAttemptId ? { providerAttemptId: input.providerAttemptId } : {}),
    ...(input.reason ? { reason: input.reason } : {}),
  }
  return { ...base, receiptHash: hashMusicValue(base) }
}

function cueFor(cueSheet: MusicArtifactEnvelope<MusicCueSheetPayload>, cueId: string) {
  return cueSheet.payload.cues.find((cue) => cue.cueId === cueId)
}

function sourcesForBinding(request: CanonicalMusicSkillRequest, binding: MusicRouteBinding): MusicArtifactRef[] {
  const sourceKind = binding.acquisitionDecision === 'preserve_source_music' ? 'source_media'
    : binding.acquisitionDecision === 'user_provided_music' ? 'user_upload'
      : binding.acquisitionDecision === 'project_music' ? 'project_library'
        : binding.acquisitionDecision === 'workspace_music' ? 'workspace_library'
          : binding.acquisitionDecision === 'internal_music' ? 'internal_library' : undefined
  if (!sourceKind) throw new Error(`Music acquisition ${binding.acquisitionDecision} is not a source route.`)
  const eligibleIds = request.rightsAndProvenanceRefs.filter((rights) =>
    rights.source === sourceKind && rights.commercialUse === 'allowed' &&
    rights.platformUse === 'allowed' && rights.editingPermission === 'allowed' &&
    (!rights.expiresAt || Date.parse(rights.expiresAt) > Date.now()) &&
    rights.authorizedProjectIds.includes(request.projectBinding.projectId) &&
    (sourceKind !== 'workspace_library' || rights.authorizedWorkspaceIds.includes(request.projectBinding.workspaceId)) &&
    request.projectBinding.platformIds.every((platform) => rights.authorizedPlatformIds.includes(platform)))
    .map((rights) => rights.assetId)
  const matches = request.inputAssetRefs.filter((asset) =>
    eligibleIds.includes(asset.artifactId) && binding.sourceBindings.includes(asset.artifactId))
  if (matches.length === 0) throw new Error(`Music cue ${binding.cueId} has no admitted rights-bound source candidate.`)
  if (new Set(matches.map((asset) => `${asset.artifactId}:${asset.version}:${asset.checksumSha256}`)).size !== matches.length) {
    throw new Error(`Music cue ${binding.cueId} has duplicate source-candidate identity.`)
  }
  return matches
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
    schemaVersion: `${input.artifactType}.schema.v2`, artifactType: input.artifactType,
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
  readonly #replays = new Map<string, { fingerprint: string; result: CanonicalMusicSkillResult }>()

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
    const executionFingerprint = hashMusicValue({
      schemaVersion: input.schemaVersion,
      request: input.request,
      resolvedContextHash: input.resolvedContext.packageHash,
      contextPayload: input.context.payload,
      needPayload: input.need.payload,
      arcPayload: input.arc.payload,
      cueSheetPayload: input.cueSheet.payload,
      routeBindings: input.routeBindings,
      executionRoutes: input.executionGraph.units.map((unit) => ({
        unitId: unit.unitId, cueId: unit.cueId, route: unit.route,
        targetRange: unit.targetRange, dependencyUnitIds: unit.dependencyUnitIds,
        operationSpec: { ...unit.operationSpec, operationSpecHash: undefined },
      })),
      musicManifestHash: musicSkillCapabilityManifest.manifestHash,
    })
    const replay = this.#replays.get(input.request.idempotencyKey)
    if (replay) {
      if (replay.fingerprint !== executionFingerprint) {
        throw new Error('Music execution idempotency collision: the key is already bound to different immutable inputs.')
      }
      return structuredClone(replay.result)
    }
    if (input.request.requestedExecutionMode === 'planning') throw new Error('Planning-only Music requests cannot execute.')
    if (input.executionGraph.requestId !== input.request.requestId) throw new Error('Music graph/request binding mismatch.')
    const state: ExecutionState = {
      artifacts: [
        input.context, input.need, input.arc, input.cueSheet,
        artifactFromPayload({ request: input.request, artifactType: 'music_motif_plan_v2',
          artifactId: `music.motif.${input.request.requestId}`, payload: {
            motifCues: input.cueSheet.payload.cues.filter((cue) => cue.motifRole !== 'none')
              .map((cue) => ({ cueId: cue.cueId, role: cue.motifRole })),
            noMotifRanges: input.cueSheet.payload.cues.filter((cue) => cue.motifRole === 'none')
              .map((cue) => cue.exactRange),
          }, evidence: ['cue_specific_motif_roles', 'no_motif_is_valid'] }),
        artifactFromPayload({ request: input.request, artifactType: 'music_continuity_plan_v2',
          artifactId: `music.continuity-plan.${input.request.requestId}`, payload: {
            cueFamilies: input.routeBindings.map((binding) => ({ cueId: binding.cueId, acquisitionDecision: binding.acquisitionDecision })),
            silenceRanges: input.cueSheet.payload.cues.flatMap((cue) => cue.intentionalNoMusicRanges),
            speechPriority: true, ambiencePriority: input.request.userMusicPolicy.preserveNaturalSound,
          }, evidence: ['whole_video_read_bounded_write', 'cue_family_continuity_planned'] }),
        artifactFromPayload({ request: input.request, artifactType: 'music_acquisition_plan_v2',
          artifactId: `music.acquisition.${input.request.requestId}`, payload: input.routeBindings,
          evidence: ['one_exact_route_decision_per_cue', 'professional_acquisition_order'] }),
        ...(input.need.payload.decision === 'intentional_silence' ? [artifactFromPayload({ request: input.request,
          artifactType: 'intentional_silence_decision_v2', artifactId: `music.silence.${input.request.requestId}`,
          payload: { ranges: input.cueSheet.payload.cues.flatMap((cue) => cue.intentionalNoMusicRanges),
            reason: input.need.payload.narrativeReason, protectedNaturalSound: input.request.userMusicPolicy.preserveNaturalSound },
          evidence: ['structured_story_and_speech_evidence', 'silence_is_a_professional_decision'] })] : []),
        ...input.routeBindings.map((binding) => artifactFromPayload({ request: input.request,
          artifactType: 'music_cue_route_decision_v2', artifactId: `music.route-decision.${input.request.requestId}.${binding.cueId}`,
          cueId: binding.cueId, payload: binding, evidence: [binding.routeHash, 'exact_versioned_route_identity'] })),
      ], providerAttempts: [],
      candidatesByCue: new Map(), analysesByCue: new Map(), selectionsByCue: new Map(), selectedByCue: new Map(),
      beatMaps: [], editorials: [], placements: [], soundReceipts: [], unitReceipts: [], failedUnits: new Set(),
    }
    const startedAt = new Date().toISOString()
    const startClock = performance.now()
    for (const unit of topologicalMusicExecutionUnits(input.executionGraph)) {
      const blockedDependency = unit.dependencyUnitIds.some((id) => state.failedUnits.has(id) ||
        state.unitReceipts.some((item) => item.unitId === id && (item.status === 'failed' || item.status === 'blocked')))
      const mayAggregatePartial = unit.unitKind === 'continuity_qa' || unit.unitKind === 'handoff'
      if (blockedDependency && !mayAggregatePartial) {
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
        const route = getMusicToolRouteManifest(unit.route.routeKey, unit.route.routeVersion)
        if (!route || route.routeHash !== unit.route.routeHash) throw new Error('Music execution route identity is stale.')
        if (route.steps.length !== 1) {
          throw new Error(`Music v2 unit ${unit.unitId} requires one exact executable route step; found ${route.steps.length}.`)
        }
        const step = route.steps[0]!
        const handler = resolveMusicExactOperationHandler(step)
        if (!handler) throw new Error(`Music route step ${step.stepKey} has no exact immutable handler.`)
        const details = await this.#executeUnit({ package: input, unit, state, step, handler })
        const completedAt = new Date().toISOString()
        const elapsedMilliseconds = performance.now() - unitStart
        const inputArtifacts = details.inputArtifacts ?? []
        const outputArtifacts = details.outputArtifacts ?? []
        const outputHashes = [
          ...outputArtifacts.map((artifact) => artifact.checksumSha256), ...(details.outputHashes ?? []),
        ]
        const envelopeOutputs = state.artifacts.filter((artifact) => outputHashes.includes(artifact.artifactHash))
        const stepReceipt = routeStepReceipt({
          step, handler, status: 'completed', startedAt: unitStartedAt, completedAt, elapsedMilliseconds,
          inputArtifactIds: inputArtifacts.length > 0 ? inputArtifacts.map((artifact) => artifact.artifactId) : unit.inputArtifactIds,
          inputArtifactHashes: inputArtifacts.length > 0 ? inputArtifacts.map((artifact) => artifact.checksumSha256) : unit.inputArtifactHashes,
          outputArtifactIds: [...outputArtifacts.map((artifact) => artifact.artifactId),
            ...envelopeOutputs.map((artifact) => artifact.artifactId)],
          outputArtifactHashes: outputHashes,
          runtimeEvidence: details.runtimeEvidence ?? [], qaEvidence: details.qaEvidence ?? [],
          providerCostUsd: details.providerCostUsd ?? 0,
          ...(details.providerAttemptId ? { providerAttemptId: details.providerAttemptId } : {}),
        })
        state.unitReceipts.push(receipt({
          unit, status: 'completed', startedAt: unitStartedAt, completedAt,
          elapsedMilliseconds, ...details, stepReceipts: [stepReceipt],
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
    const result = this.#buildResult({ package: input, state, startedAt,
      elapsedMilliseconds: performance.now() - startClock, executionFingerprint })
    const authority = validateMusicResultAuthority({ request: input.request, result })
    if (!authority.ok) throw new Error(`Canonical Music result authority failed: ${authority.code}:${authority.errors.join(',')}`)
    this.#replays.set(input.request.idempotencyKey, { fingerprint: executionFingerprint, result: structuredClone(result) })
    return result
  }

  async #executeUnit(input: {
    package: ApprovedMusicExecutionPackage
    unit: MusicExecutionUnit
    state: ExecutionState
    step: MusicRouteStep
    handler: MusicExactOperationHandler
  }): Promise<Partial<Parameters<typeof receipt>[0]>> {
    const request = input.package.request
    const cueId = input.unit.cueId
    if (input.handler.kind === 'supervision') {
      const artifact = input.step.operationKey === 'study_video_music_context' ? input.package.context
        : input.step.operationKey === 'decide_music_need' ? input.package.need
          : input.step.operationKey === 'plan_music_narrative_arc' ? input.package.arc
            : input.step.operationKey === 'create_music_cue_sheet' ? input.package.cueSheet : undefined
      return {
        outputHashes: [artifact?.artifactHash ?? input.unit.operationSpec.operationSpecHash],
        runtimeEvidence: [artifact ? 'precomputed_hash_bound_supervision_artifact_verified' : 'deterministic_planning_operation'],
      }
    }
    if (input.handler.kind === 'handoff' && ['create_no_music_handoff', 'create_ambience_only_handoff'].includes(input.step.operationKey)) {
      const binding = input.package.routeBindings.find((item) => item.cueId === cueId)
      const ambienceOnly = binding?.acquisitionDecision === 'ambience_only'
      const artifact = artifactFromPayload({ request,
        artifactType: ambienceOnly ? 'music_ambience_only_handoff_v2' : 'intentional_no_music_handoff_v2',
        artifactId: `${ambienceOnly ? 'music.ambience-only' : 'music.no-music'}.${request.requestId}.${cueId}`,
        ...(cueId ? { cueId } : {}), payload: {
          exactRange: input.unit.targetRange, intentionalNoMusic: !ambienceOnly, ambienceOnly,
          reason: ambienceOnly ? 'Preserve natural Sound; Music does not generate non-musical ambience.'
            : 'Music is intentionally absent for this authorized range.',
          soundSupportRequirement: ambienceOnly ? {
            requestedFromSkill: 'sound', requestedOutcome: 'preserve_or_support_non_musical_ambience',
            musicMayGenerateAmbience: false,
          } : undefined,
        }, evidence: ['typed_professional_no_action', 'no_music_artifact_bytes_fabricated'] })
      input.state.artifacts.push(artifact)
      return { outputHashes: [artifact.artifactHash], runtimeEvidence: ['typed_no_music_or_ambience_handoff'] }
    }
    if (!cueId) {
      if (input.handler.kind === 'music_qa') {
        input.state.qa = runCanonicalMusicQa({
          request, routes: input.package.routeBindings,
          analyses: [...input.state.analysesByCue.values()].flat(), placements: input.state.placements,
          soundReceipts: input.state.soundReceipts, selectedArtifactIds: [...input.state.selectedByCue.values()].map((item) => item.artifactId),
        })
        const artifact = artifactFromPayload({ request, artifactType: 'music_qa_report_v2', artifactId: `music.qa.${request.requestId}`,
          payload: input.state.qa, evidence: ['actual_audio_and_sound_receipts'] })
        const continuityArtifact = artifactFromPayload({ request, artifactType: 'music_continuity_report_v2',
          artifactId: `music.continuity.${request.requestId}`, payload: input.state.qa.continuity,
          evidence: ['whole_video_structured_continuity', 'subjective_boundaries_review_aware'] })
        input.state.artifacts.push(artifact, continuityArtifact)
        return { outputHashes: [artifact.artifactHash, continuityArtifact.artifactHash], qaEvidence: [input.state.qa.reportHash] }
      }
      if (input.handler.kind === 'handoff') {
        const handoff = buildExecutionHandoff({ package: input.package, state: input.state })
        input.state.handoff = handoff
        const handoffArtifact = artifactFromPayload({ request,
          artifactType: handoff.intentionalNoMusic ? 'intentional_no_music_handoff_v2'
            : handoff.ambienceOnly ? 'music_ambience_only_handoff_v2' : 'music_final_composition_handoff_v2',
          artifactId: handoff.handoffId, payload: handoff,
          evidence: ['actual_route_step_execution_aggregate', 'final_mux_render_export_outside_music'],
        })
        input.state.artifacts.push(handoffArtifact)
        return { outputHashes: [handoffArtifact.artifactHash], runtimeEvidence: ['actual_final_handoff_created'] }
      }
      return { outputHashes: [input.unit.operationSpec.operationSpecHash] }
    }
    const binding = input.package.routeBindings.find((item) => item.cueId === cueId)
    const cue = cueFor(input.package.cueSheet, cueId)
    if (!binding || !cue) throw new Error(`Music execution unit lost exact cue binding ${cueId}.`)
    if (input.handler.kind === 'private_asset_binding') {
      const sources = sourcesForBinding(request, binding)
      input.state.candidatesByCue.set(cueId, sources)
      const selectionArtifact = artifactFromPayload({
        request, artifactType: 'approved_music_selection_v2',
        artifactId: `music.acquisition-selection.${request.requestId}.${cueId}`, cueId,
        payload: {
          candidateArtifacts: sources,
          rightsBindingIds: binding.rightsBindings,
          selectionDeferredUntilIndependentAnalysis: true,
        },
        evidence: ['all_eligible_assets_bound', 'rights_scope_validated', 'selection_not_first_item'],
      })
      input.state.artifacts.push(selectionArtifact)
      return {
        inputArtifacts: sources, outputHashes: [selectionArtifact.artifactHash],
        runtimeEvidence: ['all_rights_bound_private_source_candidates_admitted', 'no_first_asset_selection'],
      }
    }
    if (input.handler.kind === 'lyria_provider') {
      if (!this.#provider) throw new Error('Canonical Lyria 3 provider adapter was not injected.')
      const variationSources = input.unit.jobType === 'generate_music_variation'
        ? request.inputAssetRefs.filter((asset) => request.rightsAndProvenanceRefs.some((rights) =>
          rights.assetId === asset.artifactId && rights.commercialUse === 'allowed' && rights.editingPermission === 'allowed')) : []
      if (input.unit.jobType === 'generate_music_variation' && variationSources.length !== 1) {
        throw new Error('Music variation requires one exact rights-bound original cue artifact.')
      }
      const brief = createMusicCompositionBrief({
        briefId: `music.brief.${request.requestId}.${cueId}`, briefVersion: '2.0.0', cueId,
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
        sourceEvidenceRefs: [
          ...request.contextEvidence.map((item) => item.evidenceHash),
          ...variationSources.map((asset) => asset.checksumSha256),
        ],
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
      const briefArtifact = artifactFromPayload({ request, artifactType: 'music_composition_brief_v2', artifactId: brief.briefId,
        cueId, payload: brief, evidence: ['provider_neutral_brief'] })
      const attemptArtifact = artifactFromPayload({ request, artifactType: 'music_provider_attempt_v2',
        artifactId: attempt.attemptId, cueId, payload: attempt,
        evidence: ['cue_specific_attempt', 'idempotent_provider_lifecycle', 'unknown_outcome_requires_reconciliation'] })
      input.state.artifacts.push(briefArtifact, attemptArtifact)
      return {
        outputArtifacts: attempt.candidateArtifacts, outputHashes: [brief.briefHash],
        runtimeEvidence: ['lyria3_injected_transport_same_route_graph', 'private_output_ingest', 'store_false'],
        providerAttemptId: attempt.attemptId, providerCostUsd: attempt.actualCostUsd,
      }
    }
    if (input.handler.kind === 'private_audio_analysis' && input.step.operationKey === 'analyze_audio_bytes' &&
      input.unit.unitKind !== 'cue_qa') {
      const candidates = input.state.candidatesByCue.get(cueId) ?? []
      if (candidates.length === 0) throw new Error(`Music cue ${cueId} has no candidate artifacts.`)
      const analyses: MusicCandidateAnalysis[] = []
      const analysisArtifacts: MusicArtifactEnvelope[] = []
      for (const candidate of candidates) {
        const resolved = await this.#artifacts.resolve(candidate)
        const analysis = await analyzePrivateMusicArtifact({ resolved, timelineRate: request.timelineBinding.rationalTimelineRate })
        analyses.push(analysis)
        const analysisArtifact = artifactFromPayload({
          request, artifactType: 'music_candidate_analysis_v2', artifactId: `music.analysis.${candidate.artifactId}`,
          cueId, payload: analysis, evidence: analysis.qualificationEvidence,
        })
        analysisArtifacts.push(analysisArtifact)
        input.state.artifacts.push(analysisArtifact)
      }
      input.state.analysesByCue.set(cueId, analyses)
      const jobArtifacts: Array<{ type: string; payload: unknown; evidence: string[] }> = []
      if (request.jobType === 'study_existing_music') jobArtifacts.push({
        type: 'music_existing_study_v2',
        payload: { analyses, decisionOptions: ['preserve', 'lower', 'remove', 'reuse', 'replace', 'trim', 'reference_only'] },
        evidence: ['actual_audio_bytes', 'timeline_usage_requires_structured_evidence'],
      })
      if (request.jobType === 'study_user_provided_music') jobArtifacts.push({
        type: 'music_user_intake_v2', payload: { analyses, rights: request.rightsAndProvenanceRefs,
          userProvidedMedia: true, reeditproOwned: false, automaticLibraryPromotionAllowed: false },
        evidence: ['actual_audio_bytes', 'user_declaration', 'project_scope_only'],
      })
      if (request.jobType === 'study_reference_music' || request.jobType === 'create_music_reference_dna') {
        jobArtifacts.push({ type: 'music_reference_study_v2',
          payload: { analyses, usePolicy: 'study_only', sourceReuseAllowed: false },
          evidence: ['actual_reference_audio', 'study_only'] })
        jobArtifacts.push({ type: 'music_reference_dna_v2', payload: {
          measured: analyses.map((analysis) => ({ tempoBpm: analysis.measuredTempoBpm,
            beatFrames: analysis.beatFrames, phraseBoundaryFrames: analysis.phraseBoundaryFrames,
            sectionBoundaryFrames: analysis.sectionBoundaryFrames, energyContour: analysis.energyContour,
            loudnessLufs: analysis.integratedLoudnessLufs })),
          inferred: [{ field: 'instrumentation', value: 'requires_review', confidence: 0 }],
          declared: request.userMusicPolicy.customDirectives,
          adaptationRules: ['adapt structural restraint and energy contour only'],
          doNotCopyRules: ['no_melody_copy', 'no_lyric_copy', 'no_hook_copy', 'no_artist_imitation',
            'no_recognizable_arrangement_copy', 'no_exact_reference_timing_copy', 'no_source_reuse'],
          automaticCopyrightClearanceClaimed: false,
        }, evidence: ['measured_inferred_declared_separated', 'copy_risk_is_not_legal_clearance'] })
      }
      for (const artifact of jobArtifacts) input.state.artifacts.push(artifactFromPayload({ request,
        artifactType: artifact.type, artifactId: `${artifact.type}.${request.requestId}.${cueId}`, cueId,
        payload: artifact.payload, evidence: artifact.evidence }))
      return { inputArtifacts: candidates, outputHashes: analysisArtifacts.map((artifact) => artifact.artifactHash),
        runtimeEvidence: ['every_candidate_independently_decoded_and_measured'] }
    }
    if (input.handler.kind === 'private_audio_analysis' && input.step.operationKey === 'select_qualified_candidate') {
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
      const selectionArtifact = artifactFromPayload({ request, artifactType: 'music_candidate_selection_decision_v2',
        artifactId: `music.selection.${request.requestId}.${cueId}`, cueId, payload: selection,
        evidence: ['ranking_independent_of_provider_array_order', selection.evidenceHash] })
      input.state.artifacts.push(selectionArtifact)
      return { outputHashes: [selectionArtifact.artifactHash], runtimeEvidence: ['typed_measured_candidate_selection'] }
    }
    if (input.handler.kind === 'music_sync') {
      const selected = input.state.selectedByCue.get(cueId)
      const analysis = (input.state.analysesByCue.get(cueId) ?? []).find((item) =>
        item.candidateArtifact.artifactId === selected?.artifactId)
      if (!selected || !analysis) throw new Error(`MusicSync lacks selected candidate evidence for ${cueId}.`)
      const sync = compileMusicSync({ cue, analysis, timelineHash: request.timelineBinding.timelineManifestHash,
        timelineRate: request.timelineBinding.rationalTimelineRate })
      input.state.beatMaps.push(sync.beatMap)
      input.state.editorials.push(sync.editorial)
      input.state.placements.push(sync.placement)
      const syncArtifacts: MusicArtifactEnvelope[] = []
      for (const [type, value, id] of [
        ['music_beat_phrase_map_v2', sync.beatMap, sync.beatMap.mapId],
        ['music_editorial_plan_v2', sync.editorial, sync.editorial.planId],
        ['music_placement_manifest_v2', sync.placement, sync.placement.placementId],
      ] as const) {
        const syncArtifact = artifactFromPayload({ request, artifactType: type, artifactId: id, cueId,
          payload: value, evidence: ['exact_rational_frame_sample_binding'] })
        syncArtifacts.push(syncArtifact)
        input.state.artifacts.push(syncArtifact)
      }
      input.state.artifacts.push(artifactFromPayload({ request, artifactType: 'music_mix_intent_manifest_v2',
        artifactId: `music.mix-intent.${request.requestId}.${cueId}`, cueId, payload: {
          role: cue.cueRole, dialoguePriority: true, ambiencePriority: request.userMusicPolicy.preserveNaturalSound,
          musicPresence: cue.arrangementDensity, cueEnergy: cue.energyArc,
          protectedSpeechRanges: cue.protectedSpeechRanges, noMusicRanges: cue.intentionalNoMusicRanges,
          sfxCollisionPolicy: 'speech_and_story_first', desiredTechnicalOutputs: cue.soundProcessingIntent,
        }, evidence: ['creative_intent_not_execution_proof'] }))
      return { outputHashes: syncArtifacts.map((artifact) => artifact.artifactHash),
        runtimeEvidence: ['frame_accurate_music_sync', 'no_forced_cut_to_beat', 'no_visual_mutation'] }
    }
    if (input.handler.kind === 'sound_public_port') {
      if (!this.#sound) throw new Error('Canonical Sound v4 public port was not injected.')
      const selected = input.state.selectedByCue.get(cueId)
      const editorial = input.state.editorials.find((item) => item.cueId === cueId)
      const selectedAnalysis = (input.state.analysesByCue.get(cueId) ?? []).find((analysis) =>
        analysis.candidateArtifact.artifactId === selected?.artifactId)
      if (!selected || !editorial || !selectedAnalysis) {
        throw new Error(`Sound support lacks selected Music/editorial analysis for ${cueId}.`)
      }
      const speechProtected = cue.protectedSpeechRanges.length > 0
      const baseGainDb = speechProtected ? -18
        : cue.arrangementDensity === 'dense' ? -12
          : cue.arrangementDensity === 'moderate' ? -14 : -16
      const duckingDb = speechProtected ? -10 : 0
      const sourceStartFrame = samplesToFrames({
        samples: editorial.sourceStartSample,
        rate: request.timelineBinding.rationalTimelineRate,
        sampleRate: selectedAnalysis.sampleRate,
        rounding: cue.roundingPolicy,
      })
      const supportRequest = createMusicSoundSupportRequest({
        request, cueId, delegatedRange: cue.exactRange, selectedMusicArtifact: selected,
        requiredOperations: cue.soundProcessingIntent.filter((item): item is Parameters<typeof createMusicSoundSupportRequest>[0]['requiredOperations'][number] => [
          'trim', 'cut', 'fade', 'crossfade', 'gain', 'normalize', 'loop', 'resample', 'channel_conversion',
          'time_stretch', 'pitch_shift', 'place', 'dialogue_ducking', 'eq', 'dynamics', 'pan', 'stem_rendering', 'technical_qa',
        ].includes(item)),
        operationParameters: {
          sourceStartFrame,
          targetDurationFrames: cue.exactRange.endFrameExclusive - cue.exactRange.startFrame,
          fadeInFrames: cue.fadeInFrames, fadeOutFrames: cue.fadeOutFrames, gainDb: baseGainDb,
          gainEnvelope: [
            { frame: cue.exactRange.startFrame, gainDb: baseGainDb - Math.max(6, cue.fadeInFrames > 0 ? 18 : 6) },
            { frame: Math.min(cue.exactRange.endFrameExclusive - 1, cue.exactRange.startFrame + cue.fadeInFrames), gainDb: baseGainDb + duckingDb },
            { frame: Math.max(cue.exactRange.startFrame, cue.exactRange.endFrameExclusive - Math.max(1, cue.fadeOutFrames)), gainDb: baseGainDb + duckingDb },
            { frame: cue.exactRange.endFrameExclusive, gainDb: baseGainDb - Math.max(6, cue.fadeOutFrames > 0 ? 18 : 6) },
          ],
          dialogueDuckingDb: duckingDb,
          duckAttackFrames: Math.max(1, Math.min(cue.fadeInFrames || 1, 4)),
          duckReleaseFrames: Math.max(1, Math.min(cue.fadeOutFrames || 1, 12)),
          eqProfile: speechProtected ? 'speech_safe' : 'neutral',
          dynamicsProfile: cue.arrangementDensity === 'dense' ? 'peak_limiter' : 'gentle_compression',
          pan: 0,
          distance: speechProtected ? 'distant' : 'medium',
          roomMatch: 'dry',
          headroomDb: speechProtected ? 8 : 6,
          tempoRatio: editorial.timeStretchRatio,
          loopCrossfadeFrames: Math.max(1, Math.min(cue.fadeInFrames || 1, cue.fadeOutFrames || 1)),
        },
      })
      const result = await this.#sound.execute(supportRequest)
      input.state.soundReceipts.push(result.receipt)
      const supportReceiptArtifact = artifactFromPayload({
        request, artifactType: 'music_sound_support_receipt_v2',
        artifactId: `music.sound-receipt.${request.requestId}.${cueId}`, cueId,
        payload: { request: supportRequest, receipt: result.receipt },
        evidence: ['canonical_sound_v4_public_service_only', 'lossless_operation_mapping', 'nested_cost_separate'],
      })
      input.state.artifacts.push(supportReceiptArtifact)
      return { inputArtifacts: [selected], outputArtifacts: [...result.receipt.processedMusicAssets, ...result.receipt.musicStemAssets],
        outputHashes: [supportReceiptArtifact.artifactHash],
        runtimeEvidence: ['canonical_sound_v4_public_service_only'], qaEvidence: [
          ...result.receipt.technicalQaRefs, ...result.receipt.synchronizationQaRefs, ...result.receipt.mixQaRefs,
        ] }
    }
    if (input.handler.kind === 'private_audio_analysis' && input.unit.unitKind === 'cue_qa') {
      const sound = input.state.soundReceipts.find((item) => item.cueId === cueId)
      if (!sound) throw new Error(`Music cue ${cueId} lacks actual Sound receipt for QA.`)
      const qaArtifact = artifactFromPayload({
        request, artifactType: 'music_technical_qa_v2', artifactId: `music.cue-qa.${request.requestId}.${cueId}`,
        cueId, payload: {
          soundResultHash: sound.soundResultHash, technicalQaRefs: sound.technicalQaRefs,
          synchronizationQaRefs: sound.synchronizationQaRefs, mixQaRefs: sound.mixQaRefs,
        }, evidence: ['actual_sound_output_qa_consumed'],
      })
      input.state.artifacts.push(qaArtifact)
      return { outputHashes: [qaArtifact.artifactHash], qaEvidence: [
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
    executionFingerprint: string
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
      noMusicBindings.includes(binding) || ambienceBindings.includes(binding) ||
      input.state.soundReceipts.some((receipt) => receipt.cueId === binding.cueId) ||
      input.state.selectedByCue.has(binding.cueId) && request.proposedCues.find((cue) => cue.cueId === binding.cueId)?.soundProcessingIntent.length === 0
    ).length
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
    const handoff = input.state.handoff ?? buildExecutionHandoff({ package: input.package, state: input.state })
    if (status === 'completed' && handoff.selectedMusicAssets.length === 0) throw new Error('Music handoff cannot complete without a real selected artifact.')
    const providerCostUsd = input.state.providerAttempts.reduce((sum, attempt) => sum + attempt.actualCostUsd, 0)
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
      schemaVersion: 'canonical-music-result-v2', requestId: request.requestId,
      musicSkillKey: 'music', musicSkillVersion: musicSkillCapabilityManifest.skillVersion,
      musicManifestHash: musicSkillCapabilityManifest.manifestHash,
      capabilityKey: `music.${request.jobType}`, capabilityVersion: musicSkillCapabilityManifest.skillVersion,
      qualificationStatusUsed: request.requestedExecutionMode === 'production' ? 'production_qualified'
        : request.requestedExecutionMode === 'private_internal' ? 'internal_execution_qualified' : 'planning_qualified',
      executionFingerprint: input.executionFingerprint,
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
      musicMixIntentManifestRef: input.state.artifacts.find((artifact) => artifact.artifactType === 'music_mix_intent_manifest_v2')?.artifactHash,
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
      costEvidence: createMusicCostEvidence({
        estimatedCredits: input.package.routeBindings.reduce((sum, item) => sum + item.estimatedCredits, 0),
        providerCostUsd, nestedSoundCredits,
      }),
      elapsedTimeEvidence: { startedAt: input.startedAt, completedAt: new Date().toISOString(), actualMilliseconds: Math.round(input.elapsedMilliseconds) },
      unresolvedDependencies: input.state.unitReceipts.filter((item) => item.status === 'blocked').map((item) => item.unitId),
      reviewRequiredItems: qa.findings.filter((item) => item.status === 'needs_review').map((item) => item.code),
      callerReceipt: callerReceiptBase,
    }
    result.callerReceipt.resultHash = hashMusicValue({ ...result, callerReceipt: callerReceiptBase })
    return Object.freeze(result)
  }
}
