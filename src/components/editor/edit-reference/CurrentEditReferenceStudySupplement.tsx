import { useId } from 'react'
import type { EditReferenceApiClient } from '../../../lib/edit-reference-api-client'
import {
  createCurrentEditReferenceSupplementView,
  type CurrentEditReferenceSupplementOption,
  type CurrentEditReferenceSupplementResource,
} from '../../../lib/current-edit-reference-study-supplement'
import type { ProjectEditBriefBackendLocalRecord } from '../../../lib/project-edit-brief-backend-local'
import type { TargetVideoUnderstandingPackage } from '../../../types/edit-reference-target-video-understanding'
import type { ProjectEditSessionBundleRecord } from '../../../types/project-edit-session-repository'
import type { CurrentEditReferenceApplicationResource } from '../../../lib/current-edit-reference-application-ui'
import { Button } from '../../Button'
import { CurrentEditReferenceApplicationStatus } from './CurrentEditReferenceApplicationStatus'
import { EditReferenceApprovedGuidanceSummary } from './EditReferenceApprovedGuidanceSummary'
import { ProjectEditReferenceTargetStudy } from './ProjectEditReferenceTargetStudy'
import '../../../styles/edit-reference-target-study.css'

export interface CurrentEditReferenceTargetAuthority {
  bundle: ProjectEditSessionBundleRecord
  currentUserInstruction: string
  editBrief: ProjectEditBriefBackendLocalRecord
  editReferenceClient?: EditReferenceApiClient
  workspaceId?: string
}

export interface CurrentEditReferenceStudySupplementProps {
  application?: CurrentEditReferenceApplicationResource
  locked?: boolean
  onPackageChange?: (packageRecord: TargetVideoUnderstandingPackage | undefined) => void
  onReady?: (packageRecord: TargetVideoUnderstandingPackage) => void
  onRetryResource?: () => void
  onReturnToChat: () => void
  onSelectionChange: (editReferenceId: string | undefined) => void
  onUseOriginal: () => void
  options: CurrentEditReferenceSupplementOption[]
  originalReferenceId?: string
  resource: CurrentEditReferenceSupplementResource
  selectedReferenceId?: string
  targetAuthority?: CurrentEditReferenceTargetAuthority
}

export function CurrentEditReferenceStudySupplement({
  application,
  locked = false,
  onPackageChange,
  onReady,
  onRetryResource,
  onReturnToChat,
  onSelectionChange,
  onUseOriginal,
  options,
  originalReferenceId,
  resource,
  selectedReferenceId,
  targetAuthority,
}: CurrentEditReferenceStudySupplementProps) {
  const titleId = useId()
  const selectId = useId()
  const helpId = useId()
  const view = createCurrentEditReferenceSupplementView({
    authorityReady: Boolean(targetAuthority),
    locked,
    options,
    resource,
    selectedReferenceId,
  })
  const selectionChanged = selectedReferenceId !== originalReferenceId

  function handleSelectionChange(value: string) {
    onPackageChange?.(undefined)
    onSelectionChange(value || undefined)
  }

  function handleUseOriginal() {
    onPackageChange?.(undefined)
    onUseOriginal()
  }

  return (
    <section
      aria-busy={view.state === 'loading' ? true : undefined}
      aria-labelledby={titleId}
      className="current-edit-reference-supplement"
      data-state={view.state}
      data-testid="current-edit-reference-supplement"
    >
      <header className="current-edit-reference-supplement__heading">
        <div>
          <span className="section-eyebrow">Reusable creative guidance</span>
          <h3 id={titleId}>{view.title}</h3>
          <p
            aria-live={view.announcementAriaLive}
            role={view.announcementRole}
          >
            {view.description}
          </p>
        </div>
        <span className={`current-edit-reference-supplement__status is-${view.tone}`}>
          <span aria-hidden="true" />
          {view.statusLabel}
        </span>
      </header>

      {resource.state === 'ready' && options.length > 0 ? (
        <div className="current-edit-reference-supplement__control">
          <label htmlFor={selectId}>Edit Reference</label>
          <select
            aria-describedby={helpId}
            data-testid="current-edit-reference-select"
            disabled={!view.selectionEnabled}
            id={selectId}
            onChange={(event) => handleSelectionChange(event.target.value)}
            value={selectedReferenceId ?? ''}
          >
            <option value="">No Edit Reference</option>
            {options.map((option) => (
              <option key={option.id} value={option.id}>{option.name}</option>
            ))}
          </select>
          <p id={helpId}>
            {view.selectedOption?.summary
              ?? 'Optional. Only approved reusable guidance appears here; exact footage, timing, layouts, audio, and identity never transfer.'}
          </p>
          {selectionChanged && !locked ? (
            <Button onClick={handleUseOriginal} variant="ghost">Use original reference</Button>
          ) : null}
        </div>
      ) : null}

      {view.selectedOption ? (
        <EditReferenceApprovedGuidanceSummary option={view.selectedOption} />
      ) : null}

      {view.showStudy && view.selectedOption && targetAuthority ? (
        <ProjectEditReferenceTargetStudy
          bundle={targetAuthority.bundle}
          currentUserInstruction={targetAuthority.currentUserInstruction}
          disabled={locked}
          editBrief={targetAuthority.editBrief}
          editReferenceClient={targetAuthority.editReferenceClient}
          editReferenceId={view.selectedOption.id}
          key={view.selectedOption.id}
          onPackageChange={onPackageChange}
          onReady={onReady}
          referenceName={view.selectedOption.name}
          workspaceId={targetAuthority.workspaceId}
        />
      ) : null}

      {application ? (
        <CurrentEditReferenceApplicationStatus
          expectedEditReferenceId={view.selectedOption?.id ?? ''}
          onReturnToChat={onReturnToChat}
          resource={application}
        />
      ) : null}

      {view.showRetry && onRetryResource ? (
        <div className="current-edit-reference-supplement__actions">
          <Button onClick={onRetryResource} variant="secondary">Try again</Button>
        </div>
      ) : null}

      {view.showReturnToChat ? (
        <div className="current-edit-reference-supplement__actions">
          <Button onClick={onReturnToChat} variant="secondary">Return to Chat</Button>
        </div>
      ) : null}

      <p className="current-edit-reference-supplement__boundary">
        Selection stays in this preference draft until the page’s Apply action. Study completion never applies or connects guidance automatically.
      </p>
    </section>
  )
}
