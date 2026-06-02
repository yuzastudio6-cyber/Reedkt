import fs from 'node:fs'
import path from 'node:path'
import type { ApiErrorCode } from '../errors/error-codes'
import { listToolReadiness } from '../foundation/tool-readiness'
import type { ServiceContext } from '../types'
import type {
  ComplianceAuditSummaryInput,
  ComplianceBlockersInput,
  ComplianceProductionUnlockBlockedInput,
  ComplianceReadinessInput,
  ComplianceReviewCreateBoundaryInput,
  ComplianceReviewGetInput,
  ComplianceReviewListForSubjectInput,
  ComplianceReviewPreviewInput,
  ComplianceSubjectGetQuery,
  ComplianceSubjectsListInput,
  ReviewCategory,
  ReviewSubjectType,
} from '../validation/compliance-schemas'
import { createProjectService } from './project-service'
import { getRequiredAuthUserId, nowIso, sanitizeJson } from './service-helpers'

type ComplianceStatus = 'ready' | 'blocked' | 'backend_required' | 'mock_only'

interface ComplianceBlocker {
  gate: string
  code: ApiErrorCode
  message: string
}

interface RequiredRecord {
  table: string
  id?: string
  status: 'present' | 'missing' | 'backend_required' | 'blocked' | 'not_applicable'
  note: string
}

interface ComplianceSubjectSummary {
  reviewSubjectType: ReviewSubjectType
  reviewSubjectKey: string
  displayName: string
  category: string
  executionStatus: string
  complianceStatus: string
  licenseReviewStatus: string
  securityReviewStatus: string
  dependencyStatus: string
  runtimeIsolationStatus: string
  productionApprovalStatus: string
  requiredEvidence: string[]
  blockerSummary: string
}

export interface ComplianceResult {
  status: ComplianceStatus
  canProceed: boolean
  canApproveProduction: boolean
  canEnableRuntime: boolean
  blockers: ComplianceBlocker[]
  warnings: string[]
  requiredRecords: RequiredRecord[]
  nextAction: string
  subject?: ComplianceSubjectSummary | null
  subjects?: ComplianceSubjectSummary[]
  review?: Record<string, unknown>
  license?: Record<string, unknown>
  security?: Record<string, unknown>
  dependency?: Record<string, unknown>
  runtimeApproval?: Record<string, unknown>
  productionUnlock?: Record<string, unknown>
  audit?: Record<string, unknown>
  staticInventory?: Record<string, unknown>
}

const PROVIDER_SUBJECTS: ComplianceSubjectSummary[] = [
  providerSubject('openai', 'OpenAI provider', 'image provider'),
  providerSubject('wan', 'Wan provider', 'video provider'),
  providerSubject('hailuo', 'Hailuo provider', 'video provider'),
  providerSubject('veo', 'Veo provider', 'fallback video provider'),
  providerSubject('lyria', 'Lyria provider', 'music provider'),
  providerSubject('mirelo', 'Mirelo provider', 'SFX provider'),
  providerSubject('mmaudio', 'MMAudio provider', 'draft SFX provider'),
]

function providerSubject(key: string, displayName: string, category: string): ComplianceSubjectSummary {
  return {
    reviewSubjectType: 'provider',
    reviewSubjectKey: key,
    displayName,
    category,
    executionStatus: 'backend_required',
    complianceStatus: 'needs_review',
    licenseReviewStatus: 'needs_human_review',
    securityReviewStatus: 'needs_human_review',
    dependencyStatus: 'provider_sdk_not_installed',
    runtimeIsolationStatus: 'worker_boundary_required',
    productionApprovalStatus: 'not_approved',
    requiredEvidence: [
      'provider terms review',
      'secret boundary review',
      'model provenance review',
      'credit and approved snapshot gate evidence',
    ],
    blockerSummary: 'Provider execution remains blocked until human compliance/security review and future provider runtime approval.',
  }
}

function baseResult(warnings: string[] = []): ComplianceResult {
  return {
    status: 'backend_required',
    canProceed: false,
    canApproveProduction: false,
    canEnableRuntime: false,
    blockers: [],
    warnings: [
      'Compliance summaries are evidence boundaries only and are not legal advice.',
      ...warnings,
    ],
    requiredRecords: [],
    nextAction: 'Complete human legal/security/dependency review and add reviewed compliance persistence before enabling runtime use.',
  }
}

function addBlocker(result: ComplianceResult, gate: string, code: ApiErrorCode, message: string): void {
  result.blockers.push({ gate, code, message })
}

