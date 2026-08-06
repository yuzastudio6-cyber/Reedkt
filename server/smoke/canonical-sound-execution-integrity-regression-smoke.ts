import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import {
  StandaloneCanonicalSoundSkillService,
  StructuredRequestSoundContextLoader,
  type ApprovedSoundExecutionPackage,
  type CanonicalSoundArtifactResolver,
  type CanonicalSoundPlanResult,
} from '../edit-skills/sound'
import { getSoundToolRouteManifest } from '../sound/sound-tool-route-manifest'
import { admitSoundControllerRoute } from '../sound/sound-tool-views'
import { SOUND_MIRELO_RATE_CARD_SNAPSHOT } from '../sound/sound-rate-card'
import { soundRange } from './sound-test-fixtures'
import {
  buildExecutableSoundRequest,
  createCanonicalSoundTestRuntime,
  createInjectedMireloAdapter,
  DeterministicMireloTransport,
} from './canonical-sound-test-runtime'
import { InMemoryMireloAttemptStore, MireloSfxProviderAdapter } from '../sound/mirelo-sfx-provider'
import {
  PrivateMireloCarrierAudioExtractor,
  PrivateMireloOutputIngestor,
} from '../sound/mirelo-private-artifacts'

function executionPackage(
  plan: CanonicalSoundPlanResult,
  suffix: string,
): ApprovedSoundExecutionPackage {
  return {
    schemaVersion: 'approved-sound-execution-package-v1',
    packageId: `sound-integrity-${suffix}`,
    approvedWorkItemId: `sound-integrity-work-${suffix}`,
    request: plan.request,
    plannedResult: plan.controller.result,
    selectedRoute: plan.selectedRoute,
    executionGraph: plan.executionGraph,
    selectedOptionalStepKeys: [],
    continuitySceneEvidence: plan.continuity.sceneEvidence,
  }
}

const failures: string[] = []

