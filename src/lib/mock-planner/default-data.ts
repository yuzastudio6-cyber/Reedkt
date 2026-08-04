import type { ClipSource } from '../../types/reeditpro'

export const mockPlannerLoadingSteps = [
  'Analyzing source sequence',
  'Reading user instructions',
  'Studying Reference DNA',
  'Mapping story beats',
  'Routing signature systems',
  'Estimating credits',
  'Preparing plan',
]

export const sampleClips: ClipSource[] = [
  {
    id: 'clip-1',
    uploadedOrder: 1,
    fileName: 'entry-living-room-walkthrough.mp4',
    duration: '00:12',
    detectedType: 'Entry and living room walkthrough',
    notes: 'Open with a calm premium feel.',
    isImportant: true,
  },
  {
    id: 'clip-2',
    uploadedOrder: 2,
    fileName: 'kitchen-detail-shots.mov',
    duration: '00:08',
    detectedType: 'Detail b-roll',
    notes: 'Nice countertop detail.',
  },
  {
    id: 'clip-3',
    uploadedOrder: 3,
    fileName: 'speaker-investment-line.mp4',
    duration: '00:14',
    detectedType: 'Speaker value explanation',
    notes: 'Strong line about major investment.',
    isImportant: true,
  },
  {
    id: 'clip-4',
    uploadedOrder: 4,
    fileName: 'exterior-backyard.mp4',
    duration: '00:10',
    detectedType: 'Exterior and backyard proof',
    isOptional: false,
  },
]
