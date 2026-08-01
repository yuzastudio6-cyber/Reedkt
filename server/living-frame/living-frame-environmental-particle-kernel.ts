import type {
  LivingFrameVisualContinuityColor,
  LivingFrameVisualContinuityColorRole,
  LivingFrameVisualContinuityMotionDensity,
  LivingFrameVisualContinuityPack,
} from '../../src/types/living-frame-visual-continuity'
import {
  LIVING_FRAME_ENVIRONMENTAL_PARTICLE_KERNEL_CLASS,
  LIVING_FRAME_ENVIRONMENTAL_PARTICLE_KERNEL_OPEN_GATES,
  LIVING_FRAME_ENVIRONMENTAL_PARTICLE_KERNEL_STATE,
  LIVING_FRAME_ENVIRONMENTAL_PARTICLE_KERNEL_VERSION,
  LIVING_FRAME_ENVIRONMENTAL_PARTICLE_PROFILE_IDS,
  type LivingFrameEnvironmentalParticleAppearance,
  type LivingFrameEnvironmentalParticleEffectFamily,
  type LivingFrameEnvironmentalParticleEmitterShape,
  type LivingFrameEnvironmentalParticleFrameState,
  type LivingFrameEnvironmentalParticleInitialState,
  type LivingFrameEnvironmentalParticleKernelAuthority,
  type LivingFrameEnvironmentalParticleKernelCandidate,
  type LivingFrameEnvironmentalParticleKernelCandidateDraft,
  type LivingFrameEnvironmentalParticleKernelFrameBinding,
  type LivingFrameEnvironmentalParticleKernelIssue,
  type LivingFrameEnvironmentalParticleKernelIssueCode,
  type LivingFrameEnvironmentalParticlePhysics,
  type LivingFrameEnvironmentalParticleProfileId,
  type LivingFrameEnvironmentalParticleShape,
  type LivingFrameEnvironmentalParticleStateTrack,
  type LivingFrameEnvironmentalParticleVector,
} from '../../src/types/living-frame-environmental-particle-kernel'
import {
  validateLivingFrameVisualContinuityPack,
} from '../../src/lib/living-frame/living-frame-visual-continuity-contract'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const HEX = /^#[a-f0-9]{6}$/iu
const MAX_EFFECT_DURATION_FRAMES = 600

const PROFILE_IDS =
  new Set<LivingFrameEnvironmentalParticleProfileId>(
    LIVING_FRAME_ENVIRONMENTAL_PARTICLE_PROFILE_IDS,
  )

const AUTHORITY_BOUNDARY:
  LivingFrameEnvironmentalParticleKernelAuthority =
  deepFreeze({
    typedProfileCatalogAuthority: true,
    deterministicSamplingKernelAuthority: true,
    selectedSceneAuthority: false,
    environmentalProfileSelectionAuthority: false,
    visualContinuityPackAuthority: false,
    timingAuthority: false,
    motionBudgetAuthority: false,
    geometryAuthority: false,
    operationRegistryAuthority: false,
    toolRegistryAuthority: false,
    workGraphAuthority: false,
    queueAuthority: false,
    dispatchAuthority: false,
    runtimeAuthority: false,
    artifactAuthority: false,
    assetManifestAuthority: false,
    rendererAuthority: false,
    qaApprovalAuthority: false,
    privateReviewAuthority: false,
    costAuthority: false,
    billingAuthority: false,
    productionAuthority: false,
  })

interface ParticleProfileBlueprint {
  readonly profileId:
    LivingFrameEnvironmentalParticleProfileId
  readonly effectFamily:
    LivingFrameEnvironmentalParticleEffectFamily
  readonly emitterShape:
    LivingFrameEnvironmentalParticleEmitterShape
  readonly particleShape: LivingFrameEnvironmentalParticleShape
  readonly countByDensity: Readonly<
    Record<LivingFrameVisualContinuityMotionDensity, number>
  >
  readonly directionNormalized:
    LivingFrameEnvironmentalParticleVector
  readonly spreadDegrees: number
  readonly speedNormalizedPerSecond: {
    readonly minimum: number
    readonly maximum: number
  }
  readonly gravityNormalizedPerSecondSquared:
    LivingFrameEnvironmentalParticleVector
  readonly turbulenceNormalized: number
  readonly lifetimeFraction: {
    readonly minimum: number
    readonly maximum: number
  }
  readonly fadeInFraction: number
  readonly fadeOutFraction: number
  readonly radiusNormalized: {
    readonly minimum: number
    readonly maximum: number
  }
  readonly opacity: {
    readonly minimum: number
    readonly maximum: number
  }
  readonly colorRolePriority:
    readonly LivingFrameVisualContinuityColorRole[]
  readonly blendMode: 'normal' | 'screen' | 'multiply'
}

