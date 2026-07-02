import type {
  ProjectEditBriefQAFinding,
  ProjectEditBriefQAPackage,
  ProjectEditBriefQAValidationResult,
  ProjectEditBriefMarkerQAPackage,
} from '../../types/project-edit-brief-qa'
import {
  PROJECT_EDIT_BRIEF_QA_SAFETY_FLAGS,
} from '../../lib/project-edit-brief-qa-rules'

function validation(input: {
  ok: boolean
  blockedReasons?: string[]
  warnings?: string[]
}): ProjectEditBriefQAValidationResult {
  const blockedReasons = input.blockedReasons ?? []
  return {
    ok: input.ok,
    blocked: blockedReasons.length > 0,
    blockedReasons,
    warnings: input.warnings ?? [],
    mockOnly: true,
    ...PROJECT_EDIT_BRIEF_QA_SAFETY_FLAGS,
  }
}

export function validateProjectEditBriefQAFinding(finding: ProjectEditBriefQAFinding): ProjectEditBriefQAValidationResult {
  const blockedReasons: string[] = []
  if (!finding.mockOnly) blockedReasons.push('QA finding must remain mockOnly.')
  if (!finding.title.trim()) blockedReasons.push('QA finding title is required.')
  if (!finding.summary.trim()) blockedReasons.push('QA finding summary is required.')
  return validation({
    ok: blockedReasons.length === 0,
    blockedReasons,
    warnings: ['QA finding validation is deterministic and local.'],
  })
}

export function validateProjectEditBriefMarkerQAPackage(markerPackage: ProjectEditBriefMarkerQAPackage): ProjectEditBriefQAValidationResult {
  const blockedReasons: string[] = []
  if (!markerPackage.mockOnly) blockedReasons.push('Marker QA package must remain mockOnly.')
  if (!markerPackage.markerId) blockedReasons.push('Marker ID is required.')
  if (!markerPackage.findings.length) blockedReasons.push('Marker QA package must contain at least one finding.')
  return validation({
    ok: blockedReasons.length === 0,
    blockedReasons,
    warnings: ['Marker QA package does not apply markers to a plan.'],
  })
}

export function validateProjectEditBriefQAPackage(qaPackage: ProjectEditBriefQAPackage): ProjectEditBriefQAValidationResult {
  const blockedReasons: string[] = []
  if (!qaPackage.mockOnly) blockedReasons.push('Brief QA package must remain mockOnly.')
  if (!qaPackage.briefId) blockedReasons.push('Brief ID is required.')
  if (qaPackage.markerPackages.length !== qaPackage.markerCount) blockedReasons.push('Marker count does not match marker package count.')
  return validation({
    ok: blockedReasons.length === 0,
    blockedReasons,
    warnings: ['Brief QA package is mock/local only.'],
  })
}

export function validateNoProjectEditBriefQASideEffects(flags: Record<string, unknown>): ProjectEditBriefQAValidationResult {
  const unsafe = Object.entries(flags).filter(([, value]) => value === true).map(([key]) => key)
  return validation({
    ok: unsafe.length === 0,
    blockedReasons: unsafe.map((key) => `${key} must remain false.`),
    warnings: unsafe.length
      ? ['Unsafe QA side-effect flag detected.']
      : ['All QA side-effect flags remain false.'],
  })
}

export function createProjectEditBriefQAValidationSummary(result: ProjectEditBriefQAValidationResult): string {
  return result.ok
    ? 'Edit Brief QA validation passed with all side-effect flags false.'
    : `Edit Brief QA validation blocked: ${result.blockedReasons.join(' ')}`
}
