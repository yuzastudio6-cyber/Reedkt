import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { ToolRuntimeStatus } from '../../tool-registry'
import {
  parseCanonicalSoundResult,
  type CanonicalSoundRequest,
  type CanonicalSoundResult,
  type SoundArtifactRef,
} from '../../sound/sound-contracts'
import {
  runSoundLocalAudioExecution,
  type SoundAudioStudyReport,
  type SoundLocalAudioExecutionResult,
  type SoundLocalOperation,
} from '../../sound/sound-local-audio-processor'
import {
  getSoundToolRouteManifest,
  evaluateSoundRouteBindingInvalidation,
  type SoundToolRouteBinding,
  type SoundToolRouteManifest,
} from '../../sound/sound-tool-route-manifest'
import { evaluateSoundToolRouteAdmission } from '../../sound/sound-tool-route-manifest'
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
import { framesToSeconds } from '../core/timeline-rate'
import {
  analyzeWholeVideoSoundContinuity,
  type SoundContinuitySceneEvidence,
  type SoundWholeVideoContinuityReport,
} from '../../sound/sound-continuity'
import {
  runCanonicalSoundExecutionQa,
  type CanonicalSoundExecutionQaReport,
} from '../../sound/sound-execution-qa'

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
  selectedOptionalStepKeys: string[]
  continuitySceneEvidence: SoundContinuitySceneEvidence[]
}

export interface SoundRouteStepExecutionEvidence {
  stepKey: string
  toolKey: string
  operationKey: string
  status: 'completed' | 'skipped_optional' | 'skipped_condition'
  elapsedMilliseconds: number
  outputArtifactIds: string[]
  evidenceRefs: string[]
}

export interface SoundRouteExecutionResult {
  result: CanonicalSoundResult
  qa: CanonicalSoundExecutionQaReport
  continuity: SoundWholeVideoContinuityReport
  providerAttempt?: MireloProviderAttempt
  proxy?: BoundedSoundVisualProxyResult
  stepEvidence: SoundRouteStepExecutionEvidence[]
}

interface LocalExecutionOutcome {
  selectedArtifact?: SoundArtifactRef
  candidates: SoundArtifactRef[]
  study?: SoundAudioStudyReport
  localResults: SoundLocalAudioExecutionResult[]
  provider?: MireloGenerationResult
  proxy?: BoundedSoundVisualProxyResult
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
    const route = getSoundToolRouteManifest(input.selectedRoute.routeKey, input.selectedRoute.routeVersion)
    if (!route || route.routeHash !== input.selectedRoute.routeHash) {
      throw new Error('Approved Sound route identity is unavailable or stale.')
    }
    const plannedBinding = input.plannedResult.toolRouteBindings.find((binding) =>
      binding.routeKey === route.routeKey && binding.routeVersion === route.routeVersion)
    if (!plannedBinding || plannedBinding.routeHash !== route.routeHash) {
      throw new Error('Approved Sound plan does not contain the selected exact route binding.')
    }
    const routeBinding = await this.#admitExecutionRoute(input, route)
    const invalidation = evaluateSoundRouteBindingInvalidation({ binding: routeBinding })
    if (invalidation.stale) throw new Error(`Sound route binding is stale: ${invalidation.reasons.join(',')}`)

    const output = route.routeRole === 'no_sound'
      ? { candidates: [], localResults: [] } satisfies LocalExecutionOutcome
      : route.routeKey.includes('.mirelo.') || route.routeKey === 'sound.route.generate.text_sfx.v1'
        ? await this.#executeMirelo(input, route, routeBinding)
        : await this.#executeLocal(input, route, routeBinding)

