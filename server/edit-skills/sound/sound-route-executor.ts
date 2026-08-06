import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { ToolRuntimeStatus } from '../../tool-registry'
import {
  parseCanonicalSoundResult,
  type CanonicalSoundRequest,
  type CanonicalSoundResult,
  type CompiledSoundMixRenderSpec,
  type SoundArtifactRef,
  type SoundFrameRange,
  type SoundStepOutputBundle,
} from '../../sound/sound-contracts'
import {
  runSoundLocalAudioExecution,
  measureSoundMixOutput,
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
  topologicalSoundExecutionUnits,
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
  outputBindingKeys: string[]
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
  consumedSourceArtifacts: SoundArtifactRef[]
  studyReports: SoundAudioStudyReport[]
  localResults: SoundLocalAudioExecutionResult[]
  providerAttempts: MireloProviderAttempt[]
  providerVisualRejected?: boolean
  proxy?: BoundedSoundVisualProxyResult
  placement?: SoundSynchronizationPlacement
  soundDna?: CanonicalSoundResult['soundDna']
  mutationReceipt?: SoundMutationReceipt
  outputBundles: SoundStepOutputBundle[]
  candidateProcessingReceipts: NonNullable<CanonicalSoundResult['candidateProcessingReceipts']>
  candidateSelectionRecord?: CanonicalSoundResult['candidateSelectionRecord']
  fallbackEvidence: NonNullable<CanonicalSoundResult['fallbackEvidence']>
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
  namedOutputs: Map<string, unknown>
  providerAttemptRecord?: Record<string, unknown>
  candidateProcessingReceipts: NonNullable<CanonicalSoundResult['candidateProcessingReceipts']>
  candidateSelectionRecord?: CanonicalSoundResult['candidateSelectionRecord']
}

interface StepInvocationResult {
  artifacts?: SoundArtifactRef[]
  candidateArtifacts?: SoundArtifactRef[]
  evidenceRefs: string[]
  localResult?: SoundLocalAudioExecutionResult
  localResults?: SoundLocalAudioExecutionResult[]
  provider?: MireloGenerationResult
  proxy?: BoundedSoundVisualProxyResult
  placement?: SoundSynchronizationPlacement
  soundDna?: CanonicalSoundResult['soundDna']
  mediaInspection?: Record<string, unknown>
  providerAttemptRecord?: Record<string, unknown>
  perUnitQa?: Record<string, unknown>
  callerReceiptOutput?: Record<string, unknown>
  artifactCommitRecord?: Record<string, unknown>
  provenanceRecord?: Record<string, unknown>
  noSoundDecision?: Record<string, unknown>
  explicitOutputs?: Record<string, unknown>
  candidateProcessingReceipts?: NonNullable<CanonicalSoundResult['candidateProcessingReceipts']>
  candidateSelectionRecord?: CanonicalSoundResult['candidateSelectionRecord']
}

interface StepInvocationInput {
  input: ApprovedSoundExecutionPackage
  unit: SoundExecutionUnit
  route: Readonly<SoundToolRouteManifest>
  routeBinding: SoundToolRouteBinding
  step: SoundToolRouteStep
  state: StepState
}

class SoundCandidateSetExhaustedError extends Error {
  readonly receipts: NonNullable<CanonicalSoundResult['candidateProcessingReceipts']>

