import type {
  EditReferenceDetail,
  EditReferenceListItem,
  PreferenceApplicationRecord,
  PreferenceApplicationSource,
  PreferenceApplicationTargetContextSnapshot,
} from '../types/edit-reference'
import type { PreferenceApplicationDownstreamContext } from '../types/edit-reference-integration'
import type {
  PreferenceApplicationDownstreamInvalidationReceipt,
  PreferenceApplicationInvalidationReason,
} from '../types/edit-reference-integration'
import type { ProjectEditSessionRecord } from '../types/project-edit-session'
import type { ProjectEditSessionBundleRecord } from '../types/project-edit-session-repository'
import type { TargetVideoUnderstandingPackage } from '../types/edit-reference-target-video-understanding'
import type {
  TargetVideoUnderstandingApiData,
  TargetVideoUnderstandingSchedule,
} from '../types/edit-reference-target-video-understanding'
import { createEditReferenceApiClient, type EditReferenceApiClient } from './edit-reference-api-client'
import {
  createPreferenceApplicationDownstreamContext,
  readPreferenceApplicationIntegrationState,
} from './edit-reference-downstream-context'
import type { ProjectEditSessionApiClient } from './project-edit-session-api-client'
import {
  createEditReferenceDeterministicHash,
  stableEditReferenceJson,
} from './edit-reference-deterministic-hash'
import type { ProjectEditBriefBackendLocalRecord } from './project-edit-brief-backend-local'

export const EDIT_REFERENCE_WORKSPACE_ID =
  (import.meta.env?.VITE_REEDITPRO_EDIT_REFERENCE_WORKSPACE_ID as string | undefined)?.trim()
  || (import.meta.env?.VITE_REEDITPRO_INTERNAL_TEST_WORKSPACE_ID as string | undefined)?.trim()
  || 'workspace-private-beta'

export type ProjectEditSessionTargetStudyResult =
  | {
      ok: true
      package: TargetVideoUnderstandingPackage
      schedule: TargetVideoUnderstandingSchedule
      referenceRevision: number
      warnings: string[]
    }
  | {
      ok: false
      message: string
      notFound?: boolean
    }

export interface ProjectEditSessionEditReferenceIntegrationModel {
  backendAvailable: boolean
  approvedReferences: EditReferenceListItem[]
  targetApplications: PreferenceApplicationRecord[]
  activeApplication?: PreferenceApplicationRecord
  stagedApplication?: PreferenceApplicationRecord
  sessionIntegrationStatus?: ReturnType<typeof readPreferenceApplicationIntegrationState>
  warnings: string[]
}

export async function loadProjectEditSessionEditReferenceIntegration(input: {
  editReferenceClient?: EditReferenceApiClient
  session: ProjectEditSessionRecord
  workspaceId?: string
}): Promise<ProjectEditSessionEditReferenceIntegrationModel> {
  const api = input.editReferenceClient ?? createEditReferenceApiClient()
  if (!api.available) {
    return {
      backendAvailable: false,
      approvedReferences: [],
      targetApplications: [],
      sessionIntegrationStatus: readPreferenceApplicationIntegrationState(input.session),
      warnings: ['The private Edit Reference backend is not configured for this browser runtime.'],
    }
  }
  const workspaceId = input.workspaceId ?? EDIT_REFERENCE_WORKSPACE_ID
  const [referencesResult, applicationsResult] = await Promise.all([
    api.list(workspaceId),
    api.listApplications(workspaceId),
  ])
  const approvedReferences = referencesResult.ok
    ? referencesResult.data.references.filter((item) => item.reference.dnaStatus === 'approved' && item.currentStudy.status === 'approved')
    : []
  const targetApplications = applicationsResult.ok
    ? applicationsResult.data.applications.filter((application) => (
      application.projectId === input.session.projectId
      && application.editSessionId === input.session.id
    ))
    : []
  return {
    backendAvailable: true,
    approvedReferences,
    targetApplications,
    activeApplication: targetApplications.find((application) => application.status === 'prepared' && application.targetIntegrationStatus === 'connected'),
    stagedApplication: targetApplications.find((application) => application.status === 'prepared' && application.targetIntegrationStatus === 'not_connected'),
    sessionIntegrationStatus: readPreferenceApplicationIntegrationState(input.session),
    warnings: [
      ...(referencesResult.ok ? referencesResult.warnings : [referencesResult.message]),
      ...(applicationsResult.ok ? applicationsResult.warnings : [applicationsResult.message]),
    ],
  }
}

