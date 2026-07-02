import type {
  ProjectEditBriefAttachmentOrchestratorResult,
} from '../../types/project-edit-brief-attachments'
import { createMockProjectEditBriefFixtureBundle } from '../../lib/mock-project-edit-briefs'
import { listProjectEditBriefAttachmentKinds } from '../project-edit-brief-attachments/project-edit-brief-attachment-kind-service'
import {
  PROJECT_EDIT_BRIEF_ATTACHMENT_SAFETY_FLAGS,
  createProjectEditBriefAttachmentPolicySummary,
} from '../project-edit-brief-attachments/project-edit-brief-attachment-policy-service'
import {
  createProjectEditBriefAttachmentChipModel,
  createProjectEditBriefAttachmentPanelModel,
  createProjectEditBriefAttachmentReadableSummary,
} from '../project-edit-brief-attachments/project-edit-brief-attachment-summary-service'
import {
  createAttachmentIntentBridgeResult,
  createProjectEditBriefAttachmentIntentBridgeSummary,
} from '../project-edit-brief-attachments/project-edit-brief-attachment-intent-bridge-service'
import {
  validateProjectEditBriefAttachmentRecord,
} from '../project-edit-brief-attachments/project-edit-brief-attachment-validation-service'

function resultForMarker(markerId = 'marker-calm-soundtrack'): ProjectEditBriefAttachmentOrchestratorResult {
  const bundle = createMockProjectEditBriefFixtureBundle()
  const marker = bundle.markers.find((candidate) => candidate.id === markerId) ?? bundle.markers[0]
  const attachment = bundle.attachments.find((candidate) => candidate.markerId === marker.id) ?? bundle.attachments[0]
  const drawer = {
    marker,
    intent: bundle.intents.find((candidate) => candidate.id === marker.intentId),
    attachments: bundle.attachments.filter((candidate) => candidate.markerId === marker.id),
    messages: bundle.messages.filter((candidate) => candidate.markerId === marker.id),
    confirmations: bundle.confirmations.filter((candidate) => candidate.markerId === marker.id),
    conflicts: bundle.conflicts.filter((candidate) => candidate.markerId === marker.id),
    statusLabel: marker.status.replace(/_/g, ' '),
    actionLabels: [marker.markerType, marker.priority, marker.aiMode],
    mockOnly: true,
    warnings: [],
  }
  const panelModel = createProjectEditBriefAttachmentPanelModel(drawer)
  const chipModel = attachment ? createProjectEditBriefAttachmentChipModel(attachment) : undefined
  const intent = drawer.intent
  const intentBridge = createAttachmentIntentBridgeResult({
    markerId: marker.id,
    intent,
    attachments: drawer.attachments,
  })
  const validation = attachment
    ? validateProjectEditBriefAttachmentRecord(attachment)
    : validateProjectEditBriefAttachmentRecord({
      id: 'mock-missing',
      projectId: marker.projectId,
      editSessionId: marker.editSessionId,
      briefId: marker.briefId,
      markerId: marker.id,
      attachmentKind: 'reference_label',
      status: 'metadata_only',
      label: 'Mock missing attachment',
      notes: [],
      mockOnly: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  return {
    kindRegistry: listProjectEditBriefAttachmentKinds(),
    attachment,
    chipModel,
    panelModel,
    intent,
    intentBridge,
    validation,
    summary: attachment
      ? `${createProjectEditBriefAttachmentReadableSummary(attachment)} ${createProjectEditBriefAttachmentIntentBridgeSummary(intentBridge)}`
      : createProjectEditBriefAttachmentPolicySummary(),
    warnings: [
      'Mock attachment orchestrator does not persist records or start runtime work.',
      ...intentBridge.warnings,
    ],
    nextStep: 'RP-EDITBRIEF-09 — Export Settings Auto-Recommendation + Brief Access',
    mockOnly: true,
    ...PROJECT_EDIT_BRIEF_ATTACHMENT_SAFETY_FLAGS,
  }
}

export function runMockProjectEditBriefAttachmentOrchestrator(): ProjectEditBriefAttachmentOrchestratorResult {
  return resultForMarker()
}

export function runMockAttachmentKindRegistryFlow(): ProjectEditBriefAttachmentOrchestratorResult {
  return resultForMarker()
}

export function runMockAttachmentPolicyFlow(): ProjectEditBriefAttachmentOrchestratorResult {
  return resultForMarker()
}

export function runMockBrollAttachmentFlow(): ProjectEditBriefAttachmentOrchestratorResult {
  return resultForMarker('marker-broll-city')
}

export function runMockAudioAttachmentFlow(): ProjectEditBriefAttachmentOrchestratorResult {
  return resultForMarker('marker-calm-soundtrack')
}

export function runMockReferenceAttachmentFlow(): ProjectEditBriefAttachmentOrchestratorResult {
  return resultForMarker('marker-reference-url')
}

export function runMockAttachmentIntentBridgeFlow(): ProjectEditBriefAttachmentOrchestratorResult {
  return resultForMarker()
}

export function runMockAttachmentPanelModelFlow(): ProjectEditBriefAttachmentOrchestratorResult {
  return resultForMarker()
}

export function runMockAttachmentValidationFlow(): ProjectEditBriefAttachmentOrchestratorResult {
  return resultForMarker()
}

export function runMockAttachmentReadinessFlow(): ProjectEditBriefAttachmentOrchestratorResult {
  return resultForMarker()
}
