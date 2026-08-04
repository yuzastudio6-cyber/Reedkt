import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  BROLL_CAPABILITY_MANIFEST,
  BROLL_RUNTIME_BINDINGS,
  BROLL_WORK_GRAPH_JOB_DEFINITIONS,
  BrollCanonicalPrivateExecutionCoordinator,
  compileBrollCanonicalWorkGraph,
  compileBrollPlan,
  createBrollAssignment,
  createBrollCanonicalPrivateRuntimeBindings,
  createBrollPlanningContext,
  createBrollVisualOwnershipManifest,
  projectBrollCanonicalWorkItems,
} from '../edit-skills/b-roll'
import { createBrollSemanticVisualObservation } from '../edit-skills/b-roll/mini-skills/candidate-qa-director'
import {
  EditSkillRuntimeDispatcher,
  SkillJobRuntimeBindingRegistry,
  createEditSkillPlanApproval,
  hashSkillValue,
  skillManifestReference,
} from '../edit-skills/core'
import { GENERATED_BROLL_INTERNAL_QUALIFICATION_ARTIFACT } from '../edit-skills/b-roll/generated/b-roll-internal-qualification.generated'
import {
  assertSkillQualificationReceipt,
  skillQualificationReceiptSchema,
} from '../edit-skills/core/skill-qualification-receipt'
import {
  editSkillArtifactSchemaRegistry,
  editSkillEstimatorRegistry,
  editSkillQaRegistry,
  editSkillReferenceCatalog,
} from '../edit-skills/internal-fixture-runtime'
import {
  brollProviderExecutionPackageV5Schema,
  BROLL_PROVIDER_ROUTE_ID,
  buildBrollProviderRequestPackageV5,
  createBrollProviderWorkAuthorizationV5,
} from '../providers/google/gemini-omni-broll'
import { persistCanonicalBrollPlanComponent } from '../services/canonical-broll-plan-component-service'
import {
  activatePrivateOfflineMediaBinaryRuntime,
} from '../tool-execution/media-binary-execution'
import {
  activatePrivateOfflineRemotionRenderRuntime,
  prepareOfflineRemotionDockerRuntime,
} from '../tool-execution/remotion-render-execution'

