import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  bindLivingFrameCanonicalPlanning,
  livingFramePlanningEvidenceBindingSchema,
  validateLivingFramePlanningEvidenceBinding,
} from '../../src/lib/living-frame'
import {
  projectCanonicalStorytellingStyleAuthority,
} from '../../src/lib/canonical-planning-draft'
import {
  createProfessionalSkillPlan,
} from '../../src/lib/professional-skills'
import {
  buildProfessionalExportCreditCoverage,
} from '../../src/lib/professional-export-policy'
import {
  calculatePrivateGcpVisualCoverageDigest,
  createPrivateGcpVisualUnderstandingPlan,
  finalizePrivateGcpVisualEvidencePackage,
} from '../../src/lib/private-gcp-visual-understanding-contract'
import type {
  CanonicalStorytellingStylePlanReviewSource,
} from '../../src/lib/canonical-planning-draft'
import type {
  PrivateGcpVisualCoverageManifest,
  PrivateGcpVisualEvidencePackage,
  PrivateGcpVisualObservation,
  PrivateGcpVisualServerReadinessEvidence,
  PrivateGcpVisualUnderstandingPlan,
} from '../../src/types/private-gcp-visual-understanding'
import type {
  PlannerInput,
} from '../../src/types/reeditpro'
import {
  canonicalMotionStudioStorytellingProductionAuthoritySchema,
  CANONICAL_MOTION_STUDIO_STORYTELLING_PRODUCTION_AUTHORITY_READER_VERSION,
  type CanonicalMotionStudioStorytellingProductionAuthority,
} from '../validation/canonical-motion-studio-storytelling-production-authority-schemas'
import {
  canonicalPlanComponentsSchema,
  type CanonicalPlanComponentsInput,
} from '../validation/edit-planning-authority-schemas'
import {
  bindCanonicalLivingFramePlanningEvidence,
  CANONICAL_LIVING_FRAME_PLANNING_EVIDENCE_READER_VERSION,
  PRIVATE_LIVING_FRAME_PLANNING_EVIDENCE_RESULT_VERSION,
  type CanonicalLivingFramePlanningEvidenceReaderPort,
  type PrivateLivingFramePlanningEvidenceReaderResult,
} from '../services/canonical-living-frame-planning-evidence-service'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

const WORKSPACE_ID = 'workspace-living-frame-evidence-smoke'
const PROJECT_ID = 'project-living-frame-evidence-smoke'
const EDIT_SESSION_ID = 'edit-living-frame-evidence-smoke'
const SOURCE_SEQUENCE_ITEM_ID = 'source-living-frame-evidence-1'
const MEDIA_ASSET_ID = 'media-living-frame-evidence-1'
const SOURCE_CHECKSUM = digest('living-frame-evidence-source-bytes')
const LOCATOR_ID = 'private-living-frame-evidence-locator-smoke'

const plannerInput: PlannerInput = {
  projectName: 'Living Frame evidence smoke',
  targetPlatform: 'youtube',
  aspectRatio: '16:9',
  aspectRatioConfirmed: true,
  frameTemplateType: 'horizontal_wide_frame',
  editingCategory: 'education_explainer',
  workflowType: 'education_explainer',
  editLevel: 'pro',
  structurePreference: 'improve_if_needed',
  moodStyle: 'premium',
  visualPreference: 'balanced_visual_mix',
  referenceUrl: '',
  customInstructions:
    'Use Living Frame storytelling for the central explanation.',
  creditPreference: 'balanced',
  clips: [{
    id: SOURCE_SEQUENCE_ITEM_ID,
    uploadedOrder: 1,
    fileName: 'controlled-source-fixture.mp4',
    duration: '0:10',
    detectedType: 'talking_head',
    sourceOrderLocked: true,
  }],
}

const professionalSkillPlan = createProfessionalSkillPlan({ plannerInput })
const ordinaryComponentsWithoutLivingFrame = createOrdinaryComponents()
const ordinaryBinding = await bindLivingFrameCanonicalPlanning({
  professionalSkillPlan,
  components: ordinaryComponentsWithoutLivingFrame,
})
assert.ok(ordinaryBinding.livingFrame)
const ordinaryComponents = canonicalPlanComponentsSchema.parse({
  ...ordinaryComponentsWithoutLivingFrame,
  livingFrame: ordinaryBinding.livingFrame,
})

const visualFixture = createVisualEvidenceFixture({
  workspaceId: WORKSPACE_ID,
  projectId: PROJECT_ID,
  editSessionId: EDIT_SESSION_ID,
  sourceAssetId: MEDIA_ASSET_ID,
  sourceChecksumSha256: SOURCE_CHECKSUM,
})
const exactReaderResult = createReaderResult({
  workspaceId: WORKSPACE_ID,
  projectId: PROJECT_ID,
  editSessionId: EDIT_SESSION_ID,
  sourceSequenceItemId: SOURCE_SEQUENCE_ITEM_ID,
  mediaAssetId: MEDIA_ASSET_ID,
  plan: visualFixture.plan,
  evidence: visualFixture.evidence,
})
const exactReader = createReader(exactReaderResult)

const binding = await bindCanonicalLivingFramePlanningEvidence({
  locator: locator(LOCATOR_ID),
  canonicalContext: {
    workspaceId: WORKSPACE_ID,
    projectId: PROJECT_ID,
    editSessionId: EDIT_SESSION_ID,
    components: ordinaryComponents,
  },
  reader: exactReader,
})

