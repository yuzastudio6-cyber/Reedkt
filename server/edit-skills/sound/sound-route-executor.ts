import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { ToolRuntimeStatus } from '../../tool-registry'
import {
  parseCanonicalSoundResult,
  type CanonicalSoundRequest,
  type CanonicalSoundResult,
  type SoundArtifactRef,
  type SoundFrameRange,
} from '../../sound/sound-contracts'
import {
  runSoundLocalAudioExecution,
  validateSoundAudioFile,
  type SoundAudioStudyReport,
  type SoundLocalAudioExecutionResult,
  type SoundLocalOperation,
  type SoundLocalOperationParameters,
} from '../../sound/sound-local-audio-processor'
import {
  evaluateSoundRouteBindingInvalidation,
  evaluateSoundToolRouteAdmission,
  getSoundToolRouteManifest,
  type SoundToolRouteBinding,
  type SoundToolRouteManifest,
  type SoundToolRouteStep,
} from '../../sound/sound-tool-route-manifest'
import { probeCanonicalSoundRuntimeStatuses } from '../../sound/sound-runtime-status'
import { SOUND_MIRELO_RATE_CARD_SNAPSHOT } from '../../sound/sound-rate-card'
import {
  MireloSfxProviderAdapter,
  type MireloGenerationResult,
  type MireloProviderAttempt,
} from '../../sound/mirelo-sfx-provider'
import {
  prepareBoundedPrivateVisualProxy,
  type BoundedSoundVisualProxyResult,
} from '../../sound/sound-bounded-visual-proxy'
import {
  decimalSecondsToFrames,
  framesToSeconds,
} from '../core/timeline-rate'
import {
  analyzeWholeVideoSoundContinuity,
  type SoundContinuitySceneEvidence,
  type SoundWholeVideoContinuityReport,
} from '../../sound/sound-continuity'
import {
  runCanonicalSoundExecutionQa,
  type CanonicalSoundExecutionQaReport,
} from '../../sound/sound-execution-qa'
import {
  compileCanonicalSoundExecutionGraph,
  type SoundExecutionGraph,
  type SoundExecutionUnit,
} from './sound-execution-graph'
import { resolveSoundOperationHandlerKind } from './sound-operation-handler-registry'

export interface ResolvedPrivateSoundArtifact {
  artifact: SoundArtifactRef
  absolutePath: string
  approvedRoot: string
}

export interface CanonicalSoundArtifactResolver {
  resolve(artifact: SoundArtifactRef): Promise<ResolvedPrivateSoundArtifact>
  privateOutputRoot(privateOutputScopeId: string): Promise<string>
}

export interface ApprovedSoundExecutionPackage {
  schemaVersion: 'approved-sound-execution-package-v1'
  packageId: string
  approvedWorkItemId: string
  request: CanonicalSoundRequest
  plannedResult: CanonicalSoundResult
  selectedRoute: {
    routeKey: string
    routeVersion: string
    routeHash: string
  }
  executionGraph?: SoundExecutionGraph
  selectedOptionalStepKeys: string[]
  continuitySceneEvidence: SoundContinuitySceneEvidence[]
}

export interface SoundRouteStepExecutionEvidence {
  unitId: string
  stepKey: string
  toolKey: string
  operationKey: string
  status: 'completed' | 'skipped_optional' | 'skipped_condition' | 'failed' | 'blocked_dependency'
  startedAt?: string
  completedAt?: string
  elapsedMilliseconds: number
  outputArtifactIds: string[]
  outputArtifactHashes: string[]
  evidenceRefs: string[]
  operationSpecHash: string
  operationReceiptHash?: string
  failureCode?: string
}

export interface SoundSynchronizationPlacement {
  placementId: string
  cueId: string
  sourceArtifactId: string
  requestedEventFrame: number
  detectedTransientFrame: number
  appliedOffsetFrames: number
  resultingTransientFrame: number
  residualErrorFrames: number
  timelineRate: CanonicalSoundRequest['timelineRate']
  placementManifestHash: string
}

export interface SoundMutationReceipt {
  mutationReceiptId: string
  unitId: string
  artifactId: string
  range: SoundFrameRange
  sourceArtifactIds: string[]
  sourceHashes: string[]
  outputHash: string
  sourceUnchanged: true
  receiptHash: string
}

export interface SoundRouteExecutionResult {
  result: CanonicalSoundResult
  qa: CanonicalSoundExecutionQaReport
  continuity: SoundWholeVideoContinuityReport
  providerAttempt?: MireloProviderAttempt
  providerAttempts: MireloProviderAttempt[]
  providerVisualRejected?: boolean
  proxy?: BoundedSoundVisualProxyResult
  proxies: BoundedSoundVisualProxyResult[]
  stepEvidence: SoundRouteStepExecutionEvidence[]
}

interface UnitExecutionOutcome {
  unit: SoundExecutionUnit
  routeBinding?: SoundToolRouteBinding
  status: 'completed' | 'no_sound' | 'planning_only' | 'failed' | 'blocked'
  failureCode?: string
  selectedArtifact?: SoundArtifactRef
  candidateArtifacts: SoundArtifactRef[]
  studyReports: SoundAudioStudyReport[]
  localResults: SoundLocalAudioExecutionResult[]
  providerAttempts: MireloProviderAttempt[]
  providerVisualRejected?: boolean
  proxy?: BoundedSoundVisualProxyResult
  placement?: SoundSynchronizationPlacement
  soundDna?: CanonicalSoundResult['soundDna']
  mutationReceipt?: SoundMutationReceipt
  stepEvidence: SoundRouteStepExecutionEvidence[]
}

interface StepState {
  currentArtifacts: SoundArtifactRef[]
  candidateArtifacts: SoundArtifactRef[]
  studies: SoundAudioStudyReport[]
  localResults: SoundLocalAudioExecutionResult[]
  provider?: MireloGenerationResult
  proxy?: BoundedSoundVisualProxyResult
  placement?: SoundSynchronizationPlacement
  soundDna?: CanonicalSoundResult['soundDna']
}

interface StepInvocationResult {
  artifacts?: SoundArtifactRef[]
  evidenceRefs: string[]
  localResult?: SoundLocalAudioExecutionResult
  localResults?: SoundLocalAudioExecutionResult[]
  provider?: MireloGenerationResult
  proxy?: BoundedSoundVisualProxyResult
  placement?: SoundSynchronizationPlacement
  soundDna?: CanonicalSoundResult['soundDna']
}

interface StepInvocationInput {
  input: ApprovedSoundExecutionPackage
  unit: SoundExecutionUnit
  route: Readonly<SoundToolRouteManifest>
  routeBinding: SoundToolRouteBinding
  step: SoundToolRouteStep
  state: StepState
}

export class CanonicalSoundRouteExecutor {
  readonly #artifacts: CanonicalSoundArtifactResolver
  readonly #mirelo?: MireloSfxProviderAdapter

  constructor(input: {
    artifacts: CanonicalSoundArtifactResolver
    mirelo?: MireloSfxProviderAdapter
  }) {
    this.#artifacts = input.artifacts
    this.#mirelo = input.mirelo
  }