const PROFILE_CATALOG:
  Readonly<
    Record<
      LivingFrameEnvironmentalParticleProfileId,
      ParticleProfileBlueprint
    >
  > = deepFreeze({
    restrained_airborne_dust_settle_v1: profile({
      profileId: 'restrained_airborne_dust_settle_v1',
      effectFamily: 'airborne_dust',
      emitterShape: 'lower_area',
      particleShape: 'soft_circle',
      countByDensity: density(12, 24, 36),
      directionNormalized: { x: 0.08, y: -0.24 },
      spreadDegrees: 68,
      speedNormalizedPerSecond: range(0.025, 0.095),
      gravityNormalizedPerSecondSquared: { x: 0, y: 0.035 },
      turbulenceNormalized: 0.018,
      lifetimeFraction: range(0.38, 0.78),
      fadeInFraction: 0.12,
      fadeOutFraction: 0.42,
      radiusNormalized: range(0.0025, 0.008),
      opacity: range(0.14, 0.48),
      colorRolePriority: [
        'background',
        'surface',
        'ink',
        'secondary_subject',
      ],
      blendMode: 'normal',
    }),
    restrained_smoke_rise_v1: profile({
      profileId: 'restrained_smoke_rise_v1',
      effectFamily: 'rising_smoke',
      emitterShape: 'lower_area',
      particleShape: 'soft_circle',
      countByDensity: density(10, 18, 28),
      directionNormalized: { x: 0.02, y: -0.32 },
      spreadDegrees: 42,
      speedNormalizedPerSecond: range(0.018, 0.075),
      gravityNormalizedPerSecondSquared: { x: 0, y: -0.012 },
      turbulenceNormalized: 0.026,
      lifetimeFraction: range(0.48, 0.9),
      fadeInFraction: 0.18,
      fadeOutFraction: 0.35,
      radiusNormalized: range(0.008, 0.025),
      opacity: range(0.09, 0.32),
      colorRolePriority: [
        'surface',
        'secondary_subject',
        'background',
        'ink',
      ],
      blendMode: 'normal',
    }),
    restrained_mist_drift_v1: profile({
      profileId: 'restrained_mist_drift_v1',
      effectFamily: 'drifting_mist',
      emitterShape: 'area',
      particleShape: 'soft_streak',
      countByDensity: density(8, 14, 22),
      directionNormalized: { x: 0.28, y: -0.03 },
      spreadDegrees: 24,
      speedNormalizedPerSecond: range(0.012, 0.05),
      gravityNormalizedPerSecondSquared: { x: 0, y: 0 },
      turbulenceNormalized: 0.014,
      lifetimeFraction: range(0.55, 0.95),
      fadeInFraction: 0.2,
      fadeOutFraction: 0.3,
      radiusNormalized: range(0.012, 0.035),
      opacity: range(0.06, 0.2),
      colorRolePriority: ['highlight', 'surface', 'background'],
      blendMode: 'screen',
    }),
    restrained_ember_lift_v1: profile({
      profileId: 'restrained_ember_lift_v1',
      effectFamily: 'lifting_embers',
      emitterShape: 'lower_area',
      particleShape: 'soft_spark',
      countByDensity: density(10, 20, 32),
      directionNormalized: { x: 0.04, y: -0.38 },
      spreadDegrees: 52,
      speedNormalizedPerSecond: range(0.04, 0.13),
      gravityNormalizedPerSecondSquared: { x: 0, y: -0.018 },
      turbulenceNormalized: 0.022,
      lifetimeFraction: range(0.28, 0.62),
      fadeInFraction: 0.08,
      fadeOutFraction: 0.36,
      radiusNormalized: range(0.0018, 0.0055),
      opacity: range(0.26, 0.74),
      colorRolePriority: ['accent', 'warning', 'highlight'],
      blendMode: 'screen',
    }),
    restrained_rainfall_v1: profile({
      profileId: 'restrained_rainfall_v1',
      effectFamily: 'rainfall',
      emitterShape: 'line_top',
      particleShape: 'soft_streak',
      countByDensity: density(16, 30, 46),
      directionNormalized: { x: -0.08, y: 0.62 },
      spreadDegrees: 10,
      speedNormalizedPerSecond: range(0.24, 0.52),
      gravityNormalizedPerSecondSquared: { x: 0, y: 0.08 },
      turbulenceNormalized: 0.004,
      lifetimeFraction: range(0.3, 0.68),
      fadeInFraction: 0.04,
      fadeOutFraction: 0.16,
      radiusNormalized: range(0.0012, 0.0032),
      opacity: range(0.2, 0.58),
      colorRolePriority: ['highlight', 'surface', 'background'],
      blendMode: 'screen',
    }),
    restrained_snowfall_v1: profile({
      profileId: 'restrained_snowfall_v1',
      effectFamily: 'snowfall',
      emitterShape: 'upper_area',
      particleShape: 'soft_flake',
      countByDensity: density(14, 26, 40),
      directionNormalized: { x: 0.08, y: 0.2 },
      spreadDegrees: 54,
      speedNormalizedPerSecond: range(0.018, 0.075),
      gravityNormalizedPerSecondSquared: { x: 0, y: 0.028 },
      turbulenceNormalized: 0.02,
      lifetimeFraction: range(0.5, 0.95),
      fadeInFraction: 0.14,
      fadeOutFraction: 0.24,
      radiusNormalized: range(0.0025, 0.0075),
      opacity: range(0.2, 0.6),
      colorRolePriority: ['highlight', 'surface', 'background'],
      blendMode: 'screen',
    }),
    restrained_water_spray_v1: profile({
      profileId: 'restrained_water_spray_v1',
      effectFamily: 'water_spray',
      emitterShape: 'radial_anchor',
      particleShape: 'soft_droplet',
      countByDensity: density(12, 24, 38),
      directionNormalized: { x: 0.2, y: -0.28 },
      spreadDegrees: 112,
      speedNormalizedPerSecond: range(0.08, 0.24),
      gravityNormalizedPerSecondSquared: { x: 0, y: 0.12 },
      turbulenceNormalized: 0.008,
      lifetimeFraction: range(0.18, 0.48),
      fadeInFraction: 0.04,
      fadeOutFraction: 0.22,
      radiusNormalized: range(0.0015, 0.0045),
      opacity: range(0.22, 0.66),
      colorRolePriority: ['highlight', 'surface', 'background'],
      blendMode: 'screen',
    }),
  })