assert.equal(binding.status, 'available_for_preapproval_reasoning')
assert.equal(binding.sourceMode, 'uploaded_media')
assert.equal(
  binding.evidenceClass,
  'private_source_bound_visual_observation_projection',
)
assert.equal(binding.sourceEvidenceCount, 1)
assert.equal(binding.sourceEvidence[0]?.sourceSequenceItemId, SOURCE_SEQUENCE_ITEM_ID)
assert.equal(binding.sourceEvidence[0]?.mediaAssetId, MEDIA_ASSET_ID)
assert.equal(binding.sourceEvidence[0]?.sourceChecksumSha256, SOURCE_CHECKSUM)
assert.equal(binding.sourceEvidence[0]?.observationCount, 2)
assert.equal(binding.sourceEvidence[0]?.observations[0]?.order, 0)
assert.equal(binding.sourceEvidence[0]?.observations[1]?.order, 1)
assert.equal(binding.sourceEvidence[0]?.reasoningConsumptionAllowed, true)
assert.equal(binding.sourceEvidence[0]?.userReviewRequired, false)
assert.equal(
  binding.canonicalBindings.livingFrameComponentDigestSha256,
  ordinaryBinding.livingFrame.contractDigestSha256,
)
assert.equal(binding.canonicalBindings.ideaFirstAuthorityDigestSha256, null)
assert.deepEqual(binding.authorityBoundary, {
  planningEvidenceOnly: true,
  liveEvidenceAuthority: false,
  selectedSceneAuthority: false,
  timingAuthority: false,
  soundAuthority: false,
  estimateAuthority: false,
  approvalAuthority: false,
  snapshotAuthority: false,
  executionAuthority: false,
  runtimeAuthority: false,
  queueAuthority: false,
  providerAuthority: false,
  toolRouteAuthority: false,
  costAuthority: false,
  qaAuthority: false,
  productionReady: false,
})

const secondBinding = await bindCanonicalLivingFramePlanningEvidence({
  locator: locator(LOCATOR_ID),
  canonicalContext: {
    workspaceId: WORKSPACE_ID,
    projectId: PROJECT_ID,
    editSessionId: EDIT_SESSION_ID,
    components: ordinaryComponents,
  },
  reader: exactReader,
})
assert.deepEqual(secondBinding, binding)
assert.equal(
  (await validateLivingFramePlanningEvidenceBinding(binding)).ok,
  true,
)

const serialized = JSON.stringify(binding)
assert.equal(serialized.includes(LOCATOR_ID), false)
for (const forbidden of [
  'storageBucket',
  'storageObjectName',
  'storageObjectGeneration',
  'rawChat',
  'rawTranscript',
  'customInstructions',
  'providerRoute',
  'providerModel',
  'toolId',
  'toolRoute',
  'jobId',
  'queueId',
  'workItem',
  'approvedAt',
  'creditReservation',
  'customerCredits',
  'serviceFee',
  'runtimeExecutionAuthorized',
]) {
  assert.equal(
    serialized.includes(`"${forbidden}"`),
    false,
    `Planning evidence projection must not expose ${forbidden}.`,
  )
}

await assert.rejects(
  bindCanonicalLivingFramePlanningEvidence({
    locator: locator(null),
    canonicalContext: {
      workspaceId: WORKSPACE_ID,
      projectId: PROJECT_ID,
      editSessionId: EDIT_SESSION_ID,
      components: ordinaryComponents,
    },
    reader: exactReader,
  }),
  /server-owned visual evidence locator/,
)
await assert.rejects(
  bindCanonicalLivingFramePlanningEvidence({
    locator: locator(LOCATOR_ID),
    canonicalContext: {
      workspaceId: WORKSPACE_ID,
      projectId: PROJECT_ID,
      editSessionId: EDIT_SESSION_ID,
      components: ordinaryComponents,
    },
    reader: null,
  }),
  /private visual evidence reader/,
)
await assert.rejects(
  bindCanonicalLivingFramePlanningEvidence({
    locator: locator(LOCATOR_ID),
    canonicalContext: {
      workspaceId: WORKSPACE_ID,
      projectId: PROJECT_ID,
      editSessionId: EDIT_SESSION_ID,
      components: ordinaryComponents,
    },
    reader: createReader({
      ...exactReaderResult,
      workspaceId: 'workspace-wrong-living-frame-evidence',
    }),
  }),
  /another canonical scope/,
)
await assert.rejects(
  bindCanonicalLivingFramePlanningEvidence({
    locator: locator(LOCATOR_ID),
    canonicalContext: {
      workspaceId: WORKSPACE_ID,
      projectId: PROJECT_ID,
      editSessionId: EDIT_SESSION_ID,
      components: ordinaryComponents,
    },
    reader: createReader({
      ...exactReaderResult,
      records: [{
        ...exactReaderResult.records[0]!,
        mediaAssetId: 'media-wrong-living-frame-evidence',
      }],
    }),
  }),
  /source identity or order is stale/,
)
await assert.rejects(
  bindCanonicalLivingFramePlanningEvidence({
    locator: locator(LOCATOR_ID),
    canonicalContext: canonicalContext(ordinaryComponents),
    reader: createReader({
      ...exactReaderResult,
      records: [{
        ...exactReaderResult.records[0]!,
        plan: {
          ...visualFixture.plan,
          source: {
            ...visualFixture.plan.source,
            sourceChecksumSha256: digest('wrong-private-source-checksum'),
          },
        },
      }],
    }),
  }),
  /plan is stale, malformed, or belongs to another source/,
)
await assert.rejects(
  bindCanonicalLivingFramePlanningEvidence({
    locator: locator(LOCATOR_ID),
    canonicalContext: canonicalContext(ordinaryComponents),
    reader: createReader({
      ...exactReaderResult,
      records: [],
    }),
  }),
  /exact canonical source sequence/,
)
await assert.rejects(
  bindCanonicalLivingFramePlanningEvidence({
    locator: locator(LOCATOR_ID),
    canonicalContext: {
      workspaceId: WORKSPACE_ID,
      projectId: PROJECT_ID,
      editSessionId: EDIT_SESSION_ID,
      components: ordinaryComponents,
    },
    reader: createReader({
      ...exactReaderResult,
      records: [
        exactReaderResult.records[0]!,
        exactReaderResult.records[0]!,
      ],
    }),
  }),
  /exact canonical source sequence/,
)
await assert.rejects(
  bindCanonicalLivingFramePlanningEvidence({
    locator: locator(LOCATOR_ID),
    canonicalContext: {
      workspaceId: WORKSPACE_ID,
      projectId: PROJECT_ID,
      editSessionId: EDIT_SESSION_ID,
      components: ordinaryComponents,
    },
    reader: createReader(createReaderResult({
      ...readerIdentity(),
      sourceSequenceItemId: SOURCE_SEQUENCE_ITEM_ID,
      mediaAssetId: MEDIA_ASSET_ID,
      plan: visualFixture.plan,
      evidence: {
        ...visualFixture.evidence,
        evidencePackageHash: digest('tampered-evidence-package'),
      },
    })),
  }),
  /reasoning-consumption gates/,
)