  async execute(input: ApprovedSoundExecutionPackage): Promise<SoundRouteExecutionResult> {
    const startedAt = performance.now()
    validateExecutionPackage(input)
    const graph = validateOrCompileGraph(input)
    const outcomes: UnitExecutionOutcome[] = []
    for (const unit of graph.units) {
      outcomes.push(await this.#executeUnit(input, unit))
    }

    const continuity = analyzeWholeVideoSoundContinuity({
      reportId: `sound.continuity.${input.packageId}`,
      timelineRate: input.request.timelineRate,
      scenes: input.continuitySceneEvidence,
      cues: input.plannedResult.cueManifest.cues,
      maximumCueDensityPerMinute: input.request.userSoundPreferences.maximumCueDensityPerMinute,
    })
    const selected = outcomes.flatMap((item) => item.selectedArtifact ? [item.selectedArtifact] : [])
    const studies = outcomes.flatMap((item) => item.studyReports)
    const localResults = outcomes.flatMap((item) => item.localResults)
    const providerAttempts = outcomes.flatMap((item) => item.providerAttempts)
    const placements = outcomes.flatMap((item) => item.placement ? [item.placement] : [])
    const mutationReceipts = outcomes.flatMap((item) => item.mutationReceipt ? [item.mutationReceipt] : [])
    const qa = runCanonicalSoundExecutionQa({
      request: input.request,
      outputs: outcomes.flatMap((outcome) => outcome.selectedArtifact
        ? [{ artifact: outcome.selectedArtifact, study: outcome.studyReports.at(-1) }]
        : []),
      cues: input.plannedResult.cueManifest.cues,
      automations: input.plannedResult.mixAutomationManifest.automations,
      continuity,
      providerAttempts,
      sourceUnchanged: localResults.every((item) => item.sourceUnchanged),
      providerVisualRejected: outcomes.some((item) => item.providerVisualRejected),
      synchronizationPlacements: placements,
      mixMeasurements: await this.#measureMixEvidence(input, outcomes),
    })

    const failures = outcomes.filter((item) => item.status === 'failed' || item.status === 'blocked')
    const completed = outcomes.filter((item) => item.status === 'completed')
    const planningOnly = outcomes.every((item) => item.status === 'planning_only')
    const noSound = outcomes.every((item) => item.status === 'no_sound')
    const status: CanonicalSoundResult['status'] = noSound ? 'no_sound'
      : planningOnly ? 'blocked'
        : failures.length > 0 && completed.length > 0 ? 'partial'
          : failures.length > 0 || qa.status === 'failed' ? 'blocked'
            : 'completed'
    const stepEvidence = outcomes.flatMap((item) => item.stepEvidence)
    const candidateArtifacts = uniqueArtifacts(outcomes.flatMap((item) => item.candidateArtifacts))
    const routeBindings = uniqueRouteBindings(outcomes.flatMap((item) => item.routeBinding ? [item.routeBinding] : []))
    const elapsedMilliseconds = Math.round(performance.now() - startedAt)
    const localCost = localResults.reduce((sum, item) => sum + item.runtimeEvidence.localComputeCostUsd, 0)
    const soundDna = outcomes.find((item) => item.soundDna)?.soundDna
    const unresolvedDependencies = [
      ...failures.map((item) => item.failureCode ?? `sound_unit_failed:${item.unit.unitId}`),
      ...(planningOnly ? ['sound_capability_planning_only'] : []),
      ...(qa.status === 'failed' ? ['sound_output_qa_failed'] : []),
    ]
    const result: CanonicalSoundResult = {
      ...structuredClone(input.plannedResult),
      toolRouteBindings: routeBindings.length > 0 ? routeBindings : input.plannedResult.toolRouteBindings,
      status,
      studyReport: studies.length > 0 ? { reports: structuredClone(studies) } : input.plannedResult.studyReport,
      soundDna,
      synchronizationPlacements: placements,
      executionUnits: outcomes.map((outcome) => executionUnitReceipt(outcome)),
      mutationReceipts,
      qaReport: { ...qa, continuityReport: continuity },
      candidateAssetVersions: candidateArtifacts,
      selectedAssetVersions: uniqueArtifacts(selected),
      privateSoundStemArtifacts: ['mix_sound_layers', 'create_sound_stem'].includes(input.request.requestedJobType)
        ? uniqueArtifacts(selected) : [],
      modifiedAudioRanges: uniqueRanges(mutationReceipts.map((receipt) => receipt.range)),
      modifiedVisualRanges: [],
      unresolvedDependencies,
      approvalStatus: 'approved',
      creditStatus: input.request.executionAuthority.creditReservationId ? 'reserved' : 'not_required',
      providerStatus: providerAttempts.length === 0 ? 'not_needed'
        : providerAttempts.every((attempt) => attempt.status === 'succeeded') ? 'succeeded'
          : providerAttempts.some((attempt) => attempt.status === 'unknown') ? 'unknown' : 'failed',
      workerStatus: status === 'completed' || status === 'no_sound' ? 'completed'
        : status === 'partial' ? 'failed' : planningOnly ? 'blocked' : 'failed',
      artifactStatus: selected.length > 0 ? 'private_ready'
        : noSound ? 'none' : planningOnly ? 'blocked' : failures.length > 0 ? 'failed' : 'none',
      qaStatus: qa.status === 'failed' ? 'failed' : qa.status === 'passed' ? 'passed' : 'warning',
      actualExecutionEvidence: {
        routeExecutionId: `sound.route-execution.${safeKey(input.packageId)}`,
        elapsedMilliseconds,
        actualCreditsCharged: 0,
        actualLocalInfrastructureCostUsd: Number(localCost.toFixed(8)),
        ...(providerAttempts[0]?.providerCostEvidence
          ? { providerCostEvidenceId: `sound.provider-cost.${providerAttempts[0].attemptId}` } : {}),
        ...(providerAttempts[0] ? {
          providerAttemptId: providerAttempts[0].attemptId,
          providerAttemptStatus: providerAttempts[0].status,
          providerAttemptIds: providerAttempts.map((attempt) => attempt.attemptId),
        } : {}),
        toolRuntimeEvidenceIds: localResults.map((item) => `sound.runtime.${safeKey(item.executionId)}`),
        outputArtifactHashes: uniqueArtifacts([...selected, ...candidateArtifacts]).map((artifact) => artifact.checksumSha256),
        stepEvidence,
      },
      finalCompositionHandoff: status === 'completed' || status === 'no_sound' ? {
        handoffId: `sound.handoff.${safeKey(input.packageId)}`,
        soundArtifactIds: selected.map((artifact) => artifact.artifactId),
        cueManifestId: input.plannedResult.cueManifest.cueManifestId,
        mixManifestId: input.plannedResult.mixAutomationManifest.mixManifestId,
        qaEvidenceHash: qa.evidenceHash,
        timelineManifestHash: input.request.timelineManifestHash,
        timelineRate: input.request.timelineRate,
        finalRenderOwnedBySound: false,
      } : undefined,
    }
    const hasExecutableEvidence = selected.length > 0 || studies.length > 0 || placements.length > 0 ||
      noSound || planningOnly
    if (status === 'completed' && !hasExecutableEvidence) {
      throw new Error('Sound execution cannot complete without real operation evidence.')
    }
    return {
      result: parseCanonicalSoundResult(result), qa, continuity,
      providerAttempt: providerAttempts[0], providerAttempts,
      proxy: outcomes.find((item) => item.proxy)?.proxy,
      proxies: outcomes.flatMap((item) => item.proxy ? [item.proxy] : []),
      stepEvidence,
    }
  }

  async #executeUnit(
    input: ApprovedSoundExecutionPackage,
    unit: SoundExecutionUnit,
  ): Promise<UnitExecutionOutcome> {
    if (unit.unitKind === 'planning_only') {
      return {
        unit, status: 'planning_only', failureCode: 'planning_qualified_no_execution_route',
        candidateArtifacts: [], studyReports: [], localResults: [], providerAttempts: [],
        stepEvidence: [],
      }
    }
    const route = getSoundToolRouteManifest(unit.route.routeKey, unit.route.routeVersion)
    if (!route || route.routeHash !== unit.route.routeHash) {
      return failedUnit(unit, 'route_identity_unavailable_or_stale')
    }
    let routeBinding: SoundToolRouteBinding
    try {
      routeBinding = await this.#admitExecutionRoute(input, route)
    } catch {
      return failedUnit(unit, 'route_admission_failed')
    }
    const state: StepState = {
      currentArtifacts: structuredClone(unit.sourceArtifacts), candidateArtifacts: [],
      studies: [], localResults: [],
    }
    const evidence: SoundRouteStepExecutionEvidence[] = []
    const statuses = new Map<string, SoundRouteStepExecutionEvidence['status']>()
    for (const step of topologicalSteps(route)) {
      const skippedOptional = !step.required && !input.selectedOptionalStepKeys.includes(step.stepKey)
      const skippedCondition = !skippedOptional && conditionIsFalse(step.executionCondition, input.request, unit, state)
      const blockedDependency = step.orderOrDependencies.some((dependency) => {
        const status = statuses.get(dependency)
        return status === 'failed' || status === 'blocked_dependency'
      })
      if (skippedOptional || skippedCondition || blockedDependency) {
        const status = skippedOptional ? 'skipped_optional' : skippedCondition ? 'skipped_condition' : 'blocked_dependency'
        statuses.set(step.stepKey, status)
        evidence.push({
          unitId: unit.unitId, stepKey: step.stepKey, toolKey: step.toolKey,
          operationKey: step.operationKey, status, elapsedMilliseconds: 0,
          outputArtifactIds: [], evidenceRefs: [
            skippedOptional ? 'sound.optional_step_not_admitted'
              : skippedCondition ? 'sound.step_condition_false' : 'sound.step_dependency_failed',
          ], outputArtifactHashes: [], operationSpecHash: unit.operationSpec.operationSpecHash,
        })
        continue
      }
      const startedAt = new Date().toISOString()
      const started = performance.now()
      try {
        const invoked = await this.#invokeStep({ input, unit, route, routeBinding, step, state })
        const completedAt = new Date().toISOString()
        const elapsedMilliseconds = Math.round(performance.now() - started)
        if (invoked.artifacts?.length) state.currentArtifacts = uniqueArtifacts(invoked.artifacts)
        if (invoked.localResult) {
          state.localResults.push(invoked.localResult)
          if (invoked.localResult.studyReport) state.studies.push(invoked.localResult.studyReport)
        }
        if (invoked.localResults) {
          state.localResults.push(...invoked.localResults)
          state.studies.push(...invoked.localResults.flatMap((result) =>
            result.studyReport ? [result.studyReport] : []))
        }
        if (invoked.provider) {
          state.provider = invoked.provider
          state.candidateArtifacts.push(...invoked.provider.outputArtifacts)
          state.currentArtifacts = [...invoked.provider.outputArtifacts]
        }
        if (invoked.proxy) state.proxy = invoked.proxy
        if (invoked.placement) state.placement = invoked.placement
        if (invoked.soundDna) state.soundDna = invoked.soundDna
        const receiptCore = {
          unitId: unit.unitId, stepKey: step.stepKey, toolKey: step.toolKey,
          operationKey: step.operationKey, operationProfileKey: step.operationProfileKey,
          operationSpecHash: unit.operationSpec.operationSpecHash,
          startedAt, completedAt, elapsedMilliseconds,
          outputArtifactHashes: (invoked.artifacts ?? []).map((artifact) => artifact.checksumSha256),
          evidenceRefs: invoked.evidenceRefs,
        }
        statuses.set(step.stepKey, 'completed')
        evidence.push({
          unitId: unit.unitId, stepKey: step.stepKey, toolKey: step.toolKey,
          operationKey: step.operationKey, status: 'completed', startedAt, completedAt,
          elapsedMilliseconds,
          outputArtifactIds: (invoked.artifacts ?? []).map((artifact) => artifact.artifactId),
          outputArtifactHashes: (invoked.artifacts ?? []).map((artifact) => artifact.checksumSha256),
          evidenceRefs: invoked.evidenceRefs,
          operationSpecHash: unit.operationSpec.operationSpecHash,
          operationReceiptHash: hash(receiptCore),
        })
      } catch (error) {
        if (isFatalIntegrityError(error)) throw error
        const completedAt = new Date().toISOString()
        const failureCode = safeFailureCode(error)
        statuses.set(step.stepKey, 'failed')
        evidence.push({
          unitId: unit.unitId, stepKey: step.stepKey, toolKey: step.toolKey,
          operationKey: step.operationKey, status: 'failed', startedAt, completedAt,
          elapsedMilliseconds: Math.round(performance.now() - started), outputArtifactIds: [],
          outputArtifactHashes: [], evidenceRefs: ['sound.operation_failed'], operationSpecHash: unit.operationSpec.operationSpecHash,
          failureCode,
        })
        if (step.failureBehavior !== 'continue_without_optional_step') {
          return {
            unit, routeBinding, status: 'failed', failureCode,
            selectedArtifact: state.currentArtifacts.find((artifact) =>
              !unit.sourceArtifacts.some((source) => sameArtifact(source, artifact))),
            candidateArtifacts: uniqueArtifacts(state.candidateArtifacts),
            studyReports: state.studies, localResults: state.localResults,
            providerAttempts: state.provider ? [state.provider.attempt] : [],
            providerVisualRejected: state.provider?.providerVisualRejected,
            proxy: state.proxy, placement: state.placement, soundDna: state.soundDna,
            stepEvidence: evidence,
          }
        }
      }
    }
    const selectedArtifact = state.currentArtifacts.find((artifact) =>
      !unit.sourceArtifacts.some((source) => sameArtifact(source, artifact)))
    const noSound = route.routeRole === 'no_sound'
    const mutationReceipt = selectedArtifact && ['audio_operation', 'provider_generation'].includes(unit.unitKind)
      ? createMutationReceipt(unit, selectedArtifact) : undefined
    return {
      unit, routeBinding, status: noSound ? 'no_sound' : 'completed',
      selectedArtifact, candidateArtifacts: uniqueArtifacts(state.candidateArtifacts),
      studyReports: state.studies, localResults: state.localResults,
      providerAttempts: state.provider ? [state.provider.attempt] : [],
      providerVisualRejected: state.provider?.providerVisualRejected,
      proxy: state.proxy, placement: state.placement, soundDna: state.soundDna,
      mutationReceipt, stepEvidence: evidence,
    }
  }

