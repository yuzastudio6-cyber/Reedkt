import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import {
  createLivingFrameVisualContinuityFixtureDrafts,
  createLivingFrameVisualContinuityFixtures,
} from '../../src/lib/living-frame/living-frame-visual-continuity-fixtures'
import {
  createLivingFrameVisualContinuityPack,
} from '../../src/lib/living-frame/living-frame-visual-continuity-contract'
import {
  LIVING_FRAME_ENVIRONMENTAL_PARTICLE_PROFILE_IDS,
  type LivingFrameEnvironmentalParticleKernelCandidate,
  type LivingFrameEnvironmentalParticleProfileId,
} from '../../src/types/living-frame-environmental-particle-kernel'
import {
  compileLivingFrameEnvironmentalParticleKernel,
  LivingFrameEnvironmentalParticleKernelError,
  verifyLivingFrameEnvironmentalParticleKernel,
  type CompileLivingFrameEnvironmentalParticleKernelInput,
} from '../living-frame/living-frame-environmental-particle-kernel'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

const fixtures =
  await createLivingFrameVisualContinuityFixtures()
const drafts =
  createLivingFrameVisualContinuityFixtureDrafts()
const paperPack =
  await createLivingFrameVisualContinuityPack({
    ...drafts.musashi,
    styleBible: {
      ...drafts.musashi.styleBible,
      summary:
        'Controlled paper-collage style fixture.',
      assetTreatment: 'paper_collage',
      edgeTreatment: 'torn_paper',
      textureTreatment: 'paper',
      detailDensity: 'sparse',
    },
    environmentSheets:
      drafts.musashi.environmentSheets.map((sheet) => ({
        ...sheet,
        depthStyle: 'shallow_2_5d',
      })),
    sceneDesignSheets:
      drafts.musashi.sceneDesignSheets.map((sheet) => ({
        ...sheet,
        depthStyle: 'shallow_2_5d',
      })),
    motionLanguageSheet: {
      ...drafts.musashi.motionLanguageSheet,
      motionDensity: 'sparse',
      cameraCharacter: 'restrained_documentary',
    },
  })

const cinematicInput = inputFor(
  fixtures.musashi,
  'restrained_airborne_dust_settle_v1',
  'cinematic',
)
const cinematic =
  await compileLivingFrameEnvironmentalParticleKernel(
    cinematicInput,
  )
const paperInput = inputFor(
  paperPack,
  'restrained_airborne_dust_settle_v1',
  'paper',
)
const paper =
  await compileLivingFrameEnvironmentalParticleKernel(
    paperInput,
  )

assert.equal(
  await verifyLivingFrameEnvironmentalParticleKernel(
    cinematic,
    cinematicInput,
  ),
  true,
)
assert.deepEqual(
  await compileLivingFrameEnvironmentalParticleKernel(
    cinematicInput,
  ),
  cinematic,
)
assert.equal(
  cinematic.profileSelection.effectFamily,
  'airborne_dust',
)
assert.equal(
  cinematic.profileSelection.componentSummaryParsingUsed,
  false,
)
assert.equal(
  cinematic.profileSelection.subjectOrGenreRoutingUsed,
  false,
)
assert.equal(
  cinematic.visualContinuityBinding.assetTreatment,
  'cinematic_anime',
)
assert.equal(
  cinematic.visualContinuityBinding.depthStyle,
  'deep_multiplane',
)
assert.equal(
  cinematic.visualContinuityBinding.motionDensity,
  'balanced',
)
assert.equal(
  cinematic.typedProfile.particleCount,
  24,
)
assert.equal(
  cinematic.typedProfile.motionDensityParticleCap,
  32,
)
assert.equal(
  cinematic.typedProfile.motionBudgetRole,
  'ambient',
)
assert.equal(
  cinematic.visualContinuityBinding
    .ambientEffectDoesNotConsumePrimaryMotionSlot,
  true,
)
assert.equal(
  cinematic.typedProfile.appearance.colorRole,
  'background',
)
assert.equal(
  cinematic.typedProfile.appearance.colorHex,
  '#d8c9a8',
)
assert.equal(
  cinematic.exactFrameBinding.widthPixels,
  3_840,
)
assert.equal(
  cinematic.exactFrameBinding.heightPixels,
  2_160,
)
assert.equal(
  cinematic.exactFrameBinding.startFrame,
  20,
)
assert.equal(
  cinematic.exactFrameBinding.endFrameExclusive,
  64,
)
assert.equal(
  cinematic.deterministicStateSequence
    .stateTracks.length,
  24,
)
assert.ok(
  cinematic.deterministicStateSequence
    .frameStateCount > 0,
)
assert.equal(
  cinematic.deterministicStateSequence.noLoopingState,
  true,
)
assert.equal(
  cinematic.selectedSceneBound,
  false,
)
assert.equal(
  cinematic.canonicalTimingBound,
  false,
)
assert.equal(cinematic.operationRegistered, false)
assert.equal(cinematic.dispatchGranted, false)
assert.equal(cinematic.runtimeExecuted, false)
assert.equal(cinematic.productionReady, false)

