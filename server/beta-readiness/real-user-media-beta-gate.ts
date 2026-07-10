import { evaluateBetaGoNoGo } from './beta-go-no-go-policy'
import type { BetaGoNoGoDecision } from './beta-readiness-types'
import { artifactRetentionPolicy } from '../privacy-retention'
import { collectSecretLikePaths } from '../tool-cost-metering'
import { TRACK_B_ADAPTER_TOOL_IDS, type TrackBAdapterToolId } from '../trackb-adapters'
import type { ProductionStorageBucketPurpose, ToolArtifactType } from '../../src/backend/contracts/production-tool-runtime-contracts'

export const REAL_USER_MEDIA_BETA_GATE_DECISION =
  'trackb_milestone9_real_user_media_beta_gate_passed_ready_for_approved_scope' as const

export type RealUserMediaBetaEvidenceStatus = 'passed' | 'blocked'

export interface RealUserMediaStoragePrivacyApproval {
  storageOwnerApproved: boolean
  privacyOwnerApproved: boolean
  rlsWorkspaceReadbackVerified: boolean
  privateBucketsOnly: boolean
  publicBucketSourceOfTruthBlocked: boolean
  persistentShareUrlSourceOfTruthBlocked: boolean
  storageObjectPathPrefix: string
  ownerNotes: string[]
}

export interface RealUserMediaRetentionDeletionPolicy {
  retentionPolicyApproved: boolean
  sourceMediaRetentionDays: number
  derivedArtifactRetentionDays: number
  workerTempRetentionHours: number
  userDeletionCascadeRequired: boolean
  derivedArtifactDeletionRequired: boolean
  sanitizedAuditSummaryOnlyAfterDeletion: boolean
  deletionRunbookReady: boolean
  ownerNotes: string[]
}

export interface RealUserMediaArtifactManifestRecord {
  artifactId: string
  artifactType: ToolArtifactType
  storageBucketPurpose: ProductionStorageBucketPurpose
  storageObjectPath: string
  isPrivate: boolean
  sourceOfTruth: boolean
  retentionClass: keyof typeof artifactRetentionPolicy
  consentRecordId?: string
  containsUserMedia: boolean
}

export interface RealUserMediaAbuseSecurityReview {
  abuseReviewApproved: boolean
  malwareScanRequired: boolean
  unsafeContentEscalationReady: boolean
  rateLimitPolicyReady: boolean
  accountTrustPolicyReady: boolean
  promptInjectionReviewReady: boolean
  manualReviewQueueReady: boolean
  ownerNotes: string[]
}

export interface RealUserMediaIncidentRunbookReadiness {
  incidentRunbookReady: boolean
  onCallOwner: string
  killSwitchReady: boolean
  rollbackReady: boolean
  privacyIncidentEscalationReady: boolean
  supportEscalationReady: boolean
  ownerNotes: string[]
}

export interface RealUserMediaConsentDisclosureCopy {
  consentCopyApproved: boolean
  disclosureCopyApproved: boolean
  consentCopy: string
  disclosureCopy: string
  deletionCopy: string
  betaScopeCopy: string
  ownerNotes: string[]
}

export interface RealUserMediaPilotUploadReference {
  mediaAssetId: string
  storageBucketPurpose: 'source_media'
  storageObjectPath: string
  durationSeconds: number
  consentRecordId: string
  userConsentAccepted: boolean
  workspaceId: string
  projectId: string
}

export interface RealUserMediaBoundedPilot {
  pilotId: string
  approvedScopeId: string
  approvedParticipants: number
  maxParticipants: number
  maxProjects: number
  maxMediaAssetsPerProject: number
  maxDurationSecondsPerAsset: number
  allowedToolIds: TrackBAdapterToolId[]
  requiresApprovedPlanSnapshot: true
  requiresCreditEstimate: true
  requiresCreditReservation: true
  publicSharingBlocked: true
  finalExportBlocked: true
  monitoringRequired: true
  incidentReviewRequired: true
  pilotUploadReferences: RealUserMediaPilotUploadReference[]
  ownerNotes: string[]
}

