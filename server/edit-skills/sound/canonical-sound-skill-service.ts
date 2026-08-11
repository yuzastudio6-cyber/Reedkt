import { createHash } from 'node:crypto'
import type { SkillCapabilityManifest } from '../core/skill-capability-manifest-types'
import {
  applyLocalizedSoundRevision,
  runCanonicalSoundController,
  validatePlannedCueAuthority,
  type SoundControllerContext,
  type SoundControllerResponse,
} from '../../sound/sound-controller'
import {
  parseCanonicalSoundRequest,
  parseCanonicalSoundResult,
  type CanonicalSoundCue,
  type CanonicalSoundRequest,
  type CanonicalSoundResult,
  type SoundFrameRange,
} from '../../sound/sound-contracts'
import { evaluateSoundScopeGuard, validateSoundResultAuthority } from '../../sound/sound-scope-guard'
import { createSoundMixAutomation } from '../../sound/sound-sync-mix-qa'
import {
  analyzeWholeVideoSoundContinuity,
  type SoundContinuitySceneEvidence,
  type SoundWholeVideoContinuityReport,
} from '../../sound/sound-continuity'
import { soundSkillCapabilityManifest } from './sound-capability-manifest'
import { resolveSoundCapabilityEntry } from './sound-admission'
import {
  CanonicalSoundRouteExecutor,
  type ApprovedSoundExecutionPackage,
  type CanonicalSoundArtifactResolver,
  type SoundRouteExecutionResult,
} from './sound-route-executor'
import type { CanonicalSoundExecutionQaReport } from '../../sound/sound-execution-qa'
import {
  compileCanonicalSoundExecutionGraph,
  type SoundExecutionGraph,
} from './sound-execution-graph'

export interface LoadedCanonicalSoundContext {
  controllerContext: SoundControllerContext
  continuitySceneEvidence: SoundContinuitySceneEvidence[]
}

export interface CanonicalSoundContextLoader {
  load(request: CanonicalSoundRequest): Promise<LoadedCanonicalSoundContext>
}

export interface CanonicalSoundPlanResult {
  schemaVersion: 'canonical-sound-plan-result-v1'
  request: CanonicalSoundRequest
  controller: SoundControllerResponse
  continuity: SoundWholeVideoContinuityReport
  selectedRoute: ApprovedSoundExecutionPackage['selectedRoute']
  executionGraph: SoundExecutionGraph
}

export interface PeerCapabilityViewRequest {
  callerType: Exclude<CanonicalSoundRequest['callerType'], 'head_of_orchestra'>
  callerSkillKey: string
  jobType: string
}

export interface PeerSoundCapabilityView {
  skillKey: 'sound'
  skillVersion: string
  manifestHash: string
  accepted: boolean
  capabilityKey?: string
  supportedScopes: string[]
  requiredInputs: string[]
  optionalInputs: string[]
  producedArtifactTypes: string[]
  qualificationStatus?: string
  evidenceLevel?: string
  peerMayInvokeSoundToolsDirectly: false
  peerMaySupplyProviderPayload: false
  peerMayDispatchWorkers: false
  limitations: string[]
}

export interface CanonicalSoundRevisionRequest {
  request: CanonicalSoundRequest
  previousResult: CanonicalSoundResult
  invalidatedRanges: SoundFrameRange[]
  replacementCues?: CanonicalSoundCue[]
}

export interface CanonicalSoundRevisionExecutionRequest extends CanonicalSoundRevisionRequest {
  execution: {
    packageId: string
    approvedWorkItemId: string
    selectedOptionalStepKeys: string[]
  }
}

export interface CanonicalSoundQaRequest {
  executionPackage: ApprovedSoundExecutionPackage
}

export interface CanonicalSoundQaResult {
  result: CanonicalSoundResult
  qa: CanonicalSoundExecutionQaReport
  continuity: SoundWholeVideoContinuityReport
}