export async function recoverConnectedPreferenceApplicationForProjectEditSession(input: {
  editReferenceClient?: EditReferenceApiClient
  projectEditSessionClient: ProjectEditSessionApiClient
  session: ProjectEditSessionRecord
  workspaceId?: string
}): Promise<{ recovered: boolean; message?: string }> {
  const model = await loadProjectEditSessionEditReferenceIntegration({
    editReferenceClient: input.editReferenceClient,
    session: input.session,
    workspaceId: input.workspaceId,
  })
  if (
    !model.activeApplication
    || (
      model.sessionIntegrationStatus?.status === 'connected_mock'
      && model.sessionIntegrationStatus.context?.applicationId === model.activeApplication.id
    )
  ) {
    return { recovered: false }
  }
  const activated = await input.projectEditSessionClient.preference.activateApplication({
    editSessionId: input.session.id,
    application: model.activeApplication,
  })
  return activated.ok
    ? { recovered: true, message: `${model.activeApplication.editReferenceName} connection restored from backend-local application authority.` }
    : { recovered: false, message: 'The connected Edit Reference needs a safe activation retry.' }
}

/**
 * Recreates only the browser-mock session shell when a reload loses its in-memory
 * record. The connected backend-local PreferenceApplication remains the source of
 * truth; no reference selection or downstream context is copied into another store.
 */
export async function recoverMissingProjectEditSessionFromPreferenceApplication(input: {
  editReferenceClient?: EditReferenceApiClient
  projectEditSessionClient: ProjectEditSessionApiClient
  projectId: string
  editSessionId: string
  workspaceId?: string
}): Promise<{ recovered: boolean; message?: string }> {
  const api = input.editReferenceClient ?? createEditReferenceApiClient()
  const workspaceId = input.workspaceId ?? EDIT_REFERENCE_WORKSPACE_ID
  const applicationsResult = await api.listApplications(workspaceId)
  if (!applicationsResult.ok) return { recovered: false, message: applicationsResult.message }
  const targetApplications = applicationsResult.data.applications
    .filter((candidate) => (
      candidate.projectId === input.projectId
      && candidate.editSessionId === input.editSessionId
    ))
    .sort((left, right) => right.version - left.version)[0]
  const application = applicationsResult.data.applications
    .filter((candidate) => (
      candidate.projectId === input.projectId
      && candidate.editSessionId === input.editSessionId
      && candidate.status === 'prepared'
      && candidate.targetIntegrationStatus === 'connected'
    ))
    .sort((left, right) => right.version - left.version)[0]
    ?? targetApplications
  if (!application) return { recovered: false }

  const created = await input.projectEditSessionClient.sessions.create({
    id: input.editSessionId,
    projectId: input.projectId,
    name: application.targetContext.editName,
    description: 'Recovered mock Edit Chat shell for a connected backend-local Edit Reference application.',
    status: 'draft',
    aspectRatio: application.targetContext.aspectRatio,
    platformTarget: application.targetContext.platformTarget,
    selectedEditLevel: application.targetContext.selectedEditLevel,
    metadata: {
      recoveredFromCanonicalPreferenceApplication: true,
      exactPreferenceApplicationId: application.id,
      recoveredApplicationStatus: application.status,
      noReferenceSelectionDuplicated: true,
      mockOnly: true,
    },
  })
  return created.ok
    ? { recovered: true, message: `${application.targetContext.editName} session shell recovered from canonical application identity.` }
    : { recovered: false, message: created.error?.message ?? 'The target session shell could not be recovered safely.' }
}