export interface RealUserMediaExternalBetaPrerequisites {
  milestone8InternalBetaDecision: string
  milestone8InternalBetaPassed: boolean
  boundedToolExecutionReady: boolean
  deploymentApproved: boolean
  securityApproved: boolean
  storageApproved: boolean
  modelLicensesApproved: boolean
  legalApproved: boolean
  monitoringApproved: boolean
  supportApproved: boolean
  productionReadinessAcceptedForApprovedScope: boolean
}

export interface RealUserMediaBetaGateEvidence {
  sourceId: string
  sourceSha?: string
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  creditEstimateId: string
  creditReservationId: string
  externalBetaPrerequisites: RealUserMediaExternalBetaPrerequisites
  storagePrivacyApproval: RealUserMediaStoragePrivacyApproval
  retentionDeletionPolicy: RealUserMediaRetentionDeletionPolicy
  artifactManifest: RealUserMediaArtifactManifestRecord[]
  abuseSecurityReview: RealUserMediaAbuseSecurityReview
  incidentRunbookReadiness: RealUserMediaIncidentRunbookReadiness
  userConsentDisclosureCopy: RealUserMediaConsentDisclosureCopy
  boundedPilot: RealUserMediaBoundedPilot
}

export interface RealUserMediaArtifactPrivacySummary {
  totalArtifacts: number
  privateArtifacts: number
  sourceOfTruthArtifacts: number
  publicArtifacts: number
  publicOrSignedUrlArtifacts: number
  userMediaArtifactCount: number
  finalExportArtifactCount: number
  retentionCoveredArtifacts: number
}

export interface RealUserMediaBetaGateChecklistItem {
  id: string
  label: string
  status: RealUserMediaBetaEvidenceStatus
  blockers: string[]
}

export interface RealUserMediaBetaGateReport {
  reportId: string
  createdAt: string
  sourceId: string
  sourceSha?: string
  workspaceId: string
  projectId: string
  decision: typeof REAL_USER_MEDIA_BETA_GATE_DECISION | 'blocked'
  externalBetaWithRealUserMediaAllowed: boolean
  paidProductionAllowed: false
  approvedScope: {
    pilotId: string
    approvedScopeId: string
    maxParticipants: number
    maxProjects: number
    maxMediaAssetsPerProject: number
    maxDurationSecondsPerAsset: number
    allowedToolIds: TrackBAdapterToolId[]
  }
  artifactPrivacySummary: RealUserMediaArtifactPrivacySummary
  checklist: RealUserMediaBetaGateChecklistItem[]
  goNoGo: BetaGoNoGoDecision
  blockers: string[]
  warnings: string[]
  nextActions: string[]
}

