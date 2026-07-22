import assert from 'node:assert/strict'
import { createHash, createHmac, randomUUID } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import type {
  PreferenceApplicationTargetContextSnapshot,
} from '../../src/types/edit-reference'
import {
  EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_OPERATION_VERSION,
  type EditReferenceProductionExactEditApplyOperation,
} from '../../src/types/edit-reference-production-exact-edit-apply-api'
import {
  EDIT_REFERENCE_APPLICATION_PREPARATION_INTENT_VERSION,
  type EditReferenceApplicationPreparationIntent,
} from '../../src/types/edit-reference-production-application-preparation-api'
import { loadRuntimeEnv } from '../config/env'
import {
  prepareEditReferenceLongFormStudyRun,
} from '../edit-references/edit-reference-long-form-study-binding'
import {
  createEditReferenceLongFormStudyPlan,
  createEditReferenceLongFormStudyRun,
} from '../edit-references/edit-reference-long-form-study-contract'
import {
  editReferenceApplicationPreparationRequestDigest,
  stableEditReferenceApplicationPreparationJson,
} from '../edit-references/edit-reference-production-application-preparation-boundary'
import {
  prepareEditReferenceProductionExactEditApplyFromAuthoritySnapshot,
} from '../edit-references/edit-reference-production-exact-edit-apply-boundary'
import {
  assertEditReferenceLocalSupabaseApplicationPreparationPortIsNotProduction,
  createEditReferenceLocalSupabaseApplicationPreparationPort,
} from '../edit-references/edit-reference-local-supabase-application-preparation-port'
import {
  createEditReferenceLocalSupabaseDomainCapability,
  createEditReferenceLocalSupabaseDomainRepository,
} from '../edit-references/edit-reference-local-supabase-domain-repository'
import {
  createEditReferenceLocalSupabaseDomainHttpRpcClient,
} from '../edit-references/edit-reference-local-supabase-domain-http-rpc-client'
import {
  createEditReferenceCanonicalV3LocalExactEditApplyRuntimePort,
} from '../services/edit-reference-exact-edit-apply-runtime-port'
import {
  createEditReferenceCanonicalV3LocalExactEditBriefRuntimePortFactory,
} from '../services/edit-reference-canonical-v3-local-exact-edit-brief-runtime-port-factory'
import {
  createEditReferenceCanonicalV3LocalLongFormRuntimePortFactory,
} from '../services/edit-reference-canonical-v3-local-long-form-runtime-port-factory'
import {
  createEditReferenceCanonicalV3LocalTargetUnderstandingPackageRuntimePortFactory,
} from '../services/edit-reference-canonical-v3-local-target-understanding-package-runtime-port-factory'
import {
  createCanonicalV3LocalEditReferenceDomainRepositoryRuntimePort,
} from '../services/edit-reference-domain-repository-runtime-port'
import { createEditReferenceService } from '../services/edit-reference-service'
import { completeCanonicalV3PrePlanStudyFixture } from './fixtures/complete-canonical-v3-pre-plan-study-fixture'
import {
  createReadyTargetVideoUnderstandingFixture,
} from './fixtures/ready-target-video-understanding-fixture'

const endpointOrigin = requiredEnvironment('REEDITPRO_CANONICAL_V3_API_URL')
const serviceRoleKey = requiredEnvironment('REEDITPRO_CANONICAL_V3_SERVICE_ROLE_KEY')
const anonKey = requiredEnvironment('REEDITPRO_CANONICAL_V3_ANON_KEY')
const jwtSecret = requiredEnvironment('REEDITPRO_CANONICAL_V3_JWT_SECRET')
assert.equal(endpointOrigin, 'http://127.0.0.1:57431')