export async function preparePreferenceApplicationForProjectEditSession(input: {
  applicationSource?: PreferenceApplicationSource
  bundle: ProjectEditSessionBundleRecord
  currentUserInstruction: string
  editReferenceId: string
  editReferenceClient?: EditReferenceApiClient
  outputFrameConfirmed: true
  targetUnderstandingPackage?: TargetVideoUnderstandingPackage
  workspaceId?: string
}): Promise<{ ok: true; application: PreferenceApplicationRecord; detail: EditReferenceDetail } | { ok: false; message: string }> {
  const api = input.editReferenceClient ?? createEditReferenceApiClient()
  const workspaceId = input.workspaceId ?? EDIT_REFERENCE_WORKSPACE_ID
  const detailResult = await api.get(workspaceId, input.editReferenceId)
  if (!detailResult.ok) return { ok: false, message: detailResult.message }
  const detail = detailResult.data.detail
  const approvedDNA = [...detail.dnaVersions]
    .filter((version) => version.status === 'approved' && Boolean(version.approval))
    .sort((left, right) => right.version - left.version)[0]
  if (!approvedDNA) return { ok: false, message: 'This Edit Reference does not have an approved Preference DNA version.' }
  if (input.bundle.session.aspectRatio === 'custom') {
    return { ok: false, message: 'Confirm a supported 9:16, 16:9, 1:1, or 4:5 output frame before adapting this Edit Reference.' }
  }
  if (!input.targetUnderstandingPackage) {
    return { ok: false, message: 'Complete the target-video understanding study before adapting this Edit Reference. The application cannot rely on a caller-written source summary.' }
  }
  const targetContext = createPreferenceApplicationTargetContext({
    bundle: input.bundle,
    currentUserInstruction: input.currentUserInstruction,
    outputFrameConfirmed: input.outputFrameConfirmed,
  })
  const targetValidationMessage = validateTargetUnderstandingForApplication({
    bundle: input.bundle,
    editReferenceId: input.editReferenceId,
    targetContext,
    targetUnderstanding: input.targetUnderstandingPackage,
    workspaceId,
  })
  if (targetValidationMessage) return { ok: false, message: targetValidationMessage }
  const existing = detail.applications.find((application) => (
    application.projectId === input.bundle.session.projectId
    && application.editSessionId === input.bundle.session.id
    && application.status === 'prepared'
  ))
  if (existing) {
    const binding = existing.targetUnderstanding
    const exactExistingApplication = existing.applicationVersion === 'edit-reference-target-application-v2'
      && binding?.packageId === input.targetUnderstandingPackage.packageId
      && binding.packageDigestSha256 === input.targetUnderstandingPackage.packageDigestSha256
      && binding.sourceStorageObjectRecordId === input.targetUnderstandingPackage.source.storageObjectRecordId
      && binding.sourceMediaAssetId === input.targetUnderstandingPackage.source.mediaAssetId
      && binding.editBriefDigestSha256 === input.targetUnderstandingPackage.declaredContext.editBriefDigestSha256
      && stableEditReferenceJson(existing.targetContext) === stableEditReferenceJson(targetContext)
    if (exactExistingApplication) return { ok: true, application: existing, detail }
    return {
      ok: false,
      message: 'Existing prepared guidance does not match the current verified target study. Replace or remove that guidance before preparing another application.',
    }
  }
  const created = await api.createPreferenceApplication(detail.study.id, approvedDNA.id, {
    workspaceId,
    expectedReferenceRevision: detail.reference.revision,
    expectedDNAContentDigest: approvedDNA.contentDigest,
    acknowledgeAdaptNotCopy: true,
    applicationSource: input.applicationSource ?? 'session_panel',
    targetContext,
    ...targetUnderstandingRequestBinding(input.targetUnderstandingPackage),
  }, stableLifecycleKey(
    'prepare',
    `${input.bundle.session.id}-${detail.reference.id}`,
    createEditReferenceDeterministicHash({
      approvedDNAContentDigest: approvedDNA.contentDigest,
      applicationSource: input.applicationSource ?? 'session_panel',
      targetContext,
      targetUnderstandingPackageId: input.targetUnderstandingPackage.packageId,
      targetUnderstandingPackageDigestSha256: input.targetUnderstandingPackage.packageDigestSha256,
    }),
  ))
  if (!created.ok) return { ok: false, message: created.message }
  const application = created.data.detail.applications.find((candidate) => (
    candidate.projectId === input.bundle.session.projectId
    && candidate.editSessionId === input.bundle.session.id
    && candidate.status === 'prepared'
  ))
  return application
    ? { ok: true, application, detail: created.data.detail }
    : { ok: false, message: 'The target application was saved but could not be read back.' }
}

