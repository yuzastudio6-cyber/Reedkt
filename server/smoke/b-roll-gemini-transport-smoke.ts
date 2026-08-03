import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, rm } from 'node:fs/promises'
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
import { hashSkillValue, skillManifestReference } from '../edit-skills/core/skill-capability-manifest-hash'
import { createBrollPlanningQualificationReceipt } from '../edit-skills/b-roll/b-roll-qualification'
import { editSkillEstimatorRegistry, editSkillQaRegistry } from '../edit-skills/registry'
import { persistCanonicalBrollPlanComponent } from '../services/canonical-broll-plan-component-service'
import { readPrivateFileIfExistsWithinRoot } from '../security/private-local-persistence'
import {
  BROLL_GEMINI_INTERACTIONS_ENDPOINT,
  BROLL_PROVIDER_CONFIGURED_MODEL_ALIAS,
  BROLL_PROVIDER_ROUTE_ID,
  brollProviderExecutionPackageV5Schema,
  buildBrollGeminiOfficialInteractionRequest,
  buildBrollProviderRequestPackageV5,
  createBrollGeminiSecretResolver,
  createBrollProviderWorkAuthorizationV5,
  executeBrollGeminiRestTransport,
  fileIdFromProviderUri,
  parseBrollGeminiFileStatus,
  parseBrollGeminiInteractionResponse,
  reconcileBrollGeminiUnknownTransport,
} from '../providers/google/gemini-omni-broll'