    const continuity = analyzeWholeVideoSoundContinuity({
      reportId: `sound.continuity.${input.packageId}`,
      timelineRate: input.request.timelineRate,
      scenes: input.continuitySceneEvidence,
      cues: input.plannedResult.cueManifest.cues,
      maximumCueDensityPerMinute: input.request.userSoundPreferences.maximumCueDensityPerMinute,
    })
    const qa = runCanonicalSoundExecutionQa({
      request: input.request,
      artifact: output.selectedArtifact,
      study: output.study,
      cues: input.plannedResult.cueManifest.cues,
      automations: input.plannedResult.mixAutomationManifest.automations,
      continuity,
      providerAttempt: output.provider?.attempt,
      sourceUnchanged: output.localResults.every((item) => item.sourceUnchanged),
      providerVisualRejected: output.provider?.providerVisualRejected,
    })
    const stepEvidence = routeStepEvidence({
      route,
      selectedOptionalStepKeys: input.selectedOptionalStepKeys,
      request: input.request,
      output,
      qa,
    })
    const elapsedMilliseconds = Math.round(performance.now() - startedAt)
    const localCost = output.localResults.reduce(
      (sum, item) => sum + item.runtimeEvidence.localComputeCostUsd, 0,
    )
    const successful = route.routeRole === 'no_sound' || Boolean(output.selectedArtifact) ||
      Boolean(output.study) || input.plannedResult.cueManifest.cues.length === 0
    const result: CanonicalSoundResult = {
      ...structuredClone(input.plannedResult),
      toolRouteBindings: [routeBinding],
      status: route.routeRole === 'no_sound' ? 'no_sound'
        : successful && qa.status !== 'failed' ? 'completed' : 'blocked',
      studyReport: output.study ? { ...structuredClone(output.study) } : input.plannedResult.studyReport,
      qaReport: { ...qa, continuityReport: continuity },
      candidateAssetVersions: output.candidates,
      selectedAssetVersions: output.selectedArtifact ? [output.selectedArtifact] : [],
      privateSoundStemArtifacts: output.selectedArtifact && (
        route.routeKey === 'sound.route.mix.scene.v1' || route.routeKey.includes('.mirelo.') ||
        route.routeKey === 'sound.route.generate.text_sfx.v1'
      ) ? [output.selectedArtifact] : [],
      modifiedAudioRanges: output.selectedArtifact
        ? input.request.assignmentScope.authorizedAudioWriteRanges.map((range) => ({ ...range })) : [],
      modifiedVisualRanges: [],
      unresolvedDependencies: qa.status === 'failed' ? ['sound_output_qa_failed'] : [],
      approvalStatus: 'approved',
      creditStatus: input.request.executionAuthority.creditReservationId ? 'reserved' : 'not_required',
      providerStatus: output.provider ? 'succeeded' : 'not_needed',
      workerStatus: 'completed',
      artifactStatus: output.selectedArtifact ? 'private_ready' : route.routeRole === 'no_sound' ? 'none' : 'none',
      qaStatus: qa.status === 'failed' ? 'failed' : qa.status === 'passed' ? 'passed' : 'warning',
      actualExecutionEvidence: {
        routeExecutionId: `sound.route-execution.${input.packageId}`,
        elapsedMilliseconds,
        actualCreditsCharged: 0,
        actualLocalInfrastructureCostUsd: Number(localCost.toFixed(8)),
        ...(output.provider?.attempt.providerCostEvidence
          ? { providerCostEvidenceId: `sound.provider-cost.${output.provider.attempt.attemptId}` } : {}),
        ...(output.provider ? {
          providerAttemptId: output.provider.attempt.attemptId,
          providerAttemptStatus: output.provider.attempt.status,
        } : {}),
        toolRuntimeEvidenceIds: output.localResults.map((item) =>
          `sound.runtime.${item.executionId}`),
        outputArtifactHashes: [output.selectedArtifact, ...output.candidates]
          .filter((artifact): artifact is SoundArtifactRef => Boolean(artifact))
          .map((artifact) => artifact.checksumSha256),
        stepEvidence,
      },
      finalCompositionHandoff: {
        handoffId: `sound.handoff.${input.packageId}`,
        soundArtifactIds: output.selectedArtifact ? [output.selectedArtifact.artifactId] : [],
        cueManifestId: input.plannedResult.cueManifest.cueManifestId,
        mixManifestId: input.plannedResult.mixAutomationManifest.mixManifestId,
        qaEvidenceHash: qa.evidenceHash,
        timelineManifestHash: input.request.timelineManifestHash,
        timelineRate: input.request.timelineRate,
        finalRenderOwnedBySound: false,
      },
    }
    if (result.status === 'completed' && !output.selectedArtifact && !output.study) {
      throw new Error('Sound execution cannot complete with empty executable outputs.')
    }
    return {
      result: parseCanonicalSoundResult(result), qa, continuity,
      providerAttempt: output.provider?.attempt, proxy: output.proxy, stepEvidence,
    }
  }

  async #admitExecutionRoute(
    input: ApprovedSoundExecutionPackage,
    route: Readonly<SoundToolRouteManifest>,
  ): Promise<SoundToolRouteBinding> {
    const runtimeStatuses = await executionRuntimeStatuses(Boolean(this.#mirelo))
    const admission = evaluateSoundToolRouteAdmission({
      routeKey: route.routeKey,
      routeVersion: route.routeVersion,
      capabilityKey: input.plannedResult.capabilityEntryKey,
      jobType: input.request.requestedJobType,
      mode: input.request.requiredQualificationMode === 'production' ? 'final_execution' : 'preview_execution',
      scope: input.request.assignmentScope.assignmentMode === 'whole_video'
        ? 'video' : input.request.assignmentScope.assignmentMode,
      availableInputKeys: approvedRouteInputKeys(input.request),
      availableQaKeys: [...route.stepQa, ...route.finalOutputQa, ...route.integrationQa],
      runtimeStatuses,
      budgetApproved: input.request.executionAuthority.creditStatus === 'reserved',
      rateCardSnapshotIds: { mirelo_sfx: SOUND_MIRELO_RATE_CARD_SNAPSHOT.rateCardSnapshotId },
      licenseEvidenceRefs: licenseEvidence(input.request),
      selectedOptionalStepKeys: input.selectedOptionalStepKeys,
    })
    if (!admission.admitted || !admission.binding) {
      throw new Error(`Sound execution route admission failed: ${admission.reasons.join(',')}`)
    }
    return admission.binding
  }

  async #executeLocal(
    input: ApprovedSoundExecutionPackage,
    route: Readonly<SoundToolRouteManifest>,
    routeBinding: SoundToolRouteBinding,
  ): Promise<LocalExecutionOutcome> {
    const operation = localOperationForJob(input.request.requestedJobType)
    if (!operation) return { candidates: [], localResults: [] }
    const refs = sourceRefsForOperation(input.request, operation)
    if (refs.length === 0) throw new Error('Sound local route has no approved source artifact.')
    const sources = await Promise.all(refs.map((artifact) => this.#artifacts.resolve(artifact)))
    const approvedInputRoot = commonApprovedRoot(sources)
    const privateOutputRoot = await this.#artifacts.privateOutputRoot(
      input.request.executionAuthority.privateOutputScopeId!,
    )
    const profile = localProfile(operation, route)
    const outputRequired = !['analyze', 'sync_qa'].includes(operation)
    const outputRelativePath = `sound/${safeKey(input.request.idempotencyKey)}/${safeKey(operation)}.wav`
    const local = await runSoundLocalAudioExecution({
      schemaVersion: 'sound-local-audio-execution-v1',
      executionId: `sound.local.${input.packageId}.${operation}`,
      binding: localBinding(input, routeBinding),
      operation,
      operationProfileKey: profile,
      sources: sources.map(({ artifact, absolutePath }) => ({ artifact, absolutePath })),
      approvedInputRoot,
      privateOutputRoot,
      ...(outputRequired ? {
        outputRelativePath,
        outputArtifactId: `sound-output-${safeKey(input.packageId)}-${operation}`,
        outputArtifactType: operation === 'mix_stem' ? 'private_sound_stem' : 'edited_audio_asset_version',
        outputContentType: 'audio/wav' as const,
      } : {}),
      parameters: localParameters(input.request, operation),
    })
    let study = local.studyReport
    const localResults = [local]
    if (local.outputArtifact) {
      const analysis = await runSoundLocalAudioExecution({
        schemaVersion: 'sound-local-audio-execution-v1',
        executionId: `sound.local.${input.packageId}.output-analysis`,
        binding: localBinding(input, routeBinding),
        operation: 'analyze',
        operationProfileKey: analysisProfile(route),
        sources: [{ artifact: local.outputArtifact, absolutePath: resolve(privateOutputRoot, outputRelativePath) }],
        approvedInputRoot: privateOutputRoot,
        privateOutputRoot,
        parameters: {},
      })
      localResults.push(analysis)
      study = analysis.studyReport
    }
    return {
      selectedArtifact: local.outputArtifact,
      candidates: local.outputArtifact ? [local.outputArtifact] : [],
      study,
      localResults,
    }
  }

  async #executeMirelo(
    input: ApprovedSoundExecutionPackage,
    route: Readonly<SoundToolRouteManifest>,
    routeBinding: SoundToolRouteBinding,
  ): Promise<LocalExecutionOutcome> {
    if (!this.#mirelo) throw new Error('Mirelo execution is fail-closed without an injected or approved live adapter.')
    const request = input.request
    const outputRoot = await this.#artifacts.privateOutputRoot(request.executionAuthority.privateOutputScopeId!)
    const cue = input.plannedResult.cueManifest.cues[0]
    const authority = request.assignmentScope.authorizedAudioWriteRanges[0]
    if (!cue || !authority) throw new Error('Mirelo route requires an approved cue and exact range authority.')
    let proxy: BoundedSoundVisualProxyResult | undefined
    if (route.routeKey.includes('video_sfx')) {
      const visual = request.visualDependencies[0]
      if (!visual) throw new Error('Mirelo video-conditioned route requires an approved visual dependency.')
      const resolvedVisual = await this.#artifacts.resolve(visual.artifact)
      const inspectAuthority = request.assignmentScope.inspectRanges.find((range) =>
        cue.startFrame >= range.startFrame && cue.endFrameExclusive <= range.endFrameExclusive)
      if (!inspectAuthority) throw new Error('Mirelo cue is outside approved visual inspection authority.')
      proxy = await prepareBoundedPrivateVisualProxy({
        schemaVersion: 'sound-bounded-visual-proxy-request-v1',
        executionId: `sound.proxy.${input.packageId}`,
        approvedSnapshotId: request.executionAuthority.approvedPlanSnapshotId!,
        approvedSnapshotHash: request.executionAuthority.approvedPlanSnapshotHash!,
        approvedWorkItemId: input.approvedWorkItemId,
        privateOutputScopeId: request.executionAuthority.privateOutputScopeId!,
        idempotencyKey: `${request.idempotencyKey}.proxy`,
        source: {
          artifact: visual.artifact,
          absolutePath: resolvedVisual.absolutePath,
          visualVersion: visual.visualVersion,
          visualHash: visual.visualHash,
          expectedChecksumSha256: visual.artifact.checksumSha256,
        },
        approvedInputRoot: resolvedVisual.approvedRoot,
        privateOutputRoot: outputRoot,
        outputRelativePath: `sound/${safeKey(request.idempotencyKey)}/mirelo-visual-proxy.mp4`,
        outputArtifactId: `sound-proxy-${safeKey(input.packageId)}`,
        eventRange: { rangeId: cue.cueId, startFrame: cue.startFrame, endFrameExclusive: cue.endFrameExclusive },
        authorizedSourceRange: inspectAuthority,
        preRollFrames: 0,
        postRollFrames: 0,
        timelineRate: request.timelineRate,
        timelineManifestRate: request.timelineManifestRate,
        outputConstraints: {
          maximumWidth: 1280, maximumHeight: 720, maximumBytes: 256 * 1024 * 1024,
          contentType: 'video/mp4', removeSourceAudio: true,
        },
        providerProfile: {
          providerKey: 'mirelo_sfx',
          providerProfileKey: 'sound.mirelo.video_sfx_1_6.v1',
          providerProfileVersion: '1.0.0',
        },
      })
    }
    const durationMs = Math.max(1_000, Math.round(framesToSeconds(
      cue.endFrameExclusive - cue.startFrame, request.timelineRate,
    ) * 1_000))
    const common = {
      requestId: request.requestId,
      attemptId: request.attemptId,
      idempotencyKey: request.idempotencyKey,
      approvedPlanSnapshotId: request.executionAuthority.approvedPlanSnapshotId!,
      approvedPlanSnapshotHash: request.executionAuthority.approvedPlanSnapshotHash!,
      creditReservationId: request.executionAuthority.creditReservationId!,
      privateOutputScopeId: request.executionAuthority.privateOutputScopeId!,
      durationMs,
      candidateCount: request.costPolicy.candidateCount,
      maximumPreflightCredits: request.costPolicy.maximumCredits,
      timeoutMs: request.latencyPolicy.maximumExpectedSeconds * 1_000,
      privacyApproved: true as const,
      commercialTermsApproved: true as const,
      retentionApproved: true as const,
      routeBinding,
    }
    const provider = proxy
      ? await this.#mirelo.generate({
          ...common,
          operation: 'video_to_sfx',
          privateVisualProxy: {
            bytes: await readFile(resolve(outputRoot, `sound/${safeKey(request.idempotencyKey)}/mirelo-visual-proxy.mp4`)),
            contentType: 'video/mp4',
            visualHash: proxy.checksumSha256,
            sourceVisualHash: proxy.sourceVisualHash,
            artifactId: proxy.artifact.artifactId,
            artifactVersion: proxy.artifact.version,
            startOffsetMs: 0,
          },
          useAsyncJob: request.latencyPolicy.allowAsyncProviderJob,
        })
      : await this.#mirelo.generate({
          ...common,
          operation: 'text_to_sfx',
          prompt: buildMireloPrompt(request),
          loop: request.requestedJobType === 'generate_ambience' || request.requestedJobType === 'extend_ambience',
        })
    const selected = provider.outputArtifacts[0]
    if (!selected) throw new Error('Mirelo completed without an ingested private audio candidate.')
    const resolvedCandidate = await this.#artifacts.resolve(selected)
    const relativeOutput = `sound/${safeKey(request.idempotencyKey)}/selected-provider-sound.wav`
    const trim = await runSoundLocalAudioExecution({
      schemaVersion: 'sound-local-audio-execution-v1',
      executionId: `sound.local.${input.packageId}.provider-trim`,
      binding: localBinding(input, routeBinding),
      operation: 'trim_fade_gain',
      operationProfileKey: 'sound.trim-fade-gain.v1',
      sources: [{ artifact: selected, absolutePath: resolvedCandidate.absolutePath }],
      approvedInputRoot: resolvedCandidate.approvedRoot,
      privateOutputRoot: outputRoot,
      outputRelativePath: relativeOutput,
      outputArtifactId: `sound-selected-${safeKey(input.packageId)}`,
      outputArtifactType: 'candidate_sfx_asset',
      outputContentType: 'audio/wav',
      parameters: {
        durationSeconds: framesToSeconds(cue.endFrameExclusive - cue.startFrame, request.timelineRate),
        fadeInSeconds: Math.min(0.04, durationMs / 4_000),
        fadeOutSeconds: Math.min(0.08, durationMs / 4_000),
        gainDb: input.plannedResult.mixAutomationManifest.automations[0]?.baseGainDb ?? -12,
        sampleRate: request.qualityPolicy.sampleRate,
        channels: request.qualityPolicy.channelLayout === 'mono' ? 1 : 2,
      },
    })
    const analysis = await runSoundLocalAudioExecution({
      schemaVersion: 'sound-local-audio-execution-v1',
      executionId: `sound.local.${input.packageId}.provider-analysis`,
      binding: localBinding(input, routeBinding),
      operation: 'analyze',
      operationProfileKey: route.routeKey.includes('video_sfx')
        ? 'sound.analyze.provider_candidate.v1' : 'sound.analyze.provider_candidate.v1',
      sources: [{ artifact: trim.outputArtifact!, absolutePath: resolve(outputRoot, relativeOutput) }],
      approvedInputRoot: outputRoot,
      privateOutputRoot: outputRoot,
      parameters: {},
    })
    return {
      selectedArtifact: trim.outputArtifact,
      candidates: provider.outputArtifacts,
      study: analysis.studyReport,
      localResults: [trim, analysis],
      provider,
      proxy,
    }
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
    if (current) byKey.set(toolKey, { ...current, availabilityStatus: 'available', healthProbePassed: true, availableConcurrency: 1, blockingReasons: [] })
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