export function buildRealUserMediaBetaGateReport(
  evidence?: RealUserMediaBetaGateEvidence,
): RealUserMediaBetaGateReport {
  const createdAt = new Date().toISOString()
  if (!evidence) {
    const goNoGo = evaluateBetaGoNoGo({
      e2eDryRunPassed: true,
      safetyDocsExist: true,
      costDocsExist: true,
      boundedToolExecutionReady: true,
      productionReadinessBlocked: false,
      checklist: [],
    })
    return {
      reportId: `real-user-media-beta-gate-${createdAt}`,
      createdAt,
      sourceId: 'missing-real-user-media-beta-evidence',
      workspaceId: 'missing-workspace',
      projectId: 'missing-project',
      decision: 'blocked',
      externalBetaWithRealUserMediaAllowed: false,
      paidProductionAllowed: false,
      approvedScope: {
        pilotId: 'missing-pilot',
        approvedScopeId: 'missing-scope',
        maxParticipants: 0,
        maxProjects: 0,
        maxMediaAssetsPerProject: 0,
        maxDurationSecondsPerAsset: 0,
        allowedToolIds: [],
      },
      artifactPrivacySummary: emptyArtifactSummary(),
      checklist: [{
        id: 'evidence_packet_present',
        label: 'Real-user-media beta evidence packet',
        status: 'blocked',
        blockers: ['Real-user-media beta evidence packet is missing.'],
      }],
      goNoGo,
      blockers: ['Real-user-media beta evidence packet is missing.'],
      warnings: ['No real user media beta scope is allowed without explicit evidence.'],
      nextActions: ['Collect storage/privacy, consent, retention, abuse/security, incident, and bounded pilot evidence.'],
    }
  }

  const secretBlockers = collectSecretLikePaths(evidence, 'realUserMediaBetaEvidence')
    .map((path) => `Secret-like field is not allowed in real-user-media beta evidence: ${path}.`)
  const artifactPrivacySummary = summarizeArtifactPrivacy(evidence.artifactManifest)
  const checklist = [
    checkExternalBetaPrerequisites(evidence),
    checkStoragePrivacyApproval(evidence),
    checkRetentionDeletionPolicy(evidence),
    checkArtifactManifestPrivacy(evidence, artifactPrivacySummary),
    checkAbuseSecurityReview(evidence),
    checkIncidentRunbookReadiness(evidence),
    checkUserConsentDisclosureCopy(evidence),
    checkBoundedPilot(evidence),
  ]
  const localBlockers = [
    ...secretBlockers,
    ...checklist.flatMap((item) => item.blockers),
  ]
  const localEvidencePassed = localBlockers.length === 0
  const goNoGo = evaluateBetaGoNoGo({
    e2eDryRunPassed: evidence.externalBetaPrerequisites.milestone8InternalBetaPassed,
    safetyDocsExist: true,
    costDocsExist: true,
    boundedToolExecutionReady: evidence.externalBetaPrerequisites.boundedToolExecutionReady,
    productionReadinessBlocked: evidence.externalBetaPrerequisites.productionReadinessAcceptedForApprovedScope ? false : true,
    deploymentApproved: evidence.externalBetaPrerequisites.deploymentApproved,
    securityApproved: evidence.externalBetaPrerequisites.securityApproved,
    storageApproved: evidence.externalBetaPrerequisites.storageApproved,
    modelLicensesApproved: evidence.externalBetaPrerequisites.modelLicensesApproved,
    legalApproved: evidence.externalBetaPrerequisites.legalApproved,
    monitoringApproved: evidence.externalBetaPrerequisites.monitoringApproved,
    supportApproved: evidence.externalBetaPrerequisites.supportApproved,
    realUserMediaBetaApproved: localEvidencePassed,
    privateMediaApproval: localEvidencePassed,
    artifactPrivacyEvidenceReady: localEvidencePassed,
    paidProductionApproved: false,
    checklist: [],
  })
  const blockers = uniqueStrings([
    ...localBlockers,
    ...goNoGo.launchStageDecisions.external_beta.blockers,
    ...goNoGo.launchStageDecisions.real_user_media_beta.blockers,
  ])
  const allowed = blockers.length === 0 &&
    goNoGo.externalBetaAllowed &&
    goNoGo.realUserMediaBetaAllowed &&
    goNoGo.paidProductionAllowed === false

  return {
    reportId: `real-user-media-beta-gate-${createdAt}`,
    createdAt,
    sourceId: evidence.sourceId,
    sourceSha: evidence.sourceSha,
    workspaceId: evidence.workspaceId,
    projectId: evidence.projectId,
    decision: allowed ? REAL_USER_MEDIA_BETA_GATE_DECISION : 'blocked',
    externalBetaWithRealUserMediaAllowed: allowed,
    paidProductionAllowed: false,
    approvedScope: {
      pilotId: evidence.boundedPilot.pilotId,
      approvedScopeId: evidence.boundedPilot.approvedScopeId,
      maxParticipants: evidence.boundedPilot.maxParticipants,
      maxProjects: evidence.boundedPilot.maxProjects,
      maxMediaAssetsPerProject: evidence.boundedPilot.maxMediaAssetsPerProject,
      maxDurationSecondsPerAsset: evidence.boundedPilot.maxDurationSecondsPerAsset,
      allowedToolIds: evidence.boundedPilot.allowedToolIds,
    },
    artifactPrivacySummary,
    checklist,
    goNoGo,
    blockers,
    warnings: [
      'Real-user-media beta is limited to the approved scope and private storage references in this report.',
      'Paid production, public sharing, final delivery, and broad real-user-media execution remain blocked.',
    ],
    nextActions: allowed
      ? [
        'Run the bounded pilot only for approved participants, approved projects, private storage refs, and approved Track B tools.',
        'Monitor artifact privacy, abuse/security, deletion requests, and incident runbook readiness during the pilot.',
        'Collect pilot readback before any paid production or broader real-user-media expansion.',
      ]
      : [
        'Resolve every real-user-media beta blocker before allowing approved-scope uploads.',
      ],
  }
}