const lowConfidenceEvidence = finalizePrivateGcpVisualEvidencePackage({
  plan: visualFixture.plan,
  observations: visualFixture.observations.map((observation, index) => ({
    ...observation,
    confidenceBasisPoints: index === 0 ? 5_999 : observation.confidenceBasisPoints,
  })),
  coveredRequiredWindowIds: ['window-source-baseline'],
  unsupportedClaimCount: 0,
  deterministicQaPassed: true,
})
await assert.rejects(
  bindCanonicalLivingFramePlanningEvidence({
    locator: locator(LOCATOR_ID),
    canonicalContext: canonicalContext(ordinaryComponents),
    reader: createReader(createReaderResult({
      ...readerIdentity(),
      sourceSequenceItemId: SOURCE_SEQUENCE_ITEM_ID,
      mediaAssetId: MEDIA_ASSET_ID,
      plan: visualFixture.plan,
      evidence: lowConfidenceEvidence,
    })),
  }),
  /reasoning-consumption gates/,
)

const transcriptClaimEvidence = finalizePrivateGcpVisualEvidencePackage({
  plan: visualFixture.plan,
  observations: visualFixture.observations,
  coveredRequiredWindowIds: ['window-source-baseline'],
  unsupportedClaimCount: 0,
  deterministicQaPassed: true,
  audioOrTranscriptAuthorityClaimed: true,
})
await assert.rejects(
  bindCanonicalLivingFramePlanningEvidence({
    locator: locator(LOCATOR_ID),
    canonicalContext: canonicalContext(ordinaryComponents),
    reader: createReader(createReaderResult({
      ...readerIdentity(),
      sourceSequenceItemId: SOURCE_SEQUENCE_ITEM_ID,
      mediaAssetId: MEDIA_ASSET_ID,
      plan: visualFixture.plan,
      evidence: transcriptClaimEvidence,
    })),
  }),
  /reasoning-consumption gates/,
)

for (const unsafeSummary of [
  'Inspect https://unsafe.example/private-source before planning.',
  'Inspect /Users/private/source.mp4 before planning.',
  'Use api_key=controlled-secret-shaped-value before planning.',
]) {
  const unsafeSummaryEvidence = finalizePrivateGcpVisualEvidencePackage({
    plan: visualFixture.plan,
    observations: visualFixture.observations.map((observation, index) => ({
      ...observation,
      summary: index === 0 ? unsafeSummary : observation.summary,
    })),
    coveredRequiredWindowIds: ['window-source-baseline'],
    unsupportedClaimCount: 0,
    deterministicQaPassed: true,
  })
  await assert.rejects(
    bindCanonicalLivingFramePlanningEvidence({
      locator: locator(LOCATOR_ID),
      canonicalContext: canonicalContext(ordinaryComponents),
      reader: createReader(createReaderResult({
        ...readerIdentity(),
        sourceSequenceItemId: SOURCE_SEQUENCE_ITEM_ID,
        mediaAssetId: MEDIA_ASSET_ID,
        plan: visualFixture.plan,
        evidence: unsafeSummaryEvidence,
      })),
    }),
    /projection is unsafe or invalid/,
  )
}

await assert.rejects(
  bindCanonicalLivingFramePlanningEvidence({
    locator: locator(LOCATOR_ID),
    canonicalContext: canonicalContext({
      ...ordinaryComponents,
      sourceSequence: [{
        ...ordinaryComponents.sourceSequence[0]!,
        checksumSha256: digest('changed-canonical-source'),
      }],
    }),
    reader: exactReader,
  }),
  /source or authority expectations are stale/,
)