const actorUserId = '11111111-1111-4111-8111-111111111111'
const otherActorUserId = '22222222-2222-4222-8222-222222222222'
const workspaceId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const projectId = 'aaaaaaaa-1000-4000-8000-000000000001'
const editSessionId = 'aaaaaaaa-2000-4000-8000-000000000001'
const runKey = randomUUID()
const ownerToken = createLocalAuthenticatedJwt(actorUserId, jwtSecret)
const otherOwnerToken = createLocalAuthenticatedJwt(otherActorUserId, jwtSecret)
const env = loadRuntimeEnv({
  ...process.env,
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  STORAGE_MODE: 'local',
  LOCAL_STORAGE_ROOT: join(
    tmpdir(),
    `reeditpro-canonical-v3-preparation-apply-${runKey}`,
  ),
  PROVIDER_EXECUTION_ENABLED: 'false',
  WORKER_RUNTIME_MODE: 'mock',
})

const domainClient = createEditReferenceLocalSupabaseDomainHttpRpcClient({
  endpointOrigin,
  serviceRoleKey,
})
const domainCapability = createEditReferenceLocalSupabaseDomainCapability({
  client: domainClient,
  endpointOrigin,
})
const referenceRepository = createEditReferenceLocalSupabaseDomainRepository({
  client: domainClient,
  capability: domainCapability,
})
const domainRuntimePort =
  createCanonicalV3LocalEditReferenceDomainRepositoryRuntimePort({
    repository: referenceRepository,
  })
const domainService = createEditReferenceService({
  env,
  clients: { admin: null, public: null },
  requestId: `canonical-preparation-${runKey}`,
  auth: { userId: actorUserId, isMockUser: true },
  editReferenceDomainRepositoryRuntimePort: domainRuntimePort,
})

const createdReference = await domainService.createReference({
  workspaceId,
  name: `Canonical documentary ${runKey.slice(0, 8)}`,
  description: 'A restrained evidence-led documentary preference.',
  initialGoals: ['visual_language', 'story_and_pacing', 'audio_and_sfx'],
}, `create-preparation-reference-${runKey}`)
const referenceId = createdReference.data.detail.reference.id
const studySessionId = createdReference.data.detail.study.id
const direction = await domainService.appendMessage(studySessionId, {
  workspaceId,
  expectedStudyRevision: 1,
  clientMessageId: `preparation-direction-${runKey}`,
  content:
    'Preserve testimony, hold evidence long enough to read, and keep sound restrained.',
}, `append-preparation-direction-${runKey}`)
const studied = await domainService.runEvidenceStudy(studySessionId, {
  workspaceId,
  expectedStudyRevision: direction.data.detail.study.revision,
}, `study-preparation-reference-${runKey}`)
const synthesized = await domainService.synthesizePreferenceDNA(studySessionId, {
  workspaceId,
  expectedStudyRevision: studied.data.detail.study.revision,
}, `synthesize-preparation-dna-${runKey}`)
const draftDna = required(synthesized.data.detail.dnaVersions[0])
const reviewed = await domainService.runPreferenceDNAQA(
  studySessionId,
  draftDna.id,
  {
    workspaceId,
    expectedStudyRevision: synthesized.data.detail.study.revision,
    expectedDNAContentDigest: draftDna.contentDigest,
  },
  `qa-preparation-dna-${runKey}`,
)
const qaResult = required(reviewed.data.detail.dnaQaResults[0])
const approved = await domainService.approvePreferenceDNA(
  studySessionId,
  draftDna.id,
  {
    workspaceId,
    expectedStudyRevision: reviewed.data.detail.study.revision,
    expectedDNAContentDigest: draftDna.contentDigest,
    qaResultId: qaResult.id,
    acknowledgeAdaptNotCopy: true,
    acknowledgeQAReview: true,
  },
  `approve-preparation-dna-${runKey}`,
)
const approvedReference = approved.data.detail.reference
const approvedDna = required(approved.data.detail.dnaVersions.find(
  (candidate) => candidate.status === 'approved',
))
assert.equal(approved.data.detail.study.status, 'approved')

const sourceStorageObjectRecordId = randomUUID()
const sourceMediaAssetId = randomUUID()
const exactBriefFactory =
  createEditReferenceCanonicalV3LocalExactEditBriefRuntimePortFactory({
    endpointOrigin,
    anonKey,
    localInternalSigningSecret: jwtSecret,
  })
