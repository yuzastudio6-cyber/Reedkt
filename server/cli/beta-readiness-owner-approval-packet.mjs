const DEFAULT_SOURCE_SHA = '17a9a2d2b015ab325cf13ce5135d083af070ab00'
const DEFAULT_CREATED_AT = '2026-06-29T00:40:00Z'

const platformApprovalItems = [
  {
    id: 'platform_billing_stripe_boundary',
    ownerRole: 'billing_owner',
    gate: 'platform_evidence_packet',
    approvalInput: 'REEDITPRO_BETA_PLATFORM_APPROVE_BILLING_STRIPE_BOUNDARY=true',
    evidenceInput: 'REEDITPRO_BETA_PLATFORM_STRIPE_BOUNDARY_EVIDENCE=<non-secret billing-owner approval note>',
    requiredEvidence: [
      'Billing owner confirms deployed staging tool-cost surfaces do not call Stripe.',
      'Billing owner confirms tool-cost events exclude ReEditPro service fees.',
      'Billing owner confirms the staging billing QA report is acceptable for external-beta evidence.',
    ],
  },
  {
    id: 'platform_deployment_owner',
    ownerRole: 'deployment_owner',
    gate: 'platform_evidence_packet',
    approvalInput: 'REEDITPRO_BETA_PLATFORM_APPROVE_DEPLOYMENT=true',
    evidenceInput: 'deployment approval is captured in launch approval evidence',
    requiredEvidence: [
      'Deployment owner confirms the staging services are authenticated-only.',
      'Deployment owner confirms the deployed source SHA and revisions are acceptable for external beta evidence collection.',
    ],
  },
  {
    id: 'platform_security_owner',
    ownerRole: 'security_owner',
    gate: 'platform_evidence_packet',
    approvalInput: 'REEDITPRO_BETA_PLATFORM_APPROVE_SECURITY=true',
    evidenceInput: 'security approval is captured in launch approval evidence',
    requiredEvidence: [
      'Security owner confirms the service-role write path and RLS readback evidence are acceptable.',
      'Security owner confirms no public unauthenticated beta endpoint is approved by this packet.',
    ],
  },
  {
    id: 'platform_storage_privacy_owner',
    ownerRole: 'storage_privacy_owner',
    gate: 'platform_evidence_packet',
    approvalInput: 'REEDITPRO_BETA_PLATFORM_APPROVE_STORAGE=true',
    evidenceInput: 'storage/privacy approval is captured in launch approval evidence',
    requiredEvidence: [
      'Storage/privacy owner confirms no real user media, public artifact, or signed delivery URL is approved by this packet.',
      'Storage/privacy owner confirms evidence packets contain metadata only.',
    ],
  },
  {
    id: 'platform_legal_owner',
    ownerRole: 'legal_owner',
    gate: 'platform_evidence_packet',
    approvalInput: 'REEDITPRO_BETA_PLATFORM_APPROVE_LEGAL=true',
    evidenceInput: 'legal approval is captured in launch approval evidence',
    requiredEvidence: [
      'Legal owner confirms external-beta evidence scope is acceptable without paid production or real-user-media beta.',
      'Legal owner confirms tool/license/model approval remains separately required for launch approval evidence.',
    ],
  },
  {
    id: 'platform_monitoring_owner',
    ownerRole: 'monitoring_owner',
    gate: 'platform_evidence_packet',
    approvalInput: 'REEDITPRO_BETA_PLATFORM_APPROVE_MONITORING=true',
    evidenceInput: 'REEDITPRO_BETA_PLATFORM_MONITORING_EVIDENCE=<non-secret monitoring deployment note>',
    requiredEvidence: [
      'Monitoring owner confirms 7 log metrics, 6 alert policies, and dashboard projects/390722338345/dashboards/e60d0a5c-8618-432b-999e-0c07ffec58bc are acceptable.',
      'Monitoring owner confirms alerting coverage is sufficient for external-beta evidence collection.',
    ],
  },
  {
    id: 'platform_support_owner',
    ownerRole: 'support_owner',
    gate: 'platform_evidence_packet',
    approvalInput: 'REEDITPRO_BETA_PLATFORM_APPROVE_SUPPORT=true',
    evidenceInput: 'support approval is captured in launch approval evidence',
    requiredEvidence: [
      'Support owner confirms there is an external-beta support and rollback contact path.',
      'Support owner confirms paid production remains blocked.',
    ],
  },
]