async function verify(name: string, assertion: () => Promise<void>): Promise<void> {
  try {
    await assertion()
  } catch (error) {
    failures.push(`${name}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

const runtime = await createCanonicalSoundTestRuntime()
try {
  const local = new StandaloneCanonicalSoundSkillService({ artifacts: runtime.resolver })

  await verify('completed steps require real invocation receipts', async () => {
    const request = buildExecutableSoundRequest({ runtime, job: 'trim_audio' })
    const plan = await local.plan(request)
    const result = await local.execute(executionPackage(plan, 'step-receipts'))
    const steps = result.actualExecutionEvidence?.stepEvidence ?? []
    assert.ok(steps.length > 0)
    for (const step of steps.filter((item) => item.status === 'completed')) {
      assert.ok('operationReceiptHash' in step, `${step.stepKey} has no operation receipt hash`)
      assert.ok(step.elapsedMilliseconds >= 0)
    }
  })

  await verify('multi-range mutations equal actual changed ranges', async () => {
    const request = buildExecutableSoundRequest({ runtime, job: 'trim_audio' })
    request.assignmentScope.assignmentMode = 'multi_range'
    request.assignmentScope.authorizedAudioWriteRanges = [
      soundRange('changed-a', 0, 75),
      soundRange('untouched-b', 90, 150),
      soundRange('changed-c', 165, 240),
    ]
    request.eventAnchors = [
      { ...request.eventAnchors[0]!, anchorId: 'event-a', frame: 30, endFrameExclusive: 42 },
      { ...request.eventAnchors[0]!, anchorId: 'event-c', frame: 195, endFrameExclusive: 207 },
    ]
    const plan = await local.plan(request)
    const result = await local.execute(executionPackage(plan, 'multi-range'))
    assert.deepEqual(result.modifiedAudioRanges.map((range) => range.rangeId), ['changed-a', 'changed-c'])
  })

  await verify('Sound DNA separates measured and declared evidence', async () => {
    const request = buildExecutableSoundRequest({ runtime, job: 'create_sound_dna' })
    const plan = await local.plan(request)
    const result = await local.execute(executionPackage(plan, 'sound-dna'))
    const dna = (result as unknown as { soundDna?: { measured?: unknown; declared?: unknown } }).soundDna
    assert.ok(dna?.measured)
    assert.ok(dna?.declared)
  })

  await verify('synchronization produces a placement receipt', async () => {
    const request = buildExecutableSoundRequest({ runtime, job: 'sync_audio_to_visual' })
    request.eventAnchors[0] = { ...request.eventAnchors[0]!, frame: 12, endFrameExclusive: 24 }
    const plan = await local.plan(request)
    const result = await local.execute(executionPackage(plan, 'sync'))
    const placements = (result as unknown as { synchronizationPlacements?: unknown[] }).synchronizationPlacements
    assert.ok(placements && placements.length === 1)
  })

  await verify('mix QA is based on decoded output measurements', async () => {
    const request = buildExecutableSoundRequest({
      runtime,
      job: 'mix_sound_layers',
      audioArtifacts: [runtime.audioArtifact, runtime.secondAudioArtifact],
    })
    const plan = await local.plan(request)
    const result = await local.execute(executionPackage(plan, 'mix-measurements'))
    const findings = (result.qaReport as { mixQa?: Array<{ evidence?: Record<string, unknown> }> }).mixQa ?? []
    assert.ok(findings.some((finding) => typeof finding.evidence?.measuredOutputPeakDbfs === 'number'))
    assert.ok(findings.some((finding) => typeof finding.evidence?.measuredDuckingDeltaDb === 'number'))
  })

  await verify('multiple generated cues receive independent attempts and artifacts', async () => {
    const injected = createInjectedMireloAdapter({ runtime })
    const provider = new StandaloneCanonicalSoundSkillService({ artifacts: runtime.resolver, mirelo: injected.adapter })
    const request = buildExecutableSoundRequest({ runtime, job: 'generate_text_conditioned_sfx', mode: 'fixture' })
    request.costPolicy.candidateCount = 1
    request.eventAnchors = [
      { ...request.eventAnchors[0]!, anchorId: 'generated-a', frame: 30, endFrameExclusive: 42 },
      { ...request.eventAnchors[0]!, anchorId: 'generated-b', frame: 180, endFrameExclusive: 192, material: 'glass' },
    ]
    const plan = await provider.plan(request)
    const result = await provider.execute(executionPackage(plan, 'multi-provider'))
    assert.equal(result.selectedAssetVersions.length, 2)
    assert.equal(new Set(result.selectedAssetVersions.map((artifact) => artifact.checksumSha256)).size, 2)
    assert.equal(injected.transport.calls.filter((call) => call.url.endsWith('/v2/text-to-sfx/v1.6/sync')).length, 2)
  })

  await verify('route dependencies precede truthful completed receipts', async () => {
    const request = buildExecutableSoundRequest({ runtime, job: 'trim_audio' })
    const plan = await local.plan(request)
    const result = await local.execute(executionPackage(plan, 'dependency-order'))
    const route = getSoundToolRouteManifest(plan.selectedRoute.routeKey, plan.selectedRoute.routeVersion)!
    const steps = result.actualExecutionEvidence?.stepEvidence ?? []
    for (const receipt of steps.filter((item) => item.status === 'completed')) {
      const declaration = route.orderedOrGraphSteps.find((item) => item.stepKey === receipt.stepKey)!
      for (const dependency of declaration.orderOrDependencies) {
        const dependencyIndex = steps.findIndex((item) => item.unitId === receipt.unitId && item.stepKey === dependency)
        const receiptIndex = steps.findIndex((item) => item === receipt)
        assert.ok(dependencyIndex >= 0 && dependencyIndex < receiptIndex, `${receipt.stepKey} preceded ${dependency}`)
      }
      assert.match(receipt.operationReceiptHash ?? '', /^[a-f0-9]{64}$/)
    }
  })

  await verify('partial failure preserves successful unit artifacts and exact mutation receipts', async () => {
    const failingResolver: CanonicalSoundArtifactResolver = {
      async resolve(artifact) {
        if (artifact.artifactId === runtime.secondAudioArtifact.artifactId) {
          throw new Error('simulated bounded unit decoder failure')
        }
        return runtime.resolver.resolve(artifact)
      },
      privateOutputRoot(scopeId) { return runtime.resolver.privateOutputRoot(scopeId) },
    }
    const service = new StandaloneCanonicalSoundSkillService({ artifacts: failingResolver })
    const request = buildExecutableSoundRequest({
      runtime, job: 'trim_audio', audioArtifacts: [runtime.audioArtifact, runtime.secondAudioArtifact],
    })
    request.assignmentScope.assignmentMode = 'multi_range'
    request.assignmentScope.authorizedAudioWriteRanges = [
      soundRange('partial-good', 0, 60), soundRange('partial-failed', 90, 150),
    ]
    request.eventAnchors = [
      { ...request.eventAnchors[0]!, anchorId: 'partial-event-good', frame: 15, endFrameExclusive: 25 },
      { ...request.eventAnchors[0]!, anchorId: 'partial-event-failed', frame: 105, endFrameExclusive: 115 },
    ]
    const plan = await service.plan(request)
    const result = await service.execute(executionPackage(plan, 'partial-failure'))
    assert.equal(result.status, 'partial')
    assert.equal(result.selectedAssetVersions.length, 1)
    assert.deepEqual(result.modifiedAudioRanges.map((range) => range.rangeId), ['partial-good'])
    assert.equal(result.executionUnits?.filter((unit) => unit.status === 'completed').length, 1)
    assert.equal(result.executionUnits?.filter((unit) => unit.status === 'failed').length, 1)
  })

  await verify('localized revision reuses unaffected artifacts only', async () => {
    const request = buildExecutableSoundRequest({ runtime, job: 'trim_audio' })
    request.assignmentScope.assignmentMode = 'multi_range'
    request.assignmentScope.authorizedAudioWriteRanges = [
      soundRange('revision-a', 0, 60), soundRange('revision-b', 90, 150),
    ]
    request.eventAnchors = [
      { ...request.eventAnchors[0]!, anchorId: 'revision-event-a', frame: 15, endFrameExclusive: 25 },
      { ...request.eventAnchors[0]!, anchorId: 'revision-event-b', frame: 105, endFrameExclusive: 115 },
    ]
    const plan = await local.plan(request)
    const executed = await local.execute(executionPackage(plan, 'revision-base'))
    const revised = await local.revise({
      request, previousResult: executed,
      invalidatedRanges: [soundRange('revision-b', 90, 150)],
    })
    assert.equal(revised.revisionEvidence?.unaffectedArtifactsReused, true)
    assert.equal(revised.selectedAssetVersions.length, 1)
    assert.equal(revised.mutationReceipts?.[0]?.range.rangeId, 'revision-a')
    assert.ok(!revised.selectedAssetVersions.some((artifact) =>
      artifact.artifactId === executed.mutationReceipts?.find((receipt) =>
        receipt.range.rangeId === 'revision-b')?.artifactId))
  })

  await verify('localized revision execution reruns only invalidated ranges', async () => {
    const request = buildExecutableSoundRequest({ runtime, job: 'trim_audio' })
    request.assignmentScope.assignmentMode = 'multi_range'
    request.assignmentScope.authorizedAudioWriteRanges = [
      soundRange('revision-execute-a', 0, 45), soundRange('revision-execute-b', 45, 90),
    ]
    request.eventAnchors = [
      { ...request.eventAnchors[0]!, anchorId: 'revision-execute-event-a', frame: 15, endFrameExclusive: 24 },
      { ...request.eventAnchors[0]!, anchorId: 'revision-execute-event-b', frame: 60, endFrameExclusive: 69 },
    ]
    request.requestId = 'localized-executed-revision-request'
    request.idempotencyKey = 'localized-executed-revision-idempotency'
    request.attemptId = 'localized-executed-revision-attempt'
    const basePlan = await local.plan(request)
    const base = await local.execute(executionPackage(basePlan, 'localized-revision-base'))
    const preserved = base.mutationReceipts?.find((receipt) => receipt.range.rangeId === 'revision-execute-a')
    const replaced = base.mutationReceipts?.find((receipt) => receipt.range.rangeId === 'revision-execute-b')
    assert.ok(preserved && replaced)
    const revised = await local.executeRevision({
      request,
      previousResult: base,
      invalidatedRanges: [soundRange('revision-execute-b', 45, 90)],
      execution: {
        packageId: 'localized-revision-execution-package',
        approvedWorkItemId: 'localized-revision-execution-work',
        selectedOptionalStepKeys: [],
      },
    })
    assert.equal(revised.status, 'completed')
    assert.deepEqual(revised.modifiedAudioRanges.map((range) => range.rangeId), ['revision-execute-b'])
    assert.ok(revised.selectedAssetVersions.some((artifact) => artifact.artifactId === preserved.artifactId))
    assert.ok(!revised.selectedAssetVersions.some((artifact) => artifact.artifactId === replaced.artifactId))
    assert.equal(revised.revisionEvidence?.unaffectedArtifactsReused, true)
    assert.equal(revised.revisionEvidence?.replacedUnitIds.length, 1)
    assert.equal(revised.finalCompositionHandoff?.finalSoundArtifactReferences.length, 2)
  })

  await verify('typed mix directives change real output bytes and remain hash-bound', async () => {
    const executeMix = async (suffix: string, secondGainDb: number) => {
      const request = buildExecutableSoundRequest({
        runtime, job: 'mix_sound_layers',
        audioArtifacts: [runtime.audioArtifact, runtime.secondAudioArtifact],
      })
      request.requestId = `mix-directive-${suffix}`
      request.idempotencyKey = `mix-directive-${suffix}`
      request.attemptId = `mix-directive-attempt-${suffix}`
      request.operationDirectives = [{
        directiveId: `mix-directive-${suffix}`,
        operation: 'mix',
        sourceArtifactIds: [runtime.audioArtifact.artifactId, runtime.secondAudioArtifact.artifactId],
        parameters: {
          dialogueSourceArtifactId: runtime.audioArtifact.artifactId,
          sourceGainDb: { [runtime.secondAudioArtifact.artifactId]: secondGainDb },
        },
      }]
      const plan = await local.plan(request)
      const result = await local.execute(executionPackage(plan, `mix-directive-${suffix}`))
      return { plan, result }
    }
    const quiet = await executeMix('quiet', -24)
    const present = await executeMix('present', -6)
    for (const execution of [quiet, present]) {
      assert.equal(execution.result.status, 'completed', JSON.stringify({
        status: execution.result.status,
        unresolvedDependencies: execution.result.unresolvedDependencies,
        executionUnits: execution.result.executionUnits,
        steps: execution.result.actualExecutionEvidence?.stepEvidence,
      }))
      assert.equal(execution.result.selectedAssetVersions.length, 1)
    }
    assert.notEqual(
      quiet.result.selectedAssetVersions[0]?.checksumSha256,
      present.result.selectedAssetVersions[0]?.checksumSha256,
    )
    assert.notEqual(
      quiet.plan.executionGraph.units[0]?.operationSpec.operationSpecHash,
      present.plan.executionGraph.units[0]?.operationSpec.operationSpecHash,
    )
  })

  await verify('composite typed directives compile completely and reject ambiguous ownership', async () => {
    const request = buildExecutableSoundRequest({
      runtime, job: 'edit_audio',
      audioArtifacts: [runtime.audioArtifact, runtime.secondAudioArtifact],
    })
    request.requestedOperations = ['trim', 'fade', 'gain']
    request.operationDirectives = [
      {
        directiveId: 'composite-trim', operation: 'trim', sourceArtifactIds: [runtime.secondAudioArtifact.artifactId],
        parameters: { trimSourceStartFrame: 3, targetDurationFrames: 75 },
      },
      {
        directiveId: 'composite-fade', operation: 'fade', sourceArtifactIds: [runtime.secondAudioArtifact.artifactId],
        parameters: { fadeInFrames: 4, fadeOutFrames: 8 },
      },
      {
        directiveId: 'composite-gain', operation: 'gain', sourceArtifactIds: [runtime.secondAudioArtifact.artifactId],
        parameters: { gainDb: -7 },
      },
    ]
    const plan = await local.plan(request)
    const spec = plan.executionGraph.units[0]!.operationSpec
    assert.deepEqual(spec.sourceArtifactIds, [runtime.secondAudioArtifact.artifactId])
    for (const key of ['trimSourceStartFrame', 'targetDurationFrames', 'fadeInFrames', 'fadeOutFrames', 'gainDb']) {
      assert.equal(spec.parameterBindings.find((binding) => binding.parameterKey === key)?.source, 'caller_directive')
    }

    request.requestId = 'ambiguous-composite-directive-request'
    request.idempotencyKey = 'ambiguous-composite-directive-idempotency'
    request.attemptId = 'ambiguous-composite-directive-attempt'
    request.operationDirectives[1]!.parameters.gainDb = -4
    await assert.rejects(() => local.plan(request), /ambiguously owned/)
  })

  await verify('multi-cue video generation binds each cue to its exact visual dependency', async () => {
    const secondVisual = { ...runtime.videoArtifact, artifactId: 'approved-video-second' }
    runtime.resolver.register(secondVisual, runtime.videoPath, runtime.inputRoot)
    const injected = createInjectedMireloAdapter({ runtime })
    const service = new StandaloneCanonicalSoundSkillService({
      artifacts: runtime.resolver, mirelo: injected.adapter,
    })
    const request = buildExecutableSoundRequest({
      runtime, job: 'generate_video_conditioned_sfx', mode: 'fixture',
    })
    request.visualDependencies = [
      { ...request.visualDependencies[0]!, timelineRange: soundRange('visual-a-range', 0, 45) },
      {
        ...request.visualDependencies[0]!, artifact: secondVisual,
        timelineRange: soundRange('visual-b-range', 45, 90),
      },
    ]
    request.assignmentScope.sourceArtifactVersions.push({
      artifactId: secondVisual.artifactId, version: secondVisual.version,
      checksumSha256: secondVisual.checksumSha256,
    })
    request.eventAnchors = [
      { ...request.eventAnchors[0]!, anchorId: 'video-event-a', frame: 30, endFrameExclusive: 40 },
      { ...request.eventAnchors[0]!, anchorId: 'video-event-b', frame: 60, endFrameExclusive: 70 },
    ]
    const plan = await service.plan(request)
    assert.deepEqual(
      plan.executionGraph.units.map((unit) => unit.visualDependencyArtifactId),
      [runtime.videoArtifact.artifactId, secondVisual.artifactId],
    )
    const result = await service.execute(executionPackage(plan, 'multi-video-provider'))
    assert.equal(result.status, 'completed', JSON.stringify({
      unresolvedDependencies: result.unresolvedDependencies,
      executionUnits: result.executionUnits,
      steps: result.actualExecutionEvidence?.stepEvidence,
    }))
    assert.equal(result.selectedAssetVersions.length, 2)
    assert.equal(result.actualExecutionEvidence?.providerAttemptIds?.length, 2)
  })

  await verify('carrier-video audio extraction executes through the canonical service graph', async () => {
    const request = buildExecutableSoundRequest({
      runtime, job: 'generate_video_conditioned_sfx', mode: 'fixture',
    })
    request.requestId = 'carrier-service-request'
    request.idempotencyKey = 'carrier-service-idempotency'
    request.attemptId = 'carrier-service-attempt'
    const plan = await local.plan(request)
    const route = getSoundToolRouteManifest(plan.selectedRoute.routeKey, plan.selectedRoute.routeVersion)!
    const carrierAdmission = admitSoundControllerRoute({
      routeKey: route.routeKey,
      capabilityKey: plan.controller.result.capabilityEntryKey,
      jobType: request.requestedJobType,
      mode: 'planning', scope: 'range',
      availableInputKeys: [...route.requiredInputs], availableQaKeys: [], runtimeStatuses: [],
      budgetApproved: true,
      rateCardSnapshotIds: { mirelo_sfx: SOUND_MIRELO_RATE_CARD_SNAPSHOT.rateCardSnapshotId },
      licenseEvidenceRefs: {
        mirelo_sfx: 'sound.license.mirelo_fixture_terms_approved_v1',
        ffmpeg: 'sound.license.ffmpeg_lgpl_build_verified_v1',
        ffprobe: 'sound.license.ffmpeg_lgpl_build_verified_v1',
      },
      selectedOptionalStepKeys: ['extract_carrier_audio'],
    })
    assert.equal(carrierAdmission.admitted, true, carrierAdmission.reasons.join(','))
    const routeBinding = carrierAdmission.binding!
    const binding = {
      soundSkillVersion: request.soundSkillVersion,
      soundManifestHash: request.soundManifestHash,
      capabilityKey: plan.controller.result.capabilityEntryKey,
      approvedPlanSnapshotId: request.executionAuthority.approvedPlanSnapshotId!,
      approvedPlanSnapshotHash: request.executionAuthority.approvedPlanSnapshotHash!,
      approvedWorkItemId: 'carrier-service-work',
      privateOutputScopeId: request.executionAuthority.privateOutputScopeId!,
      idempotencyKey: request.idempotencyKey,
      operationSpecHash: createHash('sha256').update(`carrier:${request.idempotencyKey}`).digest('hex'),
      timelineRate: request.timelineRate,
      creditReservationId: request.executionAuthority.creditReservationId!,
      routeBinding,
    }
    const transport = new DeterministicMireloTransport(runtime.audioPath, runtime.videoPath)
    const adapter = new MireloSfxProviderAdapter(
      transport,
      async () => 'sk-fixture-never-persisted',
      new InMemoryMireloAttemptStore(),
      new PrivateMireloOutputIngestor(runtime.outputRoot, request.executionAuthority.privateOutputScopeId!),
      new PrivateMireloCarrierAudioExtractor(runtime.outputRoot, binding),
    )
    const service = new StandaloneCanonicalSoundSkillService({ artifacts: runtime.resolver, mirelo: adapter })
    const result = await service.execute({
      ...executionPackage(plan, 'carrier-service'),
      approvedWorkItemId: 'carrier-service-work',
    })
    assert.equal(result.status, 'completed', JSON.stringify({
      unresolvedDependencies: result.unresolvedDependencies,
      executionUnits: result.executionUnits,
      steps: result.actualExecutionEvidence?.stepEvidence,
    }))
    assert.equal(result.modifiedVisualRanges.length, 0)
    assert.equal(result.selectedAssetVersions[0]?.contentType, 'audio/wav')
    const visualFinding = (result.qaReport as {
      integrationQa?: Array<{ key: string; evidence: Record<string, unknown> }>
    }).integrationQa?.find((finding) => finding.key === 'integration.visual_immutability')
    assert.equal(visualFinding?.evidence.providerCarrierVisualWasPresentAndRejected, true)
  })

  await verify('provider candidates are independently analyzed before one is selected', async () => {
    const injected = createInjectedMireloAdapter({ runtime })
    const service = new StandaloneCanonicalSoundSkillService({
      artifacts: runtime.resolver, mirelo: injected.adapter,
    })
    const request = buildExecutableSoundRequest({
      runtime, job: 'generate_text_conditioned_sfx', mode: 'fixture',
    })
    request.requestId = 'candidate-ranking-request'
    request.idempotencyKey = 'candidate-ranking-idempotency'
    request.attemptId = 'candidate-ranking-attempt'
    request.costPolicy.candidateCount = 2
    const plan = await service.plan(request)
    const result = await service.execute(executionPackage(plan, 'candidate-ranking'))
    assert.equal(result.status, 'completed')
    assert.equal(result.candidateAssetVersions.length, 2)
    assert.equal(result.selectedAssetVersions.length, 1)
    assert.ok((result.actualExecutionEvidence?.toolRuntimeEvidenceIds.length ?? 0) >= 2)
    const candidateStudies = result.actualExecutionEvidence?.stepEvidence.filter((step) =>
      step.operationKey === 'analyze_audio_pcm' && step.status === 'completed') ?? []
    assert.ok(candidateStudies.some((step) => step.outputBindingKeys.includes('candidate_transient_report')))
    assert.equal(result.candidateProcessingReceipts?.length, 2)
    assert.equal(result.candidateSelectionRecord?.candidateArtifactIds.length, 2)
  })

  await verify('one rejected provider candidate does not discard a healthy candidate', async () => {
    const injected = createInjectedMireloAdapter({ runtime })
    const candidateIsolatingResolver: CanonicalSoundArtifactResolver = {
      async resolve(artifact) {
        if (artifact.artifactId.endsWith('.candidate.1')) {
          throw new Error('simulated candidate-specific decode failure')
        }
        return runtime.resolver.resolve(artifact)
      },
      privateOutputRoot(scopeId) { return runtime.resolver.privateOutputRoot(scopeId) },
    }
    const service = new StandaloneCanonicalSoundSkillService({
      artifacts: candidateIsolatingResolver, mirelo: injected.adapter,
    })
    const request = buildExecutableSoundRequest({
      runtime, job: 'generate_text_conditioned_sfx', mode: 'fixture',
    })
    request.requestId = 'candidate-isolation-request'
    request.idempotencyKey = 'candidate-isolation-idempotency'
    request.attemptId = 'candidate-isolation-attempt'
    request.costPolicy.candidateCount = 2
    const plan = await service.plan(request)
    const result = await service.execute(executionPackage(plan, 'candidate-isolation'))
    assert.equal(result.status, 'completed')
    assert.equal(result.selectedAssetVersions.length, 1)
    assert.ok(result.candidateProcessingReceipts?.some((receipt) =>
      receipt.candidateArtifactId.endsWith('.candidate.1') && !receipt.eligibleForSelection))
    assert.ok(result.candidateSelectionRecord?.selectedArtifactId, JSON.stringify({
      status: result.status,
      candidateProcessingReceipts: result.candidateProcessingReceipts,
      candidateSelectionRecord: result.candidateSelectionRecord,
      steps: result.actualExecutionEvidence?.stepEvidence,
    }))
  })

  await verify('all provider candidates rejected yields a blocked result', async () => {
    const injected = createInjectedMireloAdapter({ runtime })
    const rejectingResolver: CanonicalSoundArtifactResolver = {
      async resolve(artifact) {
        if (artifact.artifactId.startsWith('mirelo.')) {
          throw new Error('simulated all-candidate decode failure')
        }
        return runtime.resolver.resolve(artifact)
      },
      privateOutputRoot(scopeId) { return runtime.resolver.privateOutputRoot(scopeId) },
    }
    const service = new StandaloneCanonicalSoundSkillService({
      artifacts: rejectingResolver, mirelo: injected.adapter,
    })
    const request = buildExecutableSoundRequest({
      runtime, job: 'generate_text_conditioned_sfx', mode: 'fixture',
    })
    request.requestId = 'candidate-exhaustion-request'
    request.idempotencyKey = 'candidate-exhaustion-idempotency'
    request.attemptId = 'candidate-exhaustion-attempt'
    request.costPolicy.candidateCount = 2
    const plan = await service.plan(request)
    const result = await service.execute(executionPackage(plan, 'candidate-exhaustion'))
    assert.equal(result.status, 'blocked')
    assert.ok(result.executionUnits?.some((unit) => unit.status === 'failed'))
    assert.ok(result.fallbackEvidence?.some((evidence) => evidence.decision === 'blocked'))
    assert.equal(result.candidateProcessingReceipts?.filter((receipt) =>
      !receipt.eligibleForSelection).length, 2)
  })

  await verify('peer composite assignment executes mixed preserved and generated cue routes', async () => {
    const injected = createInjectedMireloAdapter({ runtime })
    const baseContext = new StructuredRequestSoundContextLoader()
    const service = new StandaloneCanonicalSoundSkillService({
      artifacts: runtime.resolver,
      mirelo: injected.adapter,
      context: {
        async load(request) {
          const base = await baseContext.load(request)
          return {
            ...base,
            controllerContext: {
              sourceMatches: [{
                anchorId: 'mixed-source', artifact: runtime.audioArtifact,
                usable: true, requiresRepair: false,
              }],
              protectedSpeechRanges: [soundRange('mixed-protected-speech', 30, 45)],
            },
          }
        },
      },
    })
    const request = buildExecutableSoundRequest({
      runtime, job: 'support_transition_sound', mode: 'fixture',
    })
    request.callerType = 'transitions'
    request.callerSkillKey = 'transitions'
    request.orchestraRunId = undefined
    request.peerAuthority = {
      parentWorkItemId: 'transition-parent-work',
      parentAuthorityHash: request.assignmentScope.parentAuthorityHash,
      callerOwnedAudioRanges: [soundRange('transition-owned-audio', 0, 90)],
      callerOwnedVisualRanges: [soundRange('transition-owned-visual', 0, 90)],
      ancestorSkillKeys: ['transitions'],
      callerManifestHash: createHash('sha256').update('transition-manifest').digest('hex'),
    }
    request.callerManifestHash = request.peerAuthority.callerManifestHash
    request.dependencyChain = ['transitions']
    request.assignmentScope.assignmentMode = 'range'
    request.assignmentScope.authorizedAudioWriteRanges = [soundRange('mixed-authority', 0, 90)]
    request.assignmentScope.inspectRanges = [soundRange('mixed-inspect', 0, 90)]
    request.eventAnchors = [
      { ...request.eventAnchors[0]!, anchorId: 'mixed-source', eventType: 'transition', frame: 15, endFrameExclusive: 24 },
      { ...request.eventAnchors[0]!, anchorId: 'mixed-generated', eventType: 'transition', frame: 60, endFrameExclusive: 69 },
    ]
    request.costPolicy.allowProviderGeneration = true
    request.costPolicy.candidateCount = 1
    request.requestId = 'peer-mixed-composite-request'
    request.idempotencyKey = 'peer-mixed-composite-idempotency'
    request.attemptId = 'peer-mixed-composite-attempt'
    const plan = await service.plan(request)
    assert.deepEqual(new Set(plan.executionGraph.units.map((unit) => unit.unitKind)), new Set([
      'audio_operation', 'provider_generation', 'mix_stem', 'qa_handoff',
    ]))
    const result = await service.execute(executionPackage(plan, 'peer-mixed-composite'))
    assert.equal(result.status, 'completed', JSON.stringify({
      units: result.executionUnits, unresolved: result.unresolvedDependencies,
    }))
    assert.ok((result.privateSoundStemArtifacts.length ?? 0) >= 1)
    assert.ok((result.finalCompositionHandoff?.finalSoundArtifactReferences.length ?? 0) >= 1)
    assert.equal(result.callerReceipt.authorityEscalated, false)
    assert.equal(result.modifiedVisualRanges.length, 0)
  })

  await verify('whole-video composite executes two bounded ranges and terminal handoffs', async () => {
    const baseContext = new StructuredRequestSoundContextLoader()
    const service = new StandaloneCanonicalSoundSkillService({
      artifacts: runtime.resolver,
      context: {
        async load(request) {
          const base = await baseContext.load(request)
          return {
            ...base,
            controllerContext: {
              sourceMatches: request.eventAnchors.map((anchor) => ({
                anchorId: anchor.anchorId, artifact: runtime.audioArtifact,
                usable: true, requiresRepair: false,
              })),
            },
          }
        },
      },
    })
    const request = buildExecutableSoundRequest({ runtime, job: 'full_video_sound_pass' })
    request.assignmentScope.assignmentMode = 'whole_video'
    request.assignmentScope.authorizedAudioWriteRanges = [
      soundRange('whole-scene-a', 0, 45), soundRange('whole-scene-b', 45, 90),
    ]
    request.assignmentScope.inspectRanges = [soundRange('whole-inspect', 0, 90)]
    request.assignmentScope.sceneIds = ['scene-a', 'scene-b']
    request.eventAnchors = [
      { ...request.eventAnchors[0]!, anchorId: 'whole-event-a', sceneId: 'scene-a', frame: 15, endFrameExclusive: 24 },
      { ...request.eventAnchors[0]!, anchorId: 'whole-event-b', sceneId: 'scene-b', frame: 60, endFrameExclusive: 69 },
    ]
    request.requestId = 'whole-video-composite-request'
    request.idempotencyKey = 'whole-video-composite-idempotency'
    request.attemptId = 'whole-video-composite-attempt'
    const plan = await service.plan(request)
    assert.equal(plan.executionGraph.units.filter((unit) => unit.unitKind === 'mix_stem').length, 2)
    assert.equal(plan.executionGraph.units.filter((unit) => unit.unitKind === 'qa_handoff').length, 2)
    const result = await service.execute(executionPackage(plan, 'whole-video-composite'))
    assert.equal(result.status, 'completed', JSON.stringify({
      units: result.executionUnits, unresolved: result.unresolvedDependencies,
    }))
    assert.equal(result.privateSoundStemArtifacts.length, 2)
    assert.equal(result.finalCompositionHandoff?.finalSoundArtifactReferences.length, 2)
    assert.equal(result.qaReport && typeof result.qaReport === 'object', true)
  })

  await verify('composite child failure blocks only its dependent range chain', async () => {
    const boundedFailingResolver: CanonicalSoundArtifactResolver = {
      async resolve(artifact) {
        if (artifact.artifactId === runtime.secondAudioArtifact.artifactId) {
          throw new Error('simulated second composite source failure')
        }
        return runtime.resolver.resolve(artifact)
      },
      privateOutputRoot(scopeId) { return runtime.resolver.privateOutputRoot(scopeId) },
    }
    const baseContext = new StructuredRequestSoundContextLoader()
    const service = new StandaloneCanonicalSoundSkillService({
      artifacts: boundedFailingResolver,
      context: {
        async load(request) {
          const base = await baseContext.load(request)
          return {
            ...base,
            controllerContext: {
              sourceMatches: [
                { anchorId: 'partial-chain-a', artifact: runtime.audioArtifact, usable: true, requiresRepair: false },
                { anchorId: 'partial-chain-b', artifact: runtime.secondAudioArtifact, usable: true, requiresRepair: false },
              ],
            },
          }
        },
      },
    })
    const request = buildExecutableSoundRequest({
      runtime, job: 'full_video_sound_pass', audioArtifacts: [runtime.audioArtifact, runtime.secondAudioArtifact],
    })
    request.assignmentScope.assignmentMode = 'whole_video'
    request.assignmentScope.authorizedAudioWriteRanges = [
      soundRange('partial-chain-range-a', 0, 45), soundRange('partial-chain-range-b', 45, 90),
    ]
    request.assignmentScope.inspectRanges = [soundRange('partial-chain-inspect', 0, 90)]
    request.eventAnchors = [
      { ...request.eventAnchors[0]!, anchorId: 'partial-chain-a', frame: 15, endFrameExclusive: 24 },
      { ...request.eventAnchors[0]!, anchorId: 'partial-chain-b', frame: 60, endFrameExclusive: 69 },
    ]
    request.requestId = 'composite-dependent-partial-request'
    request.idempotencyKey = 'composite-dependent-partial-idempotency'
    request.attemptId = 'composite-dependent-partial-attempt'
    const plan = await service.plan(request)
    const result = await service.execute(executionPackage(plan, 'composite-dependent-partial'))
    assert.equal(result.status, 'partial')
    assert.equal(result.privateSoundStemArtifacts.length, 1)
    assert.ok(result.executionUnits?.some((unit) => unit.status === 'failed'))
    assert.ok(result.executionUnits?.filter((unit) => unit.status === 'blocked').length === 2)
    assert.ok(result.executionUnits?.filter((unit) => unit.status === 'completed').length >= 3)
  })

  await verify('internal-library-only composite executes the authorized private artifact', async () => {
    const baseContext = new StructuredRequestSoundContextLoader()
    const service = new StandaloneCanonicalSoundSkillService({
      artifacts: runtime.resolver,
      context: {
        async load(request) {
          const base = await baseContext.load(request)
          return {
            ...base,
            controllerContext: {
              internalLibraryMatches: [{
                anchorId: 'library-only-event', artifact: runtime.audioArtifact,
                semanticScore: 0.98, provenanceApproved: true, projectAuthorized: true,
              }],
            },
          }
        },
      },
    })
    const request = buildExecutableSoundRequest({ runtime, job: 'design_scene_sound' })
    request.assignmentScope.authorizedAudioWriteRanges = [soundRange('library-only-authority', 0, 90)]
    request.assignmentScope.inspectRanges = [soundRange('library-only-inspect', 0, 90)]
    request.eventAnchors = [{
      ...request.eventAnchors[0]!, anchorId: 'library-only-event', frame: 30, endFrameExclusive: 39,
    }]
    request.requestId = 'internal-library-only-request'
    request.idempotencyKey = 'internal-library-only-idempotency'
    request.attemptId = 'internal-library-only-attempt'
    const plan = await service.plan(request)
    assert.equal(plan.controller.result.cueManifest.cues[0]?.acquisitionDecision, 'internal_library')
    assert.equal(plan.executionGraph.units[0]?.route.routeKey, 'sound.route.acquire.project_source.v1')
    const result = await service.execute(executionPackage(plan, 'internal-library-only'))
    assert.equal(result.status, 'completed')
    assert.ok(result.selectedAssetVersions.length >= 1)
    assert.equal(result.actualExecutionEvidence?.providerAttemptIds?.length ?? 0, 0)
  })

  await verify('mixed internal-library and generated cues preserve per-cue route choice', async () => {
    const injected = createInjectedMireloAdapter({ runtime })
    const baseContext = new StructuredRequestSoundContextLoader()
    const service = new StandaloneCanonicalSoundSkillService({
      artifacts: runtime.resolver,
      mirelo: injected.adapter,
      context: {
        async load(request) {
          const base = await baseContext.load(request)
          return {
            ...base,
            controllerContext: {
              internalLibraryMatches: [{
                anchorId: 'library-mixed-event', artifact: runtime.audioArtifact,
                semanticScore: 0.95, provenanceApproved: true, projectAuthorized: true,
              }],
            },
          }
        },
      },
    })
    const request = buildExecutableSoundRequest({ runtime, job: 'design_scene_sound', mode: 'fixture' })
    request.assignmentScope.authorizedAudioWriteRanges = [soundRange('library-mixed-authority', 0, 90)]
    request.assignmentScope.inspectRanges = [soundRange('library-mixed-inspect', 0, 90)]
    request.eventAnchors = [
      { ...request.eventAnchors[0]!, anchorId: 'library-mixed-event', frame: 15, endFrameExclusive: 24 },
      { ...request.eventAnchors[0]!, anchorId: 'generated-mixed-event', frame: 60, endFrameExclusive: 69 },
    ]
    request.costPolicy.allowProviderGeneration = true
    request.costPolicy.candidateCount = 1
    request.requestId = 'internal-library-generated-request'
    request.idempotencyKey = 'internal-library-generated-idempotency'
    request.attemptId = 'internal-library-generated-attempt'
    const plan = await service.plan(request)
    assert.deepEqual(new Set(plan.controller.result.cueManifest.cues.map((cue) => cue.acquisitionDecision)),
      new Set(['internal_library', 'generate_original']))
    const result = await service.execute(executionPackage(plan, 'internal-library-generated'))
    assert.equal(result.status, 'completed')
    assert.equal(result.actualExecutionEvidence?.providerAttemptIds?.length, 1)
    assert.ok(result.privateSoundStemArtifacts.length >= 1)
  })
} finally {
  await runtime.cleanup()
}

if (failures.length > 0) {
  throw new Error(`Canonical Sound execution-integrity regressions:\n${failures.join('\n')}`)
}

console.log('Canonical Sound execution-integrity regression smoke passed.')
