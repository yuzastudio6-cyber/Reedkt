import assert from 'node:assert/strict'
import {
  StandaloneCanonicalSoundSkillService,
  StructuredRequestSoundContextLoader,
  soundSkillCapabilityManifest,
  type ApprovedSoundExecutionPackage,
  type CanonicalSoundPlanResult,
} from '../edit-skills/sound'
import { SOUND_SUPPORTED_JOB_TYPES } from '../edit-skills/sound/sound-capability-manifest'
import {
  buildExecutableSoundRequest,
  createCanonicalSoundTestRuntime,
  createInjectedMireloAdapter,
} from './canonical-sound-test-runtime'

const fixtureJobs = new Set([
  'generate_video_conditioned_sfx', 'generate_text_conditioned_sfx',
  'generate_foley', 'generate_ambience',
])

function executionPackage(plan: CanonicalSoundPlanResult, job: string): ApprovedSoundExecutionPackage {
  return {
    schemaVersion: 'approved-sound-execution-package-v1',
    packageId: `sound-acceptance-${job}`,
    approvedWorkItemId: `sound-acceptance-work-${job}`,
    request: plan.request,
    plannedResult: plan.controller.result,
    selectedRoute: plan.selectedRoute,
    executionGraph: plan.executionGraph,
    selectedOptionalStepKeys: [],
    continuitySceneEvidence: plan.continuity.sceneEvidence,
  }
}

const runtime = await createCanonicalSoundTestRuntime()
const injected = createInjectedMireloAdapter({ runtime })
const structuredContext = new StructuredRequestSoundContextLoader()
const acceptanceContext = {
  async load(request: Parameters<StructuredRequestSoundContextLoader['load']>[0]) {
    const loaded = await structuredContext.load(request)
    return {
      ...loaded,
      controllerContext: {
        ...loaded.controllerContext,
        revisionLineage: 'sound.acceptance.revision_lineage.v1',
      },
    }
  },
}
const localService = new StandaloneCanonicalSoundSkillService({
  artifacts: runtime.resolver, context: acceptanceContext,
})
const providerService = new StandaloneCanonicalSoundSkillService({
  artifacts: runtime.resolver,
  mirelo: injected.adapter,
  context: acceptanceContext,
})
const outcomes: Array<{
  job: string
  declaration: string
  result: string
  units: number
  artifacts: number
}> = []

try {
  assert.deepEqual(soundSkillCapabilityManifest.supportedJobTypes, [...SOUND_SUPPORTED_JOB_TYPES])
  const capabilityEntries = soundSkillCapabilityManifest.capabilityEntries ?? []
  assert.equal(capabilityEntries.length, SOUND_SUPPORTED_JOB_TYPES.length)
  for (const job of SOUND_SUPPORTED_JOB_TYPES) {
    const capability = capabilityEntries.find((entry) =>
      entry.supportedJobTypes.includes(job))
    assert.ok(capability, `Missing capability entry for ${job}.`)
    const planningOnly = capability.evidenceLevel === 'planning' && !fixtureJobs.has(job)
    const request = buildExecutableSoundRequest({
      runtime,
      job,
      mode: planningOnly ? 'planning' : fixtureJobs.has(job) ? 'fixture' : 'private_internal',
      audioArtifacts: ['mix_sound_layers', 'create_sound_stem'].includes(job)
        ? [runtime.audioArtifact, runtime.secondAudioArtifact]
        : [runtime.audioArtifact],
    })
    request.requestId = `sound-acceptance-${job}`
    request.idempotencyKey = `sound-acceptance-${job}`
    request.attemptId = `sound-acceptance-attempt-${job}`
    if (job === 'sync_audio_to_visual' || job === 'align_sound_transient') {
      request.eventAnchors[0] = { ...request.eventAnchors[0]!, frame: 3, endFrameExclusive: 8 }
    }
    const service = fixtureJobs.has(job) ? providerService : localService
    const plan = await service.plan(request)
    assert.ok(plan.executionGraph.units.length > 0, `${job} produced no execution units.`)
    assert.equal(plan.executionGraph.manifestHash, soundSkillCapabilityManifest.manifestHash)
    for (const unit of plan.executionGraph.units) {
      assert.match(unit.route.routeHash, /^[a-f0-9]{64}$/)
      assert.match(unit.operationSpec.operationSpecHash, /^[a-f0-9]{64}$/)
      assert.equal(unit.operationSpec.arbitraryArgumentsAccepted, false)
      assert.equal(unit.operationSpec.parameterSourcePolicy, 'typed_sources_only')
    }
    if (planningOnly) {
      assert.ok(plan.executionGraph.units.every((unit) =>
        unit.unitKind === 'planning_only' || unit.unitKind === 'no_sound'))
      outcomes.push({
        job, declaration: capability.evidenceLevel, result: 'plan_only',
        units: plan.executionGraph.units.length, artifacts: 0,
      })
      continue
    }
    const result = await service.execute(executionPackage(plan, job))
    assert.ok(['completed', 'no_sound'].includes(result.status), `${job}:${result.status}:${result.unresolvedDependencies.join(',')}`)
    assert.ok((result.executionUnits?.length ?? 0) > 0)
    for (const step of result.actualExecutionEvidence?.stepEvidence ?? []) {
      if (step.status === 'completed') {
        assert.match(step.operationReceiptHash ?? '', /^[a-f0-9]{64}$/, `${job}:${step.stepKey}`)
        assert.match(step.operationSpecHash, /^[a-f0-9]{64}$/)
      }
    }
    if (fixtureJobs.has(job) && result.status !== 'no_sound') {
      assert.ok((result.actualExecutionEvidence?.providerAttemptIds?.length ?? 0) > 0, job)
    }
    if (result.status === 'completed' && ![
      'study_source_audio', 'study_reference_sound', 'create_sound_dna',
      'sync_audio_to_visual', 'align_sound_transient', 'qa_sound',
      'handoff_sound_to_final_composition',
    ].includes(job)) {
      assert.ok(result.selectedAssetVersions.length > 0, `${job} completed without a selected artifact.`)
    }
    outcomes.push({
      job, declaration: capability.evidenceLevel, result: result.status,
      units: result.executionUnits?.length ?? 0,
      artifacts: result.selectedAssetVersions.length,
    })
  }
  assert.equal(outcomes.length, SOUND_SUPPORTED_JOB_TYPES.length)
  assert.equal(new Set(outcomes.map((item) => item.job)).size, SOUND_SUPPORTED_JOB_TYPES.length)
  console.log(JSON.stringify({
    status: 'ok', manifestVersion: soundSkillCapabilityManifest.skillVersion,
    manifestHash: soundSkillCapabilityManifest.manifestHash,
    supportedJobCount: SOUND_SUPPORTED_JOB_TYPES.length,
    executionQualifiedCount: outcomes.filter((item) => item.result === 'completed').length,
    noSoundCount: outcomes.filter((item) => item.result === 'no_sound').length,
    planningOnlyCount: outcomes.filter((item) => item.result === 'plan_only').length,
    fixtureProviderCalls: injected.transport.calls.length,
    outcomes,
  }, null, 2))
} finally {
  await runtime.cleanup()
}