export async function startTargetVideoUnderstandingForProjectEditSession(input: {
  bundle: ProjectEditSessionBundleRecord
  currentUserInstruction: string
  editBrief: ProjectEditBriefBackendLocalRecord
  editReferenceClient?: EditReferenceApiClient
  editReferenceId: string
  workspaceId?: string
}): Promise<ProjectEditSessionTargetStudyResult> {
  const authority = validateTargetStudyBrowserAuthority(input)
  if (!authority.ok) return authority
  const api = input.editReferenceClient ?? createEditReferenceApiClient()
  if (!api.available) {
    return { ok: false, message: 'The private video-study backend is not configured for this browser runtime.' }
  }
  const detailResult = await api.get(authority.workspaceId, input.editReferenceId)
  if (!detailResult.ok) return { ok: false, message: detailResult.message }
  const targetContext = createPreferenceApplicationTargetContext({
    bundle: input.bundle,
    currentUserInstruction: input.currentUserInstruction,
    outputFrameConfirmed: true,
  })
  const detail = detailResult.data.detail
  const result = await api.startTargetVideoUnderstanding(
    input.bundle.session.projectId,
    input.bundle.session.id,
    {
      workspaceId: authority.workspaceId,
      editReferenceId: input.editReferenceId,
      studySessionId: detail.study.id,
      sourceStorageObjectRecordId: authority.sourceStorageObjectRecordId,
      sourceMediaAssetId: authority.sourceMediaAssetId,
      expectedEditBriefRevision: input.editBrief.revisionNumber,
      expectedEditBriefDigestSha256: input.editBrief.contentDigestSha256,
      contentType: targetContext.contentType,
      currentUserInstruction: targetContext.currentUserInstruction,
      selectedEditLevel: targetContext.selectedEditLevel,
      aspectRatio: targetContext.aspectRatio,
      outputFrameConfirmed: true,
      platformTarget: targetContext.platformTarget,
      storyRole: targetContext.storyRole,
      budgetPreference: targetContext.budgetPreference,
      directives: targetContext.directives,
      approvedConstraints: targetContext.approvedConstraints,
    },
    stableLifecycleKey('target-study', input.bundle.session.id, createEditReferenceDeterministicHash({
      editReferenceId: input.editReferenceId,
      studySessionId: detail.study.id,
      sourceStorageObjectRecordId: authority.sourceStorageObjectRecordId,
      sourceMediaAssetId: authority.sourceMediaAssetId,
      editBriefRevision: input.editBrief.revisionNumber,
      editBriefDigestSha256: input.editBrief.contentDigestSha256,
      targetContext,
    })),
  )
  return targetStudyApiResult(result, detail.reference.revision)
}

export async function readTargetVideoUnderstandingForProjectEditSession(input: {
  bundle: ProjectEditSessionBundleRecord
  editBrief: ProjectEditBriefBackendLocalRecord
  editReferenceClient?: EditReferenceApiClient
  editReferenceId: string
  workspaceId?: string
}): Promise<ProjectEditSessionTargetStudyResult> {
  const authority = validateTargetStudyBrowserAuthority(input)
  if (!authority.ok) return authority
  const api = input.editReferenceClient ?? createEditReferenceApiClient()
  if (!api.available) {
    return { ok: false, message: 'The private video-study backend is not configured for this browser runtime.' }
  }
  const detailResult = await api.get(authority.workspaceId, input.editReferenceId)
  if (!detailResult.ok) return { ok: false, message: detailResult.message }
  const detail = detailResult.data.detail
  const result = await api.getTargetVideoUnderstanding(
    input.bundle.session.projectId,
    input.bundle.session.id,
    {
      workspaceId: authority.workspaceId,
      editReferenceId: input.editReferenceId,
      studySessionId: detail.study.id,
      sourceStorageObjectRecordId: authority.sourceStorageObjectRecordId,
      sourceMediaAssetId: authority.sourceMediaAssetId,
      expectedEditBriefRevision: input.editBrief.revisionNumber,
      expectedEditBriefDigestSha256: input.editBrief.contentDigestSha256,
    },
  )
  if (!result.ok && result.status === 404) {
    return { ok: false, notFound: true, message: result.message }
  }
  return targetStudyApiResult(result, detail.reference.revision)
}

function validateTargetStudyBrowserAuthority(input: {
  bundle: ProjectEditSessionBundleRecord
  editBrief: ProjectEditBriefBackendLocalRecord
  workspaceId?: string
}):
  | {
      ok: true
      workspaceId: string
      sourceStorageObjectRecordId: string
      sourceMediaAssetId: string
    }
  | { ok: false; message: string } {
  const workspaceId = input.workspaceId ?? input.bundle.session.workspaceId ?? EDIT_REFERENCE_WORKSPACE_ID
  if (input.bundle.session.aspectRatio === 'custom') {
    return { ok: false, message: 'Confirm a supported output frame before studying how this Edit Reference should adapt.' }
  }
  if (
    input.editBrief.workspaceId !== workspaceId
    || input.editBrief.projectId !== input.bundle.session.projectId
    || input.editBrief.editSessionId !== input.bundle.session.id
  ) {
    return { ok: false, message: 'The saved Edit Brief does not belong to this exact workspace, project, and Edit Chat.' }
  }
  if (input.editBrief.readbackVerified !== true) {
    return { ok: false, message: 'Read back the saved Edit Brief before starting whole-video study.' }
  }
  const sourceStorageObjectRecordId = input.editBrief.sourceStorageObjectRecordId?.trim()
  const sourceMediaAssetId = input.editBrief.sourceMediaAssetId?.trim()
  if (!sourceStorageObjectRecordId || !sourceMediaAssetId) {
    return { ok: false, message: 'Save the exact uploaded source video in the Edit Brief before starting whole-video study.' }
  }
  if (
    !Number.isInteger(input.editBrief.revisionNumber)
    || input.editBrief.revisionNumber < 1
    || !/^[a-f0-9]{64}$/.test(input.editBrief.contentDigestSha256)
  ) {
    return { ok: false, message: 'The saved Edit Brief is missing its exact revision or integrity digest.' }
  }
  return {
    ok: true,
    workspaceId,
    sourceStorageObjectRecordId,
    sourceMediaAssetId,
  }
}

