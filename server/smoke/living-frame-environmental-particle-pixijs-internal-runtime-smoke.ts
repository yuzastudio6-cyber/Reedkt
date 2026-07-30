import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import {
  createLivingFrameVisualContinuityFixtures,
} from '../../src/lib/living-frame/living-frame-visual-continuity-fixtures'
import type {
  LivingFrameEnvironmentalParticleProfileId,
} from '../../src/types/living-frame-environmental-particle-kernel'
import type {
  LivingFrameEnvironmentalParticlePrivateRequestLease,
} from '../../src/types/living-frame-environmental-particle-operation-materialization'
import {
  LIVING_FRAME_ENVIRONMENTAL_PARTICLE_PIXIJS_INTERNAL_RUNTIME_VERSION,
} from '../../src/types/living-frame-environmental-particle-pixijs-internal-runtime'
import {
  compileLivingFrameEnvironmentalParticleKernel,
  type CompileLivingFrameEnvironmentalParticleKernelInput,
} from '../living-frame/living-frame-environmental-particle-kernel'
import {
  createLivingFrameEnvironmentalParticleOperationMaterialization,
} from '../living-frame/living-frame-environmental-particle-operation-materialization'
import {
  executeLivingFrameEnvironmentalParticlePixiJsInternalRuntime,
} from '../living-frame/living-frame-environmental-particle-pixijs-internal-runtime'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

const WIDTH = 3_840
const HEIGHT = 2_160
const START_FRAME = 20
const END_FRAME_EXCLUSIVE = 28
const fixtures =
  await createLivingFrameVisualContinuityFixtures()

const primaryInput = inputFor(
  'restrained_airborne_dust_settle_v1',
  'primary',
)
const primaryKernel =
  await compileLivingFrameEnvironmentalParticleKernel(
    primaryInput,
  )
const primaryMaterialization =
  await createLivingFrameEnvironmentalParticleOperationMaterialization({
    materializationCandidateId:
      'living-frame.environmental-pixijs-internal.primary',
    kernelCandidate: primaryKernel,
    kernelInput: primaryInput,
  })
const report =
  await executeLivingFrameEnvironmentalParticlePixiJsInternalRuntime({
    qualificationId:
      'living-frame.environmental-pixijs-internal.actual-v1',
    materialization:
      primaryMaterialization.receipt,
    privateRequestLease:
      primaryMaterialization.privateRequestLease,
    kernelCandidate: primaryKernel,
    kernelInput: primaryInput,
  })

assert.equal(
  report.contractVersion,
  LIVING_FRAME_ENVIRONMENTAL_PARTICLE_PIXIJS_INTERNAL_RUNTIME_VERSION,
)
assert.equal(report.runtimeIdentity.toolId, 'pixijs')
assert.equal(
  report.runtimeIdentity.operationId,
  'tool.pixijs.render_living_frame_environmental_particles.v1',
)
assert.equal(
  report.runtimeIdentity.packageVersion,
  '8.19.0',
)
assert.equal(
  report.runtimeIdentity.packageEntrypoint,
  'Application.init',
)
assert.equal(
  report.runtimeIdentity.actualPackageEntrypointExecuted,
  true,
)
assert.equal(
  report.runtimeIdentity
    .fixedSupervisedEntrypointExecuted,
  true,
)
assert.equal(
  report.runtimeIdentity.oneRequestOneAttemptVerified,
  true,
)
assert.equal(
  report.runtimeIdentity.zeroNetworkVerified,
  true,
)
assert.equal(
  report.sequenceIdentity.widthPixels,
  WIDTH,
)
assert.equal(
  report.sequenceIdentity.heightPixels,
  HEIGHT,
)
assert.equal(
  report.sequenceIdentity.frameImageCount,
  END_FRAME_EXCLUSIVE - START_FRAME,
)
assert.equal(
  report.sequenceIdentity.finalVideoCanvas,
  false,
)
assert.equal(
  report.aggregateMeasurement.firstFrameFullyTransparent,
  true,
)
assert.equal(
  report.aggregateMeasurement.lastFrameFullyTransparent,
  true,
)
assert.ok(
  report.aggregateMeasurement.activeFrameCount >= 2,
)
assert.equal(
  report.aggregateMeasurement.temporalVariationPresent,
  true,
)
assert.equal(
  report.aggregateMeasurement.alphaCentroidMovementPresent,
  true,
)
assert.equal(
  report.confinementEvidence.networkMode,
  'none',
)
assert.equal(
  report.confinementEvidence.readOnlyRootFilesystem,
  true,
)
assert.equal(
  report.confinementEvidence.capDropAll,
  true,
)
assert.equal(
  report.confinementEvidence.noNewPrivileges,
  true,
)
assert.equal(
  report.confinementEvidence.user,
  '10001:10001',
)
assert.equal(report.selectedSceneBound, false)
assert.equal(report.canonicalTimingBound, false)
assert.equal(report.operationRegistered, false)
assert.equal(report.canonicalDispatchIntegrated, false)
assert.equal(report.artifactPersisted, false)
assert.equal(report.assetManifestMutated, false)
assert.equal(report.rendererMutated, false)
assert.equal(report.qaApproved, false)
assert.equal(report.privateReviewApproved, false)
assert.equal(report.actualCostCreated, false)
assert.equal(report.customerCharged, false)
assert.equal(report.internalTestReady, true)
assert.equal(report.externalBetaReady, false)
assert.equal(report.productionReady, false)