assert.equal(
  paper.visualContinuityBinding.assetTreatment,
  'paper_collage',
)
assert.equal(
  paper.visualContinuityBinding.depthStyle,
  'shallow_2_5d',
)
assert.equal(
  paper.visualContinuityBinding.edgeTreatment,
  'torn_paper',
)
assert.equal(
  paper.visualContinuityBinding.textureTreatment,
  'paper',
)
assert.equal(
  paper.visualContinuityBinding.motionDensity,
  'sparse',
)
assert.equal(paper.typedProfile.particleCount, 12)
assert.equal(
  paper.typedProfile.motionDensityParticleCap,
  16,
)
assert.notEqual(
  paper.sourceBindings.visualContinuityPackDigestSha256,
  cinematic.sourceBindings
    .visualContinuityPackDigestSha256,
)

const profileCandidates:
  LivingFrameEnvironmentalParticleKernelCandidate[] = []
for (
  const profileId of
    LIVING_FRAME_ENVIRONMENTAL_PARTICLE_PROFILE_IDS
) {
  profileCandidates.push(
    await compileLivingFrameEnvironmentalParticleKernel(
      inputFor(fixtures.musashi, profileId, profileId),
    ),
  )
}
assert.equal(profileCandidates.length, 7)
assert.equal(
  new Set(profileCandidates.map(
    (candidate) =>
      candidate.profileSelection.effectFamily,
  )).size,
  7,
)
assert.equal(
  profileCandidates.every(
    (candidate) =>
      candidate.typedProfile.particleCount <=
        candidate.typedProfile.motionDensityParticleCap
      && candidate.deterministicStateSequence
        .stateTracks.every((track) => {
          const first = track.frameStates[0]
          const last =
            track.frameStates[
              track.frameStates.length - 1
            ]
          return first?.opacity === 0
            && last?.opacity === 0
        }),
  ),
  true,
)

const changedSeedInput = {
  ...cinematicInput,
  frameBinding: {
    ...cinematicInput.frameBinding,
    serverSeedDigestSha256:
      sha256AuthorityValue('different-server-seed'),
  },
}
const changedSeed =
  await compileLivingFrameEnvironmentalParticleKernel(
    changedSeedInput,
  )
assert.notEqual(
  changedSeed.deterministicStateSequence
    .sequenceDigestSha256,
  cinematic.deterministicStateSequence
    .sequenceDigestSha256,
)

let adversarialAssertions = 0

await assert.rejects(
  compileLivingFrameEnvironmentalParticleKernel({
    ...cinematicInput,
    profileId: 'caller_custom_profile',
  } as unknown as
    CompileLivingFrameEnvironmentalParticleKernelInput),
  (error: unknown) => hasIssue(error, 'input_invalid'),
)
adversarialAssertions += 1

await assert.rejects(
  compileLivingFrameEnvironmentalParticleKernel({
    ...cinematicInput,
    seed: 7,
  } as unknown as
    CompileLivingFrameEnvironmentalParticleKernelInput),
  (error: unknown) => hasIssue(error, 'input_invalid'),
)
adversarialAssertions += 1

await assert.rejects(
  compileLivingFrameEnvironmentalParticleKernel({
    ...cinematicInput,
    particleSettings: {
      count: 9_999,
      gravity: 99,
    },
  } as unknown as
    CompileLivingFrameEnvironmentalParticleKernelInput),
  (error: unknown) => hasIssue(error, 'input_invalid'),
)
adversarialAssertions += 1

await assert.rejects(
  compileLivingFrameEnvironmentalParticleKernel({
    ...cinematicInput,
    kernelCandidateId: 123,
  } as unknown as
    CompileLivingFrameEnvironmentalParticleKernelInput),
  (error: unknown) => hasIssue(error, 'input_invalid'),
)
adversarialAssertions += 1

await assert.rejects(
  compileLivingFrameEnvironmentalParticleKernel({
    ...cinematicInput,
    frameBinding: undefined,
  } as unknown as
    CompileLivingFrameEnvironmentalParticleKernelInput),
  (error: unknown) =>
    hasIssue(error, 'frame_binding_invalid'),
)
adversarialAssertions += 1

await assert.rejects(
  compileLivingFrameEnvironmentalParticleKernel({
    ...cinematicInput,
    frameBinding: {
      ...cinematicInput.frameBinding,
      confirmedOutputFrameRevalidationRequired: false,
    },
  } as unknown as
    CompileLivingFrameEnvironmentalParticleKernelInput),
  (error: unknown) =>
    hasIssue(error, 'frame_binding_invalid'),
)
adversarialAssertions += 1

