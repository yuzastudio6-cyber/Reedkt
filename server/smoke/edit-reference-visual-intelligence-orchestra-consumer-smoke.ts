import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  VISUAL_INTELLIGENCE_MODEL_ID,
  VISUAL_INTELLIGENCE_PROVIDER_ADAPTER_ID,
  VISUAL_INTELLIGENCE_PROVIDER_ID,
  type VisualIntelligenceFinding,
  type VisualIntelligenceReport,
} from '../../src/types/visual-intelligence'
import type { OrchestraEvidenceRef } from
  '../../src/types/orchestra-skill-capability'
import type {
  PreferenceEvidenceRecord,
  PreferenceAssetRecord,
  PreferenceStudySessionRecord,
} from '../../src/types/edit-reference'
import type { EditReferenceAggregate } from
  '../edit-references/edit-reference-repository'
import { loadRuntimeEnv } from '../config/env'
import {
  createOrchestraSkillCall,
  createOrchestraSkillJobResult,
  orchestraDigest,
  orchestraEvidenceRef,
} from '../orchestra/orchestra-skill-capability-contract'
import {
  adaptEditReferenceVisualIntelligenceOrchestraResult,
} from '../edit-references/edit-reference-visual-intelligence-orchestra-consumer'
import {
  createEditReferenceVisualIntelligenceBindingStore,
  createEditReferenceVisualIntelligenceOrchestraBinding,
  createEditReferenceVisualIntelligenceOrchestraReadPort,
} from '../edit-references/edit-reference-visual-intelligence-result-bridge'
import { orchestratePreferenceEvidenceStudy } from
  '../edit-references/edit-reference-evidence-orchestrator'
import {
  editReferenceScopeHash,
  validateEditReferenceRepositoryAggregate,
} from '../edit-references/private-edit-reference-repository'
import { createEditReferenceService } from
  '../services/edit-reference-service'
import {
  commitPrivateFinalizedUploadAuthority,
} from '../services/private-upload-media-authority-store'
import { createUploadService } from '../services/upload-service'
import type { ServiceContext } from '../types'
import { createVisualIntelligenceReport } from
  '../visual-intelligence/visual-intelligence-contract'

const rawChecksum = '1'.repeat(64)
const sourceRef = ref('reference-video', `sha256:${rawChecksum}`)
const range = {
  startFrame: 0,
  endFrameExclusive: 240,
  frameRate: { numerator: 24, denominator: 1 },
}
const evidenceRef = ref('reference-media-probe')
const findings: VisualIntelligenceFinding[] = [
  finding('caption-hierarchy', 'caption_hierarchy'),
  finding('color-character', 'color_palette_character'),
  finding('broll-pattern', 'b_roll_cutaway_pattern'),
  finding('graphics-density', 'graphic_overlay_density'),
  finding('story-rhythm', 'story_rhythm'),
  finding('audio-visual-relation', 'audio_visual_relationship'),
]

const report = reportFixture({ findings })
const result = resultFixture(report)
const adapted = adaptEditReferenceVisualIntelligenceOrchestraResult({
  sourceEvidenceId: 'reference-evidence-1',
  privateAssetId: sourceRef.id,
  expectedScope: expectedScope(),
  orchestraResult: result,
  report,
})

assert.equal(
  adapted.schemaVersion,
  'edit-reference-visual-intelligence-study-v1',
)
assert.equal(adapted.providerModel, 'gemini-3.1-pro-preview')
assert.equal(adapted.thinkingLevel, 'high')
assert.equal(adapted.mediaResolution, 'high')
assert.equal(adapted.completeRequestedRangeCoverage, true)
assert.equal(adapted.everyTimelineFrameInspected, false)
assert.equal(adapted.completeTimePixelInspectionClaimAllowed, false)
assert.equal(adapted.billingAccountEffectiveRateUsed, true)
assert.equal(adapted.publicListPriceUsed, false)
assert.equal(adapted.preferenceDnaApproved, false)
assert.equal(adapted.directTimelineMutationAllowed, false)
assert.equal(adapted.directProviderAuthorityGranted, false)
assert.equal(adapted.customerCreditMutationPerformed, false)
assert.equal(adapted.publicDeliveryGranted, false)
assert.equal(adapted.productionAuthorityGranted, false)
assert.deepEqual(adapted.coveredPreferenceCategories, [
  'visual_language',
  'story_and_pacing',
  'captions',
  'color',
  'b_roll',
  'audio_and_sfx',
  'graphics',
])
assert.ok(Object.isFrozen(adapted))
assert.ok(Object.isFrozen(adapted.evidenceItems))
assert.equal(adapted.providerAdapterId, 'vertex_gemini_pro')
assert.equal(adapted.providerId, 'google_vertex_ai')