const exactBriefPort = exactBriefFactory.createForAuthenticatedRequest({
  env,
  authority: {
    ownerUserId: actorUserId,
    authenticatedAccessToken: ownerToken,
    isMockUser: false,
  },
})
const brief = await exactBriefPort.save({
  workspaceId,
  projectId,
  editSessionId,
  briefText:
    'Preserve the factual sequence, named evidence, natural testimony, and confirmed 16:9 frame.',
  sourceStorageObjectRecordId,
  sourceMediaAssetId,
  idempotencyKey: `preparation-brief-${runKey}`,
})

const createdAt = new Date().toISOString()
const plan = createEditReferenceLongFormStudyPlan({
  workspaceId,
  editReferenceId: referenceId,
  studySessionId,
  source: {
    privateMediaArtifactId: sourceStorageObjectRecordId,
    mediaChecksumSha256: sha256(`target-source-${runKey}`),
    durationSeconds: 120,
    sizeBytes: 512 * 1024 * 1024,
    mimeType: 'video/mp4',
    hasAudio: true,
  },
  includeCaptionOcr: true,
  createdAt,
})
const externalRunId = `canonical-target-apply-${runKey}`
const preparedRun = prepareEditReferenceLongFormStudyRun({
  plan,
  run: createEditReferenceLongFormStudyRun({
    runId: externalRunId,
    plan,
    createdAt,
  }),
  ingestIntegrityDigestSha256: sha256(`ingest-${runKey}`),
  mediaProbeDigestSha256: sha256(`probe-${runKey}`),
  mediaProbeObservedWallClockMs: 800,
  now: createdAt,
})
const longFormFactory = createEditReferenceCanonicalV3LocalLongFormRuntimePortFactory({
  endpointOrigin,
  anonKey,
  localInternalSigningSecret: jwtSecret,
})
const longFormRuntime = longFormFactory.createForAuthenticatedRequest({
  env,
  authority: {
    ownerUserId: actorUserId,
    authenticatedAccessToken: ownerToken,
    isMockUser: false,
  },
})
const targetSourceAssetId = randomUUID()
const createdStudy = await longFormRuntime.create({
  scope: {
    localStorageRoot: env.localStorageRoot,
    ownerUserId: actorUserId,
    workspaceId,
  },
  plan,
  run: preparedRun,
  sourceBinding: {
    sourceAuthority: 'target_source_media',
    sourceAssetId: targetSourceAssetId,
    sourceStorageObjectRecordId,
    sourceMediaAssetId,
    sourceStorageObjectId:
      `workspaces/${workspaceId}/targets/${sourceMediaAssetId}.mp4`,
    sourceStorageGeneration: '1',
    sourceStorageEtag: `target-${runKey}`,
    targetProjectId: projectId,
    targetEditSessionId: editSessionId,
    targetEditBriefId: brief.record.id,
    targetEditBriefRevision: brief.record.revisionNumber,
    targetEditBriefDigestSha256: brief.record.contentDigestSha256,
  },
})
assert.equal(
  createdStudy.run.workItems.filter((item) => item.status === 'completed').length,
  2,
)
const completedProjection = await completeCanonicalV3PrePlanStudyFixture({
  endpointOrigin,
  anonKey,
  authenticatedAccessToken: ownerToken,
  localInternalSigningSecret: jwtSecret,
  runId: externalRunId,
})
assert.equal(completedProjection.run.state, 'completed')