export function buildApprovedRealUserMediaBetaGateFixture(): RealUserMediaBetaGateEvidence {
  const workspaceId = 'workspace-real-user-media-beta'
  const projectId = 'project-approved-real-media-pilot'
  const storageRoot = `workspaces/${workspaceId}/projects/${projectId}`
  const consentRecordId = 'consent-real-media-beta-001'

  return {
    sourceId: 'milestone9-real-user-media-beta-gate-fixture',
    sourceSha: '5b038503e991b0eace3f86fa908ef042c0b14f2d',
    workspaceId,
    projectId,
    approvedPlanSnapshotId: 'approved-snapshot-real-media-beta-001',
    creditEstimateId: 'credit-estimate-real-media-beta-001',
    creditReservationId: 'credit-reservation-real-media-beta-001',
    externalBetaPrerequisites: {
      milestone8InternalBetaDecision: 'trackb_milestone8_internal_beta_e2e_passed_ready_for_controlled_internal_beta',
      milestone8InternalBetaPassed: true,
      boundedToolExecutionReady: true,
      deploymentApproved: true,
      securityApproved: true,
      storageApproved: true,
      modelLicensesApproved: true,
      legalApproved: true,
      monitoringApproved: true,
      supportApproved: true,
      productionReadinessAcceptedForApprovedScope: true,
    },
    storagePrivacyApproval: {
      storageOwnerApproved: true,
      privacyOwnerApproved: true,
      rlsWorkspaceReadbackVerified: true,
      privateBucketsOnly: true,
      publicBucketSourceOfTruthBlocked: true,
      persistentShareUrlSourceOfTruthBlocked: true,
      storageObjectPathPrefix: `${storageRoot}/`,
      ownerNotes: ['Storage/privacy owner approved private bucket refs for the bounded real-user-media pilot.'],
    },
    retentionDeletionPolicy: {
      retentionPolicyApproved: true,
      sourceMediaRetentionDays: 30,
      derivedArtifactRetentionDays: 30,
      workerTempRetentionHours: 24,
      userDeletionCascadeRequired: true,
      derivedArtifactDeletionRequired: true,
      sanitizedAuditSummaryOnlyAfterDeletion: true,
      deletionRunbookReady: true,
      ownerNotes: ['Deletion requests cascade to source and derived private artifacts; sanitized audit summaries may remain.'],
    },
    artifactManifest: [
      {
        artifactId: 'real-media-source-001',
        artifactType: 'source_media',
        storageBucketPurpose: 'source_media',
        storageObjectPath: `${storageRoot}/source-media/real-media-source-001.mp4`,
        isPrivate: true,
        sourceOfTruth: true,
        retentionClass: 'source_media',
        consentRecordId,
        containsUserMedia: true,
      },
      {
        artifactId: 'real-media-analysis-001',
        artifactType: 'visual_analysis_json',
        storageBucketPurpose: 'analysis_artifacts',
        storageObjectPath: `${storageRoot}/analysis/real-media-analysis-001.json`,
        isPrivate: true,
        sourceOfTruth: true,
        retentionClass: 'analysis_artifacts',
        consentRecordId,
        containsUserMedia: true,
      },
      {
        artifactId: 'real-media-qa-001',
        artifactType: 'qa_report',
        storageBucketPurpose: 'qa_artifacts',
        storageObjectPath: `${storageRoot}/qa/real-media-qa-001.json`,
        isPrivate: true,
        sourceOfTruth: true,
        retentionClass: 'qa_artifacts',
        consentRecordId,
        containsUserMedia: true,
      },
    ],
    abuseSecurityReview: {
      abuseReviewApproved: true,
      malwareScanRequired: true,
      unsafeContentEscalationReady: true,
      rateLimitPolicyReady: true,
      accountTrustPolicyReady: true,
      promptInjectionReviewReady: true,
      manualReviewQueueReady: true,
      ownerNotes: ['Security owner approved malware, abuse, trust, escalation, and manual review controls.'],
    },
    incidentRunbookReadiness: {
      incidentRunbookReady: true,
      onCallOwner: 'internal-beta-operator',
      killSwitchReady: true,
      rollbackReady: true,
      privacyIncidentEscalationReady: true,
      supportEscalationReady: true,
      ownerNotes: ['Incident owner confirmed kill switch, rollback, privacy escalation, and support routing.'],
    },
    userConsentDisclosureCopy: {
      consentCopyApproved: true,
      disclosureCopyApproved: true,
      consentCopy: 'I consent to ReEditPro using my uploaded private media for this bounded beta edit only.',
      disclosureCopy: 'This is an external beta. Uploaded media stays private, is processed only inside the approved beta scope, and is not used for public sharing or training.',
      deletionCopy: 'You can request deletion of uploaded media and derived private artifacts from this beta project.',
      betaScopeCopy: 'This pilot is limited to approved participants, approved projects, approved Track B tools, private artifacts, and no paid production.',
      ownerNotes: ['Legal/privacy owner approved the real-user-media beta consent and disclosure copy.'],
    },
    boundedPilot: {
      pilotId: 'real-user-media-beta-pilot-001',
      approvedScopeId: 'approved-scope-trackb-real-user-media-beta-001',
      approvedParticipants: 5,
      maxParticipants: 10,
      maxProjects: 3,
      maxMediaAssetsPerProject: 4,
      maxDurationSecondsPerAsset: 180,
      allowedToolIds: [...TRACK_B_ADAPTER_TOOL_IDS],
      requiresApprovedPlanSnapshot: true,
      requiresCreditEstimate: true,
      requiresCreditReservation: true,
      publicSharingBlocked: true,
      finalExportBlocked: true,
      monitoringRequired: true,
      incidentReviewRequired: true,
      pilotUploadReferences: [{
        mediaAssetId: 'real-media-source-001',
        storageBucketPurpose: 'source_media',
        storageObjectPath: `${storageRoot}/source-media/real-media-source-001.mp4`,
        durationSeconds: 120,
        consentRecordId,
        userConsentAccepted: true,
        workspaceId,
        projectId,
      }],
      ownerNotes: ['Pilot is bounded to approved participants and private source-media references only.'],
    },
  }
}

