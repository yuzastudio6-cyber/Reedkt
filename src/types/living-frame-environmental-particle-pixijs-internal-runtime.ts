export const LIVING_FRAME_ENVIRONMENTAL_PARTICLE_PIXIJS_INTERNAL_RUNTIME_VERSION =
  'living-frame-environmental-particle-pixijs-internal-runtime-v1' as const

export const LIVING_FRAME_ENVIRONMENTAL_PARTICLE_PIXIJS_INTERNAL_RUNTIME_CLASS =
  'actual_private_internal_confined_pixijs_transparent_particle_sequence_qualification' as const

export const LIVING_FRAME_ENVIRONMENTAL_PARTICLE_PIXIJS_INTERNAL_RUNTIME_STATE =
  'actual_private_internal_runtime_green_canonical_release_gates_closed' as const

export const LIVING_FRAME_ENVIRONMENTAL_PARTICLE_PIXIJS_PRIVATE_SEQUENCE_OUTPUT_LEASE_VERSION =
  'living-frame-environmental-particle-pixijs-private-sequence-output-lease-v1' as const

export const LIVING_FRAME_ENVIRONMENTAL_PARTICLE_PIXIJS_INTERNAL_RUNTIME_OPEN_GATES = [
  'canonical_selected_scene_profile_and_timing_binding_required',
  'canonical_pixi_operation_registration_required',
  'canonical_work_graph_and_asset_manifest_binding_required',
  'canonical_attempt_cost_binding_required',
  'canonical_remotion_time_sampled_overlay_adapter_required',
  'canonical_procedural_alpha_and_destination_composite_qa_required',
  'canonical_private_review_and_release_evidence_required',
] as const

export type LivingFrameEnvironmentalParticlePixiJsInternalRuntimeOpenGate =
  (typeof LIVING_FRAME_ENVIRONMENTAL_PARTICLE_PIXIJS_INTERNAL_RUNTIME_OPEN_GATES)[number]

export interface LivingFrameEnvironmentalParticlePixiJsInternalImageEvidence {
  readonly imageTag:
    'reeditpro-living-frame-environmental-particle-pixijs-qualification:private-local-v1'
  readonly imageId: string
  readonly imageIdentityHash: string
  readonly baseImageId: string
  readonly baseImageIdentityHash: string
  readonly sourceDigestSha256: string
  readonly architecture: string
  readonly imageUser: '10001:10001'
  readonly imageEntrypoint:
    readonly [
      'node',
      '/app/living-frame-environmental-particle-runner.mjs',
    ]
  readonly imageEnvironmentNames: readonly string[]
  readonly rootFilesystemLayerDigests: readonly string[]
  readonly labels: Readonly<Record<string, string>>
}

export interface LivingFrameEnvironmentalParticlePixiJsInternalConfinementEvidence {
  readonly networkMode: 'none'
  readonly readOnlyRootFilesystem: true
  readonly capDropAll: true
  readonly noNewPrivileges: true
  readonly privileged: false
  readonly pidsLimit: 256
  readonly memoryLimitBytes: 2_147_483_648
  readonly memoryAndSwapLimitBytes: 2_147_483_648
  readonly nanoCpus: 2_000_000_000
  readonly tmpfsPath: '/tmp'
  readonly tmpfsSizeBytes: 536_870_912
  readonly tmpfsNoExec: true
  readonly tmpfsNoSuid: true
  readonly tmpfsNoDevice: true
  readonly shmSizeBytes: 268_435_456
  readonly user: '10001:10001'
  readonly callerCommandPresent: false
  readonly callerBindsPresent: false
  readonly callerMountsPresent: false
  readonly callerEnvironmentPresent: false
  readonly secretLikeImageEnvironmentNames: readonly []
}

export interface LivingFrameEnvironmentalParticlePixiJsInternalFrameMeasurement {
  readonly order: number
  readonly absoluteFrame: number
  readonly pngDigestSha256: string
  readonly pngByteLength: number
  readonly decodedRgbaDigestSha256: string
  readonly alphaMeasurementReportDigestSha256: string
  readonly alphaCoverageRatio: number
  readonly alphaWeightedPixelCount: number
  readonly maximumAlpha: number
  readonly borderTransparentRatio: number
  readonly nonTransparentPixelCount: number
  readonly alphaWeightedCentroid: {
    readonly xNormalized: number | null
    readonly yNormalized: number | null
  }
  readonly expectedActiveParticleCount: number
  readonly expectationMatched: true
}