  async #invokeStep(input: StepInvocationInput): Promise<StepInvocationResult> {
    const { step } = input
    const handler = resolveSoundOperationHandlerKind(step)
    if (handler === 'bounded_visual_proxy') return this.#prepareProxyStep(input)
    if (handler === 'media_inspection') return this.#inspectStep(input)
    if (handler === 'local_audio') return this.#localAudioStep(input)
    if (handler === 'mirelo_provider') return this.#mireloStep(input)
    if (handler === 'synchronization') return this.#syncStep(input)
    if (handler === 'private_artifact') return this.#artifactStep(input)
    if (handler === 'provider_attempt') {
      return { evidenceRefs: [`sound.provider_attempt_planned.${safeKey(input.unit.unitId)}`] }
    }
    if (handler === 'output_qa') {
      if (input.state.currentArtifacts.length === 0 && input.unit.unitKind !== 'synchronization') {
        throw new Error('Sound QA handler received no real artifact evidence.')
      }
      return { evidenceRefs: [`sound.qa.handler.${safeKey(input.unit.unitId)}.${safeKey(step.stepKey)}`] }
    }
    if (handler === 'planning_receipt') return this.#planningStep(input)
    if (handler === 'no_sound_decision') {
      return { evidenceRefs: [`sound.no_sound.decision.${safeKey(input.unit.unitId)}`] }
    }
    throw new Error(`No qualified Sound operation handler is registered for ${step.toolKey}:${step.operationKey}.`)
  }

  async #inspectStep(input: StepInvocationInput): Promise<StepInvocationResult> {
    const artifact = input.state.currentArtifacts.at(-1) ?? input.unit.sourceArtifacts[0]
    if (!artifact) throw new Error('Sound inspection step has no approved artifact.')
    const resolved = await this.#artifacts.resolve(artifact)
    const media = await validateSoundAudioFile(resolved.absolutePath)
    return { artifacts: [artifact], evidenceRefs: [`sound.ffprobe.${hash(media)}`] }
  }

  async #localAudioStep(input: StepInvocationInput): Promise<StepInvocationResult> {
    const operation = localOperationFromStep(input.step.operationKey)
    if (!operation) throw new Error(`Unsupported FFmpeg Sound operation ${input.step.operationKey}.`)
    if (operation === 'analyze' && input.state.currentArtifacts.length > 1) {
      return this.#analyzeAndSelectCandidates(input)
    }
    const sourceArtifacts = operation === 'mix_stem'
      ? input.unit.sourceArtifacts
      : [input.state.currentArtifacts.at(-1) ?? input.unit.sourceArtifacts[0]].filter(
        (artifact): artifact is SoundArtifactRef => Boolean(artifact),
      )
    if (sourceArtifacts.length === 0) throw new Error('Sound operation has no approved source artifact.')
    const sources = await Promise.all(sourceArtifacts.map((artifact) => this.#artifacts.resolve(artifact)))
    const approvedInputRoot = commonApprovedRoot(sources)
    const outputRoot = await this.#artifacts.privateOutputRoot(input.input.request.executionAuthority.privateOutputScopeId!)
    const outputRequired = !['analyze', 'sync_qa'].includes(operation)
    const outputRelativePath = `sound/${safeKey(input.input.request.idempotencyKey)}/${safeKey(input.unit.unitId)}/${safeKey(input.step.stepKey)}.wav`
    const local = await runSoundLocalAudioExecution({
      schemaVersion: 'sound-local-audio-execution-v1',
      executionId: `sound.local.${safeKey(input.input.packageId)}.${safeKey(input.unit.unitId)}.${safeKey(input.step.stepKey)}`,
      binding: localBinding(input.input, input.routeBinding, input.unit),
      operation,
      operationProfileKey: input.step.operationProfileKey,
      sources: sources.map(({ artifact, absolutePath }) => ({ artifact, absolutePath })),
      approvedInputRoot,
      privateOutputRoot: outputRoot,
      ...(outputRequired ? {
        outputRelativePath,
        outputArtifactId: `sound-output-${safeKey(input.unit.unitId)}-${safeKey(input.step.stepKey)}`,
        outputArtifactType: outputArtifactType(input.step, operation),
        outputContentType: 'audio/wav' as const,
      } : {}),
      parameters: localParameters(input.input.request, input.unit, operation),
    })
    return {
      artifacts: local.outputArtifact ? [local.outputArtifact] : sourceArtifacts,
      evidenceRefs: [`sound.local_execution.${safeKey(local.executionId)}`],
      localResult: local,
    }
  }

  async #analyzeAndSelectCandidates(input: StepInvocationInput): Promise<StepInvocationResult> {
    const outputRoot = await this.#artifacts.privateOutputRoot(input.input.request.executionAuthority.privateOutputScopeId!)
    const results: SoundLocalAudioExecutionResult[] = []
    for (const [index, artifact] of input.state.currentArtifacts.entries()) {
      const source = await this.#artifacts.resolve(artifact)
      results.push(await runSoundLocalAudioExecution({
        schemaVersion: 'sound-local-audio-execution-v1',
        executionId: `sound.candidate-study.${safeKey(input.unit.unitId)}.${index}`,
        binding: localBinding(input.input, input.routeBinding, input.unit),
        operation: 'analyze', operationProfileKey: input.step.operationProfileKey,
        sources: [{ artifact, absolutePath: source.absolutePath }],
        approvedInputRoot: source.approvedRoot, privateOutputRoot: outputRoot,
        parameters: {},
      }))
    }
    const ranked = results.map((result, index) => {
      const study = result.studyReport!
      const clippingPenalty = study.clippingSampleCount > 0 ? 1_000_000 : 0
      const peakPenalty = Math.max(0, study.peakDbfs - input.input.request.qualityPolicy.maximumTruePeakDbtp) * 1_000
      const loudnessPenalty = study.integratedLoudnessLufs === undefined ? 100
        : Math.abs(study.integratedLoudnessLufs - input.input.request.qualityPolicy.targetLoudnessLufs)
      const transientReward = Math.min(20, study.transientTimesSeconds.length)
      return { index, score: clippingPenalty + peakPenalty + loudnessPenalty - transientReward }
    }).sort((left, right) => left.score - right.score || left.index - right.index)
    const selectedIndex = ranked[0]!.index
    const selected = input.state.currentArtifacts[selectedIndex]!
    return {
      artifacts: [selected], localResults: results,
      evidenceRefs: [hash({
        policy: 'sound.candidate_ranking.technical_v1',
        candidates: input.state.currentArtifacts.map((artifact, index) => ({
          artifactId: artifact.artifactId, score: ranked.find((item) => item.index === index)!.score,
        })),
        selectedArtifactId: selected.artifactId,
      })],
    }
  }

  async #prepareProxyStep(input: StepInvocationInput): Promise<StepInvocationResult> {
    const request = input.input.request
    const cue = input.unit.cue
    if (!cue) throw new Error('Bounded visual proxy requires an exact cue.')
    const visual = request.visualDependencies.find((item) =>
      item.artifact.artifactId === input.unit.visualDependencyArtifactId)
    if (!visual) throw new Error('Bounded visual proxy requires the cue-bound visual dependency.')
    const resolvedVisual = await this.#artifacts.resolve(visual.artifact)
    const inspectAuthority = request.assignmentScope.inspectRanges.find((range) =>
      cue.startFrame >= range.startFrame && cue.endFrameExclusive <= range.endFrameExclusive)
    if (!inspectAuthority) throw new Error('Visual proxy cue is outside approved inspection authority.')
    const outputRoot = await this.#artifacts.privateOutputRoot(request.executionAuthority.privateOutputScopeId!)
    const proxy = await prepareBoundedPrivateVisualProxy({
      schemaVersion: 'sound-bounded-visual-proxy-request-v1',
      executionId: `sound.proxy.${safeKey(input.input.packageId)}.${safeKey(input.unit.unitId)}`,
      approvedSnapshotId: request.executionAuthority.approvedPlanSnapshotId!,
      approvedSnapshotHash: request.executionAuthority.approvedPlanSnapshotHash!,
      approvedWorkItemId: input.input.approvedWorkItemId,
      privateOutputScopeId: request.executionAuthority.privateOutputScopeId!,
      idempotencyKey: `${request.idempotencyKey}.${safeKey(input.unit.unitId)}.proxy`,
      source: {
        artifact: visual.artifact, absolutePath: resolvedVisual.absolutePath,
        visualVersion: visual.visualVersion, visualHash: visual.visualHash,
        expectedChecksumSha256: visual.artifact.checksumSha256,
      },
      approvedInputRoot: resolvedVisual.approvedRoot,
      privateOutputRoot: outputRoot,
      outputRelativePath: `sound/${safeKey(request.idempotencyKey)}/${safeKey(input.unit.unitId)}/mirelo-visual-proxy.mp4`,
      outputArtifactId: `sound-proxy-${safeKey(input.unit.unitId)}`,
      eventRange: { rangeId: cue.cueId, startFrame: cue.startFrame, endFrameExclusive: cue.endFrameExclusive },
      authorizedSourceRange: inspectAuthority,
      preRollFrames: requiredParameterNumber(input.unit, 'proxyPreRollFrames'),
      postRollFrames: requiredParameterNumber(input.unit, 'proxyPostRollFrames'),
      timelineRate: request.timelineRate, timelineManifestRate: request.timelineManifestRate,
      outputConstraints: {
        maximumWidth: 1280, maximumHeight: 720, maximumBytes: 256 * 1024 * 1024,
        contentType: 'video/mp4', removeSourceAudio: true,
      },
      providerProfile: {
        providerKey: 'mirelo_sfx', providerProfileKey: 'sound.mirelo.video_sfx_1_6.v1',
        providerProfileVersion: '1.0.0',
      },
    })
    return { artifacts: [proxy.artifact], proxy, evidenceRefs: [proxy.checksumSha256] }
  }

  async #mireloStep(input: StepInvocationInput): Promise<StepInvocationResult> {
    if (!this.#mirelo) throw new Error('Mirelo execution is fail-closed without an injected or approved live adapter.')
    const request = input.input.request
    const cue = input.unit.cue
    if (!cue) throw new Error('Mirelo generation requires one exact cue per execution unit.')
    const durationFrames = request.requestedJobType === 'generate_ambience'
      ? input.unit.targetRange.endFrameExclusive - input.unit.targetRange.startFrame
      : cue.endFrameExclusive - cue.startFrame
    const durationMs = Math.max(1_000, Math.round(framesToSeconds(
      durationFrames, request.timelineRate,
    ) * 1_000))
    const requestId = `${request.requestId}.${safeKey(input.unit.unitId)}`
    const attemptId = `${request.attemptId}.${safeKey(input.unit.unitId)}`
    const idempotencyKey = `${request.idempotencyKey}.${safeKey(input.unit.unitId)}`
    const common = {
      requestId, attemptId, idempotencyKey,
      approvedPlanSnapshotId: request.executionAuthority.approvedPlanSnapshotId!,
      approvedPlanSnapshotHash: request.executionAuthority.approvedPlanSnapshotHash!,
      creditReservationId: request.executionAuthority.creditReservationId!,
      privateOutputScopeId: request.executionAuthority.privateOutputScopeId!,
      durationMs, candidateCount: request.costPolicy.candidateCount,
      maximumPreflightCredits: request.costPolicy.maximumCredits,
      timeoutMs: request.latencyPolicy.maximumExpectedSeconds * 1_000,
      privacyApproved: true as const, commercialTermsApproved: true as const,
      retentionApproved: true as const, routeBinding: input.routeBinding,
    }
    const provider = input.step.operationKey === 'generate_video_conditioned_sfx'
      ? await this.#mirelo.generate({
          ...common, operation: 'video_to_sfx' as const,
          privateVisualProxy: await this.#providerProxyPayload(input),
          useAsyncJob: request.latencyPolicy.allowAsyncProviderJob,
        })
      : await this.#mirelo.generate({
          ...common, operation: 'text_to_sfx' as const,
          prompt: buildMireloPrompt(request, unitEvent(request, input.unit)),
          loop: request.requestedJobType === 'generate_ambience' || request.requestedJobType === 'extend_ambience',
        })
    return {
      artifacts: provider.outputArtifacts, provider,
      evidenceRefs: [`sound.provider_attempt.${safeKey(provider.attempt.attemptId)}`],
    }
  }

  async #providerProxyPayload(input: StepInvocationInput) {
    const proxy = input.state.proxy
    if (!proxy) throw new Error('Mirelo video generation requires the completed bounded visual proxy dependency.')
    const outputRoot = await this.#artifacts.privateOutputRoot(input.input.request.executionAuthority.privateOutputScopeId!)
    const relativePath = proxy.artifact.storageObjectId.replaceAll(':', '/')
    return {
      bytes: await readFile(resolve(outputRoot, relativePath)),
      contentType: proxy.artifact.contentType as 'video/mp4' | 'video/webm',
      visualHash: proxy.checksumSha256,
      sourceVisualHash: proxy.sourceVisualHash,
      artifactId: proxy.artifact.artifactId,
      artifactVersion: proxy.artifact.version,
      startOffsetMs: 0,
    }
  }

  async #syncStep(input: StepInvocationInput): Promise<StepInvocationResult> {
    if (input.step.operationKey === 'create_speech_safe_mix_automation' ||
      input.step.operationKey === 'create_timed_sound_cue') {
      return { evidenceRefs: [`sound.automation.${hash(input.unit.automation ?? input.unit.targetRange)}`] }
    }
    const cue = input.unit.cue
    const study = input.state.studies.at(-1)
    const source = input.state.currentArtifacts.at(-1) ?? input.unit.sourceArtifacts[0]
    if (!cue || !study || !source) throw new Error('Sound synchronization requires cue, decoded transient, and source evidence.')
    const requestedEventFrame = cue.hitFrame ?? cue.startFrame
    const detectedRelativeFrame = decimalSecondsToFrames({
      seconds: study.transientTimesSeconds[0] ?? 0,
      rate: input.input.request.timelineRate,
      rounding: 'nearest_half_up',
    })
    const detectedTransientFrame = cue.startFrame + detectedRelativeFrame
    const appliedOffsetFrames = requestedEventFrame - detectedTransientFrame
    const core = {
      placementId: `sound-placement.${safeKey(input.unit.unitId)}`,
      cueId: cue.cueId,
      sourceArtifactId: source.artifactId,
      requestedEventFrame,
      detectedTransientFrame,
      appliedOffsetFrames,
      resultingTransientFrame: detectedTransientFrame + appliedOffsetFrames,
      residualErrorFrames: 0,
      timelineRate: input.input.request.timelineRate,
    }
    const placement = { ...core, placementManifestHash: hash(core) }
    return { placement, evidenceRefs: [placement.placementManifestHash] }
  }

  async #artifactStep(input: StepInvocationInput): Promise<StepInvocationResult> {
    const artifacts = input.state.currentArtifacts
    if (artifacts.length === 0) throw new Error('Private Sound artifact handler received no output to verify.')
    for (const artifact of artifacts) await this.#artifacts.resolve(artifact)
    return {
      artifacts,
      evidenceRefs: artifacts.map((artifact) => `sound.private_artifact.${artifact.checksumSha256}`),
    }
  }

  async #planningStep(input: StepInvocationInput): Promise<StepInvocationResult> {
    if (input.step.operationKey === 'derive_reference_sound_dna') {
      const study = input.state.studies.at(-1)
      if (!study) throw new Error('Sound DNA requires a decoded reference study.')
      const core = {
        schemaVersion: 'sound-dna-v1' as const,
        measured: {
          durationSeconds: study.durationSeconds, sampleRate: study.sampleRate,
          channels: study.channels, integratedLoudnessLufs: study.integratedLoudnessLufs,
          truePeakDbtp: study.truePeakDbtp, rmsDbfs: study.rmsDbfs,
          peakDbfs: study.peakDbfs, transientTimesSeconds: study.transientTimesSeconds,
          silenceRangesSeconds: study.silenceRangesSeconds,
        },
        declared: {
          preferredPerspective: input.input.request.userSoundPreferences.preferredPerspective,
          preserveNaturalSound: input.input.request.userSoundPreferences.preserveNaturalSound,
          evidenceLevel: 'measured_audio_plus_declared_preferences',
        },
        sourceArtifactIds: input.unit.sourceArtifacts.map((artifact) => artifact.artifactId),
      }
      const soundDna = { ...core, evidenceHash: hash(core) }
      return { soundDna, evidenceRefs: [soundDna.evidenceHash] }
    }
    return { evidenceRefs: [`sound.planning_handler.${safeKey(input.step.operationKey)}.${safeKey(input.unit.unitId)}`] }
  }

  async #admitExecutionRoute(
    input: ApprovedSoundExecutionPackage,
    route: Readonly<SoundToolRouteManifest>,
  ): Promise<SoundToolRouteBinding> {
    const runtimeStatuses = await executionRuntimeStatuses(Boolean(this.#mirelo))
    const admission = evaluateSoundToolRouteAdmission({
      routeKey: route.routeKey, routeVersion: route.routeVersion,
      capabilityKey: input.plannedResult.capabilityEntryKey,
      jobType: input.request.requestedJobType,
      mode: input.request.requiredQualificationMode === 'production' ? 'final_execution' : 'preview_execution',
      scope: input.request.assignmentScope.assignmentMode === 'whole_video'
        ? 'video' : input.request.assignmentScope.assignmentMode,
      availableInputKeys: approvedRouteInputKeys(input.request),
      availableQaKeys: [...route.stepQa, ...route.finalOutputQa, ...route.integrationQa],
      runtimeStatuses, budgetApproved: input.request.executionAuthority.creditStatus === 'reserved',
      rateCardSnapshotIds: { mirelo_sfx: SOUND_MIRELO_RATE_CARD_SNAPSHOT.rateCardSnapshotId },
      licenseEvidenceRefs: licenseEvidence(input.request),
      selectedOptionalStepKeys: input.selectedOptionalStepKeys,
    })
    if (!admission.admitted || !admission.binding) {
      throw new Error(`Sound execution route admission failed: ${admission.reasons.join(',')}`)
    }
    const invalidation = evaluateSoundRouteBindingInvalidation({ binding: admission.binding })
    if (invalidation.stale) throw new Error(`Sound route binding is stale: ${invalidation.reasons.join(',')}`)
    return admission.binding
  }

  async #measureMixEvidence(
    input: ApprovedSoundExecutionPackage,
    outcomes: UnitExecutionOutcome[],
  ): Promise<Array<{
    unitId: string
    measuredOutputPeakDbfs: number
    measuredOutputRmsDbfs: number
    measuredOutputChannelRmsDbfs: number[]
    measuredDialogueRmsDbfs?: number
    measuredSoundRmsDbfs?: number
    measuredDuckingDeltaDb?: number
  }>> {
    if (!['mix_sound_layers', 'create_sound_stem'].includes(input.request.requestedJobType)) return []
    const measurements = []
    for (const outcome of outcomes) {
      const output = outcome.studyReports.at(-1)
      if (!output) continue
      const sourceStudies: SoundAudioStudyReport[] = []
      for (const source of outcome.unit.sourceArtifacts) {
        const resolvedSource = await this.#artifacts.resolve(source)
        const outputRoot = await this.#artifacts.privateOutputRoot(input.request.executionAuthority.privateOutputScopeId!)
        const analysis = await runSoundLocalAudioExecution({
          schemaVersion: 'sound-local-audio-execution-v1',
          executionId: `sound.mix-source-study.${safeKey(outcome.unit.unitId)}.${safeKey(source.artifactId)}`,
          binding: localBinding(input, outcome.routeBinding!, outcome.unit),
          operation: 'analyze', operationProfileKey: 'sound.analyze.output.v1',
          sources: [{ artifact: source, absolutePath: resolvedSource.absolutePath }],
          approvedInputRoot: resolvedSource.approvedRoot, privateOutputRoot: outputRoot,
          parameters: {},
        })
        if (analysis.studyReport) sourceStudies.push(analysis.studyReport)
      }
      const dialogue = sourceStudies[0]
      const sound = sourceStudies.slice(1).sort((left, right) => right.rmsDbfs - left.rmsDbfs)[0]
      measurements.push({
        unitId: outcome.unit.unitId,
        measuredOutputPeakDbfs: output.peakDbfs,
        measuredOutputRmsDbfs: output.rmsDbfs,
        measuredOutputChannelRmsDbfs: output.channelRmsDbfs,
        measuredDialogueRmsDbfs: dialogue?.rmsDbfs,
        measuredSoundRmsDbfs: sound?.rmsDbfs,
        measuredDuckingDeltaDb: sound ? Number((output.rmsDbfs - sound.rmsDbfs).toFixed(3)) : undefined,
      })
    }
    return measurements
  }
}