const orchestration = orchestratePreferenceEvidenceStudy({
  orchestrationId: 'reference-orchestration-1',
  workspaceId: 'workspace-1',
  editReferenceId: 'reference-1',
  study: studyFixture(),
  evidence: [sourceEvidenceFixture()],
  visualIntelligenceStudies: [adapted],
  now: '2026-08-03T12:00:00.000Z',
})
const visualRun = orchestration.skillRuns.find((item) => (
  item.skillId === 'visual_intelligence.reference_preference_analysis'
))
assert.equal(orchestration.studyStatus, 'evidence_ready')
assert.deepEqual(orchestration.uncoveredGoals, [])
assert.equal(visualRun?.status, 'completed')
assert.equal(visualRun?.runtimeSource, 'verified_live')
assert.equal(visualRun?.providerCallMade, true)
assert.equal(visualRun?.modelCallMade, true)
assert.equal(visualRun?.fallbackUsed, false)
assert.equal(visualRun?.outputEvidenceIds.length, 7)
assert.equal(orchestration.derivedEvidence.filter((item) => (
  item.provenance.visualIntelligenceRuntime
)).length, 7)
assert.ok(orchestration.derivedEvidence.every((item) => (
  item.provenance.semanticRuntime === undefined
)))
assert.ok(orchestration.skillRuns.every((item) => (
  item.skillId !== 'edit_reference.visual_language.qwen_visual_analysis'
)))
assert.ok(orchestration.derivedEvidence
  .filter((item) => item.provenance.visualIntelligenceRuntime)
  .every((item) => (
    item.confidenceBasis === 'model_observed'
    && item.provenance.mediaStudyStatus
      === 'media_studied_visual_intelligence'
    && item.provenance.visualIntelligenceRuntime
      ?.billingAccountEffectiveRateUsed === true
    && item.provenance.visualIntelligenceRuntime
      ?.substantiveCpuExecutionUsed === false
  )))
const aggregate = aggregateFixture(orchestration)
assert.doesNotThrow(() => validateEditReferenceRepositoryAggregate(
  aggregate,
  {
    localStorageRoot: '/private/weeditpro/edit-reference-smoke',
    ownerUserId: 'user-1',
    workspaceId: 'workspace-1',
  },
))

const bindingScope = {
  ...expectedScope(),
  sourceEvidenceId: 'reference-evidence-1',
  privateAssetId: sourceRef.id,
  sourceEvidenceRef: ref(
    'reference-evidence-1',
    orchestraDigest(sourceEvidenceFixture()),
  ),
  studyAuthorityRef: ref('study-1', orchestraDigest(studyFixture())),
}
const orchestraCall = referencePreferenceCall(bindingScope)
const binding = createEditReferenceVisualIntelligenceOrchestraBinding({
  scope: bindingScope,
  orchestraCall,
  createdAt: '2026-08-03T11:30:00.000Z',
})
const objectRecords = new Map<string, Buffer>()
const bindingStore = createEditReferenceVisualIntelligenceBindingStore({
  objectPort: {
    async createOnly({ objectPath, body }) {
      const existing = objectRecords.get(objectPath)
      if (existing && !existing.equals(body)) throw new Error('collision')
      if (existing) return 'already_exists'
      objectRecords.set(objectPath, Buffer.from(body))
      return 'created'
    },
    async readExact(objectPath) {
      const body = objectRecords.get(objectPath)
      return body ? Buffer.from(body) : null
    },
  },
})
const persistedBinding = await bindingStore.persistCreateOnly(binding)
assert.equal(objectRecords.size, 2)
assert.equal(
  (await bindingStore.persistCreateOnly(binding)).disposition,
  'identical_replay',
)
await assert.rejects(bindingStore.persistCreateOnly(
  createEditReferenceVisualIntelligenceOrchestraBinding({
    scope: {
      ...bindingScope,
      sourceEvidenceId: 'different-reference-evidence',
      sourceEvidenceRef: ref('different-reference-evidence'),
    },
    orchestraCall,
    createdAt: '2026-08-03T11:31:00.000Z',
  }),
))
const boundResult = resultFixture(report, {
  callRef: persistedBinding.binding.orchestraCallRef,
  manifestRef: persistedBinding.binding.manifestRef,
  qualificationSnapshotRef:
    persistedBinding.binding.qualificationSnapshotRef,
})
const readPort = createEditReferenceVisualIntelligenceOrchestraReadPort({
  bindingStore,
  resultStore: {
    async readExact(callRef) {
      return orchestraDigest(callRef)
        === orchestraDigest(persistedBinding.binding.orchestraCallRef)
        ? boundResult
        : null
    },
  },
  reportRepository: {
    async readAcceptedByRef(reportRef) {
      return orchestraDigest(reportRef)
        === orchestraDigest(boundResult.producedArtifactRefs[0])
        ? report
        : null
    },
  },
})
const durableReread = await readPort.readCompletedReferenceAnalysis(
  bindingScope,
)
assert.equal(persistedBinding.disposition, 'created')
assert.equal(durableReread?.studyDigestSha256.startsWith('sha256:'), true)
assert.equal(durableReread?.sourceEvidenceId, 'reference-evidence-1')
assert.equal(durableReread?.privateAssetId, sourceRef.id)
assert.equal(durableReread?.providerModel, 'gemini-3.1-pro-preview')
assert.equal(durableReread?.preferenceDnaApproved, false)

