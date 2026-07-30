import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import {
  createLivingFrameVisualContinuityFixtures,
} from '../../src/lib/living-frame/living-frame-visual-continuity-fixtures'
import {
  LIVING_FRAME_ENVIRONMENTAL_PARTICLE_OPERATION_MATERIALIZATION_STATE,
  LIVING_FRAME_ENVIRONMENTAL_PARTICLE_OPERATION_MATERIALIZATION_VERSION,
  LIVING_FRAME_ENVIRONMENTAL_PARTICLE_PIXIJS_OPERATION_ID,
} from '../../src/types/living-frame-environmental-particle-operation-materialization'
import {
  LIVING_FRAME_ENVIRONMENTAL_PARTICLE_PROFILE_IDS,
  type LivingFrameEnvironmentalParticleProfileId,
} from '../../src/types/living-frame-environmental-particle-kernel'
import {
  OFFLINE_BROWSER_GRAPHICS_OPERATIONS,
} from '../tool-execution/browser-graphics-execution/offline-browser-graphics-protocol'
import {
  consumeLivingFrameEnvironmentalParticlePrivateRequestLease,
  createLivingFrameEnvironmentalParticleOperationMaterialization,
  LivingFrameEnvironmentalParticleOperationMaterializationError,
  verifyLivingFrameEnvironmentalParticleOperationMaterialization,
  type CreateLivingFrameEnvironmentalParticleOperationMaterializationInput,
} from '../living-frame/living-frame-environmental-particle-operation-materialization'
import {
  compileLivingFrameEnvironmentalParticleKernel,
  type CompileLivingFrameEnvironmentalParticleKernelInput,
} from '../living-frame/living-frame-environmental-particle-kernel'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

const fixtures =
  await createLivingFrameVisualContinuityFixtures()
const kernelInput = inputFor(
  'restrained_airborne_dust_settle_v1',
  'primary',
)
const kernelCandidate =
  await compileLivingFrameEnvironmentalParticleKernel(
    kernelInput,
  )
const materializationInput = {
  materializationCandidateId:
    'living-frame.environmental-pixijs-request.primary',
  kernelCandidate,
  kernelInput,
} satisfies
  CreateLivingFrameEnvironmentalParticleOperationMaterializationInput

const materialization =
  await createLivingFrameEnvironmentalParticleOperationMaterialization(
    materializationInput,
  )
const { receipt, privateRequestLease } =
  materialization

assert.equal(
  receipt.contractVersion,
  LIVING_FRAME_ENVIRONMENTAL_PARTICLE_OPERATION_MATERIALIZATION_VERSION,
)
assert.equal(
  receipt.materializationState,
  LIVING_FRAME_ENVIRONMENTAL_PARTICLE_OPERATION_MATERIALIZATION_STATE,
)
assert.equal(
  verifyLivingFrameEnvironmentalParticleOperationMaterialization(
    receipt,
  ),
  true,
)
assert.equal(
  receipt.sourceBindings.kernelCandidateDigestSha256,
  kernelCandidate.kernelCandidateDigestSha256,
)
assert.equal(
  receipt.sourceBindings
    .deterministicStateSequenceDigestSha256,
  kernelCandidate.deterministicStateSequence
    .sequenceDigestSha256,
)
assert.equal(receipt.renderEnvelope.widthPixels, 3_840)
assert.equal(receipt.renderEnvelope.heightPixels, 2_160)
assert.equal(receipt.renderEnvelope.startFrame, 20)
assert.equal(receipt.renderEnvelope.endFrameExclusive, 64)
assert.equal(receipt.renderEnvelope.durationFrames, 44)
assert.equal(
  receipt.renderEnvelope.transparentFrameSequenceRequested,
  true,
)
assert.equal(
  receipt.renderEnvelope.exactConfirmedOutputFramePreserved,
  true,
)
assert.equal(
  receipt.renderEnvelope.squareSubstitutionApplied,
  false,
)
assert.equal(receipt.renderEnvelope.finalCanvasClaimed, false)
assert.equal(
  receipt.operationDisposition.candidateOperationId,
  LIVING_FRAME_ENVIRONMENTAL_PARTICLE_PIXIJS_OPERATION_ID,
)
assert.equal(
  receipt.operationDisposition.separateToolIdentityRequired,
  false,
)
assert.equal(
  receipt.operationDisposition.registryExpansionRequired,
  false,
)
assert.equal(
  receipt.operationDisposition.operationRegistered,
  false,
)
assert.equal(
  receipt.operationDisposition.dispatchable,
  false,
)
assert.equal(
  receipt.operationDisposition.remotionRemainsFinalCanvas,
  true,
)
assert.equal(receipt.selectedSceneBound, false)
assert.equal(receipt.canonicalTimingBound, false)
assert.equal(receipt.operationRegistered, false)
assert.equal(receipt.dispatched, false)
assert.equal(receipt.runtimeExecuted, false)
assert.equal(receipt.artifactPersisted, false)
assert.equal(receipt.actualCostCreated, false)
assert.equal(receipt.customerCharged, false)
assert.equal(receipt.productionReady, false)