function validateExecutionPackage(input: ApprovedSoundExecutionPackage): void {
  if (input.schemaVersion !== 'approved-sound-execution-package-v1') throw new Error('Unknown approved Sound execution package.')
  if (!input.packageId || !input.approvedWorkItemId) throw new Error('Sound execution package requires exact work identity.')
  if (input.request.executionAuthority.approvalStatus !== 'approved' ||
    !input.request.executionAuthority.approvedPlanSnapshotId ||
    !input.request.executionAuthority.approvedPlanSnapshotHash ||
    !input.request.executionAuthority.privateOutputScopeId) {
    throw new Error('Sound execution requires approved snapshot and private output authority.')
  }
  if (input.request.costPolicy.allowProviderGeneration && (
    input.request.executionAuthority.creditStatus !== 'reserved' ||
    !input.request.executionAuthority.creditReservationId ||
    !input.request.providerPolicyEvidence?.privacyApproved ||
    !input.request.providerPolicyEvidence.commercialTermsApproved ||
    !input.request.providerPolicyEvidence.retentionApproved
  )) throw new Error('Provider Sound execution requires approval, reservation, privacy, terms, and retention evidence.')
  if (input.plannedResult.requestId !== input.request.requestId ||
    input.plannedResult.soundManifestHash !== input.request.soundManifestHash ||
    input.plannedResult.sourceTimingHash !== input.request.timelineManifestHash) {
    throw new Error('Sound execution package is stale relative to its approved plan.')
  }
}