function localBinding(input: ApprovedSoundExecutionPackage, routeBinding: SoundToolRouteBinding) {
  return {
    soundSkillVersion: input.request.soundSkillVersion,
    soundManifestHash: input.request.soundManifestHash,
    capabilityKey: input.plannedResult.capabilityEntryKey,
    approvedPlanSnapshotId: input.request.executionAuthority.approvedPlanSnapshotId!,
    approvedPlanSnapshotHash: input.request.executionAuthority.approvedPlanSnapshotHash!,
    approvedWorkItemId: input.approvedWorkItemId,
    privateOutputScopeId: input.request.executionAuthority.privateOutputScopeId!,
    idempotencyKey: input.request.idempotencyKey,
    timelineRate: input.request.timelineRate,
    ...(input.request.executionAuthority.creditReservationId
      ? { creditReservationId: input.request.executionAuthority.creditReservationId } : {}),
    routeBinding,
  }
}

function localOperationForJob(job: string): SoundLocalOperation | undefined {
  if (job === 'study_source_audio' || job === 'study_reference_sound' || job === 'create_sound_dna' || job === 'qa_sound' || job === 'handoff_sound_to_final_composition') return 'analyze'
  if (job === 'extract_project_owned_sound') return 'extract'
  if (job === 'repair_audio' || job === 'clean_dialogue' || job === 'reduce_noise') return 'cleanup_gentle'
  if (['edit_audio', 'trim_audio', 'fade_audio', 'adjust_gain'].includes(job)) return 'trim_fade_gain'
  if (job === 'normalize_audio') return 'normalize'
  if (job === 'resample_audio' || job === 'convert_audio_channels') return 'resample_channels'
  if (job === 'loop_audio' || job === 'extend_ambience') return 'loop_crossfade'
  if (job === 'time_stretch_audio' || job === 'pitch_shift_audio') return 'stretch_pitch'
  if (job === 'sync_audio_to_visual' || job === 'align_sound_transient') return 'sync_qa'
  if (job === 'mix_sound_layers' || job === 'create_sound_stem') return 'mix_stem'
  return undefined
}

