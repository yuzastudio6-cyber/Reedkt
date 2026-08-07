import assert from 'node:assert/strict'
import { spawnSync, type SpawnSyncReturns } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

import {
  BROLL_CAPABILITY_MANIFEST,
  BROLL_PROVIDER_OPERATIONS,
  BROLL_TOOL_OPERATIONS,
  BrollCanonicalPrivateExecutionCoordinator,
  brollPlanArtifactSchema,
  brollPlanningQaReportSchema,
  compileBrollCanonicalWorkGraph,
  createBrollAssignment,
  createBrollCanonicalInjectedTestObservation,
  createBrollCanonicalPrivateRuntimeBindings,
  createBrollMasterTimingPlan,
  createBrollPlanningContext,
  createBrollPublicContextManifest,
  createBrollSourceInventory,
  createBrollVisualIntelligenceCandidateQa,
  createBrollVisualOwnershipManifest,
  createSourceMediaArtifactV1,
  projectBrollCanonicalWorkItems,
  type BrollPlanningContext,
  type BrollSourceCandidate,
  type BrollSkillAssignment,
  type SourceMediaArtifactV1,
} from '../edit-skills/b-roll'
import {
  InMemoryCreateOnlyEditSkillArtifactStore,
  createEditSkillPlanApproval,
  createSkillAssignment,
  hashSkillValue,
  skillManifestReference,
  type EditSkillApprovedWorkGraph,
  type EditSkillArtifactReference,
  type EditSkillArtifactStore,
  type EditSkillPlanApproval,
  type EditSkillPublicPlan,
  type EditSkillWorkResult,
  type SkillAssignment,
  type SkillAssignmentInput,
} from '../edit-skills/core'
import {
  createEditSkillRuntime,
  createEditSkillRuntimeRegistries,
} from '../edit-skills/registry'
import { GENERATED_BROLL_INTERNAL_QUALIFICATION_ARTIFACT } from '../edit-skills/b-roll/generated/b-roll-internal-qualification.generated'
import {
  assertSkillQualificationReceipt,
  skillQualificationReceiptSchema,
} from '../edit-skills/core/skill-qualification-receipt'
import {
  BROLL_PROVIDER_ROUTE_ID,
  brollProviderExecutionPackageV5Schema,
  buildBrollProviderRequestPackageV5,
  createBrollProviderWorkAuthorizationV5,
  projectCanonicalBrollWorkItemForImmutableGeminiOmniV5,
} from '../providers/google/gemini-omni-broll'
import { persistCanonicalBrollPlanComponent } from '../services/canonical-broll-plan-component-service'
import { activatePrivateOfflineMediaBinaryRuntime } from '../tool-execution/media-binary-execution'
import {
  activatePrivateOfflineRemotionRenderRuntime,
  prepareOfflineRemotionDockerRuntime,
} from '../tool-execution/remotion-render-execution'
import {
  activatePrivateOfflineLibassCaptionRuntime,
  openPrivateOfflineLibassCaptionRuntime,
  prepareOfflineLibassDockerRuntime,
} from '../tool-execution/libass-caption-execution'
import {
  createCaptionBrollOwnerReadRequest,
} from '../captions-specialist/caption-broll-owner-read-adapter'
import {
  runCaptionsSpecialistJob,
} from '../captions-specialist/captions-specialist-runtime'
import {
  createCaptionsHarnessCall,
} from '../internal-testing/captions-specialist-harness'
import {
  calculateSkillContractDigest,
  parseOrchestraSkillCall,
} from '../orchestra/orchestra-skill-contracts'
import {
  createBrollCaptionPrivateVisualReview,
  createCanonicalBrollCaptionPrivateVisualReviewReadPort,
  createCanonicalBrollCaptionOwnerServiceV2,
} from '../services/canonical-broll-caption-owner-service'
import {
  createCanonicalCaptionBrollApprovedSnapshotReadPort,
  createCanonicalCaptionBrollEvidenceRepository,
  createCanonicalCaptionBrollSupportService,
} from '../services/canonical-caption-broll-support-service'
import {
  createCanonicalPrivateLocalJsonObjectPort,
} from '../services/canonical-private-local-json-object-port'
import {
  createCanonicalSpecialistCallResultPair,
  createCanonicalSpecialistSupportResumeRepository,
} from '../services/canonical-specialist-support-resume-service'

const manifestRef = skillManifestReference(BROLL_CAPABILITY_MANIFEST)
const scope = {
  ownerUserId: 'public-canonical-user',
  workspaceId: 'public-canonical-workspace',
  projectId: 'public-canonical-project',
}
const authorizedRange = { startFrameInclusive: 120, endFrameExclusive: 192, fps: 24 }
const masterRange = { startFrameInclusive: 0, endFrameExclusive: 2_400, fps: 24 }

class DurableFixtureArtifactStore implements EditSkillArtifactStore {
  readonly storageClass = 'durable' as const
  readonly #delegate: InMemoryCreateOnlyEditSkillArtifactStore

  constructor(delegate: InMemoryCreateOnlyEditSkillArtifactStore) {
    this.#delegate = delegate
  }

  putJson(input: Parameters<EditSkillArtifactStore['putJson']>[0]) {
    return this.#delegate.putJson(input)
  }

  readJson(input: Parameters<EditSkillArtifactStore['readJson']>[0]) {
    return this.#delegate.readJson(input)
  }
}

interface PublicFixture {
  assignment: SkillAssignment
  brollAssignment: BrollSkillAssignment
  context: BrollPlanningContext
  ownership: ReturnType<typeof createBrollVisualOwnershipManifest>
  source?: {
    manifest: SourceMediaArtifactV1
    reference: EditSkillArtifactReference
    bytes: Buffer
  }
}

const runtimeRegistries = createEditSkillRuntimeRegistries()
const artifactStore = new DurableFixtureArtifactStore(
  new InMemoryCreateOnlyEditSkillArtifactStore(runtimeRegistries.artifactSchemaRegistry),
)
let activeCoordinator: BrollCanonicalPrivateExecutionCoordinator | undefined
const canonicalBindings = createBrollCanonicalPrivateRuntimeBindings({
  execute: async (definition, invocation) => {
    if (!activeCoordinator) throw new Error('Canonical public lifecycle has no active B-roll worker.')
    return activeCoordinator.execute(definition, invocation)
  },
})
const runtime = createEditSkillRuntime({
  environmentClass: 'canonical_private',
  artifactStore,
  providerAuthority: {
    operations: new Map(BROLL_PROVIDER_OPERATIONS.map((operationId) => [
      operationId,
      'internal_execution_qualified' as const,
    ])),
  },
  toolRegistry: { operationIds: new Set(BROLL_TOOL_OPERATIONS) },
  additionalRuntimeBindings: canonicalBindings,
  ...runtimeRegistries,
})
const plugin = runtime.pluginRegistry.resolve(manifestRef)
const qualificationReceipt = assertSkillQualificationReceipt(
  skillQualificationReceiptSchema.parse(
    (GENERATED_BROLL_INTERNAL_QUALIFICATION_ARTIFACT as { receipt: unknown }).receipt,
  ),
)

function sha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