const MOTION_DENSITY_PARTICLE_CAP:
  Readonly<
    Record<LivingFrameVisualContinuityMotionDensity, number>
  > = Object.freeze({
    sparse: 16,
    balanced: 32,
    rich: 48,
  })

export interface CompileLivingFrameEnvironmentalParticleKernelInput {
  readonly kernelCandidateId: string
  readonly profileId:
    LivingFrameEnvironmentalParticleProfileId
  readonly sceneDesignSheetId: string
  readonly environmentSheetId: string
  readonly visualContinuityPack:
    LivingFrameVisualContinuityPack
  readonly frameBinding:
    LivingFrameEnvironmentalParticleKernelFrameBinding
}

export class LivingFrameEnvironmentalParticleKernelError
  extends Error {
  readonly issues:
    readonly LivingFrameEnvironmentalParticleKernelIssue[]

  constructor(
    issues:
      readonly LivingFrameEnvironmentalParticleKernelIssue[],
  ) {
    super(
      'Living Frame environmental-particle kernel compilation failed.',
    )
    this.name =
      'LivingFrameEnvironmentalParticleKernelError'
    this.issues = issues
  }
}

export async function compileLivingFrameEnvironmentalParticleKernel(
  input:
    CompileLivingFrameEnvironmentalParticleKernelInput,
): Promise<LivingFrameEnvironmentalParticleKernelCandidate> {
  assertInput(input)
  const validation =
    await validateLivingFrameVisualContinuityPack(
      input.visualContinuityPack,
    )
  if (!validation.ok) {
    throw invalid(
      'visual_continuity_pack_invalid',
      '$.visualContinuityPack',
    )
  }
  const pack = validation.pack
  const sceneDesignSheet = selectSceneDesignSheet(
    pack,
    input.sceneDesignSheetId,
  )
  const environmentSheet = selectEnvironmentSheet(
    pack,
    sceneDesignSheet,
    input.environmentSheetId,
  )
  const blueprint = PROFILE_CATALOG[input.profileId]
  if (!blueprint) {
    throw invalid(
      'profile_not_allowlisted',
      '$.profileId',
    )
  }
  const motionDensity =
    pack.motionLanguageSheet.motionDensity
  const motionDensityParticleCap =
    MOTION_DENSITY_PARTICLE_CAP[motionDensity]
  const particleCount = Math.min(
    blueprint.countByDensity[motionDensity],
    motionDensityParticleCap,
  )
  if (
    particleCount < 1
    || particleCount > motionDensityParticleCap
    || pack.motionLanguageSheet
      .maximumSimultaneousPrimaryMotions !== 1
  ) {
    throw invalid(
      'motion_budget_invalid',
      '$.visualContinuityPack.motionLanguageSheet',
    )
  }
  const color = selectPaletteColor(
    pack.styleBible.palette,
    blueprint.colorRolePriority,
  )
  const durationFrames =
    input.frameBinding.endFrameExclusive
    - input.frameBinding.startFrame
  const physics = compilePhysics(
    blueprint,
    durationFrames,
  )
  const appearance:
    LivingFrameEnvironmentalParticleAppearance = {
      particleShape: blueprint.particleShape,
      radiusNormalized: {
        ...blueprint.radiusNormalized,
      },
      opacity: { ...blueprint.opacity },
      colorId: color.colorId,
      colorHex: color.hex.toLowerCase(),
      colorRole: color.role,
      blendMode: blueprint.blendMode,
    }
  const stateTracks = compileStateTracks({
    kernelCandidateId: input.kernelCandidateId,
    profileId: blueprint.profileId,
    particleCount,
    frameBinding: input.frameBinding,
    physics,
    appearance,
  })
  const frameStateCount = stateTracks.reduce(
    (total, track) =>
      total + track.frameStates.length,
    0,
  )
  const sequenceBase = {
    sequenceId:
      `living-frame.environmental-sequence.${
        sha256AuthorityValue({
          kernelCandidateId: input.kernelCandidateId,
          profileId: input.profileId,
          frameBinding: input.frameBinding,
        }).slice(0, 24)
      }`,
    algorithm:
      'xorshift32_analytic_particle_state_v1' as const,
    particleCount,
    frameStateCount,
    stateTracks,
  }
  const deterministicStateSequence = {
    ...sequenceBase,
    sequenceDigestSha256:
      sha256AuthorityValue(sequenceBase),
    callerSeedUsed: false as const,
    callerPhysicsOrAppearanceValuesUsed: false as const,
    allBirthFramesWithinBoundRange: true as const,
    allStateFramesWithinBoundRange: true as const,
    allParticlesSettleByEndFrameExclusive: true as const,
    noLoopingState: true as const,
  }
  assertSequence(
    deterministicStateSequence,
    input.frameBinding,
  )
  const draft:
    LivingFrameEnvironmentalParticleKernelCandidateDraft = {
      contractVersion:
        LIVING_FRAME_ENVIRONMENTAL_PARTICLE_KERNEL_VERSION,
      resultClass:
        LIVING_FRAME_ENVIRONMENTAL_PARTICLE_KERNEL_CLASS,
      candidateState:
        LIVING_FRAME_ENVIRONMENTAL_PARTICLE_KERNEL_STATE,
      kernelCandidateId: input.kernelCandidateId,
      sourceBindings: {
        visualContinuityPackDigestSha256:
          pack.contractDigestSha256,
        styleBibleDigestSha256:
          sha256AuthorityValue(pack.styleBible),
        sceneDesignSheetDigestSha256:
          sha256AuthorityValue(sceneDesignSheet),
        environmentSheetDigestSha256:
          sha256AuthorityValue(environmentSheet),
        motionLanguageSheetDigestSha256:
          sha256AuthorityValue(pack.motionLanguageSheet),
        frameBindingDigestSha256:
          sha256AuthorityValue(input.frameBinding),
        confirmedOutputFrameDigestSha256:
          input.frameBinding
            .confirmedOutputFrameDigestSha256,
        masterTimingDigestSha256:
          input.frameBinding.masterTimingDigestSha256,
        serverSeedDigestSha256:
          input.frameBinding.serverSeedDigestSha256,
      },
      profileSelection: {
        profileId: blueprint.profileId,
        effectFamily: blueprint.effectFamily,
        allowlistedProfileSelected: true,
        selectedByCanonicalOwner: false,
        selectedSceneBindingPresent: false,
        componentSummaryParsingUsed: false,
        componentIdParsingUsed: false,
        subjectOrGenreRoutingUsed: false,
      },
      visualContinuityBinding: {
        assetTreatment: pack.styleBible.assetTreatment,
        lineLanguage: pack.styleBible.lineLanguage,
        paletteMode: pack.styleBible.paletteMode,
        lightingDirection:
          pack.styleBible.lightingDirection,
        lightingCharacter:
          pack.styleBible.lightingCharacter,
        edgeTreatment:
          pack.styleBible.edgeTreatment,
        textureTreatment:
          pack.styleBible.textureTreatment,
        detailDensity:
          pack.styleBible.detailDensity,
        depthStyle: sceneDesignSheet.depthStyle,
        motionCharacter:
          pack.motionLanguageSheet.motionCharacter,
        motionDensity,
        cameraCharacter:
          pack.motionLanguageSheet.cameraCharacter,
        maximumSimultaneousPrimaryMotions: 1,
        ambientEffectDoesNotConsumePrimaryMotionSlot: true,
        subjectSpecificSummariesEmbedded: false,
      },
      exactFrameBinding: {
        widthPixels: input.frameBinding.widthPixels,
        heightPixels: input.frameBinding.heightPixels,
        fps: input.frameBinding.fps,
        startFrame: input.frameBinding.startFrame,
        endFrameExclusive:
          input.frameBinding.endFrameExclusive,
        durationFrames,
        emitterRect: {
          ...input.frameBinding.emitterRect,
        },
        anchorPoint: {
          ...input.frameBinding.anchorPoint,
        },
      },
      typedProfile: {
        profileId: blueprint.profileId,
        effectFamily: blueprint.effectFamily,
        particleCount,
        motionDensityParticleCap,
        particleCountWithinMotionBudget: true,
        motionBudgetRole: 'ambient',
        oneShotNonLoopingSequence: true,
        stillnessOutsideBoundFrameRangeRequired: true,
        physics,
        appearance,
      },
      deterministicStateSequence,
      candidateOperationDisposition: {
        existingToolId: 'pixijs',
        candidateOperationId:
          'tool.pixijs.render_living_frame_environmental_particles.v1',
        separateToolIdentityRequired: false,
        operationRegistered: false,
        operationDispatchable: false,
        remotionRemainsFinalCanvas: true,
      },
      openGateCodes:
        LIVING_FRAME_ENVIRONMENTAL_PARTICLE_KERNEL_OPEN_GATES,
      authorityBoundary: AUTHORITY_BOUNDARY,
      selectedSceneBound: false,
      canonicalTimingBound: false,
      operationRegistered: false,
      dispatchGranted: false,
      runtimeExecuted: false,
      artifactPersisted: false,
      assetManifestMutated: false,
      rendererMutated: false,
      qaApproved: false,
      privateReviewApproved: false,
      actualCostCreated: false,
      customerCharged: false,
      containsExecutableCode: false,
      containsRawChatTranscriptMediaBytesPathsUrlsCredentialsCommandsOrEnvironment:
        false,
      containsSubjectSpecificSummaries: false,
      subjectSpecificRouting: false,
      productionReady: false,
    }
  assertDraft(draft)
  return deepFreeze({
    ...draft,
    kernelCandidateDigestSha256:
      sha256AuthorityValue(draft),
  })
}