const serviceProof = await proveEditReferenceServiceUsesOrchestraReadPort()
assert.equal(serviceProof.retiredVisualProviderCallCount, 0)
assert.equal(serviceProof.visualIntelligenceSkillCompleted, true)
assert.equal(serviceProof.assetMarkedStudiedByVisualIntelligence, true)
assert.equal(serviceProof.serverOwnedBindingRequestPrepared, true)
assert.equal(serviceProof.staleOrMissingSourceRefused, true)

let adversarialRefusals = 0
await refused('wrong job type', () => resultFixture(report, {
  jobType: 'source_video_understanding',
}))
await refused('wrong phase', () => resultFixture(report, {
  phase: 'preapproval',
}))
await refused('follow-up incomplete', () => resultFixture(report, {
  disposition: 'needs_followup',
  proposedFollowupRanges: [range],
  followupReasonCode: 'more_reference_detail_required',
  estimatedAdditionalTimeRef: ref('followup-time'),
  estimatedAdditionalCreditsRef: ref('followup-credit'),
}))
await refused('cross-workspace report', () => result, reportFixture({
  findings,
  workspaceId: 'other-workspace',
}))
await refused('wrong profile', () => resultFixture(reportFixture({
  findings,
  profile: 'visual_style',
})), reportFixture({ findings, profile: 'visual_style' }))
await refused('unsettled provider cost', () => {
  const candidate = reportFixture({ findings, settledCostMicros: null })
  return resultFixture(candidate)
}, reportFixture({ findings, settledCostMicros: null }))
await refused('direct-copy instruction', () => {
  const candidate = reportFixture({
    findings: [finding(
      'unsafe-copy',
      'visual_storytelling',
      'Copy the creator shot-for-shot.',
    )],
  })
  return resultFixture(candidate)
}, reportFixture({
  findings: [finding(
    'unsafe-copy',
    'visual_storytelling',
    'Copy the creator shot-for-shot.',
  )],
}))
await refused('mismatched report artifact', () => resultFixture(report, {
  producedArtifactRefs: [ref('different-report')],
}))
await refused('tampered result digest', () => ({
  ...result,
  resultDigestSha256: `sha256:${'f'.repeat(64)}`,
}))
await refused('wrong source authority', () => result, report, {
  ...expectedScope(),
  sourceArtifactRef: ref('other-reference-video'),
})

console.log(JSON.stringify({
  smoke: 'edit-reference-visual-intelligence-orchestra-consumer',
  providerNeutralSkill: true,
  exactOrchestraResultBound: true,
  exactGeminiProHighReportBound: true,
  allPreferenceCategoriesProjected: true,
  directCopyRejected: true,
  preferenceDnaApprovalNotGranted: true,
  exactPreferenceEvidenceOrchestrationPassed: true,
  qwenVisualEvidenceNotEmitted: true,
  privateRepositoryProjectionAccepted: true,
  durableOrchestraBindingAndRereadPassed: true,
  oneCallCannotBindMultipleConsumerScopes: true,
  editReferenceServiceReadPortIntegrationPassed: true,
  serverOwnedBindingRequestPreparationPassed: true,
  staleOrMissingBindingSourceRefused: true,
  retiredLocalVisualProviderNotCalled: true,
  adversarialRefusals,
}, null, 2))