const targetContext: PreferenceApplicationTargetContextSnapshot = {
  projectId,
  editSessionId,
  projectName: 'Canonical project A',
  editName: 'Exact target edit A',
  sourceMode: 'voice_first',
  contentType: 'documentary',
  sourceSummary:
    'A complete controlled local study of the exact target documentary source.',
  currentUserInstruction:
    'Adapt the approved preference to this source without copying footage or claims.',
  selectedEditLevel: 'premium',
  aspectRatio: '16:9',
  outputFrameConfirmed: true,
  platformTarget: 'youtube_standard',
  storyRole: 'Preserve verified chronology and testimony.',
  budgetPreference: 'balanced',
  directives: {
    captions: 'adapt',
    music: 'avoid',
    sfx: 'adapt',
    sourceOrder: 'preserve',
  },
  approvedConstraints: [
    'Do not invent or reorder factual claims.',
    'Do not copy target footage, creator identity, wording, or music.',
  ],
}
const targetPackage = createReadyTargetVideoUnderstandingFixture({
  workspaceId,
  editReferenceId: referenceId,
  studySessionId,
  targetContext,
  fixtureKey: `canonical-preparation-${runKey}`,
  durationSeconds: plan.source.durationSeconds,
  sourceBinding: {
    storageObjectRecordId: sourceStorageObjectRecordId,
    mediaAssetId: sourceMediaAssetId,
    checksumSha256: plan.source.mediaChecksumSha256,
    sizeBytes: plan.source.sizeBytes,
    mimeType: plan.source.mimeType,
  },
  editBriefBinding: {
    id: brief.record.id,
    revision: brief.record.revisionNumber,
    digestSha256: brief.record.contentDigestSha256,
  },
  studyBinding: {
    runId: completedProjection.run.runId,
    runRevision: completedProjection.run.revision,
    planId: completedProjection.run.planId,
    planDigestSha256: completedProjection.run.planDigestSha256,
    totalWorkItemCount: completedProjection.run.totalWorkItemCount,
    chunkCount: createdStudy.plan.chunks.length,
  },
})
const targetPackageFactory =
  createEditReferenceCanonicalV3LocalTargetUnderstandingPackageRuntimePortFactory({
    endpointOrigin,
    anonKey,
    localInternalSigningSecret: jwtSecret,
  })
const targetPackagePort = targetPackageFactory.createForAuthenticatedRequest({
  env,
  authority: {
    ownerUserId: actorUserId,
    authenticatedAccessToken: ownerToken,
    isMockUser: false,
  },
})
const targetScope = {
  localStorageRoot: env.localStorageRoot,
  ownerUserId: actorUserId,
  workspaceId,
}
const savedTarget = await targetPackagePort.save({
  scope: targetScope,
  package: targetPackage,
})
assert.equal(savedTarget.disposition, 'created')

const intent: EditReferenceApplicationPreparationIntent = {
  schemaVersion: EDIT_REFERENCE_APPLICATION_PREPARATION_INTENT_VERSION,
  workspaceId,
  editReferenceId: referenceId,
  studySessionId,
  dnaVersionId: approvedDna.id,
  expectedReferenceRevision: approvedReference.revision,
  expectedDNAContentDigestSha256: approvedDna.contentDigest,
  applicationSource: 'session_panel',
  targetUnderstandingPackageId: targetPackage.packageId,
  targetUnderstandingPackageDigestSha256: targetPackage.packageDigestSha256,
  targetUnderstandingSourceStorageObjectRecordId: sourceStorageObjectRecordId,
  targetUnderstandingSourceMediaAssetId: sourceMediaAssetId,
  targetUnderstandingEditBriefDigestSha256: brief.record.contentDigestSha256,
}
const preparationRequestDigestSha256 =
  editReferenceApplicationPreparationRequestDigest({
    actorUserId,
    projectId,
    editSessionId,
    intent,
  })