const mp4Bytes = Buffer.from('000000186674797069736f6d0000020069736f6d69736f32', 'hex')
const localStorageRoot = await mkdtemp(join(tmpdir(), 'reeditpro-broll-m7-'))
try {
  const manifestRef = skillManifestReference(BROLL_CAPABILITY_MANIFEST)
  const masterRange = { startFrameInclusive: 0, endFrameExclusive: 2_400, fps: 24 }
  const authorizedRange = { startFrameInclusive: 120, endFrameExclusive: 192, fps: 24 }
  const assignment = createBrollAssignment({
    schemaVersion: 'b_roll_assignment_v1',
    assignmentId: 'assignment-m7',
    orchestrationRunId: 'orchestration-m7',
    ownerUserId: 'user',
    workspaceId: 'workspace',
    projectId: 'project',
    editSessionId: 'session',
    editPlanVersion: 1,
    masterTimingHash: hashSkillValue(masterRange),
    masterTimingRange: masterRange,
    segmentIds: ['segment-1'],
    sourceSequenceIds: [],
    readContextAuthority: { wholeVideoReadOnly: true, adjacentScenesReadOnly: true, contextArtifactRefs: [] },
    writeRangeAuthority: { authorizedRange, outsideAuthorizedRangeModified: false },
    reason: 'Generate one safe illustrative workflow cutaway.',
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
    referenceDnaDoNotCopyRules: ['Do not copy exact reference shots.'],
  })
  const compiled = compileBrollPlan({
    assignment,
    context,
    manifest: BROLL_CAPABILITY_MANIFEST,
    estimators: editSkillEstimatorRegistry,
    qa: editSkillQaRegistry,
  })
  const workGraph = compileBrollCanonicalWorkGraph({ assignment, plan: compiled.plan })
  const canonicalWorkItems = projectBrollCanonicalWorkItems({ assignment, workGraph })
  const providerWorkItem = canonicalWorkItems.find((item) => item.approvedProviderRoute === BROLL_PROVIDER_ROUTE_ID)
  assert.ok(providerWorkItem)
  const persisted = await persistCanonicalBrollPlanComponent({
    localStorageRoot,
    assignment,
    context,
    plan: compiled.plan,
    planningQaReport: compiled.planningQaReport,
    workGraph,
    qualificationReceipt: createBrollPlanningQualificationReceipt(BROLL_CAPABILITY_MANIFEST),
  })
  const componentRef = persisted.componentRefs.bRollSkill
  const requestPackage = buildBrollProviderRequestPackageV5({ assignment, context, plan: compiled.plan })
  const officialRequest = buildBrollGeminiOfficialInteractionRequest({ requestPackage })
  assert.equal(officialRequest.endpoint, BROLL_GEMINI_INTERACTIONS_ENDPOINT)
  assert.equal(officialRequest.safeToPersistRawBody, false)
  assert.deepEqual(officialRequest.body.response_format, { type: 'video', aspect_ratio: '16:9' })
  assert.deepEqual(officialRequest.body.generation_config, { video_config: { task: 'text_to_video' } })
  assert.equal('temperature' in officialRequest.body, false)
  assert.equal('top_p' in officialRequest.body, false)
  assert.equal('negative_prompt' in officialRequest.body, false)

  const referenceImageBytes = Buffer.from('approved-reference-image-fixture', 'utf8')
  const referenceImageRef = {
    artifactType: 'approved_user_asset_v1',
    sha256: createHash('sha256').update(referenceImageBytes).digest('hex'),
    byteLength: referenceImageBytes.byteLength,
    ownerUserId: assignment.ownerUserId,
    workspaceId: assignment.workspaceId,
    projectId: assignment.projectId,
  }
  const referenceContextInput: Partial<typeof context> = { ...context }
  delete referenceContextInput.contextHash
  const referenceContext = createBrollPlanningContext({
    ...referenceContextInput as Omit<typeof context, 'contextHash'>,
    sourceCandidates: [{
      sourceId: 'approved-reference-image',
      sourceType: 'reference_image',
      artifactRef: referenceImageRef,
      semanticRelevance: 0.98,
      visualQuality: 0.95,
      temporalFit: 0.95,
      storyContinuity: 0.95,
      provenanceVerified: true,
      rightsApproved: true,
      privacyApproved: true,
      proofSafe: true,
      repetitionRisk: 0,
      cropFeasibility: 0.95,
      speakerActionProtection: 0.95,
      audioUsefulness: 0,
      costCredits: 1,
      approvedByUser: true,
    }],
  })
  const referenceCompiled = compileBrollPlan({
    assignment,
    context: referenceContext,
    manifest: BROLL_CAPABILITY_MANIFEST,
    estimators: editSkillEstimatorRegistry,
    qa: editSkillQaRegistry,
  })
  assert.equal(referenceCompiled.plan.decision, 'generate_with_gemini_omni')
  assert.equal(referenceCompiled.plan.sourceCandidateId, 'approved-reference-image')
  const referenceRequestPackage = buildBrollProviderRequestPackageV5({
    assignment,
    context: referenceContext,
    plan: referenceCompiled.plan,
  })
  assert.equal(referenceRequestPackage.taskMode, 'image_to_video')
  const imageRequest = buildBrollGeminiOfficialInteractionRequest({
    requestPackage: referenceRequestPackage,
    sourceMedia: { artifactRef: referenceImageRef, mimeType: 'image/png', bytes: referenceImageBytes },
  })
  assert.equal(Array.isArray(imageRequest.body.input), true)
  assert.throws(() => buildBrollGeminiOfficialInteractionRequest({
    requestPackage: referenceRequestPackage,
    sourceMedia: {
      artifactRef: referenceImageRef,
      mimeType: 'image/png',
      bytes: Buffer.from('substituted-reference-image', 'utf8'),
    },
  }), /does not match request lineage/u)

  const executionPackage = brollProviderExecutionPackageV5Schema.parse({
    packageRecordId: 'package-m7',
    packageHash: hashSkillValue({ package: 'm7' }),
    workspaceId: assignment.workspaceId,
    projectId: assignment.projectId,
    editSessionId: assignment.editSessionId,
    approvedPlanSnapshotId: 'snapshot-m7',
    snapshotHash: hashSkillValue({ snapshot: 'm7' }),
    reservationId: 'reservation-m7',
    reservationStatus: 'reserved',
    workGraphHash: workGraph.workGraphHash,
    componentRefs: { bRollSkill: componentRef },
    approvedMaximumCredits: 100,
    remainingReservedCredits: 100,
    approvedProviderRoutes: [BROLL_PROVIDER_ROUTE_ID],
    approvedWorkItems: [{ id: 'provider-work-m7', ...providerWorkItem }],
    status: 'canonical_authority_packaged_runtime_blocked',
  })
  const rateAuthority = {
    schemaVersion: 'b_roll_provider_rate_authority_v1' as const,
    snapshotId: 'canary-rate-m7',
    snapshotDigest: hashSkillValue({ rate: 'canary-m7' }),
    evidenceClass: 'owner_confirmed_canary_ceiling_unqualified' as const,
    currency: 'USD' as const,
    costMicrosPerGeneratedSecond: 100_000,
    effectiveAt: '2026-08-03T17:00:00.000Z',
    expiresAt: '2026-08-03T18:00:00.000Z',
    serviceFeeIncluded: false as const,
    productionQualified: false as const,
  }
  const authorizationInput = {
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
    authorizedAt: '2026-08-03T17:00:00.000Z',
    expiresAt: '2026-08-03T17:10:00.000Z',
    authorityClass: 'private_owner_confirmed_canary' as const,
  }
  const authorization = createBrollProviderWorkAuthorizationV5({
    ...authorizationInput,
    idempotencyKey: 'b-roll-provider-m7-live-fixture',
  })
  const fakeApiKey = 'fake-gemini-key-for-transport-tests'
  let secretReads = 0
  const secretResolver = createBrollGeminiSecretResolver({
    pinnedSecretVersionReference: 'projects/reeditpro/secrets/reeditpro-prod-gemini-api-key/versions/1',
    loader: {
      async accessSecretVersion({ name }) {
        secretReads += 1
        assert.equal(name, 'projects/reeditpro/secrets/reeditpro-prod-gemini-api-key/versions/1')
        return fakeApiKey
      },
    },
  })
  const requests: Array<{ url: string; init?: RequestInit }> = []
  const fetchImplementation = (async (url: string | URL | Request, init?: RequestInit) => {
    requests.push({ url: String(url), init })
    assert.equal(new Headers(init?.headers).get('x-goog-api-key'), fakeApiKey)
    assert.equal(init?.redirect, 'manual')
    return jsonResponse({
      id: 'v1_m7_inline',
      status: 'completed',
      model: BROLL_PROVIDER_CONFIGURED_MODEL_ALIAS,
      object: 'interaction',
      usage_metadata: { generated_video_seconds: 3 },
      steps: [{
        type: 'model_output',
        content: [{ type: 'video', mime_type: 'video/mp4', data: mp4Bytes.toString('base64') }],
      }],
    })
  }) as typeof fetch
  const executed = await executeBrollGeminiRestTransport({
    localStorageRoot,
    authorization,
    requestPackage,
    secretResolver,
    fetchImplementation,
    externalNetworkEnabled: true,
    explicitExecutionConfirmed: true,
    approvedSafeFixture: true,
    privateOutputDestinationConfirmed: true,
    publicArtifactAllowed: false,
    timelineMutationAllowed: false,
    automaticRetryAllowed: false,
    fallbackProviderAllowed: false,
    now: () => '2026-08-03T17:05:00.000Z',
    pollWait: async () => undefined,
  })
  assert.equal(executed.disposition, 'executed')
  assert.equal(executed.state.status, 'completed')
  assert.equal(executed.state.requestCounts.generationSubmissions, 1)
  assert.equal(executed.state.requestCounts.totalHttpRequests, 1)
  assert.equal(executed.state.requestCounts.automaticRetries, 0)
  assert.equal(executed.state.requestCounts.redirects, 0)
  assert.equal(executed.state.providerCost.accountedProviderCostMicros, 300_000)
  assert.equal(executed.state.providerCost.serviceFeeIncluded, false)
  assert.equal(executed.state.output?.providerGenerated, true)
  assert.equal(executed.state.output?.timelineMutationAllowed, false)
  assert.equal(secretReads, 1)
  assert.equal(requests.length, 1)
  const outputReadback = await readPrivateFileIfExistsWithinRoot({
    rootPath: localStorageRoot,
    relativePath: executed.state.output!.privateObjectRelativePath,
  })
  assert.deepEqual(outputReadback, mp4Bytes)
  const persistedJson = JSON.stringify(executed.state)
  assert.equal(persistedJson.includes(fakeApiKey), false)
  assert.equal(persistedJson.includes('generativelanguage.googleapis.com'), false)
  assert.equal(persistedJson.includes(JSON.stringify(officialRequest.body)), false)

  const uploadedSourceRef = {
    artifactType: 'source_media_artifact_v1',
    sha256: createHash('sha256').update(mp4Bytes).digest('hex'),
    byteLength: mp4Bytes.byteLength,
    ownerUserId: assignment.ownerUserId,
    workspaceId: assignment.workspaceId,
    projectId: assignment.projectId,
  }
  const editAssignmentInput: Partial<typeof assignment> = { ...assignment }
  delete editAssignmentInput.assignmentHash
  const editAssignment = createBrollAssignment({
    ...editAssignmentInput as Omit<typeof assignment, 'assignmentHash'>,
    assignmentId: 'assignment-m7-edit',
    orchestrationRunId: 'orchestration-m7-edit',
    sourceSequenceIds: ['uploaded-source-m7'],
    permittedSourceRoutes: ['edit_uploaded_video_with_gemini_omni', 'use_no_broll'],
  })
  const editContextInput: Partial<typeof context> = { ...context }
  delete editContextInput.contextHash
  const editContext = createBrollPlanningContext({
    ...editContextInput as Omit<typeof context, 'contextHash'>,
    assignmentId: editAssignment.assignmentId,
    sourceCandidates: [{
      sourceId: 'uploaded-source-m7',
      sourceType: 'uploaded_video_for_edit',
      artifactRef: uploadedSourceRef,
      sourceRange: authorizedRange,
      semanticRelevance: 0.99,
      visualQuality: 0.98,
      temporalFit: 0.98,
      storyContinuity: 0.98,
      provenanceVerified: true,
      rightsApproved: true,
      privacyApproved: true,
      proofSafe: true,
      repetitionRisk: 0,
      cropFeasibility: 0.99,
      speakerActionProtection: 0.99,
      audioUsefulness: 0,
      costCredits: 1,
      approvedByUser: true,
    }],
  })
  const editCompiled = compileBrollPlan({
    assignment: editAssignment,
    context: editContext,
    manifest: BROLL_CAPABILITY_MANIFEST,
    estimators: editSkillEstimatorRegistry,
    qa: editSkillQaRegistry,
  })
  assert.equal(editCompiled.plan.decision, 'edit_uploaded_video_with_gemini_omni')
  const editWorkGraph = compileBrollCanonicalWorkGraph({ assignment: editAssignment, plan: editCompiled.plan })
  const editCanonicalWorkItems = projectBrollCanonicalWorkItems({ assignment: editAssignment, workGraph: editWorkGraph })
  const editProviderWorkItem = editCanonicalWorkItems.find((item) =>
    item.approvedProviderRoute === BROLL_PROVIDER_ROUTE_ID)
  assert.ok(editProviderWorkItem)
  const editPersisted = await persistCanonicalBrollPlanComponent({
    localStorageRoot,
    assignment: editAssignment,
    context: editContext,
    plan: editCompiled.plan,
    planningQaReport: editCompiled.planningQaReport,
    workGraph: editWorkGraph,
    qualificationReceipt: createBrollPlanningQualificationReceipt(BROLL_CAPABILITY_MANIFEST),
  })
  const editComponentRef = editPersisted.componentRefs.bRollSkill
  const editRequestPackage = buildBrollProviderRequestPackageV5({
    assignment: editAssignment,
    context: editContext,
    plan: editCompiled.plan,
  })
  assert.equal(editRequestPackage.taskMode, 'edit_uploaded_video')
  const editExecutionPackage = brollProviderExecutionPackageV5Schema.parse({
    ...executionPackage,
    packageRecordId: 'package-m7-edit',
    packageHash: hashSkillValue({ package: 'm7-edit' }),
    approvedPlanSnapshotId: 'snapshot-m7-edit',
    snapshotHash: hashSkillValue({ snapshot: 'm7-edit' }),
    reservationId: 'reservation-m7-edit',
    workGraphHash: editWorkGraph.workGraphHash,
    componentRefs: { bRollSkill: editComponentRef },
    approvedWorkItems: [{ id: 'provider-work-m7-edit', ...editProviderWorkItem }],
  })
  const editAuthorization = createBrollProviderWorkAuthorizationV5({
    ownerUserId: editAssignment.ownerUserId,
    executionPackage: editExecutionPackage,
    component: editPersisted.component,
    componentRef: editComponentRef,
    assignment: editAssignment,
    context: editContext,
    plan: editCompiled.plan,
    workGraph: editWorkGraph,
    requestPackage: editRequestPackage,
    providerRateAuthority: rateAuthority,
    maximumAuthorizedProviderCostMicros: 1_000_000,
    maximumAuthorizedInfrastructureCostMicros: 100_000,
    idempotencyKey: 'b-roll-provider-m7-edit-fixture',
    authorizedAt: '2026-08-03T17:00:00.000Z',
    expiresAt: '2026-08-03T17:10:00.000Z',
    authorityClass: 'private_owner_confirmed_canary',
  })
  const editResolver = createBrollGeminiSecretResolver({
    pinnedSecretVersionReference: 'projects/reeditpro/secrets/reeditpro-prod-gemini-api-key/versions/1',
    loader: { async accessSecretVersion() { return fakeApiKey } },
  })
  let editRequestIndex = 0
  const editFetch = (async (url: string | URL | Request, init?: RequestInit) => {
    editRequestIndex += 1
    assert.equal(new Headers(init?.headers).get('x-goog-api-key'), fakeApiKey)
    if (editRequestIndex === 1) {
      assert.equal(String(url), 'https://generativelanguage.googleapis.com/upload/v1beta/files')
      return new Response('', {
        status: 200,
        headers: {
          'x-goog-upload-url': 'https://generativelanguage.googleapis.com/upload/v1beta/files?upload_id=fixture-1',
        },
      })
    }
    if (editRequestIndex === 2) return jsonResponse({ file: {
      name: 'files/uploaded-1',
      state: 'PROCESSING',
      uri: 'https://generativelanguage.googleapis.com/v1beta/files/uploaded-1',
    } })
    if (editRequestIndex === 3) return jsonResponse({
      name: 'files/uploaded-1',
      state: 'ACTIVE',
      uri: 'https://generativelanguage.googleapis.com/v1beta/files/uploaded-1',
    })
    assert.equal(editRequestIndex, 4)
    const body = JSON.parse(Buffer.from(init?.body as ArrayBuffer).toString('utf8')) as Record<string, unknown>
    assert.deepEqual(body.generation_config, { video_config: { task: 'edit' } })
    assert.equal(JSON.stringify(body).includes('uploaded-1'), true)
    return jsonResponse({
      id: 'v1_m7_edit',
      status: 'completed',
      model: BROLL_PROVIDER_CONFIGURED_MODEL_ALIAS,
      steps: [{
        type: 'model_output',
        content: [{ type: 'video', mime_type: 'video/mp4', data: mp4Bytes.toString('base64') }],
      }],
    })
  }) as typeof fetch
  const editExecuted = await executeBrollGeminiRestTransport({
    localStorageRoot,
    authorization: editAuthorization,
    requestPackage: editRequestPackage,
    sourceMedia: { artifactRef: uploadedSourceRef, mimeType: 'video/mp4', bytes: mp4Bytes },
    secretResolver: editResolver,
    fetchImplementation: editFetch,
    externalNetworkEnabled: true,
    explicitExecutionConfirmed: true,
    approvedSafeFixture: true,
    privateOutputDestinationConfirmed: true,
    publicArtifactAllowed: false,
    timelineMutationAllowed: false,
    automaticRetryAllowed: false,
    fallbackProviderAllowed: false,
    now: () => '2026-08-03T17:05:00.000Z',
    pollWait: async () => undefined,
  })
  assert.equal(editExecuted.state.status, 'completed')
  assert.equal(editExecuted.state.requestCounts.uploadNegotiationRequests, 1)
  assert.equal(editExecuted.state.requestCounts.uploadDataRequests, 1)
  assert.equal(editExecuted.state.requestCounts.sourceUploadStatusReads, 1)
  assert.equal(editExecuted.state.requestCounts.generationSubmissions, 1)
  assert.equal(editExecuted.state.requestCounts.totalHttpRequests, 4)
  assert.equal(editRequestIndex, 4)

  const uriAuthorization = createBrollProviderWorkAuthorizationV5({
    ...authorizationInput,
    idempotencyKey: 'b-roll-provider-m7-uri-fixture',
  })
  const uriResolver = createBrollGeminiSecretResolver({
    pinnedSecretVersionReference: 'projects/reeditpro/secrets/reeditpro-prod-gemini-api-key/versions/1',
    loader: { async accessSecretVersion() { return fakeApiKey } },
  })
  let uriRequestIndex = 0
  const uriFetch = (async () => {
    uriRequestIndex += 1
    if (uriRequestIndex === 1) return jsonResponse({
      id: 'v1_m7_uri_transport',
      status: 'completed',
      model: BROLL_PROVIDER_CONFIGURED_MODEL_ALIAS,
      steps: [{ type: 'model_output', content: [{
        type: 'video',
        mime_type: 'video/mp4',
        uri: 'https://generativelanguage.googleapis.com/v1beta/files/generated-2:download?alt=media',
      }] }],
    })
    if (uriRequestIndex === 2) return jsonResponse({
      name: 'files/generated-2',
      state: 'ACTIVE',
      uri: 'https://generativelanguage.googleapis.com/v1beta/files/generated-2',
    })
    assert.equal(uriRequestIndex, 3)
    return new Response(mp4Bytes as unknown as BodyInit, {
      status: 200,
      headers: { 'content-type': 'video/mp4', 'content-length': String(mp4Bytes.byteLength) },
    })
  }) as typeof fetch
  const uriExecuted = await executeBrollGeminiRestTransport({
    localStorageRoot,
    authorization: uriAuthorization,
    requestPackage,
    secretResolver: uriResolver,
    fetchImplementation: uriFetch,
    externalNetworkEnabled: true,
    explicitExecutionConfirmed: true,
    approvedSafeFixture: true,
    privateOutputDestinationConfirmed: true,
    publicArtifactAllowed: false,
    timelineMutationAllowed: false,
    automaticRetryAllowed: false,
    fallbackProviderAllowed: false,
    delivery: 'uri',
    now: () => '2026-08-03T17:05:00.000Z',
    pollWait: async () => undefined,
  })
  assert.equal(uriExecuted.state.status, 'completed')
  assert.equal(uriExecuted.state.requestCounts.resultMetadataReads, 1)
  assert.equal(uriExecuted.state.requestCounts.binaryDownloads, 1)
  assert.equal(uriExecuted.state.requestCounts.totalHttpRequests, 3)
  assert.equal(uriRequestIndex, 3)

  const replay = await executeBrollGeminiRestTransport({
    localStorageRoot,
    authorization,
    requestPackage,
    secretResolver,
    fetchImplementation,
    externalNetworkEnabled: true,
    explicitExecutionConfirmed: true,
    approvedSafeFixture: true,
    privateOutputDestinationConfirmed: true,
    publicArtifactAllowed: false,
    timelineMutationAllowed: false,
    automaticRetryAllowed: false,
    fallbackProviderAllowed: false,
    now: () => '2026-08-03T17:05:30.000Z',
  })
  assert.equal(replay.disposition, 'completed_replay')
  assert.equal(replay.state.stateHash, executed.state.stateHash)
  assert.equal(requests.length, 1)
  assert.equal(secretReads, 1)

  const unknownAuthorization = createBrollProviderWorkAuthorizationV5({
    ...authorizationInput,
    idempotencyKey: 'b-roll-provider-m7-unknown-fixture',
  })
  let unknownRequests = 0
  const unknownResolver = createBrollGeminiSecretResolver({
    pinnedSecretVersionReference: 'projects/reeditpro/secrets/reeditpro-prod-gemini-api-key/versions/1',
    loader: { async accessSecretVersion() { return fakeApiKey } },
  })
  const unknownFetch = (async () => {
    unknownRequests += 1
    throw new Error('simulated transport loss after dispatch')
  }) as typeof fetch
  const unknown = await executeBrollGeminiRestTransport({
    localStorageRoot,
    authorization: unknownAuthorization,
    requestPackage,
    secretResolver: unknownResolver,
    fetchImplementation: unknownFetch,
    externalNetworkEnabled: true,
    explicitExecutionConfirmed: true,
    approvedSafeFixture: true,
    privateOutputDestinationConfirmed: true,
    publicArtifactAllowed: false,
    timelineMutationAllowed: false,
    automaticRetryAllowed: false,
    fallbackProviderAllowed: false,
    now: () => '2026-08-03T17:06:00.000Z',
  })
  assert.equal(unknown.state.status, 'unknown_reconciliation_required')
  assert.equal(unknown.state.requestCounts.generationSubmissions, 1)
  assert.equal(unknown.state.providerCost.failedOrUnknownCostRetained, true)
  const unknownReplay = await executeBrollGeminiRestTransport({
    localStorageRoot,
    authorization: unknownAuthorization,
    requestPackage,
    secretResolver: unknownResolver,
    fetchImplementation: unknownFetch,
    externalNetworkEnabled: true,
    explicitExecutionConfirmed: true,
    approvedSafeFixture: true,
    privateOutputDestinationConfirmed: true,
    publicArtifactAllowed: false,
    timelineMutationAllowed: false,
    automaticRetryAllowed: false,
    fallbackProviderAllowed: false,
    now: () => '2026-08-03T17:06:30.000Z',
  })
  assert.equal(unknownReplay.disposition, 'completed_replay')
  assert.equal(unknownRequests, 1)
  const manual = await reconcileBrollGeminiUnknownTransport({
    localStorageRoot,
    authorization: unknownAuthorization,
    requestPackage,
    secretResolver: unknownResolver,
    fetchImplementation: unknownFetch,
    externalNetworkEnabled: true,
    explicitReconciliationConfirmed: true,
    generationResubmissionAllowed: false,
    automaticRetryAllowed: false,
    fallbackProviderAllowed: false,
  })
  assert.equal(manual.disposition, 'manual_account_reconciliation_required')
  assert.equal(unknownRequests, 1)

  const pendingAuthorization = createBrollProviderWorkAuthorizationV5({
    ...authorizationInput,
    idempotencyKey: 'b-roll-provider-m7-pending-fixture',
  })
  const pendingResolver = createBrollGeminiSecretResolver({
    pinnedSecretVersionReference: 'projects/reeditpro/secrets/reeditpro-prod-gemini-api-key/versions/1',
    loader: { async accessSecretVersion() { return fakeApiKey } },
  })
  let pendingRequests = 0
  const pendingFetch = (async () => {
    pendingRequests += 1
    return jsonResponse({
      id: 'v1_m7_pending',
      status: 'in_progress',
      model: BROLL_PROVIDER_CONFIGURED_MODEL_ALIAS,
      steps: [],
    })
  }) as typeof fetch
  const pending = await executeBrollGeminiRestTransport({
    localStorageRoot,
    authorization: pendingAuthorization,
    requestPackage,
    secretResolver: pendingResolver,
    fetchImplementation: pendingFetch,
    externalNetworkEnabled: true,
    explicitExecutionConfirmed: true,
    approvedSafeFixture: true,
    privateOutputDestinationConfirmed: true,
    publicArtifactAllowed: false,
    timelineMutationAllowed: false,
    automaticRetryAllowed: false,
    fallbackProviderAllowed: false,
    now: () => '2026-08-03T17:07:00.000Z',
    pollWait: async () => undefined,
  })
  assert.equal(pending.state.status, 'unknown_reconciliation_required')
  assert.equal(pending.state.requestCounts.generationSubmissions, 1)
  assert.equal(pending.state.requestCounts.interactionStatusReads, 20)
  assert.equal(pendingRequests, 21)
  const reconciliationResolver = createBrollGeminiSecretResolver({
    pinnedSecretVersionReference: 'projects/reeditpro/secrets/reeditpro-prod-gemini-api-key/versions/1',
    loader: { async accessSecretVersion() { return fakeApiKey } },
  })
  let reconciliationRequests = 0
  const reconciliationFetch = (async () => {
    reconciliationRequests += 1
    return jsonResponse({
      id: 'v1_m7_pending',
      status: 'completed',
      model: BROLL_PROVIDER_CONFIGURED_MODEL_ALIAS,
      steps: [{
        type: 'model_output',
        content: [{ type: 'video', mime_type: 'video/mp4', data: mp4Bytes.toString('base64') }],
      }],
    })
  }) as typeof fetch
  const reconciled = await reconcileBrollGeminiUnknownTransport({
    localStorageRoot,
    authorization: pendingAuthorization,
    requestPackage,
    secretResolver: reconciliationResolver,
    fetchImplementation: reconciliationFetch,
    externalNetworkEnabled: true,
    explicitReconciliationConfirmed: true,
    generationResubmissionAllowed: false,
    automaticRetryAllowed: false,
    fallbackProviderAllowed: false,
    now: () => '2026-08-03T17:08:00.000Z',
    pollWait: async () => undefined,
  })
  assert.equal(reconciled.disposition, 'reconciled')
  assert.equal(reconciled.state.status, 'completed')
  assert.equal(reconciled.state.requestCounts.generationSubmissions, 1)
  assert.equal(reconciled.state.requestCounts.reconciliationStatusReads, 1)
  assert.equal(reconciliationRequests, 1)

  const uriParsed = parseBrollGeminiInteractionResponse({
    httpStatus: 200,
    value: {
      id: 'v1_uri_fixture', status: 'completed', model: BROLL_PROVIDER_CONFIGURED_MODEL_ALIAS,
      steps: [{ type: 'model_output', content: [{
        type: 'video', mime_type: 'video/mp4',
        uri: 'https://generativelanguage.googleapis.com/v1beta/files/generated-1:download?alt=media',
      }] }],
    },
  })
  assert.equal(uriParsed.state, 'completed_uri')
  assert.equal(fileIdFromProviderUri(
    'https://generativelanguage.googleapis.com/v1beta/files/generated-1:download?alt=media',
  ), 'generated-1')
  assert.deepEqual(parseBrollGeminiFileStatus({
    name: 'files/generated-1',
    state: 'ACTIVE',
    uri: 'https://generativelanguage.googleapis.com/v1beta/files/generated-1',
  }).state, 'active')
  const failed = parseBrollGeminiInteractionResponse({
    httpStatus: 429,
    value: { error: { status: 'RESOURCE_EXHAUSTED', message: 'do not persist me' } },
  })
  assert.equal(failed.state, 'failed')
  assert.equal(failed.state === 'failed' && failed.sanitizedFailureCode, 'provider_rate_limited')
  assert.throws(() => fileIdFromProviderUri('https://attacker.invalid/v1beta/files/generated-1'))
  assert.throws(() => createBrollGeminiSecretResolver({
    pinnedSecretVersionReference: 'projects/reeditpro/secrets/wrong-secret/versions/latest',
    loader: { async accessSecretVersion() { return fakeApiKey } },
  }))

  console.log(JSON.stringify({
    status: 'ok',
    officialEndpoint: BROLL_GEMINI_INTERACTIONS_ENDPOINT,
    configuredModelAlias: BROLL_PROVIDER_CONFIGURED_MODEL_ALIAS,
    completedRequestCounts: executed.state.requestCounts,
    providerCostMicros: executed.state.providerCost.accountedProviderCostMicros,
    privateOutputSha256: executed.state.output?.sha256,
    replayDisposition: replay.disposition,
    unknownReplayRequests: unknownRequests,
    reconciledWithoutResubmission: reconciled.state.requestCounts.generationSubmissions === 1,
    secretPayloadReads: secretReads,
    rawProviderStatePersisted: false,
  }, null, 2))
} finally {
  await rm(localStorageRoot, { recursive: true, force: true })
}

function jsonResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}