function targetStudyApiResult(
  result: import('../types/edit-reference').EditReferenceApiResult<TargetVideoUnderstandingApiData>,
  referenceRevision: number,
): ProjectEditSessionTargetStudyResult {
  if (!result.ok) return { ok: false, message: result.message }
  return {
    ok: true,
    package: result.data.targetVideoUnderstandingPackage,
    schedule: result.data.schedule,
    referenceRevision,
    warnings: result.warnings,
  }
}

export async function connectPreferenceApplicationToProjectEditSession(input: {
  application: PreferenceApplicationRecord
  editReferenceClient?: EditReferenceApiClient
  outputFrameConfirmed: true
  projectEditSessionClient: ProjectEditSessionApiClient
  referenceRevision: number
  workspaceId?: string
}): Promise<{
  ok: boolean
  application?: PreferenceApplicationRecord
  context?: PreferenceApplicationDownstreamContext
  message: string
}> {
  const api = input.editReferenceClient ?? createEditReferenceApiClient()
  let application = input.application
  const context = createPreferenceApplicationDownstreamContext(application, application.targetIntegrationStatus === 'connected' ? 'connected_mock' : 'staged_unconfirmed')

  if (application.targetIntegrationStatus === 'not_connected') {
    const staged = await input.projectEditSessionClient.preference.stageApplication<{
      targetSessionReceipt: import('../types/edit-reference-integration').PreferenceApplicationTargetSessionReceipt
    }>({
      editSessionId: application.editSessionId,
      application,
      context,
      outputFrameConfirmed: input.outputFrameConfirmed,
    })
    const receipt = staged.data?.targetSessionReceipt
    if (!staged.ok || !receipt) {
      return { ok: false, context, message: staged.error?.message ?? 'The exact application could not be staged in this Edit Chat.' }
    }
    const connected = await api.connectPreferenceApplication(application.id, {
      workspaceId: input.workspaceId ?? EDIT_REFERENCE_WORKSPACE_ID,
      expectedReferenceRevision: input.referenceRevision,
      expectedApplicationContentDigest: application.contentDigest,
      targetSessionReceipt: receipt,
    }, stableLifecycleKey('connect', application.id, application.contentDigest))
    if (!connected.ok) {
      return {
        ok: false,
        context,
        message: `${connected.message} The staged context remains inactive and can be retried safely.`,
      }
    }
    const connectedApplication = connected.data.detail.applications.find((candidate) => candidate.id === application.id)
    if (!connectedApplication) return { ok: false, context, message: 'The backend-local connection completed but could not be read back.' }
    application = connectedApplication
  }

  const activated = await input.projectEditSessionClient.preference.activateApplication({
    editSessionId: application.editSessionId,
    application,
  })
  if (!activated.ok) {
    return {
      ok: false,
      application,
      context: application.downstreamContext,
      message: 'The application is connected backend-locally, but this Edit Chat still needs a safe activation retry.',
    }
  }
  return {
    ok: true,
    application,
    context: application.downstreamContext,
    message: `${application.editReferenceName} is connected as target-adapted planning guidance. Current instructions and confirmed markers remain higher priority.`,
  }
}