export interface CanonicalSoundSkillService {
  getCapabilityManifest(): Readonly<SkillCapabilityManifest>
  getPeerCapabilityView(request: PeerCapabilityViewRequest): PeerSoundCapabilityView
  plan(request: CanonicalSoundRequest): Promise<CanonicalSoundPlanResult>
  execute(executionPackage: ApprovedSoundExecutionPackage): Promise<CanonicalSoundResult>
  planRevision(request: CanonicalSoundRevisionRequest): Promise<CanonicalSoundResult>
  executeRevision(request: CanonicalSoundRevisionExecutionRequest): Promise<CanonicalSoundResult>
  revise(request: CanonicalSoundRevisionRequest): Promise<CanonicalSoundResult>
  qa(request: CanonicalSoundQaRequest): Promise<CanonicalSoundQaResult>
}

export class StandaloneCanonicalSoundSkillService implements CanonicalSoundSkillService {
  readonly #context: CanonicalSoundContextLoader
  readonly #executor: CanonicalSoundRouteExecutor

  constructor(input: {
    artifacts: CanonicalSoundArtifactResolver
    context?: CanonicalSoundContextLoader
    mirelo?: ConstructorParameters<typeof CanonicalSoundRouteExecutor>[0]['mirelo']
  }) {
    this.#context = input.context ?? new StructuredRequestSoundContextLoader()
    this.#executor = new CanonicalSoundRouteExecutor({ artifacts: input.artifacts, mirelo: input.mirelo })
  }

  getCapabilityManifest(): Readonly<SkillCapabilityManifest> {
    return soundSkillCapabilityManifest
  }

  getPeerCapabilityView(request: PeerCapabilityViewRequest): PeerSoundCapabilityView {
    const capability = resolveSoundCapabilityEntry({ jobType: request.jobType })
    const accepted = Boolean(capability?.acceptedCallerTypes.includes(request.callerType))
    return {
      skillKey: 'sound',
      skillVersion: soundSkillCapabilityManifest.skillVersion,
      manifestHash: soundSkillCapabilityManifest.manifestHash,
      accepted,
      ...(capability ? {
        capabilityKey: capability.capabilityKey,
        qualificationStatus: capability.qualificationStatus,
        evidenceLevel: capability.evidenceLevel,
      } : {}),
      supportedScopes: [...(capability?.supportedScopes ?? [])],
      requiredInputs: [...(capability?.requiredInputs ?? [])],
      optionalInputs: [...(capability?.optionalInputs ?? [])],
      producedArtifactTypes: [...(capability?.producedArtifactTypes ?? [])],
      peerMayInvokeSoundToolsDirectly: false,
      peerMaySupplyProviderPayload: false,
      peerMayDispatchWorkers: false,
      limitations: [...(capability?.knownLimitations ?? ['unsupported_sound_job'])],
    }
  }

  async plan(input: CanonicalSoundRequest): Promise<CanonicalSoundPlanResult> {
    const request = parseCanonicalSoundRequest(input)
    const guard = evaluateSoundScopeGuard(request)
    if (!guard.ok) throw new Error(`Canonical Sound request rejected: ${guard.code}:${guard.errors.join(',')}`)
    const context = await this.#context.load(request)
    const controller = runCanonicalSoundController(request, context.controllerContext)
    const continuity = analyzeWholeVideoSoundContinuity({
      reportId: `sound.continuity.plan.${request.requestId}`,
      timelineRate: request.timelineRate,
      scenes: context.continuitySceneEvidence,
      cues: controller.result.cueManifest.cues,
      maximumCueDensityPerMinute: request.userSoundPreferences.maximumCueDensityPerMinute,
    })
    controller.result.soundDesignPlan = {
      ...controller.result.soundDesignPlan,
      wholeVideoContinuity: continuity,
    }
    const selected = controller.result.toolRouteBindings[0]
    if (!selected) throw new Error('Canonical Sound planning produced no exact route binding.')
    const executionGraph = compileCanonicalSoundExecutionGraph({ request, controller })
    return {
      schemaVersion: 'canonical-sound-plan-result-v1', request, controller, continuity,
      executionGraph,
      selectedRoute: {
        routeKey: selected.routeKey, routeVersion: selected.routeVersion, routeHash: selected.routeHash,
      },
    }
  }

