import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'

import type {
  LivingFrameAuraFaceCpuHostExecutionInput,
} from '../living-frame/living-frame-auraface-cpu-runtime'
import {
  LIVING_FRAME_AURAFACE_ATOMIC_MOUNT_OFFLINE_RUNNER_PROTOCOL,
  LIVING_FRAME_AURAFACE_ATOMIC_MOUNT_OFFLINE_RUNNER_RESPONSE_PROTOCOL,
  LIVING_FRAME_AURAFACE_OFFLINE_OPERATION,
  LIVING_FRAME_AURAFACE_OFFLINE_RUNNER_PROTOCOL,
  LIVING_FRAME_AURAFACE_OFFLINE_RUNNER_RESPONSE_PROTOCOL,
  LIVING_FRAME_AURAFACE_PREPROCESSING_SPEC_DIGEST,
  LivingFrameAuraFaceOfflineRunnerProtocolError,
  compileLivingFrameAuraFaceAtomicMountOfflineRunnerRequest,
  compileLivingFrameAuraFaceOfflineRunnerRequest,
  parseLivingFrameAuraFaceAtomicMountOfflineRunnerResponse,
  parseLivingFrameAuraFaceOfflineRunnerResponse,
} from '../living-frame/living-frame-auraface-offline-runner-protocol'

const sha = (value: Uint8Array | string): string =>
  createHash('sha256').update(value).digest('hex')

const pngBytes = Uint8Array.from([
  137, 80, 78, 71, 13, 10, 26, 10,
  ...Array.from({ length: 64 }, (_, index) => index),
])

const hostInput: LivingFrameAuraFaceCpuHostExecutionInput = {
  artifactRequirementSetDigestSha256: sha('requirements'),
  referenceImage: {
    contentType: 'image/png',
    contentSha256: sha(pngBytes),
    contentBytes: pngBytes,
  },
  candidateImage: {
    contentType: 'image/png',
    contentSha256: sha(pngBytes),
    contentBytes: pngBytes,
  },
  modelBindingPacketDigestSha256: sha('model-binding'),
  preprocessingSpecDigestSha256:
    LIVING_FRAME_AURAFACE_PREPROCESSING_SPEC_DIGEST,
  callerThresholdAccepted: false,
  identityApprovalRequested: false,
  externalNetworkAllowed: false,
  runtimeDownloadsAllowed: false,
}

const request =
  compileLivingFrameAuraFaceOfflineRunnerRequest(hostInput)
assert.equal(
  request.request.schemaVersion,
  LIVING_FRAME_AURAFACE_OFFLINE_RUNNER_PROTOCOL,
)
assert.equal(
  request.request.operationId,
  LIVING_FRAME_AURAFACE_OFFLINE_OPERATION,
)
assert.equal(
  request.request.payload.preprocessingSpecDigestSha256,
  LIVING_FRAME_AURAFACE_PREPROCESSING_SPEC_DIGEST,
)
assert.equal(
  request.request.payload.referenceImage.contentBytesBase64,
  Buffer.from(pngBytes).toString('base64'),
)
assert.equal(
  request.requestEnvelopeSha256,
  sha(request.requestJson),
)
assert.equal(
  Object.hasOwn(
    request.request.payload,
    'threshold',
  ),
  false,
)

const canonicalMountSessionDigestSha256 =
  sha('canonical-mount-session')
const atomicRequest =
  compileLivingFrameAuraFaceAtomicMountOfflineRunnerRequest({
    session: {
      artifactRequirementSetDigestSha256:
        hostInput.artifactRequirementSetDigestSha256,
      referenceImage: hostInput.referenceImage,
      candidateImage: hostInput.candidateImage,
      preprocessingSpecDigestSha256:
        hostInput.preprocessingSpecDigestSha256,
      callerThresholdAccepted: false,
      identityApprovalRequested: false,
      externalNetworkAllowed: false,
      runtimeDownloadsAllowed: false,
    },
    canonicalMountSessionDigestSha256,
  })
assert.equal(
  atomicRequest.request.schemaVersion,
  LIVING_FRAME_AURAFACE_ATOMIC_MOUNT_OFFLINE_RUNNER_PROTOCOL,
)
assert.equal(
  atomicRequest.request.payload
    .canonicalMountSessionDigestSha256,
  canonicalMountSessionDigestSha256,
)
assert.equal(
  Object.hasOwn(
    atomicRequest.request.payload,
    'modelBindingPacketDigestSha256',
  ),
  false,
)
assert.equal(
  atomicRequest.requestEnvelopeSha256,
  sha(atomicRequest.requestJson),
)

