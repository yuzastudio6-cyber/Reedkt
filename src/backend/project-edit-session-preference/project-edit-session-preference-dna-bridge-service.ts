import type {
  ProjectEditSessionPreferenceApplicationStatus,
  ProjectEditSessionPreferenceOption,
} from '../../types/project-edit-session-preference'

type PreferenceDNAQADecision =
  | 'approved_mock'
  | 'approved_with_warnings'
  | 'requires_user_review'
  | 'requires_more_evidence'
  | 'blocked_copy_risk'
  | 'blocked_missing_do_not_copy'
  | 'blocked_low_confidence'
  | 'blocked_side_effect_risk'
  | 'failed_validation'

export interface ProjectEditSessionPreferenceDNABridge {
  option: ProjectEditSessionPreferenceOption
  status: ProjectEditSessionPreferenceApplicationStatus
  dnaApplicationId?: string
  dnaStatusLabel?: string
  dnaQAStatusLabel?: string
  doNotCopyRules: string[]
  blockedReasons: string[]
  warnings: string[]
  requiresUserReview: boolean
  mockOnly: true
}

const DEFAULT_DO_NOT_COPY_RULES = [
  'Do not copy reference videos shot-for-shot.',
  'Do not copy exact timing, exact music, exact SFX, exact graphic layout, creator identity, or person identity.',
  'Do not use reference visuals as project footage.',
]

function normalizedDecision(label: string | undefined): PreferenceDNAQADecision | undefined {
  const value = label?.toLowerCase().replaceAll(' ', '_')
  const allowed: PreferenceDNAQADecision[] = [
    'approved_mock',
    'approved_with_warnings',
    'requires_user_review',
    'requires_more_evidence',
    'blocked_copy_risk',
    'blocked_missing_do_not_copy',
    'blocked_low_confidence',
    'blocked_side_effect_risk',
    'failed_validation',
  ]
  return allowed.includes(value as PreferenceDNAQADecision) ? value as PreferenceDNAQADecision : undefined
}

export function mapDNAQAToSessionPreferenceStatus(
  qaDecision: PreferenceDNAQADecision | string | undefined,
  hasDoNotCopyRules = true,
): ProjectEditSessionPreferenceApplicationStatus {
  const decision = typeof qaDecision === 'string'
    ? normalizedDecision(qaDecision) ?? qaDecision
    : qaDecision
  if (decision === 'approved_mock') return 'dna_applied_mock'
  if (decision === 'approved_with_warnings') return 'dna_applied_with_warnings_mock'
  if (decision === 'requires_user_review') return 'dna_requires_user_review'
  if (decision === 'requires_more_evidence') return hasDoNotCopyRules ? 'dna_conservative_hints_only' : 'legacy_preference_applied'
  if (
    decision === 'blocked_copy_risk' ||
    decision === 'blocked_missing_do_not_copy' ||
    decision === 'blocked_low_confidence' ||
    decision === 'blocked_side_effect_risk'
  ) return 'dna_blocked_by_qa'
  if (decision === 'failed_validation') return 'failed_validation'
  return 'dna_applied_mock'
}

export function createDNADoNotCopyRulesForSession(option: ProjectEditSessionPreferenceOption): string[] {
  return option.doNotCopyRulesActive ? DEFAULT_DO_NOT_COPY_RULES : []
}

export function createProjectEditSessionPreferenceDNABridge(
  option: ProjectEditSessionPreferenceOption,
): ProjectEditSessionPreferenceDNABridge {
  if (!option.hasDNA) {
    return {
      option,
      status: option.sourceKind === 'none' ? 'not_selected' : 'legacy_preference_applied',
      doNotCopyRules: [],
      blockedReasons: [],
      warnings: option.sourceKind === 'none' ? [] : ['Legacy no-DNA preference fallback active.'],
      requiresUserReview: false,
      mockOnly: true,
    }
  }
  const status = mapDNAQAToSessionPreferenceStatus(option.dnaQAStatusLabel, option.doNotCopyRulesActive)
  const blockedReasons = status === 'dna_blocked_by_qa' || status === 'failed_validation'
    ? [`DNA QA status ${option.dnaQAStatusLabel ?? 'unknown'} blocks mock DNA application.`]
    : []
  return {
    option,
    status,
    dnaApplicationId: `${option.id}-edit-session-dna-application`,
    dnaStatusLabel: status === 'dna_blocked_by_qa' ? 'Preference DNA blocked by QA' : option.dnaStatusLabel ?? 'Preference DNA applied',
    dnaQAStatusLabel: option.dnaQAStatusLabel ?? 'approved mock',
    doNotCopyRules: createDNADoNotCopyRulesForSession(option),
    blockedReasons,
    warnings: [
      ...(option.requiresUserReview ? ['Preference DNA requires user review before approval.'] : []),
      ...(status === 'dna_conservative_hints_only' ? ['Conservative DNA hints only; risky layers remain blocked.'] : []),
    ],
    requiresUserReview: option.requiresUserReview || status === 'dna_requires_user_review',
    mockOnly: true,
  }
}

export function loadPreferenceDNASummaryForSessionPreference(option: ProjectEditSessionPreferenceOption): string[] {
  const bridge = createProjectEditSessionPreferenceDNABridge(option)
  return [
    `${option.handle ?? option.name}: ${bridge.status}.`,
    bridge.doNotCopyRules.length ? `${bridge.doNotCopyRules.length} do-not-copy rule(s) active.` : 'No DNA do-not-copy rules active.',
    bridge.requiresUserReview ? 'Review warning required.' : 'No review warning required.',
  ]
}

export function createProjectEditSessionPreferenceDNABridgeSummary(bridge: ProjectEditSessionPreferenceDNABridge): string[] {
  return [
    `DNA bridge status: ${bridge.status}.`,
    bridge.dnaApplicationId ? `DNA application id: ${bridge.dnaApplicationId}.` : 'No DNA application id.',
    bridge.blockedReasons.length ? `Blocked: ${bridge.blockedReasons.join(' ')}` : 'No DNA bridge blockers.',
  ]
}