assert.equal(
  livingFramePlanningEvidenceBindingSchema.safeParse({
    ...binding,
    rawTranscript: 'untrusted raw transcript',
  }).success,
  false,
)
assert.equal(
  livingFramePlanningEvidenceBindingSchema.safeParse({
    ...binding,
    authorityBoundary: Object.fromEntries(
      Object.keys(binding.authorityBoundary).map((key) => [key, true]),
    ),
    status: 'verified_live_production_ready',
  }).success,
  false,
)
assert.equal(
  (await validateLivingFramePlanningEvidenceBinding({
    ...binding,
    contractDigestSha256: digest('forged-binding-digest'),
  })).ok,
  false,
)

const ideaFirstComponentsWithoutLivingFrame = createIdeaFirstComponents()
const ideaFirstLivingFrame = await bindLivingFrameCanonicalPlanning({
  professionalSkillPlan,
  components: ideaFirstComponentsWithoutLivingFrame,
})
assert.ok(ideaFirstLivingFrame.livingFrame)
const ideaFirstComponents = canonicalPlanComponentsSchema.parse({
  ...ideaFirstComponentsWithoutLivingFrame,
  livingFrame: ideaFirstLivingFrame.livingFrame,
})
let ideaFirstReaderCalled = false
const ideaFirstBinding = await bindCanonicalLivingFramePlanningEvidence({
  locator: locator(null),
  canonicalContext: canonicalContext(ideaFirstComponents),
  reader: {
    ...exactReader,
    async readByServerOwnedLocator() {
      ideaFirstReaderCalled = true
      return exactReaderResult
    },
  },
})
assert.equal(ideaFirstReaderCalled, false)
assert.equal(ideaFirstBinding.status, 'not_applicable_idea_first')
assert.equal(ideaFirstBinding.sourceMode, 'idea_first_no_uploaded_media')
assert.equal(ideaFirstBinding.sourceEvidenceCount, 0)
assert.equal(ideaFirstBinding.sourceEvidence.length, 0)
assert.equal(
  ideaFirstBinding.canonicalBindings.ideaFirstAuthorityDigestSha256,
  ideaFirstComponents.motionStudioStorytellingProductionAuthority?.authorityHash,
)
assert.equal(ideaFirstBinding.authorityBoundary.productionReady, false)
await assert.rejects(
  bindCanonicalLivingFramePlanningEvidence({
    locator: locator(LOCATOR_ID),
    canonicalContext: canonicalContext(ideaFirstComponents),
    reader: exactReader,
  }),
  /exact canonical source-less authority/,
)

console.log(JSON.stringify({
  schemaVersion: binding.contractVersion,
  sourceEvidenceCount: binding.sourceEvidenceCount,
  observationCount: binding.sourceEvidence[0]?.observationCount,
  exactSourceAndTenantBinding: true,
  staleSourceRejected: true,
  wrongChecksumRejected: true,
  missingEvidenceRejected: true,
  missingReaderRejected: true,
  tamperedEvidenceRejected: true,
  lowConfidenceReviewRejected: true,
  audioTranscriptAuthorityRejected: true,
  privateLocatorAndStorageNotProjected: true,
  exactIdeaFirstNotApplicableAdmitted: true,
  falseIdeaFirstRejected: true,
  allRuntimeAuthoritiesClosed: true,
  fixturePromotable: false,
}))

function locator(serverOwnedLocatorId: string | null) {
  return {
    schemaVersion:
      'canonical-living-frame-planning-evidence-locator-v1' as const,
    serverOwnedLocatorId,
  }
}

function canonicalContext(components: CanonicalPlanComponentsInput) {
  return {
    workspaceId: WORKSPACE_ID,
    projectId: PROJECT_ID,
    editSessionId: EDIT_SESSION_ID,
    components,
  }
}

function readerIdentity() {
  return {
    workspaceId: WORKSPACE_ID,
    projectId: PROJECT_ID,
    editSessionId: EDIT_SESSION_ID,
  }
}

function createReader(
  result: PrivateLivingFramePlanningEvidenceReaderResult,
): CanonicalLivingFramePlanningEvidenceReaderPort {
  return {
    schemaVersion:
      CANONICAL_LIVING_FRAME_PLANNING_EVIDENCE_READER_VERSION,
    sourceAuthority: 'private_gcp_visual_evidence_repository',
    evidenceClass: 'controlled_private_source_evidence_reader',
    productionReady: false,
    async readByServerOwnedLocator(input) {
      assert.equal(input.serverOwnedLocatorId, LOCATOR_ID)
      assert.deepEqual(input.expectedScope, readerIdentity())
      return result
    },
  }
}

function createReaderResult(input: {
  workspaceId: string
  projectId: string
  editSessionId: string
  sourceSequenceItemId: string
  mediaAssetId: string
  plan: PrivateGcpVisualUnderstandingPlan
  evidence: PrivateGcpVisualEvidencePackage
}): PrivateLivingFramePlanningEvidenceReaderResult {
  return {
    schemaVersion: PRIVATE_LIVING_FRAME_PLANNING_EVIDENCE_RESULT_VERSION,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    records: [{
      sourceSequenceItemId: input.sourceSequenceItemId,
      mediaAssetId: input.mediaAssetId,
      plan: input.plan,
      evidence: input.evidence,
    }],
  }
}

