import type {
  AutonomousEditPlanDraft,
  AutonomousEditPreferenceApplicationSnapshot,
} from '../../src/types/autonomous-edit-planning'

export const EDIT_REFERENCE_PLAN_QA_CHECKS = [
  'edit_reference_application_digest_matches',
  'edit_reference_target_context_matches',
  'edit_reference_precedence_preserved',
  'edit_reference_active_guidance_traced',
  'edit_reference_held_back_rules_excluded',
  'edit_reference_do_not_copy_rules_pass',
] as const

export interface AutonomousEditPreferenceComplianceResult {
  status: 'not_applicable' | 'passed' | 'blocked'
  applicationId?: string
  applicationContentDigest?: string
  contextHash?: string
  dnaVersionId?: string
  activeDecisionIds: string[]
  referencedDecisionIds: string[]
  heldBackDecisionIds: string[]
  checks: string[]
  findings: string[]
}

export function validateAutonomousEditPreferenceCompliance(
  plan: AutonomousEditPlanDraft,
): AutonomousEditPreferenceComplianceResult {
  const application = plan.preferenceApplication
  if (!application) {
    return {
      status: 'not_applicable',
      activeDecisionIds: [],
      referencedDecisionIds: [],
      heldBackDecisionIds: [],
      checks: [],
      findings: [],
    }
  }

  const findings = validateApplicationSnapshot(application, plan)
  if (plan.referenceEvidence) {
    findings.push('An exact Preference Application plan must not carry a parallel raw-reference analysis path.')
  }
  const decisions = new Map(application.decisions.map((decision) => [decision.decisionId, decision]))
  const activeDecisionIds = application.decisions
    .filter((decision) => decision.decision === 'applied' || decision.decision === 'adapted')
    .map((decision) => decision.decisionId)
  const heldBackDecisionIds = application.decisions
    .filter((decision) => decision.decision !== 'applied' && decision.decision !== 'adapted')
    .map((decision) => decision.decisionId)
  const referencedDecisionIds = new Set<string>()
  for (const segment of plan.segments) {
    for (const operation of segment.operations) {
      const refs = operation.preferenceDecisionRefs ?? []
      if (new Set(refs).size !== refs.length) {
        findings.push(`Operation ${operation.operationId} in ${segment.id} repeats a Preference Application decision reference.`)
      }
      for (const decisionId of refs) {
        const decision = decisions.get(decisionId)
        if (!decision) {
          findings.push(`Operation ${operation.operationId} in ${segment.id} cites unknown Preference Application decision ${decisionId}.`)
          continue
        }
        if (decision.decision !== 'applied' && decision.decision !== 'adapted') {
          findings.push(`Held-back Edit Reference decision ${decisionId} was attached to executable operation ${operation.operationId}.`)
          continue
        }
        referencedDecisionIds.add(decisionId)
      }
    }
  }
  for (const decisionId of activeDecisionIds) {
    if (!referencedDecisionIds.has(decisionId)) {
      findings.push(`Active Edit Reference decision ${decisionId} is not traced to an executable plan operation.`)
    }
  }
  const generatedPlanText = JSON.stringify({
    title: plan.title,
    summary: plan.summary,
    userIntentSummary: plan.userIntentSummary,
    storyStrategy: plan.storyStrategy,
    segments: plan.segments,
    skillSelections: plan.skillSelections,
    globalQaChecks: plan.globalQaChecks,
  }).toLowerCase()
  if (/copy exactly|recreate exact|clone (?:the )?(?:reference|creator)|shot[- ]for[- ]shot/i.test(generatedPlanText)) {
    findings.push('The generated plan contains unsafe exact-copy direction.')
  }
  for (const decision of application.decisions) {
    if (decision.decision === 'applied' || decision.decision === 'adapted') continue
    const heldBackInstruction = decision.targetInstruction.trim().toLowerCase()
    if (heldBackInstruction.length >= 12 && generatedPlanText.includes(heldBackInstruction)) {
      findings.push(`Held-back Edit Reference decision ${decision.decisionId} leaked into executable plan text.`)
    }
  }
  for (const check of EDIT_REFERENCE_PLAN_QA_CHECKS) {
    if (!plan.globalQaChecks.includes(check)) findings.push(`Required Edit Reference QA check is missing: ${check}.`)
  }

  return {
    status: findings.length === 0 ? 'passed' : 'blocked',
    applicationId: application.applicationId,
    applicationContentDigest: application.applicationContentDigest,
    contextHash: application.contextHash,
    dnaVersionId: application.dnaVersionId,
    activeDecisionIds,
    referencedDecisionIds: [...referencedDecisionIds],
    heldBackDecisionIds,
    checks: [...EDIT_REFERENCE_PLAN_QA_CHECKS],
    findings,
  }
}

function validateApplicationSnapshot(
  application: AutonomousEditPreferenceApplicationSnapshot,
  plan: AutonomousEditPlanDraft,
): string[] {
  const findings: string[] = []
  if (application.version !== 'autonomous-edit-preference-application-v1') findings.push('Preference Application snapshot version is unsupported.')
  if (!/^[a-f0-9]{64}$/i.test(application.applicationContentDigest)) findings.push('Preference Application digest is invalid.')
  if (!/^[a-f0-9]{64}$/i.test(application.contextHash)) findings.push('Preference Application context hash is invalid.')
  if (!/^[a-f0-9]{64}$/i.test(application.dnaContentDigest)) findings.push('Preference DNA digest is invalid.')
  if (!/^[a-f0-9]{64}$/i.test(application.targetContextDigest)) findings.push('Target context digest is invalid.')
  if (application.projectId !== plan.projectId || application.editSessionId !== plan.editSessionId) {
    findings.push('Preference Application target does not match the plan target.')
  }
  if (application.exactRepositoryReadVerified !== true || application.resolvedFrom !== 'private_edit_reference_repository') {
    findings.push('Preference Application was not resolved from exact private authority.')
  }
  if (application.rawReferenceMediaIncluded !== false || application.rawProviderPayloadIncluded !== false) {
    findings.push('Preference Application snapshot includes forbidden raw reference material.')
  }
  if (application.doNotCopyRules.length === 0) findings.push('Preference Application has no do-not-copy rules.')
  const decisionIds = application.decisions.map((decision) => decision.decisionId)
  if (new Set(decisionIds).size !== decisionIds.length) findings.push('Preference Application contains duplicate decision IDs.')
  if (!application.decisions.some((decision) => decision.decision === 'applied' || decision.decision === 'adapted')) {
    findings.push('Preference Application has no active target-adapted guidance.')
  }
  if (application.decisions.some((decision) => decision.decision === 'needs_clarification')) {
    findings.push('Preference Application still contains unresolved clarification decisions.')
  }
  for (const decision of application.decisions) {
    if ((decision.decision === 'applied' || decision.decision === 'adapted') && (
      !decision.targetInstruction.trim()
      || /copy exactly|recreate exact|clone (?:the )?(?:reference|creator)|shot[- ]for[- ]shot/i.test(decision.targetInstruction)
    )) {
      findings.push(`Active Edit Reference decision ${decision.decisionId} is not a safe target-adapted instruction.`)
    }
  }
  const expectedPrecedence = [
    'safety_platform_tier_frame_credit_or_approved_constraint',
    'current_user_instruction',
    'target_context',
    'approved_preference_dna',
  ]
  if (JSON.stringify(application.precedencePolicy) !== JSON.stringify(expectedPrecedence)) {
    findings.push('Preference Application precedence policy changed.')
  }
  return findings
}
