import { buildCrossWorkstreamHandoffReport, crossWorkstreamHandoffRequiredScripts } from '../activation/cross-workstream-handoff-tracking'

const report = buildCrossWorkstreamHandoffReport()
const failures: string[] = []

if (report.ownerResponseSchema.requiredFields.length < 20) failures.push('Owner response schema is missing required fields.')
if (report.ownerResponseLedger.records.length !== 12) failures.push('Owner response ledger must include 12 workstreams.')
if (report.ownerResponseLedger.pendingResponses.length !== 8) failures.push('Initial pending owner count must be 8.')
if (report.ownerResponseLedger.acceptedWithBlockersResponses.length !== 4) failures.push('Initial accepted-with-blockers owner count must be 4.')
if (report.ownerPromptPacketRefs.length !== 12) failures.push('Owner prompt packet references must include 12 records.')
if (!report.intakeManifest.blockedFeatures.includes('owner_prompt_execution')) failures.push('Owner prompt execution must be blocked.')
if (!report.intakeManifest.blockedFeatures.includes('worker_execution')) failures.push('Worker execution must be blocked.')
if (!report.intakeManifest.blockedFeatures.includes('production_ready')) failures.push('Production must remain blocked.')
if (!report.syncInput || report.syncInput.phaseId !== '52H') failures.push('Phase 52H Supabase sync input is missing.')
if (!['ready_for_owner_response_intake_update', 'pause_pending_owner_responses', 'blocked'].includes(report.phase52IReadiness)) failures.push('Phase52I readiness value is invalid.')

for (const script of crossWorkstreamHandoffRequiredScripts) {
  if (!report.commandPlan.allowedCommands.length) failures.push(`Command plan missing allowed commands for ${script}.`)
}

if (report.qa.status !== 'passed') failures.push(`Static QA should pass, got ${report.qa.status}: ${report.qa.blockers.join('; ')}`)

if (failures.length) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log('Phase 52H cross-workstream handoff tracking smoke passed.')