const serializedReport = JSON.stringify(report)
for (const forbidden of [
  'bytesBase64',
  'pngBytes',
  'rgbaBytes',
  'stateTracks',
  'callerPrompt',
  'OPENAI_API_KEY',
  'https://',
  '/Users/',
]) {
  assert.equal(
    serializedReport.includes(forbidden),
    false,
  )
}

let adversarialAssertions = 0

await assert.rejects(
  executeLivingFrameEnvironmentalParticlePixiJsInternalRuntime({
    qualificationId:
      'living-frame.environmental-pixijs-internal.reuse',
    materialization:
      primaryMaterialization.receipt,
    privateRequestLease:
      primaryMaterialization.privateRequestLease,
    kernelCandidate: primaryKernel,
    kernelInput: primaryInput,
  }),
)
adversarialAssertions += 1

const extraInput = await createInputPair('extra')
await assert.rejects(
  executeLivingFrameEnvironmentalParticlePixiJsInternalRuntime({
    qualificationId:
      'living-frame.environmental-pixijs-internal.extra',
    materialization: extraInput.materialization.receipt,
    privateRequestLease:
      extraInput.materialization.privateRequestLease,
    kernelCandidate: extraInput.kernel,
    kernelInput: extraInput.kernelInput,
    callerDimensions: {
      widthPixels: 1_024,
      heightPixels: 1_024,
    },
  } as unknown as Parameters<
    typeof executeLivingFrameEnvironmentalParticlePixiJsInternalRuntime
  >[0]),
)
adversarialAssertions += 1

const clonedInput = await createInputPair('cloned')
const clonedLease = structuredClone(
  clonedInput.materialization.privateRequestLease,
) as LivingFrameEnvironmentalParticlePrivateRequestLease
await assert.rejects(
  executeLivingFrameEnvironmentalParticlePixiJsInternalRuntime({
    qualificationId:
      'living-frame.environmental-pixijs-internal.cloned',
    materialization:
      clonedInput.materialization.receipt,
    privateRequestLease: clonedLease,
    kernelCandidate: clonedInput.kernel,
    kernelInput: clonedInput.kernelInput,
  }),
)
adversarialAssertions += 1

const crossLeft = await createInputPair('cross-left')
const crossRight = await createInputPair('cross-right')
await assert.rejects(
  executeLivingFrameEnvironmentalParticlePixiJsInternalRuntime({
    qualificationId:
      'living-frame.environmental-pixijs-internal.cross',
    materialization:
      crossLeft.materialization.receipt,
    privateRequestLease:
      crossRight.materialization.privateRequestLease,
    kernelCandidate: crossLeft.kernel,
    kernelInput: crossLeft.kernelInput,
  }),
)
adversarialAssertions += 1

const forgedInput = await createInputPair('forged')
const forgedReceipt =
  structuredClone(forgedInput.materialization.receipt)
