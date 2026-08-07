import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  BROLL_CAPABILITY_MANIFEST,
  compileBrollCanonicalWorkGraph,
  compileBrollPlan,
  createBrollAssignment,
  createBrollPlanningContext,
  projectBrollCanonicalWorkItems,
} from '../edit-skills/b-roll'
import {
  canonicalProviderOperationRegistryHash,
  canonicalProviderOperationRegistryV2Hash,
  canonicalProviderOperationRegistryV3Hash,
  canonicalProviderOperationRegistryV4Hash,
} from '../edit-architecture/canonical-provider-work-authority'
import {
  hashSkillValue,
  skillManifestReference,
} from '../edit-skills/core/skill-capability-manifest-hash'
import { loadBrollGeneratedQualificationReceiptForCurrentSource } from '../edit-skills/b-roll/b-roll-qualification-evidence'
import { editSkillEstimatorRegistry, editSkillQaRegistry } from '../edit-skills/internal-fixture-runtime'
import { persistCanonicalBrollPlanComponent } from '../services/canonical-broll-plan-component-service'
import { readPrivateFileIfExistsWithinRoot } from '../security/private-local-persistence'
import {
  BROLL_PROVIDER_CONFIGURED_MODEL_ALIAS,
  BROLL_PROVIDER_OPERATION_ID,
  BROLL_PROVIDER_ROUTE_ID,
  assertBrollProviderWorkAuthorizationV5,
  brollProviderExecutionPackageV5Schema,
  brollProviderOperationRegistryV5Hash,
  brollProviderRequestPackageV5Schema,
  buildBrollProviderRequestPackageV5,
  createBrollProviderLifecyclePolicyV5,
  createBrollProviderOperationRegistryV5,
  createBrollProviderWorkAuthorizationV5,
  projectCanonicalBrollWorkItemForImmutableGeminiOmniV5,
  executePrivateInjectedBrollProviderLifecycleV5,
  readBrollProviderConsumerReceiptV5,
  reconcilePrivateInjectedBrollProviderUnknownV5,
} from '../providers/google/gemini-omni-broll'

const HISTORICAL_REGISTRY_HASHES = {
  v1: '17928478279cc8fd292db235286ae883db2434d79d015e7a16bfadc1a4bde1bd',
  v2: '6fbfdef538e3bc9ecb944892586e7eac154f518bdf1df1d3f15bbe3a9fb32d18',
  v3: '284b456da2610af6280e080bc9cb24c10989f2ee3401bd2711619622544bfd2b',
  v4: '91ea2d40a33f5198f124d6322b61e447bb29ea037dabb808b2f39887cd432eeb',
} as const

assert.deepEqual({
  v1: canonicalProviderOperationRegistryHash(),
  v2: canonicalProviderOperationRegistryV2Hash(),
  v3: canonicalProviderOperationRegistryV3Hash(),
  v4: canonicalProviderOperationRegistryV4Hash(),
}, HISTORICAL_REGISTRY_HASHES)

