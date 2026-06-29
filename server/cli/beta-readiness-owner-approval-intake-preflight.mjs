import { buildBetaReadinessOwnerApprovalPacket } from './beta-readiness-owner-approval-packet.mjs'

const STATUS_DECISION = 'beta_readiness_owner_approval_intake_status_passed_ready_for_owner_input_collection'

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

export function buildBetaReadinessOwnerApprovalEnvTemplate() {
  const report = buildBetaReadinessOwnerApprovalIntakePreflight({})
  const lines = [
    '# ReEditPro beta owner approval intake template',
    '# Fill values locally or in your secret manager/session only. Do not commit completed owner notes.',
    '# Approval and attestation booleans must be exactly true. Evidence notes must be non-secret summaries.',
    '# Do not paste service-role keys, bearer tokens, API keys, signed URLs, raw prompts, private media, or public artifact links.',
    '',
    '# Platform owner approvals',
    ...templateLines(report.requiredInputs.filter((input) => input.name.startsWith('REEDITPRO_BETA_PLATFORM_APPROVE_'))),
    '',
    '# Platform attestations and evidence notes',
    ...templateLines(report.requiredInputs.filter((input) => (
      input.name.startsWith('REEDITPRO_BETA_PLATFORM_') &&
      !input.name.startsWith('REEDITPRO_BETA_PLATFORM_APPROVE_')
    ))),
    '',
    '# External-beta launch owner approvals',
    ...templateLines(report.requiredInputs.filter((input) => input.name.startsWith('REEDITPRO_BETA_LAUNCH_APPROVE_'))),
    '',
    '# External-beta launch evidence notes',
    ...templateLines(report.requiredInputs.filter((input) => (
      input.name.startsWith('REEDITPRO_BETA_LAUNCH_') &&
      !input.name.startsWith('REEDITPRO_BETA_LAUNCH_APPROVE_')
    ))),
    '',
    '# Wider-scope flags intentionally stay unset/false in this external-beta intake lane.',
    ...REJECTED_SCOPE_FLAGS.map((name) => `${name}=false`),
    '',
    '# Validate source freshness and owner intake before any deployed evidence manifest or collector:',
    '# npm run beta:readiness:source-freshness-preflight',
    '# npm run beta:readiness:owner-approval-intake-preflight',
    '',
  ]
  return lines.join('\n')
}

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
      manifestOwnerGapPacket: 'docs/beta-readiness/deployed-evidence-input-manifest/2026-06-29-184f-deployed-evidence-input-manifest.json',
      deployedEvidenceInputManifest: 'docs/beta-readiness/deployed-evidence-input-manifest/2026-06-29-184f-deployed-evidence-input-manifest.json',
      sourceFreshnessPreflightPacket: 'docs/beta-readiness/source-freshness-preflight/2026-06-29-184f-source-freshness-passed.json',
      sourceFreshnessDecision: packet.sourceTruth.sourceFreshnessDecision,
      sourceSha: packet.sourceTruth.sourceSha,
      deployedEvidenceSourceSha: packet.sourceTruth.deployedEvidenceSourceSha,
      normalApiRevision: packet.sourceTruth.normalApiRevision,
      productReadyLocalOssCount: packet.productReadyLocalOssCount,
      trackBToolTotals: packet.sourceTruth.trackBToolTotals,
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

export function buildBetaReadinessOwnerApprovalIntakeStatus(
  report = buildBetaReadinessOwnerApprovalIntakePreflight({}),
) {
  const requiredInputs = report.requiredInputs.map((input) => ({
    name: input.name,
    present: input.present,
    inputClass: ownerApprovalInputClass(input.name),
    operatorAction: ownerApprovalOperatorAction(input.name),
  }))
  const pendingInputs = requiredInputs.filter((input) => !input.present)

  return {
    ok: true,
    decision: STATUS_DECISION,
    preflightDecision: report.decision,
    readyForDeployedEvidenceInputManifest: report.readyForDeployedEvidenceInputManifest,
    packetId: report.packetId,
    sourceTruth: report.sourceTruth,
    inputCounts: {
      required: report.requiredInputCount,
      present: requiredInputs.length - pendingInputs.length,
      pending: pendingInputs.length,
      pendingOwnerApprovalConfirmations: pendingInputs.filter((input) => input.inputClass === 'owner_approval_confirmation').length,
      pendingTechnicalVerificationConfirmations: pendingInputs.filter((input) => input.inputClass === 'technical_verification_confirmation').length,
      pendingOwnerEvidenceNotes: pendingInputs.filter((input) => input.inputClass === 'owner_evidence_note').length,
      invalidBooleanInputs: report.invalidBooleanInputs.length,
      rejectedScopeInputs: report.rejectedScopeInputs.length,
      secretLikeEvidenceInputs: report.secretLikeInputPaths.length,
    },
    pendingInputs,
    invalidBooleanInputs: report.invalidBooleanInputs,
    rejectedScopeInputs: report.rejectedScopeInputs,
    secretLikeInputPaths: report.secretLikeInputPaths,
    validationCommands: [
      'npm run beta:readiness:owner-approval-env-template',
      'npm run beta:readiness:owner-approval-intake-status',
      'npm run beta:readiness:owner-approval-intake-preflight',
      'npm run beta:readiness:deployed-evidence-input-manifest',
    ],
    blockedScopes: report.blockedScopes,
    supabaseClassification: report.supabaseClassification,
    warnings: [
      'This status report is value-free; it prints input names, classes, and operator actions only.',
      'It does not grant approval, echo evidence notes, call deployed services, write Supabase/GCS, run tools, enable beta, or enable production.',
      'Run the hard owner approval intake preflight after owners fill values outside source control.',
    ],
  }
}

