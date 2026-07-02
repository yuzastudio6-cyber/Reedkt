import type {
  ProjectEditBriefAttachmentKind,
} from '../../types/project-edit-brief'
import type { ProjectEditBriefAttachmentKindDefinition } from '../../types/project-edit-brief-attachments'

export const PROJECT_EDIT_BRIEF_ATTACHMENT_KIND_REGISTRY: ProjectEditBriefAttachmentKindDefinition[] = [
  {
    kind: 'broll_video',
    displayName: 'B-roll video',
    iconLabel: 'Video',
    acceptedMetadataLabels: ['city-broll.mp4', 'product cutaway', 'location clip'],
    futureUploadAllowed: true,
    mockOnly: true,
    notes: ['Metadata label only; no video file is uploaded or previewed.'],
  },
  {
    kind: 'image',
    displayName: 'Image',
    iconLabel: 'Image',
    acceptedMetadataLabels: ['product-shot.png', 'reference still', 'thumbnail idea'],
    futureUploadAllowed: true,
    mockOnly: true,
    notes: ['Metadata label only; no image bytes are read.'],
  },
  {
    kind: 'music_track',
    displayName: 'Music track',
    iconLabel: 'Music',
    acceptedMetadataLabels: ['calm-track.mp3', 'upbeat bed', 'ambient cue'],
    futureUploadAllowed: true,
    mockOnly: true,
    notes: ['Sound runtime remains blocked; this is intent metadata only.'],
  },
  {
    kind: 'soundtrack',
    displayName: 'Soundtrack',
    iconLabel: 'Music',
    acceptedMetadataLabels: ['full soundtrack label', 'reference bed', 'theme cue'],
    futureUploadAllowed: true,
    mockOnly: true,
    notes: ['No audio analysis, provider call, render, or credits.'],
  },
  {
    kind: 'sfx',
    displayName: 'SFX',
    iconLabel: 'SFX',
    acceptedMetadataLabels: ['soft-whoosh.wav', 'button tap', 'ambient riser'],
    futureUploadAllowed: true,
    mockOnly: true,
    notes: ['SFX is metadata only; no sound worker starts.'],
  },
  {
    kind: 'voiceover',
    displayName: 'Voiceover',
    iconLabel: 'Voice',
    acceptedMetadataLabels: ['founder intro', 'narration idea', 'voice note label'],
    futureUploadAllowed: true,
    mockOnly: true,
    notes: ['Voiceover labels do not read audio bytes.'],
  },
  {
    kind: 'document',
    displayName: 'Document',
    iconLabel: 'Doc',
    acceptedMetadataLabels: ['script note', 'outline label', 'shot list'],
    futureUploadAllowed: true,
    mockOnly: true,
    notes: ['Document attachments are labels only in RP-EDITBRIEF-08.'],
  },
  {
    kind: 'reference_label',
    displayName: 'Reference',
    iconLabel: 'Ref',
    acceptedMetadataLabels: ['city skyline inspiration', 'brand-safe reference', 'mood label'],
    futureUploadAllowed: false,
    mockOnly: true,
    notes: ['Reference labels are metadata-only marker guidance.'],
  },
  {
    kind: 'reference_url_metadata_only',
    displayName: 'URL metadata',
    iconLabel: 'URL',
    acceptedMetadataLabels: ['metadata-only reference URL'],
    futureUploadAllowed: false,
    mockOnly: true,
    notes: ['Reference URL is stored as metadata only and is never fetched.'],
  },
]

export function listProjectEditBriefAttachmentKinds(): ProjectEditBriefAttachmentKindDefinition[] {
  return [...PROJECT_EDIT_BRIEF_ATTACHMENT_KIND_REGISTRY]
}

export function getProjectEditBriefAttachmentKindDefinition(
  kind: ProjectEditBriefAttachmentKind,
): ProjectEditBriefAttachmentKindDefinition {
  return PROJECT_EDIT_BRIEF_ATTACHMENT_KIND_REGISTRY.find((definition) => definition.kind === kind)
    ?? PROJECT_EDIT_BRIEF_ATTACHMENT_KIND_REGISTRY[PROJECT_EDIT_BRIEF_ATTACHMENT_KIND_REGISTRY.length - 2]
}

export function createProjectEditBriefAttachmentKindSummary(kind: ProjectEditBriefAttachmentKind): string {
  const definition = getProjectEditBriefAttachmentKindDefinition(kind)
  return `${definition.displayName}: ${definition.notes.join(' ')}`
}
