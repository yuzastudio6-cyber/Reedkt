import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { StandaloneCanonicalSoundSkillService, type ApprovedSoundExecutionPackage } from '../edit-skills/sound'
import {
  runSoundLocalAudioExecution,
  validateSoundAudioFile,
  type SoundLocalAudioExecutionPackage,
} from '../sound/sound-local-audio-processor'
import {
  buildExecutableSoundRequest,
  createCanonicalSoundTestRuntime,
} from './canonical-sound-test-runtime'
import type { SoundSupportedJobType } from '../edit-skills/sound/sound-capability-manifest'
import { rationalSecondsToFrames, type TimelineRate } from '../edit-skills/core/timeline-rate'

const runtime = await createCanonicalSoundTestRuntime()
const sourceHashBefore = createHash('sha256').update(await readFile(runtime.audioPath)).digest('hex')
const service = new StandaloneCanonicalSoundSkillService({ artifacts: runtime.resolver })
const jobs: SoundSupportedJobType[] = [
  'study_source_audio', 'extract_project_owned_sound', 'trim_audio', 'fade_audio',
  'adjust_gain', 'normalize_audio', 'resample_audio', 'convert_audio_channels',
  'loop_audio', 'time_stretch_audio', 'pitch_shift_audio', 'repair_audio',
  'clean_dialogue', 'reduce_noise', 'sync_audio_to_visual', 'mix_sound_layers',
  'create_sound_stem', 'qa_sound',
]
const outcomes: Array<{ job: string; status: string; artifacts: number }> = []

