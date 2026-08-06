import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import {
  CAPTION_POST_CAP20_GOAL_COMPLETION_AUDIT,
  parseCaptionGoalCompletionAudit,
} from '../captions-specialist/caption-goal-completion-audit'
import {
  CAPTION_CURRENT_PRIVATE_INTERNAL_EVIDENCE_PROGRESS,
  parseCaptionPrivateInternalEvidenceProgress,
} from '../captions-specialist/caption-private-internal-evidence-progress'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'

let assertions = 0
function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
  assertions += 1
}
function expectThrow(action: () => unknown): void {
  assert.throws(action)
  assertions += 1
}
function changed(
  value: unknown,
  edit: (record: Record<string, unknown>) => void,
): Record<string, unknown> {
  const record = structuredClone(value) as Record<string, unknown>
  edit(record)
  return record
}
function redigest(value: Record<string, unknown>): Record<string, unknown> {
  return {
    ...value,
    auditDigestSha256: calculateSkillContractDigest(
      { ...value, auditDigestSha256: '' }, 'auditDigestSha256'),
  }
}

const audit = parseCaptionGoalCompletionAudit(
  CAPTION_POST_CAP20_GOAL_COMPLETION_AUDIT)
const current = parseCaptionPrivateInternalEvidenceProgress(
  CAPTION_CURRENT_PRIVATE_INTERNAL_EVIDENCE_PROGRESS)

check(audit.counts.declaredCaptionJobs === 41
  && audit.counts.currentlyAdmittedJobs === 29
  && audit.counts.conditionalSharedOwnerJobs === 12,
'audit preserves the exact CAP-20 job accounting')
check(audit.counts.requiredSharedOwners === 5
  && audit.counts.authenticatedPrivateSharedOwnerIntegrations === 0,
'audit does not relabel typed boundaries as authenticated integration')
check(audit.completedEvidence.captionFeatureModulesComplete
  && audit.completedEvidence.standalonePlanningRuntimeAndHarnessComplete
  && audit.completedEvidence.boundedSequentialSupportResumeProved,
'audit preserves completed Caption-owned runtime and harness evidence')
check(audit.completedEvidence.actualPrivateRenderedMediaEvidencePresent
  && audit.completedEvidence.directRenderedRasterInspectionPresent,
'audit preserves actual rendered media and direct raster inspection')
check(!audit.terminalEvidence.canonicalBackendPrivateExecutionMounted
  && !audit.terminalEvidence.fullConditionalJobSurfaceIntegrated,
'audit distinguishes module completion from canonical private mounting')
check(!audit.terminalEvidence.qualifiedAiCompleteTimeVisualReviewIntegrated
  && !audit.terminalEvidence.independentFinalQaRereadIntegrated,
'audit keeps visual-AI and independent final QA evidence open')
check(!audit.terminalEvidence.finalPerJobQualificationProjectionPublished
  && !audit.terminalStatusClaimed,
'audit refuses terminal qualification before the final projection')
check(audit.gaps.length === 9
  && new Set(audit.gaps.map((item) => item.gapId)).size === 9,
'audit lists each exact terminal gap once')
check(audit.gaps.every((item) => item.blocksTerminalStatus
  && !item.captionMayImplementDuplicateOwner
  && !item.runtimeOrDispatchAuthorityGrantedByAudit),
'every gap remains fail closed without duplicate-owner authority')
check(audit.gaps.find((item) =>
  item.gapId === 'qualified_ai_complete_time_visual_review')
  ?.ownerKeys.includes('canonical_postrender_visual_qa'),
'complete-time visual AI stays with the canonical shared owner')
check(audit.gaps.find((item) =>
  item.gapId === 'final_per_job_qualification_projection')
  ?.ownerKeys.includes('captions'),
'Caption retains final per-job qualification projection ownership')
check(!audit.publicProductionRequiredForTerminalStatus
  && !audit.centralOrchestraRequiredForTerminalStatus
  && !audit.centralOrchestraImplemented,
'private qualification does not require public production or Orchestra')
check(!audit.operationDispatchAuthority
  && !audit.providerOrModelRuntimeAuthority
  && !audit.assetMutationAuthority
  && !audit.finalQaApprovalAuthority
  && !audit.creditOrBillingAuthority
  && !audit.publicDeliveryAuthority
  && !audit.productionAuthority,
'audit grants no external authority')
check(current.counts.captionOwnedImplementationsComplete === 41
  && current.counts.sourcePathsReadyForPrivateEvidenceRun === 41
  && current.counts.canonicalOwnerCompositionMountsComplete === 5,
'current evidence supersedes the historical pre-mount 29/41 source snapshot')
check(current.counts.terminalPrivateInternalQualifiedJobs === 0
  && current.counts.terminalEvidenceGatesSatisfied === 0
  && current.gates.length === 9,
'current evidence keeps all nine terminal gates open without losing progress')
check(current.gates.find((gate) =>
  gate.gapId === 'canonical_transcript_owner_authenticated_read')?.evidenceRefs
  .some((reference) => reference.version ===
    'canonical-caption-transcript-correction-review-package-v1'),
'current audit includes the real transcript review preparation package')