await assert.rejects(
  compileLivingFrameEnvironmentalParticleKernel({
    ...cinematicInput,
    frameBinding: {
      ...cinematicInput.frameBinding,
      emitterRect: {
        x: 0.8,
        y: 0.8,
        width: 0.5,
        height: 0.5,
      },
    },
  }),
  (error: unknown) =>
    hasIssue(error, 'frame_binding_invalid'),
)
adversarialAssertions += 1

await assert.rejects(
  compileLivingFrameEnvironmentalParticleKernel({
    ...cinematicInput,
    frameBinding: {
      ...cinematicInput.frameBinding,
      endFrameExclusive:
        cinematicInput.frameBinding.startFrame + 601,
    },
  }),
  (error: unknown) =>
    hasIssue(error, 'frame_binding_invalid'),
)
adversarialAssertions += 1

const forgedPack = structuredClone(
  cinematicInput.visualContinuityPack,
)
const forgedPackRoot = forgedPack as unknown as {
  styleBible: { assetTreatment: string }
}
forgedPackRoot.styleBible.assetTreatment = 'vector'
await assert.rejects(
  compileLivingFrameEnvironmentalParticleKernel({
    ...cinematicInput,
    visualContinuityPack: forgedPack,
  }),
  (error: unknown) =>
    hasIssue(error, 'visual_continuity_pack_invalid'),
)
adversarialAssertions += 1

await assert.rejects(
  compileLivingFrameEnvironmentalParticleKernel({
    ...cinematicInput,
    environmentSheetId:
      fixtures.helicopter.environmentSheets[0]!
        .environmentSheetId,
  }),
  (error: unknown) =>
    hasIssue(error, 'environment_sheet_invalid'),
)
adversarialAssertions += 1

await assert.rejects(
  compileLivingFrameEnvironmentalParticleKernel({
    ...cinematicInput,
    frameBinding: {
      ...cinematicInput.frameBinding,
      serverSeedDigestSha256: 'caller-seed',
    },
  }),
  (error: unknown) =>
    hasIssue(error, 'frame_binding_invalid'),
)
adversarialAssertions += 1

const forgedCandidate = structuredClone(cinematic)
const forgedCandidateRoot =
  forgedCandidate as unknown as {
    dispatchGranted: boolean
  }
forgedCandidateRoot.dispatchGranted = true
assert.equal(
  await verifyLivingFrameEnvironmentalParticleKernel(
    forgedCandidate,
    cinematicInput,
  ),
  false,
)
adversarialAssertions += 1

const forgedState = structuredClone(cinematic)
const forgedStateRoot = forgedState as unknown as {
  deterministicStateSequence: {
    stateTracks: Array<{
      frameStates: Array<{ opacity: number }>
    }>
  }
}
forgedStateRoot.deterministicStateSequence
  .stateTracks[0]!.frameStates[0]!.opacity = 1
assert.equal(
  await verifyLivingFrameEnvironmentalParticleKernel(
    forgedState,
    cinematicInput,
  ),
  false,
)
adversarialAssertions += 1

const serverSource = readFileSync(
  fileURLToPath(new URL(
    '../living-frame/living-frame-environmental-particle-kernel.ts',
    import.meta.url,
  )),
  'utf8',
)
for (const forbiddenSubjectTerm of [
  'helicopter',
  'musashi',
  'hormuz',
]) {
  assert.equal(
    serverSource.toLowerCase().includes(
      forbiddenSubjectTerm,
    ),
    false,
  )
}
adversarialAssertions += 1

assert.equal(adversarialAssertions, 14)

process.stdout.write(
  `${JSON.stringify({
    status: 'passed',
    contractVersion: cinematic.contractVersion,
    profileCount: profileCandidates.length,
    effectFamilyCount:
      new Set(profileCandidates.map(
        (candidate) =>
          candidate.profileSelection.effectFamily,
      )).size,
    cinematicDepthStyle:
      cinematic.visualContinuityBinding.depthStyle,
    alternateDepthStyle:
      paper.visualContinuityBinding.depthStyle,
    balancedParticleCount:
      cinematic.typedProfile.particleCount,
    sparseParticleCount:
      paper.typedProfile.particleCount,
    deterministicReplay: true,
    selectedSceneBound: cinematic.selectedSceneBound,
    canonicalTimingBound: cinematic.canonicalTimingBound,
    operationRegistered: cinematic.operationRegistered,
    dispatchGranted: cinematic.dispatchGranted,
    productionReady: cinematic.productionReady,
    adversarialAssertions,
  })}\n`,
)

function inputFor(
  visualContinuityPack:
    CompileLivingFrameEnvironmentalParticleKernelInput['visualContinuityPack'],
  profileId: LivingFrameEnvironmentalParticleProfileId,
  suffix: string,
): CompileLivingFrameEnvironmentalParticleKernelInput {
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
      LivingFrameEnvironmentalParticleKernelError
    && error.issues.some((issue) =>
      issue.code === code)
}