export async function verifyLivingFrameEnvironmentalParticleKernel(
  value: unknown,
  input:
    CompileLivingFrameEnvironmentalParticleKernelInput,
): Promise<boolean> {
  try {
    if (
      !isRecord(value)
      || typeof value.kernelCandidateDigestSha256 !==
        'string'
      || !SHA256.test(
        value.kernelCandidateDigestSha256,
      )
      || value.kernelCandidateDigestSha256 !==
        sha256AuthorityValue(withoutDigest(value))
    ) return false
    const expected =
      await compileLivingFrameEnvironmentalParticleKernel(
        input,
      )
    return stableAuthorityStringify(value) ===
      stableAuthorityStringify(expected)
  } catch {
    return false
  }
}

function assertInput(
  input:
    CompileLivingFrameEnvironmentalParticleKernelInput,
): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'kernelCandidateId',
      'profileId',
      'sceneDesignSheetId',
      'environmentSheetId',
      'visualContinuityPack',
      'frameBinding',
    ])
    || typeof input.kernelCandidateId !== 'string'
    || !SAFE_ID.test(input.kernelCandidateId)
    || typeof input.sceneDesignSheetId !== 'string'
    || !SAFE_ID.test(input.sceneDesignSheetId)
    || typeof input.environmentSheetId !== 'string'
    || !SAFE_ID.test(input.environmentSheetId)
    || typeof input.profileId !== 'string'
    || !PROFILE_IDS.has(input.profileId)
  ) {
    throw invalid('input_invalid', '$')
  }
  assertFrameBinding(input.frameBinding)
}