const launchApprovalItems = [
  {
    id: 'launch_model_license_owner',
    ownerRole: 'model_license_owner',
    gate: 'external_beta_launch_approval',
    approvalInput: 'REEDITPRO_BETA_LAUNCH_APPROVE_MODEL_LICENSES=true',
    evidenceInput: 'REEDITPRO_BETA_LAUNCH_MODEL_LICENSE_EVIDENCE=<non-secret model/license owner approval note>',
    requiredEvidence: [
      'Model/license owner confirms the launch evidence scope is external beta only.',
      'Model/license owner confirms model weights, package licenses, and tool ownership are acceptable for the approved evidence scope.',
    ],
  },
  {
    id: 'launch_deployment_owner',
    ownerRole: 'deployment_owner',
    gate: 'external_beta_launch_approval',
    approvalInput: 'REEDITPRO_BETA_LAUNCH_APPROVE_DEPLOYMENT=true',
    evidenceInput: 'REEDITPRO_BETA_LAUNCH_DEPLOYMENT_EVIDENCE=<non-secret deployment owner approval note>',
    requiredEvidence: [
      'Deployment owner confirms the normal API and tool-readiness services are the intended staging endpoints.',
      'Deployment owner confirms no production deploy is authorized by this approval.',
    ],
  },
  {
    id: 'launch_security_owner',
    ownerRole: 'security_owner',
    gate: 'external_beta_launch_approval',
    approvalInput: 'REEDITPRO_BETA_LAUNCH_APPROVE_SECURITY=true',
    evidenceInput: 'REEDITPRO_BETA_LAUNCH_SECURITY_EVIDENCE=<non-secret security owner approval note>',
    requiredEvidence: [
      'Security owner confirms authenticated-only staging access and RLS readback evidence are acceptable.',
      'Security owner confirms no broad public endpoint is approved.',
    ],
  },
  {
    id: 'launch_storage_privacy_owner',
    ownerRole: 'storage_privacy_owner',
    gate: 'external_beta_launch_approval',
    approvalInput: 'REEDITPRO_BETA_LAUNCH_APPROVE_STORAGE=true',
    evidenceInput: 'REEDITPRO_BETA_LAUNCH_STORAGE_EVIDENCE=<non-secret storage/privacy owner approval note>',
    requiredEvidence: [
      'Storage/privacy owner confirms metadata-only evidence collection is acceptable.',
      'Storage/privacy owner confirms real-user-media beta remains a separate blocked scope.',
    ],
  },
  {
    id: 'launch_legal_owner',
    ownerRole: 'legal_owner',
    gate: 'external_beta_launch_approval',
    approvalInput: 'REEDITPRO_BETA_LAUNCH_APPROVE_LEGAL=true',
    evidenceInput: 'REEDITPRO_BETA_LAUNCH_LEGAL_EVIDENCE=<non-secret legal owner approval note>',
    requiredEvidence: [
      'Legal owner confirms external-beta launch evidence can be recorded after all other evidence gates pass.',
      'Legal owner confirms paid production remains blocked.',
    ],
  },
  {
    id: 'launch_monitoring_owner',
    ownerRole: 'monitoring_owner',
    gate: 'external_beta_launch_approval',
    approvalInput: 'REEDITPRO_BETA_LAUNCH_APPROVE_MONITORING=true',
    evidenceInput: 'REEDITPRO_BETA_LAUNCH_MONITORING_EVIDENCE=<non-secret monitoring owner approval note>',
    requiredEvidence: [
      'Monitoring owner confirms staging observability is acceptable for external beta.',
      'Monitoring owner confirms follow-up monitoring escalation is defined outside production launch.',
    ],
  },
  {
    id: 'launch_support_owner',
    ownerRole: 'support_owner',
    gate: 'external_beta_launch_approval',
    approvalInput: 'REEDITPRO_BETA_LAUNCH_APPROVE_SUPPORT=true',
    evidenceInput: 'REEDITPRO_BETA_LAUNCH_SUPPORT_EVIDENCE=<non-secret support owner approval note>',
    requiredEvidence: [
      'Support owner confirms support coverage for limited external beta.',
      'Support owner confirms rollback and incident intake path is defined.',
    ],
  },
]

const blockedScopes = [
  'external_beta_launch_until_all_owner_approvals_and_readback_pass',
  'real_user_media_beta_until_separate_scope_approval_evidence_passes',
  'paid_production_until_paid_production_evidence_collector_passes',
  'provider_calls_until_approved_runtime_plan_and_credit_gate_pass',
  'public_artifacts_and_signed_delivery_until_storage_privacy_scope_passes',
]

