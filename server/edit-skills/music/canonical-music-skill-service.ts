import type { SkillCapabilityManifest } from '../core/skill-capability-manifest-types'
import {
  createMusicArtifact,
  hashMusicValue,
  parseCanonicalMusicRequest,
  type CanonicalMusicSkillRequest,
  type CanonicalMusicSkillResult,
  type MusicArtifactEnvelope,
  type MusicFrameRange,
} from '../../music/music-contracts'
import { evaluateMusicScopeGuard, musicRangesOverlap, validateMusicResultAuthority } from '../../music/music-scope-guard'
import { createSupervisionArtifacts, type MusicContextStudyPayload, type MusicCueSheetPayload,
  type MusicNarrativeArcPayload, type MusicNeedDecisionPayload } from '../../music/music-supervision'
import { musicSkillCapabilityManifest } from './music-capability-manifest'
import { resolveMusicCapabilityEntry } from './music-admission'
import { compileCanonicalMusicExecutionGraph, type MusicExecutionGraph } from './music-execution-graph'
import {
  CanonicalMusicRouteExecutor,
  type ApprovedMusicExecutionPackage,
} from './music-route-executor'
import type { CanonicalMusicArtifactResolver } from '../../music/music-analysis'
import type { CanonicalLyria3ProviderAdapter } from '../../music/lyria-provider'
import type { MusicSoundSupportPort } from '../../music/music-sound-support-port'

export interface MusicPeerCapabilityViewRequest {
  callerType: Exclude<CanonicalMusicSkillRequest['caller']['callerType'], 'head_of_orchestra'>
  callerSkillKey: string
  jobType: string
}

export interface MusicPeerCapabilityView {
  skillKey: 'music'
  skillVersion: string
  manifestHash: string
  accepted: boolean
  capabilityKey?: string
  supportedScopes: string[]
  requiredInputs: string[]
  producedArtifactTypes: string[]
  qualificationStatus?: string
  peerMayInvokeMusicToolsDirectly: false
  peerMaySupplyProviderPayload: false
  peerMayInvokeSoundToolsDirectly: false
  limitations: string[]
}

export interface MusicEstimateResult {
  estimatorVersion: 'music.estimator.v1'
  requestId: string
  minimumMinutes: number
  expectedMinutes: number
  maximumMinutes: number
  minimumCredits: number
  expectedCredits: number
  maximumCredits: number
  confidence: number
  assumptions: string[]
  categories: Record<string, number>
  approvalRequired: boolean
  reservationRequired: boolean
  lowerCostAlternatives: string[]
  nestedSoundEstimateRef: string
  spendsOrReservesCredits: false
}

export interface CanonicalMusicPlanResult {
  schemaVersion: 'canonical-music-plan-result-v1'
  request: CanonicalMusicSkillRequest
  context: MusicArtifactEnvelope<MusicContextStudyPayload>
  need: MusicArtifactEnvelope<MusicNeedDecisionPayload>
  arc: MusicArtifactEnvelope<MusicNarrativeArcPayload>
  cueSheet: MusicArtifactEnvelope<MusicCueSheetPayload>
  routeBindings: ReturnType<typeof createSupervisionArtifacts>['routeBindings']
  executionGraph: MusicExecutionGraph
  estimate: MusicEstimateResult
  plannedResult: CanonicalMusicSkillResult
}

export interface MusicRevisionRequest {
  request: CanonicalMusicSkillRequest
  previousResult: CanonicalMusicSkillResult
  invalidatedRanges: MusicFrameRange[]
  reason: string
}

export interface MusicRevisionPlan {
  schemaVersion: 'music-revision-plan-v1'
  revisionRequestId: string
  previousRequestId: string
  invalidatedRanges: MusicFrameRange[]
  preservedCueIds: string[]
  replacementCueIds: string[]
  preservedArtifactHashes: string[]
  affectedSoundCueIds: string[]
  neighboringContinuityCueIds: string[]
  requiresNewApproval: boolean
  planHash: string
}

export interface MusicRevisionExecutionRequest extends MusicRevisionRequest {
  approvedRevisionSnapshotId: string
  approvedRevisionSnapshotHash: string
  revisionIdempotencyKey: string
}

export interface MusicQaRequest {
  result: CanonicalMusicSkillResult
}