function checkExternalBetaPrerequisites(evidence: RealUserMediaBetaGateEvidence): RealUserMediaBetaGateChecklistItem {
  const input = evidence.externalBetaPrerequisites
  return checklistItem('external_beta_prerequisites', 'External beta prerequisite approvals', [
    input.milestone8InternalBetaPassed ? '' : 'Milestone 8 internal beta E2E pass is missing.',
    input.milestone8InternalBetaDecision === 'trackb_milestone8_internal_beta_e2e_passed_ready_for_controlled_internal_beta'
      ? ''
      : 'Milestone 8 decision is missing or mismatched.',
    input.boundedToolExecutionReady ? '' : 'Bounded tool execution readiness is missing.',
    input.deploymentApproved ? '' : 'Deployment approval is missing.',
    input.securityApproved ? '' : 'Security approval is missing.',
    input.storageApproved ? '' : 'Storage approval is missing.',
    input.modelLicensesApproved ? '' : 'Model/license approval is missing.',
    input.legalApproved ? '' : 'Legal approval is missing.',
    input.monitoringApproved ? '' : 'Monitoring approval is missing.',
    input.supportApproved ? '' : 'Support approval is missing.',
    input.productionReadinessAcceptedForApprovedScope ? '' : 'Approved-scope production readiness acceptance is missing.',
  ])
}

