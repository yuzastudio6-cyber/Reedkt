import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

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
  editSkillDependencyAcceptanceSchema,
  hashSkillValue,
  skillManifestReference,
  type EditSkillApprovedWorkGraph,
  type EditSkillArtifactReference,
  type EditSkillArtifactStore,
  type EditSkillPlanApproval,
  type EditSkillPublicPlan,
  type EditSkillWorkResult,
  type SkillAssignment,
} from '../edit-skills/core'
import {
  createEditSkillRuntime,
  createEditSkillRuntimeRegistries,
} from '../edit-skills/registry'
import {
  TRACK_ALL_SAM_OPERATION_V2,
  TRACK_ALL_TOOL_OPERATIONS,
} from '../edit-skills/track-all/track-all-capability-manifest'
import { brollQualificationReceiptFixture } from './b-roll-qualification-receipt-fixture'
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
  privateArtifactAuthority: true,
  providerAuthority: {
    operations: new Map(BROLL_PROVIDER_OPERATIONS.map((operationId) => [
      operationId,
      'internal_execution_qualified' as const,
    ])),
  },
  toolRegistry: {
    operationIds: new Set([
      ...BROLL_TOOL_OPERATIONS,
      ...TRACK_ALL_TOOL_OPERATIONS,
      TRACK_ALL_SAM_OPERATION_V2,
    ]),
    operationQualifications: new Map([
      ...BROLL_TOOL_OPERATIONS,
      ...TRACK_ALL_TOOL_OPERATIONS,
      TRACK_ALL_SAM_OPERATION_V2,
    ].map((operationId) => [
      operationId,
      'internal_execution_qualified' as const,
    ])),
  },
  additionalRuntimeBindings: canonicalBindings,
  ...runtimeRegistries,
})
const plugin = runtime.pluginRegistry.resolve(manifestRef)
const qualificationReceipt = brollQualificationReceiptFixture()

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
  availableRefs: Array<{
    reference: EditSkillArtifactReference
    producerWorkItemKey?: string
    producerWorkItemHash?: string
  }>
}): Promise<EditSkillWorkResult> {
  const binding = runtime.runtimeBindingRegistry.resolve({
    manifestRef,
    jobType: input.item.jobType,
    adapterClass: 'canonical_private_execution_adapter',
    environmentClass: 'canonical_private',
  }).definition
  const exactInputArtifactRefs = binding.inputArtifactTypes.map((artifactType) => {
    const available = [...input.availableRefs].reverse().find((entry) =>
      entry.reference.artifactType === artifactType)
    assert.ok(available, `Missing exact canonical input ${artifactType} for ${input.item.workItemKey}.`)
    return available.reference
  })
  const dependencyOutputRefs = input.availableRefs.filter((entry) =>
    entry.producerWorkItemKey && entry.producerWorkItemHash &&
    input.item.dependencyKeys.includes(entry.producerWorkItemKey))
    .map((entry) => ({
      reference: entry.reference,
      producerWorkItemKey: entry.producerWorkItemKey!,
      producerWorkItemHash: entry.producerWorkItemHash!,
    }))
  const outcome = await runtime.runtimeDispatcher.dispatchApprovedWorkItemToResult({
    manifestRef,
    workItem: input.item,
    approval: input.approval,
    authorizedPhase: binding.allowedPhases[0]!,
    expectedQualification: 'internal_execution_qualified',
    exactInputArtifactRefs,
    dependencyOutputRefs,
    artifactStore,
    artifactScope: scope,
    planId: input.plan.envelope.planId,
    planHash: input.plan.envelope.planHash,
    qaEvidenceArtifactRefs: [input.plan.evidenceRefs[0]!],
  })
  assert.equal(outcome.receipt.status, 'succeeded')
  assert.equal(outcome.receipt.publicArtifactCount, 0)
  assert.equal(outcome.receipt.productionMutationCount, 0)
  input.availableRefs.push(...outcome.outputArtifactRefs.map((reference) => ({
    reference,
    producerWorkItemKey: input.item.workItemKey,
    producerWorkItemHash: input.item.workItemHash,
  })))
  return plugin.validateWorkItemResult({
    assignment: input.fixture.assignment,
    plan: input.plan,
    workGraph: input.graph,
    result: outcome.workResult,
  })
}

function initialRuntimeRefs(input: {
  fixture: PublicFixture
  plan: EditSkillPublicPlan
  graph: EditSkillApprovedWorkGraph
}) {
  return [
    ...input.fixture.assignment.contextArtifactRefs,
    ...input.fixture.assignment.dependencyArtifactRefs,
    input.plan.payloadRef,
    ...input.plan.evidenceRefs,
    ...(input.graph.pluginWorkGraphRef ? [input.graph.pluginWorkGraphRef] : []),
    ...(input.fixture.source ? [input.fixture.source.reference] : []),
  ].map((reference) => ({ reference }))
}