export interface MusicQaResult {
  status: 'pass' | 'needs_review' | 'blocking'
  qaArtifact?: MusicArtifactEnvelope
  continuityQaRef?: string
  errors: string[]
}

export interface CanonicalMusicSkillService {
  getCapabilityManifest(): Readonly<SkillCapabilityManifest>
  getPeerCapabilityView(request: MusicPeerCapabilityViewRequest): MusicPeerCapabilityView
  estimate(request: CanonicalMusicSkillRequest): Promise<MusicEstimateResult>
  plan(request: CanonicalMusicSkillRequest): Promise<CanonicalMusicPlanResult>
  execute(request: CanonicalMusicSkillRequest): Promise<CanonicalMusicSkillResult>
  planRevision(request: MusicRevisionRequest): Promise<MusicRevisionPlan>
  executeRevision(request: MusicRevisionExecutionRequest): Promise<CanonicalMusicSkillResult>
  qa(request: MusicQaRequest): Promise<MusicQaResult>
}

export class StandaloneCanonicalMusicSkillService implements CanonicalMusicSkillService {
  readonly #executor: CanonicalMusicRouteExecutor

  constructor(input: {
    artifacts: CanonicalMusicArtifactResolver
    provider?: CanonicalLyria3ProviderAdapter
    sound?: MusicSoundSupportPort
  }) {
    this.#executor = new CanonicalMusicRouteExecutor(input)
  }

  getCapabilityManifest(): Readonly<SkillCapabilityManifest> {
    return musicSkillCapabilityManifest
  }

  getPeerCapabilityView(request: MusicPeerCapabilityViewRequest): MusicPeerCapabilityView {
    const capability = resolveMusicCapabilityEntry({ jobType: request.jobType })
    const caller = request.callerType
    const accepted = Boolean(capability?.acceptedCallerTypes.includes(caller))
    return {
      skillKey: 'music', skillVersion: musicSkillCapabilityManifest.skillVersion,
      manifestHash: musicSkillCapabilityManifest.manifestHash, accepted,
      ...(capability ? { capabilityKey: capability.capabilityKey, qualificationStatus: capability.qualificationStatus } : {}),
      supportedScopes: [...(capability?.supportedScopes ?? [])],
      requiredInputs: [...(capability?.requiredInputs ?? [])],
      producedArtifactTypes: [...(capability?.producedArtifactTypes ?? [])],
      peerMayInvokeMusicToolsDirectly: false,
      peerMaySupplyProviderPayload: false,
      peerMayInvokeSoundToolsDirectly: false,
      limitations: [...(capability?.knownLimitations ?? ['unsupported_music_job'])],
    }
  }

  async estimate(input: CanonicalMusicSkillRequest): Promise<MusicEstimateResult> {
    const request = parseCanonicalMusicRequest(input)
    const rangeFrames = request.scopeAuthority.authorizedInspectRanges.reduce((sum, range) =>
      sum + range.endFrameExclusive - range.startFrame, 0)
    const seconds = rangeFrames * request.timelineBinding.rationalTimelineRate.denominator /
      request.timelineBinding.rationalTimelineRate.numerator
    const cueCount = Math.max(1, request.proposedCues.length)
    const generatedCueCount = request.proposedCues.filter((cue) =>
      cue.acquisitionPreference === 'generate_original').length
    const candidateCount = generatedCueCount * request.approvalAndBudget.maximumCandidates
    const planningMinutes = Math.ceil(seconds / 60 * 0.25 + cueCount * 0.5)
    const analysisMinutes = Math.ceil(cueCount * 0.4 + candidateCount * 0.3)
    const soundMinutes = Math.ceil(cueCount * 0.5)
    const qaMinutes = Math.ceil(cueCount * 0.3 + (request.scopeAuthority.mayStudyWholeVideo ? 2 : 0))
    const providerCredits = generatedCueCount * request.approvalAndBudget.maximumCandidates
    const localCredits = cueCount
    const expectedCredits = providerCredits + localCredits
    return {
      estimatorVersion: 'music.estimator.v1', requestId: request.requestId,
      minimumMinutes: Math.max(1, Math.floor((planningMinutes + analysisMinutes) / 2)),
      expectedMinutes: planningMinutes + analysisMinutes + soundMinutes + qaMinutes,
      maximumMinutes: (planningMinutes + analysisMinutes + soundMinutes + qaMinutes) * 3,
      minimumCredits: generatedCueCount > 0 ? Math.max(1, generatedCueCount) : 0,
      expectedCredits, maximumCredits: expectedCredits * 3,
      confidence: request.proposedCues.length > 0 ? 0.8 : 0.55,
      assumptions: ['exact_rational_duration', `${cueCount}_cue_units`, `${candidateCount}_provider_candidates`, 'nested_sound_cost_separate'],
      categories: { planning: planningMinutes, providerGeneration: providerCredits, analysis: analysisMinutes, soundChild: soundMinutes, qa: qaMinutes },
      approvalRequired: generatedCueCount > 0 || request.requestedExecutionMode !== 'planning',
      reservationRequired: generatedCueCount > 0,
      lowerCostAlternatives: ['preserve_source_music', 'use_user_upload', 'one_recurring_bed', 'ambience_only', 'no_music'],
      nestedSoundEstimateRef: `music.nested-sound-estimate.${request.requestId}`,
      spendsOrReservesCredits: false,
    }
  }