function createVisualEvidenceFixture(input: {
  workspaceId: string
  projectId: string
  editSessionId: string
  sourceAssetId: string
  sourceChecksumSha256: string
}): {
  plan: PrivateGcpVisualUnderstandingPlan
  evidence: PrivateGcpVisualEvidencePackage
  observations: PrivateGcpVisualObservation[]
} {
  const coverageWithoutDigest: Omit<
    PrivateGcpVisualCoverageManifest,
    'coverageDigestSha256'
  > = {
    policyVersion: 'private-gcp-qwen25vl-sampling-policy-v1',
    profileId: 'professional_key_moment_visual_coverage_v1',
    editLevel: 'premium',
    deterministicTechnicalCoverageComplete: true,
    sceneDetectionArtifactId: 'living-frame-scene-detection-smoke',
    sceneDetectionArtifactSha256: digest('living-frame-scene-detection'),
    detectedSceneCount: 1,
    visuallyCoveredSceneCount: 1,
    maximumUnobservedSpanSeconds: 10,
    samplesPerBatchMaximum: 64,
    batchCount: 1,
    samples: [{
      sampleId: 'sample-living-frame-source-baseline',
      sourceFrame: 0,
      reason: 'scene_representative',
      source: 'analysis_proxy_frame',
      proxyFrameChecksumSha256: digest('living-frame-proxy-frame'),
      rawFramePersistenceAllowed: false,
    }],
    windows: [{
      windowId: 'window-source-baseline',
      reason: 'scene_representative',
      detectedSceneId: 'detected-scene-living-frame-1',
      startFrame: 0,
      endFrameExclusive: 300,
      required: true,
      sampleIds: ['sample-living-frame-source-baseline'],
    }],
  }
  const coverage: PrivateGcpVisualCoverageManifest = {
    ...coverageWithoutDigest,
    coverageDigestSha256:
      calculatePrivateGcpVisualCoverageDigest(coverageWithoutDigest),
  }
  const plan = createPrivateGcpVisualUnderstandingPlan({
    analysisRunId: 'analysis-run-living-frame-evidence-smoke',
    attemptId: 'attempt-living-frame-evidence-smoke-1',
    attemptOrdinal: 1,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    idempotencyKey: 'living-frame-evidence-smoke-attempt-1',
    authority: {
      phase: 'preplan_internal_source_analysis',
      authenticatedUserId: 'user-living-frame-evidence-smoke',
      sourceStudyAuthorizationId: 'source-study-living-frame-evidence-smoke',
      internalAnalysisBudgetAuthorityId:
        'internal-budget-living-frame-evidence-smoke',
      userAnalysisConsentRecordedAt: '2026-07-25T12:00:00.000Z',
      customerCreditReservationId: null,
      customerChargeAuthorized: false,
    },
    source: {
      sourceAssetId: input.sourceAssetId,
      storageBucket: 'reeditpro-private-media',
      storageObjectName:
        'workspaces/living-frame-evidence/source/original.mp4',
      storageObjectGeneration: '123456789',
      sourceChecksumSha256: input.sourceChecksumSha256,
      sourceByteLength: 10_000_000,
      sourceWidth: 3_840,
      sourceHeight: 2_160,
      durationFrames: 300,
      frameRateNumerator: 30,
      frameRateDenominator: 1,
      immutableOriginal: true,
      privateObject: true,
    },
    proxy: {
      proxyAssetId: 'proxy-asset-living-frame-evidence-smoke',
      storageBucket: 'reeditpro-private-media',
      storageObjectName:
        'workspaces/living-frame-evidence/proxy/analysis.mp4',
      storageObjectGeneration: '123456790',
      proxyChecksumSha256: digest('living-frame-evidence-proxy'),
      sourceChecksumSha256: input.sourceChecksumSha256,
      profileId: 'professional_1080p_analysis_proxy_v2',
      width: 1_920,
      height: 1_080,
      outputColorSpace: 'bt709',
      colorTransformStatus: 'validated_rec709_sdr',
      privateObject: true,
      originalMasterPreserved: true,
    },
    checkpoint: {
      modelId: 'qwen2.5-vl-7b-instruct',
      checkpointSha256: digest('living-frame-qwen-checkpoint'),
      tokenizerSha256: digest('living-frame-qwen-tokenizer'),
      processorSha256: digest('living-frame-qwen-processor'),
      containerImageDigest:
        `sha256:${digest('living-frame-visual-worker-image')}`,
      precision: 'bf16',
      modelApprovalRecordId: 'living-frame-qwen-model-approval',
      licenseReviewRecordId: 'living-frame-qwen-license-review',
    },
    coverage,
    evidenceSchemaVersion: 'private-gcp-qwen25vl-evidence-schema-v1',
    promptPolicyVersion: 'private-gcp-qwen25vl-visual-prompt-policy-v1',
    serverReadiness: verifiedReadinessFixture(),
  })
  assert.equal(plan.executionReady, true)
  const observations: PrivateGcpVisualObservation[] = [{
    observationId: 'observation-living-frame-layout',
    startFrame: 0,
    endFrameExclusive: 150,
    evidenceSampleIds: ['sample-living-frame-source-baseline'],
    category: 'layout',
    summary:
      'The speaker occupies the right side while the left side remains visually open.',
    confidenceBasisPoints: 9_200,
    userCorrectionId: null,
  }, {
    observationId: 'observation-living-frame-gesture-risk',
    startFrame: 150,
    endFrameExclusive: 300,
    evidenceSampleIds: ['sample-living-frame-source-baseline'],
    category: 'visual_risk',
    summary:
      'The speaker gesture crosses the center and requires later face and gesture protection.',
    confidenceBasisPoints: 8_800,
    userCorrectionId: null,
  }]
  const evidence = finalizePrivateGcpVisualEvidencePackage({
    plan,
    observations,
    coveredRequiredWindowIds: ['window-source-baseline'],
    unsupportedClaimCount: 0,
    deterministicQaPassed: true,
  })
  return { plan, evidence, observations }
}