async function proveEditReferenceServiceUsesOrchestraReadPort(): Promise<{
  retiredVisualProviderCallCount: number
  visualIntelligenceSkillCompleted: boolean
  assetMarkedStudiedByVisualIntelligence: boolean
  serverOwnedBindingRequestPrepared: boolean
  staleOrMissingSourceRefused: boolean
}> {
  const localStorageRoot = await mkdtemp(join(
    tmpdir(),
    'weeditpro-edit-reference-visual-intelligence-',
  ))
  try {
    const ownerUserId = 'user-1'
    const workspaceId = 'workspace-1'
    const env = loadRuntimeEnv({
      NODE_ENV: 'test',
      E2E_RUNTIME_MODE: 'local',
      WORKER_RUNTIME_MODE: 'mock',
      STORAGE_MODE: 'local',
      LOCAL_STORAGE_ROOT: localStorageRoot,
      API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
      PROVIDER_EXECUTION_ENABLED: 'false',
    })
    const context: ServiceContext = {
      env,
      clients: { admin: null, public: null },
      requestId: 'edit-reference-visual-intelligence-service-smoke',
      auth: { userId: ownerUserId, isMockUser: true },
    }
    const setupService = createEditReferenceService(context)
    const created = await setupService.createReference({
      workspaceId,
      name: 'Orchestra Visual Intelligence reference',
      description:
        'A private reference whose transferable principles are studied by the provider-neutral Orchestra skill.',
      initialGoals: [
        'visual_language',
        'story_and_pacing',
        'captions',
        'color',
        'b_roll',
        'audio_and_sfx',
        'graphics',
      ],
    }, 'create-edit-reference-visual-intelligence-service-smoke')
    const reference = created.data.detail.reference
    const initialStudy = created.data.detail.study
    const uploadService = createUploadService(context)
    const upload = await uploadService.createUploadIntent({
      workspaceId,
      editReferenceId: reference.id,
      chatSessionId: initialStudy.id,
      uploadPurpose: 'reference_media',
      originalFileName: 'orchestra-reference.mp4',
      mimeType: 'video/mp4',
      expectedSizeBytes: 4_096,
      checksumSha256: rawChecksum,
      idempotencyKey: 'edit-reference-vi-upload-intent',
    })
    const storageObjectRecordId = 'edit-reference-vi-storage-object'
    const createdAt = upload.uploadIntent.createdAt
    await commitPrivateFinalizedUploadAuthority({
      scope: { localStorageRoot, ownerUserId, workspaceId },
      uploadIntentId: upload.uploadIntent.id,
      mediaAsset: {
        id: sourceRef.id,
        workspaceId,
        projectId: reference.id,
        editReferenceId: reference.id,
        uploadIntentId: upload.uploadIntent.id,
        storageObjectRecordId,
        uploadPurpose: 'reference_media',
        assetType: 'video',
        fileName: 'orchestra-reference.mp4',
        mimeType: 'video/mp4',
        storageProvider: 'local_private',
        storageBucket: upload.uploadIntent.targetBucket,
        storagePath: upload.uploadIntent.targetPath,
        sizeBytes: 4_096,
        checksumSha256: rawChecksum,
        integrityVerified: true,
        checksumSource: 'server_computed_bytes',
        status: 'uploaded',
        createdAt,
        updatedAt: createdAt,
        mockOnly: true,
      },
      storageObject: {
        id: storageObjectRecordId,
        workspaceId,
        projectId: reference.id,
        editReferenceId: reference.id,
        mediaAssetId: sourceRef.id,
        uploadIntentId: upload.uploadIntent.id,
        uploadPurpose: 'reference_media',
        storageProvider: 'local_private',
        bucketName: upload.uploadIntent.targetBucket,
        objectPath: upload.uploadIntent.targetPath,
        objectPurpose: 'reference_media',
        mimeType: 'video/mp4',
        sizeBytes: 4_096,
        checksumSha256: rawChecksum,
        integrityVerified: true,
        checksumSource: 'server_computed_bytes',
        status: 'ready',
        createdAt,
        updatedAt: createdAt,
        mockOnly: true,
      },
      now: createdAt,
    })
    const evidenceAdded = await setupService.addEvidence(initialStudy.id, {
      workspaceId,
      expectedStudyRevision: initialStudy.revision,
      sourceType: 'reference_video_metadata',
      title: 'Private Orchestra reference video',
      sourceLabel: 'Private Orchestra reference video',
      rightsBasis: 'reference_only',
      storageObjectRecordId,
      mediaAssetId: sourceRef.id,
    }, 'add-edit-reference-visual-intelligence-evidence')
    const study = evidenceAdded.data.detail.study
    const sourceEvidence = evidenceAdded.data.detail.evidence.find((item) => (
      item.sourceType === 'reference_video_metadata'
      && item.provenance.privateAssetId === sourceRef.id
    ))
    assert(sourceEvidence)
    const referenceAsset = evidenceAdded.data.detail.assets.find((item) => (
      item.mediaAssetId === sourceRef.id
    ))
    assert(referenceAsset)
    const exactScope = {
      ownerUserId,
      workspaceId,
      editReferenceId: reference.id,
      studySessionId: study.id,
      sourceArtifactRef: sourceRef,
      sourceEvidenceId: sourceEvidence.id,
      privateAssetId: sourceRef.id,
      sourceEvidenceRef: ref(
        sourceEvidence.id,
        orchestraDigest(sourceEvidence),
      ),
      studyAuthorityRef: ref(study.id, orchestraDigest(study)),
    }
    const call = referencePreferenceCall(exactScope)
    const preparedBinding = await setupService
      .prepareVisualIntelligenceOrchestraBindingRequest(
        study.id,
        referenceAsset.id,
        {
          workspaceId,
          expectedStudyRevision: study.revision,
          orchestraCall: call,
        },
      )
    assert.deepEqual(preparedBinding.data.scope, exactScope)
    assert.deepEqual(
      preparedBinding.data.orchestraCallRef,
      orchestraEvidenceRef(call.callId, call.callDigestSha256),
    )
    assert.equal(preparedBinding.data.byteFreeRequest, true)
    assert.equal(
      preparedBinding.data.callerProviderDispatchAuthorityAccepted,
      false,
    )
    await assert.rejects(
      setupService.prepareVisualIntelligenceOrchestraBindingRequest(
        study.id,
        referenceAsset.id,
        {
          workspaceId,
          expectedStudyRevision: study.revision + 1,
          orchestraCall: call,
        },
      ),
    )
    await assert.rejects(
      setupService.prepareVisualIntelligenceOrchestraBindingRequest(
        study.id,
        'missing-reference-asset',
        {
          workspaceId,
          expectedStudyRevision: study.revision,
          orchestraCall: call,
        },
      ),
    )
    const bindingObjectRecords = new Map<string, Buffer>()
    const exactBindingStore = createEditReferenceVisualIntelligenceBindingStore({
      objectPort: {
        async createOnly({ objectPath, body }) {
          const existing = bindingObjectRecords.get(objectPath)
          if (existing && !existing.equals(body)) throw new Error('collision')
          if (existing) return 'already_exists'
          bindingObjectRecords.set(objectPath, Buffer.from(body))
          return 'created'
        },
        async readExact(objectPath) {
          const body = bindingObjectRecords.get(objectPath)
          return body ? Buffer.from(body) : null
        },
      },
    })
    const persisted = await exactBindingStore.persistCreateOnly(
      createEditReferenceVisualIntelligenceOrchestraBinding({
        scope: exactScope,
        orchestraCall: call,
        createdAt,
      }),
    )
    const exactReport = reportFixture({
      findings,
      workspaceId,
      editReferenceId: reference.id,
      studySessionId: study.id,
    })
    const exactResult = resultFixture(exactReport, {
      callRef: persisted.binding.orchestraCallRef,
      manifestRef: persisted.binding.manifestRef,
      qualificationSnapshotRef: persisted.binding.qualificationSnapshotRef,
    })
    const exactReadPort = createEditReferenceVisualIntelligenceOrchestraReadPort({
      bindingStore: exactBindingStore,
      resultStore: {
        async readExact(callRef) {
          return orchestraDigest(callRef)
            === orchestraDigest(persisted.binding.orchestraCallRef)
            ? exactResult
            : null
        },
      },
      reportRepository: {
        async readAcceptedByRef(reportRef) {
          return orchestraDigest(reportRef)
            === orchestraDigest(exactResult.producedArtifactRefs[0])
            ? exactReport
            : null
        },
      },
    })
    let retiredVisualProviderCallCount = 0
    const service = createEditReferenceService(context, undefined, {
      visualIntelligenceOrchestraReadPort: exactReadPort,
      visualLanguageProvider: {
        async analyze() {
          retiredVisualProviderCallCount += 1
          throw new Error('retired visual provider must not run')
        },
      },
    })
    const studied = await service.runEvidenceStudy(study.id, {
      workspaceId,
      expectedStudyRevision: study.revision,
    }, 'run-edit-reference-visual-intelligence-evidence')
    const visualRun = studied.data.detail.skillRuns.find((item) => (
      item.skillId === 'visual_intelligence.reference_preference_analysis'
    ))
    const studiedAsset = studied.data.detail.assets.find((item) => (
      item.mediaAssetId === sourceRef.id
    ))
    assert.equal(studied.data.detail.study.status, 'evidence_ready')
    assert.ok(studied.data.detail.skillRuns.every((item) => (
      item.skillId !== 'edit_reference.visual_language.qwen_visual_analysis'
    )))
    return {
      retiredVisualProviderCallCount,
      visualIntelligenceSkillCompleted: visualRun?.status === 'completed',
      assetMarkedStudiedByVisualIntelligence:
        studiedAsset?.mediaStudyStatus
          === 'media_studied_visual_intelligence',
      serverOwnedBindingRequestPrepared:
        preparedBinding.data.requestDigestSha256.startsWith('sha256:'),
      staleOrMissingSourceRefused: true,
    }
  } finally {
    await rm(localStorageRoot, { recursive: true, force: true })
  }
}