const serializedReceipt = JSON.stringify(receipt)
assert.equal(serializedReceipt.includes('stateTracks'), false)
assert.equal(serializedReceipt.includes('mediaBytes'), true)
assert.equal(serializedReceipt.includes('bytesBase64'), false)
assert.equal(serializedReceipt.includes('/Users/'), false)
assert.equal(serializedReceipt.includes('https://'), false)

assert.notEqual(
  OFFLINE_BROWSER_GRAPHICS_OPERATIONS.pixijs,
  LIVING_FRAME_ENVIRONMENTAL_PARTICLE_PIXIJS_OPERATION_ID,
)

const privateRequest =
  consumeLivingFrameEnvironmentalParticlePrivateRequestLease(
    privateRequestLease,
  )
assert.equal(
  sha256AuthorityValue(privateRequest),
  receipt.requestReceipt.privateRequestDigestSha256,
)
assert.equal(
  privateRequest.operationId,
  LIVING_FRAME_ENVIRONMENTAL_PARTICLE_PIXIJS_OPERATION_ID,
)
assert.equal(
  privateRequest.renderCanvas.widthPixels,
  receipt.renderEnvelope.widthPixels,
)
assert.equal(
  privateRequest.renderCanvas.heightPixels,
  receipt.renderEnvelope.heightPixels,
)
assert.equal(
  privateRequest.renderCanvas.backgroundMode,
  'transparent',
)
assert.equal(
  privateRequest.renderCanvas.alphaMode,
  'straight_alpha_png',
)
assert.equal(
  privateRequest.renderCanvas.finalVideoCanvas,
  false,
)
assert.equal(
  privateRequest.deterministicStateSequence
    .sequenceDigestSha256,
  kernelCandidate.deterministicStateSequence
    .sequenceDigestSha256,
)
assert.equal(
  privateRequest.deterministicStateSequence
    .stateTracks.length,
  kernelCandidate.typedProfile.particleCount,
)
assert.equal(
  privateRequest.outputPolicy.logicalBundleCount,
  1,
)
assert.equal(
  privateRequest.outputPolicy.frameImageCount,
  44,
)
assert.equal(
  privateRequest.outputPolicy
    .generatedPrimitiveRemainsInputToRemotion,
  true,
)
assert.equal(
  privateRequest.outputPolicy.remotionOwnsFinalComposition,
  true,
)
assert.equal(
  privateRequest.supervisedRendererPolicy.packageName,
  'pixi.js',
)
assert.equal(
  privateRequest.supervisedRendererPolicy.packageVersion,
  '8.19.0',
)
assert.equal(
  privateRequest.supervisedRendererPolicy.packageEntrypoint,
  'Application.init',
)
assert.equal(
  privateRequest.supervisedRendererPolicy.networkAllowed,
  false,
)
assert.equal(
  privateRequest.supervisedRendererPolicy.callerCodeAllowed,
  false,
)
assert.equal(
  privateRequest.supervisedRendererPolicy
    .arbitrarySaveOrPreviewAllowed,
  false,
)
assert.equal(privateRequest.dispatchAuthority, false)
assert.equal(privateRequest.runtimeAuthority, false)
assert.equal(privateRequest.artifactAuthority, false)
assert.equal(privateRequest.finalCanvasAuthority, false)
assert.equal(privateRequest.costAuthority, false)
assert.equal(privateRequest.billingAuthority, false)
assert.equal(privateRequest.productionReady, false)

let adversarialAssertions = 0