function verifiedReadinessFixture(): PrivateGcpVisualServerReadinessEvidence {
  return {
    source: 'server_owned_private_gcp_visual_readiness',
    executionEnvironment: 'internal',
    readinessEvidenceId: 'controlled-living-frame-readiness-fixture',
    readinessEvidenceSha256: digest('controlled-living-frame-readiness'),
    verifiedAt: '2026-07-25T12:00:00.000Z',
    cloudRunJobResourceVerified: true,
    workerServiceAccountAndIamVerified: true,
    privateGcsGenerationBoundTransportVerified: true,
    workerImageDigestVerified: true,
    checkpointPresentInApprovedImage: true,
    modelAndLicenseApprovalVerified: true,
    canonicalQueueLeaseAndOneUseDispatchVerified: true,
    cancellationRetryAndLeaseRecoveryVerified: true,
    telemetryAndCostRateSnapshotVerified: true,
    deploymentRegionAndDataPolicyVerified: true,
    environmentGpuExecutionGateVerified: true,
  }
}

function createOrdinaryComponents(): CanonicalPlanComponentsInput {
  return canonicalPlanComponentsSchema.parse(baseCanonicalComponents({
    sourceSequence: [{
      sourceSequenceItemId: SOURCE_SEQUENCE_ITEM_ID,
      mediaAssetId: MEDIA_ASSET_ID,
      uploadedOrder: 1,
      checksumSha256: SOURCE_CHECKSUM,
      required: true,
    }],
    sourceCleanupSummary: {
      status: 'confirmed',
      cleanupPreference: 'balanced_cleanup',
      trimValidationStatus: 'passed',
      meaningValidationStatus: 'passed',
      userReviewRequired: false,
    },
    sourceCleanupPlan: {
      status: 'confirmed',
      decisions: [{
        decisionId: 'cleanup-living-frame-evidence-source',
        sourceSequenceItemId: SOURCE_SEQUENCE_ITEM_ID,
        action: 'preserve',
        startFrame: 0,
        endFrameExclusive: 300,
        reason: 'Preserve the complete controlled source fixture.',
        confidence: 1,
        meaningPreservationStatus: 'passed',
        userReviewStatus: 'not_required',
      }],
    },
  }))
}

function createIdeaFirstComponents(): CanonicalPlanComponentsInput {
  const base = baseCanonicalComponents({
    sourceSequence: [],
    sourceCleanupSummary: {
      status: 'not_applicable',
      cleanupPreference: 'idea_first_not_applicable',
      trimValidationStatus: 'not_applicable',
      meaningValidationStatus: 'not_applicable',
      userReviewRequired: false,
      reason: 'idea_first_storytelling_has_no_uploaded_media_source',
    },
    sourceCleanupPlan: {
      status: 'not_applicable',
      decisions: [],
      reason: 'idea_first_storytelling_has_no_uploaded_media_source',
    },
  })
  const style = projectCanonicalStorytellingStyleAuthority(
    createStylePlanReviewSource(),
  )
  const productionAuthority = createIdeaFirstProductionAuthority({
    style,
    components: base,
  })
  return canonicalPlanComponentsSchema.parse({
    ...base,
    motionStudioStorytellingStyleAuthority: style,
    motionStudioStorytellingProductionAuthority: productionAuthority,
  })
}

function baseCanonicalComponents(source: {
  sourceSequence: unknown[]
  sourceCleanupSummary: unknown
  sourceCleanupPlan: unknown
}) {
  return {
    compiledIntent: {
      goalSummary:
        'Use Living Frame only after exact source evidence is available.',
    },
    professionalEditingDirective: {
      mustFollowRules: ['Preserve source meaning and visual truth.'],
    },
    confirmedSettings: {
      aspectRatio: '16:9',
      outputFrame: { width: 3_840, height: 2_160, fps: 30 },
      outputFramePurpose: 'private_canonical_4k_master_review',
      professionalExportCoverage: buildProfessionalExportCreditCoverage({
        durationSeconds: 10,
        outputFps: 30,
        approvedAspectRatio: '16:9',
      }),
      outputFrameConfirmed: true,
      sourceOrderConfirmed: true,
      sourceCleanupConfirmed: true,
      editLevel: 'pro',
      targetPlatform: 'youtube',
      preferenceSnapshotId: 'living-frame-evidence-preference-snapshot',
      preferenceRevision: 1,
      preferencePlanningInputRevision: 1,
      preferenceFingerprintSha256: digest('living-frame-evidence-preference'),
    },
    sourceSequence: source.sourceSequence,
    sourceCleanupSummary: source.sourceCleanupSummary,
    sourceCleanupPlan: source.sourceCleanupPlan,
    masterTimingPlan: {
      id: 'master-timing-living-frame-evidence',
      status: 'ready',
      timingBase: { fps: 30, totalFrames: 300 },
      totalFrames: 300,
    },
    captionVisualCueTimingPlan: { status: 'synced' },
    soundSyncTransitionTimingPlan: {
      status: 'not_needed',
      speechPriority: true,
    },
    timingValidationPlan: {
      overallStatus: 'passed',
      approvalBlocked: false,
    },
    timingSummary: {
      validationStatus: 'passed',
      approvalBlocked: false,
      fps: 30,
      totalFrames: 300,
    },
    segments: [{
      segmentId: 'segment-living-frame-evidence-1',
      startFrame: 0,
      endFrameExclusive: 300,
      operationIds: ['operation-living-frame-evidence-1'],
    }],
    visualAssetPlan: { status: 'not_needed' },
    colorPipelinePlan: { status: 'not_provided' },
    rendererPlan: { renderer: 'remotion', frameOwnedByRenderer: true },
    toolStrategyPlan: { toolIds: [] },
    qaPlan: { checks: [] },
    qaSummary: { status: 'passed', approvalBlocked: false },
    providerPolicy: { veoPolicy: 'forbidden', approvedRoutes: [] },
    fallbackPolicy: { unapprovedFallbackAllowed: false },
  }
}

