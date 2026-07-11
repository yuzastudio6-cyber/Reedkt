import type {
  EditReferenceDetail,
  EditReferenceListItem,
  PreferenceApplicationRecord,
  PreferenceApplicationTargetContextSnapshot,
} from '../types/edit-reference'
import type { PreferenceApplicationDownstreamContext } from '../types/edit-reference-integration'
import type {
  PreferenceApplicationDownstreamInvalidationReceipt,
  PreferenceApplicationInvalidationReason,
} from '../types/edit-reference-integration'
import type { ProjectEditSessionRecord } from '../types/project-edit-session'
import type { ProjectEditSessionBundleRecord } from '../types/project-edit-session-repository'
import { createEditReferenceApiClient, type EditReferenceApiClient } from './edit-reference-api-client'
import {
  createPreferenceApplicationDownstreamContext,
  readPreferenceApplicationIntegrationState,
} from './edit-reference-downstream-context'
import type { ProjectEditSessionApiClient } from './project-edit-session-api-client'

export const EDIT_REFERENCE_WORKSPACE_ID =
  (import.meta.env?.VITE_REEDITPRO_EDIT_REFERENCE_WORKSPACE_ID as string | undefined)?.trim()
  || 'workspace-private-beta'

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
    || model.sessionIntegrationStatus?.status === 'connected_mock'
    || model.sessionIntegrationStatus?.status === 'invalidated'
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

export async function preparePreferenceApplicationForProjectEditSession(input: {
  bundle: ProjectEditSessionBundleRecord
  currentUserInstruction: string
  editReferenceId: string
  editReferenceClient?: EditReferenceApiClient
  outputFrameConfirmed: true
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
  const existing = detail.applications.find((application) => (
    application.projectId === input.bundle.session.projectId
    && application.editSessionId === input.bundle.session.id
    && application.status === 'prepared'
  ))
  if (existing) return { ok: true, application: existing, detail }
  if (input.bundle.session.aspectRatio === 'custom') {
    return { ok: false, message: 'Confirm a supported 9:16, 16:9, 1:1, or 4:5 output frame before adapting this Edit Reference.' }
  }
  const targetContext = createPreferenceApplicationTargetContext({
    bundle: input.bundle,
    currentUserInstruction: input.currentUserInstruction,
    outputFrameConfirmed: input.outputFrameConfirmed,
  })
  const created = await api.createPreferenceApplication(detail.study.id, approvedDNA.id, {
    workspaceId,
    expectedReferenceRevision: detail.reference.revision,
    expectedDNAContentDigest: approvedDNA.contentDigest,
    acknowledgeAdaptNotCopy: true,
    targetContext,
  })
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
  bundle: ProjectEditSessionBundleRecord
  currentApplication: PreferenceApplicationRecord
  currentUserInstruction: string
  editReferenceClient?: EditReferenceApiClient
  nextEditReferenceId: string
  outputFrameConfirmed: true
  projectEditSessionClient: ProjectEditSessionApiClient
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

  const invalidated = await invalidatePreferenceApplicationForProjectEditSession({
    application: currentApplication,
    projectEditSessionClient: input.projectEditSessionClient,
    reason: 'replace',
  })
  if (!invalidated.ok || !invalidated.invalidationReceipt) return invalidated
  const targetContext = createPreferenceApplicationTargetContext({
    bundle: input.bundle,
    currentUserInstruction: input.currentUserInstruction,
    outputFrameConfirmed: input.outputFrameConfirmed,
  })
  const created = await api.createPreferenceApplication(nextDetail.study.id, approvedDNA.id, {
    workspaceId,
    expectedReferenceRevision: nextDetail.reference.revision,
    expectedDNAContentDigest: approvedDNA.contentDigest,
    acknowledgeAdaptNotCopy: true,
    targetContext,
    replacesApplicationId: currentApplication.id,
    expectedReplacedReferenceRevision: currentDetailResult.data.detail.reference.revision,
    invalidationReceipt: invalidated.invalidationReceipt,
  }, stableLifecycleKey('replace', currentApplication.id, approvedDNA.contentDigest))
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