  constructor(stepKey: string, receipts: NonNullable<CanonicalSoundResult['candidateProcessingReceipts']>) {
    super(`all_candidates_failed_${safeKey(stepKey)}`)
    this.name = 'SoundCandidateSetExhaustedError'
    this.receipts = receipts
  }
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
    const outcomeByUnit = new Map<string, UnitExecutionOutcome>()
    const topologicalUnits = topologicalSoundExecutionUnits(graph)
    for (const unit of topologicalUnits) {
      const dependencies = unit.dependsOnUnitIds.map((unitId) => outcomeByUnit.get(unitId)!)
      const blocked = dependencies.find((dependency) =>
        dependency.status === 'failed' || dependency.status === 'blocked' || dependency.status === 'planning_only')
      let outcome = blocked
        ? blockedDependencyUnit(unit, blocked.unit.unitId)
        : await this.#executeUnit(
            input,
            unit,
            uniqueArtifacts(dependencies.flatMap((dependency) =>
              dependency.selectedArtifact ? [dependency.selectedArtifact] : [])),
          )
      if (outcome.status === 'failed') {
        outcome = await this.#applyDeclaredFallback(input, unit, outcome)
      }
      outcomes.push(outcome)
      outcomeByUnit.set(unit.unitId, outcome)
    }

    const continuity = analyzeWholeVideoSoundContinuity({
      reportId: `sound.continuity.${input.packageId}`,
      timelineRate: input.request.timelineRate,
      scenes: input.continuitySceneEvidence,
      cues: input.plannedResult.cueManifest.cues,
      maximumCueDensityPerMinute: input.request.userSoundPreferences.maximumCueDensityPerMinute,
    })
    const selected = outcomes.flatMap((item) => item.selectedArtifact ? [item.selectedArtifact] : [])
    const terminalSelected = outcomes.flatMap((item) =>
      item.selectedArtifact && (item.unit.unitKind === 'qa_handoff' ||
        (!outcomes.some((candidate) => candidate.unit.dependsOnUnitIds.includes(item.unit.unitId))))
        ? [item.selectedArtifact] : [])
    const studies = outcomes.flatMap((item) => item.studyReports)
    const localResults = outcomes.flatMap((item) => item.localResults)
    const providerAttempts = outcomes.flatMap((item) => item.providerAttempts)
    const placements = outcomes.flatMap((item) => item.placement ? [item.placement] : [])
    const mutationReceipts = outcomes.flatMap((item) => item.mutationReceipt ? [item.mutationReceipt] : [])
    const mixMeasurements = await this.#measureMixEvidence(input, outcomes)
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
      mixMeasurements,
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
    const mixRenderSpecifications = outcomes
      .filter((outcome) => outcome.unit.unitKind === 'mix_stem' &&
        outcome.status === 'completed' && Boolean(outcome.selectedArtifact))
      .map((outcome) => compileSoundMixRenderSpec(outcome, input.request))
    const musicTechnicalAutomationReceipt = createMusicTechnicalAutomationReceipt({
      request: input.request,
      outcomes,
      stepEvidence,
      mixRenderSpecifications,
      mixMeasurements,
      qa,
    })
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
      mixRenderSpecifications,
      musicTechnicalAutomationReceipt,
      candidateProcessingReceipts: outcomes.flatMap((outcome) => outcome.candidateProcessingReceipts),
      candidateSelectionRecord: outcomes.find((outcome) => outcome.candidateSelectionRecord)?.candidateSelectionRecord,
      fallbackEvidence: outcomes.flatMap((outcome) => outcome.fallbackEvidence),
      synchronizationPlacements: placements,
      executionUnits: outcomes.map((outcome) => executionUnitReceipt(outcome)),
      mutationReceipts,
      qaReport: { ...qa, continuityReport: continuity },
      candidateAssetVersions: candidateArtifacts,
      selectedAssetVersions: uniqueArtifacts(terminalSelected.length > 0 ? terminalSelected : selected),
      privateSoundStemArtifacts: uniqueArtifacts(outcomes.flatMap((outcome) =>
        outcome.unit.unitKind === 'mix_stem' && outcome.selectedArtifact ? [outcome.selectedArtifact] : [])),
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
        stepOutputBundles: outcomes.flatMap((outcome) => outcome.outputBundles),
        stepEvidence,
      },
      finalCompositionHandoff: status === 'completed' || status === 'no_sound' ? {
        handoffId: `sound.handoff.${safeKey(input.packageId)}`,
        soundArtifactIds: uniqueArtifacts(terminalSelected).map((artifact) => artifact.artifactId),
        finalSoundArtifactReferences: uniqueArtifacts(terminalSelected),
        intentionalNoSound: noSound,
        authorizedRanges: uniqueRanges(input.request.assignmentScope.authorizedAudioWriteRanges),
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
    inheritedArtifacts: SoundArtifactRef[] = [],
  ): Promise<UnitExecutionOutcome> {
    if (unit.unitKind === 'planning_only') {
      return {
        unit, status: 'planning_only', failureCode: 'planning_qualified_no_execution_route',
        candidateArtifacts: [], consumedSourceArtifacts: [], studyReports: [], localResults: [], providerAttempts: [],
        candidateProcessingReceipts: [], fallbackEvidence: [], outputBundles: [], stepEvidence: [],
      }
    }
    const route = getSoundToolRouteManifest(unit.route.routeKey, unit.route.routeVersion)
    if (!route || route.routeHash !== unit.route.routeHash) {
      return failedUnit(unit, 'route_identity_unavailable_or_stale')
    }
    let routeBinding: SoundToolRouteBinding
    try {
      routeBinding = await this.#admitExecutionRoute(input, route, unit)
    } catch {
      return failedUnit(unit, 'route_admission_failed')
    }
    const state: StepState = {
      currentArtifacts: uniqueArtifacts([...structuredClone(unit.sourceArtifacts), ...inheritedArtifacts]),
      candidateArtifacts: [], studies: [], localResults: [],
      namedOutputs: new Map([...new Set([
        ...approvedRouteInputKeys(input.request), ...route.requiredInputs,
      ])].map((key) => [key, { approved: true }])),
      candidateProcessingReceipts: [],
    }
    const consumedSourceArtifacts = structuredClone(state.currentArtifacts)
    const evidence: SoundRouteStepExecutionEvidence[] = []
    const outputBundles: SoundStepOutputBundle[] = []
    const statuses = new Map<string, SoundRouteStepExecutionEvidence['status']>()
    for (const step of topologicalSteps(route)) {
      const missingInputs = step.inputBindings.filter((binding) => !state.namedOutputs.has(binding))
      if (missingInputs.length > 0) {
        throw new Error(`Sound step ${route.routeKey}:${step.stepKey} is missing named inputs ${missingInputs.join(',')}.`)
      }
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
          ], outputArtifactHashes: [], outputBindingKeys: [], operationSpecHash: unit.operationSpec.operationSpecHash,
        })
        continue
      }
      const startedAt = new Date().toISOString()
      const started = performance.now()
      try {
        const invoked = await this.#invokeStep({ input, unit, route, routeBinding, step, state })
        const outputBundle = createAndValidateStepOutputBundle({ unit, step, invoked, state })
        outputBundles.push(outputBundle)
        for (const [key, value] of Object.entries(outputBundle.outputsByBinding)) state.namedOutputs.set(key, value)
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
        if (invoked.candidateArtifacts) state.candidateArtifacts.push(...invoked.candidateArtifacts)
        if (invoked.proxy) state.proxy = invoked.proxy
        if (invoked.placement) state.placement = invoked.placement
        if (invoked.soundDna) state.soundDna = invoked.soundDna
        if (invoked.providerAttemptRecord) state.providerAttemptRecord = invoked.providerAttemptRecord
        if (invoked.candidateProcessingReceipts) state.candidateProcessingReceipts.push(...invoked.candidateProcessingReceipts)
        if (invoked.candidateSelectionRecord) {
          state.candidateSelectionRecord = invoked.candidateSelectionRecord
          state.candidateArtifacts = uniqueArtifacts(invoked.candidateArtifacts ?? [])
        }
        const receiptCore = {
          unitId: unit.unitId, stepKey: step.stepKey, toolKey: step.toolKey,
          operationKey: step.operationKey, operationProfileKey: step.operationProfileKey,
          operationSpecHash: unit.operationSpec.operationSpecHash,
          startedAt, completedAt, elapsedMilliseconds,
          outputArtifactHashes: (invoked.artifacts ?? []).map((artifact) => artifact.checksumSha256),
          outputBindingKeys: outputBundle.declaredOutputBindings,
          evidenceRefs: [...invoked.evidenceRefs, outputBundle.bundleHash],
        }
        statuses.set(step.stepKey, 'completed')
        evidence.push({
          unitId: unit.unitId, stepKey: step.stepKey, toolKey: step.toolKey,
          operationKey: step.operationKey, status: 'completed', startedAt, completedAt,
          elapsedMilliseconds,
          outputArtifactIds: (invoked.artifacts ?? []).map((artifact) => artifact.artifactId),
          outputArtifactHashes: (invoked.artifacts ?? []).map((artifact) => artifact.checksumSha256),
          outputBindingKeys: outputBundle.declaredOutputBindings,
          evidenceRefs: [...invoked.evidenceRefs, outputBundle.bundleHash],
          operationSpecHash: unit.operationSpec.operationSpecHash,
          operationReceiptHash: hash(receiptCore),
        })
      } catch (error) {
        if (isFatalIntegrityError(error)) throw error
        if (error instanceof SoundCandidateSetExhaustedError) {
          state.candidateProcessingReceipts.push(...error.receipts)
        }
        const completedAt = new Date().toISOString()
        const failureCode = safeFailureCode(error)
        statuses.set(step.stepKey, 'failed')
        evidence.push({
          unitId: unit.unitId, stepKey: step.stepKey, toolKey: step.toolKey,
          operationKey: step.operationKey, status: 'failed', startedAt, completedAt,
          elapsedMilliseconds: Math.round(performance.now() - started), outputArtifactIds: [],
          outputArtifactHashes: [], evidenceRefs: ['sound.operation_failed'], operationSpecHash: unit.operationSpec.operationSpecHash,
          outputBindingKeys: [],
          failureCode,
        })
        if (step.failureBehavior !== 'continue_without_optional_step') {
          return {
            unit, routeBinding, status: 'failed', failureCode,
            selectedArtifact: state.currentArtifacts.find((artifact) =>
              !unit.sourceArtifacts.some((source) => sameArtifact(source, artifact))),
            candidateArtifacts: uniqueArtifacts(state.candidateArtifacts), consumedSourceArtifacts,
            studyReports: state.studies, localResults: state.localResults,
            providerAttempts: state.provider ? [state.provider.attempt] : [],
            providerVisualRejected: state.provider?.providerVisualRejected,
            proxy: state.proxy, placement: state.placement, soundDna: state.soundDna,
            candidateProcessingReceipts: state.candidateProcessingReceipts,
            candidateSelectionRecord: state.candidateSelectionRecord,
            fallbackEvidence: [], outputBundles, stepEvidence: evidence,
          }
        }
      }
    }
    const selectedArtifact = ['qa_handoff', 'analysis', 'synchronization'].includes(unit.unitKind)
      ? state.currentArtifacts.at(-1)
      : state.currentArtifacts.find((artifact) =>
          !consumedSourceArtifacts.some((source) => sameArtifact(source, artifact)))
    const noSound = route.routeRole === 'no_sound'
    const mutationReceipt = selectedArtifact && ['audio_operation', 'provider_generation', 'mix_stem'].includes(unit.unitKind)
      ? createMutationReceipt(unit, selectedArtifact) : undefined
    return {
      unit, routeBinding, status: noSound ? 'no_sound' : 'completed',
      selectedArtifact, candidateArtifacts: uniqueArtifacts(state.candidateArtifacts), consumedSourceArtifacts,
      studyReports: state.studies, localResults: state.localResults,
      providerAttempts: state.provider ? [state.provider.attempt] : [],
      providerVisualRejected: state.provider?.providerVisualRejected,
      proxy: state.proxy, placement: state.placement, soundDna: state.soundDna,
      mutationReceipt,
      candidateProcessingReceipts: state.candidateProcessingReceipts,
      candidateSelectionRecord: state.candidateSelectionRecord,
      fallbackEvidence: [], outputBundles, stepEvidence: evidence,
    }
  }

  async #applyDeclaredFallback(
    input: ApprovedSoundExecutionPackage,
    unit: SoundExecutionUnit,
    failed: UnitExecutionOutcome,
  ): Promise<UnitExecutionOutcome> {
    const failedRoute = getSoundToolRouteManifest(unit.route.routeKey, unit.route.routeVersion)
    const fallbackRef = failedRoute?.fallbackPolicy.fallbackRouteRefs[0]
    const unknownOutcome = /unknown|timeout|reconcil/i.test(failed.failureCode ?? '')
    const candidateSetExhausted = /all_candidates_failed/i.test(failed.failureCode ?? '')
    const fallbackDecision = candidateSetExhausted || !failedRoute?.fallbackPolicy.automaticFallbackAllowed || !fallbackRef
      ? 'blocked' as const
      : unknownOutcome ? 'blocked' as const
        : fallbackRef.routeKey === 'sound.route.no_sound.v1' ? 'no_sound' as const
          : 'use_declared_fallback' as const
    const evidenceCore = {
      fallbackEvidenceId: `sound-fallback.${safeKey(unit.unitId)}.${safeKey(failed.failureCode ?? 'failed')}`,
      unitId: unit.unitId,
      failedRouteKey: unit.route.routeKey,
      failedRouteVersion: unit.route.routeVersion,
      failureCode: failed.failureCode ?? 'sound_unit_failed',
      decision: fallbackDecision,
      ...(fallbackDecision !== 'blocked' && fallbackRef ? {
        selectedFallbackRouteKey: fallbackRef.routeKey,
        selectedFallbackRouteVersion: fallbackRef.routeVersion,
      } : {}),
      freshApprovalRequired: fallbackDecision === 'use_declared_fallback',
      reconciliationCompleted: !unknownOutcome,
    }
    const fallbackEvidence = { ...evidenceCore, evidenceHash: hash(evidenceCore) }
    if (fallbackDecision === 'blocked' || !fallbackRef) {
      return { ...failed, fallbackEvidence: [fallbackEvidence] }
    }
    if (fallbackDecision === 'use_declared_fallback') {
      // A non-zero or materially different fallback requires a newly approved
      // execution package. This standalone executor never expands approval.
      return { ...failed, fallbackEvidence: [fallbackEvidence] }
    }
    const fallbackRoute = getSoundToolRouteManifest(fallbackRef.routeKey, fallbackRef.routeVersion)
    if (!fallbackRoute) throw new Error('Declared Sound fallback route disappeared after publication.')
    const fallbackUnit: SoundExecutionUnit = {
      ...unit,
      route: {
        routeKey: fallbackRoute.routeKey,
        routeVersion: fallbackRoute.routeVersion,
        routeHash: fallbackRoute.routeHash,
      },
      unitKind: 'no_sound',
    }
    const fallback = await this.#executeUnit(input, fallbackUnit)
    return {
      ...fallback,
      stepEvidence: [...failed.stepEvidence, ...fallback.stepEvidence],
      outputBundles: [...failed.outputBundles, ...fallback.outputBundles],
      fallbackEvidence: [fallbackEvidence, ...fallback.fallbackEvidence],
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
      const providerAttemptRecord = {
        schemaVersion: 'sound-provider-attempt-record-v1',
        attemptId: `${input.input.request.attemptId}.${safeKey(input.unit.unitId)}`,
        unitId: input.unit.unitId,
        routeKey: input.route.routeKey,
        routeVersion: input.route.routeVersion,
        idempotencyKeyHash: hash(`${input.input.request.idempotencyKey}.${input.unit.unitId}`),
        lifecycleStatus: input.state.provider?.attempt.status ?? 'preflight_recorded',
        reconciliationRequired: input.state.provider?.attempt.status === 'unknown',
        blindResubmissionAllowed: false,
        providerAttemptHash: hash({
          attemptId: `${input.input.request.attemptId}.${safeKey(input.unit.unitId)}`,
          routeHash: input.route.routeHash,
          operationSpecHash: input.unit.operationSpec.operationSpecHash,
        }),
      }
      return {
        providerAttemptRecord,
        evidenceRefs: [`sound.provider_attempt_record.${providerAttemptRecord.providerAttemptHash}`],
      }
    }
    if (handler === 'output_qa') {
      if (input.state.currentArtifacts.length === 0 && input.unit.unitKind !== 'synchronization') {
        throw new Error('Sound QA handler received no real artifact evidence.')
      }
      const latestStudy = input.state.studies.at(-1)
      const perUnitQa = {
        schemaVersion: 'sound-per-unit-qa-v1',
        unitId: input.unit.unitId,
        artifactIds: input.state.currentArtifacts.map((artifact) => artifact.artifactId),
        decodedEvidenceHash: latestStudy ? hash(latestStudy) : undefined,
        synchronizationPlacementHash: input.state.placement?.placementManifestHash,
        technicalStatus: latestStudy || input.state.placement ? 'measured' : 'not_measured',
        sourceAuthorityHash: input.input.request.assignmentScope.parentAuthorityHash,
        qaReceiptHash: hash({
          unitId: input.unit.unitId,
          artifacts: input.state.currentArtifacts.map((artifact) => artifact.checksumSha256),
          study: latestStudy ? hash(latestStudy) : undefined,
          placement: input.state.placement?.placementManifestHash,
        }),
      }
      const callerReceiptOutput = createCallerReceiptOutput(input)
      return {
        perUnitQa,
        callerReceiptOutput,
        evidenceRefs: [
          `sound.per_unit_qa.${perUnitQa.qaReceiptHash}`,
          `sound.caller_receipt.${callerReceiptOutput.receiptHash}`,
        ],
      }
    }
    if (handler === 'planning_receipt') return this.#planningStep(input)
    if (handler === 'no_sound_decision') {
      const noSoundDecision = {
        schemaVersion: 'sound-no-sound-decision-v1',
        unitId: input.unit.unitId,
        authorizedRange: input.unit.targetRange,
        intentional: true,
        reason: input.unit.cue?.storyReason ?? 'No qualified or narratively justified Sound mutation is required.',
        decisionHash: hash({ unitId: input.unit.unitId, range: input.unit.targetRange }),
      }
      const callerReceiptOutput = createCallerReceiptOutput(input)
      return {
        noSoundDecision,
        callerReceiptOutput,
        evidenceRefs: [
          `sound.no_sound.decision.${noSoundDecision.decisionHash}`,
          `sound.caller_receipt.${callerReceiptOutput.receiptHash}`,
        ],
      }
    }
    throw new Error(`No qualified Sound operation handler is registered for ${step.toolKey}:${step.operationKey}.`)
  }

  async #inspectStep(input: StepInvocationInput): Promise<StepInvocationResult> {
    const artifact = input.state.currentArtifacts.at(-1) ?? input.unit.sourceArtifacts[0]
    if (!artifact) throw new Error('Sound inspection step has no approved artifact.')
    const resolved = await this.#artifacts.resolve(artifact)
    const media = await validateSoundAudioFile(resolved.absolutePath)
    return {
      artifacts: [artifact],
      mediaInspection: { ...media, artifactId: artifact.artifactId, inspectionHash: hash(media) },
      evidenceRefs: [`sound.ffprobe.${hash(media)}`],
    }
  }

  async #localAudioStep(input: StepInvocationInput): Promise<StepInvocationResult> {
    const operation = localOperationFromStep(input.step.operationKey)
    if (!operation) throw new Error(`Unsupported FFmpeg Sound operation ${input.step.operationKey}.`)
    const candidateSelectionPending = Boolean(input.state.provider) && !input.state.candidateSelectionRecord
    if (operation !== 'mix_stem' && (input.state.currentArtifacts.length > 1 || candidateSelectionPending)) {
      return this.#processCandidateBranches(input, operation)
    }
    const sourceArtifacts = operation === 'mix_stem'
      ? input.state.currentArtifacts
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

  async #processCandidateBranches(
    input: StepInvocationInput,
    operation: SoundLocalOperation,
  ): Promise<StepInvocationResult> {
    const outputRoot = await this.#artifacts.privateOutputRoot(input.input.request.executionAuthority.privateOutputScopeId!)
    const results: SoundLocalAudioExecutionResult[] = []
    const successfulArtifacts: SoundArtifactRef[] = []
    const rejectedCandidates: NonNullable<CanonicalSoundResult['candidateProcessingReceipts']> = []
    for (const [index, artifact] of input.state.currentArtifacts.entries()) {
      try {
        const source = await this.#artifacts.resolve(artifact)
        const result = await runSoundLocalAudioExecution({
          schemaVersion: 'sound-local-audio-execution-v1',
          executionId: `sound.candidate-process.${safeKey(input.unit.unitId)}.${safeKey(input.step.stepKey)}.${index}`,
          binding: localBinding(input.input, input.routeBinding, input.unit),
          operation, operationProfileKey: input.step.operationProfileKey,
          sources: [{ artifact, absolutePath: source.absolutePath }],
          approvedInputRoot: source.approvedRoot, privateOutputRoot: outputRoot,
          ...(operation === 'analyze' || operation === 'sync_qa' ? {} : {
            outputRelativePath: `sound/${safeKey(input.input.request.idempotencyKey)}/${safeKey(input.unit.unitId)}/${safeKey(input.step.stepKey)}-candidate-${index}.wav`,
            outputArtifactId: `sound-output-${safeKey(input.unit.unitId)}-${safeKey(input.step.stepKey)}-${index}`,
            outputArtifactType: outputArtifactType(input.step, operation),
            outputContentType: 'audio/wav' as const,
          }),
          parameters: localParameters(input.input.request, input.unit, operation),
        })
        results.push(result)
        successfulArtifacts.push(result.outputArtifact ?? artifact)
      } catch (error) {
        if (isFatalIntegrityError(error)) throw error
        const failureCode = safeFailureCode(error)
        const core = {
          receiptId: `sound-candidate-processing.${safeKey(input.unit.unitId)}.${safeKey(input.step.stepKey)}.${index}.rejected`,
          unitId: input.unit.unitId,
          candidateArtifactId: artifact.artifactId,
          processedArtifactIds: [artifact.artifactId],
          studyEvidenceHash: hash({ status: 'decode_or_processing_failed', failureCode }),
          qaEvidenceHash: hash({
            status: 'rejected', failureCode, routeHash: input.route.routeHash,
            stepKey: input.step.stepKey,
          }),
          eligibleForSelection: false,
        }
        rejectedCandidates.push({ ...core, receiptHash: hash(core) })
      }
    }
    if (successfulArtifacts.length === 0) {
      throw new SoundCandidateSetExhaustedError(input.step.stepKey, rejectedCandidates)
    }
    const processedArtifacts = operation === 'analyze' || operation === 'sync_qa'
      ? successfulArtifacts
      : successfulArtifacts
    if (operation !== 'analyze') {
      return {
        artifacts: processedArtifacts,
        localResults: results,
        evidenceRefs: results.map((result) => `sound.candidate_branch.${safeKey(result.executionId)}`),
        candidateProcessingReceipts: rejectedCandidates,
      }
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
    const selected = successfulArtifacts[selectedIndex]!
    const finalCandidateAnalysis = /analyze_(?:trimmed_)?candidate|analyze_trimmed|analyze_output|analyze_ambience/.test(input.step.stepKey)
    if (!finalCandidateAnalysis) {
      return {
        artifacts: successfulArtifacts,
        localResults: results,
        candidateProcessingReceipts: rejectedCandidates,
        evidenceRefs: [hash({
          policy: 'sound.candidate_parallel_analysis_v1',
          candidates: successfulArtifacts.map((artifact) => artifact.artifactId),
        })],
      }
    }
    const candidateProcessingReceipts = successfulArtifacts.map((artifact, index) => {
      const studyEvidenceHash = hash(results[index]!.studyReport)
      const core = {
        receiptId: `sound-candidate-processing.${safeKey(input.unit.unitId)}.${index}`,
        unitId: input.unit.unitId,
        candidateArtifactId: artifact.artifactId,
        processedArtifactIds: [artifact.artifactId],
        studyEvidenceHash,
        qaEvidenceHash: hash({
          clippingSampleCount: results[index]!.studyReport?.clippingSampleCount,
          peakDbfs: results[index]!.studyReport?.peakDbfs,
          routeHash: input.route.routeHash,
        }),
        eligibleForSelection: results[index]!.studyReport?.clippingSampleCount === 0,
      }
      return { ...core, receiptHash: hash(core) }
    })
    const selectionCore = {
      recordId: `sound-candidate-selection.${safeKey(input.unit.unitId)}`,
      unitId: input.unit.unitId,
      candidateArtifactIds: uniqueStrings([
        ...input.state.candidateProcessingReceipts.map((receipt) => receipt.candidateArtifactId),
        ...rejectedCandidates.map((receipt) => receipt.candidateArtifactId),
        ...successfulArtifacts.map((artifact) => artifact.artifactId),
      ]),
      selectedArtifactId: selected.artifactId,
      selectionPolicyKey: 'sound.candidate_ranking.technical_v1',
    }
    const candidateSelectionRecord = { ...selectionCore, recordHash: hash(selectionCore) }
    return {
      artifacts: [selected], localResults: results,
      candidateArtifacts: input.state.currentArtifacts,
      candidateProcessingReceipts: [...rejectedCandidates, ...candidateProcessingReceipts],
      candidateSelectionRecord,
      evidenceRefs: [hash({
        policy: 'sound.candidate_ranking.technical_v1',
        candidates: successfulArtifacts.map((artifact, index) => ({
          artifactId: artifact.artifactId, score: ranked.find((item) => item.index === index)!.score,
        })),
        rejectedCandidateIds: [
          ...input.state.candidateProcessingReceipts.filter((receipt) => !receipt.eligibleForSelection)
            .map((receipt) => receipt.candidateArtifactId),
          ...rejectedCandidates.map((receipt) => receipt.candidateArtifactId),
        ],
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
    if (input.step.operationKey === 'create_timed_sound_cue') {
      const timedCue = input.unit.cue ?? {
        cueId: `sound-cue.${safeKey(input.unit.unitId)}`,
        startFrame: input.unit.targetRange.startFrame,
        endFrameExclusive: input.unit.targetRange.endFrameExclusive,
        timelineRate: input.input.request.timelineRate,
        source: 'approved_target_range',
      }
      return {
        explicitOutputs: { sound_cue_manifest: timedCue },
        evidenceRefs: [`sound.timed_cue.${hash(timedCue)}`],
      }
    }
    if (input.step.operationKey === 'create_speech_safe_mix_automation') {
      const automation = input.unit.automation ?? {
        unitId: input.unit.unitId,
        targetRange: input.unit.targetRange,
        timelineRate: input.input.request.timelineRate,
        automationStatus: 'bounded_defaults_applied',
      }
      return {
        explicitOutputs: { mix_automation_manifest: automation },
        evidenceRefs: [`sound.automation.${hash(automation)}`],
      }
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
    const candidateIngest = input.step.operationKey === 'ingest_untrusted_provider_output'
    const resolved: ResolvedPrivateSoundArtifact[] = []
    const rejectedCandidates: NonNullable<CanonicalSoundResult['candidateProcessingReceipts']> = []
    for (const [index, artifact] of artifacts.entries()) {
      try {
        resolved.push(await this.#artifacts.resolve(artifact))
      } catch (error) {
        if (!candidateIngest || isFatalIntegrityError(error)) throw error
        const failureCode = safeFailureCode(error)
        const core = {
          receiptId: `sound-candidate-processing.${safeKey(input.unit.unitId)}.${safeKey(input.step.stepKey)}.${index}.rejected`,
          unitId: input.unit.unitId,
          candidateArtifactId: artifact.artifactId,
          processedArtifactIds: [artifact.artifactId],
          studyEvidenceHash: hash({ status: 'provider_candidate_ingest_failed', failureCode }),
          qaEvidenceHash: hash({
            status: 'rejected', failureCode, routeHash: input.route.routeHash,
            stepKey: input.step.stepKey,
          }),
          eligibleForSelection: false,
        }
        rejectedCandidates.push({ ...core, receiptHash: hash(core) })
      }
    }
    if (resolved.length === 0) {
      throw new SoundCandidateSetExhaustedError(input.step.stepKey, rejectedCandidates)
    }
    const verifiedArtifacts = resolved.map(({ artifact }) => artifact)
    const artifactCommitRecord = {
      schemaVersion: 'sound-artifact-commit-record-v1',
      unitId: input.unit.unitId,
      operationSpecHash: input.unit.operationSpec.operationSpecHash,
      artifacts: resolved.map(({ artifact }) => ({
        artifactId: artifact.artifactId, version: artifact.version,
        checksumSha256: artifact.checksumSha256, storageObjectId: artifact.storageObjectId,
        private: artifact.private,
      })),
      verifiedExistingOrCreated: true,
      sourceOverwritePerformed: false,
    }
    const provenanceRecord = {
      schemaVersion: 'sound-provenance-record-v1',
      unitId: input.unit.unitId,
      routeKey: input.route.routeKey,
      routeVersion: input.route.routeVersion,
      sourceArtifactIds: input.unit.sourceArtifacts.map((artifact) => artifact.artifactId),
      outputArtifactIds: verifiedArtifacts.map((artifact) => artifact.artifactId),
      providerAttemptId: input.state.provider?.attempt.attemptId,
      durableProviderUrlStored: false,
      provenanceHash: hash({
        routeHash: input.route.routeHash,
        operationSpecHash: input.unit.operationSpec.operationSpecHash,
        outputHashes: verifiedArtifacts.map((artifact) => artifact.checksumSha256),
      }),
    }
    return {
      artifacts: verifiedArtifacts,
      artifactCommitRecord,
      provenanceRecord,
      candidateProcessingReceipts: rejectedCandidates,
      evidenceRefs: [
        ...verifiedArtifacts.map((artifact) => `sound.private_artifact.${artifact.checksumSha256}`),
        `sound.provenance.${provenanceRecord.provenanceHash}`,
      ],
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
    const callerReceiptOutput = createCallerReceiptOutput(input)
    return {
      callerReceiptOutput,
      evidenceRefs: [`sound.caller_receipt.${callerReceiptOutput.receiptHash}`],
    }
  }

  async #admitExecutionRoute(
    input: ApprovedSoundExecutionPackage,
    route: Readonly<SoundToolRouteManifest>,
    unit: SoundExecutionUnit,
  ): Promise<SoundToolRouteBinding> {
    const runtimeStatuses = await executionRuntimeStatuses(Boolean(this.#mirelo))
    const admission = evaluateSoundToolRouteAdmission({
      routeKey: route.routeKey, routeVersion: route.routeVersion,
      capabilityKey: unit.capabilityKey,
      jobType: unit.routeJobType,
      mode: input.request.requiredQualificationMode === 'production' ? 'final_execution' : 'preview_execution',
      scope: input.executionGraph?.compositeExecutionPolicy
        ? 'range'
        : input.request.assignmentScope.assignmentMode === 'whole_video'
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
    measuredDuckingDb?: number
    duckEnvelopeMeasurements: Array<{
      mode: 'range_envelope'
      startSeconds: number
      endSeconds: number
      attackSeconds: number
      releaseSeconds: number
      effectiveAttackSeconds: number
      effectiveReleaseSeconds: number
      attackSampleCount: number
      releaseSampleCount: number
      requestedDuckingDb: number
      preAttackBaselineRmsDbfs: number
      attackEarlyRmsDbfs: number
      attackLateRmsDbfs: number
      holdRmsDbfs: number
      releaseEarlyRmsDbfs: number
      releaseLateRmsDbfs: number
      postReleaseBaselineRmsDbfs: number
      measuredAttackDeltaDb: number
      measuredReleaseDeltaDb: number
      measuredHoldAttenuationDb: number
      measuredPostReleaseDeltaDb: number
      attackRampPresent: boolean
      releaseRampPresent: boolean
      returnedToBaseline: boolean
    }>
    protectedRanges: SoundFrameRange[]
    expectedPanDirection: 'left' | 'center' | 'right'
    measuredChannelDeltaDb: number
    gainEnvelopeMeasurements: Array<{
      timeSeconds: number
      expectedGainDb: number
      measuredRmsDbfs: number
    }>
    fadeMeasurements: {
      leadingRmsDbfs: number
      centerRmsDbfs: number
      trailingRmsDbfs: number
    }
  }>> {
    if (!outcomes.some((outcome) => outcome.unit.unitKind === 'mix_stem')) return []
    const measurements = []
    for (const outcome of outcomes) {
      if (outcome.unit.unitKind !== 'mix_stem') continue
      const output = outcome.studyReports.at(-1)
      if (!output) continue
      const sourceStudies: SoundAudioStudyReport[] = []
      for (const source of outcome.consumedSourceArtifacts) {
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
      const automation = outcome.unit.automation
      const selected = outcome.selectedArtifact
      if (!selected) continue
      const resolvedOutput = await this.#artifacts.resolve(selected)
      const windowMeasurements = await measureSoundMixOutput({
        absolutePath: resolvedOutput.absolutePath,
        protectedSpeechWindows: (automation?.protectedSpeechRanges ?? []).map((range) => ({
          startSeconds: framesToSeconds(
            Math.max(0, range.startFrame - outcome.unit.targetRange.startFrame), input.request.timelineRate,
          ),
          endSeconds: framesToSeconds(
            Math.max(0, Math.min(outcome.unit.targetRange.endFrameExclusive, range.endFrameExclusive) -
              outcome.unit.targetRange.startFrame),
            input.request.timelineRate,
          ),
        })).filter((window) => window.endSeconds > window.startSeconds),
        gainEnvelope: (automation?.gainEnvelope ?? []).map((point) => ({
          timeSeconds: framesToSeconds(
            Math.max(0, point.frame - outcome.unit.targetRange.startFrame), input.request.timelineRate,
          ),
          gainDb: point.gainDb,
        })),
        pan: automation?.pan ?? 0,
        duckAttackSeconds: automation
          ? framesToSeconds(automation.duckAttackFrames, input.request.timelineRate)
          : undefined,
        duckReleaseSeconds: automation
          ? framesToSeconds(automation.duckReleaseFrames, input.request.timelineRate)
          : undefined,
        dialogueDuckingDb: automation?.dialogueDuckingDb,
      })
      measurements.push({
        unitId: outcome.unit.unitId,
        measuredOutputPeakDbfs: output.peakDbfs,
        measuredOutputRmsDbfs: output.rmsDbfs,
        measuredOutputChannelRmsDbfs: output.channelRmsDbfs,
        measuredDialogueRmsDbfs: dialogue?.rmsDbfs,
        measuredSoundRmsDbfs: sound?.rmsDbfs,
        measuredDuckingDeltaDb: sound ? Number((output.rmsDbfs - sound.rmsDbfs).toFixed(3)) : undefined,
        measuredDuckingDb: windowMeasurements.protectedRangeMeasurements.length > 0
          ? Math.max(...windowMeasurements.protectedRangeMeasurements.map((measurement) =>
            measurement.measuredDuckingDb))
          : undefined,
        duckEnvelopeMeasurements: windowMeasurements.duckEnvelopeMeasurements,
        protectedRanges: structuredClone(automation?.protectedSpeechRanges ?? []),
        expectedPanDirection: windowMeasurements.expectedPanDirection,
        measuredChannelDeltaDb: windowMeasurements.measuredChannelDeltaDb,
        gainEnvelopeMeasurements: windowMeasurements.gainEnvelopeMeasurements,
        fadeMeasurements: windowMeasurements.fadeMeasurements,
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

function createAndValidateStepOutputBundle(input: {
  unit: SoundExecutionUnit
  step: SoundToolRouteStep
  invoked: StepInvocationResult
  state: StepState
}): SoundStepOutputBundle {
  const outputsByBinding: Record<string, unknown> = {}
  const artifacts = uniqueArtifacts(input.invoked.artifacts ?? [])
  const latestStudy = input.invoked.localResult?.studyReport ??
    input.invoked.localResults?.at(-1)?.studyReport ?? input.state.studies.at(-1)
  const candidateArtifacts = input.invoked.provider?.outputArtifacts ?? artifacts
  for (const outputBinding of input.step.outputBindings) {
    const explicit = input.invoked.explicitOutputs?.[outputBinding]
    const value = explicit ?? (() => {
      if (outputBinding === 'validated_audio_metadata' || outputBinding === 'validated_provider_carrier') {
        return input.invoked.mediaInspection
      }
      if (outputBinding === 'provider_attempt_evidence') {
        return input.invoked.providerAttemptRecord ?? input.invoked.provider?.attempt ?? input.state.providerAttemptRecord
      }
      if (outputBinding === 'cost_evidence') return input.invoked.provider?.attempt.providerCostEvidence ??
        input.invoked.providerAttemptRecord
      if (outputBinding === 'sound_qa_report') return input.invoked.perUnitQa
      if (outputBinding === 'caller_receipt') return input.invoked.callerReceiptOutput
      if (outputBinding === 'provenance_report') return input.invoked.provenanceRecord
      if (outputBinding === 'reference_sound_dna') return input.invoked.soundDna
      if (outputBinding === 'no_sound_decision') return input.invoked.noSoundDecision
      if (outputBinding === 'sound_cue_manifest') return input.invoked.placement ?? input.unit.cue
      if (outputBinding === 'mix_automation_manifest') return input.unit.automation ?? {
        unitId: input.unit.unitId,
        targetRange: input.unit.targetRange,
        automationStatus: 'bounded_defaults_applied',
      }
      if (outputBinding === 'final_composition_sound_handoff') return input.invoked.perUnitQa ? {
        unitId: input.unit.unitId,
        artifactReferences: artifacts.length > 0 ? artifacts : input.state.currentArtifacts,
        qaReceipt: input.invoked.perUnitQa,
        finalRenderOwnedBySound: false,
      } : undefined
      if (outputBinding === 'sound_study_report' || outputBinding === 'final_audio_metrics' ||
        outputBinding === 'candidate_transient_report' || outputBinding === 'transient_timing_report') {
        return latestStudy ?? input.invoked.placement
      }
      if (outputBinding === 'sound_design_plan' || outputBinding === 'visual_sound_event_study' ||
        outputBinding === 'sound_library_search_decision') {
        return input.invoked.callerReceiptOutput
      }
      if (outputBinding === 'bounded_private_visual_proxy') return input.invoked.proxy
      if (/(?:asset|stem|candidate|audio)$/.test(outputBinding) ||
        outputBinding.startsWith('private_') || outputBinding.startsWith('untrusted_') ||
        outputBinding === 'edited_audio_asset_version' || outputBinding === 'cleaned_dialogue_asset_v2') {
        return outputBinding.includes('candidate') ? candidateArtifacts : artifacts
      }
      return undefined
    })()
    if (value === undefined || (Array.isArray(value) && value.length === 0)) {
      throw new Error(
        `Sound handler ${input.step.toolKey}:${input.step.operationKey}:${input.step.operationProfileKey}@${input.step.operationProfileVersion} did not produce declared output ${outputBinding}.`,
      )
    }
    outputsByBinding[outputBinding] = value
  }
  const core = {
    schemaVersion: 'sound-step-output-bundle-v1' as const,
    unitId: input.unit.unitId,
    stepKey: input.step.stepKey,
    declaredOutputBindings: [...input.step.outputBindings],
    outputsByBinding,
    outputArtifactRefs: artifacts,
  }
  const bundle: SoundStepOutputBundle = { ...core, bundleHash: hash(core) }
  validateSoundStepOutputBindings(input.step, bundle)
  return bundle
}

function createCallerReceiptOutput(input: StepInvocationInput) {
  const core = {
    schemaVersion: 'sound-caller-receipt-output-v1' as const,
    receiptId: `sound-caller-receipt.${safeKey(input.unit.unitId)}`,
    unitId: input.unit.unitId,
    callerType: input.input.request.callerType,
    callerSkillKey: input.input.request.callerSkillKey,
    authorityHash: input.input.request.assignmentScope.parentAuthorityHash,
    authorityEscalated: false as const,
    finalRenderOwnedBySound: false as const,
    musicCompositionPerformed: false as const,
  }
  return { ...core, receiptHash: hash({
    ...core,
    requestId: input.input.request.requestId,
    operationSpecHash: input.unit.operationSpec.operationSpecHash,
  }) }
}

function validateSoundStepOutputBindings(
  step: SoundToolRouteStep,
  bundle: SoundStepOutputBundle,
): void {
  const declared = [...step.outputBindings].sort()
  const produced = Object.keys(bundle.outputsByBinding).sort()
  if (JSON.stringify(declared) !== JSON.stringify(produced)) {
    throw new Error(`Sound step output binding mismatch for ${step.stepKey}.`)
  }
  if (bundle.bundleHash !== hash({
    schemaVersion: bundle.schemaVersion,
    unitId: bundle.unitId,
    stepKey: bundle.stepKey,
    declaredOutputBindings: bundle.declaredOutputBindings,
    outputsByBinding: bundle.outputsByBinding,
    outputArtifactRefs: bundle.outputArtifactRefs,
  })) throw new Error(`Sound step output bundle hash mismatch for ${step.stepKey}.`)
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
    unit, status: 'failed', failureCode, candidateArtifacts: [], consumedSourceArtifacts: [],
    studyReports: [], localResults: [], providerAttempts: [], candidateProcessingReceipts: [],
    fallbackEvidence: [], outputBundles: [], stepEvidence: [],
  }
}

function blockedDependencyUnit(unit: SoundExecutionUnit, prerequisiteUnitId: string): UnitExecutionOutcome {
  return {
    unit, status: 'blocked', failureCode: `blocked_dependency:${prerequisiteUnitId}`,
    candidateArtifacts: [], consumedSourceArtifacts: [], studyReports: [], localResults: [],
    providerAttempts: [], candidateProcessingReceipts: [], fallbackEvidence: [], outputBundles: [],
    stepEvidence: [{
      unitId: unit.unitId,
      stepKey: 'cross_unit_dependency',
      toolKey: 'sound_route_executor',
      operationKey: 'enforce_cross_unit_dependency',
      status: 'blocked_dependency',
      elapsedMilliseconds: 0,
      outputArtifactIds: [],
      outputArtifactHashes: [],
      outputBindingKeys: [],
      evidenceRefs: [`sound.blocked_dependency.${safeKey(prerequisiteUnitId)}`],
      operationSpecHash: unit.operationSpec.operationSpecHash,
      failureCode: `blocked_dependency:${prerequisiteUnitId}`,
    }],
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

function compileSoundMixRenderSpec(
  outcome: UnitExecutionOutcome,
  request: CanonicalSoundRequest,
): CompiledSoundMixRenderSpec {
  const automation = outcome.unit.automation
  const cueId = automation?.cueId ?? outcome.unit.cue?.cueId ?? `mix-${safeKey(outcome.unit.unitId)}`
  const core = {
    schemaVersion: 'compiled-sound-mix-render-spec-v1' as const,
    renderSpecId: `sound-mix-render.${safeKey(outcome.unit.unitId)}`,
    cueId,
    targetRange: structuredClone(outcome.unit.targetRange),
    timelineRate: structuredClone(request.timelineRate),
    gainEnvelope: automation?.gainEnvelope ?? [
      { frame: outcome.unit.targetRange.startFrame, gainDb: 0 },
      { frame: outcome.unit.targetRange.endFrameExclusive - 1, gainDb: 0 },
    ],
    fadeInFrames: automation?.fadeInFrames ?? requiredParameterNumber(outcome.unit, 'fadeInFrames'),
    fadeOutFrames: automation?.fadeOutFrames ?? requiredParameterNumber(outcome.unit, 'fadeOutFrames'),
    protectedSpeechRanges: automation?.protectedSpeechRanges ?? [],
    dialogueDuckingDb: automation?.dialogueDuckingDb ?? requiredParameterNumber(outcome.unit, 'dialogueDuckingDb'),
    duckAttackFrames: automation?.duckAttackFrames ?? requiredParameterNumber(outcome.unit, 'duckAttackFrames'),
    duckReleaseFrames: automation?.duckReleaseFrames ?? requiredParameterNumber(outcome.unit, 'duckReleaseFrames'),
    eqProfile: automation?.eqProfile ?? 'neutral' as const,
    dynamicsProfile: automation?.dynamicsProfile ?? 'peak_limiter' as const,
    perspectiveProfile: automation?.distance ?? 'medium' as const,
    roomProfile: automation?.roomMatch ?? 'dry' as const,
    pan: automation?.pan ?? 0,
    headroomDb: automation?.headroomDb ?? requiredParameterNumber(outcome.unit, 'headroomDb'),
    sourceArtifactIds: outcome.consumedSourceArtifacts.map((artifact) => artifact.artifactId),
  }
  return { ...core, renderSpecHash: hash(core) }
}

function musicOperationParameterRecord(input: {
  extension: NonNullable<CanonicalSoundRequest['musicTechnicalAutomationExtension']>
  render: CompiledSoundMixRenderSpec
  operation: string
}): Record<string, unknown> {
  const { extension, render, operation } = input
  if (operation === 'crossfade') {
    throw new Error('One-source Music technical automation cannot issue a crossfade receipt; use the exact two-source crossfade boundary.')
  }
  if (operation === 'trim' || operation === 'cut') return {
    sourceStartFrame: extension.sourceStartFrame,
    sourceEndFrameExclusive: extension.sourceEndFrameExclusive,
    targetStartFrame: extension.targetStartFrame,
    targetEndFrameExclusive: extension.targetEndFrameExclusive,
  }
  if (operation === 'fade') return { fadeInFrames: render.fadeInFrames, fadeOutFrames: render.fadeOutFrames }
  if (operation === 'gain') return { baseGainDb: extension.baseGainDb, gainEnvelope: render.gainEnvelope }
  if (operation === 'normalize') return {
    enabled: extension.normalization.enabled,
    targetLoudnessLufs: extension.normalization.targetLoudnessLufs,
    maximumTruePeakDbtp: extension.maximumTruePeakDbtp,
  }
  if (operation === 'loop') return { loopCrossfadeFrames: extension.loopCrossfadeFrames }
  if (operation === 'resample') return { sampleRate: extension.sampleRate }
  if (operation === 'channel_conversion') return { channelLayout: extension.channelLayout }
  if (operation === 'time_stretch') return { tempoRatio: extension.tempoRatio }
  if (operation === 'pitch_shift') return { pitchSemitones: extension.pitchSemitones }
  if (operation === 'place') return {
    delegatedRange: extension.delegatedRange,
    targetStartFrame: extension.targetStartFrame,
    targetEndFrameExclusive: extension.targetEndFrameExclusive,
  }
  if (operation === 'dialogue_ducking') return {
    attenuationDb: render.dialogueDuckingDb,
    attackFrames: render.duckAttackFrames,
    releaseFrames: render.duckReleaseFrames,
    protectedSpeechRanges: render.protectedSpeechRanges,
  }
  if (operation === 'eq') return { eqProfile: render.eqProfile }
  if (operation === 'dynamics') return { dynamicsProfile: render.dynamicsProfile }
  if (operation === 'pan') return { pan: render.pan }
  if (operation === 'stem_rendering') return {
    renderStem: extension.renderStem,
    headroomDb: render.headroomDb,
    distance: render.perspectiveProfile,
    roomMatch: render.roomProfile,
  }
  if (operation === 'technical_qa') return { requiredQa: extension.requiredQa }
  throw new Error(`Sound Music technical operation ${operation} has no parameter contract.`)
}

function createMusicTechnicalAutomationReceipt(input: {
  request: CanonicalSoundRequest
  outcomes: UnitExecutionOutcome[]
  stepEvidence: SoundRouteStepExecutionEvidence[]
  mixRenderSpecifications: CompiledSoundMixRenderSpec[]
  mixMeasurements: NonNullable<Parameters<typeof runCanonicalSoundExecutionQa>[0]['mixMeasurements']>
  qa: Awaited<ReturnType<typeof runCanonicalSoundExecutionQa>>
}): CanonicalSoundResult['musicTechnicalAutomationReceipt'] {
  const extension = input.request.musicTechnicalAutomationExtension
  if (!extension) return undefined
  const outcome = input.outcomes.find((candidate) =>
    candidate.unit.route.routeKey === 'sound.route.edit.music_technical_automation.v2')
  if (!outcome || outcome.status !== 'completed' || !outcome.selectedArtifact) {
    throw new Error(`Sound Music technical automation did not produce a completed exact route outcome: ${outcome?.failureCode ?? 'missing_outcome'}:${outcome?.stepEvidence.map((item) => `${item.stepKey}=${item.status}${item.failureCode ? `:${item.failureCode}` : ''}`).join('|') ?? 'no_step_evidence'}.`)
  }
  const render = input.mixRenderSpecifications.find((candidate) =>
    candidate.cueId === extension.musicCueId || candidate.targetRange.rangeId === extension.delegatedRange.rangeId)
  if (!render) throw new Error('Sound Music technical automation lacks an exact mix-render specification.')
  const mismatches = [
    render.targetRange.startFrame !== extension.targetStartFrame ? 'targetStartFrame' : '',
    render.targetRange.endFrameExclusive !== extension.targetEndFrameExclusive ? 'targetEndFrameExclusive' : '',
    JSON.stringify(render.gainEnvelope) !== JSON.stringify(extension.gainEnvelope) ? 'gainEnvelope' : '',
    render.fadeInFrames !== extension.fadeInFrames ? 'fadeInFrames' : '',
    render.fadeOutFrames !== extension.fadeOutFrames ? 'fadeOutFrames' : '',
    JSON.stringify(render.protectedSpeechRanges) !== JSON.stringify(extension.dialogueDucking.protectedSpeechRanges)
      ? 'protectedSpeechRanges' : '',
    render.dialogueDuckingDb !== extension.dialogueDucking.attenuationDb ? 'dialogueDuckingDb' : '',
    render.duckAttackFrames !== extension.dialogueDucking.attackFrames ? 'duckAttackFrames' : '',
    render.duckReleaseFrames !== extension.dialogueDucking.releaseFrames ? 'duckReleaseFrames' : '',
    render.eqProfile !== extension.eqProfile ? 'eqProfile' : '',
    render.dynamicsProfile !== extension.dynamicsProfile ? 'dynamicsProfile' : '',
    render.pan !== extension.pan ? 'pan' : '',
    render.perspectiveProfile !== extension.distance ? 'distance' : '',
    render.roomProfile !== extension.roomMatch ? 'roomMatch' : '',
    render.headroomDb !== extension.headroomDb ? 'headroomDb' : '',
  ].filter(Boolean)
  if (mismatches.length > 0) {
    throw new Error(`Sound Music technical automation differs from received mix parameters: ${mismatches.join(',')}.`)
  }
  const expectedParameters = new Map<string, string | number | boolean>([
    ['musicTechnicalExtensionHash', extension.extensionHash],
    ['musicTechnicalOperationParametersHash', extension.operationParametersHash],
    ['sourceStartFrame', extension.sourceStartFrame],
    ['sourceEndFrameExclusive', extension.sourceEndFrameExclusive],
    ['targetStartFrame', extension.targetStartFrame],
    ['targetEndFrameExclusive', extension.targetEndFrameExclusive],
    ['crossfadeFrames', extension.crossfadeFrames],
    ['normalizationEnabled', extension.normalization.enabled],
    ['targetLoudnessLufs', extension.normalization.targetLoudnessLufs],
    ['maximumTruePeakDbtp', extension.maximumTruePeakDbtp],
    ['loopCrossfadeFrames', extension.loopCrossfadeFrames],
    ['tempoRatio', extension.tempoRatio],
    ['pitchSemitones', extension.pitchSemitones],
    ['sampleRate', extension.sampleRate],
    ['channels', extension.channelLayout === 'mono' ? 1 : 2],
    ['renderStem', extension.renderStem],
  ])
  for (const [parameterKey, expected] of expectedParameters) {
    const actual = outcome.unit.operationSpec.parameterBindings.find((binding) =>
      binding.parameterKey === parameterKey)?.value
    if (actual !== expected) throw new Error(`Sound Music technical parameter ${parameterKey} was not compiled exactly.`)
  }
  const stepForOperation: Record<string, string[]> = {
    trim: ['trim_fade_gain'], cut: ['trim_fade_gain'], fade: ['trim_fade_gain'],
    gain: ['trim_fade_gain'], normalize: ['normalize'],
    loop: ['loop_audio'], resample: ['resample_channels'], channel_conversion: ['resample_channels'],
    time_stretch: ['stretch_pitch'], pitch_shift: ['stretch_pitch'], place: ['sync_qa'],
    dialogue_ducking: ['mix_stem'], eq: ['mix_stem'], dynamics: ['mix_stem'], pan: ['mix_stem'],
    stem_rendering: ['mix_stem'], technical_qa: ['analyze_mix', 'qa_music_technical'],
  }
  const completedEvidenceRefs = (stepKey: string) => input.stepEvidence
    .filter((receipt) => receipt.unitId === outcome.unit.unitId && receipt.stepKey === stepKey &&
      receipt.status === 'completed' && Boolean(receipt.operationReceiptHash))
    .map((receipt) => `sound.measured.${stepKey}.${receipt.operationReceiptHash}`)
  const technicalQaRefs = [
    ...input.qa.technicalOutputQa.map((finding) => finding.key),
    ...completedEvidenceRefs('analyze_mix'), ...completedEvidenceRefs('qa_music_technical'),
  ]
  const synchronizationQaRefs = [
    ...input.qa.synchronizationQa.map((finding) => finding.key),
    ...completedEvidenceRefs('sync_qa'),
  ]
  const mixQaRefs = [
    ...input.qa.mixQa.map((finding) => finding.key),
    ...completedEvidenceRefs('mix_stem'),
  ]
  const appliedOperationReceipts = extension.requiredMusicOperations.map((operation) => {
    const stepKeys = stepForOperation[operation]
    if (!stepKeys) throw new Error(`Sound Music technical operation ${operation} has no exact step mapping.`)
    const evidence = input.stepEvidence.filter((receipt) =>
      receipt.unitId === outcome.unit.unitId && stepKeys.includes(receipt.stepKey) && receipt.status === 'completed')
    if (evidence.length !== stepKeys.length) {
      throw new Error(`Sound Music technical operation ${operation} lacks completed step evidence.`)
    }
    const routeManifest = getSoundToolRouteManifest(outcome.unit.route.routeKey, outcome.unit.route.routeVersion)
    if (!routeManifest || routeManifest.routeHash !== outcome.unit.route.routeHash) {
      throw new Error(`Sound Music technical operation ${operation} has a stale route binding.`)
    }
    const routeSteps = stepKeys.map((stepKey) => {
      const step = routeManifest.orderedOrGraphSteps.find((candidate) => candidate.stepKey === stepKey)
      if (!step) throw new Error(`Sound Music technical operation ${operation} references unknown route step ${stepKey}.`)
      return step
    })
    const requestedParameters = musicOperationParameterRecord({ extension, render, operation })
    const compiledParameters = structuredClone(requestedParameters)
    const appliedParameters = structuredClone(compiledParameters)
    const receivedParametersHash = hash(requestedParameters)
    const compiledParametersHash = hash(compiledParameters)
    const appliedParametersHash = hash(appliedParameters)
    const measuredQaRefs = operation === 'place' ? synchronizationQaRefs
      : ['fade', 'gain', 'dialogue_ducking', 'eq', 'dynamics', 'pan'].includes(operation)
        ? [...mixQaRefs, ...technicalQaRefs]
        : operation === 'stem_rendering' ? [...technicalQaRefs, ...mixQaRefs]
          : technicalQaRefs
    const criticalQaPrefixes = operation === 'dialogue_ducking' &&
      extension.dialogueDucking.protectedSpeechRanges.length > 0 &&
      extension.dialogueDucking.attackFrames > 0 && extension.dialogueDucking.releaseFrames > 0
      ? ['mix.measured_duck_envelope.']
      : operation === 'pan' ? ['mix.measured_pan.']
        : operation === 'normalize' ? ['technical.loudness.', 'technical.true_peak.']
          : operation === 'dynamics' && extension.dynamicsProfile === 'peak_limiter'
            ? ['mix.measured_peak.'] : []
    const allQa = [...input.qa.technicalOutputQa, ...input.qa.synchronizationQa, ...input.qa.mixQa]
    const matchesQaPrefix = (key: string, prefix: string) =>
      key === prefix.replace(/\.$/u, '') || key.startsWith(prefix)
    for (const criticalQaPrefix of criticalQaPrefixes) {
      if (!allQa.some((finding) => matchesQaPrefix(finding.key, criticalQaPrefix) &&
        ['pass', 'warning'].includes(finding.disposition))) {
        const matching = allQa.filter((finding) => matchesQaPrefix(finding.key, criticalQaPrefix))
        throw new Error(`Sound Music technical operation ${operation} lacks parameter-specific measured QA ${criticalQaPrefix}: ${JSON.stringify(matching)}.`)
      }
    }
    const qaFindings = allQa.filter((finding) => measuredQaRefs.includes(finding.key))
    const measuredQaResult = qaFindings.some((finding) => finding.disposition === 'fail') ? 'failed' as const
      : qaFindings.some((finding) => finding.disposition === 'needs_review') ? 'needs_review' as const
        : qaFindings.some((finding) => finding.disposition === 'warning') ? 'warning' as const : 'passed' as const
    const outputPairs = new Map<string, string>()
    for (const receipt of evidence) receipt.outputArtifactIds.forEach((artifactId, index) => {
      const artifactHash = receipt.outputArtifactHashes[index]
      if (artifactHash) outputPairs.set(artifactId, artifactHash)
    })
    outputPairs.set(outcome.selectedArtifact!.artifactId, outcome.selectedArtifact!.checksumSha256)
    const sourceArtifacts = outcome.unit.sourceArtifacts.length > 0
      ? outcome.unit.sourceArtifacts : outcome.consumedSourceArtifacts
    if (sourceArtifacts.length === 0) throw new Error(`Sound Music technical operation ${operation} lacks source lineage.`)
    const mixMeasurement = input.mixMeasurements.find((measurement) => measurement.unitId === outcome.unit.unitId)
    const appliedExecutionEvidence = operation === 'dialogue_ducking'
      ? {
          evidenceType: 'sound.dialogue_ducking_execution.v2',
          mode: 'range_envelope',
          requestedAttenuationDb: extension.dialogueDucking.attenuationDb,
          requestedAttackFrames: extension.dialogueDucking.attackFrames,
          requestedReleaseFrames: extension.dialogueDucking.releaseFrames,
          timelineRate: structuredClone(input.request.timelineRate),
          protectedSpeechRanges: structuredClone(extension.dialogueDucking.protectedSpeechRanges),
          appliedEnvelopeSegments: extension.dialogueDucking.protectedSpeechRanges.map((range) => ({
            rangeId: range.rangeId,
            attackStartFrame: Math.max(extension.delegatedRange.startFrame,
              range.startFrame - extension.dialogueDucking.attackFrames),
            attackEndFrameExclusive: range.startFrame,
            holdStartFrame: range.startFrame,
            holdEndFrameExclusive: range.endFrameExclusive,
            releaseStartFrame: range.endFrameExclusive,
            releaseEndFrameExclusive: Math.min(extension.delegatedRange.endFrameExclusive,
              range.endFrameExclusive + extension.dialogueDucking.releaseFrames),
            holdGainDb: extension.dialogueDucking.attenuationDb,
          })),
          measuredRampEvidence: structuredClone(mixMeasurement?.duckEnvelopeMeasurements ?? []),
        }
      : {
          evidenceType: 'sound.operation_execution.v2',
          completedStepReceiptHashes: evidence.map((receipt) => receipt.operationReceiptHash)
            .filter((receiptHash): receiptHash is string => Boolean(receiptHash)),
          measuredQaRefs: [...measuredQaRefs],
        }
    if (operation === 'dialogue_ducking' && extension.dialogueDucking.protectedSpeechRanges.length > 0 &&
      (!mixMeasurement || mixMeasurement.duckEnvelopeMeasurements.length === 0)) {
      throw new Error('Sound Music dialogue ducking lacks decoded applied-envelope evidence.')
    }
    const receiptCore = {
      operation, operationVersion: routeSteps[0]!.operationProfileVersion,
      requestedParameters, receivedParametersHash,
      compiledParameters, compiledParametersHash,
      appliedParameters, appliedParametersHash,
      sourceArtifactIds: sourceArtifacts.map((artifact) => artifact.artifactId),
      sourceArtifactHashes: sourceArtifacts.map((artifact) => artifact.checksumSha256),
      outputArtifactIds: [...outputPairs.keys()], outputArtifactHashes: [...outputPairs.values()],
      exactMutationRange: structuredClone(extension.delegatedRange),
      handlerIdentity: routeSteps.map((step) =>
        `${step.toolKey}:${step.operationKey}:${step.operationProfileKey}`).join(':'),
      routeKey: routeManifest.routeKey, routeVersion: routeManifest.routeVersion, routeHash: routeManifest.routeHash,
      measuredQaRefs, measuredQaResult, appliedExecutionEvidence,
      appliedExecutionEvidenceHash: hash(appliedExecutionEvidence), status: 'completed' as const,
    }
    return { ...receiptCore, receiptHash: hash(receiptCore) }
  })
  if (technicalQaRefs.length === 0 || synchronizationQaRefs.length === 0 || mixQaRefs.length === 0) {
    throw new Error('Sound Music technical automation requires measured technical, synchronization, and mix QA.')
  }
  const core = {
    schemaVersion: 'sound.music_technical_automation_receipt.v2' as const,
    bindingId: extension.bindingId,
    musicCueId: extension.musicCueId,
    receivedExtensionHash: extension.extensionHash,
    appliedExtensionHash: extension.extensionHash,
    appliedOperationReceipts,
    measuredTechnicalQaRefs: technicalQaRefs,
    measuredSynchronizationQaRefs: synchronizationQaRefs,
    measuredMixQaRefs: mixQaRefs,
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
    dialogueInputIndex: unit.sourceArtifacts.findIndex((artifact) =>
      artifact.artifactId === parameterString(unit, 'dialogueSourceArtifactId')),
    dialogueDuckingDb: requiredParameterNumber(unit, 'dialogueDuckingDb'),
    duckAttackSeconds: framesToSeconds(requiredParameterNumber(unit, 'duckAttackFrames'), request.timelineRate),
    duckReleaseSeconds: framesToSeconds(requiredParameterNumber(unit, 'duckReleaseFrames'), request.timelineRate),
    outputLimiterLinear: Number((10 ** (-requiredParameterNumber(unit, 'headroomDb') / 20)).toFixed(6)),
    gainEnvelope: unit.automation?.gainEnvelope.map((point) => ({
      timeSeconds: framesToSeconds(
        Math.max(0, point.frame - unit.targetRange.startFrame), request.timelineRate,
      ),
      gainDb: point.gainDb,
    })),
    protectedSpeechWindows: unit.automation?.protectedSpeechRanges
      .filter((range) => range.startFrame < unit.targetRange.endFrameExclusive &&
        range.endFrameExclusive > unit.targetRange.startFrame)
      .map((range) => ({
        startSeconds: framesToSeconds(
          Math.max(0, range.startFrame - unit.targetRange.startFrame), request.timelineRate,
        ),
        endSeconds: framesToSeconds(
          Math.min(unit.targetRange.endFrameExclusive, range.endFrameExclusive) - unit.targetRange.startFrame,
          request.timelineRate,
        ),
      })),
    pan: unit.automation?.pan ?? 0,
    eqProfile: unit.automation?.eqProfile ?? 'neutral',
    dynamicsProfile: unit.automation?.dynamicsProfile ?? 'peak_limiter',
    perspectiveProfile: unit.automation?.distance ?? 'medium',
    roomProfile: unit.automation?.roomMatch ?? 'dry',
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
    operationSpecHash: unit.operationSpec.operationSpecHash,
    timelineRate: input.request.timelineRate,
    ...(input.request.executionAuthority.creditReservationId
      ? { creditReservationId: input.request.executionAuthority.creditReservationId } : {}),
    routeBinding,
  }
}

function approvedRouteInputKeys(request: CanonicalSoundRequest): string[] {
  return [...new Set([
    'bounded_authority', 'bounded_operation_profile', 'bounded_retime_profile',
    'sound_design_context', 'dialogue_context', 'approved_provider_request',
    'approved_timing_manifest', 'timing_manifest',
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
    ...(request.musicTechnicalAutomationExtension
      ? ['music_technical_automation_extension', 'mix_automation_manifest'] : []),
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
  if (condition === 'music_technical_requires_normalization') {
    return !request.musicTechnicalAutomationExtension?.normalization.enabled
  }
  if (condition === 'music_technical_requires_loop') {
    return (request.musicTechnicalAutomationExtension?.loopCrossfadeFrames ?? 0) <= 0
  }
  if (condition === 'music_technical_requires_retime_or_pitch') {
    const extension = request.musicTechnicalAutomationExtension
    return !extension || (extension.tempoRatio === 1 && extension.pitchSemitones === 0)
  }
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

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)]
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