function createStylePlanReviewSource():
  CanonicalStorytellingStylePlanReviewSource {
  const selectionDigest = digest('living-frame-style-selection')
  return {
    schemaVersion: 'motion-studio.storytelling-style-plan-review-input.v1',
    workspaceId: WORKSPACE_ID,
    projectId: PROJECT_ID,
    editSessionId: EDIT_SESSION_ID,
    productionId: 'production-living-frame-idea-first-smoke',
    styleSelection: {
      schemaVersion: 'motion-studio.storytelling-style-selection.v1',
      id: 'living-frame-style-selection',
      state: 'selected_for_plan',
      selectionDigest,
      styleProfile: {
        styleProfileId: 'storytelling_style.editorial_collage',
        styleProfileVersion: '1.0.1',
        styleProfileDigest: digest('living-frame-style-profile'),
      },
      motionLanguage: {
        motionLanguageId: 'living-frame-motion-language',
        motionLanguageVersion: '1.0.1',
        motionLanguageDigest: digest('living-frame-motion-language'),
      },
      motionDnaVersion: {
        artifactId: 'living-frame-motion-dna',
        versionId: 'living-frame-motion-dna-v1',
        versionNumber: 1,
        contentDigest: digest('living-frame-motion-dna-v1'),
      },
      referenceContractVersions: [],
      sourceAuditDigests: [digest('living-frame-source-audit')],
    },
    calibrationPlan: {
      schemaVersion: 'motion-studio.style-calibration-plan.v1',
      id: 'living-frame-style-calibration',
      planDigest: digest('living-frame-style-calibration'),
      styleSelectionDigest: selectionDigest,
      routePolicy: { policyId: 'motion_studio_generation_route_policy_v2' },
      scenarios: [
        { id: 'lf-style-led-motion', kind: 'style_led_motion' },
        { id: 'lf-character-continuity', kind: 'character_continuity' },
        { id: 'lf-first-last-frame', kind: 'strict_first_last_frame' },
        { id: 'lf-reference-heavy', kind: 'reference_heavy' },
        { id: 'lf-exact-text-data', kind: 'exact_text_data' },
      ],
      estimatedInternalCostRangeMicros: {
        minimum: 100_000,
        maximum: 500_000,
      },
      approvalAuthority: { state: 'planning_only' },
      automaticFallbackAllowed: false,
      fallbackRequiresNewApproval: true,
      bulkGenerationAllowed: false,
    },
    internalCostEstimateId: 'living-frame-style-internal-cost',
    internalCostEstimateDigest:
      digest('living-frame-style-internal-cost'),
    internalCostEnvelopeIncludedInPlanReview: true,
    customerPricingCalculatedHere: false,
    customerCreditsMutated: false,
    decisionAuthority: 'existing_plan_review',
    runtimeExecutionAuthorized: false,
    immutable: true,
  }
}