  async execute(executionPackage: ApprovedSoundExecutionPackage): Promise<CanonicalSoundResult> {
    return (await this.#executeWithEvidence(executionPackage)).result
  }

  async planRevision(input: CanonicalSoundRevisionRequest): Promise<CanonicalSoundResult> {
    const planned = await this.plan(input.request)
    const replacementCues = input.replacementCues ?? planned.controller.result.cueManifest.cues.filter((cue) =>
      input.invalidatedRanges.some((range) => cue.startFrame < range.endFrameExclusive && cue.endFrameExclusive > range.startFrame))
    const cues = applyLocalizedSoundRevision({
      previous: input.previousResult,
      invalidatedRanges: input.invalidatedRanges,
      replacementCues,
    })
    if (!validatePlannedCueAuthority(planned.request, cues)) {
      throw new Error('Localized Sound revision would exceed exact write authority.')
    }
    const protectedSpeechRanges = planned.controller.result.mixAutomationManifest.automations
      .flatMap((automation) => automation.protectedSpeechRanges)
    const automations = cues.map((cue) => createSoundMixAutomation({
      cue,
      protectedSpeechRanges,
      timelineRate: planned.request.timelineRate,
      musicContextPresent: Boolean(planned.request.musicContext),
      approvedMusicAutomation: planned.request.musicContext?.allowedAutomation ?? [],
    }))
    const preservedMutationReceipts = (input.previousResult.mutationReceipts ?? []).filter((receipt) =>
      !input.invalidatedRanges.some((range) =>
        receipt.range.startFrame < range.endFrameExclusive &&
        receipt.range.endFrameExclusive > range.startFrame))
    const preservedArtifactIds = new Set(preservedMutationReceipts.map((receipt) => receipt.artifactId))
    const preservedExecutionUnitIds = new Set(preservedMutationReceipts.map((receipt) => receipt.unitId))
    const preservedSelected = input.previousResult.selectedAssetVersions.filter((artifact) =>
      preservedArtifactIds.has(artifact.artifactId))
    const preservedCandidates = input.previousResult.candidateAssetVersions.filter((artifact) =>
      preservedArtifactIds.has(artifact.artifactId))
    const preservedStems = input.previousResult.privateSoundStemArtifacts.filter((artifact) =>
      preservedArtifactIds.has(artifact.artifactId))
    return parseCanonicalSoundResult({
      ...planned.controller.result,
      status: 'planned',
      cueManifest: {
        ...planned.controller.result.cueManifest,
        version: input.previousResult.cueManifest.version + 1,
        cues,
      },
      mixAutomationManifest: {
        ...planned.controller.result.mixAutomationManifest,
        version: input.previousResult.mixAutomationManifest.version + 1,
        automations,
      },
      candidateAssetVersions: preservedCandidates,
      selectedAssetVersions: preservedSelected,
      privateSoundStemArtifacts: preservedStems,
      mutationReceipts: preservedMutationReceipts,
      executionUnits: (input.previousResult.executionUnits ?? []).filter((unit) =>
        preservedExecutionUnitIds.has(unit.unitId)),
      revisionEvidence: {
        previousRequestId: input.previousResult.requestId,
        invalidatedRanges: input.invalidatedRanges,
        preservedArtifactIds: [...preservedArtifactIds],
        preservedExecutionUnitIds: [...preservedExecutionUnitIds],
        replacementCueIds: replacementCues.map((cue) => cue.cueId),
        replacedUnitIds: planned.executionGraph.units.map((unit) => unit.unitId),
        unaffectedArtifactsReused: preservedArtifactIds.size > 0,
      },
      modifiedAudioRanges: [],
      actualExecutionEvidence: undefined,
      finalCompositionHandoff: undefined,
      staleIfSourceChanges: true,
    })
  }

  async revise(input: CanonicalSoundRevisionRequest): Promise<CanonicalSoundResult> {
    return this.planRevision(input)
  }

  async executeRevision(input: CanonicalSoundRevisionExecutionRequest): Promise<CanonicalSoundResult> {
    const plannedRevision = await this.planRevision(input)
    const originalAuthority = input.request.assignmentScope.authorizedAudioWriteRanges
    if (!input.invalidatedRanges.every((invalidated) => originalAuthority.some((authority) =>
      invalidated.startFrame >= authority.startFrame &&
      invalidated.endFrameExclusive <= authority.endFrameExclusive))) {
      throw new Error('Executed Sound revision invalidation exceeds the original write authority.')
    }
    const revisionIdentity = createHash('sha256').update(JSON.stringify({
      requestId: input.request.requestId,
      invalidatedRanges: input.invalidatedRanges,
      packageId: input.execution.packageId,
    })).digest('hex').slice(0, 20)
    const replacementRequest: CanonicalSoundRequest = structuredClone(input.request)
    replacementRequest.requestId = `${input.request.requestId}.revision.${revisionIdentity}`
    replacementRequest.idempotencyKey = `${input.request.idempotencyKey}.revision.${revisionIdentity}`
    replacementRequest.attemptId = `${input.request.attemptId}.revision.${revisionIdentity}`
    replacementRequest.assignmentScope.authorizedAudioWriteRanges = structuredClone(input.invalidatedRanges)
    replacementRequest.assignmentScope.assignmentMode = input.invalidatedRanges.length > 1 ? 'multi_range' : 'range'
    replacementRequest.eventAnchors = replacementRequest.eventAnchors.filter((event) =>
      input.invalidatedRanges.some((range) =>
        event.frame < range.endFrameExclusive &&
        (event.endFrameExclusive ?? event.frame + 1) > range.startFrame))
    const replacementPlan = await this.plan(replacementRequest)
    const execution = await this.#executeWithEvidence({
      schemaVersion: 'approved-sound-execution-package-v1',
      packageId: input.execution.packageId,
      approvedWorkItemId: input.execution.approvedWorkItemId,
      request: replacementPlan.request,
      plannedResult: replacementPlan.controller.result,
      selectedRoute: replacementPlan.selectedRoute,
      executionGraph: replacementPlan.executionGraph,
      selectedOptionalStepKeys: input.execution.selectedOptionalStepKeys,
      continuitySceneEvidence: replacementPlan.continuity.sceneEvidence,
    })
    const preservedArtifactIds = new Set(plannedRevision.revisionEvidence?.preservedArtifactIds ?? [])
    const preservedSelected = plannedRevision.selectedAssetVersions.filter((artifact) =>
      preservedArtifactIds.has(artifact.artifactId))
    const preservedCandidates = plannedRevision.candidateAssetVersions.filter((artifact) =>
      preservedArtifactIds.has(artifact.artifactId))
    const preservedStems = plannedRevision.privateSoundStemArtifacts.filter((artifact) =>
      preservedArtifactIds.has(artifact.artifactId))
    const selectedAssetVersions = uniqueSoundArtifacts([
      ...preservedSelected,
      ...execution.result.selectedAssetVersions,
    ])
    const privateSoundStemArtifacts = uniqueSoundArtifacts([
      ...preservedStems,
      ...execution.result.privateSoundStemArtifacts,
    ])
    const finalSoundArtifactReferences = uniqueSoundArtifacts([
      ...preservedSelected,
      ...preservedStems,
      ...(execution.result.finalCompositionHandoff?.finalSoundArtifactReferences ?? []),
      ...execution.result.selectedAssetVersions,
    ])
    return parseCanonicalSoundResult({
      ...execution.result,
      cueManifest: plannedRevision.cueManifest,
      mixAutomationManifest: plannedRevision.mixAutomationManifest,
      candidateAssetVersions: uniqueSoundArtifacts([
        ...preservedCandidates,
        ...execution.result.candidateAssetVersions,
      ]),
      selectedAssetVersions,
      privateSoundStemArtifacts,
      executionUnits: [
        ...(plannedRevision.executionUnits ?? []),
        ...(execution.result.executionUnits ?? []),
      ],
      mutationReceipts: [
        ...(plannedRevision.mutationReceipts ?? []),
        ...(execution.result.mutationReceipts ?? []),
      ],
      revisionEvidence: {
        ...plannedRevision.revisionEvidence!,
        replacedUnitIds: replacementPlan.executionGraph.units.map((unit) => unit.unitId),
      },
      modifiedAudioRanges: execution.result.modifiedAudioRanges,
      finalCompositionHandoff: execution.result.finalCompositionHandoff ? {
        ...execution.result.finalCompositionHandoff,
        soundArtifactIds: finalSoundArtifactReferences.map((artifact) => artifact.artifactId),
        finalSoundArtifactReferences,
        authorizedRanges: input.request.assignmentScope.authorizedAudioWriteRanges,
      } : undefined,
      staleIfSourceChanges: true,
    })
  }

  async qa(input: CanonicalSoundQaRequest): Promise<CanonicalSoundQaResult> {
    const executed = await this.#executeWithEvidence(input.executionPackage)
    return { result: executed.result, qa: executed.qa, continuity: executed.continuity }
  }

  async #executeWithEvidence(input: ApprovedSoundExecutionPackage): Promise<SoundRouteExecutionResult> {
    const execution = await this.#executor.execute(input)
    const authority = validateSoundResultAuthority(input.request, execution.result)
    if (!authority.ok) {
      throw new Error(`Executed Sound result violated authority: ${authority.code}:${authority.errors.join(',')}`)
    }
    return execution
  }
}