export interface LivingFrameEnvironmentalParticlePixiJsInternalRuntimeReportDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_ENVIRONMENTAL_PARTICLE_PIXIJS_INTERNAL_RUNTIME_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_ENVIRONMENTAL_PARTICLE_PIXIJS_INTERNAL_RUNTIME_CLASS
  readonly runtimeState:
    typeof LIVING_FRAME_ENVIRONMENTAL_PARTICLE_PIXIJS_INTERNAL_RUNTIME_STATE
  readonly qualificationId: string
  readonly sourceBindings: {
    readonly materializationDigestSha256: string
    readonly privateRequestDigestSha256: string
    readonly kernelCandidateDigestSha256: string
    readonly deterministicStateSequenceDigestSha256: string
    readonly confirmedOutputFrameDigestSha256: string
    readonly masterTimingDigestSha256: string
    readonly runtimeRequestDigestSha256: string
  }
  readonly runtimeIdentity: {
    readonly toolId: 'pixijs'
    readonly operationId:
      'tool.pixijs.render_living_frame_environmental_particles.v1'
    readonly packageName: 'pixi.js'
    readonly packageVersion: '8.19.0'
    readonly packageEntrypoint: 'Application.init'
    readonly actualPackageEntrypointExecuted: true
    readonly fixedSupervisedEntrypointExecuted: true
    readonly oneRequestOneAttemptVerified: true
    readonly zeroNetworkVerified: true
    readonly containerExitCode: 0
    readonly oomKilled: false
  }
  readonly imageEvidence:
    LivingFrameEnvironmentalParticlePixiJsInternalImageEvidence
  readonly confinementEvidence:
    LivingFrameEnvironmentalParticlePixiJsInternalConfinementEvidence
  readonly sequenceIdentity: {
    readonly widthPixels: number
    readonly heightPixels: number
    readonly fps: number
    readonly startFrame: number
    readonly endFrameExclusive: number
    readonly frameImageCount: number
    readonly logicalBundleCount: 1
    readonly frameImageContentType: 'image/png'
    readonly alphaMode: 'straight_alpha'
    readonly finalVideoCanvas: false
  }
  readonly frameMeasurements:
    readonly LivingFrameEnvironmentalParticlePixiJsInternalFrameMeasurement[]
  readonly aggregateMeasurement: {
    readonly everyPngDecodedFromBytes: true
    readonly everyFrameExactDimension: true
    readonly everyFrameRgbaColorType: true
    readonly everyFrameAlphaMeasured: true
    readonly everyFrameExpectationMatched: true
    readonly firstFrameFullyTransparent: true
    readonly lastFrameFullyTransparent: true
    readonly activeFrameCount: number
    readonly fullyTransparentFrameCount: number
    readonly uniqueFramePngDigestCount: number
    readonly temporalVariationPresent: true
    readonly alphaCentroidMovementPresent: true
  }
  readonly authorityBoundary: {
    readonly privateInternalRuntimeQualificationAuthority: true
    readonly selectedSceneAuthority: false
    readonly timingAuthority: false
    readonly operationRegistryAuthority: false
    readonly workGraphAuthority: false
    readonly dispatchAuthority: false
    readonly artifactAuthority: false
    readonly assetManifestAuthority: false
    readonly rendererAuthority: false
    readonly qaApprovalAuthority: false
    readonly privateReviewAuthority: false
    readonly costAuthority: false
    readonly billingAuthority: false
    readonly productionAuthority: false
  }
  readonly openGateCodes:
    readonly LivingFrameEnvironmentalParticlePixiJsInternalRuntimeOpenGate[]
  readonly containsRawPngBytes: false
  readonly containsDecodedRgbaBytes: false
  readonly containsCallerSuppliedPathUrlCredentialCommandOrEnvironment:
    false
  readonly selectedSceneBound: false
  readonly canonicalTimingBound: false
  readonly operationRegistered: false
  readonly canonicalDispatchIntegrated: false
  readonly artifactPersisted: false
  readonly assetManifestMutated: false
  readonly rendererMutated: false
  readonly qaApproved: false
  readonly privateReviewApproved: false
  readonly actualCostCreated: false
  readonly customerCharged: false
  readonly internalTestReady: true
  readonly externalBetaReady: false
  readonly productionReady: false
}

export interface LivingFrameEnvironmentalParticlePixiJsInternalRuntimeReport
  extends LivingFrameEnvironmentalParticlePixiJsInternalRuntimeReportDraft {
  readonly reportDigestSha256: string
}

/**
 * Process-local capability object. The PNG bytes are intentionally retained in
 * a server-side WeakMap rather than serialized into this receipt.
 */
export interface LivingFrameEnvironmentalParticlePixiJsPrivateSequenceOutputLease {
  readonly contractVersion:
    typeof LIVING_FRAME_ENVIRONMENTAL_PARTICLE_PIXIJS_PRIVATE_SEQUENCE_OUTPUT_LEASE_VERSION
  readonly leaseId: string
  readonly qualificationId: string
  readonly reportDigestSha256: string
  readonly sequenceDigestSha256: string
  readonly frameImageCount: number
  readonly processBound: true
  readonly singleUse: true
  readonly containsRawPngBytes: false
  readonly containsPathUrlCredentialCommandOrEnvironment: false
  readonly dispatchAuthority: false
  readonly artifactAuthority: false
  readonly assetManifestAuthority: false
  readonly rendererAuthority: false
  readonly qaApprovalAuthority: false
  readonly costAuthority: false
  readonly billingAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameEnvironmentalParticlePixiJsPrivateSequenceOutput {
  readonly qualificationId: string
  readonly reportDigestSha256: string
  readonly sequenceDigestSha256: string
  readonly widthPixels: number
  readonly heightPixels: number
  readonly fps: number
  readonly startFrame: number
  readonly endFrameExclusive: number
  readonly frames: readonly {
    readonly order: number
    readonly absoluteFrame: number
    readonly pngBytes: Uint8Array
    readonly pngByteLength: number
    readonly pngDigestSha256: string
  }[]
}

export interface LivingFrameEnvironmentalParticlePixiJsInternalRuntimeExecution {
  readonly report:
    LivingFrameEnvironmentalParticlePixiJsInternalRuntimeReport
  readonly privateSequenceOutputLease:
    LivingFrameEnvironmentalParticlePixiJsPrivateSequenceOutputLease
}