function validateOrCompileGraph(input: ApprovedSoundExecutionPackage): SoundExecutionGraph {
  const graph = input.executionGraph ?? compileCanonicalSoundExecutionGraph({
    request: input.request,
    controller: { assignment: {} as never, result: input.plannedResult, childWorkItems: [] },
  })
  if (graph.requestId !== input.request.requestId ||
    graph.manifestHash !== input.request.soundManifestHash ||
    graph.timelineManifestHash !== input.request.timelineManifestHash) {
    throw new Error('Approved Sound execution graph is stale.')
  }
  const { graphHash: _graphHash, ...core } = graph
  void _graphHash
  if (hash(core) !== graph.graphHash) throw new Error('Approved Sound execution graph hash mismatch.')
  for (const unit of graph.units) {
    const { operationSpecHash: _operationSpecHash, ...specCore } = unit.operationSpec
    void _operationSpecHash
    if (hash(specCore) !== unit.operationSpec.operationSpecHash) {
      throw new Error(`Sound operation spec hash mismatch for ${unit.unitId}.`)
    }
  }
  return graph
}

function failedUnit(unit: SoundExecutionUnit, failureCode: string): UnitExecutionOutcome {
  return {
    unit, status: 'failed', failureCode, candidateArtifacts: [], studyReports: [],
    localResults: [], providerAttempts: [], stepEvidence: [],
  }
}

