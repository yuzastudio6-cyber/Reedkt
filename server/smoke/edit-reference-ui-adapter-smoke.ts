import assert from 'node:assert/strict'
import { toEditReferenceInspectorView, toEditReferenceSavedCardView } from '../../src/lib/edit-reference-ui-adapter'
import { EDIT_REFERENCE_GATE_1_SAFETY_FLAGS, type EditReferenceDetail, type EditReferenceListItem, type PreferenceDNAQAResultRecord, type PreferenceDNAVersionRecord } from '../../src/types/edit-reference'

const now = '2026-07-11T12:00:00.000Z'
const item: EditReferenceListItem = {
  reference: {
    id: 'reference-ui-smoke', workspaceId: 'workspace-ui-smoke', name: 'Evidence first', status: 'active',
    initialGoals: ['visual_language'], currentStudyId: 'study-ui-smoke', revision: 1, createdAt: now, updatedAt: now,
    runtimeSource: 'backend_local_private', evidenceStatus: 'not_complete', dnaStatus: 'not_generated', qaStatus: 'not_run',
  },
  currentStudy: {
    id: 'study-ui-smoke', workspaceId: 'workspace-ui-smoke', editReferenceId: 'reference-ui-smoke', title: 'Study',
    status: 'collecting_evidence', initialGoals: ['visual_language'], revision: 1, createdAt: now, updatedAt: now,
    runtimeSource: 'backend_local_private', evidenceStatus: 'not_complete', dnaStatus: 'not_generated', qaStatus: 'not_run',
  },
  messageCount: 2,
  applicationCount: 0,
}

const detail: EditReferenceDetail = {
  reference: item.reference,
  study: item.currentStudy,
  messages: [], evidence: [], assets: [], skillRuns: [], dnaVersions: [], dnaQaResults: [], applications: [], usageLogs: [],
  nextAction: 'answer_setup_questions',
  safety: EDIT_REFERENCE_GATE_1_SAFETY_FLAGS,
}

assert.deepEqual(toEditReferenceSavedCardView(item), {
  id: 'reference-ui-smoke',
  name: 'Evidence first',
  referenceStatus: 'active',
  studyStatus: 'collecting evidence',
  latestActivityAt: now,
  dnaStatus: 'DNA not generated',
  applicationCount: 0,
  messageCount: 2,
})
assert.deepEqual(toEditReferenceInspectorView(detail), {
  studyStatus: 'collecting evidence',
  evidenceStatus: 'Study evidence not complete',
  skillStatus: 'No evidence study yet',
  sourceEvidenceCount: 0,
  findingCount: 0,
  copySafetyStatus: 'Not checked yet',
  dnaStatus: 'DNA not generated yet',
  qaStatus: 'QA not run',
  nextAction: 'Answer the setup questions',
})
assert.deepEqual(Object.values(detail.safety), Array(Object.keys(detail.safety).length).fill(false))