try {
  for (const job of jobs) {
    const request = buildExecutableSoundRequest({
      runtime,
      job,
      audioArtifacts: job === 'mix_sound_layers' || job === 'create_sound_stem'
        ? [runtime.audioArtifact, runtime.secondAudioArtifact] : [runtime.audioArtifact],
    })
    if (job === 'sync_audio_to_visual') {
      request.eventAnchors[0]!.frame = 3
      request.eventAnchors[0]!.endFrameExclusive = 8
    }
    const plan = await service.plan(request)
    const executionPackage: ApprovedSoundExecutionPackage = {
      schemaVersion: 'approved-sound-execution-package-v1',
      packageId: `package-${job}`,
      approvedWorkItemId: `work-${job}`,
      request,
      plannedResult: plan.controller.result,
      selectedRoute: plan.selectedRoute,
      selectedOptionalStepKeys: [],
      continuitySceneEvidence: plan.continuity.sceneEvidence,
    }
    const result = await service.execute(executionPackage)
    assert.equal(result.status, 'completed', `${job}:${JSON.stringify(result.qaReport)}`)
    assert.equal(result.workerStatus, 'completed')
    assert.equal(result.modifiedVisualRanges.length, 0)
    assert.ok(result.actualExecutionEvidence)
    assert.ok(result.actualExecutionEvidence.stepEvidence.every((step) =>
      ['completed', 'skipped_optional', 'skipped_condition'].includes(step.status)))
    if (!['study_source_audio', 'sync_audio_to_visual', 'qa_sound'].includes(job)) {
      assert.equal(result.selectedAssetVersions.length, 1, job)
      const resolved = await runtime.resolver.resolve(result.selectedAssetVersions[0]!)
      const probe = await validateSoundAudioFile(resolved.absolutePath)
      assert.equal(probe.sampleRate, 48_000)
      assert.equal(probe.channels, 2)
      assert.ok(probe.durationSeconds > 0)
    }
    outcomes.push({ job, status: result.status, artifacts: result.selectedAssetVersions.length })
  }
  const rates: TimelineRate[] = [
    { numerator: 24, denominator: 1 }, { numerator: 25, denominator: 1 },
    { numerator: 30_000, denominator: 1_001 }, { numerator: 30, denominator: 1 },
    { numerator: 50, denominator: 1 }, { numerator: 60_000, denominator: 1_001 },
    { numerator: 60, denominator: 1 },
  ]
  for (const rate of rates) {
    const durationFrames = rationalSecondsToFrames({
      secondsNumerator: 2, secondsDenominator: 1, rate, rounding: 'nearest_half_up',
    })
    const rateAudio = { ...runtime.audioArtifact, timelineRate: rate, durationFrames }
    const request = buildExecutableSoundRequest({ runtime, job: 'trim_audio', rate, audioArtifacts: [rateAudio] })
    request.requestId = `sound-rate-${rate.numerator}-${rate.denominator}`
    request.idempotencyKey = `sound-rate-${rate.numerator}-${rate.denominator}`
    request.attemptId = `attempt-rate-${rate.numerator}-${rate.denominator}`
    request.sourceMediaRefs = []
    request.visualDependencies = []
    request.eventAnchors = []
    request.assignmentScope.authorizedAudioWriteRanges = [{
      rangeId: `duration-${rate.numerator}-${rate.denominator}`,
      startFrame: 0,
      endFrameExclusive: durationFrames,
    }]
    const plan = await service.plan(request)
    const result = await service.execute({
      schemaVersion: 'approved-sound-execution-package-v1',
      packageId: `rate-package-${rate.numerator}-${rate.denominator}`,
      approvedWorkItemId: `rate-work-${rate.numerator}-${rate.denominator}`,
      request,
      plannedResult: plan.controller.result,
      selectedRoute: plan.selectedRoute,
      selectedOptionalStepKeys: [],
      continuitySceneEvidence: plan.continuity.sceneEvidence,
    })
    assert.equal(result.status, 'completed')
    assert.equal(result.selectedAssetVersions[0]?.durationFrames, durationFrames)
    assert.equal(result.selectedAssetVersions[0]?.timelineRate?.numerator, rate.numerator)
    assert.equal(result.selectedAssetVersions[0]?.timelineRate?.denominator, rate.denominator)
  }
  const sourceHashAfter = createHash('sha256').update(await readFile(runtime.audioPath)).digest('hex')
  assert.equal(sourceHashAfter, sourceHashBefore)

  const replayRequest = buildExecutableSoundRequest({ runtime, job: 'trim_audio' })
  const replayPlan = await service.plan(replayRequest)
  const replayPackage: ApprovedSoundExecutionPackage = {
    schemaVersion: 'approved-sound-execution-package-v1', packageId: 'replay-package',
    approvedWorkItemId: 'replay-work', request: replayRequest,
    plannedResult: replayPlan.controller.result, selectedRoute: replayPlan.selectedRoute,
    selectedOptionalStepKeys: [], continuitySceneEvidence: replayPlan.continuity.sceneEvidence,
  }
  const first = await service.execute(replayPackage)
  const second = await service.execute(replayPackage)
  assert.equal(first.selectedAssetVersions[0]?.checksumSha256, second.selectedAssetVersions[0]?.checksumSha256)

  const directLocalPackage: SoundLocalAudioExecutionPackage = {
    schemaVersion: 'sound-local-audio-execution-v1',
    executionId: 'local-security-fixture',
    binding: {
      soundSkillVersion: replayRequest.soundSkillVersion,
      soundManifestHash: replayRequest.soundManifestHash,
      capabilityKey: replayPlan.controller.result.capabilityEntryKey,
      approvedPlanSnapshotId: replayRequest.executionAuthority.approvedPlanSnapshotId!,
      approvedPlanSnapshotHash: replayRequest.executionAuthority.approvedPlanSnapshotHash!,
      approvedWorkItemId: 'local-security-work',
      privateOutputScopeId: replayRequest.executionAuthority.privateOutputScopeId!,
      idempotencyKey: 'local-security-fixture',
      operationSpecHash: createHash('sha256').update('local-security-operation').digest('hex'),
      timelineRate: replayRequest.timelineRate,
      routeBinding: first.toolRouteBindings[0]!,
    },
    operation: 'trim_fade_gain',
    operationProfileKey: 'sound.trim-fade-gain.edit.v1',
    sources: [{ artifact: runtime.audioArtifact, absolutePath: runtime.audioPath }],
    approvedInputRoot: runtime.inputRoot,
    privateOutputRoot: runtime.outputRoot,
    outputRelativePath: '../escape.wav',
    outputArtifactId: 'unsafe-output',
    outputArtifactType: 'edited_audio_asset_version',
    outputContentType: 'audio/wav',
    parameters: { durationSeconds: 1, sampleRate: 48_000, channels: 2 },
  }
  await assert.rejects(runSoundLocalAudioExecution(directLocalPackage), /safe server-owned relative path/i)
  await assert.rejects(runSoundLocalAudioExecution({
    ...directLocalPackage,
    outputRelativePath: 'source.wav',
    privateOutputRoot: runtime.inputRoot,
  }), /must not overwrite an approved source/i)
  await assert.rejects(runSoundLocalAudioExecution({
    ...directLocalPackage,
    outputRelativePath: 'sound/safe.wav',
    arguments: ['-i', '/etc/passwd'],
  } as unknown as SoundLocalAudioExecutionPackage), /unsupported fields: arguments/i)

  const collisionSafePackage: SoundLocalAudioExecutionPackage = {
    ...directLocalPackage,
    executionId: 'local-idempotency-collision-fixture-a',
    outputRelativePath: 'sound/idempotency-collision.wav',
    outputArtifactId: 'idempotency-collision-output',
  }
  await runSoundLocalAudioExecution(collisionSafePackage)
  await assert.rejects(runSoundLocalAudioExecution({
    ...collisionSafePackage,
    executionId: 'local-idempotency-collision-fixture-b',
    binding: {
      ...collisionSafePackage.binding,
      operationSpecHash: createHash('sha256').update('different-approved-operation').digest('hex'),
    },
  }), /idempotency collision/i)

  const unsafe = buildExecutableSoundRequest({ runtime, job: 'trim_audio' })
  unsafe.sourceAudioRefs[0]!.checksumSha256 = '0'.repeat(64)
  unsafe.assignmentScope.sourceArtifactVersions = unsafe.assignmentScope.sourceArtifactVersions.map((value) =>
    value.artifactId === unsafe.sourceAudioRefs[0]!.artifactId
      ? { ...value, checksumSha256: '0'.repeat(64) } : value)
  const unsafePlan = await service.plan(unsafe)
  await assert.rejects(service.execute({
    schemaVersion: 'approved-sound-execution-package-v1', packageId: 'unsafe-package',
    approvedWorkItemId: 'unsafe-work', request: unsafe,
    plannedResult: unsafePlan.controller.result, selectedRoute: unsafePlan.selectedRoute,
    selectedOptionalStepKeys: [], continuitySceneEvidence: unsafePlan.continuity.sceneEvidence,
  }), /checksum mismatch/i)

  console.log(JSON.stringify({
    status: 'ok', operations: outcomes,
    exactArtifactDurationRates: rates.map((rate) => `${rate.numerator}/${rate.denominator}`),
    sourceUnchanged: true,
  }, null, 2))
} finally {
  await runtime.cleanup()
}