  async plan(input: CanonicalMusicSkillRequest): Promise<CanonicalMusicPlanResult> {
    const request = parseCanonicalMusicRequest(input)
    const admission = evaluateMusicScopeGuard(request)
    if (!admission.ok) throw new Error(`Canonical Music request rejected: ${admission.code}:${admission.errors.join(',')}`)
    const supervision = createSupervisionArtifacts(request)
    const executionGraph = compileCanonicalMusicExecutionGraph({
      request, need: supervision.need, cueSheet: supervision.cueSheet,
      routeBindings: supervision.routeBindings,
    })
    const estimate = await this.estimate(request)
    const plannedResult = this.#plannedResult(request, supervision, estimate)
    return { schemaVersion: 'canonical-music-plan-result-v1', request, ...supervision, executionGraph, estimate, plannedResult }
  }

  async execute(input: CanonicalMusicSkillRequest): Promise<CanonicalMusicSkillResult> {
    const plan = await this.plan(input)
    if (plan.request.requestedExecutionMode === 'planning') {
      throw new Error('Canonical Music planning mode cannot execute directly.')
    }
    const executionPackage: ApprovedMusicExecutionPackage = {
      schemaVersion: 'approved-music-execution-package-v1',
      packageId: `music.package.${plan.request.requestId}`,
      approvedWorkItemId: plan.request.caller.parentWorkItemId,
      request: plan.request, context: plan.context, need: plan.need, arc: plan.arc,
      cueSheet: plan.cueSheet, routeBindings: plan.routeBindings,
      executionGraph: plan.executionGraph,
    }
    return this.#executor.execute(executionPackage)
  }

  async planRevision(input: MusicRevisionRequest): Promise<MusicRevisionPlan> {
    if (input.previousResult.requestId !== input.request.requestId) throw new Error('Music revision request/result mismatch.')
    if (input.invalidatedRanges.length === 0) throw new Error('Music revision requires exact invalidated ranges.')
    const affectedCueIds = input.request.proposedCues.filter((cue) => input.invalidatedRanges.some((range) =>
      musicRangesOverlap(cue.exactRange, range))).map((cue) => cue.cueId)
    const preservedCueIds = input.request.proposedCues.filter((cue) => !affectedCueIds.includes(cue.cueId)).map((cue) => cue.cueId)
    const neighboring = input.request.proposedCues.filter((_cue, index, cues) =>
      affectedCueIds.includes(cues[index - 1]?.cueId ?? '') || affectedCueIds.includes(cues[index + 1]?.cueId ?? '')).map((cue) => cue.cueId)
    const base = {
      schemaVersion: 'music-revision-plan-v1' as const,
      revisionRequestId: `${input.request.requestId}.revision`,
      previousRequestId: input.previousResult.requestId,
      invalidatedRanges: structuredClone(input.invalidatedRanges),
      preservedCueIds,
      replacementCueIds: affectedCueIds,
      preservedArtifactHashes: input.previousResult.artifacts.filter((artifact) =>
        !artifact.cueId || preservedCueIds.includes(artifact.cueId)).map((artifact) => artifact.artifactHash),
      affectedSoundCueIds: affectedCueIds,
      neighboringContinuityCueIds: neighboring,
      requiresNewApproval: true,
    }
    return { ...base, planHash: hashMusicValue(base) }
  }

