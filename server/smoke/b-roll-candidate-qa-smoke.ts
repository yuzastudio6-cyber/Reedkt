import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  BROLL_CAPABILITY_MANIFEST,
  compileBrollCanonicalWorkGraph,
  compileBrollPlan,
  createBrollAssignment,
  createBrollPlanningContext,
  createInitialInjectedBrollCandidateAttemptEvidence,
  executeBrollCandidateQa,
  executePrivateInjectedBrollCandidateRefinement,
  projectBrollCanonicalWorkItems,
} from '../edit-skills/b-roll'
import {
  brollSemanticVisualObservationSchema,
  createBrollSemanticVisualObservation,
  directBrollCandidateQa,
} from '../edit-skills/b-roll/mini-skills/candidate-qa-director'
import { directBrollCandidateRefinement } from '../edit-skills/b-roll/mini-skills/refinement-director'
import {
  hashSkillValue,
  skillManifestReference,
} from '../edit-skills/core/skill-capability-manifest-hash'
import { createBrollPlanningQualificationReceipt } from '../edit-skills/b-roll/b-roll-qualification'
import { editSkillEstimatorRegistry, editSkillQaRegistry } from '../edit-skills/registry'
import { persistCanonicalBrollPlanComponent } from '../services/canonical-broll-plan-component-service'
import {
  BROLL_PROVIDER_ROUTE_ID,
  brollProviderExecutionPackageV5Schema,
  buildBrollGeminiOfficialRefinementRequest,
  buildBrollProviderRequestPackageV5,
  createBrollProviderWorkAuthorizationV5,
  executePrivateInjectedBrollProviderLifecycleV5,
} from '../providers/google/gemini-omni-broll'
import { activatePrivateOfflineMediaBinaryRuntime } from '../tool-execution/media-binary-execution'