async function createFixture(input: {
  assignmentId: string
  route: 'no_action' | 'existing_source' | 'generated' | 'track_all'
  sourceBytes?: Buffer
}): Promise<PublicFixture> {
  const editSessionId = `session-${input.assignmentId}`
  const masterTiming = createBrollMasterTimingPlan({
    schemaVersion: 'master_timing_plan_v1',
    ...scope,
    editSessionId,
    assignmentId: input.assignmentId,
    editPlanVersion: 1,
    manifestRef,
    fps: 24,
    timelineRange: masterRange,
    assignmentRange: authorizedRange,
  })
  const masterTimingRef = await artifactStore.putJson({
    artifactType: 'master_timing_plan_v1',
    ...scope,
    value: masterTiming,
  })
  const ownership = createBrollVisualOwnershipManifest({
    schemaVersion: 'visual_ownership_manifest_v1',
    ...scope,
    editSessionId,
    assignmentId: input.assignmentId,
    editPlanVersion: 1,
    manifestRef,
    assignmentRange: authorizedRange,
    requestedOwnership: 'primary',
    ownershipWindows: [],
  })
  const ownershipRef = await artifactStore.putJson({
    artifactType: 'visual_ownership_manifest_v1',
    ...scope,
    value: ownership,
  })

  let source: PublicFixture['source']
  const sourceCandidates: BrollSourceCandidate[] = []
  if (input.route === 'existing_source') {
    assert.ok(input.sourceBytes)
    const objectSha256 = sha256(input.sourceBytes)
    const manifest = createSourceMediaArtifactV1({
      schemaVersion: 'source_media_artifact_v1',
      ...scope,
      sourceId: `source-${input.assignmentId}`,
      privateObjectIdentityHash: hashSkillValue({ objectSha256, fixture: input.assignmentId }),
      objectSha256,
      byteLength: input.sourceBytes.byteLength,
      mimeType: 'video/mp4',
      container: 'mp4',
      durationFrames: 96,
      fps: 24,
      width: 320,
      height: 180,
      provenanceVerified: true,
      rightsApproved: true,
      privacyApproved: true,
      proofClassification: 'source_verified',
      checksumReadbackVerified: true,
      privateOnly: true,
      publicDeliveryAllowed: false,
      immutable: true,
    })
    const reference = await artifactStore.putJson({
      artifactType: 'source_media_artifact_v1',
      ...scope,
      value: manifest,
    })
    source = { manifest, reference, bytes: input.sourceBytes }
    sourceCandidates.push({
      sourceId: manifest.sourceId,
      sourceType: 'existing_project_clip',
      artifactRef: reference,
      sourceRange: { startFrameInclusive: 12, endFrameExclusive: 84, fps: 24 },
      semanticRelevance: 0.99,
      visualQuality: 0.95,
      temporalFit: 0.98,
      storyContinuity: 0.96,
      provenanceVerified: true,
      rightsApproved: true,
      privacyApproved: true,
      proofSafe: true,
      repetitionRisk: 0,
      cropFeasibility: 0.98,
      speakerActionProtection: 0.95,
      audioUsefulness: 0.5,
      costCredits: 1,
      approvedByUser: true,
    })
  }

  const generated = input.route === 'generated'
  const tracking = input.route === 'track_all'
  const noAction = input.route === 'no_action'
  const reason = noAction
    ? 'Preserve the strong speaker-led footage without adding another visual.'
    : input.route === 'existing_source'
      ? 'Use the exact approved project source as a restrained cutaway.'
      : tracking
        ? 'Use a model-neutral track graph for the approved B-roll placement.'
        : 'Clarify the workflow with one safe illustrative generated cutaway.'
  const benefit = noAction
    ? 'Keep the authentic speaker moment visible.'
    : 'Understand the exact approved visual support for this range.'
  const context = createBrollPlanningContext({
    schemaVersion: 'b_roll_context_manifest_v1',
    ...scope,
    assignmentId: input.assignmentId,
    baseFootageStrength: noAction ? 0.98 : input.route === 'existing_source' ? 0.4 : 0.2,
    speakerEmotionImportance: noAction ? 0.98 : 0.1,
    meaningfulVisualNeed: noAction ? 0.1 : 0.95,
    userVisualPreference: noAction ? 'minimal' : 'balanced',
    claimSensitivity: generated ? 'supporting' : 'none',
    generatedMediaWouldMislead: false,
    captionReservedZoneCount: 1,
    trackingRequired: tracking,
    sourceCandidates,
    priorConceptKeys: [],
    confirmedAspectRatio: '16:9',
    uploadedVideoEditRegionEligible: true,
    referenceDnaDoNotCopyRules: ['Do not copy a reference shot exactly.'],
  })
  const sourceInventory = createBrollSourceInventory({
    schemaVersion: 'source_inventory_v1',
    ...scope,
    editSessionId,
    assignmentId: input.assignmentId,
    editPlanVersion: 1,
    manifestRef,
    candidates: sourceCandidates,
  })
  const sourceInventoryRef = await artifactStore.putJson({
    artifactType: 'source_inventory_v1',
    ...scope,
    value: sourceInventory,
  })
  const brollAssignment = createBrollAssignment({
    schemaVersion: 'b_roll_assignment_v1',
    assignmentId: input.assignmentId,
    orchestrationRunId: `public-canonical-${input.assignmentId}`,
    ...scope,
    editSessionId,
    editPlanVersion: 1,
    masterTimingHash: masterTiming.timingHash,
    masterTimingRange: masterRange,
    segmentIds: [`segment-${input.assignmentId}`],
    sourceSequenceIds: source ? [source.manifest.sourceId] : [],
    readContextAuthority: {
      wholeVideoReadOnly: true,
      adjacentScenesReadOnly: true,
      contextArtifactRefs: [sourceInventoryRef, masterTimingRef, ownershipRef],
    },
    writeRangeAuthority: { authorizedRange, outsideAuthorizedRangeModified: false },
    reason,
    pointToProveClarifyCoverOrSupport: noAction
      ? 'Protect the speaker moment.'
      : 'Clarify this exact beat without fabricating proof.',
    expectedViewerBenefit: benefit,
    requestedVisualOwnership: 'primary',
    forbiddenInterpretations: ['Do not present illustrative media as verified proof.'],
    permittedSourceRoutes: input.route === 'existing_source'
      ? ['use_existing_project_clip', 'use_no_broll']
      : generated
        ? ['generate_with_gemini_omni', 'use_no_broll']
        : ['use_no_broll'],
    providerPermission: generated ? 'approved_within_ceiling' : 'forbidden',
    maximumInitialCandidates: 1,
    maximumRefinements: 1,
    maximumTimeSeconds: generated ? 600 : 120,
    maximumCredits: generated ? 100 : tracking ? 10 : input.route === 'existing_source' ? 20 : 0,
    requiredOutputTypes: ['b_roll_result_receipt_v1'],
    manifestRef,
  })
  const assignmentRef = await artifactStore.putJson({
    artifactType: 'b_roll_assignment_v1',
    ...scope,
    value: brollAssignment,
  })
  const publicContext = createBrollPublicContextManifest({
    context,
    editSessionId,
    editPlanVersion: 1,
    manifestRef,
    assignmentRef,
    sourceInventoryRef,
    masterTimingRef,
    visualOwnershipRef: ownershipRef,
  })
  const contextRef = await artifactStore.putJson({
    artifactType: 'b_roll_context_manifest_v1',
    ...scope,
    value: publicContext,
  })
  const assignment = createSkillAssignment({
    schemaVersion: 'edit-skill-assignment-v1',
    assignmentId: input.assignmentId,
    ...scope,
    editSessionId,
    planningRequestId: `planning-${input.assignmentId}`,
    manifestRef,
    authorizedRange,
    reason,
    intendedViewerBenefit: benefit,
    editorialContext: 'Full public canonical B-roll qualification lifecycle.',
    visualOwnership: 'primary',
    contextArtifactRefs: [
      assignmentRef,
      contextRef,
      sourceInventoryRef,
      masterTimingRef,
      ownershipRef,
    ],
    dependencyArtifactRefs: [],
    requestedBySkill: 'orchestra',
  })
  return { assignment, brollAssignment, context, ownership, ...(source ? { source } : {}) }
}

async function planAndApprove(fixture: PublicFixture, approvedAt: string) {
  const plan = await plugin.planAssignment({ assignment: fixture.assignment })
  const approval = createEditSkillPlanApproval({
    schemaVersion: 'edit-skill-plan-approval-v1',
    assignmentId: fixture.assignment.assignmentId,
    assignmentHash: fixture.assignment.assignmentHash,
    planId: plan.envelope.planId,
    planHash: plan.envelope.planHash,
    manifestRef,
    authorizedRange,
    approved: true,
    approvedAt,
  })
  const graph = await plugin.compileApprovedWorkGraph({
    assignment: fixture.assignment,
    plan,
    approval,
  })
  return { plan, approval, graph }
}

async function privateAuthority(input: {
  root: string
  fixture: PublicFixture
  plan: EditSkillPublicPlan
  publicGraph: EditSkillApprovedWorkGraph
}) {
  const plan = brollPlanArtifactSchema.parse(await artifactStore.readJson({
    reference: input.plan.payloadRef,
    ...scope,
  }))
  const planningQa = brollPlanningQaReportSchema.parse(await artifactStore.readJson({
    reference: input.plan.evidenceRefs[0]!,
    ...scope,
  }))
  const workGraph = compileBrollCanonicalWorkGraph({
    assignment: input.fixture.brollAssignment,
    plan,
  })
  assert.equal(input.publicGraph.pluginWorkGraphHash, workGraph.workGraphHash)
  const canonicalWorkItems = projectBrollCanonicalWorkItems({
    assignment: input.fixture.brollAssignment,
    workGraph,
  })
  const persisted = await persistCanonicalBrollPlanComponent({
    localStorageRoot: input.root,
    assignment: input.fixture.brollAssignment,
    context: input.fixture.context,
    plan,
    planningQaReport: planningQa,
    workGraph,
    qualificationReceipt,
  })
  return { plan, planningQa, workGraph, canonicalWorkItems, persisted }
}

async function dispatchItem(input: {
  fixture: PublicFixture
  plan: EditSkillPublicPlan
  approval: EditSkillPlanApproval
  graph: EditSkillApprovedWorkGraph
  item: EditSkillApprovedWorkGraph['workItems'][number]
}): Promise<EditSkillWorkResult> {
  const binding = runtime.runtimeBindingRegistry.resolve({
    manifestRef,
    jobType: input.item.jobType,
    adapterClass: 'canonical_private_execution_adapter',
    environmentClass: 'canonical_private',
  }).definition
  const outcome = await runtime.runtimeDispatcher.dispatchApprovedWorkItemToResult({
    manifestRef,
    workItem: input.item,
    approval: input.approval,
    authorizedPhase: binding.allowedPhases[0]!,
    inputArtifactTypes: binding.inputArtifactTypes,
    adapterClass: 'canonical_private_execution_adapter',
    environmentClass: 'canonical_private',
    runtimeQualification: 'internal_execution_qualified',
    artifactStorageClass: artifactStore.storageClass,
    artifactStore,
    artifactScope: scope,
    privateArtifactAuthority: true,
    providerAuthorityOperations: runtime.referenceCatalog.providerOperations,
    toolAuthorityOperations: runtime.referenceCatalog.toolOperations,
    planId: input.plan.envelope.planId,
    planHash: input.plan.envelope.planHash,
    qaEvidenceArtifactRefs: [input.plan.evidenceRefs[0]!],
  })
  assert.equal(outcome.receipt.status, 'succeeded')
  assert.equal(outcome.receipt.publicArtifactCount, 0)
  assert.equal(outcome.receipt.productionMutationCount, 0)
  return plugin.validateWorkItemResult({
    assignment: input.fixture.assignment,
    plan: input.plan,
    workGraph: input.graph,
    result: outcome.workResult,
  })
}