function assertFrameBinding(
  binding:
    LivingFrameEnvironmentalParticleKernelFrameBinding,
): void {
  if (
    !isRecord(binding)
    || !hasExactKeys(binding, [
      'widthPixels',
      'heightPixels',
      'fps',
      'startFrame',
      'endFrameExclusive',
      'emitterRect',
      'anchorPoint',
      'confirmedOutputFrameDigestSha256',
      'masterTimingDigestSha256',
      'serverSeedDigestSha256',
      'confirmedOutputFrameRevalidationRequired',
      'masterTimingRevalidationRequired',
    ])
  ) {
    throw invalid(
      'frame_binding_invalid',
      '$.frameBinding',
    )
  }
  const duration =
    binding.endFrameExclusive - binding.startFrame
  if (
    !integerBetween(binding.widthPixels, 16, 16_384)
    || !integerBetween(binding.heightPixels, 16, 16_384)
    || !integerBetween(binding.fps, 1, 240)
    || !integerBetween(binding.startFrame, 0, 10_000_000)
    || !integerBetween(
      binding.endFrameExclusive,
      binding.startFrame + 2,
      10_000_000,
    )
    || duration > MAX_EFFECT_DURATION_FRAMES
    || !validRect(binding.emitterRect)
    || !validPoint(binding.anchorPoint)
    || !SHA256.test(
      binding.confirmedOutputFrameDigestSha256,
    )
    || !SHA256.test(binding.masterTimingDigestSha256)
    || !SHA256.test(binding.serverSeedDigestSha256)
    || !binding.confirmedOutputFrameRevalidationRequired
    || !binding.masterTimingRevalidationRequired
  ) {
    throw invalid(
      'frame_binding_invalid',
      '$.frameBinding',
    )
  }
}

function selectSceneDesignSheet(
  pack: LivingFrameVisualContinuityPack,
  sceneDesignSheetId: string,
): LivingFrameVisualContinuityPack['sceneDesignSheets'][number] {
  const matches = pack.sceneDesignSheets.filter(
    (sheet) =>
      sheet.sceneDesignSheetId === sceneDesignSheetId,
  )
  if (
    matches.length !== 1
    || matches[0]!.styleBibleId !==
      pack.styleBible.styleBibleId
  ) {
    throw invalid(
      'scene_design_sheet_invalid',
      '$.sceneDesignSheetId',
    )
  }
  return matches[0]!
}

function selectEnvironmentSheet(
  pack: LivingFrameVisualContinuityPack,
  sceneDesignSheet:
    LivingFrameVisualContinuityPack['sceneDesignSheets'][number],
  environmentSheetId: string,
): LivingFrameVisualContinuityPack['environmentSheets'][number] {
  const matches = pack.environmentSheets.filter(
    (sheet) =>
      sheet.environmentSheetId === environmentSheetId,
  )
  if (
    matches.length !== 1
    || !sceneDesignSheet.environmentSheetIds
      .includes(environmentSheetId)
    || matches[0]!.styleBibleId !==
      pack.styleBible.styleBibleId
    || matches[0]!.depthStyle !==
      sceneDesignSheet.depthStyle
  ) {
    throw invalid(
      'environment_sheet_invalid',
      '$.environmentSheetId',
    )
  }
  return matches[0]!
}

