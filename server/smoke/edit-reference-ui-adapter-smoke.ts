import assert from 'node:assert/strict'
import { toEditReferenceInspectorView, toEditReferenceSavedCardView } from '../../src/lib/edit-reference-ui-adapter'
import { EDIT_REFERENCE_GATE_1_SAFETY_FLAGS, type EditReferenceDetail, type EditReferenceListItem } from '../../src/types/edit-reference'

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
  appliedEditCount: 0,
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

console.log('edit_reference_ui_adapter_passed')