export class StructuredRequestSoundContextLoader implements CanonicalSoundContextLoader {
  async load(request: CanonicalSoundRequest): Promise<LoadedCanonicalSoundContext> {
    const sceneIds = request.assignmentScope.sceneIds.length > 0
      ? request.assignmentScope.sceneIds : ['sound-unassigned-scene']
    const continuitySceneEvidence = sceneIds.map((sceneId, index) => {
      const range = request.assignmentScope.inspectRanges[index] ??
        request.assignmentScope.inspectRanges[0] ?? request.assignmentScope.authorizedAudioWriteRanges[0]!
      const events = request.eventAnchors.filter((event) => event.sceneId === sceneId || sceneIds.length === 1)
      const environment = events.find((event) => event.environment)?.environment
      return {
        sceneId,
        range,
        ...(environment ? { acousticEnvironment: environment } : {}),
        environmentChangeIntent: index === 0 ? 'unknown' as const : 'same_environment' as const,
        ...(environment && request.sourceAudioRefs.length > 0
          ? { roomToneOrAmbienceId: `source-room:${environment}` } : {}),
        sourceAudioPresent: request.sourceAudioRefs.length > 0,
        dialogueImportance: request.transcriptSpeechEvidenceRef ? 'high' as const : 'none' as const,
        musicContext: request.musicContext ? 'bed' as const : 'none' as const,
        foregroundPerspective: events[0]?.perspective,
        backgroundPerspective: events[1]?.perspective,
        intentionalSilence: events.length === 0 && request.userSoundPreferences.preserveEmotionalSilence,
        cueIdentityKeys: events.map((event) => `${event.eventType}:${event.material ?? 'unknown'}`),
      }
    })
    return { controllerContext: {}, continuitySceneEvidence }
  }
}

function uniqueSoundArtifacts<T extends { artifactId: string; version: number }>(artifacts: T[]): T[] {
  return [...new Map(artifacts.map((artifact) => [
    `${artifact.artifactId}:${artifact.version}`, artifact,
  ])).values()]
}