function studyFixture(): PreferenceStudySessionRecord {
  return {
    id: 'study-1',
    workspaceId: 'workspace-1',
    editReferenceId: 'reference-1',
    title: 'Reference preference study',
    status: 'ready_to_study',
    initialGoals: [
      'visual_language',
      'story_and_pacing',
      'captions',
      'color',
      'b_roll',
      'audio_and_sfx',
      'graphics',
    ],
    revision: 1,
    createdAt: '2026-08-03T11:00:00.000Z',
    updatedAt: '2026-08-03T11:00:00.000Z',
    runtimeSource: 'backend_local_private',
    evidenceStatus: 'ready_to_study',
    dnaStatus: 'not_generated',
    qaStatus: 'not_run',
  }
}

function sourceEvidenceFixture(): PreferenceEvidenceRecord {
  return {
    id: 'reference-evidence-1',
    workspaceId: 'workspace-1',
    editReferenceId: 'reference-1',
    studySessionId: 'study-1',
    sourceType: 'reference_video_metadata',
    category: 'media_structure',
    title: 'Private reference video',
    summary: 'Private reference media awaiting bounded semantic study.',
    revision: 1,
    confidence: 1,
    confidenceBasis: 'metadata_verified',
    transferability: 'requires_user_review',
    provenance: {
      runtimeSource: 'user_input',
      sourceEvidenceIds: [],
      privateAssetId: sourceRef.id,
      rightsBasis: 'reference_only',
      mediaStudyStatus: 'media_not_studied',
      toolIds: [],
      skillIds: [],
      fallbackUsed: false,
      notes: ['Canonical private artifact identity only.'],
    },
    createdAt: '2026-08-03T11:00:00.000Z',
    updatedAt: '2026-08-03T11:00:00.000Z',
  }
}