assert.throws(
  () =>
    consumeLivingFrameEnvironmentalParticlePrivateRequestLease(
      privateRequestLease,
    ),
  (error: unknown) => hasIssue(error, 'lease_reused'),
)
adversarialAssertions += 1

const clonedLease = structuredClone(privateRequestLease)
assert.throws(
  () =>
    consumeLivingFrameEnvironmentalParticlePrivateRequestLease(
      clonedLease,
    ),
  (error: unknown) => hasIssue(error, 'lease_reused'),
)
adversarialAssertions += 1

await assert.rejects(
  createLivingFrameEnvironmentalParticleOperationMaterialization({
    ...materializationInput,
    materializationCandidateId: 7,
  } as unknown as
    CreateLivingFrameEnvironmentalParticleOperationMaterializationInput),
  (error: unknown) => hasIssue(error, 'input_invalid'),
)
adversarialAssertions += 1

await assert.rejects(
  createLivingFrameEnvironmentalParticleOperationMaterialization({
    ...materializationInput,
    operationId:
      LIVING_FRAME_ENVIRONMENTAL_PARTICLE_PIXIJS_OPERATION_ID,
  } as unknown as
    CreateLivingFrameEnvironmentalParticleOperationMaterializationInput),
  (error: unknown) => hasIssue(error, 'input_invalid'),
)
adversarialAssertions += 1

await assert.rejects(
  createLivingFrameEnvironmentalParticleOperationMaterialization({
    ...materializationInput,
    widthPixels: 1_024,
    heightPixels: 1_024,
  } as unknown as
    CreateLivingFrameEnvironmentalParticleOperationMaterializationInput),
  (error: unknown) => hasIssue(error, 'input_invalid'),
)
adversarialAssertions += 1

const mismatchedKernelInput = structuredClone(kernelInput)
const mismatchedKernelInputRoot =
  mismatchedKernelInput as unknown as {
    frameBinding: {
      serverSeedDigestSha256: string
    }
  }
mismatchedKernelInputRoot.frameBinding
  .serverSeedDigestSha256 =
    sha256AuthorityValue('cross-kernel-seed')
await assert.rejects(
  createLivingFrameEnvironmentalParticleOperationMaterialization({
    ...materializationInput,
    kernelInput: mismatchedKernelInput,
  }),
  (error: unknown) =>
    hasIssue(error, 'kernel_candidate_invalid'),
)
adversarialAssertions += 1

const forgedKernel = structuredClone(kernelCandidate)
const forgedKernelRoot = forgedKernel as unknown as {
  dispatchGranted: boolean
}
forgedKernelRoot.dispatchGranted = true
await assert.rejects(
  createLivingFrameEnvironmentalParticleOperationMaterialization({
    ...materializationInput,
    kernelCandidate: forgedKernel,
  }),
  (error: unknown) =>
    hasIssue(error, 'kernel_candidate_invalid'),
)
adversarialAssertions += 1

const forgedReceipt = structuredClone(receipt)
const forgedReceiptRoot = forgedReceipt as unknown as {
  dispatched: boolean
}
forgedReceiptRoot.dispatched = true
assert.equal(
  verifyLivingFrameEnvironmentalParticleOperationMaterialization(
    forgedReceipt,
  ),
  false,
)
adversarialAssertions += 1

const forgedCanvas = structuredClone(receipt)
const forgedCanvasRoot = forgedCanvas as unknown as {
  renderEnvelope: {
    widthPixels: number
    heightPixels: number
    squareSubstitutionApplied: boolean
  }
}
forgedCanvasRoot.renderEnvelope.widthPixels = 1_024
forgedCanvasRoot.renderEnvelope.heightPixels = 1_024
forgedCanvasRoot.renderEnvelope.squareSubstitutionApplied = true
assert.equal(
  verifyLivingFrameEnvironmentalParticleOperationMaterialization(
    forgedCanvas,
  ),
  false,
)
adversarialAssertions += 1

const forgedFinalCanvas = structuredClone(receipt)
const forgedFinalCanvasRoot =
  forgedFinalCanvas as unknown as {
    renderEnvelope: { finalCanvasClaimed: boolean }
  }
forgedFinalCanvasRoot.renderEnvelope.finalCanvasClaimed = true
assert.equal(
  verifyLivingFrameEnvironmentalParticleOperationMaterialization(
    forgedFinalCanvas,
  ),
  false,
)
adversarialAssertions += 1