function executionUnitReceipt(outcome: UnitExecutionOutcome) {
  const core = {
    unitId: outcome.unit.unitId,
    operationSpecHash: outcome.unit.operationSpec.operationSpecHash,
    routeKey: outcome.unit.route.routeKey, routeVersion: outcome.unit.route.routeVersion,
    routeHash: outcome.unit.route.routeHash, status: outcome.status,
    targetRange: outcome.unit.targetRange,
    outputArtifactIds: outcome.selectedArtifact ? [outcome.selectedArtifact.artifactId] : [],
    mutationReceiptIds: outcome.mutationReceipt ? [outcome.mutationReceipt.mutationReceiptId] : [],
    providerAttemptIds: outcome.providerAttempts.map((attempt) => attempt.attemptId),
    failureCode: outcome.failureCode,
  }
  return { ...core, receiptHash: hash(core) }
}

function createMutationReceipt(unit: SoundExecutionUnit, artifact: SoundArtifactRef): SoundMutationReceipt {
  const core = {
    mutationReceiptId: `sound-mutation.${safeKey(unit.unitId)}`,
    unitId: unit.unitId, artifactId: artifact.artifactId,
    range: structuredClone(unit.targetRange),
    sourceArtifactIds: unit.sourceArtifacts.map((source) => source.artifactId),
    sourceHashes: unit.sourceArtifacts.map((source) => source.checksumSha256),
    outputHash: artifact.checksumSha256, sourceUnchanged: true as const,
  }
  return { ...core, receiptHash: hash(core) }
}