const forgedRoot = forgedReceipt as unknown as {
  renderEnvelope: {
    widthPixels: number
    heightPixels: number
    squareSubstitutionApplied: boolean
    finalCanvasClaimed: boolean
  }
}
forgedRoot.renderEnvelope.widthPixels = 1_024
forgedRoot.renderEnvelope.heightPixels = 1_024
forgedRoot.renderEnvelope.squareSubstitutionApplied = true
forgedRoot.renderEnvelope.finalCanvasClaimed = true
await assert.rejects(
  executeLivingFrameEnvironmentalParticlePixiJsInternalRuntime({
    qualificationId:
      'living-frame.environmental-pixijs-internal.forged',
    materialization: forgedReceipt,
    privateRequestLease:
      forgedInput.materialization.privateRequestLease,
    kernelCandidate: forgedInput.kernel,
    kernelInput: forgedInput.kernelInput,
  }),
)
adversarialAssertions += 1

const serverSource = readFileSync(
  fileURLToPath(new URL(
    '../living-frame/living-frame-environmental-particle-pixijs-internal-runtime.ts',
    import.meta.url,
  )),
  'utf8',
).toLowerCase()
for (const subjectTerm of [
  'helicopter',
  'musashi',
  'hormuz',
]) {
  assert.equal(serverSource.includes(subjectTerm), false)
}

process.stdout.write(
  `${JSON.stringify({
    status:
      'living_frame_environmental_particle_pixijs_internal_runtime_smoke_passed',
    imageId: report.imageEvidence.imageId,
    imageIdentityHash:
      report.imageEvidence.imageIdentityHash,
    packageVersion:
      report.runtimeIdentity.packageVersion,
    packageEntrypoint:
      report.runtimeIdentity.packageEntrypoint,
    frameImageCount:
      report.sequenceIdentity.frameImageCount,
    widthPixels:
      report.sequenceIdentity.widthPixels,
    heightPixels:
      report.sequenceIdentity.heightPixels,
    activeFrameCount:
      report.aggregateMeasurement.activeFrameCount,
    uniqueFramePngDigestCount:
      report.aggregateMeasurement
        .uniqueFramePngDigestCount,
    temporalVariationPresent:
      report.aggregateMeasurement
        .temporalVariationPresent,
    alphaCentroidMovementPresent:
      report.aggregateMeasurement
        .alphaCentroidMovementPresent,
    networkMode:
      report.confinementEvidence.networkMode,
    readOnlyRootFilesystem:
      report.confinementEvidence
        .readOnlyRootFilesystem,
    operationRegistered: report.operationRegistered,
    artifactPersisted: report.artifactPersisted,
    actualCostCreated: report.actualCostCreated,
    customerCharged: report.customerCharged,
    internalTestReady: report.internalTestReady,
    productionReady: report.productionReady,
    adversarialAssertions,
  })}\n`,
)

async function createInputPair(suffix: string) {
  const kernelInput = inputFor(
    'restrained_airborne_dust_settle_v1',
    suffix,
  )
  const kernel =
    await compileLivingFrameEnvironmentalParticleKernel(
      kernelInput,
    )
  const materialization =
    await createLivingFrameEnvironmentalParticleOperationMaterialization({
      materializationCandidateId:
        `living-frame.environmental-pixijs-internal.${suffix}`,
      kernelCandidate: kernel,
      kernelInput,
    })
  return {
    kernelInput,
    kernel,
    materialization,
  }
}

function inputFor(
  profileId:
    LivingFrameEnvironmentalParticleProfileId,
  suffix: string,
): CompileLivingFrameEnvironmentalParticleKernelInput {
  const visualContinuityPack = fixtures.musashi
  const sceneDesignSheet =
    visualContinuityPack.sceneDesignSheets[0]!
  return {
    kernelCandidateId:
      `living-frame.environmental-pixijs-internal.${suffix}`,
    profileId,
    sceneDesignSheetId:
      sceneDesignSheet.sceneDesignSheetId,
    environmentSheetId:
      sceneDesignSheet.environmentSheetIds[0]!,
    visualContinuityPack,
    frameBinding: {
      widthPixels: WIDTH,
      heightPixels: HEIGHT,
      fps: 30,
      startFrame: START_FRAME,
      endFrameExclusive: END_FRAME_EXCLUSIVE,
      emitterRect: {
        x: 0.05,
        y: 0.52,
        width: 0.9,
        height: 0.42,
      },
      anchorPoint: {
        x: 0.5,
        y: 0.72,
      },
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
