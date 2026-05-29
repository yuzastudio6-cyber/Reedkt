import type { WebShellReadinessItem } from './web-shell-types'

export const webShellReadinessItems: WebShellReadinessItem[] = [
  {
    itemId: 'staging-api',
    label: 'Staging API',
    tone: 'ready',
    summary: 'Staging API is deployed for the controlled activation path.',
  },
  {
    itemId: 'non-gpu-workers',
    label: 'Non-GPU workers',
    tone: 'ready',
    summary: 'CPU speech, non-GPU orchestration, and private artifact flows have controlled evidence.',
  },
  {
    itemId: 'gpu-birefnet-real-esrgan',
    label: 'GPU BiRefNet and Real-ESRGAN',
    tone: 'warning',
    summary: 'Dedicated L4 runtimes are verified for bounded scopes only.',
  },
  {
    itemId: 'sam2-runtime',
    label: 'SAM2 runtime',
    tone: 'blocked',
    summary: 'SAM2 execution and temporal tracking remain blocked after model download evidence.',
  },
  {
    itemId: 'production-readiness',
    label: 'Production readiness',
    tone: 'blocked',
    summary: 'Production readiness remains blocked until later explicit gates pass.',
  },
  {
    itemId: 'external-beta',
    label: 'External beta',
    tone: 'blocked',
    summary: 'External beta remains blocked until a later go/no-go phase.',
  },
  {
    itemId: 'broad-real-media',
    label: 'Broad real media',
    tone: 'blocked',
    summary: 'Broad real media testing remains blocked by activation readiness policy.',
  },
  {
    itemId: 'desktop-local-worker',
    label: 'Desktop local worker',
    tone: 'future',
    summary: 'Desktop, local worker, hardware scan, and local AI execution are deferred.',
  },
]

export const stagingPostureSummary = [
  'Current UI is mock/report-driven.',
  'Cloud execution is gated by server-owned jobs and later backend integration.',
  'Local compute acceleration is future-only.',
  'Public sharing and delivery are not enabled.',
]