function checkStoragePrivacyApproval(evidence: RealUserMediaBetaGateEvidence): RealUserMediaBetaGateChecklistItem {
  const input = evidence.storagePrivacyApproval
  return checklistItem('storage_privacy_approval', 'Storage/privacy approvals', [
    input.storageOwnerApproved ? '' : 'Storage owner approval is missing.',
    input.privacyOwnerApproved ? '' : 'Privacy owner approval is missing.',
    input.rlsWorkspaceReadbackVerified ? '' : 'Workspace-scoped RLS/storage readback evidence is missing.',
    input.privateBucketsOnly ? '' : 'Private-bucket-only policy is missing.',
    input.publicBucketSourceOfTruthBlocked ? '' : 'Public bucket source-of-truth block is missing.',
    input.persistentShareUrlSourceOfTruthBlocked ? '' : 'Persistent signed URL source-of-truth block is missing.',
    input.storageObjectPathPrefix === `workspaces/${evidence.workspaceId}/projects/${evidence.projectId}/`
      ? ''
      : 'Storage prefix must be scoped to the approved workspace/project.',
    input.ownerNotes.length > 0 ? '' : 'Storage/privacy owner notes are missing.',
  ])
}

function checkRetentionDeletionPolicy(evidence: RealUserMediaBetaGateEvidence): RealUserMediaBetaGateChecklistItem {
  const input = evidence.retentionDeletionPolicy
  return checklistItem('retention_deletion_policy', 'Retention/deletion policy', [
    input.retentionPolicyApproved ? '' : 'Retention policy approval is missing.',
    input.sourceMediaRetentionDays > 0 && input.sourceMediaRetentionDays <= artifactRetentionPolicy.source_media.retentionDays
      ? ''
      : 'Source media retention exceeds approved policy.',
    input.derivedArtifactRetentionDays > 0 && input.derivedArtifactRetentionDays <= artifactRetentionPolicy.analysis_artifacts.retentionDays
      ? ''
      : 'Derived artifact retention exceeds approved policy.',
    input.workerTempRetentionHours > 0 && input.workerTempRetentionHours <= artifactRetentionPolicy.worker_temp.retentionDays * 24
      ? ''
      : 'Worker temp retention exceeds approved policy.',
    input.userDeletionCascadeRequired ? '' : 'User deletion cascade is not required.',
    input.derivedArtifactDeletionRequired ? '' : 'Derived artifact deletion requirement is missing.',
    input.sanitizedAuditSummaryOnlyAfterDeletion ? '' : 'Post-deletion sanitized audit summary policy is missing.',
    input.deletionRunbookReady ? '' : 'Deletion runbook readiness is missing.',
    input.ownerNotes.length > 0 ? '' : 'Retention/deletion owner notes are missing.',
  ])
}

function checkArtifactManifestPrivacy(
  evidence: RealUserMediaBetaGateEvidence,
  summary: RealUserMediaArtifactPrivacySummary,
): RealUserMediaBetaGateChecklistItem {
  const approvedPrefix = `workspaces/${evidence.workspaceId}/projects/${evidence.projectId}/`
  const blockers = [
    summary.totalArtifacts > 0 ? '' : 'Artifact manifest is missing records.',
    summary.publicArtifacts === 0 ? '' : 'Artifact manifest contains non-private records.',
    summary.publicOrSignedUrlArtifacts === 0 ? '' : 'Artifact manifest contains public URL or signed URL source-of-truth records.',
    summary.privateArtifacts === summary.totalArtifacts ? '' : 'Not every artifact is private.',
    summary.sourceOfTruthArtifacts === summary.totalArtifacts ? '' : 'Not every artifact is a storage-ref source of truth.',
    summary.userMediaArtifactCount > 0 ? '' : 'Real-user-media artifact references are missing.',
    summary.finalExportArtifactCount === 0 ? '' : 'Final export artifacts are not allowed in the real-user-media beta gate.',
    summary.retentionCoveredArtifacts === summary.totalArtifacts ? '' : 'Not every artifact has retention coverage.',
    ...evidence.artifactManifest.map((record) => record.storageObjectPath.startsWith(approvedPrefix)
      ? ''
      : `${record.artifactId} is outside the approved workspace/project prefix.`),
  ]
  return checklistItem('artifact_manifest_privacy', 'Artifact manifest privacy checks', blockers)
}