function compilePhysics(
  blueprint: ParticleProfileBlueprint,
  durationFrames: number,
): LivingFrameEnvironmentalParticlePhysics {
  const minimum = Math.max(
    2,
    Math.floor(
      durationFrames * blueprint.lifetimeFraction.minimum,
    ),
  )
  const maximum = Math.max(
    minimum,
    Math.min(
      durationFrames,
      Math.ceil(
        durationFrames * blueprint.lifetimeFraction.maximum,
      ),
    ),
  )
  return {
    emitterShape: blueprint.emitterShape,
    directionNormalized: {
      ...blueprint.directionNormalized,
    },
    spreadDegrees: blueprint.spreadDegrees,
    speedNormalizedPerSecond: {
      ...blueprint.speedNormalizedPerSecond,
    },
    gravityNormalizedPerSecondSquared: {
      ...blueprint.gravityNormalizedPerSecondSquared,
    },
    turbulenceNormalized:
      blueprint.turbulenceNormalized,
    lifetimeFrames: { minimum, maximum },
    fadeInFraction: blueprint.fadeInFraction,
    fadeOutFraction: blueprint.fadeOutFraction,
  }
}

function selectPaletteColor(
  palette: readonly LivingFrameVisualContinuityColor[],
  priorities:
    readonly LivingFrameVisualContinuityColorRole[],
): LivingFrameVisualContinuityColor {
  const selected = priorities
    .map((role) =>
      palette.find((color) => color.role === role))
    .find((color) => color != null)
    ?? palette[0]
  if (
    !selected
    || !SAFE_ID.test(selected.colorId)
    || !HEX.test(selected.hex)
  ) {
    throw invalid(
      'palette_binding_invalid',
      '$.visualContinuityPack.styleBible.palette',
    )
  }
  return selected
}

function compileStateTracks(input: {
  readonly kernelCandidateId: string
  readonly profileId:
    LivingFrameEnvironmentalParticleProfileId
  readonly particleCount: number
  readonly frameBinding:
    LivingFrameEnvironmentalParticleKernelFrameBinding
  readonly physics:
    LivingFrameEnvironmentalParticlePhysics
  readonly appearance:
    LivingFrameEnvironmentalParticleAppearance
}): readonly LivingFrameEnvironmentalParticleStateTrack[] {
  const random = createXorShift32(
    Number.parseInt(
      input.frameBinding.serverSeedDigestSha256.slice(0, 8),
      16,
    ),
  )
  const duration =
    input.frameBinding.endFrameExclusive
    - input.frameBinding.startFrame
  const emissionWindow = Math.max(
    1,
    Math.floor(duration * 0.34),
  )
  return Array.from(
    { length: input.particleCount },
    (_, order) => {
      const birthFrame =
        input.frameBinding.startFrame
        + Math.min(
          emissionWindow - 1,
          Math.floor(random() * emissionWindow),
        )
      const requestedLifetime = randomInteger(
        random,
        input.physics.lifetimeFrames.minimum,
        input.physics.lifetimeFrames.maximum,
      )
      const endFrameExclusive = Math.max(
        birthFrame + 2,
        Math.min(
          input.frameBinding.endFrameExclusive,
          birthFrame + requestedLifetime,
        ),
      )
      const initialState = compileInitialState({
        random,
        emitterRect: input.frameBinding.emitterRect,
        anchorPoint: input.frameBinding.anchorPoint,
        physics: input.physics,
        appearance: input.appearance,
      })
      return {
        particleId:
          `living-frame.particle.${
            sha256AuthorityValue({
              kernelCandidateId: input.kernelCandidateId,
              profileId: input.profileId,
              order,
              birthFrame,
            }).slice(0, 20)
          }`,
        order,
        birthFrame,
        endFrameExclusive,
        initialState,
        frameStates: compileFrameStates({
          birthFrame,
          endFrameExclusive,
          fps: input.frameBinding.fps,
          initialState,
          physics: input.physics,
        }),
      }
    },
  )
}

function compileInitialState(input: {
  readonly random: () => number
  readonly emitterRect:
    LivingFrameEnvironmentalParticleKernelFrameBinding['emitterRect']
  readonly anchorPoint:
    LivingFrameEnvironmentalParticleKernelFrameBinding['anchorPoint']
  readonly physics:
    LivingFrameEnvironmentalParticlePhysics
  readonly appearance:
    LivingFrameEnvironmentalParticleAppearance
}): LivingFrameEnvironmentalParticleInitialState {
  const position = pointInEmitter(
    input.random,
    input.physics.emitterShape,
    input.emitterRect,
    input.anchorPoint,
  )
  const baseAngle = Math.atan2(
    input.physics.directionNormalized.y,
    input.physics.directionNormalized.x,
  )
  const spreadRadians =
    input.physics.spreadDegrees * Math.PI / 180
  const angle =
    baseAngle
    + (input.random() - 0.5) * spreadRadians
  const speed = randomBetween(
    input.random,
    input.physics.speedNormalizedPerSecond.minimum,
    input.physics.speedNormalizedPerSecond.maximum,
  )
  return {
    position,
    velocityNormalizedPerSecond: {
      x: round(Math.cos(angle) * speed),
      y: round(Math.sin(angle) * speed),
    },
    radiusNormalized: round(randomBetween(
      input.random,
      input.appearance.radiusNormalized.minimum,
      input.appearance.radiusNormalized.maximum,
    )),
    opacity: round(randomBetween(
      input.random,
      input.appearance.opacity.minimum,
      input.appearance.opacity.maximum,
    )),
    phaseOffsetRadians: round(
      input.random() * Math.PI * 2,
    ),
  }
}