const root = await mkdtemp(join(tmpdir(), 'reeditpro-broll-canonical-private-'))
try {
  const candidatePath = join(root, 'candidate.mp4')
  const captionPath = join(root, 'caption.png')
  const candidateProcess = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error',
    '-f', 'lavfi', '-i',
    'testsrc2=size=1280x720:rate=24:duration=3',
    '-an', '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', '-threads', '1', '-frames:v', '72', '-y', candidatePath,
  ], { encoding: 'utf8' })
  assert.equal(candidateProcess.status, 0, candidateProcess.stderr)
  const captionProcess = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error',
    '-f', 'lavfi', '-i', 'color=c=black@0.0:s=640x360,format=rgba',
    '-frames:v', '1', '-f', 'image2', '-vcodec', 'png', '-y', captionPath,
  ], { encoding: 'utf8' })
  assert.equal(captionProcess.status, 0, captionProcess.stderr)
  const candidateBytes = await readFile(candidatePath)
  const captionBytes = await readFile(captionPath)

  const manifestRef = skillManifestReference(BROLL_CAPABILITY_MANIFEST)
  const scope = {
    ownerUserId: 'user-canonical-private',
    workspaceId: 'workspace-canonical-private',
    projectId: 'project-canonical-private',
  }
  const masterRange = { startFrameInclusive: 0, endFrameExclusive: 2_400, fps: 24 }
  const authorizedRange = { startFrameInclusive: 120, endFrameExclusive: 192, fps: 24 }
  const assignment = createBrollAssignment({
    schemaVersion: 'b_roll_assignment_v1',
    assignmentId: 'assignment-canonical-private',
    orchestrationRunId: 'internal-qualification-run-canonical-private',
    ...scope,
    editSessionId: 'session-canonical-private',
    editPlanVersion: 1,
    masterTimingHash: hashSkillValue(masterRange),
    masterTimingRange: masterRange,
    segmentIds: ['segment-canonical-private'],
    sourceSequenceIds: [],
    readContextAuthority: {
      wholeVideoReadOnly: true,
      adjacentScenesReadOnly: true,
      contextArtifactRefs: [],
    },
    writeRangeAuthority: { authorizedRange, outsideAuthorizedRangeModified: false },
    reason: 'Show one safe illustrative workflow cutaway.',
    pointToProveClarifyCoverOrSupport: 'Clarify a workflow step without inventing proof.',
    expectedViewerBenefit: 'Understand the workflow through one continuous visual action.',
    requestedVisualOwnership: 'primary',
    forbiddenInterpretations: ['Do not fabricate customer proof or real-world evidence.'],
    permittedSourceRoutes: ['generate_with_gemini_omni', 'use_no_broll'],
    providerPermission: 'approved_within_ceiling',
    maximumInitialCandidates: 1,
    maximumRefinements: 1,
    maximumTimeSeconds: 600,
    maximumCredits: 100,
    requiredOutputTypes: ['b_roll_result_receipt_v1'],
    manifestRef,
  })
  const context = createBrollPlanningContext({
    schemaVersion: 'b_roll_context_manifest_v1',
    ...scope,
    assignmentId: assignment.assignmentId,
    baseFootageStrength: 0.2,
    speakerEmotionImportance: 0.1,
    meaningfulVisualNeed: 0.95,
    userVisualPreference: 'balanced',
    claimSensitivity: 'supporting',
    generatedMediaWouldMislead: false,
    captionReservedZoneCount: 1,
    trackingRequired: false,
    sourceCandidates: [],
    priorConceptKeys: [],
    confirmedAspectRatio: '16:9',
    uploadedVideoEditRegionEligible: true,
    referenceDnaDoNotCopyRules: ['Do not copy reference-specific shot construction.'],
  })
  const visualOwnership = createBrollVisualOwnershipManifest({
    schemaVersion: 'visual_ownership_manifest_v1',
    ...scope,
    editSessionId: assignment.editSessionId,
    assignmentId: assignment.assignmentId,
    editPlanVersion: assignment.editPlanVersion,
    manifestRef,
    assignmentRange: authorizedRange,
    requestedOwnership: 'primary',
    ownershipWindows: [],
  })
  const compiled = compileBrollPlan({
    assignment,
    context,
    manifest: BROLL_CAPABILITY_MANIFEST,
    estimators: editSkillEstimatorRegistry,
    qa: editSkillQaRegistry,
  })
  assert.equal(compiled.plan.decision, 'generate_with_gemini_omni')
  const workGraph = compileBrollCanonicalWorkGraph({ assignment, plan: compiled.plan })
  const canonicalWorkItems = projectBrollCanonicalWorkItems({ assignment, workGraph })
  const providerWorkItem = canonicalWorkItems.find((item) =>
    item.approvedProviderRoute === BROLL_PROVIDER_ROUTE_ID)
  assert.ok(providerWorkItem)
  const persisted = await persistCanonicalBrollPlanComponent({
    localStorageRoot: root,
    assignment,
    context,
    plan: compiled.plan,
    planningQaReport: compiled.planningQaReport,
    workGraph,
    // The coordinator revalidates this immutable historical receipt as plan
    // lineage only. The aggregate qualifier replaces it for the current tree.
    qualificationReceipt: assertSkillQualificationReceipt(
      skillQualificationReceiptSchema.parse(
        (GENERATED_BROLL_INTERNAL_QUALIFICATION_ARTIFACT as { receipt: unknown }).receipt,
      ),
    ),
  })
  const componentRef = persisted.componentRefs.bRollSkill
  const requestPackage = buildBrollProviderRequestPackageV5({
    assignment,
    context,
    plan: compiled.plan,
  })
  const executionPackage = brollProviderExecutionPackageV5Schema.parse({
    packageRecordId: 'package-canonical-private',
    packageHash: hashSkillValue({ package: 'canonical-private', componentRef }),
    workspaceId: assignment.workspaceId,
    projectId: assignment.projectId,
    editSessionId: assignment.editSessionId,
    approvedPlanSnapshotId: 'snapshot-canonical-private',
    snapshotHash: hashSkillValue({ snapshot: 'canonical-private', componentRef }),
    reservationId: 'reservation-canonical-private',
    reservationStatus: 'reserved',
    workGraphHash: workGraph.workGraphHash,
    componentRefs: { bRollSkill: componentRef },
    approvedMaximumCredits: 100,
    remainingReservedCredits: 100,
    approvedProviderRoutes: [BROLL_PROVIDER_ROUTE_ID],
    approvedWorkItems: [{ id: 'provider-work-canonical-private', ...providerWorkItem }],
    status: 'canonical_authority_packaged_runtime_blocked',
  })
  const authorization = createBrollProviderWorkAuthorizationV5({
    ownerUserId: assignment.ownerUserId,
    executionPackage,
    component: persisted.component,
    componentRef,
    assignment,
    context,
    plan: compiled.plan,
    workGraph,
    requestPackage,
    providerRateAuthority: {
      schemaVersion: 'b_roll_provider_rate_authority_v1',
      snapshotId: 'rate-canonical-private',
      snapshotDigest: hashSkillValue({ rate: 'canonical-private' }),
      evidenceClass: 'injected_test_rate_unqualified',
      currency: 'USD',
      costMicrosPerGeneratedSecond: 100_000,
      effectiveAt: '2026-08-04T12:00:00.000Z',
      expiresAt: '2026-08-04T13:00:00.000Z',
      serviceFeeIncluded: false,
      productionQualified: false,
    },
    maximumAuthorizedProviderCostMicros: 1_000_000,
    maximumAuthorizedInfrastructureCostMicros: 100_000,
    idempotencyKey: 'b-roll-canonical-private-initial',
    authorizedAt: '2026-08-04T12:00:00.000Z',
    expiresAt: '2026-08-04T12:10:00.000Z',
  })
  const approval = createEditSkillPlanApproval({
    schemaVersion: 'edit-skill-plan-approval-v1',
    assignmentId: assignment.assignmentId,
    assignmentHash: assignment.assignmentHash,
    planId: compiled.plan.planId,
    planHash: compiled.plan.planHash,
    manifestRef,
    authorizedRange,
    approved: true,
    approvedAt: '2026-08-04T12:00:00.000Z',
  })
  const mediaRuntime = await activatePrivateOfflineMediaBinaryRuntime()
  await prepareOfflineRemotionDockerRuntime()
  const remotionRuntime = await activatePrivateOfflineRemotionRenderRuntime()
  const candidateSha256 = sha256(candidateBytes)
  const coordinator = new BrollCanonicalPrivateExecutionCoordinator({
    route: 'generated_injected',
    localStorageRoot: root,
    approvalHash: approval.approvalHash,
    approvedWorkGraphHash: workGraph.workGraphHash,
    component: persisted.component,
    componentRef,
    assignment,
    context,
    visualOwnership,
    plan: compiled.plan,
    planningQaReport: compiled.planningQaReport,
    workGraph,
    canonicalWorkItems,
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
    workerIdentity: 'provider-worker-canonical-private',
    dispatchSecret: 'internal-dispatch-secret-not-a-provider-secret',
    leaseDurationMs: 120_000,
    lifecycleTimes: {
      claimedAt: '2026-08-04T12:01:00.000Z',
      issuedAt: '2026-08-04T12:01:01.000Z',
      consumedAt: '2026-08-04T12:01:02.000Z',
      completedAt: '2026-08-04T12:01:03.000Z',
    },
    candidate: {
      outputId: 'candidate-canonical-private-v1',
      bytes: candidateBytes,
      infrastructureCostMicros: 10_000,
      rawInfrastructureUsageEvidenceDigest: hashSkillValue({
        usage: 'canonical-private-v1',
      }),
      injectedInteractionIdDigest: hashSkillValue({
        interaction: 'canonical-private-v1',
      }),
      semanticObservation: createBrollSemanticVisualObservation({
        schemaVersion: 'b_roll_semantic_visual_observation_v1',
        candidateSha256,
        assignmentHash: assignment.assignmentHash,
        planHash: compiled.plan.planHash,
        conceptKey: compiled.plan.shotSpecification!.conceptKey,
        authorizedRangeHash: hashSkillValue(authorizedRange),
        observationSource: 'internal_injected_visual_observation_v1',
        testOnly: true,
        evidenceArtifactHash: hashSkillValue({ semantic: 'canonical-private-v1' }),
        confidenceMillionths: 950_000,
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
    now: () => '2026-08-04T12:05:00.000Z',
  })

  const canonicalBindings = createBrollCanonicalPrivateRuntimeBindings(coordinator)
  assert.equal(canonicalBindings.length, BROLL_CAPABILITY_MANIFEST.supportedJobTypes.length)
  assert.equal(canonicalBindings.every((binding) =>
    binding.definition.adapterClass === 'canonical_private_execution_adapter' &&
    binding.definition.environmentClass === 'canonical_private' &&
    binding.definition.privateArtifactRequired), true)
  const registry = new SkillJobRuntimeBindingRegistry()
  for (const binding of canonicalBindings) registry.register(binding)
  registry.validateManifest({
    manifest: BROLL_CAPABILITY_MANIFEST,
    artifacts: editSkillArtifactSchemaRegistry,
    operations: editSkillReferenceCatalog,
    workGraphJobs: BROLL_WORK_GRAPH_JOB_DEFINITIONS,
  })
  const dispatcher = new EditSkillRuntimeDispatcher(registry, 'canonical_private')
  const definitionByJob = new Map(canonicalBindings.map((binding) => [
    binding.definition.jobType,
    binding.definition,
  ]))
  const second = workGraph.workItems[1]!
  const secondDefinition = definitionByJob.get(second.jobType)!
  await assert.rejects(() => dispatcher.dispatchApprovedWorkItem({
    manifestRef,
    workItem: second,
    approval,
    authorizedPhase: secondDefinition.allowedPhases[0]!,
    inputArtifactTypes: secondDefinition.inputArtifactTypes,
    adapterClass: 'canonical_private_execution_adapter',
    environmentClass: 'canonical_private',
    runtimeQualification: 'internal_execution_qualified',
    artifactStorageClass: 'durable',
    privateArtifactAuthority: true,
    providerAuthorityOperations: editSkillReferenceCatalog.providerOperations,
    toolAuthorityOperations: editSkillReferenceCatalog.toolOperations,
  }), /before its dependencies/u)

  const receipts = []
  for (const workItem of workGraph.workItems) {
    const definition = definitionByJob.get(workItem.jobType)
    assert.ok(definition)
    receipts.push(await dispatcher.dispatchApprovedWorkItem({
      manifestRef,
      workItem,
      approval,
      authorizedPhase: definition.allowedPhases[0]!,
      inputArtifactTypes: definition.inputArtifactTypes,
      adapterClass: 'canonical_private_execution_adapter',
      environmentClass: 'canonical_private',
      runtimeQualification: 'internal_execution_qualified',
      artifactStorageClass: 'durable',
      privateArtifactAuthority: true,
      providerAuthorityOperations: editSkillReferenceCatalog.providerOperations,
      toolAuthorityOperations: editSkillReferenceCatalog.toolOperations,
    }))
  }
  const snapshot = coordinator.snapshot()
  assert.equal(receipts.length, workGraph.workItems.length)
  assert.equal(receipts.every((receipt) => receipt.status === 'succeeded'), true)
  assert.equal(receipts.reduce((total, receipt) => total + receipt.providerRequestCount, 0), 0)
  assert.equal(receipts.reduce((total, receipt) => total + receipt.publicArtifactCount, 0), 0)
  assert.equal(receipts.reduce((total, receipt) => total + receipt.productionMutationCount, 0), 0)
  assert.equal(snapshot.completedWorkItemKeys.length, workGraph.workItems.length)
  assert.equal(snapshot.candidateVersion?.rawCandidate.sha256, candidateSha256)
  assert.equal(snapshot.candidateQaReport?.productionQualifiedSemanticQa, false)
  assert.equal(snapshot.integrationQa?.status, 'passed')
  assert.equal(snapshot.resultReceipt?.outsideAuthorizedRangeModified, false)
  assert.ok(snapshot.resultReceipt && 'preview' in snapshot.resultReceipt)
  if (snapshot.resultReceipt && 'preview' in snapshot.resultReceipt) {
    assert.equal(snapshot.resultReceipt.preview.privateInternalOnly, true)
    assert.equal(snapshot.resultReceipt.preview.frameCount, 72)
  }
  assert.equal(BROLL_RUNTIME_BINDINGS.every((binding) =>
    binding.definition.adapterClass === 'internal_qualification_adapter'), true)
  assert.equal(canonicalBindings.some((binding) =>
    binding.definition.adapterClass === 'production_worker_adapter'), false)

  const noActionAssignment = createBrollAssignment({
    schemaVersion: 'b_roll_assignment_v1',
    assignmentId: 'assignment-canonical-private-no-action',
    orchestrationRunId: 'internal-qualification-run-no-action',
    ...scope,
    editSessionId: 'session-canonical-private-no-action',
    editPlanVersion: 1,
    masterTimingHash: hashSkillValue(masterRange),
    masterTimingRange: masterRange,
    segmentIds: ['segment-canonical-private-no-action'],
    sourceSequenceIds: [],
    readContextAuthority: {
      wholeVideoReadOnly: true,
      adjacentScenesReadOnly: true,
      contextArtifactRefs: [],
    },
    writeRangeAuthority: { authorizedRange, outsideAuthorizedRangeModified: false },
    reason: 'Preserve the strong emotional base footage without an extra visual.',
    pointToProveClarifyCoverOrSupport: 'Protect the speaker moment.',
    expectedViewerBenefit: 'Stay with the strongest authentic footage.',
    requestedVisualOwnership: 'primary',
    forbiddenInterpretations: ['Do not hide the speaker.'],
    permittedSourceRoutes: ['use_no_broll'],
    providerPermission: 'forbidden',
    maximumInitialCandidates: 1,
    maximumRefinements: 1,
    maximumTimeSeconds: 60,
    maximumCredits: 0,
    requiredOutputTypes: ['b_roll_result_receipt_v1'],
    manifestRef,
  })
  const noActionContext = createBrollPlanningContext({
    schemaVersion: 'b_roll_context_manifest_v1',
    ...scope,
    assignmentId: noActionAssignment.assignmentId,
    baseFootageStrength: 0.99,
    speakerEmotionImportance: 0.99,
    meaningfulVisualNeed: 0.05,
    userVisualPreference: 'no_extra_visuals',
    claimSensitivity: 'claim_sensitive',
    generatedMediaWouldMislead: true,
    captionReservedZoneCount: 1,
    trackingRequired: false,
    sourceCandidates: [],
    priorConceptKeys: [],
    confirmedAspectRatio: '16:9',
    uploadedVideoEditRegionEligible: true,
    referenceDnaDoNotCopyRules: [],
  })
  const noActionOwnership = createBrollVisualOwnershipManifest({
    schemaVersion: 'visual_ownership_manifest_v1',
    ...scope,
    editSessionId: noActionAssignment.editSessionId,
    assignmentId: noActionAssignment.assignmentId,
    editPlanVersion: noActionAssignment.editPlanVersion,
    manifestRef,
    assignmentRange: authorizedRange,
    requestedOwnership: 'primary',
    ownershipWindows: [],
  })
  const noActionCompiled = compileBrollPlan({
    assignment: noActionAssignment,
    context: noActionContext,
    manifest: BROLL_CAPABILITY_MANIFEST,
    estimators: editSkillEstimatorRegistry,
    qa: editSkillQaRegistry,
  })
  assert.equal(noActionCompiled.plan.decision, 'use_no_broll')
  const noActionGraph = compileBrollCanonicalWorkGraph({
    assignment: noActionAssignment,
    plan: noActionCompiled.plan,
  })
  const noActionCanonicalItems = projectBrollCanonicalWorkItems({
    assignment: noActionAssignment,
    workGraph: noActionGraph,
  })
  const noActionPersisted = await persistCanonicalBrollPlanComponent({
    localStorageRoot: root,
    assignment: noActionAssignment,
    context: noActionContext,
    plan: noActionCompiled.plan,
    planningQaReport: noActionCompiled.planningQaReport,
    workGraph: noActionGraph,
    qualificationReceipt: assertSkillQualificationReceipt(
      skillQualificationReceiptSchema.parse(
        (GENERATED_BROLL_INTERNAL_QUALIFICATION_ARTIFACT as { receipt: unknown }).receipt,
      ),
    ),
  })
  const noActionApproval = createEditSkillPlanApproval({
    schemaVersion: 'edit-skill-plan-approval-v1',
    assignmentId: noActionAssignment.assignmentId,
    assignmentHash: noActionAssignment.assignmentHash,
    planId: noActionCompiled.plan.planId,
    planHash: noActionCompiled.plan.planHash,
    manifestRef,
    authorizedRange,
    approved: true,
    approvedAt: '2026-08-04T12:10:00.000Z',
  })
  const noActionCoordinator = new BrollCanonicalPrivateExecutionCoordinator({
    route: 'professional_no_action',
    localStorageRoot: root,
    approvalHash: noActionApproval.approvalHash,
    approvedWorkGraphHash: noActionGraph.workGraphHash,
    component: noActionPersisted.component,
    componentRef: noActionPersisted.componentRefs.bRollSkill,
    assignment: noActionAssignment,
    context: noActionContext,
    visualOwnership: noActionOwnership,
    plan: noActionCompiled.plan,
    planningQaReport: noActionCompiled.planningQaReport,
    workGraph: noActionGraph,
    canonicalWorkItems: noActionCanonicalItems,
  })
  const noActionBindings = createBrollCanonicalPrivateRuntimeBindings(noActionCoordinator)
  const noActionRegistry = new SkillJobRuntimeBindingRegistry()
  for (const binding of noActionBindings) noActionRegistry.register(binding)
  const noActionDispatcher = new EditSkillRuntimeDispatcher(
    noActionRegistry,
    'canonical_private',
  )
  const noActionBindingByJob = new Map(noActionBindings.map((binding) => [
    binding.definition.jobType,
    binding.definition,
  ]))
  const noActionReceipts = []
  for (const workItem of noActionGraph.workItems) {
    const definition = noActionBindingByJob.get(workItem.jobType)
    assert.ok(definition)
    noActionReceipts.push(await noActionDispatcher.dispatchApprovedWorkItem({
      manifestRef,
      workItem,
      approval: noActionApproval,
      authorizedPhase: definition.allowedPhases[0]!,
      inputArtifactTypes: definition.inputArtifactTypes,
      adapterClass: 'canonical_private_execution_adapter',
      environmentClass: 'canonical_private',
      runtimeQualification: 'internal_execution_qualified',
      artifactStorageClass: 'durable',
      privateArtifactAuthority: true,
      providerAuthorityOperations: editSkillReferenceCatalog.providerOperations,
      toolAuthorityOperations: editSkillReferenceCatalog.toolOperations,
    }))
  }
  const noActionSnapshot = noActionCoordinator.snapshot()
  assert.equal(noActionReceipts.length, 3)
  assert.equal(noActionReceipts.some((receipt) => receipt.providerRequestCount !== 0), false)
  assert.ok(noActionSnapshot.resultReceipt && 'resultKind' in noActionSnapshot.resultReceipt)
  if (noActionSnapshot.resultReceipt && 'resultKind' in noActionSnapshot.resultReceipt) {
    assert.equal(noActionSnapshot.resultReceipt.resultKind, 'professional_no_action')
    assert.equal(noActionSnapshot.resultReceipt.mediaArtifactCount, 0)
    assert.equal(noActionSnapshot.resultReceipt.displayLayer, null)
  }

  console.log(JSON.stringify({
    status: 'ok',
    manifestHash: BROLL_CAPABILITY_MANIFEST.manifestHash,
    canonicalPrivateBindings: canonicalBindings.length,
    dispatchedCanonicalWorkItems: receipts.length,
    actualProviderRequests: 0,
    injectedLifecycleReplayProven: true,
    candidateSha256,
    candidateQaHash: snapshot.candidateQaReport?.qaReportHash,
    privatePreviewSha256: snapshot.resultReceipt && 'preview' in snapshot.resultReceipt
      ? snapshot.resultReceipt.preview.sha256
      : null,
    resultHash: snapshot.resultReceipt?.resultHash,
    noActionDispatches: noActionReceipts.length,
    noActionResultHash: noActionSnapshot.resultReceipt?.resultHash,
    outsideAuthorizedRangeModified: false,
    productionBindings: 0,
  }, null, 2))
} finally {
  await rm(root, { recursive: true, force: true })
}

function sha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
