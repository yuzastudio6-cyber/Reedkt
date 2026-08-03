import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  BROLL_CAPABILITY_MANIFEST,
  assertCanonicalBrollComponentRefPropagation,
  compileBrollCanonicalWorkGraph,
  compileBrollPlan,
  createBrollAssignment,
  createBrollPlanningContext,
  createInitialInjectedBrollCandidateAttemptEvidence,
  executeBrollCandidateQa,
  executeBrollRemotionIntegration,
  executePrivateInjectedBrollCandidateRefinement,
  projectBrollCanonicalWorkItems,
} from '../edit-skills/b-roll'
import { createBrollSemanticVisualObservation } from '../edit-skills/b-roll/mini-skills/candidate-qa-director'
import { directBrollCandidateRefinement } from '../edit-skills/b-roll/mini-skills/refinement-director'
import {
  BROLL_INTERNAL_EXECUTION_QUALIFICATION_FIXTURE_KEYS,
  BROLL_PLANNING_QUALIFICATION_FIXTURE_KEYS,
  BROLL_PRODUCTION_QUALIFICATION_FIXTURE_KEYS,
  createBrollInternalExecutionQualificationReceipt,
} from '../edit-skills/b-roll/b-roll-qualification'
import {
  hashSkillValue,
  skillManifestReference,
} from '../edit-skills/core/skill-capability-manifest-hash'
import {
  assertQualificationSupportsClaim,
  assertSkillQualificationReceipt,
} from '../edit-skills/core/skill-qualification-receipt'
import { editSkillEstimatorRegistry, editSkillQaRegistry } from '../edit-skills/registry'
import {
  BROLL_PROVIDER_ROUTE_ID,
  brollProviderExecutionPackageV5Schema,
  buildBrollGeminiOfficialRefinementRequest,
  buildBrollProviderRequestPackageV5,
  createBrollProviderWorkAuthorizationV5,
  executePrivateInjectedBrollProviderLifecycleV5,
} from '../providers/google/gemini-omni-broll'
import {
  readCanonicalPrivateMediaArtifact,
} from '../services/canonical-private-media-artifact-storage'
import {
  persistCanonicalBrollPlanComponent,
} from '../services/canonical-broll-plan-component-service'
import {
  putPrivateAuthorityJsonBlob,
  readPrivateAuthorityJsonBlob,
} from '../services/private-edit-authority-store'
import {
  activatePrivateOfflineMediaBinaryRuntime,
} from '../tool-execution/media-binary-execution'
import {
  activatePrivateOfflineRemotionRenderRuntime,
  prepareOfflineRemotionDockerRuntime,
} from '../tool-execution/remotion-render-execution'