export function buildBetaReadinessOwnerApprovalPacket(options = {}) {
  const sourceSha = clean(options.sourceSha) ?? clean(process.env.REEDITPRO_BETA_OWNER_APPROVAL_SOURCE_SHA) ?? DEFAULT_SOURCE_SHA
  const createdAt = clean(options.createdAt) ?? clean(process.env.REEDITPRO_BETA_OWNER_APPROVAL_CREATED_AT) ?? DEFAULT_CREATED_AT
  const packet = {
    ok: true,
    packetId: 'beta-readiness-owner-approval-packet-current-gates-2026-06-28',
    createdAt,
    decision: 'beta_readiness_owner_approval_packet_passed_ready_for_owner_review',
    sourceTruth: {
      sourceBranch: 'codex/sound-music-audio-1abc-checkpoint',
      sourceSha,
      platformTechnicalProbePacket: 'docs/beta-readiness/platform-technical-probe-current-state/2026-06-28-a735-platform-technical-probe.json',
      currentSourceApiDeployPacket: 'docs/beta-readiness/api-staging-deploy-current-source/2026-06-29-17a9-api-staging-deploy.json',
      normalApiService: 'reeditpro-api-staging',
      normalApiRegion: 'us-east1',
      normalApiRevision: 'reeditpro-api-staging-00011-cts',
      normalApiServiceUrl: 'https://reeditpro-api-staging-4wkjiqvdqa-ue.a.run.app',
      normalApiCanonicalServiceUrl: 'https://reeditpro-api-staging-390722338345.us-east1.run.app',
      normalApiImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-api:api-staging-17a9a2d2b015-20260629T0034Z',
      normalApiImageDigest: 'sha256:35fcf6401f15baab8206fc7b3bf5436416c6ef24419f545f8e813504a7c1ab4c',
      normalApiArtifactRegion: 'us-central1',
      normalApiDeployRunId: '28341446109',
      normalApiDeployRunUrl: 'https://github.com/yuzastudio6-cyber/Reedkt/actions/runs/28341446109',
      normalApiPublicUnauthenticatedHealthStatus: 403,
      normalApiAuthenticatedHealthReadback: 'not_rerun_local_cloud_cli_auth_expired',
      toolReadinessService: 'reeditpro-tool-readiness-staging',
      toolReadinessRevision: 'reeditpro-tool-readiness-staging-00002-qdp',
      productReadyLocalOssCount: 14,
      platformProbePassedChecks: 8,
      platformProbeTotalChecks: 9,
    },
    approvalState: {
      approvalsGrantedByThisPacket: false,
      currentStatus: 'owner_review_requested',
      ownerProvidedNotesRequired: true,
      evidenceNotesMustBeNonPublicAndNonCredential: true,
    },
    platformApprovalItems,
    launchApprovalItems,
    postApprovalCommands: [
      'npm run beta:readiness:source-freshness-preflight',
      'npm run beta:readiness:owner-approval-intake-preflight',
      'npm run beta:platform:staging-evidence-preflight',
      'npm run beta:readiness:launch-approval-evidence-preflight',
      'npm run beta:readiness:deployed-evidence-input-manifest',
      'npm run beta:readiness:external-beta-evidence-collector',
      'npm run beta:readiness:operator-status-api',
    ],
    completionCriteria: [
      'All platform approval booleans are true and required platform evidence notes are present.',
      'All launch approval booleans are true and required launch evidence notes are present.',
      'Platform staging evidence preflight reports readyToRecordEvidencePacket=true.',
      'Launch approval evidence preflight reports readyToRecordLaunchApprovalEvidence=true.',
      'Deployed evidence input manifest reports readyToRunExternalBetaEvidenceCollector=true.',
      'External beta evidence collector records evidence and final operator status reads readyForExternalBeta=true.',
    ],
    forbiddenOwnerEvidence: [
      'service-role keys',
      'API keys',
      'bearer tokens',
      'credential files',
      'signed URLs',
      'raw prompts',
      'private media payloads',
      'public artifact links',
      'Stripe dashboard screenshots containing sensitive data',
    ],
    blockedScopes,
    supabaseClassification: {
      write: 'no write',
      environment: 'none',
      sql: 'none',
      migration: 'no',
    },
    productReadyLocalOssCount: 14,
    externalBetaEnabled: false,
    realUserMediaBetaEnabled: false,
    paidProductionEnabled: false,
    warnings: [
      'This packet requests owner approval evidence only; it does not grant approval by itself.',
      'Do not paste non-public credentials or access-bearing URLs into evidence notes.',
      'Passing this packet does not approve real-user-media beta or paid production.',
    ],
  }

  return packet
}

