import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import {
  StandaloneCanonicalSoundSkillService,
  type ApprovedSoundExecutionPackage,
  type CanonicalSoundPlanResult,
} from '../edit-skills/sound'
import { soundSkillCapabilityManifest } from '../edit-skills/sound/sound-capability-manifest'
import {
  prepareBoundedPrivateVisualProxy,
  type BoundedSoundVisualProxyRequest,
} from '../sound/sound-bounded-visual-proxy'
import { validateSoundAudioFile } from '../sound/sound-local-audio-processor'
import { validateSoundResultAuthority } from '../sound/sound-scope-guard'
import { soundRange } from './sound-test-fixtures'
import {
  buildExecutableSoundRequest,
  createCanonicalSoundTestRuntime,
  createInjectedMireloAdapter,
} from './canonical-sound-test-runtime'

function executionPackage(
  plan: CanonicalSoundPlanResult,
  suffix: string,
): ApprovedSoundExecutionPackage {
  return {
    schemaVersion: 'approved-sound-execution-package-v1',
    packageId: `sound-e2e-${suffix}`,
    approvedWorkItemId: `sound-e2e-work-${suffix}`,
    request: plan.request,
    plannedResult: plan.controller.result,
    selectedRoute: plan.selectedRoute,
    selectedOptionalStepKeys: [],
    continuitySceneEvidence: plan.continuity.sceneEvidence,
  }
}

const runtime = await createCanonicalSoundTestRuntime()
const ntscRuntime = await createCanonicalSoundTestRuntime({ numerator: 30_000, denominator: 1_001 })
const filmRuntime = await createCanonicalSoundTestRuntime({ numerator: 24, denominator: 1 })