function addRequiredRecord(result: ComplianceResult, table: string, id: string | undefined, note: string, status: RequiredRecord['status'] = id ? 'present' : 'missing'): void {
  result.requiredRecords.push({ table, id, status, note })
}

function finalize(result: ComplianceResult, readOnlyReady = false): ComplianceResult {
  result.canApproveProduction = false
  result.canEnableRuntime = false

  if (result.blockers.length === 0 && readOnlyReady) {
    result.status = 'ready'
    result.canProceed = true
    result.nextAction = 'Static compliance inventory is available. Production/runtime approval remains blocked until human review.'
    return result
  }

  result.status = result.blockers.some((blocker) => blocker.code === 'BACKEND_REQUIRED') ? 'backend_required' : 'blocked'
  result.canProceed = false
  return result
}

function addComplianceRuntimeBlockers(result: ComplianceResult): void {
  addBlocker(result, 'ComplianceReviewPersistenceGate', 'BACKEND_REQUIRED', 'Compliance review records are a future backend/service-role persistence boundary.')
  addBlocker(result, 'HumanLegalReviewGate', 'BACKEND_REQUIRED', 'Prompt 16 cannot provide legal advice or approve production use.')
  addBlocker(result, 'ProductionUnlockGate', 'BACKEND_REQUIRED', 'Production, beta, and broad-media runtime unlocks remain blocked.')
}

function buildAuditEvent(action: string, userId: string, details: Record<string, unknown>): Record<string, unknown> {
  return sanitizeJson({
    eventType: `compliance.${action}`,
    userId,
    sanitized: true,
    details,
    createdAt: nowIso(),
  })
}

function packageInventory(): Record<string, unknown> {
  const packageJson = readJsonFile('package.json')
  const packageLock = readJsonFile('package-lock.json')
  const dependencies = isRecord(packageJson.dependencies) ? Object.keys(packageJson.dependencies) : []
  const devDependencies = isRecord(packageJson.devDependencies) ? Object.keys(packageJson.devDependencies) : []
  const lockPackages = isRecord(packageLock.packages) ? Object.keys(packageLock.packages).filter(Boolean) : []

  return {
    packageName: stringValue(packageJson.name) ?? 'unknown',
    dependencyCount: dependencies.length,
    devDependencyCount: devDependencies.length,
    lockfilePackageCount: lockPackages.length,
    dependencySubjects: dependencies.map((dependency) => dependencySubject(dependency, 'dependency')),
    devDependencySubjects: devDependencies.map((dependency) => dependencySubject(dependency, 'devDependency')),
    packageLockPresent: Object.keys(packageLock).length > 0,
    auditPolicy: 'Record npm audit output only; do not apply automated audit remediation in Prompt 16.',
  }
}

function dependencySubject(name: string, category: string): ComplianceSubjectSummary {
  return {
    reviewSubjectType: 'dependency',
    reviewSubjectKey: name,
    displayName: name,
    category,
    executionStatus: 'installed_from_lockfile',
    complianceStatus: 'needs_review',
    licenseReviewStatus: 'needs_human_review',
    securityReviewStatus: 'needs_vulnerability_review',
    dependencyStatus: 'present_in_package_manifest',
    runtimeIsolationStatus: 'depends_on_usage_context',
    productionApprovalStatus: 'not_approved',
    requiredEvidence: ['package manifest review', 'lockfile review', 'npm audit record', 'license/security review'],
    blockerSummary: 'Dependency production approval requires human license/security review; Prompt 16 does not mutate package files.',
  }
}

function toolSubjects(): ComplianceSubjectSummary[] {
  const readiness = listToolReadiness()
  return readiness.tools.map((tool) => ({
    reviewSubjectType: 'tool' as const,
    reviewSubjectKey: tool.toolId,
    displayName: tool.displayName,
    category: tool.family,
    executionStatus: tool.allowedInRuntime ? 'runtime_flag_present_but_blocked_by_prompt_16_review' : tool.readinessState,
    complianceStatus: 'needs_review',
    licenseReviewStatus: 'needs_human_review',
    securityReviewStatus: 'needs_human_review',
    dependencyStatus: tool.requiresDockerImage ? 'future_worker_image_required' : 'static_registry_only',
    runtimeIsolationStatus: tool.requiresWorker ? 'worker_isolation_required' : 'runtime_boundary_required',
    productionApprovalStatus: 'not_approved',
    requiredEvidence: [
      'license review',
      'security review',
      ...(tool.requiresModelArtifact ? ['model/provenance review'] : []),
      ...(tool.requiresWorker ? ['worker isolation review'] : []),
    ],
    blockerSummary: tool.blockedReason ?? 'Tool remains not production-approved until human compliance/security review is complete.',
  }))
}