for (
  const [
    order,
    profileId,
  ] of LIVING_FRAME_ENVIRONMENTAL_PARTICLE_PROFILE_IDS
    .entries()
) {
  const profileKernelInput =
    inputFor(profileId, `profile-${order}`)
  const profileKernel =
    await compileLivingFrameEnvironmentalParticleKernel(
      profileKernelInput,
    )
  const profileMaterialization =
    await createLivingFrameEnvironmentalParticleOperationMaterialization({
      materializationCandidateId:
        `living-frame.environmental-pixijs-request.profile-${order}`,
      kernelCandidate: profileKernel,
      kernelInput: profileKernelInput,
    })
  assert.equal(
    profileMaterialization.receipt.renderEnvelope.profileId,
    profileId,
  )
  assert.equal(
    profileMaterialization.receipt.operationRegistered,
    false,
  )
  assert.equal(
    profileMaterialization.receipt.productionReady,
    false,
  )
}

const serverSource = readFileSync(
  fileURLToPath(new URL(
    '../living-frame/living-frame-environmental-particle-operation-materialization.ts',
    import.meta.url,
  )),
  'utf8',
).toLowerCase()
for (const forbiddenSubjectTerm of [
  'helicopter',
  'musashi',
  'hormuz',
]) {
  assert.equal(
    serverSource.includes(forbiddenSubjectTerm),
    false,
  )
}
adversarialAssertions += 1

assert.equal(adversarialAssertions, 11)

process.stdout.write(
  `${JSON.stringify({
    status: 'passed',
    contractVersion: receipt.contractVersion,
    requestVersion: privateRequest.schemaVersion,
    profileCount:
      LIVING_FRAME_ENVIRONMENTAL_PARTICLE_PROFILE_IDS.length,
    widthPixels: receipt.renderEnvelope.widthPixels,
    heightPixels: receipt.renderEnvelope.heightPixels,
    frameImageCount:
      privateRequest.outputPolicy.frameImageCount,
    stateTrackCount:
      receipt.requestReceipt.stateTrackCount,
    serializedPrivateRequestByteLength:
      receipt.requestReceipt
        .serializedPrivateRequestByteLength,
    processBoundLeaseConsumed: true,
    operationRegistered: receipt.operationRegistered,
    dispatchGranted: receipt.dispatched,
    runtimeExecuted: receipt.runtimeExecuted,
    artifactPersisted: receipt.artifactPersisted,
    finalCanvasClaimed:
      receipt.renderEnvelope.finalCanvasClaimed,
    productionReady: receipt.productionReady,
    adversarialAssertions,
  })}\n`,
)

function inputFor(
  profileId:
    LivingFrameEnvironmentalParticleProfileId,
  suffix: string,
): CompileLivingFrameEnvironmentalParticleKernelInput {
  const visualContinuityPack = fixtures.musashi
  const sceneDesignSheet =
    visualContinuityPack.sceneDesignSheets[0]!
  const environmentSheetId =
    sceneDesignSheet.environmentSheetIds[0]!
  return {
    kernelCandidateId:
      `living-frame.environmental-kernel.${suffix}`,
    profileId,
    sceneDesignSheetId:
      sceneDesignSheet.sceneDesignSheetId,
    environmentSheetId,
    visualContinuityPack,
    frameBinding: {
      widthPixels: 3_840,
      heightPixels: 2_160,
      fps: 30,
      startFrame: 20,
      endFrameExclusive: 64,
      emitterRect: {
        x: 0.05,
        y: 0.52,
        width: 0.9,
        height: 0.42,
      },
      anchorPoint: { x: 0.5, y: 0.72 },
      confirmedOutputFrameDigestSha256:
        sha256AuthorityValue(
          `confirmed-output-frame-${suffix}`,
        ),
      masterTimingDigestSha256:
        sha256AuthorityValue(
          `master-timing-${suffix}`,
        ),
      serverSeedDigestSha256:
        sha256AuthorityValue(
          `server-seed-${suffix}`,
        ),
      confirmedOutputFrameRevalidationRequired: true,
      masterTimingRevalidationRequired: true,
    },
  }
}

function hasIssue(
  error: unknown,
  code: string,
): boolean {
  return error instanceof
      LivingFrameEnvironmentalParticleOperationMaterializationError
    && error.issues.some((issue) =>
      issue.code === code)
}