function checkAbuseSecurityReview(evidence: RealUserMediaBetaGateEvidence): RealUserMediaBetaGateChecklistItem {
  const input = evidence.abuseSecurityReview
  return checklistItem('abuse_security_review', 'Abuse/security review', [
    input.abuseReviewApproved ? '' : 'Abuse/security owner approval is missing.',
    input.malwareScanRequired ? '' : 'Malware scan requirement is missing.',
    input.unsafeContentEscalationReady ? '' : 'Unsafe content escalation path is missing.',
    input.rateLimitPolicyReady ? '' : 'Rate limit policy is missing.',
    input.accountTrustPolicyReady ? '' : 'Account trust policy is missing.',
    input.promptInjectionReviewReady ? '' : 'Prompt-injection review is missing.',
    input.manualReviewQueueReady ? '' : 'Manual review queue readiness is missing.',
    input.ownerNotes.length > 0 ? '' : 'Abuse/security owner notes are missing.',
  ])
}

function checkIncidentRunbookReadiness(evidence: RealUserMediaBetaGateEvidence): RealUserMediaBetaGateChecklistItem {
  const input = evidence.incidentRunbookReadiness
  return checklistItem('incident_runbook_readiness', 'Incident/runbook readiness', [
    input.incidentRunbookReady ? '' : 'Incident runbook is missing.',
    input.onCallOwner.trim() ? '' : 'On-call owner is missing.',
    input.killSwitchReady ? '' : 'Kill switch readiness is missing.',
    input.rollbackReady ? '' : 'Rollback readiness is missing.',
    input.privacyIncidentEscalationReady ? '' : 'Privacy incident escalation readiness is missing.',
    input.supportEscalationReady ? '' : 'Support escalation readiness is missing.',
    input.ownerNotes.length > 0 ? '' : 'Incident/runbook owner notes are missing.',
  ])
}

function checkUserConsentDisclosureCopy(evidence: RealUserMediaBetaGateEvidence): RealUserMediaBetaGateChecklistItem {
  const input = evidence.userConsentDisclosureCopy
  return checklistItem('user_consent_disclosure_copy', 'User consent and disclosure copy', [
    input.consentCopyApproved ? '' : 'Consent copy approval is missing.',
    input.disclosureCopyApproved ? '' : 'Disclosure copy approval is missing.',
    containsAll(input.consentCopy, ['consent', 'private', 'beta']) ? '' : 'Consent copy must mention consent, private media, and beta scope.',
    containsAll(input.disclosureCopy, ['external beta', 'private', 'approved beta scope']) ? '' : 'Disclosure copy must mention external beta, privacy, and approved scope.',
    containsAll(input.deletionCopy, ['request deletion', 'uploaded media']) ? '' : 'Deletion copy must explain uploaded media deletion requests.',
    containsAll(input.betaScopeCopy, ['approved participants', 'approved projects', 'no paid production']) ? '' : 'Beta scope copy must name participant/project limits and no paid production.',
    input.ownerNotes.length > 0 ? '' : 'Consent/disclosure owner notes are missing.',
  ])
}