const referenceEmbedding = embeddingBytes(0)
const candidateEmbedding = embeddingBytes(1)
const response = completedResponse({
  requestEnvelopeSha256: request.requestEnvelopeSha256,
  referenceEmbedding,
  candidateEmbedding,
})
const parsed =
  parseLivingFrameAuraFaceOfflineRunnerResponse({
    responseJson: JSON.stringify(response),
    expectedRequestEnvelopeSha256:
      request.requestEnvelopeSha256,
  })
assert.equal(parsed.terminalState, 'completed')
assert.equal(parsed.detectorInferenceExecuted, true)
assert.equal(parsed.embeddingInferenceExecuted, true)
assert.equal(parsed.referenceEmbedding?.length, 512)
assert.equal(parsed.referenceEmbedding?.[0], 1)
assert.equal(parsed.candidateEmbedding?.[1], 1)
assert.equal(parsed.externalNetworkPerformed, false)
assert.equal(parsed.runtimeDownloadPerformed, false)

const atomicResponse = {
  ...response,
  schemaVersion:
    LIVING_FRAME_AURAFACE_ATOMIC_MOUNT_OFFLINE_RUNNER_RESPONSE_PROTOCOL,
  requestEnvelopeSha256:
    atomicRequest.requestEnvelopeSha256,
}
const atomicParsed =
  parseLivingFrameAuraFaceAtomicMountOfflineRunnerResponse({
    responseJson: JSON.stringify(atomicResponse),
    expectedRequestEnvelopeSha256:
      atomicRequest.requestEnvelopeSha256,
  })
assert.equal(atomicParsed.terminalState, 'completed')
assert.equal(atomicParsed.embeddingInferenceExecuted, true)
assert.throws(
  () => parseLivingFrameAuraFaceOfflineRunnerResponse({
    responseJson: JSON.stringify(atomicResponse),
    expectedRequestEnvelopeSha256:
      atomicRequest.requestEnvelopeSha256,
  }),
  LivingFrameAuraFaceOfflineRunnerProtocolError,
)
assert.throws(
  () => parseLivingFrameAuraFaceAtomicMountOfflineRunnerResponse({
    responseJson: JSON.stringify(response),
    expectedRequestEnvelopeSha256:
      request.requestEnvelopeSha256,
  }),
  LivingFrameAuraFaceOfflineRunnerProtocolError,
)

const review =
  parseLivingFrameAuraFaceOfflineRunnerResponse({
    responseJson: JSON.stringify({
      schemaVersion:
        LIVING_FRAME_AURAFACE_OFFLINE_RUNNER_RESPONSE_PROTOCOL,
      ok: true,
      operationId:
        LIVING_FRAME_AURAFACE_OFFLINE_OPERATION,
      packageIdentity: packageIdentity(),
      requestEnvelopeSha256:
        request.requestEnvelopeSha256,
      terminalState: 'user_review_required',
      failureCode: 'face_review_required',
      faceOutcome: 'candidate_no_face',
      attemptAccepted: true,
      detectorInferenceExecuted: true,
      embeddingInferenceExecuted: false,
      startedAt: '2026-07-29T12:00:00.000Z',
      finishedAt: '2026-07-29T12:00:00.200Z',
      externalNetworkPerformed: false,
      runtimeDownloadPerformed: false,
      thresholdApplied: false,
      identityDecisionCreated: false,
      productionReady: false,
    }),
    expectedRequestEnvelopeSha256:
      request.requestEnvelopeSha256,
  })
assert.equal(review.terminalState, 'user_review_required')
assert.equal(review.faceOutcome, 'candidate_no_face')
assert.equal(review.referenceEmbedding, undefined)

for (const mutation of [
  () => ({
    ...response,
    requestEnvelopeSha256: sha('wrong'),
  }),
  () => ({
    ...response,
    thresholdApplied: true,
  }),
  () => ({
    ...response,
    identityDecisionCreated: true,
  }),
  () => ({
    ...response,
    finishedAt: '2026-07-29T12:02:00.001Z',
  }),
  () => ({
    ...response,
    providerId: 'forbidden',
  }),
  () => ({
    ...response,
    embedding: {
      ...response.embedding,
      referenceDigestSha256: sha('wrong'),
    },
  }),
  () => ({
    ...response,
    embedding: {
      ...response.embedding,
      referenceFloat32LeBase64:
        Buffer.alloc(512 * 4).toString('base64'),
      referenceDigestSha256:
        sha(Buffer.alloc(512 * 4)),
    },
  }),
] as const) {
  assert.throws(
    () =>
      parseLivingFrameAuraFaceOfflineRunnerResponse({
        responseJson: JSON.stringify(mutation()),
        expectedRequestEnvelopeSha256:
          request.requestEnvelopeSha256,
      }),
    LivingFrameAuraFaceOfflineRunnerProtocolError,
  )
}