export async function invalidatePreferenceApplicationForProjectEditSession(input: {
  application: PreferenceApplicationRecord
  projectEditSessionClient: ProjectEditSessionApiClient
  reason: PreferenceApplicationInvalidationReason
}): Promise<{
  ok: boolean
  invalidationReceipt?: PreferenceApplicationDownstreamInvalidationReceipt
  message: string
}> {
  if (
    input.application.status !== 'prepared'
    || input.application.targetIntegrationStatus !== 'connected'
    || !input.application.downstreamContext
  ) {
    return { ok: false, message: 'Only the exact connected Edit Reference guidance can be changed.' }
  }
  const invalidated = await input.projectEditSessionClient.preference.invalidateApplication<{
    invalidationReceipt: PreferenceApplicationDownstreamInvalidationReceipt
  }>({
    editSessionId: input.application.editSessionId,
    application: input.application,
    reason: input.reason,
  })
  const receipt = invalidated.data?.invalidationReceipt
  if (!invalidated.ok || !receipt) {
    return {
      ok: false,
      message: invalidated.error?.message ?? 'The connected guidance could not be invalidated safely.',
    }
  }
  return {
    ok: true,
    invalidationReceipt: receipt,
    message: input.reason === 'replace'
      ? 'The previous guidance is inactive while its replacement is prepared.'
      : 'The connected guidance is inactive and ready to be removed from this edit.',
  }
}

export async function removePreferenceApplicationFromProjectEditSession(input: {
  application: PreferenceApplicationRecord
  editReferenceClient?: EditReferenceApiClient
  projectEditSessionClient: ProjectEditSessionApiClient
  workspaceId?: string
}): Promise<{ ok: boolean; application?: PreferenceApplicationRecord; message: string }> {
  const api = input.editReferenceClient ?? createEditReferenceApiClient()
  const detailResult = await api.get(input.workspaceId ?? EDIT_REFERENCE_WORKSPACE_ID, input.application.editReferenceId)
  if (!detailResult.ok) return { ok: false, message: detailResult.message }
  const exactApplication = detailResult.data.detail.applications.find((candidate) => candidate.id === input.application.id)
  if (!exactApplication) return { ok: false, message: 'The connected Edit Reference history could not be read back.' }
  const invalidated = await invalidatePreferenceApplicationForProjectEditSession({
    application: exactApplication,
    projectEditSessionClient: input.projectEditSessionClient,
    reason: 'remove',
  })
  if (!invalidated.ok || !invalidated.invalidationReceipt) return invalidated
  const cleared = await api.clearPreferenceApplication(exactApplication.id, {
    workspaceId: input.workspaceId ?? EDIT_REFERENCE_WORKSPACE_ID,
    expectedReferenceRevision: detailResult.data.detail.reference.revision,
    expectedApplicationContentDigest: exactApplication.contentDigest,
    invalidationReceipt: invalidated.invalidationReceipt,
  }, stableLifecycleKey('remove', exactApplication.id, invalidated.invalidationReceipt.invalidatedAt))
  if (!cleared.ok) {
    return { ok: false, message: `${cleared.message} The prior guidance remains inactive and removal can be retried safely.` }
  }
  const application = cleared.data.detail.applications.find((candidate) => candidate.id === exactApplication.id)
  return {
    ok: Boolean(application?.status === 'cleared'),
    application,
    message: application?.status === 'cleared'
      ? `${application.editReferenceName} was removed from this edit. Its approved DNA and application history remain available.`
      : 'The removal completed but its history could not be verified.',
  }
}

