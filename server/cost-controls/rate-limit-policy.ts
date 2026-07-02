import type { RateLimitPolicy } from './cost-control-types'

export const rateLimitPolicy: RateLimitPolicy = {
  perWorkspaceJobCreationPerHour: 60,
  perUserUploadRequestsPerHour: 20,
  perUserRenderRequestsPerHour: 10,
  perProjectConcurrentJobs: 3,
}
