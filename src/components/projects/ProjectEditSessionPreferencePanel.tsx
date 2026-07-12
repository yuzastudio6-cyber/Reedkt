import { useCallback, useEffect, useRef, useState } from 'react'
import { Badge } from '../Badge'
import { Card } from '../Card'
import type { ProjectEditSessionApiClient } from '../../lib/project-edit-session-api-client'
import {
  applyPreferenceToProjectEditSessionViaApi,
  clearPreferenceFromProjectEditSessionViaApi,
  createProjectEditSessionPreferenceBoundarySummary,
  loadProjectEditSessionPreferencePanelForUI,
  type ProjectEditSessionPreferencePanelForUI,
} from '../../lib/project-edit-session-preference-ui-adapter'
import type { ProjectEditSessionPreferenceOption } from '../../types/project-edit-session-preference'
import type { ProjectEditSessionBundleRecord } from '../../types/project-edit-session-repository'
import { createEditReferenceApiClient } from '../../lib/edit-reference-api-client'
import {
  connectPreferenceApplicationToProjectEditSession,
  loadProjectEditSessionEditReferenceIntegration,
  preparePreferenceApplicationForProjectEditSession,
  removePreferenceApplicationFromProjectEditSession,
  replacePreferenceApplicationForProjectEditSession,
  type ProjectEditSessionEditReferenceIntegrationModel,
} from '../../lib/project-edit-session-edit-reference-integration'
import { ProjectEditSessionDNAStatusCard } from './ProjectEditSessionDNAStatusCard'
import { ProjectEditSessionDoNotCopyRulesCard } from './ProjectEditSessionDoNotCopyRulesCard'
import { ProjectEditSessionPreferencePicker } from './ProjectEditSessionPreferencePicker'
import { ProjectEditSessionPreferenceStatusCard } from './ProjectEditSessionPreferenceStatusCard'
import { ProjectEditSessionEditReferencePicker } from './ProjectEditSessionEditReferencePicker'

const editReferenceClient = createEditReferenceApiClient()

type ProjectEditSessionPreferencePanelProps = {
  client: ProjectEditSessionApiClient
  editSessionId: string
  onPreferenceChanged: (message: string) => Promise<void> | void
  projectId: string
}