interface CaptionBrollInspectionPackageV2 {
  readonly schemaVersion: 'caption-broll-private-inspection-package-v2'
  readonly previewSha256: string
  readonly captionOverlaySha256: string
  readonly layerManifestHash: string
  readonly integrationQaHash: string
  readonly frameCount: number
  readonly fps: number
  readonly contactSheet: {
    readonly fileName: string
    readonly sha256: string
    readonly sampledFrameCount: number
  }
  readonly sampleFrames: readonly {
    readonly frameIndex: number
    readonly fileName: string
    readonly sha256: string
  }[]
  readonly actualLibassReadAndRenderFrameExecuted: boolean
  readonly approvedFontPackUsed: boolean
  readonly completeTimePrivateVisualReviewRequired: true
  readonly technicalQaPreviewLabelRequired: true
  readonly professionalCaptionAppearanceQualificationAllowed: false
  readonly mediaBytesIncluded: false
  readonly publicDeliveryGranted: false
  readonly productionAuthorityGranted: false
  readonly packageSha256: string
}

interface CaptionBrollInspectionPackageV3 {
  readonly schemaVersion: 'caption-broll-private-inspection-package-v3'
  readonly sourceEvidenceMode: 'real_private_media'
  readonly normalizedSourceSha256: string
  readonly previewSha256: string
  readonly captionOverlaySha256: string
  readonly layerManifestHash: string
  readonly integrationQaHash: string
  readonly frameCount: number
  readonly fps: number
  readonly contactSheet: {
    readonly fileName: string
    readonly sha256: string
    readonly sampledFrameCount: number
  }
  readonly sampleFrames: readonly {
    readonly frameIndex: number
    readonly fileName: string
    readonly sha256: string
  }[]
  readonly actualLibassReadAndRenderFrameExecuted: boolean
  readonly approvedFontPackUsed: boolean
  readonly completeTimePrivateVisualReviewRequired: true
  readonly technicalQaPreviewLabelRequired: true
  readonly professionalCaptionAppearanceQualificationAllowed: false
  readonly brollCaptionCoCompositionQualificationAllowed: true
  readonly mediaBytesIncluded: false
  readonly sourceMediaPathIncluded: false
  readonly publicDeliveryGranted: false
  readonly productionAuthorityGranted: false
  readonly packageSha256: string
}

type CaptionBrollInspectionPackage =
  | CaptionBrollInspectionPackageV2
  | CaptionBrollInspectionPackageV3

async function createCaptionBrollInspectionPackage(input: {
  root: string
  previewPath: string
  sourceEvidenceMode: 'synthetic_engineering_fixture' | 'real_private_media'
  normalizedSourceSha256: string
  previewSha256: string
  captionOverlaySha256: string
  layerManifestHash: string
  integrationQaHash: string
  frameCount: number
  fps: number
  actualLibassReadAndRenderFrameExecuted: boolean
  approvedFontPackUsed: boolean
}): Promise<CaptionBrollInspectionPackage> {
  const previewBytes = await readFile(input.previewPath)
  assert.equal(sha256(previewBytes), input.previewSha256,
    'Private B-roll preview bytes changed before inspection extraction.')
  const inspectionRoot = join(input.root, 'caption-broll-private-inspection')
  await mkdir(inspectionRoot, { recursive: true })
  const rows = Math.ceil(input.frameCount / 8)
  const contactSheetPath = join(inspectionRoot, 'complete-time-contact-sheet.png')
  const contactSheetProcess = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-i', input.previewPath,
    '-vf', `select=between(n\\,0\\,${input.frameCount - 1}),scale=160:90:flags=lanczos,tile=8x${rows}`,
    '-frames:v', '1', '-threads', '1', '-y', contactSheetPath,
  ], { encoding: 'utf8' })
  assert.equal(contactSheetProcess.status, 0, contactSheetProcess.stderr)
  const sampleFrameIndexes = [
    0,
    Math.floor((input.frameCount - 1) / 2),
    input.frameCount - 1,
  ]
  const sampleFrames: Array<{
    frameIndex: number
    fileName: string
    sha256: string
  }> = []
  for (const frameIndex of sampleFrameIndexes) {
    const fileName = `frame-${String(frameIndex).padStart(3, '0')}.png`
    const framePath = join(inspectionRoot, fileName)
    const frameProcess = spawnSync('ffmpeg', [
      '-hide_banner', '-loglevel', 'error', '-i', input.previewPath,
      '-vf', `select=eq(n\\,${frameIndex})`, '-frames:v', '1',
      '-threads', '1', '-y', framePath,
    ], { encoding: 'utf8' })
    assert.equal(frameProcess.status, 0, frameProcess.stderr)
    sampleFrames.push({
      frameIndex,
      fileName,
      sha256: sha256(await readFile(framePath)),
    })
  }
  const contactSheetBytes = await readFile(contactSheetPath)
  const common = {
    previewSha256: input.previewSha256,
    captionOverlaySha256: input.captionOverlaySha256,
    layerManifestHash: input.layerManifestHash,
    integrationQaHash: input.integrationQaHash,
    frameCount: input.frameCount,
    fps: input.fps,
    contactSheet: {
      fileName: 'complete-time-contact-sheet.png',
      sha256: sha256(contactSheetBytes),
      sampledFrameCount: input.frameCount,
    },
    sampleFrames,
    actualLibassReadAndRenderFrameExecuted:
      input.actualLibassReadAndRenderFrameExecuted,
    approvedFontPackUsed: input.approvedFontPackUsed,
    completeTimePrivateVisualReviewRequired: true as const,
    technicalQaPreviewLabelRequired: true as const,
    professionalCaptionAppearanceQualificationAllowed: false as const,
    mediaBytesIncluded: false as const,
    publicDeliveryGranted: false as const,
    productionAuthorityGranted: false as const,
  }
  const withoutDigest = input.sourceEvidenceMode === 'real_private_media'
    ? {
      schemaVersion: 'caption-broll-private-inspection-package-v3' as const,
      sourceEvidenceMode: 'real_private_media' as const,
      normalizedSourceSha256: input.normalizedSourceSha256,
      ...common,
      brollCaptionCoCompositionQualificationAllowed: true as const,
      sourceMediaPathIncluded: false as const,
    }
    : {
    schemaVersion: 'caption-broll-private-inspection-package-v2',
      ...common,
    } satisfies Omit<CaptionBrollInspectionPackageV2, 'packageSha256'>
  const inspectionPackage = Object.freeze({
    ...withoutDigest,
    packageSha256: hashSkillValue(withoutDigest),
  }) as CaptionBrollInspectionPackage
  await writeFile(
    join(inspectionRoot, 'inspection-package.json'),
    `${JSON.stringify(inspectionPackage, null, 2)}\n`,
  )
  return inspectionPackage
}

async function readCaptionBrollDirectInspection(input: {
  root: string
  expectedReceiptSha256: string
  inspectionPackage: CaptionBrollInspectionPackage
}): Promise<{
  schemaVersion:
    | 'caption-broll-direct-private-inspection-v2'
    | 'caption-broll-direct-private-inspection-v3'
  reviewId: string
  reviewerClass: 'qualified_visual_ai'
  disposition: 'accepted_with_warnings'
  reviewedAt: string
  sourceEvidenceMode: 'synthetic_engineering_fixture' | 'real_private_media'
  brollCaptionCoCompositionQualified: boolean
}> {
  assert.match(input.expectedReceiptSha256, /^[a-f0-9]{64}$/u)
  const receiptPath = join(
    input.root,
    'caption-broll-private-inspection',
    'direct-private-visual-inspection.json',
  )
  const receiptBytes = await readFile(receiptPath)
  assert.equal(sha256(receiptBytes), input.expectedReceiptSha256,
    'Direct B-roll visual-inspection receipt bytes do not match admission.')
  const value = JSON.parse(receiptBytes.toString('utf8')) as Record<string, unknown>
  const v2Keys = [
    'allSampleFramesReviewed',
    'captionLayerAboveBrollVerified',
    'captionSafeAreaVerified',
    'completeTimeContactSheetReviewed',
    'disposition',
    'inspectionPackageSha256',
    'mediaBytesIncluded',
    'noClippingOrCollisionObserved',
    'previewContainsVisibleCaption',
    'productionAuthorityGranted',
    'publicDeliveryGranted',
    'reviewId',
    'reviewedAt',
    'reviewerClass',
    'schemaVersion',
    'syntheticFixtureLimitationAcknowledged',
    'technicalQaPreviewLabelVisible',
    'professionalCaptionAppearanceQualified',
  ].sort()
  const v3Keys = [
    ...v2Keys,
    'brollCaptionCoCompositionQualified',
    'normalizedSourceSha256',
    'realPrivateSourceMediaReviewed',
    'sourceEvidenceMode',
  ].sort()
  const realPrivateSource = input.inspectionPackage.schemaVersion
    === 'caption-broll-private-inspection-package-v3'
  assert.deepEqual(Object.keys(value).sort(), realPrivateSource
    ? v3Keys
    : v2Keys)
  assert.equal(value.schemaVersion, realPrivateSource
    ? 'caption-broll-direct-private-inspection-v3'
    : 'caption-broll-direct-private-inspection-v2')
  assert.equal(value.inspectionPackageSha256,
    input.inspectionPackage.packageSha256)
  assert.equal(value.reviewerClass, 'qualified_visual_ai')
  assert.equal(value.disposition, 'accepted_with_warnings')
  for (const field of [
    'completeTimeContactSheetReviewed',
    'allSampleFramesReviewed',
    'previewContainsVisibleCaption',
    'captionSafeAreaVerified',
    'captionLayerAboveBrollVerified',
    'noClippingOrCollisionObserved',
    'technicalQaPreviewLabelVisible',
  ]) assert.equal(value[field], true, `${field} must be true.`)
  assert.equal(value.syntheticFixtureLimitationAcknowledged,
    !realPrivateSource)
  assert.equal(value.professionalCaptionAppearanceQualified, false)
  if (realPrivateSource) {
    const realInspectionPackage = input.inspectionPackage as
      CaptionBrollInspectionPackageV3
    assert.equal(value.sourceEvidenceMode, 'real_private_media')
    assert.equal(value.normalizedSourceSha256,
      realInspectionPackage.normalizedSourceSha256)
    assert.equal(value.realPrivateSourceMediaReviewed, true)
    assert.equal(value.brollCaptionCoCompositionQualified, true)
  }
  assert.equal(value.mediaBytesIncluded, false)
  assert.equal(value.publicDeliveryGranted, false)
  assert.equal(value.productionAuthorityGranted, false)
  assert.match(String(value.reviewId), /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u)
  assert.equal(Number.isNaN(Date.parse(String(value.reviewedAt))), false)
  return {
    schemaVersion: realPrivateSource
      ? 'caption-broll-direct-private-inspection-v3'
      : 'caption-broll-direct-private-inspection-v2',
    reviewId: String(value.reviewId),
    reviewerClass: 'qualified_visual_ai',
    disposition: 'accepted_with_warnings',
    reviewedAt: String(value.reviewedAt),
    sourceEvidenceMode: realPrivateSource
      ? 'real_private_media'
      : 'synthetic_engineering_fixture',
    brollCaptionCoCompositionQualified: realPrivateSource,
  }
}

