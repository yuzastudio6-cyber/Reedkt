import { buildBetaReadinessOwnerApprovalPacket } from './beta-readiness-owner-approval-packet.mjs'

const PLATFORM_ATTESTATION_INPUTS = [
  'REEDITPRO_BETA_PLATFORM_RLS_READBACK_VERIFIED',
  'REEDITPRO_BETA_PLATFORM_RLS_READBACK_EVIDENCE',
  'REEDITPRO_BETA_PLATFORM_STRIPE_BOUNDARY_VERIFIED',
  'REEDITPRO_BETA_PLATFORM_STRIPE_BOUNDARY_EVIDENCE',
  'REEDITPRO_BETA_PLATFORM_MONITORING_VERIFIED',
  'REEDITPRO_BETA_PLATFORM_MONITORING_EVIDENCE',
  'REEDITPRO_BETA_PLATFORM_BILLING_QA_VERIFIED',
  'REEDITPRO_BETA_PLATFORM_BILLING_QA_EVIDENCE',
]

const REJECTED_SCOPE_FLAGS = [
  'REEDITPRO_BETA_LAUNCH_APPROVE_REAL_USER_MEDIA_BETA',
  'REEDITPRO_BETA_LAUNCH_APPROVE_PAID_PRODUCTION',
  'REEDITPRO_BETA_SCOPE_APPROVE_REAL_USER_MEDIA_BETA',
  'REEDITPRO_BETA_SCOPE_APPROVE_PAID_PRODUCTION',
  'REEDITPRO_BETA_PAID_PRODUCTION_APPROVE_LAUNCH',
]

const SECRET_PATTERNS = [
  /service[_-]?role/i,
  /supabase[_-]?service[_-]?role/i,
  /bearer\s+[a-z0-9._-]+/i,
  /\bsk-[a-z0-9_-]{8,}/i,
  /x-goog-signature=/i,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /aws_secret_access_key/i,
  /AIza[0-9A-Za-z_-]{20,}/,
]

export function buildBetaReadinessOwnerApprovalIntakePreflight(env = process.env) {
  const packet = buildBetaReadinessOwnerApprovalPacket()
  const platformApprovalInputs = packet.platformApprovalItems.map((item) => inputNameFromAssignment(item.approvalInput))
  const launchApprovalInputs = packet.launchApprovalItems.map((item) => inputNameFromAssignment(item.approvalInput))
  const approvalInputNames = [...platformApprovalInputs, ...launchApprovalInputs]
  const attestationBooleanInputs = PLATFORM_ATTESTATION_INPUTS.filter((name) => !name.endsWith('_EVIDENCE'))
  const booleanInputNames = new Set([...approvalInputNames, ...attestationBooleanInputs])
  const launchEvidenceInputs = packet.launchApprovalItems
    .map((item) => inputNameFromTemplate(item.evidenceInput))
    .filter(Boolean)
  const requiredInputs = [
    ...approvalInputNames,
    ...PLATFORM_ATTESTATION_INPUTS,
    ...launchEvidenceInputs,
  ]
  const uniqueRequiredInputs = [...new Set(requiredInputs)]
  const pendingInputs = uniqueRequiredInputs.filter((name) => !present(env[name]))
  const invalidBooleanInputs = uniqueRequiredInputs.filter((name) => (
    booleanInputNames.has(name) &&
    present(env[name]) &&
    !truthy(env[name])
  ))
  const rejectedScopeInputs = REJECTED_SCOPE_FLAGS.filter((name) => truthy(env[name]))
  const evidenceInputNames = [
    ...PLATFORM_ATTESTATION_INPUTS.filter((name) => name.endsWith('_EVIDENCE')),
    ...launchEvidenceInputs,
  ]
  const secretLikeInputPaths = evidenceInputNames
    .filter((name) => present(env[name]) && containsSecretLike(env[name]))
    .map((name) => `ownerApprovalEvidence.${name}`)
  const readyForDeployedEvidenceInputManifest = pendingInputs.length === 0 &&
    invalidBooleanInputs.length === 0 &&
    rejectedScopeInputs.length === 0 &&
    secretLikeInputPaths.length === 0

  return {
    ok: readyForDeployedEvidenceInputManifest,
    readyForDeployedEvidenceInputManifest,
    decision: readyForDeployedEvidenceInputManifest
      ? 'beta_readiness_owner_approval_intake_preflight_passed_ready_for_deployed_evidence_input_manifest'
      : 'beta_readiness_owner_approval_intake_preflight_blocked_missing_or_unsafe_owner_inputs',
    packetId: 'beta-readiness-owner-approval-intake-preflight-2026-06-28',
    sourceTruth: {
      ownerApprovalPacket: 'docs/beta-readiness/owner-approval-packet-current-gates/2026-06-28-owner-approval-packet-current-gates.json',
      manifestOwnerGapPacket: 'docs/beta-readiness/deployed-evidence-input-manifest/2026-06-28-d997-technical-inputs-owner-approval-gap.json',
      sourceSha: packet.sourceTruth.sourceSha,
      normalApiRevision: packet.sourceTruth.normalApiRevision,
      productReadyLocalOssCount: packet.productReadyLocalOssCount,
    },
    requiredInputCount: uniqueRequiredInputs.length,
    requiredInputs: uniqueRequiredInputs.map((name) => ({
      name,
      present: present(env[name]),
      explicitTrue: booleanInputNames.has(name) ? truthy(env[name]) : undefined,
      evidenceNote: name.endsWith('_EVIDENCE'),
    })),
    pendingInputs,
    invalidBooleanInputs,
    rejectedScopeInputs,
    secretLikeInputPaths,
    blockedScopes: packet.blockedScopes,
    supabaseClassification: packet.supabaseClassification,
    warnings: [
      'This preflight validates non-secret owner approval input presence and evidence-note safety only.',
      'It does not grant approval, call the deployed backend, record evidence, run tools, process media, write Supabase/GCS, enable external beta, or enable production.',
      'Owner evidence notes must be non-secret summaries; do not paste credentials, bearer tokens, signed URLs, raw prompts, private media, or public artifact links.',
    ],
  }
}

function inputNameFromAssignment(value) {
  return String(value).split('=')[0]
}

function inputNameFromTemplate(value) {
  const match = String(value).match(/^(REEDITPRO_[A-Z0-9_]+)/)
  return match?.[1]
}

function present(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function truthy(value) {
  return value === 'true' || value === '1'
}

function containsSecretLike(value) {
  const text = String(value)
  return SECRET_PATTERNS.some((pattern) => pattern.test(text))
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = buildBetaReadinessOwnerApprovalIntakePreflight(process.env)
  console.log(JSON.stringify(report, null, 2))
  if (!report.readyForDeployedEvidenceInputManifest) {
    process.exitCode = 1
  }
}