function localOperationFromStep(operationKey: string): SoundLocalOperation | undefined {
  const operations: Record<string, SoundLocalOperation> = {
    analyze_audio_pcm: 'analyze', extract_audio_pcm: 'extract',
    trim_fade_gain_audio: 'trim_fade_gain', normalize_audio_loudness: 'normalize',
    resample_convert_channels: 'resample_channels', loop_audio_crossfade: 'loop_crossfade',
    stretch_pitch_audio: 'stretch_pitch', mix_scene_stem: 'mix_stem',
    sync_transient_qa: 'sync_qa', cleanup_dialogue_gentle: 'cleanup_gentle',
  }
  return operations[operationKey]
}

function outputArtifactType(step: SoundToolRouteStep, operation: SoundLocalOperation): string {
  if (operation === 'mix_stem') return 'private_sound_stem'
  return step.outputBindings.find((value) => /(?:asset|stem|candidate|audio)/.test(value)) ??
    'edited_audio_asset_version'
}

function localParameters(
  request: CanonicalSoundRequest,
  unit: SoundExecutionUnit,
  operation: SoundLocalOperation,
): SoundLocalOperationParameters {
  const durationSeconds = framesToSeconds(
    requiredParameterNumber(unit, 'targetDurationFrames'), request.timelineRate,
  )
  const provenanceTag = `sound:${safeKey(unit.operationSpec.operationSpecHash)}`
  const format = {
    sampleRate: request.qualityPolicy.sampleRate,
    channels: request.qualityPolicy.channelLayout === 'mono' ? 1 as const : 2 as const,
    provenanceTag,
  }
  if (operation === 'trim_fade_gain') return {
    ...format,
    trimStartSeconds: framesToSeconds(requiredParameterNumber(unit, 'trimSourceStartFrame'), request.timelineRate),
    durationSeconds,
    fadeInSeconds: framesToSeconds(requiredParameterNumber(unit, 'fadeInFrames'), request.timelineRate),
    fadeOutSeconds: framesToSeconds(requiredParameterNumber(unit, 'fadeOutFrames'), request.timelineRate),
    gainDb: requiredParameterNumber(unit, 'gainDb'),
  }
  if (operation === 'normalize') return {
    ...format, targetLoudnessLufs: request.qualityPolicy.targetLoudnessLufs,
    maximumTruePeakDbtp: request.qualityPolicy.maximumTruePeakDbtp,
  }
  if (operation === 'resample_channels') return format
  if (operation === 'loop_crossfade') return {
    ...format, durationSeconds,
    loopCrossfadeSeconds: Math.min(
      framesToSeconds(requiredParameterNumber(unit, 'loopCrossfadeFrames'), request.timelineRate),
      Math.max(0.005, durationSeconds / 4),
    ),
  }
  if (operation === 'stretch_pitch') return {
    ...format,
    tempoRatio: requiredParameterNumber(unit, 'tempoRatio'),
    pitchSemitones: requiredParameterNumber(unit, 'pitchSemitones'),
  }
  if (operation === 'mix_stem') return {
    ...format,
    inputGainDb: unit.sourceArtifacts.map((artifact, index) =>
      parameterNumber(unit, `sourceGainDb:${artifact.artifactId}`) ??
      (index === 0 ? 0 : requiredParameterNumber(unit, 'gainDb'))),
    dialogueInputIndex: Math.max(0, unit.sourceArtifacts.findIndex((artifact) =>
      artifact.artifactId === parameterString(unit, 'dialogueSourceArtifactId'))),
    dialogueDuckingDb: requiredParameterNumber(unit, 'dialogueDuckingDb'),
    duckAttackSeconds: framesToSeconds(requiredParameterNumber(unit, 'duckAttackFrames'), request.timelineRate),
    duckReleaseSeconds: framesToSeconds(requiredParameterNumber(unit, 'duckReleaseFrames'), request.timelineRate),
    outputLimiterLinear: Number((10 ** (-requiredParameterNumber(unit, 'headroomDb') / 20)).toFixed(6)),
  }
  if (operation === 'sync_qa') return {}
  return format
}

function parameterNumber(unit: SoundExecutionUnit, key: string): number | undefined {
  const value = unit.operationSpec.parameterBindings.find((binding) => binding.parameterKey === key)?.value
  return typeof value === 'number' ? value : undefined
}

function requiredParameterNumber(unit: SoundExecutionUnit, key: string): number {
  const value = parameterNumber(unit, key)
  if (value === undefined) throw new Error(`Compiled Sound operation spec is missing numeric parameter ${key}.`)
  return value
}

function parameterString(unit: SoundExecutionUnit, key: string): string | undefined {
  const value = unit.operationSpec.parameterBindings.find((binding) => binding.parameterKey === key)?.value
  return typeof value === 'string' ? value : undefined
}

function localBinding(
  input: ApprovedSoundExecutionPackage,
  routeBinding: SoundToolRouteBinding,
  unit: SoundExecutionUnit,
) {
  return {
    soundSkillVersion: input.request.soundSkillVersion,
    soundManifestHash: input.request.soundManifestHash,
    capabilityKey: input.plannedResult.capabilityEntryKey,
    approvedPlanSnapshotId: input.request.executionAuthority.approvedPlanSnapshotId!,
    approvedPlanSnapshotHash: input.request.executionAuthority.approvedPlanSnapshotHash!,
    approvedWorkItemId: input.approvedWorkItemId,
    privateOutputScopeId: input.request.executionAuthority.privateOutputScopeId!,
    idempotencyKey: `${input.request.idempotencyKey}.${safeKey(unit.unitId)}`,
    timelineRate: input.request.timelineRate,
    ...(input.request.executionAuthority.creditReservationId
      ? { creditReservationId: input.request.executionAuthority.creditReservationId } : {}),
    routeBinding,
  }
}

