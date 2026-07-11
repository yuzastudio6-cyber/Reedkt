import type { EditReferenceDetail, EditReferenceListItem } from '../types/edit-reference'

export interface EditReferenceSavedCardView {
  id: string
  name: string
  referenceStatus: string
  studyStatus: string
  latestActivityAt: string
  dnaStatus: string
  appliedEditCount: number
  messageCount: number
}

export interface EditReferenceInspectorView {
  studyStatus: string
  evidenceStatus: string
  skillStatus: string
  dnaStatus: string
  qaStatus: string
  nextAction: string
}

export function toEditReferenceSavedCardView(item: EditReferenceListItem): EditReferenceSavedCardView {
  return {
    id: item.reference.id,
    name: item.reference.name,
    referenceStatus: label(item.reference.status),
    studyStatus: label(item.currentStudy.status),
    latestActivityAt: item.reference.updatedAt,
    dnaStatus: item.reference.dnaStatus === 'not_generated' ? 'DNA not generated' : label(item.reference.dnaStatus),
    appliedEditCount: item.applicationCount,
    messageCount: item.messageCount,
  }
}

export function toEditReferenceInspectorView(detail: EditReferenceDetail): EditReferenceInspectorView {
  return {
    studyStatus: label(detail.study.status),
    evidenceStatus: detail.evidence.length === 0 ? 'Study evidence not complete' : label(detail.study.evidenceStatus),
    skillStatus: detail.skillRuns.length === 0 ? 'No analysis run yet' : `${detail.skillRuns.length} analysis runs recorded`,
    dnaStatus: detail.dnaVersions.length === 0 ? 'DNA not generated yet' : `${detail.dnaVersions.length} DNA versions`,
    qaStatus: detail.dnaQaResults.length === 0 ? 'QA not run' : `${detail.dnaQaResults.length} QA results`,
    nextAction: detail.nextAction === 'answer_setup_questions'
      ? 'Answer the setup questions'
      : detail.nextAction === 'add_reference_evidence'
        ? 'Add reference evidence'
        : 'Reference is archived',
  }
}

function label(value: string): string {
  return value.replaceAll('_', ' ')
}