function aggregateFixture(
  result: ReturnType<typeof orchestratePreferenceEvidenceStudy>,
): EditReferenceAggregate {
  const now = '2026-08-03T12:00:00.000Z'
  const asset: PreferenceAssetRecord = {
    id: 'reference-asset-record-1',
    workspaceId: 'workspace-1',
    editReferenceId: 'reference-1',
    studySessionId: 'study-1',
    privateAssetId: sourceRef.id,
    storageObjectRecordId: 'storage-object-1',
    mediaAssetId: sourceRef.id,
    assetKind: 'reference_video_metadata',
    label: 'Private reference video',
    rightsBasis: 'reference_only',
    mediaStudyStatus: 'media_studied_visual_intelligence',
    lastStudyAt: now,
    createdAt: '2026-08-03T11:00:00.000Z',
  }
  return {
    schemaVersion: 'edit-reference-private-v2',
    ownerUserId: 'user-1',
    workspaceId: 'workspace-1',
    scopeHash: editReferenceScopeHash('user-1', 'workspace-1'),
    revision: 1,
    references: [{
      id: 'reference-1',
      workspaceId: 'workspace-1',
      name: 'Reference preference study',
      status: 'active',
      initialGoals: [...studyFixture().initialGoals],
      currentStudyId: 'study-1',
      revision: 1,
      createdAt: '2026-08-03T11:00:00.000Z',
      updatedAt: now,
      runtimeSource: 'backend_local_private',
      evidenceStatus: result.evidenceStatus,
      dnaStatus: 'not_generated',
      qaStatus: 'not_run',
    }],
    studies: [{
      ...studyFixture(),
      status: result.studyStatus,
      evidenceStatus: result.evidenceStatus,
      updatedAt: now,
    }],
    messages: [],
    reasoningAttempts: [],
    reasoningProviderRequests: [],
    reasoningProviderCheckbacks: [],
    reasoningProviderWorkflows: [],
    reasoningInternalCostAuthorities: [],
    preferenceDnaReasoningAttempts: [],
    evidence: [sourceEvidenceFixture(), ...result.derivedEvidence],
    assets: [asset],
    skillRuns: result.skillRuns,
    dnaVersions: [],
    dnaQaResults: [],
    applications: [],
    usageLogs: [],
    auditState: { eventCount: 0, lastSequence: 0 },
    idempotencyState: {
      receiptCount: 0,
      lastSequence: 0,
      archivedReceiptCount: 0,
      compactionCount: 0,
    },
    idempotencyReceipts: [],
    createdAt: '2026-08-03T11:00:00.000Z',
    updatedAt: now,
    privateInternalOnly: true,
  }
}

function referencePreferenceCall(
  scope: typeof bindingScope,
) {
  return createOrchestraSkillCall({
    schemaVersion: 'orchestra-skill-call-v1',
    callId: 'reference-preference-call-1',
    orchestraPlanRef: ref('orchestra-plan-1'),
    orchestraJobRef: ref('orchestra-job-1'),
    parentJobRef: null,
    requestedBy: { kind: 'orchestra' },
    targetSkillKey: 'visual_intelligence',
    jobType: 'reference_preference_analysis',
    phase: 'planning',
    scope: {
      scopeType: 'video',
      sourceArtifactRef: sourceRef,
      authorizedRanges: [range],
      completeSourceCoverageRequired: true,
      outputId: null,
    },
    sceneContextSnapshotRef: null,
    sourceArtifactRefs: [sourceRef],
    comparisonArtifactRefs: [],
    expectedOutcomeRefs: [ref('reference-preference-evidence-outcome')],
    requiredEvidenceRefs: [
      scope.sourceEvidenceRef,
      scope.studyAuthorityRef,
    ],
    manifestRef: ref('visual-intelligence-manifest'),
    qualificationSnapshotRef: ref('visual-intelligence-qualification'),
    timeBudgetRef: ref('reference-preference-time-budget'),
    creditBudgetRef: ref('reference-preference-credit-budget'),
    attemptEnvelopeRef: ref('reference-preference-attempt-envelope'),
    approvedSnapshotRef: null,
    idempotencyKey: 'reference-preference-call-1',
    orchestraDispatchAuthorized: true,
    directProviderCallAllowed: false,
    directTimelineMutationAllowed: false,
    directArtifactMutationAllowed: false,
    scopeExpansionAllowed: false,
    peerSkillExecutionAuthorityAccepted: false,
  })
}