const dnaVersion: PreferenceDNAVersionRecord = {
  id: 'dna-ui-smoke', workspaceId: 'workspace-ui-smoke', editReferenceId: 'reference-ui-smoke', studySessionId: 'study-ui-smoke',
  version: 1, status: 'review_required', synthesisVersion: 'edit-reference-dna-synthesis-v1', runtimeSource: 'verified_mock',
  inputEvidenceRevisions: [{ evidenceId: 'evidence-ui-smoke', revision: 1 }], inputEvidenceDigest: 'a'.repeat(64),
  layers: [{
    layerId: 'transferable_rules', title: 'Transferable Rules', summary: 'Adapt measured pacing.', evidenceIds: ['evidence-ui-smoke'],
    ruleIds: ['rule-ui-smoke'], confidence: 0.7, confidenceBand: 'high', transferability: 'transferable', coverage: 'covered',
  }, {
    layerId: 'do_not_copy_rules', title: 'Do Not Copy Rules', summary: 'Do not copy exact layouts.', evidenceIds: ['evidence-ui-smoke'],
    ruleIds: ['rule-ui-safety'], confidence: 1, confidenceBand: 'high', transferability: 'do_not_copy', coverage: 'covered',
  }],
  rules: [{
    id: 'rule-ui-smoke', layerId: 'transferable_rules', kind: 'must_follow', statement: 'Adapt measured pacing.',
    evidenceIds: ['evidence-ui-smoke'], confidence: 0.7, transferability: 'transferable', source: 'evidence_synthesis', targetConditions: ['Adapt to target.'],
  }, {
    id: 'rule-ui-safety', layerId: 'do_not_copy_rules', kind: 'do_not_copy', statement: 'Do not copy exact layouts.',
    evidenceIds: ['evidence-ui-smoke'], confidence: 1, transferability: 'do_not_copy', source: 'deterministic_safety_rule', targetConditions: ['Always enforce.'],
  }],
  conflicts: [], overallConfidence: 0.7, overallConfidenceBand: 'high', adaptedNotCopied: true, doNotCopyRuleCount: 1,
  qaStatus: 'not_run', contentDigest: 'b'.repeat(64), providerCallMade: false, modelCallMade: false, mediaProcessingStarted: false,
  workerJobCreated: false, generationRequestCreated: false, renderJobCreated: false, creditReservedOrSpent: false, createdAt: now,
}
const dnaDetail: EditReferenceDetail = {
  ...detail,
  reference: { ...detail.reference, dnaStatus: 'review_required' },
  study: { ...detail.study, status: 'dna_ready', dnaStatus: 'review_required' },
  dnaVersions: [dnaVersion],
  nextAction: 'run_preference_dna_qa',
}
assert.equal(toEditReferenceInspectorView(dnaDetail).dnaStatus, 'Version 1 · review required')
assert.equal(toEditReferenceInspectorView(dnaDetail).nextAction, 'Run Preference DNA QA')

const qaResult: PreferenceDNAQAResultRecord = {
  id: 'qa-ui-smoke', workspaceId: 'workspace-ui-smoke', editReferenceId: 'reference-ui-smoke', studySessionId: 'study-ui-smoke',
  dnaVersionId: dnaVersion.id, dnaVersionNumber: 1, qaVersion: 'edit-reference-dna-qa-v1', runtimeSource: 'verified_mock',
  status: 'requires_user_review', dnaContentDigest: dnaVersion.contentDigest, inputEvidenceDigest: dnaVersion.inputEvidenceDigest,
  checks: [], blockingCheckIds: [], reviewCheckIds: ['confidence_threshold'], summary: 'Confidence requires review.', contentDigest: 'c'.repeat(64),
  providerCallMade: false, modelCallMade: false, fileBytesRead: false, externalUrlFetched: false, mediaProcessingStarted: false,
  workerJobCreated: false, generationRequestCreated: false, renderJobCreated: false, creditReservedOrSpent: false, createdAt: now,
}
const qaDetail: EditReferenceDetail = {
  ...dnaDetail,
  reference: { ...dnaDetail.reference, qaStatus: 'requires_user_review' },
  study: { ...dnaDetail.study, status: 'needs_user_review', qaStatus: 'requires_user_review' },
  dnaVersions: [{ ...dnaVersion, qaStatus: 'requires_user_review', qaResultId: qaResult.id }],
  dnaQaResults: [qaResult],
  nextAction: 'approve_preference_dna',
}
assert.equal(toEditReferenceInspectorView(qaDetail).qaStatus, 'QA review required')
assert.equal(toEditReferenceInspectorView(qaDetail).nextAction, 'Approve Preference DNA')

const approvedDetail: EditReferenceDetail = {
  ...qaDetail,
  reference: { ...qaDetail.reference, dnaStatus: 'approved' },
  study: { ...qaDetail.study, status: 'approved', dnaStatus: 'approved' },
  dnaVersions: [{
    ...qaDetail.dnaVersions[0]!, status: 'approved', approval: {
      id: 'approval-ui-smoke', qaResultId: qaResult.id, acknowledgedAdaptNotCopy: true, acknowledgedQAReview: true,
      approvedBy: 'authenticated_user', approvedAt: now,
    },
  }],
  nextAction: 'prepare_target_application',
}
assert.equal(toEditReferenceInspectorView(approvedDetail).dnaStatus, 'Version 1 · approved')
assert.equal(toEditReferenceInspectorView(approvedDetail).qaStatus, 'Review acknowledged')
assert.equal(toEditReferenceInspectorView(approvedDetail).nextAction, 'Ready for a target edit')

console.log('edit_reference_ui_adapter_passed')