function approvedRouteInputKeys(request: CanonicalSoundRequest): string[] {
  return [...new Set([
    'bounded_authority', 'bounded_operation_profile', 'bounded_retime_profile',
    'sound_design_context', 'dialogue_context', 'approved_timing_manifest', 'timing_manifest',
    ...(request.sourceAudioRefs.length > 0 ? [
      'approved_source_audio', 'approved_sound_asset', 'approved_sound_layers',
      'approved_project_sound_resolution', 'approved_ambience_source_or_brief',
      'private_sound_stem', 'sound_cue_manifest', 'speech_ranges',
    ] : []),
    ...(request.referenceSoundInputs.length > 0 ? ['reference_sound_asset'] : []),
    ...(request.visualDependencies.length > 0 ? [
      'approved_visual_artifact', 'visual_event_manifest', 'versioned_visual_event',
    ] : []),
    ...(request.eventAnchors.length > 0 ? ['approved_sound_event_brief', 'sound_event_semantics'] : []),
    ...(request.musicContext ? ['read_only_music_context'] : []),
    ...(request.executionAuthority.creditReservationId ? ['credit_reservation'] : []),
    ...(request.completedSkillWork.map((item) => item.artifact.artifactType)),
  ])]
}

function licenseEvidence(request: CanonicalSoundRequest): Record<string, string> {
  return {
    ffmpeg: 'sound.license.ffmpeg_lgpl_build_verified_v1',
    ffprobe: 'sound.license.ffmpeg_lgpl_build_verified_v1',
    mirelo_sfx: request.providerPolicyEvidence?.commercialTermsApproved
      ? 'sound.license.mirelo_fixture_terms_approved_v1' : '',
  }
}

async function executionRuntimeStatuses(injectedMirelo: boolean): Promise<ToolRuntimeStatus[]> {
  const probed = await probeCanonicalSoundRuntimeStatuses()
  const byKey = new Map(probed.map((status) => [status.toolKey, status]))
  const now = new Date().toISOString()
  for (const toolKey of [
    'sound_private_artifact_store', 'sound_provider_attempt_service', 'sound_sync_service',
    'sound_qa_service', 'sound_planning_service', 'sound_no_sound_decision',
  ]) {
    const current = byKey.get(toolKey)
    if (current) byKey.set(toolKey, {
      ...current, availabilityStatus: 'available', healthProbePassed: true,
      availableConcurrency: 1, blockingReasons: [],
    })
  }
  if (injectedMirelo) {
    const current = byKey.get('mirelo_sfx')!
    byKey.set('mirelo_sfx', {
      ...current, observedAt: now, availabilityStatus: 'available', credentialsConfigured: true,
      healthProbePassed: true, availableConcurrency: 1, providerQuotaAvailable: true,
      currentRateCardSnapshotId: SOUND_MIRELO_RATE_CARD_SNAPSHOT.rateCardSnapshotId,
      lastSuccessfulCanaryEvidenceRef: 'sound.mirelo.injected_transport_fixture.v1', blockingReasons: [],
    })
  }
  return [...byKey.values()]
}

function topologicalSteps(route: Readonly<SoundToolRouteManifest>): SoundToolRouteStep[] {
  const ordered: SoundToolRouteStep[] = []
  const remaining = new Map(route.orderedOrGraphSteps.map((step) => [step.stepKey, step]))
  while (remaining.size > 0) {
    const ready = [...remaining.values()].filter((step) =>
      step.orderOrDependencies.every((dependency) => ordered.some((item) => item.stepKey === dependency)),
    )
    if (ready.length === 0) throw new Error(`Sound route ${route.routeKey} contains a dependency cycle.`)
    ready.sort((left, right) => left.stepKey.localeCompare(right.stepKey))
    for (const step of ready) {
      ordered.push(step)
      remaining.delete(step.stepKey)
    }
  }
  return ordered
}

function conditionIsFalse(
  condition: string,
  request: CanonicalSoundRequest,
  unit: SoundExecutionUnit,
  state: StepState,
): boolean {
  if (condition === 'always') return false
  if (condition === 'job_requires_trim_fade_or_gain') return !['edit_audio', 'trim_audio', 'fade_audio', 'adjust_gain'].includes(request.requestedJobType)
  if (condition === 'job_requires_normalization') return request.requestedJobType !== 'normalize_audio'
  if (condition === 'job_requires_resample_or_channels') return !['resample_audio', 'convert_audio_channels'].includes(request.requestedJobType)
  if (condition === 'job_requires_loop') return request.requestedJobType !== 'loop_audio'
  if (condition === 'provider_output_is_video_carrier') return !state.provider?.providerVisualRejected
  if (condition === 'no_approved_ambience_source') return request.requestedJobType !== 'generate_ambience'
  if (condition === 'provider_generation_succeeded') return !state.provider
  if (condition === 'approved_noise_profile_requires_rnnoise') return true
  if (condition === 'approved_high_quality_retime_profile') return true
  if (condition === 'visual_dependency_required') return !unit.visualDependencyArtifactId
  return true
}

function buildMireloPrompt(
  request: CanonicalSoundRequest,
  event: CanonicalSoundRequest['eventAnchors'][number] | undefined,
): string {
  const fields = [event?.eventType, event?.material, event?.perspective, event?.environment,
    request.userSoundPreferences.preferredPerspective].filter(Boolean)
  return `Create one isolated, speech-safe Sound effect for: ${fields.join(', ')}. No Music, voice, or dialogue.`
}

function unitEvent(request: CanonicalSoundRequest, unit: SoundExecutionUnit) {
  return request.eventAnchors.find((event) => event.anchorId === unit.cue?.eventAnchorId)
}

function commonApprovedRoot(sources: ResolvedPrivateSoundArtifact[]): string {
  const roots = new Set(sources.map((source) => source.approvedRoot))
  if (roots.size !== 1) throw new Error('Sound sources must share one approved private input root per operation.')
  return sources[0]!.approvedRoot
}

function sameArtifact(left: SoundArtifactRef, right: SoundArtifactRef): boolean {
  return left.artifactId === right.artifactId && left.version === right.version
}

function uniqueArtifacts(artifacts: SoundArtifactRef[]): SoundArtifactRef[] {
  return [...new Map(artifacts.map((artifact) => [`${artifact.artifactId}:${artifact.version}`, artifact])).values()]
}

function uniqueRanges(ranges: SoundFrameRange[]): SoundFrameRange[] {
  return [...new Map(ranges.map((range) => [
    `${range.rangeId}:${range.startFrame}:${range.endFrameExclusive}`, range,
  ])).values()].sort((left, right) => left.startFrame - right.startFrame)
}

function uniqueRouteBindings(bindings: SoundToolRouteBinding[]): SoundToolRouteBinding[] {
  return [...new Map(bindings.map((binding) => [
    `${binding.routeKey}:${binding.routeVersion}:${binding.routeHash}`, binding,
  ])).values()]
}

function safeFailureCode(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  const hint = message.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 80)
  return `operation_failed_${hint || createHash('sha256').update(message).digest('hex').slice(0, 16)}`
}

function isFatalIntegrityError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return /checksum mismatch|escapes its approved root|unsafe|overwrite|manifest binding mismatch|route binding is stale|operation spec hash mismatch|execution graph hash mismatch/i.test(message)
}

function safeKey(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 24)
}

function hash(value: unknown): string {
  return createHash('sha256').update(stableJson(value)).digest('hex')
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (value && typeof value === 'object') return `{${Object.entries(value as Record<string, unknown>)
    .filter(([, child]) => child !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, child]) => `${JSON.stringify(key)}:${stableJson(child)}`).join(',')}}`
  return JSON.stringify(value)
}
