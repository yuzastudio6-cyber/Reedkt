import { existsSync, readFileSync } from 'node:fs'
import {
  DEMUCS_PROVENANCE_EXPECTED_REPORT_FILES,
  DEMUCS_PROVENANCE_REPORT_DIR,
  buildDemucsLicenseEvidence,
  buildDemucsModelCandidateInventory,
  buildDemucsProvenanceDecision,
  buildDemucsRuntimeRiskReport,
  buildDemucsSourceEvidence,
  buildDemucsTrainingDataProvenanceReport,
  buildDemucsWeightArtifactSourcePolicy,
  getDemucsProvenancePlan,
} from '../activation/demucs-provenance-approval'

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message)
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
const moduleSource = readFileSync('server/activation/demucs-provenance-approval/index.ts', 'utf8')
const plan = getDemucsProvenancePlan()
const sourceEvidence = buildDemucsSourceEvidence()
const licenseEvidence = buildDemucsLicenseEvidence()
const modelInventory = buildDemucsModelCandidateInventory()
const trainingDataReport = buildDemucsTrainingDataProvenanceReport()
const weightPolicy = buildDemucsWeightArtifactSourcePolicy()
const runtimeRisk = buildDemucsRuntimeRiskReport()
const decision = buildDemucsProvenanceDecision()

for (const script of [
  'activation:demucs-provenance:plan',
  'activation:demucs-provenance',
  'activation:demucs-provenance:report',
  'activation:demucs-provenance:web-research',
  'activation:demucs-provenance:iam-plan',
  'activation:demucs-provenance:cost-summary',
  'activation:demucs-provenance:summary',
  'smoke:activation-demucs-provenance',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

assert(plan.noPackageInstall === true, 'Phase 36K must not install packages.')
assert(plan.noModelDownload === true, 'Phase 36K must not download model weights.')
assert(plan.noRuntimeExecution === true, 'Phase 36K must not execute Demucs runtime.')
assert(plan.noSourceSeparation === true, 'Phase 36K must not run source separation.')
assert(plan.noMediaProcessing === true, 'Phase 36K must not process media.')
assert(plan.noCloudMutation === true, 'Phase 36K must not mutate cloud/IAM.')
assert(plan.noProviderCalls === true, 'Phase 36K must not call providers.')
assert(plan.noTrackA === true, 'Phase 36K must not touch Track A.')

for (const forbidden of [
  'REEDITPRO_CONFIRM_DEMUCS_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_DEMUCS_MODEL_DOWNLOAD',
  'REEDITPRO_CONFIRM_DEMUCS_MODEL_STAGING',
  'REEDITPRO_CONFIRM_DEMUCS_SOURCE_SEPARATION',
  'REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_OCR_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_TRACK_A_RUNTIME',
]) {
  assert((plan.forbiddenConfirmations as readonly string[]).includes(forbidden), `Forbidden confirmation is not blocked: ${forbidden}`)
}

assert(sourceEvidence.status === 'source_evidence_present', 'Source evidence missing.')
assert(licenseEvidence.status === 'code_and_package_license_evidenced_model_weights_not_approved', 'License/model-weight status mismatch.')
assert(modelInventory.status === 'candidates_inventoried_no_candidate_approved', 'Model candidate inventory must not approve a candidate.')
assert(modelInventory.candidates.length >= 8, 'Expected Demucs model candidate inventory is incomplete.')
assert(trainingDataReport.status === 'blocked_pending_training_data_provenance', 'Training data provenance must remain blocked.')
assert(weightPolicy.status === 'no_weight_artifact_source_approved', 'Weight artifact policy must block artifacts.')
assert(runtimeRisk.status === 'runtime_not_approved', 'Runtime risk status must block runtime.')
assert(decision.demucsDecision === 'blocked_pending_training_data_provenance', 'Default Demucs decision must stay blocked.')
assert(decision.approvedForPhase36L === false, 'Phase 36L must not be approved.')
assert(decision.audioTimingToolFamilyBetaStatus === 'phase-complete but tool-family incomplete', 'Audio/timing status mismatch.')

for (const reportFile of DEMUCS_PROVENANCE_EXPECTED_REPORT_FILES) {
  assert(reportFile.startsWith('phase_36k_'), `Unexpected report file name: ${reportFile}`)
}

assert(DEMUCS_PROVENANCE_REPORT_DIR.includes('phase-36k'), 'Phase 36K report directory mismatch.')
assert(moduleSource.includes('MUSDB-HQ plus an extra training dataset of 800 songs'), 'Extra-song provenance blocker missing.')
assert(moduleSource.includes('Creative Commons BY-NC-SA'), 'MUSDB noncommercial caveat missing.')
assert(moduleSource.includes('not_run_phase36k_policy_no_cloud_mutation'), 'No-cloud artifact policy missing.')
assert(!moduleSource.includes('child_process'), 'Demucs provenance module must not execute commands.')
assert(!moduleSource.includes('execFile'), 'Demucs provenance module must not execute commands.')
assert(!existsSync('server/workers/demucs-provenance-approval'), 'Phase 36K must not add a Demucs worker.')

console.log(JSON.stringify({
  status: 'passed',
  phase: '36K',
  demucsDecision: decision.demucsDecision,
  sourceSeparation: 'blocked',
  modelDownload: 'blocked',
  runtimeExecution: 'blocked',
  mediaProcessing: 'blocked',
  phase36L: 'blocked_without_human_legal_review',
  audioTimingToolFamilyBetaStatus: decision.audioTimingToolFamilyBetaStatus,
}, null, 2))
