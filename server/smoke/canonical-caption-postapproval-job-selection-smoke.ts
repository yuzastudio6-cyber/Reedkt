import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import {
  canonicalCaptionPostapprovalJobSelectionRecordRef,
  createCanonicalCaptionPostapprovalJobSelectionRecord,
  createCanonicalCaptionPostapprovalJobSelectionRepository,
  parseCanonicalCaptionPostapprovalJobSelectionRecord,
  rereadCanonicalCaptionPostapprovalJobSelection,
} from '../captions-specialist/caption-postapproval-job-selection'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import {
  createCanonicalPrivateLocalJsonObjectPort,
} from '../services/canonical-private-local-json-object-port'

const root = await mkdtemp(join(tmpdir(), 'caption-postapproval-selection-'))
let assertionCount = 0

try {
  const ref = (id: string, version: string): CaptionDomainRef => ({
    id,
    version,
    contentHash: createHash('sha256').update(`${id}:${version}`)
      .digest('hex'),
  })
  const frameRef = ref(
    'frame.caption.postapproval',
    'confirmed-output-frame-v1',
  )
  const timingRef = ref(
    'timing.caption.postapproval',
    'master-timing-plan-v1',
  )
  const sourceScope = {
    ownerUserId: 'user.caption.postapproval',
    workspaceId: 'workspace.caption.postapproval',
    projectId: 'project.caption.postapproval',
    editSessionId: 'edit.caption.postapproval.source',
    planVersionId: 'plan.caption.postapproval.v1',
    approvedSnapshotRef: ref(
      'snapshot.caption.postapproval.source',
      'private-edit-authority-approved-snapshot-v3',
    ),
    outputId: 'output.caption.postapproval',
    sceneId: 'scene.caption.postapproval',
    authorizedFrameRanges: [{
      startFrame: 90,
      endFrameExclusive: 180,
    }],
    confirmedOutputFrameRef: frameRef,
    masterTimingRef: timingRef,
  }
  const targetPlanningScope = {
    ownerUserId: sourceScope.ownerUserId,
    workspaceId: sourceScope.workspaceId,
    projectId: sourceScope.projectId,
    editSessionId: 'edit.caption.postapproval.correction',
    planningRequestId: 'planning.caption.postapproval.correction',
    outputId: sourceScope.outputId,
    sceneId: sourceScope.sceneId,
    authorizedFrameRanges: structuredClone(
      sourceScope.authorizedFrameRanges,
    ),
    confirmedOutputFrameRef: frameRef,
    masterTimingRef: timingRef,
  }
  const createFixture = () =>
    createCanonicalCaptionPostapprovalJobSelectionRecord({
      evidenceMode: 'source_contract_fixture',
      sourceScope,
      sourceExecutionPackageRef: ref(
        'package.caption.postapproval.source',
        'canonical-approved-edit-execution-package-v1',
      ),
      sourceCaptionPlanningProjectionRef: ref(
        'projection.caption.postapproval.source',
        'canonical-caption-specialist-planning-projection-v3',
      ),
      completeQaReportRef: ref(
        'qa.caption.postapproval.source',
        'caption-complete-qa-report-v1',
      ),
      localRepairFallbackPlanRef: ref(
        'repair.caption.postapproval.source',
        'caption-local-repair-fallback-plan-v1',
      ),
      accessibilityRecompositionPlanRef: ref(
        'recomposition.caption.postapproval.source',
        'caption-accessibility-export-plan-v1',
      ),
      directInspectionReceiptRef: ref(
        'inspection.caption.postapproval.source',
        'caption-direct-visual-inspection-receipt-v1',
      ),
      postrenderVisualQaWorkBindingRef: ref(
        'postrender.caption.postapproval.source',
        'canonical-caption-postrender-visual-qa-work-binding-v2',
      ),
      targetPlanningScope,
    })
  const record = createFixture()
  const recordRef = canonicalCaptionPostapprovalJobSelectionRecordRef(record)
  assert.deepEqual(parseCanonicalCaptionPostapprovalJobSelectionRecord(record),
    record)
  assertionCount += 1
  assert.deepEqual(record.selections.map((selection) => selection.jobType), [
    'repair_caption_scene',
    'recompose_caption_output',
    'inspect_caption_specific_result',
  ])
  assertionCount += 1
  assert.deepEqual(record.selections.map((selection) => selection.trigger), [
    'canonical_caption_qa_repair',
    'canonical_caption_output_recomposition',
    'canonical_caption_result_inspection',
  ])
  assertionCount += 1
  assert.deepEqual(record.selections.map((selection) =>
    selection.dependsOnSelectionId), [
    null,
    record.selections[0].selectionId,
    record.selections[1].selectionId,
  ])
  assertionCount += 1
  assert.equal(record.privateQualificationEvidence, false)
  assertionCount += 1
  assert.equal(record.targetApprovedSnapshotPredictedOrInjected, false)
  assertionCount += 1

  const planLocalRefRecord =
    createCanonicalCaptionPostapprovalJobSelectionRecord({
      evidenceMode: 'source_contract_fixture',
      sourceScope,
      sourceExecutionPackageRef: ref(
        'package.caption.postapproval.plan-local-ref',
        'canonical-approved-edit-execution-package-v1',
      ),
      sourceCaptionPlanningProjectionRef: ref(
        'projection.caption.postapproval.plan-local-ref',
        'canonical-caption-specialist-planning-projection-v3',
      ),
      completeQaReportRef: ref(
        'qa.caption.postapproval.plan-local-ref',
        'caption-complete-qa-report-v1',
      ),
      localRepairFallbackPlanRef: ref(
        'repair.caption.postapproval.plan-local-ref',
        'caption-local-repair-fallback-plan-v1',
      ),
      accessibilityRecompositionPlanRef: ref(
        'recomposition.caption.postapproval.plan-local-ref',
        'caption-accessibility-export-plan-v1',
      ),
      directInspectionReceiptRef: ref(
        'inspection.caption.postapproval.plan-local-ref',
        'caption-direct-visual-inspection-receipt-v1',
      ),
      postrenderVisualQaWorkBindingRef: ref(
        'postrender.caption.postapproval.plan-local-ref',
        'canonical-caption-postrender-visual-qa-work-binding-v2',
      ),
      targetPlanningScope: {
        ...targetPlanningScope,
        sceneId: 'scene.caption.postapproval.correction-projection',
        confirmedOutputFrameRef: {
          ...frameRef,
          id: 'frame.caption.postapproval.target-plan',
        },
        masterTimingRef: {
          id: 'timing.caption.postapproval.target-plan',
          version: timingRef.version,
          contentHash: createHash('sha256')
            .update('target correction MasterTiming projection')
            .digest('hex'),
        },
      },
    })
  assert.notEqual(
    planLocalRefRecord.sourceScope.confirmedOutputFrameRef.id,
    planLocalRefRecord.targetPlanningScope.confirmedOutputFrameRef.id,
  )
  assertionCount += 1
  assert.notEqual(
    planLocalRefRecord.sourceScope.sceneId,
    planLocalRefRecord.targetPlanningScope.sceneId,
  )
  assertionCount += 1
  assert.notEqual(
    planLocalRefRecord.sourceScope.masterTimingRef.contentHash,
    planLocalRefRecord.targetPlanningScope.masterTimingRef.contentHash,
  )
  assertionCount += 1
  assert.equal(
    planLocalRefRecord.sourceScope.confirmedOutputFrameRef.contentHash,
    planLocalRefRecord.targetPlanningScope.confirmedOutputFrameRef.contentHash,
  )
  assertionCount += 1

  const repository =
    createCanonicalCaptionPostapprovalJobSelectionRepository({
      objectPort: createCanonicalPrivateLocalJsonObjectPort({
        localStorageRoot: root,
      }),
    })
  assert.equal(await repository.persistCreateOnly({ record }), 'created')
  assertionCount += 1
  assert.equal(
    await repository.persistCreateOnly({ record }),
    'identical_replay',
  )
  assertionCount += 1
  assert.deepEqual(await repository.readPort.readExact({ recordRef }), record)
  assertionCount += 1
  assert.deepEqual(await rereadCanonicalCaptionPostapprovalJobSelection({
    readPort: repository.readPort,
    recordRef,
    expectedTargetPlanningScope: targetPlanningScope,
  }), record)
  assertionCount += 1
  assert.equal(await repository.readPort.readExact({
    recordRef: { ...recordRef, contentHash: '0'.repeat(64) },
  }), null)
  assertionCount += 1

  const mutate = (apply: (value: Record<string, unknown>) => void) => {
    const value = structuredClone(record) as unknown as Record<string, unknown>
    apply(value)
    value.recordDigestSha256 = calculateSkillContractDigest(
      value,
      'recordDigestSha256',
    )
    return value
  }
  const staleDigest = structuredClone(record)
  staleDigest.targetPlanningScope.outputId = 'output.caption.crossed'
  assert.throws(() =>
    parseCanonicalCaptionPostapprovalJobSelectionRecord(staleDigest))
  assertionCount += 1
  assert.throws(() => parseCanonicalCaptionPostapprovalJobSelectionRecord(
    mutate((value) => {
      (value.targetPlanningScope as Record<string, unknown>).outputId =
        'output.caption.crossed'
    }),
  ))
  assertionCount += 1
  assert.throws(() => parseCanonicalCaptionPostapprovalJobSelectionRecord(
    mutate((value) => {
      const selections = value.selections as Array<Record<string, unknown>>
      selections[0].trigger = 'canonical_caption_result_inspection'
    }),
  ))
  assertionCount += 1
  assert.throws(() => parseCanonicalCaptionPostapprovalJobSelectionRecord(
    mutate((value) => {
      const selections = value.selections as Array<Record<string, unknown>>
      selections[1].sourceEvidenceRef = structuredClone(
        selections[0].sourceEvidenceRef,
      )
    }),
  ))
  assertionCount += 1
  assert.throws(() => parseCanonicalCaptionPostapprovalJobSelectionRecord(
    mutate((value) => {
      value.privateQualificationEvidence = true
    }),
  ))
  assertionCount += 1
  assert.throws(() => parseCanonicalCaptionPostapprovalJobSelectionRecord(
    mutate((value) => {
      value.completeQaReportRef = structuredClone(
        value.localRepairFallbackPlanRef,
      )
    }),
  ))
  assertionCount += 1
  assert.throws(() => parseCanonicalCaptionPostapprovalJobSelectionRecord(
    mutate((value) => {
      const scope = value.targetPlanningScope as Record<string, unknown>
      scope.authorizedFrameRanges = [
        { startFrame: 120, endFrameExclusive: 180 },
        { startFrame: 90, endFrameExclusive: 110 },
      ]
    }),
  ))
  assertionCount += 1
  assert.throws(() => parseCanonicalCaptionPostapprovalJobSelectionRecord(
    mutate((value) => {
      const scope = value.targetPlanningScope as Record<string, unknown>
      scope.confirmedOutputFrameRef = {
        ...(scope.confirmedOutputFrameRef as Record<string, unknown>),
        version: 'confirmed-output-frame-v2',
      }
    }),
  ))
  assertionCount += 1
  await assert.rejects(() =>
    rereadCanonicalCaptionPostapprovalJobSelection({
      readPort: repository.readPort,
      recordRef,
      expectedTargetPlanningScope: {
        ...targetPlanningScope,
        planningRequestId: 'planning.caption.crossed',
      },
    }))
  assertionCount += 1

  const authenticatedRecord =
    createCanonicalCaptionPostapprovalJobSelectionRecord({
      evidenceMode: 'authenticated_private_caption_qa',
      sourceScope,
      sourceExecutionPackageRef: ref(
        'package.caption.postapproval.authenticated',
        'canonical-approved-edit-execution-package-v1',
      ),
      sourceCaptionPlanningProjectionRef: ref(
        'projection.caption.postapproval.authenticated',
        'canonical-caption-specialist-planning-projection-v3',
      ),
      completeQaReportRef: ref(
        'qa.caption.postapproval.authenticated',
        'caption-complete-qa-report-v1',
      ),
      localRepairFallbackPlanRef: ref(
        'repair.caption.postapproval.authenticated',
        'caption-local-repair-fallback-plan-v1',
      ),
      accessibilityRecompositionPlanRef: ref(
        'recomposition.caption.postapproval.authenticated',
        'caption-accessibility-export-plan-v1',
      ),
      directInspectionReceiptRef: ref(
        'inspection.caption.postapproval.authenticated',
        'caption-direct-visual-inspection-receipt-v1',
      ),
      postrenderVisualQaWorkBindingRef: ref(
        'postrender.caption.postapproval.authenticated',
        'canonical-caption-postrender-visual-qa-work-binding-v2',
      ),
      targetPlanningScope: {
        ...targetPlanningScope,
        editSessionId: sourceScope.editSessionId,
      },
    })
  assert.equal(authenticatedRecord.privateQualificationEvidence, true)
  assertionCount += 1
  assert.equal(authenticatedRecord.actualRepairNeedObserved, true)
  assertionCount += 1
  assert.equal(
    authenticatedRecord.targetLifecycleKind,
    'canonical_same_edit_session_revision',
  )
  assertionCount += 1

  const accessor: Record<string, unknown> = { ...record }
  Object.defineProperty(accessor, 'recordId', {
    enumerable: true,
    get() {
      throw new Error('hostile accessor executed')
    },
  })
  assert.throws(() =>
    parseCanonicalCaptionPostapprovalJobSelectionRecord(accessor))
  assertionCount += 1
  const proxy = new Proxy(record, {
    ownKeys() {
      throw new Error('hostile proxy executed')
    },
  })
  assert.throws(() =>
    parseCanonicalCaptionPostapprovalJobSelectionRecord(proxy))
  assertionCount += 1

  console.log(JSON.stringify({
    ok: true,
    assertionCount,
    recordRef,
    sourceFixturePrivateQualificationEvidence: false,
    authenticatedModeSupported: true,
    priorSnapshotMutationGranted: false,
    workCreationAuthorityGrantedToCaption: false,
  }))
} finally {
  await rm(root, { recursive: true, force: true })
}