const requestedCaptionEvidenceRoot =
  process.env.REEDITPRO_CAPTION_BROLL_PRIVATE_EVIDENCE_ROOT?.trim() ?? ''
const requestedPrivateSourceMediaPath =
  process.env.REEDITPRO_CAPTION_BROLL_PRIVATE_SOURCE_MEDIA_PATH?.trim() ?? ''
const requestedPrivateSourceMediaSha256 =
  process.env.REEDITPRO_CAPTION_BROLL_PRIVATE_SOURCE_MEDIA_SHA256?.trim() ?? ''
const captionBrollEvidenceRequired =
  process.env.REEDITPRO_CAPTION_BROLL_REQUIRE_EVIDENCE === '1'
const root = requestedCaptionEvidenceRoot.length > 0
  ? resolve(requestedCaptionEvidenceRoot)
  : await mkdtemp(join(tmpdir(), 'reeditpro-broll-public-canonical-'))
const preserveRoot = requestedCaptionEvidenceRoot.length > 0
if (captionBrollEvidenceRequired && !preserveRoot) {
  throw new Error(
    'Caption B-roll private evidence requires an explicit private evidence root.',
  )
}
if (requestedPrivateSourceMediaPath.length > 0 && !preserveRoot) {
  throw new Error(
    'Real Caption B-roll source media requires an explicit private evidence root.',
  )
}
if (requestedPrivateSourceMediaPath.length > 0
  && !/^[a-f0-9]{64}$/u.test(requestedPrivateSourceMediaSha256)) {
  throw new Error(
    'Real Caption B-roll source media requires its exact SHA-256.',
  )
}
const sourceEvidenceMode = requestedPrivateSourceMediaPath.length > 0
  ? 'real_private_media' as const
  : 'synthetic_engineering_fixture' as const