const preparationPort = createEditReferenceLocalSupabaseApplicationPreparationPort({
  endpointOrigin,
  serviceRoleKey,
  env,
  referenceRepository,
  targetUnderstandingPackageRuntimePortFactory: targetPackageFactory,
})
const preparationInput = {
  actor: {
    actorUserId,
    authenticatedAccessToken: ownerToken,
    mockActor: false,
    localStorageRoot: env.localStorageRoot,
  },
  projectId,
  editSessionId,
  intent,
  idempotencyKeyHashSha256: sha256(`prepare-application-${runKey}`),
  preparationRequestDigestSha256,
}
const preparationAttempts = await Promise.all([
  preparationPort.prepare(preparationInput),
  preparationPort.prepare(preparationInput),
])
assert.deepEqual(
  preparationAttempts.map((attempt) => attempt.replayed).sort(),
  [false, true],
)
const prepared = required(preparationAttempts.find((attempt) => !attempt.replayed))
assert.equal(prepared.replayed, false)
assert.equal(prepared.applicationConnectedToEdit, false)
assert.equal(prepared.applicationAuthority.connectionState, 'not_connected')
assert.equal(
  prepared.applicationAuthority.targetUnderstandingPackageDigestSha256,
  targetPackage.packageDigestSha256,
)
const replayedPreparation = required(
  preparationAttempts.find((attempt) => attempt.replayed),
)
assert.equal(replayedPreparation.replayed, true)
assert.equal(
  replayedPreparation.applicationAuthority.applicationId,
  prepared.applicationAuthority.applicationId,
)
assert.equal(replayedPreparation.transactionId, prepared.transactionId)

await assert.rejects(() => preparationPort.prepare({
  ...preparationInput,
  intent: { ...intent, applicationSource: 'chat_tag' },
  preparationRequestDigestSha256:
    editReferenceApplicationPreparationRequestDigest({
      actorUserId,
      projectId,
      editSessionId,
      intent: { ...intent, applicationSource: 'chat_tag' },
    }),
}))

const exactApplyPort = createEditReferenceCanonicalV3LocalExactEditApplyRuntimePort({
  endpointOrigin,
  anonKey,
})
const actor = {
  actorUserId,
  authenticatedAccessToken: ownerToken,
  mockActor: false,
}
const authority = await exactApplyPort.readAuthority({
  actor,
  scope: {
    actorUserId,
    workspaceId,
    projectId,
    editSessionId,
    selectedApplicationId: prepared.applicationAuthority.applicationId,
  },
})
assert.equal(
  authority.selectedApplicationAuthority?.applicationId,
  prepared.applicationAuthority.applicationId,
)
assert.ok(
  ['not_selected', 'cleared', 'connected'].includes(
    authority.currentApplicationState,
  ),
)
const initialReferenceMutation = authority.currentApplicationState === 'connected'
  ? 'replace'
  : 'apply'
const applyOperation: EditReferenceProductionExactEditApplyOperation = {
  schemaVersion: EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_OPERATION_VERSION,
  authority,
  preferencePatch: {},
  referenceMutation: initialReferenceMutation,
}
const authenticated = {
  actorUserId,
  workspaceId,
  projectId,
  editSessionId,
  authenticatedUserVerified: true as const,
  workspaceMembershipVerified: true as const,
  workspaceProjectCompositeBindingVerified: true as const,
  projectEditSessionCompositeBindingVerified: true as const,
  accessCheckReceiptId: `canonical-apply-access-${runKey}`,
}
const preparedApply = prepareEditReferenceProductionExactEditApplyFromAuthoritySnapshot({
  operation: applyOperation,
  authenticated,
  accessCheckReceiptId: authenticated.accessCheckReceiptId,
  idempotencyKeyHashSha256: sha256(`apply-application-${runKey}`),
  serverReceivedAt: new Date().toISOString(),
})
const concurrentApplyReceipts = await Promise.all([
  exactApplyPort.apply({ actor, request: preparedApply.request }),
  exactApplyPort.apply({ actor, request: preparedApply.request }),
])
const applyReceipt = required(concurrentApplyReceipts[0])
assert.equal(applyReceipt.referenceMutation, initialReferenceMutation)
assert.equal(applyReceipt.freshPlanAndEstimateRequired, true)
const applyReplay = required(concurrentApplyReceipts[1])
assert.deepEqual(applyReplay, applyReceipt)

