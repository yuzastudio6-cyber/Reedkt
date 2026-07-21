import type { EditReferenceDetail, EditReferenceListItem } from '../types/edit-reference'
import { resolvePreferenceSkillRunResultState } from './edit-reference-skill-result-state'

export interface EditReferenceSavedCardView {
  id: string
  name: string
  referenceStatus: string
  studyStatus: string
  latestActivityAt: string
  dnaStatus: string
  applicationCount: number
  messageCount: number
}

export interface EditReferenceInspectorView {
  studyStatus: string
  evidenceStatus: string
  skillStatus: string
  sourceEvidenceCount: number
  findingCount: number
  copySafetyStatus: string
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
    dnaStatus: item.reference.dnaStatus === 'not_generated'
      ? 'DNA not generated'
      : item.reference.dnaStatus === 'approved'
        ? 'DNA approved'
        : 'DNA review required',
    applicationCount: item.applicationCount,
    messageCount: item.messageCount,
  }
}

export function toEditReferenceInspectorView(detail: EditReferenceDetail): EditReferenceInspectorView {
  const sourceEvidence = detail.evidence.filter((record) => record.sourceType !== 'derived_skill_evidence')
  const supersededEvidenceIds = new Set(sourceEvidence.map((record) => record.supersedesEvidenceId).filter(Boolean))
  const activeSourceEvidence = sourceEvidence.filter((record) => !supersededEvidenceIds.has(record.id))
  const findings = detail.evidence.filter((record) => record.sourceType === 'derived_skill_evidence')
  const copySafety = findings.filter((record) => record.category === 'copy_safety').at(-1)
  const latestOrchestrationId = detail.skillRuns.at(-1)?.orchestrationId
  const latestRuns = latestOrchestrationId
    ? detail.skillRuns.filter((record) => record.orchestrationId === latestOrchestrationId)
    : []
  const resultStateCounts = latestRuns.reduce<Record<string, number>>((counts, run) => {
    const state = resolvePreferenceSkillRunResultState(run)
    counts[state] = (counts[state] ?? 0) + 1
    return counts
  }, {})
  const latestDNAVersion = detail.dnaVersions.slice().sort((left, right) => right.version - left.version)[0]
  const latestQAResult = latestDNAVersion
    ? detail.dnaQaResults.find((record) => record.dnaVersionId === latestDNAVersion.id)
    : undefined
  return {
    studyStatus: label(detail.study.status),
    evidenceStatus: activeSourceEvidence.length === 0
      ? 'Study evidence not complete'
      : detail.study.evidenceStatus === 'ready_to_study'
        ? `${activeSourceEvidence.length} source${activeSourceEvidence.length === 1 ? '' : 's'} ready to study`
        : label(detail.study.evidenceStatus),
    skillStatus: latestRuns.length === 0 ? 'No evidence study yet' : summarizeSkillResultStates(resultStateCounts),
    sourceEvidenceCount: activeSourceEvidence.length,
    findingCount: findings.length,
    copySafetyStatus: copySafety?.transferability === 'do_not_copy'
      ? 'Review required'
      : copySafety
        ? 'Transferability checked'
        : 'Not checked yet',
    dnaStatus: latestDNAVersion ? `Version ${latestDNAVersion.version} · ${label(latestDNAVersion.status)}` : 'DNA not generated yet',
    qaStatus: !latestQAResult
      ? 'QA not run'
      : latestDNAVersion?.status === 'approved' && latestQAResult.status === 'requires_user_review'
        ? 'Review acknowledged'
        : latestQAResult.status === 'passed'
          ? 'QA passed'
          : latestQAResult.status === 'blocked'
            ? 'QA blocked'
            : 'QA review required',
    nextAction: detail.nextAction === 'answer_setup_questions'
      ? 'Answer the setup questions'
      : detail.nextAction === 'add_reference_evidence'
        ? 'Add reference evidence'
        : detail.nextAction === 'run_evidence_study'
          ? 'Study the saved evidence'
          : detail.nextAction === 'monitor_evidence_study'
            ? 'Whole-video study in progress'
            : detail.nextAction === 'review_study_findings'
              ? 'Review study findings'
              : detail.nextAction === 'add_missing_evidence'
                ? 'Add missing evidence'
                : detail.nextAction === 'generate_preference_dna'
                  ? 'Generate Preference DNA'
                  : detail.nextAction === 'review_preference_dna'
                    ? 'Review Preference DNA'
                    : detail.nextAction === 'run_preference_dna_qa'
                      ? 'Run Preference DNA QA'
                      : detail.nextAction === 'correct_preference_dna'
                        ? 'Correct blocked DNA'
                        : detail.nextAction === 'approve_preference_dna'
                          ? 'Approve Preference DNA'
                          : detail.nextAction === 'prepare_target_application'
                            ? 'Ready for a target edit'
        : 'Reference is archived',
  }
}

function summarizeSkillResultStates(counts: Record<string, number>): string {
  const labels: Array<[string, string]> = [
    ['analyzed', 'analyzed'],
    ['manual_evidence', 'manual evidence'],
    ['fallback', 'fallback'],
    ['needs_more_evidence', 'need more evidence'],
    ['blocked', 'blocked'],
  ]
  return labels
    .flatMap(([state, label]) => counts[state] ? [`${counts[state]} ${label}`] : [])
    .join(' · ')
}

function label(value: string): string {
  return value.replaceAll('_', ' ')
}