function compileFrameStates(input: {
  readonly birthFrame: number
  readonly endFrameExclusive: number
  readonly fps: number
  readonly initialState:
    LivingFrameEnvironmentalParticleInitialState
  readonly physics:
    LivingFrameEnvironmentalParticlePhysics
}): readonly LivingFrameEnvironmentalParticleFrameState[] {
  const duration =
    input.endFrameExclusive - input.birthFrame
  return Array.from({ length: duration }, (_, offset) => {
    const progress =
      duration <= 1 ? 1 : offset / (duration - 1)
    const seconds = offset / input.fps
    const wave = Math.sin(
      input.initialState.phaseOffsetRadians
      + seconds * 2.17,
    )
    const crossWave = Math.cos(
      input.initialState.phaseOffsetRadians
      + seconds * 1.63,
    )
    return {
      frame: input.birthFrame + offset,
      lifeProgressNormalized: round(progress),
      position: {
        x: round(clamp01(
          input.initialState.position.x
          + input.initialState
            .velocityNormalizedPerSecond.x * seconds
          + 0.5 *
            input.physics
              .gravityNormalizedPerSecondSquared.x *
            seconds * seconds
          + input.physics.turbulenceNormalized *
            wave * progress,
        )),
        y: round(clamp01(
          input.initialState.position.y
          + input.initialState
            .velocityNormalizedPerSecond.y * seconds
          + 0.5 *
            input.physics
              .gravityNormalizedPerSecondSquared.y *
            seconds * seconds
          + input.physics.turbulenceNormalized *
            crossWave * progress,
        )),
      },
      radiusNormalized: round(
        input.initialState.radiusNormalized *
        (0.9 + 0.1 * crossWave),
      ),
      opacity: round(
        input.initialState.opacity * opacityEnvelope(
          progress,
          input.physics.fadeInFraction,
          input.physics.fadeOutFraction,
        ),
      ),
    }
  })
}

function pointInEmitter(
  random: () => number,
  shape: LivingFrameEnvironmentalParticleEmitterShape,
  rect:
    LivingFrameEnvironmentalParticleKernelFrameBinding['emitterRect'],
  anchor:
    LivingFrameEnvironmentalParticleKernelFrameBinding['anchorPoint'],
): LivingFrameEnvironmentalParticleInitialState['position'] {
  if (shape === 'radial_anchor') {
    const angle = random() * Math.PI * 2
    const radius =
      random() * Math.min(rect.width, rect.height) * 0.08
    return {
      x: round(clamp01(
        anchor.x + Math.cos(angle) * radius,
      )),
      y: round(clamp01(
        anchor.y + Math.sin(angle) * radius,
      )),
    }
  }
  const x = rect.x + random() * rect.width
  const yRatio = (() => {
    switch (shape) {
      case 'area':
        return random()
      case 'lower_area':
        return 0.68 + random() * 0.32
      case 'upper_area':
        return random() * 0.32
      case 'line_top':
        return 0
      case 'line_bottom':
        return 1
    }
  })()
  return {
    x: round(clamp01(x)),
    y: round(clamp01(rect.y + yRatio * rect.height)),
  }
}

function assertSequence(
  sequence:
    LivingFrameEnvironmentalParticleKernelCandidateDraft['deterministicStateSequence'],
  frameBinding:
    LivingFrameEnvironmentalParticleKernelFrameBinding,
): void {
  const tracks = sequence.stateTracks
  const valid =
    tracks.length === sequence.particleCount
    && tracks.every((track, order) =>
      track.order === order
      && SAFE_ID.test(track.particleId)
      && track.birthFrame >= frameBinding.startFrame
      && track.birthFrame < frameBinding.endFrameExclusive
      && track.endFrameExclusive > track.birthFrame
      && track.endFrameExclusive <=
        frameBinding.endFrameExclusive
      && track.frameStates.length ===
        track.endFrameExclusive - track.birthFrame
      && track.frameStates.every((state, stateOrder) =>
        state.frame === track.birthFrame + stateOrder
        && state.frame >= frameBinding.startFrame
        && state.frame < frameBinding.endFrameExclusive
        && isUnit(state.lifeProgressNormalized)
        && isUnit(state.position.x)
        && isUnit(state.position.y)
        && state.radiusNormalized > 0
        && isUnit(state.opacity),
      ),
    )
    && sequence.frameStateCount === tracks.reduce(
      (total, track) =>
        total + track.frameStates.length,
      0,
    )
  if (!valid) {
    throw invalid(
      'deterministic_sequence_invalid',
      '$.deterministicStateSequence',
    )
  }
}

