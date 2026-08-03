import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { mkdtemp, mkdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import {
  InMemoryMireloAttemptStore,
  MIRELO_SFX_PROVIDER_PROFILE,
  MireloSfxProviderAdapter,
  MireloTransportFailure,
  MireloUnknownOutcomeError,
  type MireloGenerationRequest,
  type MireloTransport,
  type MireloTransportRequest,
  type MireloTransportResponse,
} from '../sound/mirelo-sfx-provider'
import {
  PrivateMireloCarrierAudioExtractor,
  PrivateMireloOutputIngestor,
} from '../sound/mirelo-private-artifacts'
import { soundSkillCapabilityManifest } from '../sound/sound-manifest'
import { admitSoundControllerRoute } from '../sound/sound-tool-views'
import { getSoundToolRouteManifest } from '../sound/sound-tool-route-manifest'
import { SOUND_MIRELO_RATE_CARD_SNAPSHOT } from '../sound/sound-rate-card'

const execFileAsync = promisify(execFile)
type Scenario =
  | 'text_success'
  | 'video_success'
  | 'provider_failure'
  | 'timeout'
  | 'async_unknown'
  | 'preflight_failure'
  | 'hostile_result_url'
  | 'hostile_upload_url'

class InjectedMireloTransport implements MireloTransport {
  readonly calls: MireloTransportRequest[] = []
  readonly submittedBodies: Record<string, unknown>[] = []
  jobGetCount = 0
  readonly scenario: Scenario
  readonly audioBytes: Uint8Array
  readonly carrierBytes: Uint8Array

  constructor(
    scenario: Scenario,
    audioBytes: Uint8Array,
    carrierBytes: Uint8Array,
  ) {
    this.scenario = scenario
    this.audioBytes = audioBytes
    this.carrierBytes = carrierBytes
  }

  async send(request: MireloTransportRequest): Promise<MireloTransportResponse> {
    this.calls.push(structuredClone(request))
    if (request.url.includes('/preflight')) {
      if (this.scenario === 'preflight_failure') return { status: 503, headers: {}, jsonBody: { error: 'unavailable' } }
      return { status: 200, headers: { 'content-type': 'application/json' }, jsonBody: { credits: 2, estimated_ms: 25 } }
    }
    if (request.url.endsWith('/v2/assets') && request.method === 'POST') {
      this.submittedBodies.push(request.jsonBody ?? {})
      return {
        status: 200,
        headers: { 'content-type': 'application/json' },
        jsonBody: {
          asset_id: 'asset-private-visual-1',
          upload_url: this.scenario === 'hostile_upload_url'
            ? 'https://attacker.example/private-visual-1'
            : 'https://uploads.mirelo.ai/private-visual-1',
        },
      }
    }
    if (request.url.startsWith('https://uploads.mirelo.ai/') && request.method === 'PUT') {
      assert.equal(request.headers.Authorization, undefined)
      assert.ok(request.byteBody && request.byteBody.byteLength > 0)
      return { status: 200, headers: {} }
    }
    if (request.url.endsWith('/v2/text-to-sfx/v1.6/sync') && request.method === 'POST') {
      this.submittedBodies.push(request.jsonBody ?? {})
      if (this.scenario === 'timeout') {
        throw new MireloTransportFailure('injected timeout', true, 'timeout')
      }
      if (this.scenario === 'provider_failure') {
        return { status: 400, headers: { 'content-type': 'application/json' }, jsonBody: { error: 'invalid request' } }
      }
      return {
        status: 200,
        headers: { 'content-type': 'application/json' },
        jsonBody: {
          result_urls: [this.scenario === 'hostile_result_url'
            ? 'https://attacker.example/candidate.wav'
            : 'https://cdn.mirelo.ai/candidate.wav'],
        },
      }
    }
    if (request.url.endsWith('/v2/video-to-sfx/v1.6/sync') && request.method === 'POST') {
      this.submittedBodies.push(request.jsonBody ?? {})
      return {
        status: 200,
        headers: { 'content-type': 'application/json' },
        jsonBody: { result_urls: ['https://cdn.mirelo.ai/carrier.mp4'] },
      }
    }
    if (request.url.endsWith('/v2/video-to-sfx/v1.6/jobs') && request.method === 'POST') {
      this.submittedBodies.push(request.jsonBody ?? {})
      return {
        status: 202,
        headers: { 'content-type': 'application/json' },
        jsonBody: {
          job_id: 'video-job-1',
          job_url: 'https://api.mirelo.ai/v2/text-to-sfx/v1.6/jobs/wrong-endpoint-must-not-be-used',
          estimated_ms: 40,
        },
      }
    }
    if (request.url.endsWith('/v2/video-to-sfx/v1.6/jobs/video-job-1') && request.method === 'GET') {
      this.jobGetCount += 1
      if (this.scenario === 'async_unknown' && this.jobGetCount === 1) {
        throw new MireloTransportFailure('poll timeout', true, 'timeout')
      }
      return {
        status: 200,
        headers: { 'content-type': 'application/json' },
        jsonBody: {
          status: 'succeeded',
          result_urls: ['https://cdn.mirelo.ai/candidate.wav'],
        },
      }
    }
    if (request.url === 'https://cdn.mirelo.ai/candidate.wav') {
      return { status: 200, headers: { 'content-type': 'audio/wav' }, byteBody: this.audioBytes }
    }
    if (request.url === 'https://cdn.mirelo.ai/carrier.mp4') {
      return { status: 200, headers: { 'content-type': 'video/mp4' }, byteBody: this.carrierBytes }
    }
    throw new Error(`Unexpected injected Mirelo request: ${request.method} ${request.url}`)
  }
}

const root = await mkdtemp(join(tmpdir(), 'reeditpro-mirelo-'))
const mediaRoot = join(root, 'private-media')
await mkdir(mediaRoot, { recursive: true, mode: 0o700 })
const wavPath = join(root, 'candidate.wav')
const mp4Path = join(root, 'carrier.mp4')

try {
  await execFileAsync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-nostdin', '-y',
    '-f', 'lavfi', '-i', 'sine=frequency=660:duration=1:sample_rate=48000',
    '-ac', '2', '-c:a', 'pcm_s24le', wavPath,
  ], { timeout: 30_000 })
  await execFileAsync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-nostdin', '-y',
    '-f', 'lavfi', '-i', 'color=c=black:s=160x90:d=1:r=30',
    '-f', 'lavfi', '-i', 'sine=frequency=880:duration=1:sample_rate=48000',
    '-shortest', '-c:v', 'mpeg4', '-c:a', 'aac', mp4Path,
  ], { timeout: 30_000 })
  const audioBytes = new Uint8Array(await readFile(wavPath))
  const carrierBytes = new Uint8Array(await readFile(mp4Path))
  const secret = ['sk', 'fixture', 'secret', 'never', 'persist'].join('-')
  const carrierRoute = getSoundToolRouteManifest('sound.route.generate.video_sfx.mirelo.v1')!
  const carrierRouteAdmission = admitSoundControllerRoute({
    routeKey: carrierRoute.routeKey,
    capabilityKey: 'sound.generate_video_conditioned_sfx',
    jobType: 'generate_video_conditioned_sfx',
    mode: 'planning',
    scope: 'range',
    availableInputKeys: [...carrierRoute.requiredInputs],
    availableQaKeys: [],
    runtimeStatuses: [],
    budgetApproved: true,
    rateCardSnapshotIds: { mirelo_sfx: SOUND_MIRELO_RATE_CARD_SNAPSHOT.rateCardSnapshotId },
    licenseEvidenceRefs: {
      mirelo_sfx: 'sound.license_evidence.mirelo_fixture_terms_only.v1',
      ffmpeg: 'sound.license_evidence.private_local_gpl_development_only.v1',
      ffprobe: 'sound.license_evidence.private_local_gpl_development_only.v1',
    },
    selectedOptionalStepKeys: ['extract_carrier_audio'],
  })
  assert.equal(carrierRouteAdmission.admitted, true, carrierRouteAdmission.reasons.join(','))
  const textRoute = getSoundToolRouteManifest('sound.route.generate.text_sfx.v1')!
  const textRouteAdmission = admitSoundControllerRoute({
    routeKey: textRoute.routeKey,
    capabilityKey: 'sound.generate_text_conditioned_sfx',
    jobType: 'generate_text_conditioned_sfx',
    mode: 'planning',
    scope: 'range',
    availableInputKeys: [...textRoute.requiredInputs],
    availableQaKeys: [],
    runtimeStatuses: [],
    budgetApproved: true,
    rateCardSnapshotIds: { mirelo_sfx: SOUND_MIRELO_RATE_CARD_SNAPSHOT.rateCardSnapshotId },
    licenseEvidenceRefs: {
      mirelo_sfx: 'sound.license_evidence.mirelo_fixture_terms_only.v1',
      ffmpeg: 'sound.license_evidence.private_local_gpl_development_only.v1',
    },
  })
  assert.equal(textRouteAdmission.admitted, true, textRouteAdmission.reasons.join(','))
  const binding = {
    soundSkillVersion: soundSkillCapabilityManifest.skillVersion,
    soundManifestHash: soundSkillCapabilityManifest.manifestHash,
    capabilityKey: 'sound.generate_video_conditioned_sfx',
    approvedPlanSnapshotId: 'approved-snapshot-mirelo',
    approvedPlanSnapshotHash: createHash('sha256').update('mirelo-snapshot').digest('hex'),
    approvedWorkItemId: 'approved-work-mirelo',
    privateOutputScopeId: 'mirelo-private-scope',
    idempotencyKey: 'carrier-local-idempotency',
    creditReservationId: 'credit-reservation-mirelo',
    routeBinding: carrierRouteAdmission.binding!,
  }
  const ingestor = new PrivateMireloOutputIngestor(mediaRoot, 'mirelo-private-scope')
  const carrierExtractor = new PrivateMireloCarrierAudioExtractor(mediaRoot, binding)

  function textRequest(suffix: string): MireloGenerationRequest {
    return {
      operation: 'text_to_sfx',
      requestId: `mirelo-text-${suffix}`,
      attemptId: `attempt-text-${suffix}`,
      idempotencyKey: `idempotency-text-${suffix}`,
      approvedPlanSnapshotId: 'approved-snapshot-mirelo',
      approvedPlanSnapshotHash: binding.approvedPlanSnapshotHash,
      creditReservationId: 'credit-reservation-mirelo',
      privateOutputScopeId: 'mirelo-private-scope',
      durationMs: 1_000,
      candidateCount: 1,
      maximumPreflightCredits: 10,
      timeoutMs: 5_000,
      privacyApproved: true,
      commercialTermsApproved: true,
      retentionApproved: true,
      routeBinding: textRouteAdmission.binding!,
      prompt: 'Restrained soft wooden contact, isolated sound effect, no voice, no music',
      loop: false,
    }
  }

  const successTransport = new InjectedMireloTransport('text_success', audioBytes, carrierBytes)
  const successStore = new InMemoryMireloAttemptStore()
  const successAdapter = new MireloSfxProviderAdapter(
    successTransport,
    async () => secret,
    successStore,
    ingestor,
    carrierExtractor,
  )
  const text = textRequest('success')
  const success = await successAdapter.generate(text)
  assert.equal(success.attempt.status, 'succeeded')
  assert.equal(success.outputArtifacts.length, 1)
  assert.equal(success.outputArtifacts[0]?.private, true)
  assert.equal(success.outputArtifacts[0]?.contentType, 'audio/wav')
  assert.equal(success.durableProviderUrlsPersisted, false)
  assert.deepEqual(success.attempt.providerCostEvidence, {
    preflightCredits: 2,
    estimatedMilliseconds: 25,
    generatedDurationMs: 1_000,
    candidateCount: 1,
  })
  const textBody = successTransport.submittedBodies[0]!
  assert.deepEqual(Object.keys(textBody).sort(), ['duration_ms', 'loop', 'num_samples', 'prompt'])
  assert.equal(textBody.duration_ms, 1_000)
  assert.equal(textBody.num_samples, 1)
  assert.equal(JSON.stringify(success).includes('https://'), false)
  assert.equal(JSON.stringify(success).includes(secret), false)
  const callsBeforeReplay = successTransport.calls.length
  const replay = await successAdapter.generate(text)
  assert.equal(replay.outputArtifacts[0]?.checksumSha256, success.outputArtifacts[0]?.checksumSha256)
  assert.equal(successTransport.calls.length, callsBeforeReplay)

  const videoTransport = new InjectedMireloTransport('video_success', audioBytes, carrierBytes)
  const videoAdapter = new MireloSfxProviderAdapter(
    videoTransport,
    async () => secret,
    new InMemoryMireloAttemptStore(),
    ingestor,
    carrierExtractor,
  )
  const videoRequest: MireloGenerationRequest = {
    operation: 'video_to_sfx',
    requestId: 'mirelo-video-success',
    attemptId: 'attempt-video-success',
    idempotencyKey: 'idempotency-video-success',
    approvedPlanSnapshotId: 'approved-snapshot-mirelo',
    approvedPlanSnapshotHash: binding.approvedPlanSnapshotHash,
    creditReservationId: 'credit-reservation-mirelo',
    privateOutputScopeId: 'mirelo-private-scope',
    durationMs: 1_000,
    candidateCount: 1,
    maximumPreflightCredits: 10,
    timeoutMs: 10_000,
    privacyApproved: true,
    commercialTermsApproved: true,
    retentionApproved: true,
    routeBinding: carrierRouteAdmission.binding!,
    privateVisualProxy: {
      bytes: carrierBytes,
      contentType: 'video/mp4',
      visualHash: createHash('sha256').update(carrierBytes).digest('hex'),
      artifactId: 'approved-private-visual-proxy',
      artifactVersion: 1,
      startOffsetMs: 0,
    },
    useAsyncJob: false,
  }
  const video = await videoAdapter.generate(videoRequest)
  assert.equal(video.attempt.status, 'succeeded')
  assert.equal(video.providerVisualRejected, true)
  assert.equal(video.outputArtifacts[0]?.contentType, 'audio/wav')
  assert.equal(JSON.stringify(video).includes('carrier.mp4'), false)
  const assetBody = videoTransport.submittedBodies[0]!
  assert.deepEqual(assetBody, { content_type: 'video/mp4' })
  const generationBody = videoTransport.submittedBodies[1]!
  assert.deepEqual(Object.keys(generationBody).sort(), [
    'duration_ms', 'num_samples', 'output', 'start_offset_ms', 'video',
  ])
  assert.equal(generationBody.output, 'audio')
  assert.deepEqual(generationBody.video, { type: 'asset', asset_id: 'asset-private-visual-1' })
  assert.equal(videoTransport.calls.some((call) => call.url.includes('/text-to-music/')), false)

  const tamperedTransport = new InjectedMireloTransport('video_success', audioBytes, carrierBytes)
  const tamperedAdapter = new MireloSfxProviderAdapter(
    tamperedTransport, async () => secret, new InMemoryMireloAttemptStore(), ingestor, carrierExtractor,
  )
  const tamperedVideoRequest: MireloGenerationRequest = {
    ...videoRequest,
    requestId: 'mirelo-video-tampered-hash',
    attemptId: 'attempt-video-tampered-hash',
    idempotencyKey: 'idempotency-video-tampered-hash',
    privateVisualProxy: {
      ...videoRequest.privateVisualProxy,
      visualHash: '0'.repeat(64),
    },
  }
  await assert.rejects(tamperedAdapter.generate(tamperedVideoRequest), /hash does not match/)
  assert.equal(tamperedTransport.calls.length, 0)

  const hostileUploadTransport = new InjectedMireloTransport('hostile_upload_url', audioBytes, carrierBytes)
  const hostileUploadStore = new InMemoryMireloAttemptStore()
  const hostileUploadAdapter = new MireloSfxProviderAdapter(
    hostileUploadTransport, async () => secret, hostileUploadStore, ingestor, carrierExtractor,
  )
  const hostileUploadRequest: MireloGenerationRequest = {
    ...videoRequest,
    requestId: 'mirelo-video-hostile-upload',
    attemptId: 'attempt-video-hostile-upload',
    idempotencyKey: 'idempotency-video-hostile-upload',
  }
  await assert.rejects(hostileUploadAdapter.generate(hostileUploadRequest), /network allowlist/)
  assert.equal(
    hostileUploadTransport.calls.some((call) => call.url.includes('attacker.example')),
    false,
  )
  assert.equal(
    (await hostileUploadStore.getByAttemptId(hostileUploadRequest.attemptId))?.status,
    'failed',
  )

  const hostileResultTransport = new InjectedMireloTransport('hostile_result_url', audioBytes, carrierBytes)
  const hostileResultStore = new InMemoryMireloAttemptStore()
  const hostileResultAdapter = new MireloSfxProviderAdapter(
    hostileResultTransport, async () => secret, hostileResultStore, ingestor, carrierExtractor,
  )
  const hostileResultRequest = textRequest('hostile-result-url')
  await assert.rejects(hostileResultAdapter.generate(hostileResultRequest), MireloUnknownOutcomeError)
  assert.equal(
    hostileResultTransport.calls.some((call) => call.url.includes('attacker.example')),
    false,
  )
  assert.equal(
    (await hostileResultStore.getByAttemptId(hostileResultRequest.attemptId))?.status,
    'unknown',
  )

  const missingRateBinding = structuredClone(textRouteAdmission.binding!)
  missingRateBinding.toolOperations = missingRateBinding.toolOperations.map((operation) =>
    operation.toolKey === 'mirelo_sfx'
      ? { ...operation, rateCardSnapshotId: 'sound.rate_snapshot.missing' }
      : operation)
  const missingRateTransport = new InjectedMireloTransport('text_success', audioBytes, carrierBytes)
  const missingRateAdapter = new MireloSfxProviderAdapter(
    missingRateTransport, async () => secret, new InMemoryMireloAttemptStore(), ingestor, carrierExtractor,
  )
  const missingRateRequest: MireloGenerationRequest = {
    ...textRequest('missing-rate-snapshot'),
    routeBinding: missingRateBinding,
  }
  await assert.rejects(missingRateAdapter.generate(missingRateRequest), /rate-card binding is missing/)
  assert.equal(missingRateTransport.calls.length, 0)

  const failedTransport = new InjectedMireloTransport('provider_failure', audioBytes, carrierBytes)
  const failedStore = new InMemoryMireloAttemptStore()
  const failedAdapter = new MireloSfxProviderAdapter(
    failedTransport, async () => secret, failedStore, ingestor, carrierExtractor,
  )
  const failedRequest = textRequest('known-failure')
  await assert.rejects(failedAdapter.generate(failedRequest), /generation failed/)
  const failedAttempt = await failedStore.getByAttemptId(failedRequest.attemptId)
  assert.equal(failedAttempt?.status, 'failed')
  assert.equal(failedAttempt?.reconciliationComplete, true)
  assert.equal(await failedAdapter.fallbackIsAllowed(failedRequest.attemptId), true)

  const preflightTransport = new InjectedMireloTransport('preflight_failure', audioBytes, carrierBytes)
  const preflightStore = new InMemoryMireloAttemptStore()
  const preflightAdapter = new MireloSfxProviderAdapter(
    preflightTransport, async () => secret, preflightStore, ingestor, carrierExtractor,
  )
  const preflightRequest = textRequest('preflight-failure')
  await assert.rejects(preflightAdapter.generate(preflightRequest), /preflight failed/)
  assert.equal((await preflightStore.getByAttemptId(preflightRequest.attemptId))?.submissionConfirmed, false)
  assert.equal(await preflightAdapter.fallbackIsAllowed(preflightRequest.attemptId), true)

  const timeoutTransport = new InjectedMireloTransport('timeout', audioBytes, carrierBytes)
  const timeoutStore = new InMemoryMireloAttemptStore()
  const timeoutAdapter = new MireloSfxProviderAdapter(
    timeoutTransport, async () => secret, timeoutStore, ingestor, carrierExtractor,
  )
  const timeoutRequest = textRequest('timeout')
  await assert.rejects(timeoutAdapter.generate(timeoutRequest), MireloUnknownOutcomeError)
  const callsAfterTimeout = timeoutTransport.calls.length
  await assert.rejects(timeoutAdapter.generate(timeoutRequest), MireloUnknownOutcomeError)
  assert.equal(timeoutTransport.calls.length, callsAfterTimeout)
  assert.equal((await timeoutStore.getByAttemptId(timeoutRequest.attemptId))?.status, 'unknown')
  assert.equal(await timeoutAdapter.fallbackIsAllowed(timeoutRequest.attemptId), false)
  await assert.rejects(timeoutAdapter.reconcile(timeoutRequest), MireloUnknownOutcomeError)

  const asyncTransport = new InjectedMireloTransport('async_unknown', audioBytes, carrierBytes)
  const asyncStore = new InMemoryMireloAttemptStore()
  const asyncAdapter = new MireloSfxProviderAdapter(
    asyncTransport, async () => secret, asyncStore, ingestor, carrierExtractor,
  )
  const asyncRequest: MireloGenerationRequest = {
    ...videoRequest,
    requestId: 'mirelo-video-async',
    attemptId: 'attempt-video-async',
    idempotencyKey: 'idempotency-video-async',
    useAsyncJob: true,
  }
  await assert.rejects(asyncAdapter.generate(asyncRequest), MireloUnknownOutcomeError)
  assert.equal((await asyncStore.getByAttemptId(asyncRequest.attemptId))?.providerJobId, 'video-job-1')
  assert.equal(await asyncAdapter.fallbackIsAllowed(asyncRequest.attemptId), false)
  const reconciled = await asyncAdapter.reconcile(asyncRequest)
  assert.equal(reconciled.status, 'succeeded')
  assert.equal(reconciled.outputArtifacts.length, 1)
  assert.equal(
    asyncTransport.calls.filter((call) => call.url.includes('/jobs/video-job-1')).every(
      (call) => call.url.endsWith('/v2/video-to-sfx/v1.6/jobs/video-job-1'),
    ),
    true,
  )
  assert.equal(JSON.stringify(reconciled).includes('result_urls'), false)

  assert.equal(MIRELO_SFX_PROVIDER_PROFILE.model, 'Mirelo SFX 1.6')
  assert.equal(MIRELO_SFX_PROVIDER_PROFILE.pricing.publicMireloCreditsPerGeneratedSecond, 10)
  assert.equal(MIRELO_SFX_PROVIDER_PROFILE.qualificationStatus, 'fixture_qualified')
  assert.ok(MIRELO_SFX_PROVIDER_PROFILE.productionBlockers.length > 0)
  const manifestRoute = soundSkillCapabilityManifest.toolRoutes.find(
    (route) => route.routeKey === 'sound.route.generate.video_sfx.mirelo.v1',
  )
  assert.equal(manifestRoute?.providerProfileKey, MIRELO_SFX_PROVIDER_PROFILE.profileKey)
  assert.equal(manifestRoute?.qualificationStatus, 'fixture_qualified')
  assert.equal(manifestRoute?.paid, true)

  process.stdout.write('Canonical Sound Mirelo SFX 1.6 provider smoke passed.\n')
} finally {
  await rm(root, { recursive: true, force: true })
}