const root = await mkdtemp(join(tmpdir(), 'reeditpro-broll-m11-'))
try {
  const candidatePath = join(root, 'injected-generated-candidate.mp4')
  const captionPath = join(root, 'caption-overlay.png')
  const generatedCandidate = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error',
    '-f', 'lavfi', '-i',
    'color=c=0x1858a8:s=1280x720:r=24:d=3,format=yuv420p,hue=H=6.2831853*t:s=1',
    '-an', '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', '-threads', '1', '-frames:v', '72', '-y', candidatePath,
  ], { encoding: 'utf8' })
  assert.equal(generatedCandidate.status, 0, generatedCandidate.stderr)
  const generatedCaption = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error',
    '-f', 'lavfi', '-i', 'color=c=black@0.0:s=640x360,format=rgba',
    '-frames:v', '1', '-f', 'image2', '-vcodec', 'png', '-y', captionPath,
  ], { encoding: 'utf8' })
  assert.equal(generatedCaption.status, 0, generatedCaption.stderr)
  const candidateBytes = await readFile(candidatePath)
  const captionBytes = await readFile(captionPath)

  const manifestRef = skillManifestReference(BROLL_CAPABILITY_MANIFEST)
  const qualificationReceipt = createBrollInternalExecutionQualificationReceipt(
    BROLL_CAPABILITY_MANIFEST,
  )
  assertSkillQualificationReceipt(qualificationReceipt)
  assert.equal(qualificationReceipt.qualificationStatus, 'internal_execution_qualified')
  const expectedInternalFixtureKeys = [
    ...BROLL_PLANNING_QUALIFICATION_FIXTURE_KEYS,
    ...BROLL_INTERNAL_EXECUTION_QUALIFICATION_FIXTURE_KEYS,
  ]
  assert.deepEqual(
    qualificationReceipt.fixtureResults.map((result) => result.fixtureKey),
    expectedInternalFixtureKeys,
  )
  assert.equal(
    qualificationReceipt.fixtureResults.some((result) =>
      BROLL_PRODUCTION_QUALIFICATION_FIXTURE_KEYS.includes(
        result.fixtureKey as (typeof BROLL_PRODUCTION_QUALIFICATION_FIXTURE_KEYS)[number],
      )),
    false,
  )
  assertQualificationSupportsClaim({
    manifestRef,
    claimedStatus: 'internal_execution_qualified',
    receipt: qualificationReceipt,
  })
  assert.throws(() => assertQualificationSupportsClaim({
    manifestRef,
    claimedStatus: 'production_qualified',
    receipt: qualificationReceipt,
  }), /exceeds/u)
  assert.throws(() => assertSkillQualificationReceipt({
    ...qualificationReceipt,
    receiptHash: '0'.repeat(64),
  }), /stale or forged/u)

  const scope = {
    ownerUserId: 'user-m11',
    workspaceId: 'workspace-m11',
    projectId: 'project-m11',
  }
  const masterRange = { startFrameInclusive: 0, endFrameExclusive: 2_400, fps: 24 }
  const authorizedRange = { startFrameInclusive: 120, endFrameExclusive: 192, fps: 24 }
  const assignment = createBrollAssignment({
    schemaVersion: 'b_roll_assignment_v1',
    assignmentId: 'assignment-m11',
    orchestrationRunId: 'orchestration-m11',
    ...scope,
    editSessionId: 'session-m11',
    editPlanVersion: 1,
    masterTimingHash: hashSkillValue(masterRange),
    masterTimingRange: masterRange,
    segmentIds: ['segment-m11'],
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
  const compiled = compileBrollPlan({
    assignment,
    context,
    manifest: BROLL_CAPABILITY_MANIFEST,
    estimators: editSkillEstimatorRegistry,
    qa: editSkillQaRegistry,
  })
  assert.equal(compiled.plan.decision, 'generate_with_gemini_omni')
  assert.equal(compiled.plan.outsideAuthorizedRangeModified, false)
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
    workGraph,
    qualificationReceipt,
  })
  const componentRef = persisted.componentRefs.bRollSkill
  assertCanonicalBrollComponentRefPropagation({
    planComponentRefs: { bRollSkill: componentRef },
    snapshotComponentRefs: { bRollSkill: componentRef },
    executionPackageComponentRefs: { bRollSkill: componentRef },
  })

  const requestPackage = buildBrollProviderRequestPackageV5({
    assignment,
    context,
    plan: compiled.plan,
  })
  const executionPackage = brollProviderExecutionPackageV5Schema.parse({
    packageRecordId: 'package-m11',
    packageHash: hashSkillValue({ package: 'm11', componentRef }),
    workspaceId: assignment.workspaceId,
    projectId: assignment.projectId,
    editSessionId: assignment.editSessionId,
    approvedPlanSnapshotId: 'snapshot-m11',
    snapshotHash: hashSkillValue({ snapshot: 'm11', componentRef }),
    reservationId: 'reservation-m11',
    reservationStatus: 'reserved',
    workGraphHash: workGraph.workGraphHash,
    componentRefs: { bRollSkill: componentRef },
    approvedMaximumCredits: 100,
    remainingReservedCredits: 100,
    approvedProviderRoutes: [BROLL_PROVIDER_ROUTE_ID],
    approvedWorkItems: [{ id: 'provider-work-m11', ...providerWorkItem }],
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
      snapshotId: 'rate-m11',
      snapshotDigest: hashSkillValue({ rate: 'm11' }),
      evidenceClass: 'injected_test_rate_unqualified',
      currency: 'USD',
      costMicrosPerGeneratedSecond: 100_000,
      effectiveAt: '2026-08-03T20:00:00.000Z',
      expiresAt: '2026-08-03T21:00:00.000Z',
      serviceFeeIncluded: false,
      productionQualified: false,
    },
    maximumAuthorizedProviderCostMicros: 1_000_000,
    maximumAuthorizedInfrastructureCostMicros: 100_000,
    idempotencyKey: 'b-roll-provider-m11-initial',
    authorizedAt: '2026-08-03T20:00:00.000Z',
    expiresAt: '2026-08-03T20:10:00.000Z',
  })
  const lifecycle = await executePrivateInjectedBrollProviderLifecycleV5({
    localStorageRoot: root,
    authorization,
    requestPackage,
    workerIdentity: 'provider-worker-m11',
    dispatchSecret: 'm11-internal-dispatch-secret-not-a-provider-secret',
    leaseDurationMs: 120_000,
    times: {
      claimedAt: '2026-08-03T20:01:00.000Z',
      issuedAt: '2026-08-03T20:01:01.000Z',
      consumedAt: '2026-08-03T20:01:02.000Z',
      completedAt: '2026-08-03T20:01:03.000Z',
    },
    outcome: {
      state: 'succeeded',
      outputId: 'candidate-m11-v1',
      bytes: candidateBytes,
      infrastructureCostMicros: 10_000,
      rawInfrastructureUsageEvidenceDigest: hashSkillValue({ usage: 'm11-v1' }),
    },
  })
  assert.ok(lifecycle.consumerReceipt)
  assert.equal(lifecycle.state.cost.actualProviderRequestCount, 0)
  assert.equal(lifecycle.state.output?.providerGenerated, false)
  const previousInteractionId = 'interaction-m11-injected-refinement'
  const previousInteractionIdDigest = sha256Text(previousInteractionId)
  const initialAttempt = createInitialInjectedBrollCandidateAttemptEvidence({
    state: lifecycle.state,
    consumerReceipt: lifecycle.consumerReceipt,
    requestPackage,
    injectedInteractionIdDigest: previousInteractionIdDigest,
  })
  const mediaRuntime = await activatePrivateOfflineMediaBinaryRuntime()
  const rangeHash = hashSkillValue(authorizedRange)
  const version1 = await executeBrollCandidateQa({
    localStorageRoot: root,
    assignment,
    context,
    plan: compiled.plan,
    requestPackage,
    attemptEvidence: initialAttempt,
    candidateBytes,
    semanticObservation: observation({
      candidateSha256: initialAttempt.output.sha256,
      assignmentHash: assignment.assignmentHash,
      planHash: compiled.plan.planHash,
      conceptKey: compiled.plan.shotSpecification!.conceptKey,
      authorizedRangeHash: rangeHash,
      cameraIntent: false,
      label: 'm11-v1-needs-refinement',
    }),
    mediaRuntime,
    now: () => '2026-08-03T20:02:00.000Z',
  })
  assert.equal(version1.version.verdict, 'needs_refinement')
  const refinementAuthority = directBrollCandidateRefinement({
    priorCandidate: {
      candidateSetId: version1.version.candidateSetId,
      candidateVersionId: version1.version.candidateVersionId,
      versionNumber: 1,
      candidateVersionHash: version1.version.candidateVersionHash,
      assignmentHash: version1.version.assignmentHash,
      planHash: version1.version.planHash,
      conceptKey: version1.version.conceptKey,
      authorizedRange: version1.version.authorizedRange,
      attemptId: version1.version.attemptId,
      requestPackageHash: version1.version.requestPackageHash,
      nativeAspectRatio: version1.version.nativeAspectRatio,
      durationSeconds: version1.version.durationSeconds,
    },
    priorCandidateVersionRef: version1.versionRef,
    priorQa: {
      qaReportHash: version1.qaReport.qaReportHash,
      qaReportRef: version1.qaReportRef,
      candidateVersionId: version1.version.candidateVersionId,
      verdict: version1.qaReport.verdict,
      refinementAllowed: version1.qaReport.decision.refinementAllowed,
      refinementReasonCodes: version1.qaReport.decision.refinementReasonCodes,
    },
    previousInteractionIdDigest,
    existingCandidateVersionCount: 1,
    existingRefinementCount: 0,
    maximumAuthorizedProviderCostMicros: 500_000,
    maximumAuthorizedInfrastructureCostMicros: 50_000,
    issuedAt: '2026-08-03T20:02:01.000Z',
    expiresAt: '2026-08-03T20:07:01.000Z',
  })
  const officialRefinement = buildBrollGeminiOfficialRefinementRequest({
    authority: refinementAuthority,
    previousInteractionId,
  })
  assert.equal(officialRefinement.body.previous_interaction_id, previousInteractionId)
  const refinement = await executePrivateInjectedBrollCandidateRefinement({
    localStorageRoot: root,
    authority: refinementAuthority,
    outputId: 'candidate-m11-v2',
    bytes: candidateBytes,
    providerCostMicros: 300_000,
    infrastructureCostMicros: 12_000,
    now: () => '2026-08-03T20:03:00.000Z',
  })
  assert.equal(refinement.disposition, 'executed')
  const version2 = await executeBrollCandidateQa({
    localStorageRoot: root,
    assignment,
    context,
    plan: compiled.plan,
    requestPackage,
    attemptEvidence: refinement.attemptEvidence,
    candidateBytes,
    semanticObservation: observation({
      candidateSha256: refinement.attemptEvidence.output.sha256,
      assignmentHash: assignment.assignmentHash,
      planHash: compiled.plan.planHash,
      conceptKey: compiled.plan.shotSpecification!.conceptKey,
      authorizedRangeHash: rangeHash,
      cameraIntent: true,
      label: 'm11-v2-accepted',
    }),
    refinementAuthority,
    mediaRuntime,
    now: () => '2026-08-03T20:03:30.000Z',
  })
  assert.equal(version2.version.verdict, 'accepted_after_normalization')
  const normalized = await readCanonicalPrivateMediaArtifact({
    localStorageRoot: root,
    privateObjectIdentityHash: version2.version.normalizedCandidate.privateObjectIdentityHash,
  })
  assert.ok(normalized)
  assert.equal(normalized.sha256, version2.version.normalizedCandidate.sha256)

  await prepareOfflineRemotionDockerRuntime()
  const remotionRuntime = await activatePrivateOfflineRemotionRenderRuntime()
  const captionRef = {
    artifactType: 'caption_overlay_png_v1',
    sha256: sha256Bytes(captionBytes),
    byteLength: captionBytes.byteLength,
    ...scope,
  }
  const result = await executeBrollRemotionIntegration({
    localStorageRoot: root,
    assignment,
    assignmentRef: persisted.component.assignmentArtifactRef,
    plan: compiled.plan,
    planRef: persisted.component.planArtifactRef,
    selection: {
      kind: 'candidate',
      candidateVersion: version2.version,
      candidateVersionRef: version2.versionRef,
      qaReport: version2.qaReport,
      qaReportRef: version2.qaReportRef,
      normalizedBytes: normalized.bytes,
      attemptHistory: [initialAttempt, refinement.attemptEvidence],
    },
    captionOverlay: {
      reference: captionRef,
      bytes: captionBytes,
      reservedZoneCount: 1,
    },
    mediaRuntime,
    remotionRuntime,
    integrationInfrastructureCostMicros: 7_500,
    idempotencyKey: 'b-roll-remotion-m11',
    now: () => '2026-08-03T20:05:00.000Z',
  })
  assert.equal(result.receipt.selectedArtifact.sourceRoute, 'gemini_omni_generated_candidate')
  assert.equal(result.receipt.selectedArtifact.candidateVersionNumber, 2)
  assert.equal(result.receipt.attemptHistory.length, 2)
  assert.equal(result.receipt.costEvidence.providerCostMicros, 300_000)
  assert.equal(result.receipt.costEvidence.candidateInfrastructureCostMicros, 22_000)
  assert.equal(result.receipt.costEvidence.integrationInfrastructureCostMicros, 7_500)
  assert.equal(result.receipt.outsideAuthorizedRangeModified, false)
  assert.equal(result.receipt.preview.privateInternalOnly, true)
  assert.deepEqual(Object.values(result.integrationQa.checks), Array(11).fill(true))

  const replay = await executeBrollRemotionIntegration({
    localStorageRoot: root,
    assignment,
    assignmentRef: persisted.component.assignmentArtifactRef,
    plan: compiled.plan,
    planRef: persisted.component.planArtifactRef,
    selection: {
      kind: 'candidate',
      candidateVersion: version2.version,
      candidateVersionRef: version2.versionRef,
      qaReport: version2.qaReport,
      qaReportRef: version2.qaReportRef,
      normalizedBytes: normalized.bytes,
      attemptHistory: [initialAttempt, refinement.attemptEvidence],
    },
    captionOverlay: { reference: captionRef, bytes: captionBytes, reservedZoneCount: 1 },
    mediaRuntime,
    remotionRuntime,
    integrationInfrastructureCostMicros: 7_500,
    idempotencyKey: 'b-roll-remotion-m11',
  })
  assert.equal(replay.replayed, true)
  assert.equal(replay.receipt.resultHash, result.receipt.resultHash)

  const acceptanceCore = {
    schemaVersion: 'b_roll_end_to_end_acceptance_v1' as const,
    manifestRef,
    qualificationReceiptHash: qualificationReceipt.receiptHash,
    componentHash: persisted.component.componentHash,
    workGraphHash: workGraph.workGraphHash,
    requestPackageHash: requestPackage.requestPackageHash,
    initialAttemptHash: initialAttempt.attemptEvidenceHash,
    refinementAttemptHash: refinement.attemptEvidence.attemptEvidenceHash,
    finalCandidateVersionHash: version2.version.candidateVersionHash,
    finalQaReportHash: version2.qaReport.qaReportHash,
    resultHash: result.receipt.resultHash,
    integrationQaHash: result.integrationQa.integrationQaHash,
    actualProviderRequests: 0 as const,
    selectedCandidateAutomatically: false as const,
    outsideAuthorizedRangeModified: false as const,
    privateInternalOnly: true as const,
    productionQualified: false as const,
  }
  const acceptance = {
    ...acceptanceCore,
    acceptanceHash: hashSkillValue(acceptanceCore),
  }
  const acceptanceRef = await putPrivateAuthorityJsonBlob({
    localStorageRoot: root,
    value: acceptance,
  })
  assert.deepEqual(await readPrivateAuthorityJsonBlob({
    localStorageRoot: root,
    ref: acceptanceRef,
  }), acceptance)

  console.log(JSON.stringify({
    smoke: 'b-roll-end-to-end',
    qualificationStatus: qualificationReceipt.qualificationStatus,
    qualificationReceiptHash: qualificationReceipt.receiptHash,
    qualifiedFixtureCount: qualificationReceipt.fixtureResults.length,
    productionFixtureCountExcluded: BROLL_PRODUCTION_QUALIFICATION_FIXTURE_KEYS.length,
    manifestHash: BROLL_CAPABILITY_MANIFEST.manifestHash,
    canonicalComponentHash: persisted.component.componentHash,
    exactComponentRefPropagated: true,
    providerRoute: requestPackage.providerRouteId,
    initialVerdict: version1.version.verdict,
    finalVerdict: version2.version.verdict,
    candidateVersions: 2,
    resultHash: result.receipt.resultHash,
    preview: {
      width: result.receipt.preview.width,
      height: result.receipt.preview.height,
      fps: result.receipt.preview.frameRate,
      frames: result.receipt.preview.frameCount,
      privateInternalOnly: result.receipt.preview.privateInternalOnly,
    },
    integrationQaChecksPassed: Object.keys(result.integrationQa.checks).length,
    finalOwners: result.receipt.handoffs,
    totalInternalCostMicros: result.receipt.costEvidence.totalInternalCostMicros,
    actualProviderRequests: 0,
    outsideAuthorizedRangeModified: false,
    replayed: replay.replayed,
    productionQualified: false,
    acceptanceHash: acceptance.acceptanceHash,
  }, null, 2))
} finally {
  await rm(root, { recursive: true, force: true })
}

function observation(input: {
  candidateSha256: string
  assignmentHash: string
  planHash: string
  conceptKey: string
  authorizedRangeHash: string
  cameraIntent: boolean
  label: string
}) {
  return createBrollSemanticVisualObservation({
    schemaVersion: 'b_roll_semantic_visual_observation_v1',
    candidateSha256: input.candidateSha256,
    assignmentHash: input.assignmentHash,
    planHash: input.planHash,
    conceptKey: input.conceptKey,
    authorizedRangeHash: input.authorizedRangeHash,
    observationSource: 'internal_injected_visual_observation_v1',
    evidenceArtifactHash: hashSkillValue({ evidence: input.label }),
    confidenceMillionths: 950_000,
    checks: {
      semanticAlignment: true,
      generatedVisualIntegrity: true,
      subjectObjectConsistency: true,
      plausibleMotion: true,
      cameraIntent: input.cameraIntent,
      cropSafety: true,
      noProofMisrepresentation: true,
      contentSafety: true,
    },
    needsUserConfirmation: false,
    generatedMediaTreatedAsVerifiedProof: false,
    automaticSelectionAllowed: false,
    productionQualified: false,
  })
}

function sha256Bytes(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function sha256Text(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}