function checkBoundedPilot(evidence: RealUserMediaBetaGateEvidence): RealUserMediaBetaGateChecklistItem {
  const input = evidence.boundedPilot
  const approvedPrefix = `workspaces/${evidence.workspaceId}/projects/${evidence.projectId}/`
  const allowedToolSet = new Set(TRACK_B_ADAPTER_TOOL_IDS)
  const blockers = [
    input.pilotId.trim() ? '' : 'Pilot ID is missing.',
    input.approvedScopeId.trim() ? '' : 'Approved scope ID is missing.',
    input.approvedParticipants > 0 && input.approvedParticipants <= input.maxParticipants ? '' : 'Approved participant count exceeds pilot maximum.',
    input.maxParticipants > 0 && input.maxParticipants <= 25 ? '' : 'Pilot max participants must be between 1 and 25.',
    input.maxProjects > 0 && input.maxProjects <= 10 ? '' : 'Pilot max projects must be between 1 and 10.',
    input.maxMediaAssetsPerProject > 0 && input.maxMediaAssetsPerProject <= 10 ? '' : 'Pilot media assets per project limit must be between 1 and 10.',
    input.maxDurationSecondsPerAsset > 0 && input.maxDurationSecondsPerAsset <= 600 ? '' : 'Pilot asset duration limit must be at most 600 seconds.',
    input.allowedToolIds.length > 0 ? '' : 'Pilot allowed tool list is missing.',
    ...input.allowedToolIds.map((toolId) => allowedToolSet.has(toolId) ? '' : `${toolId} is not an approved Track B tool.`),
    input.requiresApprovedPlanSnapshot ? '' : 'Pilot must require approved plan snapshots.',
    input.requiresCreditEstimate ? '' : 'Pilot must require credit estimates.',
    input.requiresCreditReservation ? '' : 'Pilot must require credit reservations.',
    input.publicSharingBlocked ? '' : 'Public sharing must be blocked.',
    input.finalExportBlocked ? '' : 'Final export must be blocked for this gate.',
    input.monitoringRequired ? '' : 'Monitoring must be required.',
    input.incidentReviewRequired ? '' : 'Incident review must be required.',
    input.pilotUploadReferences.length > 0 ? '' : 'Pilot must include at least one approved upload reference.',
    input.pilotUploadReferences.length <= input.maxMediaAssetsPerProject ? '' : 'Pilot upload references exceed per-project limit.',
    ...input.pilotUploadReferences.flatMap((reference) => [
      reference.workspaceId === evidence.workspaceId ? '' : `${reference.mediaAssetId} workspace mismatch.`,
      reference.projectId === evidence.projectId ? '' : `${reference.mediaAssetId} project mismatch.`,
      reference.storageBucketPurpose === 'source_media' ? '' : `${reference.mediaAssetId} must use source_media bucket purpose.`,
      reference.storageObjectPath.startsWith(approvedPrefix) ? '' : `${reference.mediaAssetId} is outside approved storage prefix.`,
      reference.durationSeconds > 0 && reference.durationSeconds <= input.maxDurationSecondsPerAsset ? '' : `${reference.mediaAssetId} duration exceeds pilot limit.`,
      reference.consentRecordId.trim() ? '' : `${reference.mediaAssetId} consent record is missing.`,
      reference.userConsentAccepted ? '' : `${reference.mediaAssetId} user consent is not accepted.`,
    ]),
    evidence.approvedPlanSnapshotId.trim() ? '' : 'Approved plan snapshot ID is missing.',
    evidence.creditEstimateId.trim() ? '' : 'Credit estimate ID is missing.',
    evidence.creditReservationId.trim() ? '' : 'Credit reservation ID is missing.',
    input.ownerNotes.length > 0 ? '' : 'Bounded pilot owner notes are missing.',
  ]
  return checklistItem('bounded_real_media_pilot', 'Real-media bounded pilot', blockers)
}

function summarizeArtifactPrivacy(records: RealUserMediaArtifactManifestRecord[]): RealUserMediaArtifactPrivacySummary {
  return {
    totalArtifacts: records.length,
    privateArtifacts: records.filter((record) => record.isPrivate).length,
    sourceOfTruthArtifacts: records.filter((record) => record.sourceOfTruth).length,
    publicArtifacts: records.filter((record) => !record.isPrivate).length,
    publicOrSignedUrlArtifacts: records.filter((record) => /https?:\/\/|X-Goog-Signature|X-Amz-Signature/i.test(record.storageObjectPath)).length,
    userMediaArtifactCount: records.filter((record) => record.containsUserMedia).length,
    finalExportArtifactCount: records.filter((record) => record.artifactType === 'final_export' || record.storageBucketPurpose === 'final_exports').length,
    retentionCoveredArtifacts: records.filter((record) => Boolean(artifactRetentionPolicy[record.retentionClass])).length,
  }
}

function emptyArtifactSummary(): RealUserMediaArtifactPrivacySummary {
  return {
    totalArtifacts: 0,
    privateArtifacts: 0,
    sourceOfTruthArtifacts: 0,
    publicArtifacts: 0,
    publicOrSignedUrlArtifacts: 0,
    userMediaArtifactCount: 0,
    finalExportArtifactCount: 0,
    retentionCoveredArtifacts: 0,
  }
}

function checklistItem(id: string, label: string, blockerCandidates: string[]): RealUserMediaBetaGateChecklistItem {
  const blockers = uniqueStrings(blockerCandidates.filter(Boolean))
  return {
    id,
    label,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    blockers,
  }
}

function containsAll(value: string, required: string[]): boolean {
  const normalized = value.toLowerCase()
  return required.every((needle) => normalized.includes(needle.toLowerCase()))
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)]
}