function assertDraft(
  draft:
    LivingFrameEnvironmentalParticleKernelCandidateDraft,
): void {
  const {
    typedProfileCatalogAuthority,
    deterministicSamplingKernelAuthority,
    ...delegatedAuthorities
  } = draft.authorityBoundary
  if (
    typedProfileCatalogAuthority !== true
    || deterministicSamplingKernelAuthority !== true
    || Object.values(delegatedAuthorities)
      .some((value) => value !== false)
    || stableAuthorityStringify(draft.openGateCodes) !==
      stableAuthorityStringify(
        LIVING_FRAME_ENVIRONMENTAL_PARTICLE_KERNEL_OPEN_GATES,
      )
    || draft.profileSelection.selectedByCanonicalOwner
    || draft.profileSelection.selectedSceneBindingPresent
    || draft.profileSelection.componentSummaryParsingUsed
    || draft.profileSelection.componentIdParsingUsed
    || draft.profileSelection.subjectOrGenreRoutingUsed
    || draft.typedProfile.particleCount >
      draft.typedProfile.motionDensityParticleCap
    || !draft.typedProfile.particleCountWithinMotionBudget
    || !draft.typedProfile.oneShotNonLoopingSequence
    || draft.selectedSceneBound
    || draft.canonicalTimingBound
    || draft.candidateOperationDisposition
      .separateToolIdentityRequired
    || draft.candidateOperationDisposition.operationRegistered
    || draft.candidateOperationDisposition.operationDispatchable
    || !draft.candidateOperationDisposition
      .remotionRemainsFinalCanvas
    || draft.operationRegistered
    || draft.dispatchGranted
    || draft.runtimeExecuted
    || draft.artifactPersisted
    || draft.assetManifestMutated
    || draft.rendererMutated
    || draft.qaApproved
    || draft.privateReviewApproved
    || draft.actualCostCreated
    || draft.customerCharged
    || draft.containsExecutableCode
    || draft
      .containsRawChatTranscriptMediaBytesPathsUrlsCredentialsCommandsOrEnvironment
    || draft.containsSubjectSpecificSummaries
    || draft.subjectSpecificRouting
    || draft.productionReady
  ) {
    throw invalid(
      'authority_promotion_forbidden',
      '$.authorityBoundary',
    )
  }
}

function profile(
  value: ParticleProfileBlueprint,
): ParticleProfileBlueprint {
  return value
}

function density(
  sparse: number,
  balanced: number,
  rich: number,
): ParticleProfileBlueprint['countByDensity'] {
  return { sparse, balanced, rich }
}

function range(
  minimum: number,
  maximum: number,
): { readonly minimum: number; readonly maximum: number } {
  return { minimum, maximum }
}

function opacityEnvelope(
  progress: number,
  fadeInFraction: number,
  fadeOutFraction: number,
): number {
  if (progress <= 0 || progress >= 1) return 0
  if (progress < fadeInFraction) {
    return progress / fadeInFraction
  }
  if (progress > 1 - fadeOutFraction) {
    return (1 - progress) / fadeOutFraction
  }
  return 1
}

function createXorShift32(seedInput: number): () => number {
  let state = seedInput >>> 0
  if (state === 0) state = 0x6d2b79f5
  return () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return (state >>> 0) / 4_294_967_296
  }
}

function randomBetween(
  random: () => number,
  minimum: number,
  maximum: number,
): number {
  return minimum + random() * (maximum - minimum)
}

function randomInteger(
  random: () => number,
  minimum: number,
  maximum: number,
): number {
  return minimum + Math.floor(
    random() * (maximum - minimum + 1),
  )
}

function round(value: number): number {
  return Number(value.toFixed(6))
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

function validRect(
  value: LivingFrameEnvironmentalParticleKernelFrameBinding['emitterRect'],
): boolean {
  return isRecord(value)
    && hasExactKeys(value, ['x', 'y', 'width', 'height'])
    && isUnit(value.x)
    && isUnit(value.y)
    && typeof value.width === 'number'
    && value.width > 0
    && value.width <= 1
    && typeof value.height === 'number'
    && value.height > 0
    && value.height <= 1
    && value.x + value.width <= 1
    && value.y + value.height <= 1
}

function validPoint(
  value: LivingFrameEnvironmentalParticleKernelFrameBinding['anchorPoint'],
): boolean {
  return isRecord(value)
    && hasExactKeys(value, ['x', 'y'])
    && isUnit(value.x)
    && isUnit(value.y)
}

function isUnit(value: unknown): value is number {
  return typeof value === 'number'
    && Number.isFinite(value)
    && value >= 0
    && value <= 1
}

function integerBetween(
  value: unknown,
  minimum: number,
  maximum: number,
): value is number {
  return typeof value === 'number'
    && Number.isInteger(value)
    && value >= minimum
    && value <= maximum
}

function withoutDigest(
  value: Record<string, unknown>,
): Record<string, unknown> {
  const copy = { ...value }
  delete copy.kernelCandidateDigestSha256
  return copy
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return actual.length === expected.length
    && actual.every((key, index) =>
      key === expected[index])
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
}

function invalid(
  code: LivingFrameEnvironmentalParticleKernelIssueCode,
  path: string,
): LivingFrameEnvironmentalParticleKernelError {
  return new LivingFrameEnvironmentalParticleKernelError([
    { code, path },
  ])
}

function deepFreeze<T>(value: T): T {
  if (
    value
    && typeof value === 'object'
    && !Object.isFrozen(value)
  ) {
    Object.freeze(value)
    for (const nested of Object.values(
      value as Record<string, unknown>,
    )) {
      deepFreeze(nested)
    }
  }
  return value
}