function sourceRefsForOperation(request: CanonicalSoundRequest, operation: SoundLocalOperation): SoundArtifactRef[] {
  if (operation === 'analyze' && request.requestedJobType === 'study_reference_sound') return request.referenceSoundInputs.slice(0, 1)
  if (operation === 'mix_stem') return request.sourceAudioRefs.slice(0, 16)
  return request.sourceAudioRefs.slice(0, 1)
}

function localProfile(operation: SoundLocalOperation, route: Readonly<SoundToolRouteManifest>): string {
  const operationKey: Record<SoundLocalOperation, string> = {
    analyze: 'analyze_audio_pcm', extract: 'extract_audio_pcm', trim_fade_gain: 'trim_fade_gain_audio',
    normalize: 'normalize_audio_loudness', resample_channels: 'resample_convert_channels',
    loop_crossfade: 'loop_audio_crossfade', stretch_pitch: 'stretch_pitch_audio',
    mix_stem: 'mix_scene_stem', sync_qa: 'sync_transient_qa', cleanup_gentle: 'cleanup_dialogue_gentle',
  }
  const step = route.orderedOrGraphSteps.find((candidate) => candidate.operationKey === operationKey[operation])
  if (!step) throw new Error(`Sound route ${route.routeKey} does not bind local operation ${operation}.`)
  return step.operationProfileKey
}