async function refused(
  _label: string,
  resultFactory: () => unknown,
  candidateReport: unknown = report,
  scope = expectedScope(),
): Promise<void> {
  assert.throws(() => adaptEditReferenceVisualIntelligenceOrchestraResult({
    sourceEvidenceId: 'reference-evidence-1',
    privateAssetId: sourceRef.id,
    expectedScope: scope,
    orchestraResult: resultFactory(),
    report: candidateReport,
  }))
  adversarialRefusals += 1
}

function expectedScope() {
  return {
    ownerUserId: 'user-1',
    workspaceId: 'workspace-1',
    editReferenceId: 'reference-1',
    studySessionId: 'study-1',
    sourceArtifactRef: sourceRef,
  }
}

function reportFixture(input: {
  findings: VisualIntelligenceFinding[]
  workspaceId?: string
  editReferenceId?: string
  studySessionId?: string
  profile?: VisualIntelligenceReport['profile']
  settledCostMicros?: number | null
}): VisualIntelligenceReport {
  const profile = input.profile ?? 'reference_preference_dna'
  return createVisualIntelligenceReport({
    reportId: `reference-report-${profile}-${input.workspaceId ?? 'current'}`,
    requestRef: ref('visual-intelligence-request'),
    scope: {
      ownerUserId: 'user-1',
      workspaceId: input.workspaceId ?? 'workspace-1',
      projectId: input.editReferenceId ?? 'reference-1',
      editSessionId: input.studySessionId ?? 'study-1',
      approvedSnapshotId: null,
    },
    operation: 'analyze_media',
    profile,
    sourceArtifacts: [{
      artifactId: sourceRef.id,
      checksumSha256: rawChecksum,
      mediaKind: 'video',
      durationFrames: 240,
    }],
    comparisonArtifacts: [],
    coverage: {
      requestedRanges: [range],
      analyzedRanges: [range],
      incompleteRanges: [],
      sceneBoundaryRefs: [ref('scene-boundaries')],
      samplingPolicies: [{
        policyId: 'reference-complete-source-policy',
        policyVersion: 'reference-complete-source-policy-v1',
        mode: 'scene_aware_complete_coverage',
        targetFramesPerSecondNumerator: 2,
        targetFramesPerSecondDenominator: 1,
        sceneAware: true,
        highDetail: true,
        requestedRange: range,
        analyzedRange: range,
        samplingPolicyRef: ref('reference-sampling-policy'),
      }],
      targetedFollowupRanges: [],
      completeRequestedRangeCoverage: true,
      everyTimelineFrameInspected: false,
      completeTimePixelInspectionClaimAllowed: false,
    },
    semanticSummary:
      'The reference uses restrained composition, purposeful visual emphasis, and readable hierarchy that must be adapted to the target rather than copied.',
    segments: [{
      segmentId: 'reference-segment-1',
      artifactId: sourceRef.id,
      range,
      sceneId: 'reference-scene-1',
      summary: 'The opening establishes the subject before supporting details.',
      subjectIds: ['subject-1'],
      objectIds: ['object-1'],
      actionLabels: ['presenting'],
      visibleTextEvidenceRefs: [],
      transcriptEvidenceRefs: [evidenceRef],
      evidenceRefs: [evidenceRef],
      confidenceBasisPoints: 9_000,
      uncertainty: null,
      sourcePlanning: null,
    }],
    findings: input.findings,
    evidence: [{
      evidenceId: evidenceRef.id,
      evidenceRef,
      artifactId: sourceRef.id,
      range,
      authority: 'semantic_visual_judgment',
      producingTool: 'gemini_pro_high',
      toolVersion: VISUAL_INTELLIGENCE_MODEL_ID,
      summary: 'Private reference evidence is bound to the exact source range.',
      privateEvidence: true,
      providerInstructionAccepted: false,
    }],
    deterministicToolExecutions: [{
      tool: 'ffprobe',
      requirement: 'required',
      executionClass: 'l4_gpu_standard',
      releaseRef: ref('ffprobe-release'),
      executionRef: ref('ffprobe-execution'),
      substantiveCpuExecutionUsed: false,
      sourceArtifactChecksumBound: true,
    }],
    expectedOutcomeRefs: [],
    disposition: 'pass',
    reinspectionRequired: false,
    usage: {
      promptTokenCount: 2_000,
      candidateTokenCount: 500,
      thinkingTokenCount: 1_000,
      cachedTokenCount: 0,
      totalTokenCount: 3_500,
      providerResponseId: 'gemini-reference-response-1',
      providerModelVersion: VISUAL_INTELLIGENCE_MODEL_ID,
      estimatedCostMicros: 50_000,
      settledCostMicros: input.settledCostMicros === undefined
        ? 48_000
        : input.settledCostMicros,
      costEvidenceRef: ref('account-effective-cost'),
      billingAccountEffectiveRateUsed: true,
      publicListPriceUsed: false,
      duplicateSettlementPerformed: false,
      replayedFromCache: false,
      providerCallMade: true,
    },
    provenance: {
      providerAdapterId: VISUAL_INTELLIGENCE_PROVIDER_ADAPTER_ID,
      providerId: VISUAL_INTELLIGENCE_PROVIDER_ID,
      exactModelId: VISUAL_INTELLIGENCE_MODEL_ID,
      thinkingLevel: 'high',
      mediaResolution: 'high',
      promptVersion: 'visual-intelligence-reference-prompt-v1',
      responseSchemaVersion: 'visual-intelligence-provider-response-v1',
      deterministicEvidenceVersion: 'visual-intelligence-evidence-v1',
      transcriptVersion: 'faster-whisper-large-v3-v1',
      ocrVersion: 'paddleocr-v1',
      cacheIdentitySha256: orchestraDigest({ profile, sourceRef }),
      requestDigestSha256: ref('visual-intelligence-request').contentHash,
      admissionRef: ref('planning-admission'),
      providerReleaseRef: ref('gemini-provider-release'),
      applicationDefaultCredentialsUsed: true,
      providerToolsUsed: false,
      searchGroundingUsed: false,
      urlContextUsed: false,
      codeExecutionUsed: false,
      rawProviderPayloadPersisted: false,
    },
    blockers: [],
    warnings: [],
    immutableReport: true,
    planningMayConsumeValidatedEvidence: true,
    directTimelineMutationAllowed: false,
    renderPerformedByVisualIntelligence: false,
    exportAuthorized: false,
    deliveryAuthorized: false,
  })
}