assert.throws(
  () =>
    compileLivingFrameAuraFaceOfflineRunnerRequest({
      ...hostInput,
      preprocessingSpecDigestSha256: sha('wrong'),
    }),
  LivingFrameAuraFaceOfflineRunnerProtocolError,
)
assert.throws(
  () =>
    compileLivingFrameAuraFaceOfflineRunnerRequest({
      ...hostInput,
      externalNetworkAllowed:
        true as unknown as false,
    }),
  LivingFrameAuraFaceOfflineRunnerProtocolError,
)

const runner = await readFile(
  'docker/prod/cpu-worker/auraface/runner.py',
  'utf8',
)
const dockerfile = await readFile(
  'docker/prod/cpu-worker/auraface/Dockerfile',
  'utf8',
)
const requirements = await readFile(
  'docker/prod/cpu-worker/auraface/requirements.lock.txt',
  'utf8',
)
assert.match(
  runner,
  /2660c1ec27667e691e9d1a84c0426fee[\s\S]*95ccde4ddd35470e485ff5dcd4c6d614/u,
)
assert.match(runner, /CPUExecutionProvider/u)
assert.match(runner, /DecompressionBombWarning/u)
assert.match(runner, /orientation != 1/u)
assert.match(runner, /identical_inputs/u)
assert.match(
  runner,
  /living-frame-auraface-atomic-mount-offline-runner-v2/u,
)
assert.match(runner, /canonicalMountSessionDigestSha256/u)
assert.doesNotMatch(
  runner,
  /(?:requests|urllib|urlopen|https?:\/\/|huggingface_hub)/u,
)
assert.doesNotMatch(runner, /FaceID|PuLID|inswapper/u)
assert.doesNotMatch(dockerfile, /curl|wget|git clone/u)
assert.doesNotMatch(
  dockerfile,
  /COPY .*\.onnx|ADD .*https?:/u,
)
assert.match(dockerfile, /test "\$\{TARGETARCH\}" = "amd64"/u)
assert.match(
  dockerfile,
  /com\.reeditpro\.runner\.platform="linux\/amd64"/u,
)
assert.match(requirements, /insightface==1\.0\.1/u)
assert.match(requirements, /onnxruntime==1\.28\.0/u)
assert.match(requirements, /opencv-python-headless==5\.0\.0\.93/u)
assert.equal(
  [...requirements.matchAll(/--hash=sha256:/gu)].length,
  23,
)

console.log(
  'Living Frame AuraFace offline runner protocol passed fixed request, private embedding response, no-face review, digest/norm, no threshold/identity decision, no runtime download, pinned package, and adversarial promotion checks.',
)

function embeddingBytes(index: number): Buffer {
  const buffer = Buffer.alloc(512 * 4)
  buffer.writeFloatLE(1, index * 4)
  return buffer
}

function completedResponse(input: {
  readonly requestEnvelopeSha256: string
  readonly referenceEmbedding: Buffer
  readonly candidateEmbedding: Buffer
}) {
  return {
    schemaVersion:
      LIVING_FRAME_AURAFACE_OFFLINE_RUNNER_RESPONSE_PROTOCOL,
    ok: true as const,
    operationId:
      LIVING_FRAME_AURAFACE_OFFLINE_OPERATION,
    packageIdentity: packageIdentity(),
    requestEnvelopeSha256:
      input.requestEnvelopeSha256,
    terminalState: 'completed' as const,
    failureCode: 'none' as const,
    faceOutcome: 'exactly_one_face_each' as const,
    attemptAccepted: true as const,
    detectorInferenceExecuted: true as const,
    embeddingInferenceExecuted: true as const,
    startedAt: '2026-07-29T12:00:00.000Z',
    finishedAt: '2026-07-29T12:00:00.250Z',
    referenceInferenceOutputDigestSha256:
      sha('reference-output'),
    candidateInferenceOutputDigestSha256:
      sha('candidate-output'),
    embedding: {
      dimension: 512 as const,
      referenceFloat32LeBase64:
        input.referenceEmbedding.toString('base64'),
      candidateFloat32LeBase64:
        input.candidateEmbedding.toString('base64'),
      referenceDigestSha256:
        sha(input.referenceEmbedding),
      candidateDigestSha256:
        sha(input.candidateEmbedding),
    },
    externalNetworkPerformed: false as const,
    runtimeDownloadPerformed: false as const,
    thresholdApplied: false as const,
    identityDecisionCreated: false as const,
    productionReady: false as const,
  }
}

function packageIdentity() {
  return {
    insightfaceVersion: '1.0.1' as const,
    onnxruntimeVersion: '1.28.0' as const,
    opencvHeadlessVersion: '5.0.0.93' as const,
    preprocessingSpecDigestSha256:
      LIVING_FRAME_AURAFACE_PREPROCESSING_SPEC_DIGEST,
  }
}