export function renderBetaReadinessOwnerApprovalPacketMarkdown(packet) {
  const lines = [
    '# Beta Readiness Owner Approval Packet - Current Gates',
    '',
    `Decision: \`${packet.decision}\``,
    '',
    `Source branch: \`${packet.sourceTruth.sourceBranch}\``,
    `Source SHA: \`${packet.sourceTruth.sourceSha}\``,
    '',
    '## Current Evidence',
    '',
    `- Platform technical probe packet: \`${packet.sourceTruth.platformTechnicalProbePacket}\``,
    `- Current-source API deploy packet: \`${packet.sourceTruth.currentSourceApiDeployPacket}\``,
    `- Normal API: \`${packet.sourceTruth.normalApiService}\` revision \`${packet.sourceTruth.normalApiRevision}\` in \`${packet.sourceTruth.normalApiRegion}\``,
    `- Normal API image: \`${packet.sourceTruth.normalApiImage}\``,
    `- Normal API image digest: \`${packet.sourceTruth.normalApiImageDigest}\``,
    `- Normal API deploy run: [${packet.sourceTruth.normalApiDeployRunId}](${packet.sourceTruth.normalApiDeployRunUrl})`,
    `- Normal API public unauthenticated \`/health\`: HTTP \`${packet.sourceTruth.normalApiPublicUnauthenticatedHealthStatus}\``,
    `- Normal API authenticated health readback: \`${packet.sourceTruth.normalApiAuthenticatedHealthReadback}\``,
    `- Tool-readiness API: \`${packet.sourceTruth.toolReadinessService}\` revision \`${packet.sourceTruth.toolReadinessRevision}\``,
    `- Product-ready local OSS count in stored evidence: \`${packet.sourceTruth.productReadyLocalOssCount}\``,
    `- Platform technical probe: \`${packet.sourceTruth.platformProbePassedChecks}/${packet.sourceTruth.platformProbeTotalChecks}\` checks passed`,
    '',
    'This packet does not approve anything. It defines the exact non-secret owner evidence needed before the existing evidence collectors can run.',
    '',
    'Generate an owner input template with `npm run beta:readiness:owner-approval-env-template`. Before rerunning the deployed evidence input manifest, run `npm run beta:readiness:source-freshness-preflight`, then validate owner-provided approval/attestation booleans are explicitly `true` and evidence notes are present with `npm run beta:readiness:owner-approval-intake-preflight`. The intake preflight rejects secret-like notes and wider-scope real-user-media or paid-production flags without echoing evidence note values.',
    '',
    '## Platform Evidence Packet Approvals',
    '',
    ...approvalMarkdown(packet.platformApprovalItems),
    '',
    '## External Beta Launch Approvals',
    '',
    ...approvalMarkdown(packet.launchApprovalItems),
    '',
    '## Post-Approval Commands',
    '',
    ...packet.postApprovalCommands.map((command) => `- \`${command}\``),
    '',
    '## Completion Criteria',
    '',
    ...packet.completionCriteria.map((criterion) => `- ${criterion}`),
    '',
    '## Forbidden Owner Evidence',
    '',
    ...packet.forbiddenOwnerEvidence.map((item) => `- ${item}`),
    '',
    '## Blocked Scopes',
    '',
    ...packet.blockedScopes.map((scope) => `- \`${scope}\``),
    '',
    'Supabase classification: no write / environment none / SQL none / migration no.',
    '',
    'External beta, real-user-media beta, paid production, provider calls, public artifacts, and signed delivery remain blocked until their named gates pass.',
    '',
  ]
  return lines.join('\n')
}

function approvalMarkdown(items) {
  return items.flatMap((item) => [
    `### ${item.id}`,
    '',
    `- Owner role: \`${item.ownerRole}\``,
    `- Gate: \`${item.gate}\``,
    `- Approval input: \`${item.approvalInput}\``,
    `- Evidence input: \`${item.evidenceInput}\``,
    '- Required evidence:',
    ...item.requiredEvidence.map((evidence) => `  - ${evidence}`),
    '',
  ])
}

function clean(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const packet = buildBetaReadinessOwnerApprovalPacket()
  if (process.argv.includes('--markdown')) {
    console.log(renderBetaReadinessOwnerApprovalPacketMarkdown(packet))
  } else {
    console.log(JSON.stringify(packet, null, 2))
  }
}