try {
  const localService = new StandaloneCanonicalSoundSkillService({ artifacts: runtime.resolver })
  assert.equal(localService.getCapabilityManifest().manifestHash, soundSkillCapabilityManifest.manifestHash)

  const exactRequest = buildExecutableSoundRequest({ runtime, job: 'trim_audio' })
  exactRequest.assignmentScope.authorizedAudioWriteRanges = [soundRange('exact-write', 0, 90)]
  const exactPlan = await localService.plan(exactRequest)
  const exactPackage = executionPackage(exactPlan, 'local-exact')
  const exactResult = await localService.execute(exactPackage)
  assert.equal(exactResult.status, 'completed')
  assert.equal(exactResult.selectedAssetVersions.length, 1)
  assert.equal(exactResult.modifiedAudioRanges[0]?.endFrameExclusive, 90)
  assert.equal(exactResult.modifiedVisualRanges.length, 0)
  assert.equal(exactResult.callerReceipt.authorityEscalated, false)
  assert.equal(exactResult.callerReceipt.finalRenderOwnedBySound, false)
  assert.equal(exactResult.callerReceipt.musicCompositionPerformed, false)
  assert.equal(exactResult.finalCompositionHandoff?.finalRenderOwnedBySound, false)
  assert.equal(validateSoundResultAuthority(exactRequest, exactResult).ok, true)
  const selected = await runtime.resolver.resolve(exactResult.selectedAssetVersions[0]!)
  const outputMedia = await validateSoundAudioFile(selected.absolutePath)
  assert.equal(outputMedia.sampleRate, 48_000)
  assert.equal(outputMedia.channels, 2)
  assert.equal(createHash('sha256').update(await readFile(selected.absolutePath)).digest('hex'),
    exactResult.selectedAssetVersions[0]!.checksumSha256)

  const qaResult = await localService.qa({ executionPackage: exactPackage })
  assert.notEqual(qaResult.qa.status, 'failed')
  assert.ok(qaResult.qa.technicalOutputQa.some((finding) => finding.key === 'technical.decode'))
  assert.ok(qaResult.qa.perceptualMaterialQa.every((finding) => finding.disposition === 'needs_review'))
  assert.equal(qaResult.continuity.wholeVideoReadOnly, true)

  const multiRequest = buildExecutableSoundRequest({ runtime, job: 'trim_audio' })
  multiRequest.assignmentScope.assignmentMode = 'multi_range'
  multiRequest.assignmentScope.authorizedAudioWriteRanges = [
    soundRange('multi-a', 0, 90), soundRange('multi-b', 120, 210),
  ]
  assert.equal((await localService.plan(multiRequest)).request.assignmentScope.authorizedAudioWriteRanges.length, 2)

  const wholeRequest = buildExecutableSoundRequest({ runtime, job: 'full_video_sound_pass', mode: 'planning' })
  wholeRequest.assignmentScope.assignmentMode = 'whole_video'
  wholeRequest.assignmentScope.inspectWholeVideo = true
  const wholePlan = await localService.plan(wholeRequest)
  assert.equal(wholePlan.continuity.wholeVideoReadOnly, true)
  assert.ok(Array.isArray(wholePlan.continuity.boundaryFindings))

  const peerView = localService.getPeerCapabilityView({
    callerType: 'transitions', callerSkillKey: 'transitions', jobType: 'support_transition_sound',
  })
  assert.equal(peerView.accepted, true)
  assert.equal(peerView.peerMayInvokeSoundToolsDirectly, false)
  assert.equal(peerView.peerMaySupplyProviderPayload, false)
  assert.equal(peerView.peerMayDispatchWorkers, false)

  const noSoundRequest = buildExecutableSoundRequest({ runtime, job: 'design_scene_sound', mode: 'planning' })
  noSoundRequest.eventAnchors = []
  noSoundRequest.costPolicy.allowProviderGeneration = false
  const noSoundPlan = await localService.plan(noSoundRequest)
  assert.equal(noSoundPlan.selectedRoute.routeKey, 'sound.route.no_sound.v1')
  const noSoundResult = await localService.execute(executionPackage(noSoundPlan, 'no-sound'))
  assert.equal(noSoundResult.status, 'no_sound')
  assert.equal(noSoundResult.selectedAssetVersions.length, 0)

  const revised = await localService.revise({
    request: exactRequest,
    previousResult: exactResult,
    invalidatedRanges: [soundRange('localized-revision', 0, 45)],
  })
  assert.equal(revised.status, 'planned')
  assert.equal(revised.cueManifest.version, exactResult.cueManifest.version + 1)
  assert.equal(revised.selectedAssetVersions.length, 0)
  assert.equal(revised.actualExecutionEvidence, undefined)

  const textFixture = createInjectedMireloAdapter({ runtime })
  const providerService = new StandaloneCanonicalSoundSkillService({
    artifacts: runtime.resolver,
    mirelo: textFixture.adapter,
  })
  const textRequest = buildExecutableSoundRequest({
    runtime, job: 'generate_text_conditioned_sfx', mode: 'fixture',
  })
  textRequest.latencyPolicy.allowAsyncProviderJob = false
  const textPlan = await providerService.plan(textRequest)
  assert.equal(textPlan.selectedRoute.routeKey, 'sound.route.generate.text_sfx.v1')
  const textResult = await providerService.execute(executionPackage(textPlan, 'mirelo-text'))
  assert.equal(textResult.status, 'completed', JSON.stringify(textResult.qaReport))
  assert.equal(textResult.providerStatus, 'succeeded')
  assert.equal(textResult.candidateAssetVersions.length, 1)
  assert.equal(textResult.selectedAssetVersions.length, 1)
  assert.equal(textResult.actualExecutionEvidence?.providerAttemptStatus, 'succeeded')
  assert.ok(textFixture.transport.calls.some((call) => call.url.endsWith('/v2/text-to-sfx/v1.6/sync')))

  const videoFixture = createInjectedMireloAdapter({ runtime: ntscRuntime })
  const videoService = new StandaloneCanonicalSoundSkillService({
    artifacts: ntscRuntime.resolver,
    mirelo: videoFixture.adapter,
  })
  const videoRequest = buildExecutableSoundRequest({
    runtime: ntscRuntime, job: 'generate_video_conditioned_sfx', mode: 'fixture',
  })
  videoRequest.latencyPolicy.allowAsyncProviderJob = false
  videoRequest.costPolicy.candidateCount = 1
  const videoPlan = await videoService.plan(videoRequest)
  assert.equal(videoPlan.selectedRoute.routeKey, 'sound.route.generate.video_sfx.mirelo.v1')
  const videoResult = await videoService.execute(executionPackage(videoPlan, 'mirelo-video'))
  assert.equal(videoResult.status, 'completed', JSON.stringify(videoResult.qaReport))
  assert.equal(videoResult.timelineRate.numerator, 30_000)
  assert.equal(videoResult.timelineRate.denominator, 1_001)
  assert.equal(videoResult.modifiedVisualRanges.length, 0)
  assert.equal(videoResult.finalCompositionHandoff?.finalRenderOwnedBySound, false)
  assert.ok(videoResult.actualExecutionEvidence?.stepEvidence.some((step) =>
    step.operationKey === 'prepare_bounded_private_visual_proxy' && step.status === 'completed'))
  assert.ok(videoFixture.transport.calls.some((call) =>
    call.url.endsWith('/v2/video-to-sfx/v1.6/sync')))
  assert.equal(videoFixture.transport.calls.some((call) => call.url.includes('/text-to-music/')), false)

  const filmSourceHash = createHash('sha256').update(await readFile(filmRuntime.videoPath)).digest('hex')
  const proxyRequest: BoundedSoundVisualProxyRequest = {
    schemaVersion: 'sound-bounded-visual-proxy-request-v1',
    executionId: 'sound-proxy-film-24',
    approvedSnapshotId: 'approved-snapshot-proxy-film',
    approvedSnapshotHash: createHash('sha256').update('approved-snapshot-proxy-film').digest('hex'),
    approvedWorkItemId: 'approved-work-proxy-film',
    privateOutputScopeId: 'private-sound-output-1',
    idempotencyKey: 'sound-proxy-film-idempotency',
    source: {
      artifact: filmRuntime.videoArtifact,
      absolutePath: filmRuntime.videoPath,
      visualVersion: filmRuntime.videoArtifact.version,
      visualHash: filmRuntime.videoArtifact.checksumSha256,
      expectedChecksumSha256: filmRuntime.videoArtifact.checksumSha256,
    },
    approvedInputRoot: filmRuntime.inputRoot,
    privateOutputRoot: filmRuntime.outputRoot,
    outputRelativePath: 'sound/proxy-film-24.mp4',
    outputArtifactId: 'bounded-proxy-film-24',
    eventRange: soundRange('proxy-event', 24, 48),
    authorizedSourceRange: soundRange('proxy-authority', 0, 72),
    preRollFrames: 12,
    postRollFrames: 6,
    timelineRate: { numerator: 24, denominator: 1 },
    timelineManifestRate: { numerator: 24, denominator: 1 },
    outputConstraints: {
      maximumWidth: 640, maximumHeight: 360, maximumBytes: 32 * 1024 * 1024,
      contentType: 'video/mp4', removeSourceAudio: true,
    },
    providerProfile: {
      providerKey: 'mirelo_sfx',
      providerProfileKey: 'sound.mirelo.video_sfx_1_6.v1',
      providerProfileVersion: '1.0.0',
    },
  }
  const filmProxy = await prepareBoundedPrivateVisualProxy(proxyRequest)
  assert.equal(filmProxy.sourceStartFrame, 12)
  assert.equal(filmProxy.sourceEndFrameExclusive, 54)
  assert.equal(filmProxy.proxyDurationFrames, 42)
  assert.equal(filmProxy.timelineRate.numerator, 24)
  assert.equal(filmProxy.proxyQaEvidence.audioRemoved, true)
  assert.equal(filmProxy.proxyQaEvidence.privatePermissionsVerified, true)
  assert.equal(filmProxy.noSourceOverwriteEvidence.sourceUnchanged, true)
  assert.equal(filmProxy.sourceVisualHash, filmRuntime.videoArtifact.checksumSha256)
  const filmReplay = await prepareBoundedPrivateVisualProxy(proxyRequest)
  assert.equal(filmReplay.idempotentReplay, true)
  assert.equal(filmReplay.checksumSha256, filmProxy.checksumSha256)
  assert.equal(createHash('sha256').update(await readFile(filmRuntime.videoPath)).digest('hex'), filmSourceHash)

  await assert.rejects(prepareBoundedPrivateVisualProxy({
    ...proxyRequest,
    executionId: 'proxy-bad-authority',
    outputRelativePath: 'sound/proxy-bad-authority.mp4',
    eventRange: soundRange('outside-authority', 3, 20),
  }), /exceed approved source authority/i)
  await assert.rejects(prepareBoundedPrivateVisualProxy({
    ...proxyRequest,
    executionId: 'proxy-bad-rate',
    outputRelativePath: 'sound/proxy-bad-rate.mp4',
    timelineManifestRate: { numerator: 25, denominator: 1 },
  }), /timeline manifest rate mismatch/i)
  await assert.rejects(prepareBoundedPrivateVisualProxy({
    ...proxyRequest,
    executionId: 'proxy-bad-visual-hash',
    outputRelativePath: 'sound/proxy-bad-visual-hash.mp4',
    source: { ...proxyRequest.source, visualHash: '0'.repeat(64) },
  }), /source visual hash mismatch/i)
  await assert.rejects(prepareBoundedPrivateVisualProxy({
    ...proxyRequest,
    executionId: 'proxy-bad-checksum',
    outputRelativePath: 'sound/proxy-bad-checksum.mp4',
    source: { ...proxyRequest.source, expectedChecksumSha256: '0'.repeat(64) },
  }), /source checksum mismatch/i)
  await assert.rejects(prepareBoundedPrivateVisualProxy({
    ...proxyRequest,
    executionId: 'proxy-path-traversal',
    outputRelativePath: '../proxy.mp4',
  }), /output path is unsafe/i)
  await assert.rejects(prepareBoundedPrivateVisualProxy({
    ...proxyRequest,
    executionId: 'proxy-source-overwrite',
    privateOutputRoot: filmRuntime.inputRoot,
    outputRelativePath: 'source.mp4',
  }), /cannot overwrite its source/i)

  console.log(JSON.stringify({
    status: 'ok',
    manifestHash: soundSkillCapabilityManifest.manifestHash,
    localArtifact: exactResult.selectedAssetVersions[0]?.artifactId,
    technicalQa: qaResult.qa.technicalOutputQa.length,
    noSound: noSoundResult.status,
    mireloText: textResult.actualExecutionEvidence?.providerAttemptStatus,
    mireloVideoRate: `${videoResult.timelineRate.numerator}/${videoResult.timelineRate.denominator}`,
    boundedProxy24Frames: filmProxy.proxyDurationFrames,
    finalRenderOwnedBySound: false,
  }, null, 2))
} finally {
  await Promise.all([runtime.cleanup(), ntscRuntime.cleanup(), filmRuntime.cleanup()])
}