const root = await mkdtemp(join(tmpdir(), 'reeditpro-broll-m8-'))
try {
  const fixturePath = join(root, 'moving-720p.mp4')
  const generated = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error',
    '-f', 'lavfi', '-i',
    'color=c=red:s=1280x720:r=24:d=3,format=yuv420p,hue=H=6.2831853*t:s=1',
    '-an', '-c:v', 'libx264', '-preset', 'ultrafast',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-threads', '1',
    '-frames:v', '72', '-y', fixturePath,
  ], { encoding: 'utf8' })
  assert.equal(generated.status, 0, generated.stderr)
  const candidateBytes = await readFile(fixturePath)

  const manifestRef = skillManifestReference(BROLL_CAPABILITY_MANIFEST)
  const masterRange = { startFrameInclusive: 0, endFrameExclusive: 2_400, fps: 24 }
  const authorizedRange = { startFrameInclusive: 120, endFrameExclusive: 192, fps: 24 }
  const assignment = createBrollAssignment({
    schemaVersion: 'b_roll_assignment_v1',
    assignmentId: 'assignment-m8',
    orchestrationRunId: 'orchestration-m8',
    ownerUserId: 'user',
    workspaceId: 'workspace',
    projectId: 'project',
    editSessionId: 'session',
    editPlanVersion: 1,
    masterTimingHash: hashSkillValue(masterRange),
    masterTimingRange: masterRange,
    segmentIds: ['segment-1'],
    sourceSequenceIds: [],
    readContextAuthority: {
      wholeVideoReadOnly: true,
      adjacentScenesReadOnly: true,
      contextArtifactRefs: [],
    },
    writeRangeAuthority: { authorizedRange, outsideAuthorizedRangeModified: false },
    reason: 'Show one safe illustrative product-context cutaway.',
    pointToProveClarifyCoverOrSupport: 'Clarify the workflow without inventing proof.',
    expectedViewerBenefit: 'Understand the workflow through one simple visual action.',
    requestedVisualOwnership: 'primary',
    forbiddenInterpretations: ['Do not fabricate customer proof.'],
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
    ownerUserId: 'user',
    workspaceId: 'workspace',
    projectId: 'project',
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
    referenceDnaDoNotCopyRules: ['Do not copy exact reference-video shots.'],
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
    qualificationReceipt: createBrollPlanningQualificationReceipt(BROLL_CAPABILITY_MANIFEST),
  })
  const componentRef = persisted.componentRefs.bRollSkill
  const requestPackage = buildBrollProviderRequestPackageV5({
    assignment,
    context,
    plan: compiled.plan,
  })
  const executionPackage = brollProviderExecutionPackageV5Schema.parse({
    packageRecordId: 'package-m8',
    packageHash: hashSkillValue({ package: 'm8' }),
    workspaceId: assignment.workspaceId,
    projectId: assignment.projectId,
    editSessionId: assignment.editSessionId,
    approvedPlanSnapshotId: 'snapshot-m8',
    snapshotHash: hashSkillValue({ snapshot: 'm8' }),
    reservationId: 'reservation-m8',
    reservationStatus: 'reserved',
    workGraphHash: workGraph.workGraphHash,
    componentRefs: { bRollSkill: componentRef },
    approvedMaximumCredits: 100,
    remainingReservedCredits: 100,
    approvedProviderRoutes: [BROLL_PROVIDER_ROUTE_ID],
    approvedWorkItems: [{ id: 'provider-work-m8', ...providerWorkItem }],
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
      snapshotId: 'rate-m8',
      snapshotDigest: hashSkillValue({ rate: 'm8' }),
      evidenceClass: 'injected_test_rate_unqualified',
      currency: 'USD',
      costMicrosPerGeneratedSecond: 100_000,
      effectiveAt: '2026-08-03T17:00:00.000Z',
      expiresAt: '2026-08-03T18:00:00.000Z',
      serviceFeeIncluded: false,
      productionQualified: false,
    },
    maximumAuthorizedProviderCostMicros: 1_000_000,
    maximumAuthorizedInfrastructureCostMicros: 100_000,
    idempotencyKey: 'b-roll-provider-m8-initial',
    authorizedAt: '2026-08-03T17:00:00.000Z',
    expiresAt: '2026-08-03T17:10:00.000Z',
  })
  const lifecycle = await executePrivateInjectedBrollProviderLifecycleV5({
    localStorageRoot: root,
    authorization,
    requestPackage,
    workerIdentity: 'provider-worker-m8',
    dispatchSecret: 'm8-internal-dispatch-secret-not-a-provider-secret',
    leaseDurationMs: 120_000,
    times: {
      claimedAt: '2026-08-03T17:01:00.000Z',
      issuedAt: '2026-08-03T17:01:01.000Z',
      consumedAt: '2026-08-03T17:01:02.000Z',
      completedAt: '2026-08-03T17:01:03.000Z',
    },
    outcome: {
      state: 'succeeded',
      outputId: 'candidate-m8-v1',
      bytes: candidateBytes,
      infrastructureCostMicros: 10_000,
      rawInfrastructureUsageEvidenceDigest: hashSkillValue({ usage: 'm8-success' }),
    },
  })
  assert.ok(lifecycle.consumerReceipt)
  const previousInteractionId = 'interaction-m8-approved-conversation'
  const interactionIdDigest = shaText(previousInteractionId)
  const initialAttempt = createInitialInjectedBrollCandidateAttemptEvidence({
    state: lifecycle.state,
    consumerReceipt: lifecycle.consumerReceipt,
    requestPackage,
    injectedInteractionIdDigest: interactionIdDigest,
  })
  const rangeHash = hashSkillValue(authorizedRange)
  const observationV1 = observation({
    candidateSha256: initialAttempt.output.sha256,
    assignmentHash: assignment.assignmentHash,
    planHash: compiled.plan.planHash,
    conceptKey: compiled.plan.shotSpecification!.conceptKey,
    authorizedRangeHash: rangeHash,
    cameraIntent: false,
    evidenceLabel: 'm8-v1-camera-drift',
  })
  const runtime = await activatePrivateOfflineMediaBinaryRuntime()
  const version1 = await executeBrollCandidateQa({
    localStorageRoot: root,
    assignment,
    context,
    plan: compiled.plan,
    requestPackage,
    attemptEvidence: initialAttempt,
    candidateBytes,
    semanticObservation: observationV1,
    mediaRuntime: runtime,
    now: () => '2026-08-03T17:02:00.000Z',
  })
  assert.equal(version1.version.versionNumber, 1)
  assert.equal(version1.version.verdict, 'needs_refinement')
  assert.equal(version1.qaReport.decision.refinementAllowed, true)
  assert.equal(version1.version.automaticSelectionAllowed, false)
  assert.equal(version1.version.normalizedCandidate.audioRemoved, true)
  assert.equal(version1.qaReport.checks.validMp4, true)
  assert.equal(version1.qaReport.checks.decodableStreams, true)
  assert.equal(version1.qaReport.checks.notFrozenOrBlack, true)

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
    previousInteractionIdDigest: interactionIdDigest,
    existingCandidateVersionCount: 1,
    existingRefinementCount: 0,
    maximumAuthorizedProviderCostMicros: 500_000,
    maximumAuthorizedInfrastructureCostMicros: 50_000,
    issuedAt: '2026-08-03T17:02:01.000Z',
    expiresAt: '2026-08-03T17:07:01.000Z',
  })
  const officialRefinement = buildBrollGeminiOfficialRefinementRequest({
    authority: refinementAuthority,
    previousInteractionId,
  })
  assert.equal(officialRefinement.body.previous_interaction_id, previousInteractionId)
  assert.equal(officialRefinement.body.model, 'gemini-omni-flash-preview')
  assert.equal(officialRefinement.automaticRetryAllowed, false)
  assert.throws(() => buildBrollGeminiOfficialRefinementRequest({
    authority: refinementAuthority,
    previousInteractionId: 'substituted-interaction',
  }))

  const refinement = await executePrivateInjectedBrollCandidateRefinement({
    localStorageRoot: root,
    authority: refinementAuthority,
    outputId: 'candidate-m8-v2',
    bytes: candidateBytes,
    providerCostMicros: 300_000,
    infrastructureCostMicros: 12_000,
    now: () => '2026-08-03T17:03:00.000Z',
  })
  assert.equal(refinement.disposition, 'executed')
  assert.equal(refinement.attemptEvidence.candidateVersionNumber, 2)
  assert.notEqual(refinement.attemptEvidence.attemptId, initialAttempt.attemptId)
  assert.equal(refinement.attemptEvidence.cost.totalInternalCostMicros, 312_000)
  await assert.rejects(executePrivateInjectedBrollCandidateRefinement({
    localStorageRoot: root,
    authority: refinementAuthority,
    outputId: 'candidate-m8-over-budget',
    bytes: candidateBytes,
    providerCostMicros: 500_001,
    infrastructureCostMicros: 0,
  }), /output or cost is invalid/u)
  const observationV2 = observation({
    candidateSha256: refinement.attemptEvidence.output.sha256,
    assignmentHash: assignment.assignmentHash,
    planHash: compiled.plan.planHash,
    conceptKey: compiled.plan.shotSpecification!.conceptKey,
    authorizedRangeHash: rangeHash,
    cameraIntent: true,
    evidenceLabel: 'm8-v2-corrected',
  })
  const version2 = await executeBrollCandidateQa({
    localStorageRoot: root,
    assignment,
    context,
    plan: compiled.plan,
    requestPackage,
    attemptEvidence: refinement.attemptEvidence,
    candidateBytes,
    semanticObservation: observationV2,
    refinementAuthority,
    mediaRuntime: runtime,
    now: () => '2026-08-03T17:03:30.000Z',
  })
  assert.equal(version2.version.versionNumber, 2)
  assert.equal(version2.version.verdict, 'accepted_after_normalization')
  assert.equal(version2.version.priorCandidateVersionHash, version1.version.candidateVersionHash)
  assert.equal(version2.version.automaticSelectionAllowed, false)
  assert.equal(version2.qaReport.generatedMediaTreatedAsVerifiedProof, false)
  assert.equal(version2.qaReport.generatedAudioFinalMixAllowed, false)
  const replay = await executeBrollCandidateQa({
    localStorageRoot: root,
    assignment,
    context,
    plan: compiled.plan,
    requestPackage,
    attemptEvidence: refinement.attemptEvidence,
    candidateBytes,
    semanticObservation: observationV2,
    refinementAuthority,
    mediaRuntime: runtime,
    now: () => '2026-08-03T17:04:00.000Z',
  })
  assert.equal(replay.replayed, true)
  assert.equal(replay.version.candidateVersionHash, version2.version.candidateVersionHash)

  assert.throws(() => directBrollCandidateRefinement({
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
      refinementAllowed: true,
      refinementReasonCodes: version1.qaReport.decision.refinementReasonCodes,
    },
    previousInteractionIdDigest: interactionIdDigest,
    existingCandidateVersionCount: 2,
    existingRefinementCount: 1,
    maximumAuthorizedProviderCostMicros: 500_000,
    maximumAuthorizedInfrastructureCostMicros: 50_000,
    issuedAt: '2026-08-03T17:04:01.000Z',
    expiresAt: '2026-08-03T17:05:01.000Z',
  }), /refinement ceiling/u)

  const failedTechnical = directBrollCandidateQa({
    versionNumber: 2,
    maximumRefinements: 1,
    refinementCount: 1,
    technical: {
      validMp4Container: true,
      decodableStreams: true,
      durationMatches: true,
      frameRateMatches: true,
      resolutionMatches: true,
      notTruncated: true,
      notFrozenOrBlack: false,
      privateArtifactIntegrity: true,
      normalizationApplied: true,
      technicalInfrastructureAvailable: true,
    },
    semantic: observationV2,
    audioDisposition: 'extract_for_sound_skill_review',
    generatedAudioFinalMixAllowed: false,
    fallbackExistingSourceAvailable: false,
  })
  assert.equal(failedTechnical.verdict, 'use_no_broll')
  assert.equal(failedTechnical.soundHandoffRequired, true)
  const failedWithSource = directBrollCandidateQa({
    versionNumber: 2,
    maximumRefinements: 1,
    refinementCount: 1,
    technical: {
      validMp4Container: true,
      decodableStreams: true,
      durationMatches: true,
      frameRateMatches: true,
      resolutionMatches: true,
      notTruncated: true,
      notFrozenOrBlack: false,
      privateArtifactIntegrity: true,
      normalizationApplied: true,
      technicalInfrastructureAvailable: true,
    },
    semantic: observationV2,
    audioDisposition: 'discard',
    generatedAudioFinalMixAllowed: false,
    fallbackExistingSourceAvailable: true,
  })
  assert.equal(failedWithSource.verdict, 'fallback_to_existing_source')

  assert.throws(() => brollSemanticVisualObservationSchema.parse({
    ...observationV2,
    checks: { ...observationV2.checks, noProofMisrepresentation: false },
  }), /observation hash/u)
  await assert.rejects(executeBrollCandidateQa({
    localStorageRoot: root,
    assignment,
    context,
    plan: {
      ...compiled.plan,
      shotSpecification: {
        ...compiled.plan.shotSpecification!,
        conceptKey: 'substituted-concept',
      },
    },
    requestPackage,
    attemptEvidence: refinement.attemptEvidence,
    candidateBytes,
    semanticObservation: observationV2,
    refinementAuthority,
    mediaRuntime: runtime,
  }))

  console.log(JSON.stringify({
    smoke: 'b-roll-candidate-qa',
    version1Verdict: version1.version.verdict,
    version2Verdict: version2.version.verdict,
    maximumCandidateVersions: 2,
    maximumRefinements: 1,
    refinementOfficialPreviousInteractionBound: true,
    technicalQaRunner: 'pinned_ffmpeg_8_1_2_network_none',
    semanticQaQualification: 'internal_injected_only',
    fallbackToExistingSourceProved: true,
    fallbackToNoBrollProved: true,
    automaticSelectionAllowed: false,
    generatedAudioFinalMixAllowed: false,
    actualProviderRequests: 0,
    normalizedCandidateSha256: version2.version.normalizedCandidate.sha256,
    finalQaReportHash: version2.qaReport.qaReportHash,
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
  evidenceLabel: string
}) {
  return createBrollSemanticVisualObservation({
    schemaVersion: 'b_roll_semantic_visual_observation_v1',
    candidateSha256: input.candidateSha256,
    assignmentHash: input.assignmentHash,
    planHash: input.planHash,
    conceptKey: input.conceptKey,
    authorizedRangeHash: input.authorizedRangeHash,
    observationSource: 'internal_injected_visual_observation_v1',
    evidenceArtifactHash: hashSkillValue({ evidence: input.evidenceLabel }),
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

function shaText(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}