export async function replacePreferenceApplicationForProjectEditSession(input: {
  applicationSource?: PreferenceApplicationSource
  bundle: ProjectEditSessionBundleRecord
  currentApplication: PreferenceApplicationRecord
  currentUserInstruction: string
  editReferenceClient?: EditReferenceApiClient
  nextEditReferenceId: string
  outputFrameConfirmed: true
  projectEditSessionClient: ProjectEditSessionApiClient
  targetUnderstandingPackage?: TargetVideoUnderstandingPackage
  workspaceId?: string
}): Promise<{ ok: boolean; application?: PreferenceApplicationRecord; message: string }> {
  const api = input.editReferenceClient ?? createEditReferenceApiClient()
  const workspaceId = input.workspaceId ?? EDIT_REFERENCE_WORKSPACE_ID
  const [currentDetailResult, nextDetailResult] = await Promise.all([
    api.get(workspaceId, input.currentApplication.editReferenceId),
    api.get(workspaceId, input.nextEditReferenceId),
  ])
  if (!currentDetailResult.ok) return { ok: false, message: currentDetailResult.message }
  if (!nextDetailResult.ok) return { ok: false, message: nextDetailResult.message }
  const currentApplication = currentDetailResult.data.detail.applications.find((candidate) => candidate.id === input.currentApplication.id)
  if (!currentApplication) return { ok: false, message: 'The connected Edit Reference history could not be read back.' }
  const nextDetail = nextDetailResult.data.detail
  const approvedDNA = [...nextDetail.dnaVersions]
    .filter((version) => version.status === 'approved' && Boolean(version.approval))
    .sort((left, right) => right.version - left.version)[0]
  if (!approvedDNA) return { ok: false, message: 'The replacement Edit Reference does not have approved Preference DNA.' }
  if (!input.targetUnderstandingPackage) {
    return { ok: false, message: 'Complete the target-video understanding study before replacing this Edit Reference. The current guidance was not invalidated.' }
  }

  const targetContext = createPreferenceApplicationTargetContext({
    bundle: input.bundle,
    currentUserInstruction: input.currentUserInstruction,
    outputFrameConfirmed: input.outputFrameConfirmed,
  })
  const targetValidationMessage = validateTargetUnderstandingForApplication({
    bundle: input.bundle,
    editReferenceId: input.nextEditReferenceId,
    targetContext,
    targetUnderstanding: input.targetUnderstandingPackage,
    workspaceId,
  })
  if (targetValidationMessage) return { ok: false, message: `${targetValidationMessage} The current guidance was not invalidated.` }

  const invalidated = await invalidatePreferenceApplicationForProjectEditSession({
    application: currentApplication,
    projectEditSessionClient: input.projectEditSessionClient,
    reason: 'replace',
  })
  if (!invalidated.ok || !invalidated.invalidationReceipt) return invalidated
  const created = await api.createPreferenceApplication(nextDetail.study.id, approvedDNA.id, {
    workspaceId,
    expectedReferenceRevision: nextDetail.reference.revision,
    expectedDNAContentDigest: approvedDNA.contentDigest,
    acknowledgeAdaptNotCopy: true,
    applicationSource: input.applicationSource ?? 'session_panel',
    targetContext,
    ...targetUnderstandingRequestBinding(input.targetUnderstandingPackage),
    replacesApplicationId: currentApplication.id,
    expectedReplacedReferenceRevision: currentDetailResult.data.detail.reference.revision,
    invalidationReceipt: invalidated.invalidationReceipt,
  }, stableLifecycleKey('replace', currentApplication.id, createEditReferenceDeterministicHash({
    approvedDNAContentDigest: approvedDNA.contentDigest,
    applicationSource: input.applicationSource ?? 'session_panel',
    targetContext,
    targetUnderstandingPackageId: input.targetUnderstandingPackage.packageId,
    targetUnderstandingPackageDigestSha256: input.targetUnderstandingPackage.packageDigestSha256,
  })))
  if (!created.ok) {
    return { ok: false, message: `${created.message} The previous guidance remains inactive and replacement can be retried safely.` }
  }
  const replacement = created.data.detail.applications.find((candidate) => candidate.replacesApplicationId === currentApplication.id)
  if (!replacement) return { ok: false, message: 'The replacement was prepared but could not be read back.' }
  const connected = await connectPreferenceApplicationToProjectEditSession({
    application: replacement,
    editReferenceClient: api,
    outputFrameConfirmed: true,
    projectEditSessionClient: input.projectEditSessionClient,
    referenceRevision: created.data.detail.reference.revision,
    workspaceId,
  })
  return {
    ok: connected.ok,
    application: connected.application ?? replacement,
    message: connected.ok
      ? `${replacement.editReferenceName} replaced the previous guidance for this edit. Prior versions remain in history.`
      : connected.message,
  }
}

function targetUnderstandingRequestBinding(
  target: TargetVideoUnderstandingPackage,
): Pick<
  import('../types/edit-reference').CreatePreferenceApplicationRequest,
  | 'targetUnderstandingPackageId'
  | 'targetUnderstandingPackageDigestSha256'
  | 'targetUnderstandingSourceStorageObjectRecordId'
  | 'targetUnderstandingSourceMediaAssetId'
  | 'targetUnderstandingEditBriefDigestSha256'
> {
  return {
    targetUnderstandingPackageId: target.packageId,
    targetUnderstandingPackageDigestSha256: target.packageDigestSha256,
    targetUnderstandingSourceStorageObjectRecordId: target.source.storageObjectRecordId,
    targetUnderstandingSourceMediaAssetId: target.source.mediaAssetId,
    targetUnderstandingEditBriefDigestSha256: target.declaredContext.editBriefDigestSha256,
  }
}