  async executeRevision(input: MusicRevisionExecutionRequest): Promise<CanonicalMusicSkillResult> {
    const revisionPlan = await this.planRevision(input)
    if (input.request.approvedSnapshotRef.snapshotId !== input.approvedRevisionSnapshotId ||
      input.request.approvedSnapshotRef.snapshotHash !== input.approvedRevisionSnapshotHash) {
      throw new Error('Music revision approval binding mismatch.')
    }
    const affectedCues = input.request.proposedCues.filter((cue) => revisionPlan.replacementCueIds.includes(cue.cueId))
    const revisionRequest: CanonicalMusicSkillRequest = {
      ...structuredClone(input.request),
      proposedCues: affectedCues,
      scopeAuthority: {
        ...structuredClone(input.request.scopeAuthority),
        authorizedMusicWriteRanges: affectedCues.map((cue) => cue.exactRange),
      },
      idempotencyKey: input.revisionIdempotencyKey,
    }
    const replacement = await this.execute(revisionRequest)
    const preservedArtifacts = input.previousResult.artifacts.filter((artifact) =>
      !artifact.cueId || revisionPlan.preservedCueIds.includes(artifact.cueId))
    const preservedSound = input.previousResult.soundSupportReceipts.filter((receipt) =>
      revisionPlan.preservedCueIds.includes(receipt.cueId))
    const preservedSelected = input.previousResult.selectedMusicAssetRefs.filter((asset) =>
      revisionPlan.preservedCueIds.some((cueId) => asset.artifactId.includes(cueId)))
    const preservedProcessed = input.previousResult.processedMusicAssetRefs.filter((asset) =>
      revisionPlan.preservedCueIds.some((cueId) => asset.artifactId.includes(cueId)))
    const revisionArtifact = createMusicArtifact({
      artifactId: `music.revision.${input.request.requestId}.${input.revisionIdempotencyKey}`,
      artifactVersion: 1, schemaVersion: 'music_revision_receipt_v1.schema.v1', artifactType: 'music_revision_receipt_v1',
      requestId: input.request.requestId,
      sourceArtifactHashes: input.previousResult.artifacts.map((artifact) => artifact.artifactHash),
      timelineHash: input.request.timelineBinding.timelineManifestHash,
      timelineRate: input.request.timelineBinding.rationalTimelineRate,
      qualificationEvidence: ['localized_reexecution', 'unaffected_hashes_preserved', 'affected_sound_only_rerun'],
      createdAt: new Date().toISOString(), invalidationKeys: [], revisionLineage: [input.previousResult.requestId],
      payload: { revisionPlan, replacementResultHash: replacement.callerReceipt.resultHash },
    })
    const merged: CanonicalMusicSkillResult = {
      ...replacement,
      requestId: input.request.requestId,
      status: replacement.status === 'blocked' ? 'partial' : replacement.status,
      soundSupportReceipts: [...preservedSound, ...replacement.soundSupportReceipts],
      selectedMusicAssetRefs: [...preservedSelected, ...replacement.selectedMusicAssetRefs],
      processedMusicAssetRefs: [...preservedProcessed, ...replacement.processedMusicAssetRefs],
      musicStemAssetRefs: [
        ...input.previousResult.musicStemAssetRefs.filter((asset) => revisionPlan.preservedCueIds.some((cueId) => asset.artifactId.includes(cueId))),
        ...replacement.musicStemAssetRefs,
      ],
      actualMusicMutationRanges: [
        ...input.previousResult.actualMusicMutationRanges.filter((range) => !input.invalidatedRanges.some((invalidated) => musicRangesOverlap(range, invalidated))),
        ...replacement.actualMusicMutationRanges,
      ],
      artifacts: [...preservedArtifacts, ...replacement.artifacts, revisionArtifact],
      revisionEvidenceRef: revisionArtifact.artifactHash,
    }
    merged.callerReceipt.resultHash = hashMusicValue({ ...merged, callerReceipt: { ...merged.callerReceipt, resultHash: '' } })
    const authority = validateMusicResultAuthority({ request: input.request, result: merged })
    if (!authority.ok) throw new Error(`Music revision violated authority: ${authority.code}:${authority.errors.join(',')}`)
    return Object.freeze(merged)
  }