export function ProjectEditSessionPreferencePanel({
  client,
  editSessionId,
  onPreferenceChanged,
  projectId,
}: ProjectEditSessionPreferencePanelProps) {
  const [model, setModel] = useState<ProjectEditSessionPreferencePanelForUI | undefined>()
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('Loading Edit Preference state.')
  const [bundle, setBundle] = useState<ProjectEditSessionBundleRecord | undefined>()
  const [integration, setIntegration] = useState<ProjectEditSessionEditReferenceIntegrationModel | undefined>()
  const [selectedReferenceId, setSelectedReferenceId] = useState<string | undefined>()
  const [currentUserInstruction, setCurrentUserInstruction] = useState('')
  const [frameConfirmed, setFrameConfirmed] = useState(false)
  const [lifecycleMode, setLifecycleMode] = useState<'idle' | 'replace' | 'remove'>('idle')
  const loadEpoch = useRef(0)

  const loadPanel = useCallback(async () => {
    const epoch = ++loadEpoch.current
    const [next, bundleResponse] = await Promise.all([
      loadProjectEditSessionPreferencePanelForUI({ client, editSessionId, projectId }),
      client.bundle.get<{ bundle: ProjectEditSessionBundleRecord }>(editSessionId),
    ])
    if (epoch !== loadEpoch.current) return
    setModel(next)
    let nextBundle = bundleResponse.data?.bundle
    if (nextBundle) {
      let nextIntegration = await loadProjectEditSessionEditReferenceIntegration({
        editReferenceClient,
        session: nextBundle.session,
      })
      if (epoch !== loadEpoch.current) return
      if (
        nextIntegration.activeApplication
        && nextIntegration.sessionIntegrationStatus?.status !== 'connected_mock'
        && nextIntegration.sessionIntegrationStatus?.status !== 'invalidated'
      ) {
        const recovered = await client.preference.activateApplication({
          editSessionId,
          application: nextIntegration.activeApplication,
        })
        if (recovered.ok) {
          const recoveredBundle = await client.bundle.get<{ bundle: ProjectEditSessionBundleRecord }>(editSessionId)
          if (epoch !== loadEpoch.current) return
          nextBundle = recoveredBundle.data?.bundle ?? nextBundle
          nextIntegration = await loadProjectEditSessionEditReferenceIntegration({
            editReferenceClient,
            session: nextBundle.session,
          })
          if (epoch !== loadEpoch.current) return
        }
      }
      const resolvedBundle = nextBundle
      setBundle(resolvedBundle)
      setIntegration(nextIntegration)
      const firstReplacement = nextIntegration.approvedReferences.find((item) => (
        item.reference.id !== nextIntegration.activeApplication?.editReferenceId
      ))?.reference.id
      setSelectedReferenceId((current) => (
        nextIntegration.approvedReferences.some((item) => item.reference.id === current)
          ? current
          : firstReplacement ?? nextIntegration.approvedReferences[0]?.reference.id
      ))
      setCurrentUserInstruction((current) => current
        || nextIntegration.stagedApplication?.targetContext.currentUserInstruction
        || [...resolvedBundle.messages].reverse().find((message) => message.role === 'user')?.text
        || resolvedBundle.session.description
        || '')
      const pendingInvalidationReason = nextIntegration.activeApplication
        && nextIntegration.sessionIntegrationStatus?.status === 'invalidated'
        ? nextIntegration.sessionIntegrationStatus.invalidationReason
        : undefined
      const pendingInvalidation = Boolean(pendingInvalidationReason)
      setLifecycleMode(nextIntegration.stagedApplication
        ? 'idle'
        : pendingInvalidation
          ? pendingInvalidationReason === 'replace' ? 'replace' : 'remove'
          : 'idle')
      setStatus(nextIntegration.sessionIntegrationStatus?.status === 'connected_mock'
        ? 'Target-adapted Edit Reference guidance is connected.'
        : pendingInvalidation
          ? pendingInvalidationReason === 'replace'
            ? 'Previous guidance is inactive while you finish its replacement.'
            : 'Connected guidance is inactive and ready for removal confirmation.'
        : nextIntegration.stagedApplication
          ? 'A target adaptation is prepared and ready to connect.'
          : next.panelModel.selectedPreferenceHandle
            ? 'Compatibility Edit Preference loaded.'
            : 'No target-adapted Edit Reference is connected.')
    } else {
      setBundle(undefined)
      setStatus('Mock Edit Chat could not be loaded for Edit Reference integration.')
    }
  }, [client, editSessionId, projectId])

  useEffect(() => {
    let cancelled = false
    const timeoutId = window.setTimeout(() => {
      void loadPanel().catch(() => {
        if (cancelled) return
        setStatus('Edit Reference integration failed safely without production side effects.')
      })
    }, 0)
    return () => {
      cancelled = true
      loadEpoch.current += 1
      window.clearTimeout(timeoutId)
    }
  }, [loadPanel])

  async function handleConnectEditReference() {
    if (!bundle || busy || !frameConfirmed) return
    setBusy(true)
    setStatus('Preparing target-specific guidance for this Edit Chat...')
    try {
      let application = integration?.stagedApplication ?? integration?.activeApplication
      let referenceRevision = 1
      if (!application) {
        if (!selectedReferenceId) throw new Error('Choose an approved Edit Reference first.')
        const prepared = await preparePreferenceApplicationForProjectEditSession({
          bundle,
          currentUserInstruction,
          editReferenceId: selectedReferenceId,
          editReferenceClient,
          outputFrameConfirmed: true,
        })
        if (!prepared.ok) throw new Error(prepared.message)
        application = prepared.application
        referenceRevision = prepared.detail.reference.revision
      } else {
        const detail = await editReferenceClient.get(application.workspaceId, application.editReferenceId)
        if (!detail.ok) throw new Error(detail.message)
        referenceRevision = detail.data.detail.reference.revision
        application = detail.data.detail.applications.find((candidate) => candidate.id === application?.id) ?? application
      }
      const connected = await connectPreferenceApplicationToProjectEditSession({
        application,
        editReferenceClient,
        outputFrameConfirmed: true,
        projectEditSessionClient: client,
        referenceRevision,
      })
      setStatus(connected.message)
      await loadPanel()
      await onPreferenceChanged(connected.message)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Edit Reference connection failed safely.')
    } finally {
      setBusy(false)
    }
  }

  function handleLifecycleModeChange(mode: 'idle' | 'replace' | 'remove') {
    setLifecycleMode(mode)
    setFrameConfirmed(false)
    if (mode === 'replace') {
      const replacement = integration?.approvedReferences.find((item) => (
        item.reference.id !== integration.activeApplication?.editReferenceId
      ))
      setSelectedReferenceId(replacement?.reference.id)
    }
  }

  async function handleReplaceEditReference() {
    const currentApplication = integration?.activeApplication
    if (!bundle || !currentApplication || !selectedReferenceId || !frameConfirmed || busy) return
    setBusy(true)
    setStatus('Replacing target-adapted guidance while preserving application history…')
    try {
      const replaced = await replacePreferenceApplicationForProjectEditSession({
        bundle,
        currentApplication,
        currentUserInstruction,
        editReferenceClient,
        nextEditReferenceId: selectedReferenceId,
        outputFrameConfirmed: true,
        projectEditSessionClient: client,
      })
      setStatus(replaced.message)
      await loadPanel()
      await onPreferenceChanged(replaced.message)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Edit Reference replacement failed safely.')
    } finally {
      setBusy(false)
    }
  }

  async function handleRemoveEditReference() {
    const application = integration?.activeApplication
    if (!application || busy) return
    setBusy(true)
    setStatus('Removing target-adapted guidance while preserving its history…')
    try {
      const removed = await removePreferenceApplicationFromProjectEditSession({
        application,
        editReferenceClient,
        projectEditSessionClient: client,
      })
      setStatus(removed.message)
      await loadPanel()
      await onPreferenceChanged(removed.message)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Edit Reference removal failed safely.')
    } finally {
      setBusy(false)
    }
  }

  async function handleApply(option: ProjectEditSessionPreferenceOption) {
    setBusy(true)
    setStatus(`Applying ${option.handle ?? option.name} mock-locally...`)
    const result = await applyPreferenceToProjectEditSessionViaApi({
      client,
      editSessionId,
      preferenceHandle: option.handle,
      preferenceOptionId: option.id,
      projectId,
    })
    await loadPanel()
    await onPreferenceChanged(result.ok
      ? `${option.handle ?? option.name} applied to this mock Edit Chat.`
      : 'Preference apply failed safely without production side effects.')
    setBusy(false)
  }

  async function handleClear() {
    setBusy(true)
    setStatus('Clearing selected Edit Preference mock-locally...')
    const result = await clearPreferenceFromProjectEditSessionViaApi({ client, editSessionId, projectId })
    await loadPanel()
    await onPreferenceChanged(result.ok
      ? 'Selected Edit Preference cleared from this mock Edit Chat.'
      : 'Preference clear failed safely without production side effects.')
    setBusy(false)
  }

  const panel = model?.panelModel
  const boundary = model?.boundarySummary ?? createProjectEditSessionPreferenceBoundarySummary()

  return (
    <Card className="project-edit-session-preference-panel" data-testid="edit-session-preference-panel">
      <div className="project-edit-session-preference-panel__heading">
        <div>
          <span className="section-eyebrow">Reusable style intelligence</span>
          <h3>Edit Preference for this Edit Chat</h3>
        </div>
        <Badge accent="cyan">Planning context</Badge>
      </div>
      <p aria-live="polite" className="project-edit-session-preference-panel__status" data-testid="edit-session-preference-status" role="status">
        {status}
      </p>
      {panel ? (
        <>
          <ProjectEditSessionEditReferencePicker
            activeContext={panel.integrationStatus === 'connected_mock' ? panel.applicationContext : undefined}
            approvedReferences={integration?.approvedReferences ?? []}
            backendAvailable={integration?.backendAvailable ?? editReferenceClient.available}
            busy={busy}
            connectedApplication={integration?.activeApplication}
            currentUserInstruction={currentUserInstruction}
            frameConfirmed={frameConfirmed}
            invalidationReason={integration?.sessionIntegrationStatus?.status === 'invalidated'
              ? integration.sessionIntegrationStatus.invalidationReason
              : undefined}
            lifecycleMode={lifecycleMode}
            onConnect={handleConnectEditReference}
            onFrameConfirmedChange={setFrameConfirmed}
            onInstructionChange={setCurrentUserInstruction}
            onLifecycleModeChange={handleLifecycleModeChange}
            onRemove={handleRemoveEditReference}
            onReplace={handleReplaceEditReference}
            onSelectReference={setSelectedReferenceId}
            selectedReferenceId={selectedReferenceId}
            stagedApplication={integration?.stagedApplication}
            targetLabel={bundle ? `${bundle.session.aspectRatio} ${bundle.session.platformTarget.replaceAll('_', ' ')}` : 'this Edit Chat'}
          />
          <ProjectEditSessionPreferenceStatusCard model={panel} />
          <ProjectEditSessionDNAStatusCard model={panel} />
          <ProjectEditSessionDoNotCopyRulesCard model={panel} />
          <ProjectEditSessionPreferencePicker
            busy={busy}
            canClear={panel.canClearPreference && !panel.applicationContext}
            onApply={handleApply}
            onClear={handleClear}
            options={model?.options ?? []}
            selectedHandle={panel.selectedPreferenceHandle}
          />
        </>
      ) : (
        <p>Preference panel is loading from the mock API client.</p>
      )}
      <p className="project-edit-session-preference-panel__boundary" data-testid="edit-session-preference-boundary">
        {boundary}
      </p>
    </Card>
  )
}