function validateTargetUnderstandingForApplication(input: {
  bundle: ProjectEditSessionBundleRecord
  editReferenceId: string
  targetContext: PreferenceApplicationTargetContextSnapshot
  targetUnderstanding: TargetVideoUnderstandingPackage
  workspaceId: string
}): string | undefined {
  const target = input.targetUnderstanding
  if (target.status !== 'ready' || !target.readyForPreferenceApplication) {
    return 'Whole-video study is not ready for preference adaptation.'
  }
  if (
    target.workspaceId !== input.workspaceId
    || target.projectId !== input.bundle.session.projectId
    || target.editSessionId !== input.bundle.session.id
    || target.editReferenceId !== input.editReferenceId
  ) {
    return 'Whole-video study does not belong to this exact workspace, edit, and Edit Reference.'
  }
  if (
    target.declaredContext.currentUserInstruction !== input.targetContext.currentUserInstruction
    || target.declaredContext.selectedEditLevel !== input.targetContext.selectedEditLevel
    || target.declaredContext.aspectRatio !== input.targetContext.aspectRatio
    || target.declaredContext.platformTarget !== input.targetContext.platformTarget
    || target.declaredContext.contentType !== input.targetContext.contentType
    || target.declaredContext.storyRole !== input.targetContext.storyRole
    || target.declaredContext.budgetPreference !== input.targetContext.budgetPreference
    || JSON.stringify(target.declaredContext.directives) !== JSON.stringify(input.targetContext.directives)
    || JSON.stringify(target.declaredContext.approvedConstraints) !== JSON.stringify(input.targetContext.approvedConstraints)
  ) {
    return 'The current instructions or output context changed after whole-video study. Refresh the study before adapting guidance.'
  }
  return undefined
}

export function createPreferenceApplicationTargetContext(input: {
  bundle: ProjectEditSessionBundleRecord
  currentUserInstruction: string
  outputFrameConfirmed: true
}): PreferenceApplicationTargetContextSnapshot {
  const session = input.bundle.session
  if (session.aspectRatio === 'custom') throw new Error('A supported confirmed output frame is required.')
  const instruction = input.currentUserInstruction.trim() || session.description || `Create ${session.name} for ${session.platformTarget}.`
  const lower = `${session.name} ${session.description ?? ''} ${instruction}`.toLowerCase()
  const sourceMode = /tutorial|founder|story|podcast|talk|voice|explain|interview/.test(lower) ? 'voice_first' : /silent|montage/.test(lower) ? 'silent_visual' : 'mixed'
  const contentType = /tutorial|how[- ]?to|workflow/.test(lower)
    ? 'tutorial'
    : /documentary|case study|founder story|story/.test(lower)
      ? 'documentary'
      : /lifestyle|travel|montage/.test(lower)
        ? 'lifestyle_montage'
        : /talk|podcast|interview/.test(lower)
          ? 'talking_head'
          : /product|demo|ad/.test(lower)
            ? 'product_demo'
            : 'custom'
  const captions = /no captions|avoid captions|without captions/.test(lower) ? 'avoid' : /caption|subtitle/.test(lower) ? 'required' : 'adapt'
  const music = /no music|without music/.test(lower) ? 'avoid' : /music|soundtrack/.test(lower) ? 'required' : 'adapt'
  const sfx = /no sfx|no sound effect|avoid sound effect|less sfx/.test(lower) ? 'avoid' : /sfx|sound effect/.test(lower) ? 'required' : 'adapt'
  const selectedEditLevel = session.selectedEditLevel ?? 'premium'
  return {
    projectId: session.projectId,
    editSessionId: session.id,
    projectName: titleCaseId(session.projectId),
    editName: session.name,
    sourceMode,
    contentType,
    sourceSummary: `${session.description ?? session.name} ${input.bundle.sources.length} source item(s) are registered in the mock Project Edit Session.`,
    currentUserInstruction: instruction,
    selectedEditLevel,
    aspectRatio: session.aspectRatio,
    outputFrameConfirmed: input.outputFrameConfirmed,
    platformTarget: session.platformTarget,
    storyRole: instruction.slice(0, 500),
    budgetPreference: selectedEditLevel === 'normal' ? 'efficient' : selectedEditLevel === 'ultra_premium' ? 'cinematic' : 'balanced',
    directives: {
      captions,
      music,
      sfx,
      sourceOrder: /reorder|restructure|new order/.test(lower) ? 'adapt' : 'preserve',
    },
    approvedConstraints: [
      `Keep all target decisions inside the confirmed ${session.aspectRatio} output frame.`,
      'Current user instructions and confirmed Edit Brief markers outrank reusable Preference DNA.',
      'Do not copy exact reference shots, timing, layouts, people, logos, music, sound effects, or creator identity.',
    ],
  }
}

function titleCaseId(value: string): string {
  return value.replace(/^mock-/, '').replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()).slice(0, 160)
}

function stableLifecycleKey(action: string, applicationId: string, versionToken: string): string {
  return `edit-reference-${action}-${applicationId}-${versionToken}`.slice(0, 200)
}