function resultFixture(
  reportValue: VisualIntelligenceReport,
  overrides: Partial<Parameters<typeof createOrchestraSkillJobResult>[0]> = {},
) {
  return createOrchestraSkillJobResult({
    schemaVersion: 'orchestra-skill-job-result-v1',
    resultId: 'reference-orchestra-result-1',
    callRef: ref('reference-orchestra-call'),
    manifestRef: ref('visual-intelligence-manifest'),
    qualificationSnapshotRef: ref('visual-intelligence-qualification'),
    targetSkillKey: 'visual_intelligence',
    jobType: 'reference_preference_analysis',
    phase: 'planning',
    scope: {
      scopeType: 'video',
      sourceArtifactRef: sourceRef,
      authorizedRanges: [range],
      completeSourceCoverageRequired: true,
      outputId: null,
    },
    disposition: 'completed',
    producedArtifactRefs: [orchestraEvidenceRef(
      reportValue.reportId,
      reportValue.reportDigestSha256,
    )],
    evidenceRefs: [evidenceRef],
    proposedFollowupRanges: [],
    followupReasonCode: null,
    estimatedAdditionalTimeRef: null,
    estimatedAdditionalCreditsRef: null,
    resultReturnsToOrchestra: true,
    directTimelineMutationPerformed: false,
    directArtifactMutationPerformed: false,
    scopeExpandedWithoutOrchestra: false,
    providerAuthorityGrantedToCaller: false,
    finalQaApprovalGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
    ...overrides,
  })
}

function finding(
  findingId: string,
  category: string,
  summary = `Observed ${category.replaceAll('_', ' ')} as a reference-only principle.`,
): VisualIntelligenceFinding {
  return {
    findingId,
    artifactId: sourceRef.id,
    range,
    category,
    severity: 'info',
    summary,
    evidenceRefs: [evidenceRef],
    expectedOutcomeRefs: [],
    confidenceBasisPoints: 8_500,
    uncertainty: null,
    recommendedOwner: 'planning',
    reinspectionRequired: false,
    directTimelineMutationAllowed: false,
    providerInstructionAccepted: false,
  }
}

function ref(
  id: string,
  contentHash = orchestraDigest({ id }),
): OrchestraEvidenceRef {
  return orchestraEvidenceRef(id, contentHash)
}
