import type { ComputeRouteCategory } from '../web-shell-types'

const computeRouteLabels: Record<ComputeRouteCategory, string> = {
  browser_preview: 'Browser preview',
  desktop_local_worker_future: 'Desktop future',
  cloud_cpu: 'Cloud CPU',
  cloud_gpu_l4: 'Cloud GPU L4',
  cloud_render: 'Cloud render',
  blocked_by_policy: 'Blocked',
  needs_approval: 'Needs approval',
}

interface ComputeRouteBadgeProps {
  category: ComputeRouteCategory
}

export function ComputeRouteBadge({ category }: ComputeRouteBadgeProps) {
  return <span className={`web-shell-route-badge web-shell-route-${category}`}>{computeRouteLabels[category]}</span>
}
