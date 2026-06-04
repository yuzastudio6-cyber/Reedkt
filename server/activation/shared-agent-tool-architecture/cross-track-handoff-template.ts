import type { CrossTrackHandoffTemplate } from './shared-agent-tool-architecture-types'

export const crossTrackHandoffTemplate: CrossTrackHandoffTemplate = {
  templateId: 'phase52a-cross-track-handoff-template',
  requiredSections: [
    'phase name',
    'branch/PR/base',
    'tool ownership',
    'capabilities added',
    'readiness status',
    'artifacts',
    'blocked features',
    'dependency changes',
    'package-lock status',
    'required env/secrets',
    'manual actions',
    'downstream readiness',
    'next phase recommendation',
    'consumer notes for other chats',
    'capability manifest updates required',
  ],
  rules: [
    'Handoffs must state owner and consumer boundaries explicitly.',
    'Handoffs must distinguish private source-of-truth artifacts from previews.',
    'Handoffs must not include secrets or public/signed URLs as source of truth.',
    'Handoffs must preserve blocked production/external beta/broad-media scope.',
  ],
}