const connectedAuthority = await exactApplyPort.readAuthority({
  actor,
  scope: {
    actorUserId,
    workspaceId,
    projectId,
    editSessionId,
    selectedApplicationId: prepared.applicationAuthority.applicationId,
  },
})
assert.equal(connectedAuthority.currentApplicationState, 'connected')
assert.equal(
  connectedAuthority.currentApplicationId,
  prepared.applicationAuthority.applicationId,
)

const removeOperation: EditReferenceProductionExactEditApplyOperation = {
  schemaVersion: EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_OPERATION_VERSION,
  authority: connectedAuthority,
  preferencePatch: {},
  referenceMutation: 'remove',
}
const preparedRemove = prepareEditReferenceProductionExactEditApplyFromAuthoritySnapshot({
  operation: removeOperation,
  authenticated,
  accessCheckReceiptId: authenticated.accessCheckReceiptId,
  idempotencyKeyHashSha256: sha256(`remove-application-${runKey}`),
  serverReceivedAt: new Date().toISOString(),
})
const removeReceipt = await exactApplyPort.apply({
  actor,
  request: preparedRemove.request,
})
assert.equal(removeReceipt.referenceMutation, 'remove')
const clearedAuthority = await exactApplyPort.readAuthority({
  actor,
  scope: {
    actorUserId,
    workspaceId,
    projectId,
    editSessionId,
    selectedApplicationId: null,
  },
})
assert.equal(clearedAuthority.currentApplicationState, 'cleared')
assert.equal(clearedAuthority.currentApplicationId, null)

await assert.rejects(() => exactApplyPort.readAuthority({
  actor: {
    actorUserId: otherActorUserId,
    authenticatedAccessToken: otherOwnerToken,
    mockActor: false,
  },
  scope: {
    actorUserId: otherActorUserId,
    workspaceId,
    projectId,
    editSessionId,
    selectedApplicationId: prepared.applicationAuthority.applicationId,
  },
}))

assertEditReferenceLocalSupabaseApplicationPreparationPortIsNotProduction(
  preparationPort,
)
assert.equal(preparationPort.productionAuthority, false)
assert.equal(exactApplyPort.productionAuthority, false)

console.log(JSON.stringify({
  ok: true,
  schemaVersion:
    'edit-reference-canonical-v3-application-preparation-and-apply-smoke-v1',
  canonicalReferenceApproved: true,
  exactTargetBriefBound: true,
  canonicalTargetRunCompleted: true,
  targetWorkItemCount: completedProjection.run.totalWorkItemCount,
  targetPackagePersisted: true,
  serverPreparedApplication: true,
  exactPreparationReplayRecovered: true,
  concurrentPreparationReplayRecovered: true,
  changedPreparationReplayRejected: true,
  initialReferenceMutation,
  atomicApplyConnected: true,
  atomicApplyReplayRecovered: true,
  concurrentAtomicApplyReplayRecovered: true,
  atomicRemovePersisted: true,
  crossTenantAuthorityReadDenied: true,
  browserApplicationRecordAccepted: false,
  providerCallMadeByThisProof: false,
  remoteMutationMade: false,
  productionAuthority: false,
}, null, 2))

function sha256(value: unknown): string {
  return createHash('sha256')
    .update(stableEditReferenceApplicationPreparationJson(value))
    .digest('hex')
}

function requiredEnvironment(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name}_required`)
  return value
}

function required<T>(value: T | null | undefined): T {
  assert.notEqual(value, null)
  assert.notEqual(value, undefined)
  return value as T
}

function createLocalAuthenticatedJwt(subject: string, secret: string): string {
  const now = Math.floor(Date.now() / 1_000)
  const encode = (value: unknown): string => Buffer.from(JSON.stringify(value))
    .toString('base64url')
  const header = encode({ alg: 'HS256', typ: 'JWT' })
  const payload = encode({
    aud: 'authenticated',
    exp: now + 3_600,
    iat: now,
    role: 'authenticated',
    sub: subject,
  })
  const signature = createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64url')
  return `${header}.${payload}.${signature}`
}