expectThrow(() => parseCaptionGoalCompletionAudit({
  ...audit, unknownField: true,
}))
expectThrow(() => parseCaptionGoalCompletionAudit({
  ...audit, auditDigestSha256: '0'.repeat(64),
}))
expectThrow(() => parseCaptionGoalCompletionAudit(redigest(changed(
  audit, (record) => {
    record.gaps = (record.gaps as unknown[]).slice(1)
  }))))
expectThrow(() => parseCaptionGoalCompletionAudit(redigest(changed(
  audit, (record) => {
    const gaps = record.gaps as Array<Record<string, unknown>>
    gaps[0].ownerKeys = ['captions']
  }))))
expectThrow(() => parseCaptionGoalCompletionAudit(redigest(changed(
  audit, (record) => {
    const terminal = record.terminalEvidence as Record<string, unknown>
    terminal.qualifiedAiCompleteTimeVisualReviewIntegrated = true
  }))))
expectThrow(() => parseCaptionGoalCompletionAudit(redigest(changed(
  audit, (record) => { record.terminalStatusClaimed = true }))))
expectThrow(() => parseCaptionGoalCompletionAudit(redigest(changed(
  audit, (record) => { record.operationDispatchAuthority = true }))))
expectThrow(() => parseCaptionGoalCompletionAudit(redigest(changed(
  audit, (record) => {
    const ref = record.sourceCap20ReleaseRef as Record<string, unknown>
    ref.contentHash = '1'.repeat(64)
  }))))

const inherited = Object.create({ productionAuthority: true }) as
Record<string, unknown>
Object.assign(inherited, audit)
expectThrow(() => parseCaptionGoalCompletionAudit(inherited))
const cyclic = structuredClone(audit) as unknown as Record<string, unknown>
cyclic.cycle = cyclic
expectThrow(() => parseCaptionGoalCompletionAudit(cyclic))

const document = readFileSync(join(process.cwd(), 'docs/caption-direction',
  'post-cap20-goal-completion-audit.md'), 'utf8')
check(document.includes('caption_private_internal_evidence_in_progress')
  && document.includes('caption_specialist_private_internal_qualified')
  && document.includes('qualified complete-time visual-AI review'),
'completion-audit documentation preserves current and target truth')
check(document.includes('41/41') && document.includes('5/5')
  && document.includes('historical'),
'completion-audit documentation distinguishes current and historical counts')

console.log(JSON.stringify({
  smoke: 'captions_specialist_goal_completion_audit',
  assertions,
  historicalAuditVersion: audit.schemaVersion,
  currentStatus: current.terminalStatus,
  targetTerminalStatus: current.targetTerminalStatus,
  captionOwnedImplementationsComplete:
    current.counts.captionOwnedImplementationsComplete,
  sourcePathsReadyForPrivateEvidenceRun:
    current.counts.sourcePathsReadyForPrivateEvidenceRun,
  canonicalOwnerCompositionMountsComplete:
    current.counts.canonicalOwnerCompositionMountsComplete,
  remainingTerminalGaps: current.counts.terminalEvidenceGates,
  terminalStatusClaimed: current.terminalStatusClaimed,
  result: 'passed',
}, null, 2))