function allSubjects(): ComplianceSubjectSummary[] {
  const inventory = packageInventory()
  return [
    ...toolSubjects(),
    ...PROVIDER_SUBJECTS,
    ...(inventory.dependencySubjects as ComplianceSubjectSummary[]),
  ]
}

function readJsonFile(relativePath: string): Record<string, unknown> {
  try {
    const absolutePath = path.join(process.cwd(), relativePath)
    return JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as Record<string, unknown>
  } catch {
    return {}
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function filterSubjects(input: ComplianceSubjectsListInput): ComplianceSubjectSummary[] {
  return allSubjects().filter((subject) => {
    if (input.reviewSubjectType && subject.reviewSubjectType !== input.reviewSubjectType) return false
    if (!input.includeBlocked && subject.productionApprovalStatus === 'not_approved') return false
    return true
  })
}

function findSubject(type: ReviewSubjectType | undefined, key: string | undefined): ComplianceSubjectSummary | null {
  if (!type || !key) return null
  return allSubjects().find((subject) => subject.reviewSubjectType === type && subject.reviewSubjectKey === key) ?? null
}

function categorySummary(category: ReviewCategory): Record<string, unknown> {
  return {
    category,
    status: 'backend_required',
    humanReviewRequired: true,
    aiLegalApprovalProvided: false,
    productionApproved: false,
    blocker: `${category} review requires future human-reviewed evidence and compliance records.`,
  }
}

async function checkProjectAccessIfPresent(context: ServiceContext, result: ComplianceResult, projectId?: string): Promise<void> {
  if (!projectId) return
  const access = await createProjectService(context).checkProjectAccess(projectId)
  addRequiredRecord(result, 'projects', projectId, `Project access check status: ${access.status}`, access.status === 'ready' ? 'present' : 'backend_required')
  if (access.status !== 'ready') {
    addBlocker(result, 'ProjectAccessGate', 'BACKEND_REQUIRED', 'Project access could not be validated without backend Supabase runtime.')
    result.warnings.push(...access.warnings)
  }
}

export function createComplianceService(context: ServiceContext) {
  async function checkReadiness(input: ComplianceReadinessInput): Promise<ComplianceResult> {
    const userId = getRequiredAuthUserId(context)
    const result = baseResult()
    addRequiredRecord(result, 'workspaces', input.workspaceId, 'Workspace scope for compliance review boundary.')
    addRequiredRecord(result, 'compliance_review_records', undefined, 'Future compliance review persistence is required before approvals can be authoritative.', 'backend_required')
    await checkProjectAccessIfPresent(context, result, input.projectId)

    const subject = findSubject(input.reviewSubjectType, input.reviewSubjectKey)
    result.subject = subject
    result.staticInventory = {
      subjectCount: allSubjects().length,
      packageInventory: packageInventory(),
    }
    result.audit = buildAuditEvent('readiness_checked', userId, {
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      reviewSubjectType: input.reviewSubjectType,
      reviewSubjectKey: input.reviewSubjectKey,
    })
    addComplianceRuntimeBlockers(result)
    return finalize(result)
  }

  function listSubjects(input: ComplianceSubjectsListInput): ComplianceResult {
    getRequiredAuthUserId(context)
    const subjects = filterSubjects(input)
    const result = baseResult(['Static compliance subject inventory only; no review records were read or written.'])
    result.subjects = subjects
    result.staticInventory = {
      subjectCount: subjects.length,
      packageInventory: packageInventory(),
    }
    return finalize(result, true)
  }

  function getSubject(input: ComplianceSubjectGetQuery): ComplianceResult {
    getRequiredAuthUserId(context)
    const result = baseResult(['Static compliance subject lookup only; no review records were read or written.'])
    result.subject = findSubject(input.reviewSubjectType, input.reviewSubjectKey)
    if (!result.subject) {
      addBlocker(result, 'ComplianceSubjectGate', 'VALIDATION_FAILED', 'Compliance subject is not present in the static Prompt 16 inventory.')
    }
    return finalize(result, Boolean(result.subject))
  }

  async function previewReview(input: ComplianceReviewPreviewInput | ComplianceReviewCreateBoundaryInput, idempotencyKey: string): Promise<ComplianceResult> {
    const userId = getRequiredAuthUserId(context)
    const result = baseResult()
    await checkProjectAccessIfPresent(context, result, input.projectId)
    result.subject = findSubject(input.reviewSubjectType, input.reviewSubjectKey)
    result.review = sanitizeJson({
      reviewMode: input.reviewMode,
      reviewSubjectType: input.reviewSubjectType,
      reviewSubjectKey: input.reviewSubjectKey,
      reviewCategory: input.reviewCategory,
      requestedStatus: input.reviewStatus,
      riskLevel: input.riskLevel,
      evidenceRefs: input.evidenceRefs,
      restrictions: input.restrictions,
      forbiddenOperations: input.forbiddenOperations,
      allowedRuntimeScopes: input.allowedRuntimeScopes,
      idempotencyKey,
      aiLegalApprovalProvided: false,
      productionApproved: false,
    })
    result.audit = buildAuditEvent('review_previewed', userId, {
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      reviewSubjectType: input.reviewSubjectType,
      reviewSubjectKey: input.reviewSubjectKey,
      reviewCategory: input.reviewCategory,
    })
    addComplianceRuntimeBlockers(result)
    return finalize(result)
  }

  async function createReviewBoundary(input: ComplianceReviewCreateBoundaryInput, idempotencyKey: string): Promise<ComplianceResult> {
    const result = await previewReview(input, idempotencyKey)
    result.review = {
      ...result.review,
      createBoundary: 'backend_required',
      writeOccurred: false,
      appendOnlyHistoryExpected: true,
    }
    result.nextAction = 'Add reviewed compliance tables/RLS and human approval workflow before writing compliance review records.'
    return result
  }

  function getReview(input: ComplianceReviewGetInput): ComplianceResult {
    getRequiredAuthUserId(context)
    const result = baseResult()
    addRequiredRecord(result, 'compliance_review_records', input.complianceReviewId, 'Future compliance review record read requires backend persistence.', 'backend_required')
    addComplianceRuntimeBlockers(result)
    return finalize(result)
  }

  function listReviewsForSubject(input: ComplianceReviewListForSubjectInput): ComplianceResult {
    getRequiredAuthUserId(context)
    const result = baseResult()
    result.subject = findSubject(input.reviewSubjectType, input.reviewSubjectKey)
    addRequiredRecord(result, 'compliance_review_records', undefined, 'Future append-only compliance review history is required.', 'backend_required')
    addComplianceRuntimeBlockers(result)
    return finalize(result)
  }

  async function blockers(input: ComplianceBlockersInput, idempotencyKey: string): Promise<ComplianceResult> {
    const result = await checkReadiness({ ...input, reviewMode: 'readiness' })
    result.review = sanitizeJson({ idempotencyKey, blockerCount: result.blockers.length })
    return result
  }

  async function categoryReadiness(input: ComplianceReadinessInput, category: ReviewCategory): Promise<ComplianceResult> {
    const result = await checkReadiness({ ...input, reviewCategory: category })
    const summary = categorySummary(category)
    if (category === 'license') result.license = summary
    if (category === 'security') result.security = summary
    if (category === 'dependency') result.dependency = { ...summary, packageInventory: packageInventory() }
    if (category === 'runtime_isolation') result.runtimeApproval = summary
    return result
  }

  async function productionUnlockBlocked(input: ComplianceProductionUnlockBlockedInput, idempotencyKey: string): Promise<ComplianceResult> {
    const result = await checkReadiness({ ...input, reviewMode: 'readiness' })
    result.productionUnlock = sanitizeJson({
      requestedUnlockScope: input.requestedUnlockScope,
      status: 'blocked',
      productionApproved: false,
      betaApproved: false,
      broadMediaApproved: false,
      idempotencyKey,
      reason: 'Prompt 16 cannot approve production, beta, or broad real-media runtime use.',
    })
    result.status = 'blocked'
    result.canProceed = false
    return result
  }

  function auditSummary(input: ComplianceAuditSummaryInput): ComplianceResult {
    getRequiredAuthUserId(context)
    const result = baseResult(['Static audit summary only; no audit table was read.'])
    result.audit = sanitizeJson({
      reviewSubjectType: input.reviewSubjectType,
      reviewSubjectKey: input.reviewSubjectKey,
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      appendOnlyAuditExpected: true,
      persistedAuditAvailable: false,
    })
    addRequiredRecord(result, 'audit_events', undefined, 'Future append-only sanitized audit events are expected for compliance review changes.', 'backend_required')
    return finalize(result)
  }

  return {
    checkReadiness,
    listSubjects,
    getSubject,
    previewReview,
    createReviewBoundary,
    getReview,
    listReviewsForSubject,
    blockers,
    categoryReadiness,
    productionUnlockBlocked,
    auditSummary,
  }
}