function analysisProfile(route: Readonly<SoundToolRouteManifest>): string {
  return route.orderedOrGraphSteps.find((step) => step.operationKey === 'analyze_audio_pcm')?.operationProfileKey ?? 'sound.analyze.v1'
}

function localParameters(request: CanonicalSoundRequest, operation: SoundLocalOperation) {
  const range = request.assignmentScope.authorizedAudioWriteRanges[0]
  const durationSeconds = range
    ? framesToSeconds(range.endFrameExclusive - range.startFrame, request.timelineRate) : 1
  if (operation === 'trim_fade_gain') return {
    trimStartSeconds: 0, durationSeconds, fadeInSeconds: 0.04, fadeOutSeconds: 0.08,
    gainDb: -6, sampleRate: request.qualityPolicy.sampleRate,
    channels: request.qualityPolicy.channelLayout === 'mono' ? 1 as const : 2 as const,
  }
  if (operation === 'normalize') return {
    targetLoudnessLufs: request.qualityPolicy.targetLoudnessLufs,
    maximumTruePeakDbtp: request.qualityPolicy.maximumTruePeakDbtp,
    sampleRate: request.qualityPolicy.sampleRate,
    channels: request.qualityPolicy.channelLayout === 'mono' ? 1 as const : 2 as const,
  }
  if (operation === 'resample_channels') return {
    sampleRate: request.qualityPolicy.sampleRate,
    channels: request.qualityPolicy.channelLayout === 'mono' ? 1 as const : 2 as const,
  }
  if (operation === 'loop_crossfade') return {
    durationSeconds, loopCrossfadeSeconds: 0.08,
    sampleRate: request.qualityPolicy.sampleRate,
    channels: request.qualityPolicy.channelLayout === 'mono' ? 1 as const : 2 as const,
  }
  if (operation === 'stretch_pitch') return {
    tempoRatio: request.requestedJobType === 'time_stretch_audio' ? 1.05 : 1,
    pitchSemitones: request.requestedJobType === 'pitch_shift_audio' ? 1 : 0,
    sampleRate: request.qualityPolicy.sampleRate,
    channels: request.qualityPolicy.channelLayout === 'mono' ? 1 as const : 2 as const,
  }
  if (operation === 'mix_stem') return {
    inputGainDb: request.sourceAudioRefs.map((_, index) => index === 0 ? 0 : -12),
    dialogueInputIndex: 0, dialogueDuckingDb: -9,
    sampleRate: request.qualityPolicy.sampleRate,
    channels: request.qualityPolicy.channelLayout === 'mono' ? 1 as const : 2 as const,
  }
  if (operation === 'sync_qa') return {
    expectedHitSeconds: request.eventAnchors[0]
      ? framesToSeconds(request.eventAnchors[0].frame, request.timelineRate) : 0,
    maximumSyncErrorSeconds: framesToSeconds(2, request.timelineRate),
  }
  return { sampleRate: request.qualityPolicy.sampleRate,
    channels: request.qualityPolicy.channelLayout === 'mono' ? 1 as const : 2 as const }
}