  async qa(input: MusicQaRequest): Promise<MusicQaResult> {
    const qaArtifact = input.result.artifacts.find((artifact) => artifact.artifactType === 'music_qa_report_v1')
    const errors: string[] = []
    if (!input.result.continuityQaRef) errors.push('music_continuity_qa_missing')
    if (input.result.status === 'completed' && input.result.processedMusicAssetRefs.length === 0) errors.push('processed_music_output_missing')
    if (input.result.status === 'completed' && input.result.soundSupportReceipts.length === 0) errors.push('sound_support_receipt_missing')
    const reportStatus = qaArtifact && typeof qaArtifact.payload === 'object' && qaArtifact.payload && 'status' in qaArtifact.payload
      ? String((qaArtifact.payload as { status: unknown }).status) : undefined
    return {
      status: errors.length > 0 || reportStatus === 'blocking' ? 'blocking'
        : reportStatus === 'needs_review' || input.result.reviewRequiredItems.length > 0 ? 'needs_review' : 'pass',
      ...(qaArtifact ? { qaArtifact } : {}),
      ...(input.result.continuityQaRef ? { continuityQaRef: input.result.continuityQaRef } : {}),
      errors,
    }
  }

  #plannedResult(
    request: CanonicalMusicSkillRequest,
    supervision: ReturnType<typeof createSupervisionArtifacts>,
    estimate: MusicEstimateResult,
  ): CanonicalMusicSkillResult {
    const noMusic = supervision.need.payload.decision === 'no_music' || supervision.need.payload.decision === 'intentional_silence'
    const ambience = supervision.need.payload.decision === 'ambience_only'
    const receiptBase = {
      callerSkillKey: request.caller.callerSkillKey, parentWorkItemId: request.caller.parentWorkItemId,
      exactAuthorityRef: request.scopeAuthority.parentAuthorityRef, resultHash: '',
      finalRenderOutsideMusic: true as const, musicDidNotOwnSoundTools: true as const,
    }
    const result: CanonicalMusicSkillResult = {
      schemaVersion: 'canonical-music-result-v1', requestId: request.requestId,
      musicSkillKey: 'music', musicSkillVersion: musicSkillCapabilityManifest.skillVersion,
      musicManifestHash: musicSkillCapabilityManifest.manifestHash,
      capabilityKey: `music.${request.jobType}`, capabilityVersion: musicSkillCapabilityManifest.skillVersion,
      qualificationStatusUsed: 'planning_qualified', status: noMusic ? 'no_music' : ambience ? 'ambience_only' : 'planned',
      contextStudyRef: supervision.context.artifactId, musicNeedDecisionRef: supervision.need.artifactId,
      musicNarrativeArcRef: supervision.arc.artifactId, cueSheetRef: supervision.cueSheet.artifactId,
      acquisitionPlanRef: hashMusicValue(supervision.routeBindings), providerAttemptRefs: [], candidateArtifactRefs: [],
      candidateAnalysisRefs: [], selectionDecisionRefs: [], beatAndPhraseMapRefs: [], placementManifestRefs: [],
      soundSupportReceipts: [], selectedMusicAssetRefs: [], processedMusicAssetRefs: [], musicStemAssetRefs: [],
      cueQaRefs: [], provenanceRefs: request.rightsAndProvenanceRefs.map((item) => item.rightsId),
      actualMusicMutationRanges: [], intentionalNoMusicRanges: noMusic ? request.scopeAuthority.authorizedMusicWriteRanges : [],
      artifacts: [supervision.context, supervision.need, supervision.arc, supervision.cueSheet],
      unitReceipts: [], routeReceipts: [],
      costEvidence: { estimatedCredits: estimate.expectedCredits, actualMusicCredits: 0, nestedSoundCredits: 0, totalActualCredits: 0 },
      elapsedTimeEvidence: { actualMilliseconds: 0 }, unresolvedDependencies: [],
      reviewRequiredItems: supervision.context.payload.reviewRequiredFindings,
      callerReceipt: receiptBase,
    }
    result.callerReceipt.resultHash = hashMusicValue({ ...result, callerReceipt: receiptBase })
    return Object.freeze(result)
  }
}