const root = await mkdtemp(join(tmpdir(), 'reeditpro-broll-public-canonical-'))
try {
  const sourcePath = join(root, 'source.mp4')
  const candidatePath = join(root, 'candidate.mp4')
  const captionPath = join(root, 'caption.png')
  const sourceProcess = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i',
    'testsrc2=size=320x180:rate=24:duration=4', '-an', '-c:v', 'libx264',
    '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    '-threads', '1', '-y', sourcePath,
  ], { encoding: 'utf8' })
  assert.equal(sourceProcess.status, 0, sourceProcess.stderr)
  const candidateProcess = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i',
    'testsrc2=size=1280x720:rate=24:duration=3', '-an', '-c:v', 'libx264',
    '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-frames:v', '72',
    '-movflags', '+faststart', '-threads', '1', '-y', candidatePath,
  ], { encoding: 'utf8' })
  assert.equal(candidateProcess.status, 0, candidateProcess.stderr)
  const captionProcess = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i',
    'color=c=black@0.0:s=640x360,format=rgba,drawbox=x=120:y=290:w=400:h=42:color=white@0.9:t=fill,drawbox=x=150:y=302:w=340:h=10:color=black@0.75:t=fill', '-frames:v', '1', '-f',
    'image2', '-vcodec', 'png', '-y', captionPath,
  ], { encoding: 'utf8' })
  assert.equal(captionProcess.status, 0, captionProcess.stderr)
  const [sourceBytes, candidateBytes, captionBytes] = await Promise.all([
    readFile(sourcePath),
    readFile(candidatePath),
    readFile(captionPath),
  ])
  assert.ok(
    captionBytes.byteLength >= 1_024,
    `caption overlay fixture must exercise the validated PNG payload boundary; received ${captionBytes.byteLength} bytes`,
  )
  const mediaRuntime = await activatePrivateOfflineMediaBinaryRuntime()
  await prepareOfflineRemotionDockerRuntime()
  const remotionRuntime = await activatePrivateOfflineRemotionRenderRuntime()

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
  const noActionRuntimeRefs = initialRuntimeRefs({
    fixture: noActionFixture,
    plan: noAction.plan,
    graph: noAction.graph,
  })
  for (const item of noAction.graph.workItems) {
    noActionResults.push(await dispatchItem({
      fixture: noActionFixture,
      plan: noAction.plan,
      approval: noAction.approval,
      graph: noAction.graph,
      item,
      availableRefs: noActionRuntimeRefs,
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
  activeCoordinator = new BrollCanonicalPrivateExecutionCoordinator({
    route: 'existing_source',
    localStorageRoot: root,
    approvalHash: sourceLifecycle.approval.approvalHash,
    approvedWorkGraphHash: sourceLifecycle.graph.approvedWorkGraphHash,
    approvedPublicWorkGraph: sourceLifecycle.graph,
    component: sourceAuthority.persisted.component,
    componentRef: sourceAuthority.persisted.componentRefs.bRollSkill,
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
        sha256: sha256(captionBytes),
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
  const sourceRuntimeRefs = initialRuntimeRefs({
    fixture: sourceFixture,
    plan: sourceLifecycle.plan,
    graph: sourceLifecycle.graph,
  })
  for (const item of sourceLifecycle.graph.workItems) {
    sourceResults.push(await dispatchItem({
      fixture: sourceFixture,
      plan: sourceLifecycle.plan,
      approval: sourceLifecycle.approval,
      graph: sourceLifecycle.graph,
      item,
      availableRefs: sourceRuntimeRefs,
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
        sha256: sha256(captionBytes),
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
  const generatedRuntimeRefs = initialRuntimeRefs({
    fixture: generatedFixture,
    plan: generated.plan,
    graph: generated.graph,
  })
  const publicProviderWorkItem = generated.graph.workItems.find((item) =>
    item.jobType === 'generate_b_roll_candidate')
  assert.ok(publicProviderWorkItem)
  const providerRequestSpecificationCore = {
    schemaVersion: 'b_roll_provider_request_specification_v1' as const,
    ...scope,
    editSessionId: generatedFixture.assignment.editSessionId,
    assignmentId: generatedFixture.brollAssignment.assignmentId,
    assignmentHash: generatedFixture.brollAssignment.assignmentHash,
    manifestRef,
    planId: generatedAuthority.plan.planId,
    planHash: generatedAuthority.plan.planHash,
    approvedWorkGraphHash: generated.graph.approvedWorkGraphHash,
    workItemKey: publicProviderWorkItem.workItemKey,
    workItemHash: publicProviderWorkItem.workItemHash,
    operationId: 'provider.google.generate_b_roll_candidate.v1' as const,
    requestPackage,
    callerSelectable: false as const,
    automaticRetryAllowed: false as const,
    alternateProviderFallbackAllowed: false as const,
    approved: true as const,
  }
  generatedRuntimeRefs.push({
    reference: await artifactStore.putJson({
      artifactType: 'b_roll_provider_request_specification_v1',
      ...scope,
      value: {
        ...providerRequestSpecificationCore,
        specificationHash: hashSkillValue(providerRequestSpecificationCore),
      },
    }),
  })
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
      availableRefs: generatedRuntimeRefs,
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
  generatedRuntimeRefs.push({ reference: visualIntelligenceRef })
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
    editSkillDependencyAcceptanceSchema.parse(dependencyAcceptance),
    visualIntelligenceArtifact,
  )
  for (const item of generated.graph.workItems.slice(providerIndex + 1)) {
    generatedResults.push(await dispatchItem({
      fixture: generatedFixture,
      plan: generated.plan,
      approval: generated.approval,
      graph: generated.graph,
      item,
      availableRefs: generatedRuntimeRefs,
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
  await assert.rejects(
    () => plugin.acceptDependencyArtifact({
      assignment: trackFixture.assignment,
      plan: trackPlan,
      request: trackRequest,
      artifactRef: trackRef,
    }),
    /authenticated Track All owner support result/iu,
  )

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
    providerTaskContractEvidenceCommand: 'npm.smoke:b-roll-provider-lifecycle',
    noPrivateMiniSkillImports: true,
  }, null, 2))
} finally {
  await rm(root, { recursive: true, force: true })
}