function commonApprovedRoot(sources: ResolvedPrivateSoundArtifact[]): string {
  const roots = new Set(sources.map((source) => source.approvedRoot))
  if (roots.size !== 1) throw new Error('Sound sources must share one approved private input root per operation.')
  return sources[0]!.approvedRoot
}

function buildMireloPrompt(request: CanonicalSoundRequest): string {
  const event = request.eventAnchors[0]
  const fields = [
    event?.eventType, event?.material, event?.perspective, event?.environment,
    request.userSoundPreferences.preferredPerspective,
  ].filter(Boolean)
  return `Create one isolated, speech-safe Sound effect for: ${fields.join(', ')}. No Music, voice, or dialogue.`
}

function safeKey(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 24)
}

function routeStepEvidence(input: {
  route: Readonly<SoundToolRouteManifest>
  selectedOptionalStepKeys: string[]
  request: CanonicalSoundRequest
  output: LocalExecutionOutcome
  qa: CanonicalSoundExecutionQaReport
}): SoundRouteStepExecutionEvidence[] {
  const selected = new Set(input.selectedOptionalStepKeys)
  const produced = [input.output.selectedArtifact, ...input.output.candidates]
    .filter((artifact): artifact is SoundArtifactRef => Boolean(artifact))
  return input.route.orderedOrGraphSteps.map((step) => {
    const skippedOptional = !step.required && !selected.has(step.stepKey)
    const skippedCondition = !skippedOptional && conditionIsFalse(step.executionCondition, input.request)
    return {
      stepKey: step.stepKey,
      toolKey: step.toolKey,
      operationKey: step.operationKey,
      status: skippedOptional ? 'skipped_optional' : skippedCondition ? 'skipped_condition' : 'completed',
      elapsedMilliseconds: skippedOptional || skippedCondition ? 0 : Math.max(0,
        Math.floor(input.output.localResults.reduce((sum, item) => sum + item.runtimeEvidence.elapsedMilliseconds, 0) /
          Math.max(1, input.route.orderedOrGraphSteps.length))),
      outputArtifactIds: skippedOptional || skippedCondition ? [] : produced.map((artifact) => artifact.artifactId),
      evidenceRefs: skippedOptional ? ['sound.optional_step_not_admitted']
        : skippedCondition ? ['sound.step_condition_false']
          : [input.qa.evidenceHash, ...step.outputBindings],
    }
  })
}

function conditionIsFalse(condition: string, request: CanonicalSoundRequest): boolean {
  if (condition === 'always') return false
  if (condition === 'job_requires_trim_fade_or_gain') return !['edit_audio', 'trim_audio', 'fade_audio', 'adjust_gain'].includes(request.requestedJobType)
  if (condition === 'job_requires_normalization') return request.requestedJobType !== 'normalize_audio'
  if (condition === 'job_requires_resample_or_channels') return !['resample_audio', 'convert_audio_channels'].includes(request.requestedJobType)
  if (condition === 'job_requires_loop') return !['loop_audio', 'extend_ambience'].includes(request.requestedJobType)
  if (condition === 'provider_output_is_video_carrier') return true
  return false
}