function createIdeaFirstProductionAuthority(input: {
  style: ReturnType<typeof projectCanonicalStorytellingStyleAuthority>
  components: ReturnType<typeof baseCanonicalComponents>
}): CanonicalMotionStudioStorytellingProductionAuthority {
  const totalFrames = 300
  const fps = 30 as const
  const timingAuthorityDigest = digest('living-frame-idea-first-timing')
  const version = (
    artifactId: string,
    state: 'approved' | 'locked',
  ) => ({
    artifactId,
    versionId: `${artifactId}-v1`,
    versionNumber: 1,
    contentDigest: digest(`${artifactId}-v1`),
    state,
  })
  const authorityWithoutHash = {
    schemaVersion:
      'canonical-motion-studio-storytelling-production-authority-v1' as const,
    componentKey:
      'motionStudioStorytellingProductionAuthority' as const,
    sourceProposal: {
      schemaVersion:
        'motion-studio.storytelling-production-authority-proposal.v1' as const,
      componentProposalDigest:
        digest('living-frame-idea-first-source-proposal'),
      evidenceClass:
        'motion_feature_owned_proposal_backend_admission_pending' as const,
      canonicalBackendAdmissionAuthorized: false as const,
    },
    sourceVerification: {
      readerVersion:
        CANONICAL_MOTION_STUDIO_STORYTELLING_PRODUCTION_AUTHORITY_READER_VERSION,
      sourceAuthority:
        'motion_studio_storytelling_artifact_repository' as const,
      evidenceClass:
        'controlled_local_source_verified_non_promotable' as const,
      sourceRepositoryRevision: 1,
      sourceRepositoryReadDigest:
        digest('living-frame-idea-first-source-read'),
      sourcePayloadDigestsReverified: true as const,
      exactScopeReverified: true as const,
      exactApprovalStatesReverified: true as const,
    },
    workspaceId: input.style.workspaceId,
    projectId: input.style.projectId,
    editSessionId: input.style.editSessionId,
    productionId: input.style.productionId,
    sourceMode: 'idea_first_no_uploaded_media' as const,
    preparedScript: {
      version: version('living-frame-prepared-script', 'locked'),
      scriptId: 'living-frame-idea-first-script',
      userLockedText: true as const,
      narrationSegmentCount: 1,
    },
    sourceArtifactApprovalSnapshotId:
      'living-frame-source-artifact-approval-snapshot',
    orderedScenes: [{
      order: 0,
      sceneId: 'living-frame-idea-first-scene',
      chapterId: 'living-frame-idea-first-chapter',
      title: 'Controlled idea-first scene',
      semanticPurpose:
        'Bind the source-less not-applicable evidence disposition.',
      productionMode: 'native_graphics_first' as const,
      version: version('living-frame-scene-document', 'approved'),
      startTimingAnchorId: 'living-frame-timing-start',
      endTimingAnchorId: 'living-frame-timing-end',
      startFrame: 0,
      endFrame: totalFrames,
    }],
    narrationPolicy: {
      mode: 'verified_uploaded_narration' as const,
      requiredByPreviewProfile: true as const,
      voiceBibleVersion: version('living-frame-voice-bible', 'locked'),
      uploadedNarrationAuthorityDigest:
        digest('living-frame-uploaded-narration-authority'),
      mediaAssetId: 'living-frame-narration-media',
      storageObjectRecordId: 'living-frame-narration-storage',
      checksumSha256: digest('living-frame-narration-bytes'),
      mimeType: 'audio/wav' as const,
      byteLength: 48_044,
      durationMilliseconds: 10_000,
      normalizedNarrationRequiredBeforePreview: false as const,
      providerExecutionAuthorized: false as const,
    },
    timingAuthority: {
      masterTimingPlanVersionId: 'living-frame-master-timing-v1',
      confirmedFrameId: 'living-frame-confirmed-frame-v1',
      timingAuthorityDigest,
      frameRate: fps,
      width: input.components.confirmedSettings.outputFrame.width,
      height: input.components.confirmedSettings.outputFrame.height,
      aspectRatio: input.components.confirmedSettings.aspectRatio,
      durationFrames: totalFrames,
      timebase: '30/1',
    },
    confirmedOutputFrame: {
      confirmedFrameId: 'living-frame-confirmed-frame-v1',
      width: input.components.confirmedSettings.outputFrame.width,
      height: input.components.confirmedSettings.outputFrame.height,
      aspectRatio: input.components.confirmedSettings.aspectRatio,
      frameRate: fps,
      durationFrames: totalFrames,
      timingAuthorityDigest,
    },
    storytellingStyleAuthority: {
      componentKey: 'motionStudioStorytellingStyleAuthority' as const,
      componentDigest: sha256AuthorityValue(input.style),
      selectionDigest: input.style.styleSelection.selectionDigest,
      styleProfileId: input.style.styleSelection.styleProfile.styleProfileId,
      motionLanguageDigest:
        input.style.styleSelection.motionLanguage.motionLanguageDigest,
    },
    sourceCleanup: {
      applicability: 'not_applicable' as const,
      reason:
        'idea_first_storytelling_has_no_uploaded_media_source' as const,
      decisionCount: 0 as const,
      fabricatedSourceRecordAllowed: false as const,
    },
    internalCostAuthority: {
      estimateId: input.style.internalCostEnvelope.estimateId,
      estimateDigest: input.style.internalCostEnvelope.estimateDigest,
      maximumAuthorizedInternalProductionCostMicros:
        input.style.internalCostEnvelope
          .maximumEstimatedInternalProductionCostMicros,
      internalProductionCostOnly: true as const,
      customerPriceIncluded: false as const,
      customerCreditsIncluded: false as const,
      serviceFeeIncluded: false as const,
    },
    changedScriptSceneNarrationStyleFrameOrTimingRequiresFreshPlanAndEstimate:
      true as const,
    historicalApprovedSnapshotRemainsImmutable: true as const,
    sourceRepositoryReverified: true as const,
    noUploadedSourceExpected: true as const,
    fabricatedUploadRecordCount: 0 as const,
    privateInternalControlledPlanningOnly: true as const,
    runtimeExecutionAuthorized: false as const,
    providerExecutionAuthorized: false as const,
    customerCommercialAuthorityGranted: false as const,
    productionReady: false as const,
    immutable: true as const,
  }
  return canonicalMotionStudioStorytellingProductionAuthoritySchema.parse({
    ...authorityWithoutHash,
    authorityHash: sha256AuthorityValue(authorityWithoutHash),
  })
}

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