export function renderBetaReadinessOwnerApprovalIntakeStatusMarkdown(status) {
  const lines = [
    '# Beta Readiness Owner Approval Intake Status',
    '',
    `Decision: \`${status.decision}\``,
    `Preflight decision: \`${status.preflightDecision}\``,
    `Ready for deployed evidence input manifest: \`${status.readyForDeployedEvidenceInputManifest}\``,
    '',
    '## Counts',
    '',
    `- Required inputs: \`${status.inputCounts.required}\``,
    `- Present inputs: \`${status.inputCounts.present}\``,
    `- Pending inputs: \`${status.inputCounts.pending}\``,
    `- Pending owner approval confirmations: \`${status.inputCounts.pendingOwnerApprovalConfirmations}\``,
    `- Pending technical verification confirmations: \`${status.inputCounts.pendingTechnicalVerificationConfirmations}\``,
    `- Pending owner evidence notes: \`${status.inputCounts.pendingOwnerEvidenceNotes}\``,
    `- Invalid boolean inputs: \`${status.inputCounts.invalidBooleanInputs}\``,
    `- Rejected wider-scope inputs: \`${status.inputCounts.rejectedScopeInputs}\``,
    `- Secret-like evidence inputs: \`${status.inputCounts.secretLikeEvidenceInputs}\``,
    '',
    '## Pending Inputs',
    '',
    ...status.pendingInputs.map((input) => `- \`${input.name}\` (${input.inputClass}, ${input.operatorAction})`),
    '',
    '## Validation Commands',
    '',
    ...status.validationCommands.map((command) => `- \`${command}\``),
    '',
    '## Boundary',
    '',
    'This status report printed no owner evidence text, bearer tokens, service-role keys, signed URLs, raw prompts, private media references, or deploy secrets.',
    'It did not grant approval, call the deployed backend, record evidence, write Supabase, run SQL, write GCS, dispatch workers, call providers, process media, enable external beta, enable real-user-media beta, enable paid production, create public artifacts, or create signed URLs.',
    '',
    'Supabase classification: no write / environment none / SQL none / migration no.',
  ]
  return lines.join('\n')
}

function ownerApprovalInputClass(name) {
  if (name.endsWith('_EVIDENCE')) return 'owner_evidence_note'
  if (name.endsWith('_VERIFIED')) return 'technical_verification_confirmation'
  if (name.startsWith('REEDITPRO_BETA_PLATFORM_APPROVE_') || name.startsWith('REEDITPRO_BETA_LAUNCH_APPROVE_')) {
    return 'owner_approval_confirmation'
  }
  return 'operator_confirmation'
}

function ownerApprovalOperatorAction(name) {
  const inputClass = ownerApprovalInputClass(name)
  if (inputClass === 'owner_evidence_note') return 'supply_non_secret_owner_evidence_note'
  if (inputClass === 'technical_verification_confirmation') return 'confirm_technical_verification'
  if (inputClass === 'owner_approval_confirmation') return 'confirm_named_owner_approval'
  return 'confirm_operator_gate_intent'
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

function templateLines(inputs) {
  return inputs.map((input) => {
    if (input.explicitTrue !== undefined) return `${input.name}=true`
    return `${input.name}="<non-secret owner evidence summary>"`
  })
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv.includes('--env-template')) {
    console.log(buildBetaReadinessOwnerApprovalEnvTemplate())
    process.exit(0)
  }
  const report = buildBetaReadinessOwnerApprovalIntakePreflight(process.env)
  if (process.argv.includes('--status')) {
    console.log(JSON.stringify(buildBetaReadinessOwnerApprovalIntakeStatus(report), null, 2))
    process.exit(0)
  }
  if (process.argv.includes('--status-markdown')) {
    console.log(renderBetaReadinessOwnerApprovalIntakeStatusMarkdown(buildBetaReadinessOwnerApprovalIntakeStatus(report)))
    process.exit(0)
  }
  console.log(JSON.stringify(report, null, 2))
  if (!report.readyForDeployedEvidenceInputManifest) {
    process.exitCode = 1
  }
}
