import {
  assertCanonicalCurrentGoogleCloudGpuRateAuthority,
  type CanonicalCurrentGoogleCloudGpuRateAuthority,
} from './canonical-current-google-cloud-gpu-rate-authority'
import {
  assertCanonicalCurrentGoogleCloudVertexA100RateAuthority,
  type CanonicalCurrentGoogleCloudVertexA100RateAuthority,
} from './canonical-current-google-cloud-vertex-a100-rate-authority'
import {
  assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthority,
  type CanonicalCurrentGoogleCloudVertexA100ServingRateAuthority,
} from './canonical-current-google-cloud-vertex-a100-serving-rate-authority'
import {
  assertPlainSerializedData,
} from '../services/canonical-professional-gpu-job-lifecycle-service'

/**
 * Current execution pricing is an additive union: the A100 primary consumes
 * the exact Vertex online-prediction plus management SKU authority, while L4
 * routes consume the existing Cloud Run GPU authority. The prior Vertex
 * Custom Job authority remains readable for historical attempt settlement but
 * cannot authorize a new plan.
 */
export type CanonicalProfessionalGoogleCloudGpuRateAuthority =
  | CanonicalCurrentGoogleCloudVertexA100ServingRateAuthority
  | CanonicalCurrentGoogleCloudVertexA100RateAuthority
  | CanonicalCurrentGoogleCloudGpuRateAuthority

export function assertCanonicalProfessionalGoogleCloudGpuRateAuthority(
  value: unknown,
  at?: string,
): CanonicalProfessionalGoogleCloudGpuRateAuthority {
  assertPlainSerializedData(value, 'professional_google_cloud_gpu_rate')
  if (!value || typeof value !== 'object') {
    throw new Error('Professional Google Cloud GPU rate is invalid.')
  }
  const target = Reflect.get(value, 'executionTarget')
  if (target ===
    'google_cloud_vertex_dedicated_prediction_endpoint_a2_ultra') {
    return assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthority(
      value,
      at,
    )
  }
  if (target === 'google_cloud_vertex_custom_job_a2_ultra') {
    return assertCanonicalCurrentGoogleCloudVertexA100RateAuthority(value, at)
  }
  const rate = assertCanonicalCurrentGoogleCloudGpuRateAuthority(value, at)
  if (
    rate.routeId === 'a100_80gb_heavy_primary'
    || rate.executionTarget === 'google_cloud_batch_a2_ultra_job'
  ) throw new Error(
    'Historical Compute/Batch A100 pricing cannot authorize current work.',
  )
  return rate
}

export function isCanonicalVertexA100ServingRateAuthority(
  value: CanonicalProfessionalGoogleCloudGpuRateAuthority,
): value is CanonicalCurrentGoogleCloudVertexA100ServingRateAuthority {
  return value.executionTarget ===
    'google_cloud_vertex_dedicated_prediction_endpoint_a2_ultra'
}

export function isCanonicalVertexA100RateAuthority(
  value: CanonicalProfessionalGoogleCloudGpuRateAuthority,
): value is CanonicalCurrentGoogleCloudVertexA100RateAuthority {
  return value.executionTarget === 'google_cloud_vertex_custom_job_a2_ultra'
}