const localStorageRoot = await mkdtemp(join(tmpdir(), 'reeditpro-broll-m6-'))
try {
  const fixturePath = join(localStorageRoot, 'injected-provider-fixture.mp4')
  const generated = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error',
    '-f', 'lavfi', '-i', 'testsrc2=size=320x180:rate=24:duration=3',
    '-an', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    '-threads', '1', '-y', fixturePath,
  ], { encoding: 'utf8' })
  assert.equal(generated.status, 0, generated.stderr)
  const injectedBytes = await readFile(fixturePath)
  const manifestRef = skillManifestReference(BROLL_CAPABILITY_MANIFEST)
  const masterRange = { startFrameInclusive: 0, endFrameExclusive: 2_400, fps: 24 }
  const authorizedRange = { startFrameInclusive: 120, endFrameExclusive: 192, fps: 24 }
  const assignment = createBrollAssignment({
    schemaVersion: 'b_roll_assignment_v1',
    assignmentId: 'assignment-m6',
    orchestrationRunId: 'orchestration-m6',
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
    reason: 'Show a safe illustrative product-context cutaway.',
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
  assert.equal(compiled.plan.shotSpecification?.durationSeconds, 3)
  const workGraph = compileBrollCanonicalWorkGraph({ assignment, plan: compiled.plan })
  const canonicalWorkItems = projectBrollCanonicalWorkItems({
    assignment,
    plan: compiled.plan,
    workGraph,
  })
  const providerWorkItem = canonicalWorkItems.find((item) =>
    item.approvedProviderRoute === BROLL_PROVIDER_ROUTE_ID)
  assert.ok(providerWorkItem)
  assert.equal(providerWorkItem.expectedOutputs[0]?.artifactType, 'b_roll_candidate_media_manifest_v1')
  assert.equal(providerWorkItem.expectedOutputs[0]?.contentType, 'application/json')
  const persisted = await persistCanonicalBrollPlanComponent({
    localStorageRoot,
    assignment,
    context,
    plan: compiled.plan,
    planningQaReport: compiled.planningQaReport,
    workGraph,
    qualificationReceipt: loadBrollGeneratedQualificationReceiptForCurrentSource(BROLL_CAPABILITY_MANIFEST),
  })
  const componentRef = persisted.componentRefs.bRollSkill
  const requestPackage = buildBrollProviderRequestPackageV5({
    assignment,
    context,
    plan: compiled.plan,
  })
  assert.equal(requestPackage.configuredModelAlias, BROLL_PROVIDER_CONFIGURED_MODEL_ALIAS)
  assert.equal(requestPackage.output.singleContinuousShot, true)
  assert.equal(requestPackage.output.sceneCutsAllowed, false)
  assert.match(requestPackage.prompt, /No scene cuts, montage, or shot changes\./u)

  const executionPackage = brollProviderExecutionPackageV5Schema.parse({
    packageRecordId: 'package-m6',
    packageHash: hashSkillValue({ package: 'm6' }),
    workspaceId: assignment.workspaceId,
    projectId: assignment.projectId,
    editSessionId: assignment.editSessionId,
    approvedPlanSnapshotId: 'snapshot-m6',
    snapshotHash: hashSkillValue({ snapshot: 'm6' }),
    reservationId: 'reservation-m6',
    reservationStatus: 'reserved',
    workGraphHash: workGraph.workGraphHash,
    componentRefs: { bRollSkill: componentRef },
    approvedMaximumCredits: 100,
    remainingReservedCredits: 100,
    approvedProviderRoutes: [BROLL_PROVIDER_ROUTE_ID],
    approvedWorkItems: [{
      id: 'provider-work-m6',
      ...projectCanonicalBrollWorkItemForImmutableGeminiOmniV5(providerWorkItem),
    }],
    status: 'canonical_authority_packaged_runtime_blocked',
  })
  const rateAuthority = {
    schemaVersion: 'b_roll_provider_rate_authority_v1' as const,
    snapshotId: 'rate-m6',
    snapshotDigest: hashSkillValue({ rate: 'm6' }),
    evidenceClass: 'injected_test_rate_unqualified' as const,
    currency: 'USD' as const,
    costMicrosPerGeneratedSecond: 100_000,
    effectiveAt: '2026-08-03T17:00:00.000Z',
    expiresAt: '2026-08-03T18:00:00.000Z',
    serviceFeeIncluded: false as const,
    productionQualified: false as const,
  }
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
    providerRateAuthority: rateAuthority,
    maximumAuthorizedProviderCostMicros: 1_000_000,
    maximumAuthorizedInfrastructureCostMicros: 100_000,
    idempotencyKey: 'b-roll-provider-m6-initial',
    authorizedAt: '2026-08-03T17:00:00.000Z',
    expiresAt: '2026-08-03T17:10:00.000Z',
  })
  const times = {
    claimedAt: '2026-08-03T17:01:00.000Z',
    issuedAt: '2026-08-03T17:01:01.000Z',
    consumedAt: '2026-08-03T17:01:02.000Z',
    completedAt: '2026-08-03T17:01:03.000Z',
  }
  const first = await executePrivateInjectedBrollProviderLifecycleV5({
    localStorageRoot,
    authorization,
    requestPackage,
    workerIdentity: 'provider-worker-m6',
    dispatchSecret: 'm6-internal-dispatch-secret-not-a-provider-secret',
    leaseDurationMs: 120_000,
    times,
    outcome: {
      state: 'succeeded',
      outputId: 'candidate-m6-v1',
      bytes: injectedBytes,
      infrastructureCostMicros: 10_000,
      rawInfrastructureUsageEvidenceDigest: hashSkillValue({ usage: 'm6-success' }),
    },
  })
  assert.equal(first.disposition, 'executed')
  assert.equal(first.state.cost.actualProviderRequestCount, 0)
  assert.equal(first.state.cost.injectedSimulationProviderRequestCount, 0)
  assert.equal(first.state.cost.serviceFeeIncluded, false)
  assert.equal(first.state.dispatchGrant.consumedExactlyOnce, true)
  assert.equal(first.state.output?.providerGenerated, false)
  assert.equal(first.consumerReceipt?.productionEligible, false)
  assert.equal(first.consumerReceipt?.automaticSelectionAllowed, false)
  const outputReadback = await readPrivateFileIfExistsWithinRoot({
    rootPath: localStorageRoot,
    relativePath: first.state.output!.privateObjectRelativePath,
  })
  assert.deepEqual(outputReadback, injectedBytes)
  const receipt = await readBrollProviderConsumerReceiptV5({
    localStorageRoot,
    authorization,
    requestPackage,
  })
  assert.equal(receipt.output.sha256, first.state.output?.sha256)

  const replay = await executePrivateInjectedBrollProviderLifecycleV5({
    localStorageRoot,
    authorization,
    requestPackage,
    workerIdentity: 'provider-worker-m6',
    dispatchSecret: 'm6-internal-dispatch-secret-not-a-provider-secret',
    leaseDurationMs: 120_000,
    times,
    outcome: {
      state: 'failed',
      sanitizedFailureCode: 'must_not_replace_completed_attempt',
      infrastructureCostMicros: 99_999,
      rawInfrastructureUsageEvidenceDigest: hashSkillValue({ usage: 'must-not-run' }),
    },
  })
  assert.equal(replay.disposition, 'completed_replay')
  assert.equal(replay.state.stateHash, first.state.stateHash)
  assert.equal(replay.state.state, 'succeeded')

  const unknownAuthorization = createBrollProviderWorkAuthorizationV5({
    ownerUserId: assignment.ownerUserId,
    executionPackage,
    component: persisted.component,
    componentRef,
    assignment,
    context,
    plan: compiled.plan,
    workGraph,
    requestPackage,
    providerRateAuthority: rateAuthority,
    maximumAuthorizedProviderCostMicros: 1_000_000,
    maximumAuthorizedInfrastructureCostMicros: 100_000,
    idempotencyKey: 'b-roll-provider-m6-unknown',
    authorizedAt: '2026-08-03T17:00:00.000Z',
    expiresAt: '2026-08-03T17:10:00.000Z',
  })
  const unknown = await executePrivateInjectedBrollProviderLifecycleV5({
    localStorageRoot,
    authorization: unknownAuthorization,
    requestPackage,
    workerIdentity: 'provider-worker-m6',
    dispatchSecret: 'm6-internal-dispatch-secret-not-a-provider-secret',
    leaseDurationMs: 120_000,
    times: {
      claimedAt: '2026-08-03T17:02:00.000Z',
      issuedAt: '2026-08-03T17:02:01.000Z',
      consumedAt: '2026-08-03T17:02:02.000Z',
      completedAt: '2026-08-03T17:02:03.000Z',
    },
    outcome: {
      state: 'unknown_reconciliation_required',
      providerOutcomeDigest: hashSkillValue({ providerOutcome: 'unknown' }),
      providerCostMicros: 300_000,
      infrastructureCostMicros: 20_000,
      rawInfrastructureUsageEvidenceDigest: hashSkillValue({ usage: 'm6-unknown' }),
    },
  })
  assert.equal(unknown.state.state, 'unknown_reconciliation_required')
  assert.equal(unknown.state.cost.actualProviderRequestCount, 0)
  assert.equal(unknown.state.cost.injectedSimulationProviderRequestCount, 1)
  assert.equal(unknown.state.cost.failedOrUnknownAttemptCostRetained, true)
  const reconciled = await reconcilePrivateInjectedBrollProviderUnknownV5({
    localStorageRoot,
    authorization: unknownAuthorization,
    requestPackage,
    reconciledAt: '2026-08-03T17:03:00.000Z',
    outcome: { state: 'succeeded', outputId: 'candidate-m6-unknown-v1', bytes: injectedBytes },
  })
  assert.equal(reconciled.state.state, 'reconciled_succeeded')
  assert.equal(reconciled.state.cost.actualProviderRequestCount, 0)
  assert.equal(reconciled.state.cost.injectedSimulationProviderRequestCount, 1)
  assert.equal(reconciled.consumerReceipt?.productionEligible, false)
  const reconciledReplay = await reconcilePrivateInjectedBrollProviderUnknownV5({
    localStorageRoot,
    authorization: unknownAuthorization,
    requestPackage,
    reconciledAt: '2026-08-03T17:04:00.000Z',
    outcome: { state: 'failed', sanitizedFailureCode: 'must_not_replace_reconciliation' },
  })
  assert.equal(reconciledReplay.state.stateHash, reconciled.state.stateHash)

  assert.throws(() => createBrollProviderWorkAuthorizationV5({
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
      ...rateAuthority,
      snapshotId: 'stale-rate-m6',
      snapshotDigest: hashSkillValue({ rate: 'stale-m6' }),
      expiresAt: '2026-08-03T17:05:00.000Z',
    },
    maximumAuthorizedProviderCostMicros: 1_000_000,
    maximumAuthorizedInfrastructureCostMicros: 100_000,
    idempotencyKey: 'b-roll-provider-m6-stale-rate',
    authorizedAt: '2026-08-03T17:00:00.000Z',
    expiresAt: '2026-08-03T17:10:00.000Z',
  }), /authorization policy is invalid/u)
  assert.throws(() => assertBrollProviderWorkAuthorizationV5({
    value: { ...authorization, providerRouteId: 'substituted_route' },
    requestPackage,
  }))
  assert.throws(() => assertBrollProviderWorkAuthorizationV5({
    value: { ...authorization, configuredModelAlias: 'substituted-model' },
    requestPackage,
  }))
  const modifiedRequestCore = { ...requestPackage, prompt: `${requestPackage.prompt}\nSubstituted.` }
  delete (modifiedRequestCore as Partial<typeof requestPackage>).requestPackageHash
  const modifiedRequest = brollProviderRequestPackageV5Schema.parse({
    ...modifiedRequestCore,
    requestPackageHash: hashSkillValue(modifiedRequestCore),
  })
  assert.throws(() => assertBrollProviderWorkAuthorizationV5({
    value: authorization,
    requestPackage: modifiedRequest,
  }), /stale or substituted/u)
  for (const forbidden of [
    { rawRequestBody: {} },
    { endpoint: 'https://provider.invalid' },
    { credential: 'raw-secret' },
    { executable: '/bin/sh' },
    { configuredModelAlias: 'caller-model' },
  ]) assert.throws(() => brollProviderRequestPackageV5Schema.parse({
    ...requestPackage,
    ...forbidden,
  }))
  assert.throws(() => createBrollProviderWorkAuthorizationV5({
    ownerUserId: assignment.ownerUserId,
    executionPackage: { ...executionPackage, workspaceId: 'other-workspace' },
    component: persisted.component,
    componentRef,
    assignment,
    context,
    plan: compiled.plan,
    workGraph,
    requestPackage,
    providerRateAuthority: rateAuthority,
    maximumAuthorizedProviderCostMicros: 1_000_000,
    maximumAuthorizedInfrastructureCostMicros: 100_000,
    idempotencyKey: 'b-roll-provider-m6-cross-workspace',
    authorizedAt: '2026-08-03T17:00:00.000Z',
    expiresAt: '2026-08-03T17:10:00.000Z',
  }), /lost exact package or skill lineage/u)

  const registry = createBrollProviderOperationRegistryV5()
  const lifecyclePolicy = createBrollProviderLifecyclePolicyV5()
  assert.equal(registry.length, 1)
  assert.equal(registry[0].operationId, BROLL_PROVIDER_OPERATION_ID)
  assert.equal(registry[0].liveProviderCallAuthorized, false)
  assert.equal(lifecyclePolicy.transportActivated, false)
  assert.equal(lifecyclePolicy.maximumAutomaticRetries, 0)
  assert.equal(lifecyclePolicy.maximumAutomaticProviderFallbacks, 0)
  console.log(JSON.stringify({
    status: 'ok',
    historicalRegistryHashes: HISTORICAL_REGISTRY_HASHES,
    brollRegistryV5Hash: brollProviderOperationRegistryV5Hash(),
    lifecyclePolicyHash: lifecyclePolicy.policyHash,
    injectedActualProviderRequests: first.state.cost.actualProviderRequestCount,
    replayDisposition: replay.disposition,
    reconciledState: reconciled.state.state,
    consumerReceiptHash: receipt.receiptHash,
  }, null, 2))
} finally {
  await rm(localStorageRoot, { recursive: true, force: true })
}
