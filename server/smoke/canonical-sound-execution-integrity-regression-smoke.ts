import assert from 'node:assert/strict'
import {
  StandaloneCanonicalSoundSkillService,
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
    assert.ok(candidateStudies.some((step) => step.evidenceRefs.length === 1))
  })
} finally {
  await runtime.cleanup()
}

if (failures.length > 0) {
  throw new Error(`Canonical Sound execution-integrity regressions:\n${failures.join('\n')}`)
}

console.log('Canonical Sound execution-integrity regression smoke passed.')
