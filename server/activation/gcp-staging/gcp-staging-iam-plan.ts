import type {
  GcpStagingConfig,
  GcpStagingIamBindingPlan,
  GcpStagingResourceMap,
  GcpStagingServiceAccountKey,
} from './gcp-staging-types'

export function buildGcpStagingIamPlan(
  config: GcpStagingConfig,
  resourceMap: GcpStagingResourceMap,
): GcpStagingIamBindingPlan[] {
  void config
  const bucket = (purpose: string) => resourceMap.buckets.find((candidate) => candidate.purpose === purpose)?.bucketName ?? purpose
  return [
    projectBinding('api', 'roles/logging.logWriter', 'API writes structured runtime logs.'),
    projectBinding('api', 'roles/monitoring.metricWriter', 'API emits runtime metrics.'),
    projectBinding('cpu-worker', 'roles/logging.logWriter', 'CPU worker writes logs.'),
    projectBinding('render-worker', 'roles/logging.logWriter', 'Render worker writes logs.'),
    projectBinding('qa-worker', 'roles/logging.logWriter', 'QA worker writes logs.'),
    projectBinding('tool-readiness-worker', 'roles/logging.logWriter', 'Tool-readiness worker writes logs.'),
    bucketBinding('api', bucket('source-media'), 'roles/storage.objectViewer', 'API reads source refs when needed.'),
    bucketBinding('api', bucket('previews'), 'roles/storage.objectViewer', 'API reads private preview refs.'),
    bucketBinding('api', bucket('final-exports'), 'roles/storage.objectViewer', 'API reads private final export refs.'),
    bucketBinding('cpu-worker', bucket('source-media'), 'roles/storage.objectViewer', 'CPU worker reads source media.'),
    bucketBinding('cpu-worker', bucket('proxy-media'), 'roles/storage.objectAdmin', 'CPU worker writes proxies.'),
    bucketBinding('cpu-worker', bucket('analysis-artifacts'), 'roles/storage.objectAdmin', 'CPU worker writes analysis artifacts.'),
    bucketBinding('cpu-worker', bucket('transcripts'), 'roles/storage.objectAdmin', 'CPU worker writes transcript artifacts.'),
    bucketBinding('cpu-worker', bucket('worker-temp'), 'roles/storage.objectAdmin', 'CPU worker writes temporary worker files.'),
    bucketBinding('gpu-worker', bucket('source-media'), 'roles/storage.objectViewer', 'GPU worker reads approved inputs later.'),
    bucketBinding('gpu-worker', bucket('proxy-media'), 'roles/storage.objectViewer', 'GPU worker reads approved proxies later.'),
    bucketBinding('gpu-worker', bucket('transcripts'), 'roles/storage.objectAdmin', 'GPU worker writes transcripts later.'),
    bucketBinding('gpu-worker', bucket('masks'), 'roles/storage.objectAdmin', 'GPU worker writes masks later.'),
    bucketBinding('gpu-worker', bucket('generated-assets'), 'roles/storage.objectAdmin', 'GPU worker writes generated assets later.'),
    bucketBinding('gpu-worker', bucket('worker-temp'), 'roles/storage.objectAdmin', 'GPU worker writes temporary files later.'),
    bucketBinding('render-worker', bucket('source-media'), 'roles/storage.objectViewer', 'Render reads source when approved.'),
    bucketBinding('render-worker', bucket('proxy-media'), 'roles/storage.objectViewer', 'Render reads proxy media.'),
    bucketBinding('render-worker', bucket('generated-assets'), 'roles/storage.objectViewer', 'Render reads generated assets.'),
    bucketBinding('render-worker', bucket('masks'), 'roles/storage.objectViewer', 'Render reads masks.'),
    bucketBinding('render-worker', bucket('transcripts'), 'roles/storage.objectViewer', 'Render reads transcripts/captions.'),
    bucketBinding('render-worker', bucket('previews'), 'roles/storage.objectAdmin', 'Render writes private previews.'),
    bucketBinding('render-worker', bucket('final-exports'), 'roles/storage.objectAdmin', 'Render writes private final exports.'),
    bucketBinding('render-worker', bucket('qa-artifacts'), 'roles/storage.objectAdmin', 'Render writes render QA artifacts.'),
    bucketBinding('qa-worker', bucket('analysis-artifacts'), 'roles/storage.objectViewer', 'QA reads analysis artifacts.'),
    bucketBinding('qa-worker', bucket('previews'), 'roles/storage.objectViewer', 'QA reads previews.'),
    bucketBinding('qa-worker', bucket('final-exports'), 'roles/storage.objectViewer', 'QA reads final exports.'),
    bucketBinding('qa-worker', bucket('qa-artifacts'), 'roles/storage.objectAdmin', 'QA writes QA artifacts.'),
    bucketBinding('tool-readiness-worker', bucket('qa-artifacts'), 'roles/storage.objectCreator', 'Tool-readiness writes readiness reports only.'),
    secretBinding('api', 'SUPABASE_URL', 'API accesses runtime Supabase URL.'),
    secretBinding('api', 'SUPABASE_SERVICE_ROLE_KEY', 'API accesses service-role key only at runtime.'),
    secretBinding('api', 'WORKER_WEBHOOK_SECRET', 'API accesses worker webhook secret.'),
  ]
}

function projectBinding(
  serviceAccountKey: GcpStagingServiceAccountKey,
  role: string,
  justification: string,
): GcpStagingIamBindingPlan {
  return binding(serviceAccountKey, 'project', 'staging-project', role, justification)
}

function bucketBinding(
  serviceAccountKey: GcpStagingServiceAccountKey,
  resource: string,
  role: string,
  justification: string,
): GcpStagingIamBindingPlan {
  return binding(serviceAccountKey, 'bucket', resource, role, justification)
}

function secretBinding(
  serviceAccountKey: GcpStagingServiceAccountKey,
  resource: string,
  justification: string,
): GcpStagingIamBindingPlan {
  return binding(serviceAccountKey, 'secret', resource, 'roles/secretmanager.secretAccessor', justification)
}

function binding(
  serviceAccountKey: GcpStagingServiceAccountKey,
  scope: GcpStagingIamBindingPlan['scope'],
  resource: string,
  role: string,
  justification: string,
): GcpStagingIamBindingPlan {
  return {
    serviceAccountKey,
    scope,
    resource,
    role,
    justification,
    broadAccess: false,
    publicPrincipal: false,
  }
}
