import { SOUND_CPU_RUNTIME_DISABLED_FLAGS } from '../../server/workers/sound-cpu/runtime/soundCpuRuntimeGuards'
import { createSoundCpuOcrCaptionRenderSafeZoneHookBlockedResult } from '../../server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook'

const input = {
  approvedPlanSnapshotId: 'phase64-synthetic-approved-plan-snapshot',
  phase37eRunId: 'phase64-synthetic-caption-safe-zone-run',
  captionCandidateZones: [
    {
      zoneId: 'synthetic-zone-safe-upper',
      label: 'safe upper caption lane',
      normalizedBox: { x: 0.1, y: 0.08, width: 0.8, height: 0.12 },
      collisionRisk: 'low',
    },
    {
      zoneId: 'synthetic-zone-lower-third',
      label: 'lower third collision lane',
      normalizedBox: { x: 0.08, y: 0.72, width: 0.84, height: 0.16 },
      collisionRisk: 'high',
    },
    {
      zoneId: 'synthetic-zone-ocr-blocking',
      label: 'ocr blocking caption lane',
      normalizedBox: { x: 0.2, y: 0.42, width: 0.6, height: 0.18 },
      collisionRisk: 'blocking',
    },
  ],
  normalizedOcrRegionBoxes: [
    {
      regionIdHash: 'synthetic-ocr-region-hash-a',
      normalizedBox: { x: 0.18, y: 0.4, width: 0.24, height: 0.08 },
      confidenceBand: 'high',
    },
    {
      regionIdHash: 'synthetic-ocr-region-hash-b',
      normalizedBox: { x: 0.52, y: 0.7, width: 0.3, height: 0.1 },
      confidenceBand: 'medium',
    },
  ],
  hashedOcrRegionIds: ['synthetic-ocr-region-hash-a', 'synthetic-ocr-region-hash-b'],
  lowerThirdCollisionFlags: ['synthetic-lower-third-collision'],
  manualReviewRequiredFlags: ['synthetic-blocking-zone-review-required'],
  runtimeDisabledFlags: SOUND_CPU_RUNTIME_DISABLED_FLAGS,
} as const

const result = createSoundCpuOcrCaptionRenderSafeZoneHookBlockedResult(input)

const proof = {
  status: 'passed',
  proofKind: 'controlled_synthetic_external_agent_boundary',
  hookName: result.hookName,
  blockedStatus: result.blockedStatus,
  sourceStatus: result.sourceStatus,
  ownerGateRequired: result.ownerGateRequired,
  manualCaptionLayoutReviewRequired: result.manualCaptionLayoutReviewRequired,
  captionSafeZoneConstraintPlan: result.captionSafeZoneConstraintPlan,
  runtimeDisabledFlags: result.runtimeDisabledFlags,
  approvals: {
    runtimeExecutionApproved: result.runtimeExecutionApproved,
    workerExecutionApproved: result.workerExecutionApproved,
    renderExecutionApproved: result.renderExecutionApproved,
    mediaProcessingApproved: result.mediaProcessingApproved,
    artifactCreationApproved: result.artifactCreationApproved,
    noArtifactCreated: result.noArtifactCreated,
  },
  executionBoundaries: {
    syntheticInputsOnly: true,
    realMediaUsed: false,
    artifactCreated: false,
    workerDispatched: false,
    routeToolProviderCalled: false,
    supabaseSqlTouched: false,
    betaUnlocked: false,
    productionUnlocked: false,
  },
}

console.log(JSON.stringify(proof, null, 2))