if (preserveRoot) await mkdir(root, { recursive: true })
try {
  const sourcePath = join(root, 'source.mp4')
  const candidatePath = join(root, 'candidate.mp4')
  const captionPath = join(root, 'caption.png')
  let sourceProcess: SpawnSyncReturns<string>
  if (sourceEvidenceMode === 'real_private_media') {
    const sourceInputPath = resolve(requestedPrivateSourceMediaPath)
    const sourceInputBytes = await readFile(sourceInputPath)
    assert.equal(sha256(sourceInputBytes), requestedPrivateSourceMediaSha256,
      'Real Caption B-roll source media changed before normalization.')
    sourceProcess = spawnSync('ffmpeg', [
      '-hide_banner', '-loglevel', 'error', '-i', sourceInputPath,
      '-filter_complex',
      '[0:v]split=2[bgsrc][fgsrc];' +
      '[bgsrc]scale=320:180:force_original_aspect_ratio=increase,' +
      'crop=320:180,gblur=sigma=18[bg];' +
      '[fgsrc]scale=320:180:force_original_aspect_ratio=decrease[fg];' +
      '[bg][fg]overlay=(W-w)/2:(H-h)/2,format=yuv420p,fps=24[out]',
      '-map', '[out]', '-an', '-frames:v', '96', '-c:v', 'libx264',
      '-preset', 'ultrafast', '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart', '-threads', '1', '-y', sourcePath,
    ], { encoding: 'utf8' })
  } else {
    sourceProcess = spawnSync('ffmpeg', [
      '-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i',
      'testsrc2=size=320x180:rate=24:duration=4', '-an', '-c:v', 'libx264',
      '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
      '-threads', '1', '-y', sourcePath,
    ], { encoding: 'utf8' })
  }
  assert.equal(sourceProcess.status, 0, sourceProcess.stderr)
  const candidateProcess = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i',
    'testsrc2=size=1280x720:rate=24:duration=3', '-an', '-c:v', 'libx264',
    '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-frames:v', '72',
    '-movflags', '+faststart', '-threads', '1', '-y', candidatePath,
  ], { encoding: 'utf8' })
  assert.equal(candidateProcess.status, 0, candidateProcess.stderr)
  let captionBytes: Buffer
  let captionOverlaySha256: string
  let captionOverlayEvidence: {
    actualLibassReadAndRenderFrameExecuted: boolean
    approvedFontPackUsed: boolean
    transparentRgbaOverlayProduced: boolean
  }
  if (preserveRoot) {
    const preparedLibass = await prepareOfflineLibassDockerRuntime()
    const activatedLibass = await activatePrivateOfflineLibassCaptionRuntime()
    assert.equal(activatedLibass.image.imageIdentityHash,
      preparedLibass.imageIdentityHash)
    const libass = await openPrivateOfflineLibassCaptionRuntime()
    const caption = await libass.execute({
      schemaVersion: 'offline-libass-caption-execution-v1',
      toolId: 'libass',
      operationId: 'tool.libass.render_approved_caption_track.v1',
      payload: {
        captionProfileId: 'approved_ass_track_render_v1',
        fontPackProfileId: 'reeditpro_reviewed_fonts_v1',
        collisionPolicy: 'fail_on_reserved_zone_collision',
        preserveSpeechTiming: true,
        width: 640,
        height: 360,
        timestampMs: 1_000,
        fontSize: 38,
        marginV: 42,
        alignment: 2,
        caption: sourceEvidenceMode === 'real_private_media'
          ? "I'm launching my new AI software."
          : 'Ideas move through the frame',
      },
    })
    captionBytes = caption.imageArtifact.bytes
    captionOverlaySha256 = caption.imageArtifact.sha256
    assert.equal(
      caption.evidence.semanticEvidence.actualAssReadMemoryExecuted,
      true,
    )
    assert.equal(
      caption.evidence.semanticEvidence.actualAssRenderFrameExecuted,
      true,
    )
    assert.equal(caption.evidence.semanticEvidence.approvedFontPackUsed, true)
    assert.equal(
      caption.evidence.semanticEvidence.transparentRgbaOverlayProduced,
      true,
    )
    captionOverlayEvidence = {
      actualLibassReadAndRenderFrameExecuted: true,
      approvedFontPackUsed: true,
      transparentRgbaOverlayProduced: true,
    }
    assert.equal(captionOverlayEvidence.actualLibassReadAndRenderFrameExecuted,
      true)
    assert.equal(captionOverlayEvidence.approvedFontPackUsed, true)
    assert.equal(captionOverlayEvidence.transparentRgbaOverlayProduced, true)
    await writeFile(captionPath, captionBytes)
  } else {
    const captionProcess = spawnSync('ffmpeg', [
      '-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i',
      'color=c=black@0.0:s=640x360,format=rgba', '-frames:v', '1', '-f',
      'image2', '-vcodec', 'png', '-y', captionPath,
    ], { encoding: 'utf8' })
    assert.equal(captionProcess.status, 0, captionProcess.stderr)
    captionBytes = await readFile(captionPath)
    captionOverlaySha256 = sha256(captionBytes)
    captionOverlayEvidence = {
      actualLibassReadAndRenderFrameExecuted: false,
      approvedFontPackUsed: false,
      transparentRgbaOverlayProduced: true,
    }
  }
  const [sourceBytes, candidateBytes] = await Promise.all([
    readFile(sourcePath),
    readFile(candidatePath),
  ])
  const normalizedSourceSha256 = sha256(sourceBytes)
  const mediaRuntime = await activatePrivateOfflineMediaBinaryRuntime()
  await prepareOfflineRemotionDockerRuntime()
  const remotionRuntime = await activatePrivateOfflineRemotionRenderRuntime()
  let captionBrollOwnerEvidence: Record<string, unknown> | null = null

  const noActionFixture = await createFixture({
    assignmentId: 'public-canonical-no-action',
    route: 'no_action',
  })
  const noAction = await planAndApprove(noActionFixture, '2026-08-05T12:00:00.000Z')
  assert.equal(noAction.plan.envelope.disposition, 'use_no_action')
  const noActionAuthority = await privateAuthority({
    root,
    fixture: noActionFixture,
    plan: noAction.plan,
    publicGraph: noAction.graph,
  })
  activeCoordinator = new BrollCanonicalPrivateExecutionCoordinator({
    route: 'professional_no_action',
    localStorageRoot: root,
    approvalHash: noAction.approval.approvalHash,
    approvedWorkGraphHash: noAction.graph.approvedWorkGraphHash,
    approvedPublicWorkGraph: noAction.graph,
    component: noActionAuthority.persisted.component,
    componentRef: noActionAuthority.persisted.componentRefs.bRollSkill,
    assignment: noActionFixture.brollAssignment,
    context: noActionFixture.context,
    visualOwnership: noActionFixture.ownership,
    plan: noActionAuthority.plan,
    planningQaReport: noActionAuthority.planningQa,
    workGraph: noActionAuthority.workGraph,
    canonicalWorkItems: noActionAuthority.canonicalWorkItems,
  })
  const noActionResults: EditSkillWorkResult[] = []
  for (const item of noAction.graph.workItems) {
    noActionResults.push(await dispatchItem({
      fixture: noActionFixture,
      plan: noAction.plan,
      approval: noAction.approval,
      graph: noAction.graph,
      item,
    }))
  }
  const noActionReceipt = await plugin.finalizeSkillResult({
    assignment: noActionFixture.assignment,
    plan: noAction.plan,
    workGraph: noAction.graph,
    dependencyAcceptances: [],
    workItemResults: noActionResults,
  })
  assert.equal(noActionReceipt.envelope.disposition, 'use_no_action')
  const noActionValue = await artifactStore.readJson({
    reference: noActionResults.at(-1)!.outputArtifactRefs[0]!,
    ...scope,
  }) as Record<string, unknown>
  assert.deepEqual({
    providerRequestCount: noActionValue.providerRequestCount,
    mediaArtifactCount: noActionValue.mediaArtifactCount,
    estimatedProviderCredits: noActionValue.estimatedProviderCredits,
    selectedSource: noActionValue.selectedSource,
    displayLayer: noActionValue.displayLayer,
  }, {
    providerRequestCount: 0,
    mediaArtifactCount: 0,
    estimatedProviderCredits: 0,
    selectedSource: null,
    displayLayer: null,
  })

  const sourceFixture = await createFixture({
    assignmentId: 'public-canonical-existing-source',
    route: 'existing_source',
    sourceBytes,
  })
  const sourceLifecycle = await planAndApprove(sourceFixture, '2026-08-05T12:10:00.000Z')
  assert.equal(sourceLifecycle.plan.envelope.disposition, 'use_skill')
  const sourceAuthority = await privateAuthority({
    root,
    fixture: sourceFixture,
    plan: sourceLifecycle.plan,
    publicGraph: sourceLifecycle.graph,
  })
  const providerObserver = { getRequestCount: () => 0 }
  const sourceComponentRef =
    sourceAuthority.persisted.componentRefs.bRollSkill
  const sourceExecutionSnapshotHash = hashSkillValue({
    assignmentHash: sourceFixture.brollAssignment.assignmentHash,
    approvalHash: sourceLifecycle.approval.approvalHash,
    approvedWorkGraphHash: sourceLifecycle.graph.approvedWorkGraphHash,
  })
  activeCoordinator = new BrollCanonicalPrivateExecutionCoordinator({
    route: 'existing_source',
    executionGate: {
      approvedPlanSnapshotId:
        'snapshot.caption-broll.public-canonical-existing-source',
      snapshotHash: sourceExecutionSnapshotHash,
      reservationId:
        'reservation.caption-broll.public-canonical-existing-source',
      reservationStatus: 'reserved',
      approved: true,
      privateInternalExecution: true,
      idempotencyKey:
        'b-roll-source.caption-broll.public-canonical-existing-source',
      componentRef: sourceComponentRef,
      snapshotComponentRef: sourceComponentRef,
      executionPackageComponentRef: sourceComponentRef,
    },
    localStorageRoot: root,
    approvalHash: sourceLifecycle.approval.approvalHash,
    approvedWorkGraphHash: sourceLifecycle.graph.approvedWorkGraphHash,
    approvedPublicWorkGraph: sourceLifecycle.graph,
    component: sourceAuthority.persisted.component,
    componentRef: sourceComponentRef,
    assignment: sourceFixture.brollAssignment,
    context: sourceFixture.context,
    visualOwnership: sourceFixture.ownership,
    plan: sourceAuthority.plan,
    planningQaReport: sourceAuthority.planningQa,
    workGraph: sourceAuthority.workGraph,
    canonicalWorkItems: sourceAuthority.canonicalWorkItems,
    source: {
      sourceId: sourceFixture.source!.manifest.sourceId,
      artifactRef: sourceFixture.source!.reference,
      mediaManifest: sourceFixture.source!.manifest,
      mimeType: 'video/mp4',
      bytes: sourceFixture.source!.bytes,
    },
    providerObserver,
    captionOverlay: {
      reference: {
        artifactType: 'caption_overlay_png_v1',
        sha256: captionOverlaySha256,
        byteLength: captionBytes.byteLength,
        ...scope,
      },
      bytes: captionBytes,
      reservedZoneCount: 1,
    },
    mediaRuntime,
    remotionRuntime,
    integrationInfrastructureCostMicros: 7_500,
    now: () => '2026-08-05T12:15:00.000Z',
  })
  const sourceResults: EditSkillWorkResult[] = []
  for (const item of sourceLifecycle.graph.workItems) {
    sourceResults.push(await dispatchItem({
      fixture: sourceFixture,
      plan: sourceLifecycle.plan,
      approval: sourceLifecycle.approval,
      graph: sourceLifecycle.graph,
      item,
    }))
  }
  const sourceReceipt = await plugin.finalizeSkillResult({
    assignment: sourceFixture.assignment,
    plan: sourceLifecycle.plan,
    workGraph: sourceLifecycle.graph,
    dependencyAcceptances: [],
    workItemResults: sourceResults,
  })
  assert.equal(sourceReceipt.envelope.disposition, 'selected')
  assert.equal(sourceResults.some((result) => result.workerClass === 'provider_worker'), false)
  assert.equal(sourceResults.at(-1)!.outputArtifactRefs[0]!.artifactType, 'b_roll_result_receipt_v1')

  if (preserveRoot) {
    const sourceSnapshot = activeCoordinator.snapshot()
    assert.ok(sourceSnapshot.resultReceipt
      && 'preview' in sourceSnapshot.resultReceipt)
    assert.ok(sourceSnapshot.layerManifest && sourceSnapshot.integrationQa)
    const canonicalSourceResultReceipt = sourceSnapshot.resultReceipt
    const preview = canonicalSourceResultReceipt.preview
    const previewPath = join(
      root,
      'b-roll',
      'remotion-integrations',
      'previews',
      `${preview.previewArtifactIdentityHash}.mp4`,
    )
    const inspectionPackage = await createCaptionBrollInspectionPackage({
      root,
      previewPath,
      sourceEvidenceMode,
      normalizedSourceSha256,
      previewSha256: preview.sha256,
      captionOverlaySha256,
      layerManifestHash: sourceSnapshot.layerManifest.layerManifestHash,
      integrationQaHash: sourceSnapshot.integrationQa.integrationQaHash,
      frameCount: preview.frameCount,
      fps: preview.frameRate,
      ...captionOverlayEvidence,
    })
    const directInspectionSha256 =
      process.env.REEDITPRO_CAPTION_BROLL_INSPECTION_SHA256?.trim() ?? ''
    if (directInspectionSha256.length === 0) {
      captionBrollOwnerEvidence = {
        status: 'awaiting_direct_visual_inspection',
        inspectionPackageSha256: inspectionPackage.packageSha256,
        previewSha256: inspectionPackage.previewSha256,
        captionOverlaySha256: inspectionPackage.captionOverlaySha256,
        contactSheetSha256: inspectionPackage.contactSheet.sha256,
        sampleFrameSha256s: inspectionPackage.sampleFrames.map((frame) =>
          frame.sha256),
        canonicalOwnerResultCreated: false,
        captionResumeCompleted: false,
        publicDeliveryGranted: false,
        productionAuthorityGranted: false,
      }
    } else {
      const directInspection = await readCaptionBrollDirectInspection({
        root,
        expectedReceiptSha256: directInspectionSha256,
        inspectionPackage,
      })
      const approvedSnapshotRef = {
        id: 'snapshot.caption-broll.public-canonical-existing-source',
        version: 'approved-plan-snapshot-v1',
        contentHash: sourceExecutionSnapshotHash,
      }
      const outputFrameRef = {
        id: 'output-frame.caption-broll.public-canonical-16x9',
        version: 'confirmed-output-frame-v1',
        contentHash: hashSkillValue({
          outputId: 'output.caption-broll.public-canonical',
          width: 1_920,
          height: 1_080,
          aspectRatio: '16:9',
        }),
      }
      const masterTimingRef = {
        id: 'master-timing.caption-broll.public-canonical',
        version: 'master_timing_plan_v1',
        contentHash: sourceFixture.brollAssignment.masterTimingHash,
      }
      const sceneId = sourceFixture.brollAssignment.segmentIds[0]!
      const baseCall = createCaptionsHarnessCall({
        callId: 'caption.broll.public-canonical-existing-source',
        jobType: 'provide_caption_broll_composition_constraints',
        scopeLevel: 'scene',
        runtimeProfile: 'post_cap20_integration',
        approvedSnapshotRef,
        outputId: 'output.caption-broll.public-canonical',
        sceneId,
      })
      const callWithoutDigest = {
        ...baseCall,
        canonicalScope: {
          ...baseCall.canonicalScope,
          ownerUserId: scope.ownerUserId,
          workspaceId: scope.workspaceId,
          projectId: scope.projectId,
          editSessionId: sourceFixture.brollAssignment.editSessionId,
          approvedSnapshotRef,
          outputId: 'output.caption-broll.public-canonical',
          sceneId,
          boundaryId: null,
          authorizedFrameRanges: [{
            startFrame: authorizedRange.startFrameInclusive,
            endFrameExclusive: authorizedRange.endFrameExclusive,
          }],
        },
        inputArtifactRefs: baseCall.inputArtifactRefs.map((artifact) => {
          if (artifact.artifactType === 'confirmed_output_frame') {
            return { ...artifact, ...outputFrameRef }
          }
          if (artifact.artifactType === 'master_timing_or_planning_timing') {
            return { ...artifact, ...masterTimingRef }
          }
          return artifact
        }),
        callDigestSha256: '',
      }
      const call = parseOrchestraSkillCall({
        ...callWithoutDigest,
        callDigestSha256: calculateSkillContractDigest(
          callWithoutDigest,
          'callDigestSha256',
        ),
      })
      const planningConstraintRef = {
        id: sourceAuthority.plan.planId,
        version: sourceAuthority.plan.schemaVersion,
        contentHash: sourceAuthority.plan.planHash,
      }
      const ownerRequest = createCaptionBrollOwnerReadRequest({
        requestId: 'request.caption-broll.public-canonical-existing-source',
        canonicalScope: {
          ownerUserId: scope.ownerUserId,
          workspaceId: scope.workspaceId,
          projectId: scope.projectId,
          editSessionId: sourceFixture.brollAssignment.editSessionId,
          planVersionId: 'plan.caption-broll.public-canonical.v1',
          approvedSnapshotRef,
          outputId: 'output.caption-broll.public-canonical',
          outputFrameRef,
          sceneId,
          authorizedFrameRange: structuredClone(authorizedRange),
          masterTimingRef,
          masterTimingHash: sourceFixture.brollAssignment.masterTimingHash,
        },
        planningConstraintRef,
      })
      const initialCaptionResult = runCaptionsSpecialistJob({
        call,
        brollOwnerReadRequest: ownerRequest,
      })
      assert.equal(initialCaptionResult.disposition, 'needs_followup')
      assert.equal(initialCaptionResult.supportRequests.length, 1)
      const selectedSupportRequest = initialCaptionResult.supportRequests[0]!
      assert.equal(selectedSupportRequest.targetSkillKey, 'broll_owner')

      const objectPort = createCanonicalPrivateLocalJsonObjectPort({
        localStorageRoot: root,
      })
      const supportResumeRepository =
        createCanonicalSpecialistSupportResumeRepository({
          objectPort,
          prefix: 'private/internal/caption-broll-support-resume/v1',
        })
      const pair = createCanonicalSpecialistCallResultPair({
        call,
        result: initialCaptionResult,
        persistedAt: '2026-08-05T12:16:00.000Z',
      })
      await supportResumeRepository.persistCallResultPairCreateOnly({ pair })
      const snapshotAuthority = {
        canonicalScope: structuredClone(ownerRequest.canonicalScope),
        planningConstraintRef: structuredClone(planningConstraintRef),
      }
      let snapshotReads = 0
      const approvedSnapshotReadPort =
        createCanonicalCaptionBrollApprovedSnapshotReadPort(async ({
          approvedSnapshotRef: requestedSnapshotRef,
        }) => {
          snapshotReads += 1
          assert.deepEqual(requestedSnapshotRef, approvedSnapshotRef)
          return structuredClone(snapshotAuthority)
        })
      const privateVisualReview = createBrollCaptionPrivateVisualReview({
        schemaVersion: 'b_roll_authenticated_owner_read_evidence_v1',
        reviewId: directInspection.reviewId,
        previewArtifactSha256: inspectionPackage.previewSha256,
        layerManifestHash: inspectionPackage.layerManifestHash,
        integrationQaHash: inspectionPackage.integrationQaHash,
        reviewedFrameRange: structuredClone(authorizedRange),
        inspectionMode: 'complete_time_private_visual_review',
        reviewerClass: directInspection.reviewerClass,
        disposition: directInspection.disposition,
        visibleTextRegionRefs: [{
          id: 'caption-overlay.caption-broll.public-canonical',
          version: 'caption_overlay_png_v1',
          contentHash: inspectionPackage.captionOverlaySha256,
        }],
        captionSafeAreaVerified: true,
        captionLayerAboveBrollVerified: true,
        sourceBytesIncluded: false,
        mediaLocatorIncluded: false,
        finalQaApprovalGranted: false,
        publicDeliveryGranted: false,
        productionAuthorityGranted: false,
        reviewedAt: directInspection.reviewedAt,
      })
      let reviewReads = 0
      const privateVisualReviewReadPort =
        createCanonicalBrollCaptionPrivateVisualReviewReadPort(async (read) => {
          reviewReads += 1
          assert.equal(read.ownerRequestRef.id, ownerRequest.requestId)
          assert.equal(read.ownerRequestRef.contentHash,
            ownerRequest.requestDigestSha256)
          assert.equal(read.previewArtifactRef.contentHash,
            inspectionPackage.previewSha256)
          assert.equal(read.layerManifestRef.contentHash,
            inspectionPackage.layerManifestHash)
          assert.equal(read.integrationQaRef.contentHash,
            inspectionPackage.integrationQaHash)
          assert.deepEqual(read.reviewedFrameRange, authorizedRange)
          return structuredClone(privateVisualReview)
        })
      const ownerService = createCanonicalBrollCaptionOwnerServiceV2({
        objectPort,
        artifactStore,
        approvedSnapshotReadPort,
        privateVisualReviewReadPort,
        prefix: 'private/internal/caption-broll-owner/v1',
      })
      const ownerResult = await ownerService.finalizeFromCanonicalWork({
        request: ownerRequest,
        publicAssignment: sourceFixture.assignment,
        publicPlan: sourceLifecycle.plan,
        approvedWorkGraph: sourceLifecycle.graph,
        assignment: sourceFixture.brollAssignment,
        plan: sourceAuthority.plan,
        workItemResults: sourceResults,
      })
      assert.equal(ownerResult.authenticatedOwnerEvidenceRef.contentHash,
        privateVisualReview.reviewDigestSha256)
      const inspectionSourceAuthority =
        await ownerService.inspectionSourceAuthorityReadPort.readExact({
          ownerRequestRef: ownerResult.ownerRequestRef,
          ownerResultRef: {
            id: ownerResult.resultId,
            version: ownerResult.schemaVersion,
            contentHash: ownerResult.resultDigestSha256,
          },
        })
      assert.ok(inspectionSourceAuthority)
      assert.equal(
        inspectionSourceAuthority.selectedNormalizedArtifactRef.contentHash,
        canonicalSourceResultReceipt.selectedArtifact.normalizedArtifact.sha256,
      )
      assert.equal(
        inspectionSourceAuthority.selectedNormalizedArtifact
          .privateObjectIdentityDigestSha256,
        canonicalSourceResultReceipt.selectedArtifact.normalizedArtifact
          .privateObjectIdentityHash,
      )
      assert.equal(
        inspectionSourceAuthority.selectedNormalizedArtifact.frameCount,
        authorizedRange.endFrameExclusive
          - authorizedRange.startFrameInclusive,
      )
      assert.equal(
        inspectionSourceAuthority.selectedNormalizedArtifact.frameRate,
        authorizedRange.fps,
      )
      assert.equal(inspectionSourceAuthority.sourceSelectionPerformedByCaption,
        false)
      assert.equal(inspectionSourceAuthority.finalQaApprovalGranted, false)
      const publicAssignmentCore = Object.fromEntries(
        Object.entries(sourceFixture.assignment).filter(([key]) =>
          key !== 'assignmentHash'),
      ) as SkillAssignmentInput
      const crossedPublicAssignmentCore = {
        ...publicAssignmentCore,
        editSessionId: 'session-caption-broll-crossed',
      }
      await assert.rejects(() => ownerService.finalizeFromCanonicalWork({
        request: ownerRequest,
        publicAssignment: createSkillAssignment(crossedPublicAssignmentCore),
        publicPlan: sourceLifecycle.plan,
        approvedWorkGraph: sourceLifecycle.graph,
        assignment: sourceFixture.brollAssignment,
        plan: sourceAuthority.plan,
        workItemResults: sourceResults,
      }))
      const evidenceRepository = createCanonicalCaptionBrollEvidenceRepository({
        objectPort,
        prefix: 'private/internal/caption-broll-evidence/v1',
      })
      const bridge = createCanonicalCaptionBrollSupportService({
        supportResumeRepository,
        approvedSnapshotReadPort,
        ownerReadPort: ownerService.ownerReadPort,
        evidenceRepository,
        now: () => new Date('2026-08-05T12:17:00.000Z'),
      })
      const bridgeInput = {
        authenticatedOwnerUserId: scope.ownerUserId,
        priorCallRef: {
          id: call.callId,
          version: call.schemaVersion,
          contentHash: call.callDigestSha256,
        },
        selectedSupportRequestRef: {
          id: selectedSupportRequest.requestId,
          version: selectedSupportRequest.schemaVersion,
          contentHash: selectedSupportRequest.requestDigestSha256,
        },
      }
      const outcome = await bridge.projectAndResumeAuthenticatedEvidence(
        bridgeInput)
      assert.equal(outcome.resumeRecord.resumedResult.disposition, 'completed')
      assert.equal(
        outcome.evidenceRecord.ownerResult.resultDigestSha256,
        ownerResult.resultDigestSha256,
      )
      assert.equal(outcome.evidenceRecord.sourceSelectionPerformedByCaption,
        false)
      assert.equal(outcome.evidenceRecord.cropOrTimingPerformedByCaption,
        false)
      assert.equal(outcome.evidenceRecord.runtimeExecutionPerformedByBridge,
        false)
      assert.equal(outcome.evidenceRecord.finalQaApprovalGrantedByBridge, false)
      const replay = await bridge.projectAndResumeAuthenticatedEvidence(
        bridgeInput)
      assert.equal(replay.evidenceRecord.recordDigestSha256,
        outcome.evidenceRecord.recordDigestSha256)
      assert.equal(replay.resumeRecord.recordDigestSha256,
        outcome.resumeRecord.recordDigestSha256)
      // The owner finalization, crossed-assignment refusal, first Caption
      // projection, and exact replay each perform the required two-read
      // immutable-snapshot comparison.
      assert.equal(snapshotReads, 8)
      assert.equal(reviewReads, 2)
      const commonFinalReceipt = {
        status: 'passed_with_direct_private_visual_inspection',
        inspectionPackageSha256: inspectionPackage.packageSha256,
        directInspectionReceiptSha256: directInspectionSha256,
        captionOverlaySha256: inspectionPackage.captionOverlaySha256,
        previewSha256: inspectionPackage.previewSha256,
        ownerRequestDigestSha256: ownerRequest.requestDigestSha256,
        ownerResultDigestSha256: ownerResult.resultDigestSha256,
        authenticatedEvidenceRecordDigestSha256:
          outcome.evidenceRecord.recordDigestSha256,
        resumeRecordDigestSha256: outcome.resumeRecord.recordDigestSha256,
        actualCanonicalBrollRuntimeExecuted: true,
        actualLibassCaptionOverlayExecuted: true,
        completeTimePrivateVisualInspectionBound: true,
        captionResumeCompleted: true,
        crossedPublicAssignmentRejected: true,
        sourceSelectionPerformedByCaption: false,
        cropOrTimingPerformedByCaption: false,
        directPeerDispatchPerformed: false,
        finalQaApprovalGranted: false,
        publicDeliveryGranted: false,
        productionAuthorityGranted: false,
      }
      const finalReceipt = sourceEvidenceMode === 'real_private_media'
        ? {
          schemaVersion: 'caption-broll-owner-private-runtime-receipt-v2',
          ...commonFinalReceipt,
          sourceEvidenceMode,
          normalizedSourceSha256,
          realPrivateSourceMediaUsed: true,
          sourceMediaPathIncluded: false,
          brollCaptionCoCompositionQualified:
            directInspection.brollCaptionCoCompositionQualified,
          professionalCaptionAppearanceQualified: false,
          independentFinalQaApprovalGranted: false,
        }
        : {
          schemaVersion: 'caption-broll-owner-private-runtime-receipt-v1',
          ...commonFinalReceipt,
        }
      await writeFile(
        join(root, 'caption-broll-owner-private-runtime-receipt.json'),
        `${JSON.stringify(finalReceipt, null, 2)}\n`,
      )
      captionBrollOwnerEvidence = finalReceipt
    }
  }

  if (preserveRoot) {
    console.log(JSON.stringify({
      status: 'ok',
      manifestHash: BROLL_CAPABILITY_MANIFEST.manifestHash,
      publicRegistryResolved: true,
      strictManifestInputResolution: true,
      canonicalRuntimeBindingsDispatched: canonicalBindings.length,
      noActionWorkItems: noActionResults.length,
      noActionProviderRequests: 0,
      existingSourceWorkItems: sourceResults.length,
      existingSourceFfmpegFfprobeAndRemotion: true,
      generatedRouteIntentionallyExcludedFromCaptionOwnerEvidence: true,
      captionBrollOwnerEvidence,
      noPrivateMiniSkillImports: true,
    }, null, 2))
  } else {
    const generatedFixture = await createFixture({
    assignmentId: 'public-canonical-generated',
    route: 'generated',
  })
  const generated = await planAndApprove(generatedFixture, '2026-08-05T12:20:00.000Z')
  assert.equal(generated.plan.envelope.disposition, 'use_skill')
  assert.equal(generated.plan.dependencyRequests[0]?.requiredArtifactType,
    'visual_intelligence_candidate_qa_v1')
  const generatedAuthority = await privateAuthority({
    root,
    fixture: generatedFixture,
    plan: generated.plan,
    publicGraph: generated.graph,
  })
  const providerWorkItem = generatedAuthority.canonicalWorkItems.find((item) =>
    item.approvedProviderRoute === BROLL_PROVIDER_ROUTE_ID)
  assert.ok(providerWorkItem)
  const componentRef = generatedAuthority.persisted.componentRefs.bRollSkill
  const requestPackage = buildBrollProviderRequestPackageV5({
    assignment: generatedFixture.brollAssignment,
    context: generatedFixture.context,
    plan: generatedAuthority.plan,
  })
  const executionPackage = brollProviderExecutionPackageV5Schema.parse({
    packageRecordId: 'package-public-canonical-generated',
    packageHash: hashSkillValue({ package: 'public-canonical-generated', componentRef }),
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
    editSessionId: generatedFixture.assignment.editSessionId,
    approvedPlanSnapshotId: 'snapshot-public-canonical-generated',
    snapshotHash: hashSkillValue({ snapshot: 'public-canonical-generated', componentRef }),
    reservationId: 'reservation-public-canonical-generated',
    reservationStatus: 'reserved',
    workGraphHash: generatedAuthority.workGraph.workGraphHash,
    componentRefs: { bRollSkill: componentRef },
    approvedMaximumCredits: 100,
    remainingReservedCredits: 100,
    approvedProviderRoutes: [BROLL_PROVIDER_ROUTE_ID],
    approvedWorkItems: [{
      id: 'provider-public-canonical-generated',
      ...projectCanonicalBrollWorkItemForImmutableGeminiOmniV5(providerWorkItem),
    }],
    status: 'canonical_authority_packaged_runtime_blocked',
  })
  const authorization = createBrollProviderWorkAuthorizationV5({
    ownerUserId: scope.ownerUserId,
    executionPackage,
    component: generatedAuthority.persisted.component,
    componentRef,
    assignment: generatedFixture.brollAssignment,
    context: generatedFixture.context,
    plan: generatedAuthority.plan,
    workGraph: generatedAuthority.workGraph,
    requestPackage,
    providerRateAuthority: {
      schemaVersion: 'b_roll_provider_rate_authority_v1',
      snapshotId: 'rate-public-canonical-generated',
      snapshotDigest: hashSkillValue({ rate: 'public-canonical-generated' }),
      evidenceClass: 'injected_test_rate_unqualified',
      currency: 'USD',
      costMicrosPerGeneratedSecond: 100_000,
      effectiveAt: '2026-08-05T12:20:00.000Z',
      expiresAt: '2026-08-05T13:20:00.000Z',
      serviceFeeIncluded: false,
      productionQualified: false,
    },
    maximumAuthorizedProviderCostMicros: 1_000_000,
    maximumAuthorizedInfrastructureCostMicros: 100_000,
    idempotencyKey: 'public-canonical-generated-injected',
    authorizedAt: '2026-08-05T12:21:00.000Z',
    expiresAt: '2026-08-05T12:31:00.000Z',
  })
  const candidateObjectSha256 = sha256(candidateBytes)
  activeCoordinator = new BrollCanonicalPrivateExecutionCoordinator({
    route: 'generated_injected',
    localStorageRoot: root,
    approvalHash: generated.approval.approvalHash,
    approvedWorkGraphHash: generated.graph.approvedWorkGraphHash,
    approvedPublicWorkGraph: generated.graph,
    requirePublicDependencyAcceptance: true,
    component: generatedAuthority.persisted.component,
    componentRef,
    assignment: generatedFixture.brollAssignment,
    context: generatedFixture.context,
    visualOwnership: generatedFixture.ownership,
    plan: generatedAuthority.plan,
    planningQaReport: generatedAuthority.planningQa,
    workGraph: generatedAuthority.workGraph,
    canonicalWorkItems: generatedAuthority.canonicalWorkItems,
    captionOverlay: {
      reference: {
        artifactType: 'caption_overlay_png_v1',
        sha256: captionOverlaySha256,
        byteLength: captionBytes.byteLength,
        ...scope,
      },
      bytes: captionBytes,
      reservedZoneCount: 1,
    },
    mediaRuntime,
    remotionRuntime,
    integrationInfrastructureCostMicros: 7_500,
    requestPackage,
    authorization,
    workerIdentity: 'public-canonical-provider-worker',
    dispatchSecret: 'internal-dispatch-secret-not-a-provider-secret',
    leaseDurationMs: 120_000,
    lifecycleTimes: {
      claimedAt: '2026-08-05T12:22:00.000Z',
      issuedAt: '2026-08-05T12:22:01.000Z',
      consumedAt: '2026-08-05T12:22:02.000Z',
      completedAt: '2026-08-05T12:22:03.000Z',
    },
    candidate: {
      outputId: 'candidate-public-canonical-v1',
      bytes: candidateBytes,
      infrastructureCostMicros: 10_000,
      rawInfrastructureUsageEvidenceDigest: hashSkillValue({ usage: 'public-canonical-v1' }),
      injectedInteractionIdDigest: hashSkillValue({ interaction: 'public-canonical-v1' }),
      semanticObservation: createBrollCanonicalInjectedTestObservation({
        schemaVersion: 'b_roll_semantic_visual_observation_v1',
        candidateSha256: candidateObjectSha256,
        assignmentHash: generatedFixture.brollAssignment.assignmentHash,
        planHash: generatedAuthority.plan.planHash,
        conceptKey: generatedAuthority.plan.shotSpecification!.conceptKey,
        authorizedRangeHash: hashSkillValue(authorizedRange),
        observationSource: 'internal_injected_visual_observation_v1',
        testOnly: true,
        evidenceArtifactHash: hashSkillValue({ semantic: 'fallback-test-only' }),
        confidenceMillionths: 900_000,
        checks: {
          semanticAlignment: true,
          generatedVisualIntegrity: true,
          subjectObjectConsistency: true,
          plausibleMotion: true,
          cameraIntent: true,
          cropSafety: true,
          noProofMisrepresentation: true,
          contentSafety: true,
        },
        needsUserConfirmation: false,
        generatedMediaTreatedAsVerifiedProof: false,
        automaticSelectionAllowed: false,
        productionQualified: false,
      }),
    },
    now: () => '2026-08-05T12:25:00.000Z',
  })
  const generatedResults: EditSkillWorkResult[] = []
  const providerIndex = generated.graph.workItems.findIndex((item) =>
    item.jobType === 'generate_b_roll_candidate')
  assert.ok(providerIndex >= 0)
  for (const item of generated.graph.workItems.slice(0, providerIndex + 1)) {
    generatedResults.push(await dispatchItem({
      fixture: generatedFixture,
      plan: generated.plan,
      approval: generated.approval,
      graph: generated.graph,
      item,
    }))
  }
  const providerResult = generatedResults.at(-1)!
  const candidateArtifactRef = providerResult.outputArtifactRefs[0]!
  const dependencyPending = await plugin.finalizeSkillResult({
    assignment: generatedFixture.assignment,
    plan: generated.plan,
    workGraph: generated.graph,
    dependencyAcceptances: [],
    workItemResults: generatedResults,
  })
  assert.equal(dependencyPending.envelope.disposition, 'needs_other_skill')
  assert.equal(dependencyPending.envelope.resultArtifactHash, candidateArtifactRef.sha256)
  const findingEvidenceHash = hashSkillValue({
    candidateArtifactHash: candidateArtifactRef.sha256,
    evidence: 'model-neutral-visual-intelligence-public-canonical',
  })
  const finding = {
    disposition: 'pass' as const,
    summary: 'Independent semantic evidence passed this exact candidate check.',
    confidenceMillionths: 960_000,
    evidenceArtifactHashes: [findingEvidenceHash],
  }
  const visualIntelligenceArtifact = createBrollVisualIntelligenceCandidateQa({
    schemaVersion: 'visual_intelligence_candidate_qa_v1',
    candidateArtifact: candidateArtifactRef,
    candidateArtifactId: 'candidate-public-canonical-v1',
    ...scope,
    assignmentId: generatedFixture.assignment.assignmentId,
    assignmentHash: generatedFixture.assignment.assignmentHash,
    planId: generated.plan.envelope.planId,
    planHash: generated.plan.envelope.planHash,
    authorizedRange,
    authorizedRangeHash: hashSkillValue(authorizedRange),
    semanticAlignment: finding,
    subjectObjectConsistency: finding,
    motionPlausibility: finding,
    cameraIntentAlignment: finding,
    cropSafety: finding,
    contentSafety: finding,
    proofMisrepresentationCheck: finding,
    visualDefectFindings: [],
    confidenceMillionths: 960_000,
    uncertainty: null,
    evidenceFrameTimeReferences: [{
      masterFrameIndex: authorizedRange.startFrameInclusive,
      timeMicroseconds: 5_000_000,
      evidenceArtifactHash: findingEvidenceHash,
    }],
    producerIdentity: {
      producerKind: 'model_neutral_edit_skill_plugin',
      producerSkillKey: 'visual_intelligence',
      providerOrModelIdentityExposed: false,
    },
    producerSkillManifestRef: {
      schemaVersion: 'external-skill-manifest-reference-v1',
      skillKey: 'visual_intelligence',
      skillVersion: '1.0.0',
      contractVersion: 'visual-intelligence-candidate-qa-v1',
      manifestHash: hashSkillValue({ manifest: 'visual-intelligence-public-canonical-v1' }),
    },
    productionQualificationStatus: 'internal_execution_qualified',
    disposition: 'accepted',
    injectedTestOnly: false,
  })
  const visualIntelligenceRef = await artifactStore.putJson({
    artifactType: 'visual_intelligence_candidate_qa_v1',
    ...scope,
    value: visualIntelligenceArtifact,
  })
  const visualIntelligenceRequest = generated.plan.dependencyRequests[0]!
  const dependencyAcceptance = await plugin.acceptDependencyArtifact({
    assignment: generatedFixture.assignment,
    plan: generated.plan,
    request: visualIntelligenceRequest,
    artifactRef: visualIntelligenceRef,
    workGraph: generated.graph,
    relatedWorkItemResult: providerResult,
  })
  activeCoordinator.acceptDependencyAcceptance(
    dependencyAcceptance,
    visualIntelligenceArtifact,
  )
  for (const item of generated.graph.workItems.slice(providerIndex + 1)) {
    generatedResults.push(await dispatchItem({
      fixture: generatedFixture,
      plan: generated.plan,
      approval: generated.approval,
      graph: generated.graph,
      item,
    }))
  }
  const generatedReceipt = await plugin.finalizeSkillResult({
    assignment: generatedFixture.assignment,
    plan: generated.plan,
    workGraph: generated.graph,
    dependencyAcceptances: [dependencyAcceptance],
    workItemResults: generatedResults,
  })
  assert.equal(generatedReceipt.envelope.disposition, 'selected')
  assert.equal(generatedReceipt.dependencyAcceptanceHashes.length, 1)
  assert.equal(generatedResults.filter((result) => result.workerClass === 'provider_worker').length, 1)

  const trackFixture = await createFixture({
    assignmentId: 'public-canonical-track-dependency',
    route: 'track_all',
  })
  const trackPlan = await plugin.planAssignment({ assignment: trackFixture.assignment })
  assert.equal(trackPlan.envelope.disposition, 'needs_other_skill')
  const trackRequest = trackPlan.dependencyRequests[0]!
  assert.equal(trackRequest.dependencySkillKey, 'track_all')
  assert.equal(trackRequest.requiredArtifactType, 'track_graph_v1')
  const trackGraph = {
    schemaVersion: 'track_graph_v1' as const,
    modelNeutral: true as const,
    ...scope,
    assignmentId: trackFixture.assignment.assignmentId,
    assignmentHash: trackFixture.assignment.assignmentHash,
    authorizedRange,
    authorizedRangeHash: hashSkillValue(authorizedRange),
    sourceSha256: hashSkillValue({ source: 'public-canonical-track-source' }),
    fps: 24,
    tracks: [{
      trackId: 'public-canonical-track',
      startFrameInclusive: authorizedRange.startFrameInclusive,
      endFrameExclusive: authorizedRange.endFrameExclusive,
      samplesArtifactHash: hashSkillValue({ samples: 'public-canonical-track' }),
    }],
  }
  await assert.rejects(() => artifactStore.putJson({
    artifactType: 'track_graph_v1',
    ...scope,
    value: { ...trackGraph, trackingModel: 'sam2' },
  }))
  const trackRef = await artifactStore.putJson({
    artifactType: 'track_graph_v1',
    ...scope,
    value: trackGraph,
  })
  const trackAcceptance = await plugin.acceptDependencyArtifact({
    assignment: trackFixture.assignment,
    plan: trackPlan,
    request: trackRequest,
    artifactRef: trackRef,
  })
  assert.equal(trackAcceptance.validatedArtifactHash, trackRef.sha256)

    console.log(JSON.stringify({
      status: 'ok',
      manifestHash: BROLL_CAPABILITY_MANIFEST.manifestHash,
      publicRegistryResolved: true,
      strictManifestInputResolution: true,
      canonicalRuntimeBindingsDispatched: canonicalBindings.length,
      noActionWorkItems: noActionResults.length,
      noActionProviderRequests: 0,
      existingSourceWorkItems: sourceResults.length,
      existingSourceFfmpegFfprobeAndRemotion: true,
      generatedWorkItems: generatedResults.length,
      generatedInjectedTransportSubmissions: 1,
      generatedNeedsVisualIntelligenceBeforeAcceptance: true,
      visualIntelligenceAcceptanceHash: dependencyAcceptance.acceptanceHash,
      trackAllArtifactType: trackRequest.requiredArtifactType,
      directTrackingModelRejected: true,
      captionBrollOwnerEvidence,
      providerTaskContractEvidenceCommand: 'npm.smoke:b-roll-provider-lifecycle',
      noPrivateMiniSkillImports: true,
    }, null, 2))
  }
} finally {
  if (!preserveRoot) await rm(root, { recursive: true, force: true })
}
