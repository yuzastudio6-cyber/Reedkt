import type { StagingCloudRunJobPlan, StagingDeployConfig, StagingDeployImageRef } from './staging-deploy-types'

const jobMetadata = {
  'tool-readiness-job': {
    jobName: 'reeditpro-staging-tool-readiness-job',
    serviceAccountId: 'reeditpro-stg-tool-ready-sa',
    workerGroup: 'tool_readiness_worker',
    cpu: '1',
    memory: '2Gi',
    maxRetries: 0,
    executionAllowedInPhase24B: true,
    command: [
      'sh',
      '-lc',
      'node --version && python3 --version && ffmpeg -version >/dev/null && ffprobe -version >/dev/null && python3 -c "import av; import scenedetect; import cv2; import duckdb; import polars; import opentimelineio; print(\'Python import check passed\')" && echo readiness passed',
    ],
  },
  'cpu-analysis-job': {
    jobName: 'reeditpro-staging-cpu-analysis-job',
    serviceAccountId: 'reeditpro-stg-cpu-worker-sa',
    workerGroup: 'cpu_analysis_worker',
    cpu: '2',
    memory: '4Gi',
    maxRetries: 1,
    executionAllowedInPhase24B: false,
    command: [
      'sh',
      '-lc',
      'ffmpeg -version >/dev/null && ffprobe -version >/dev/null && python3 -c "import av; import scenedetect; import cv2; import duckdb; import polars; import opentimelineio; print(\'CPU readiness noop passed\')" && echo readiness passed',
    ],
  },
  'qa-job': {
    jobName: 'reeditpro-staging-qa-job',
    serviceAccountId: 'reeditpro-stg-qa-sa',
    workerGroup: 'qa_worker',
    cpu: '2',
    memory: '4Gi',
    maxRetries: 1,
    executionAllowedInPhase24B: false,
    command: [
      'sh',
      '-lc',
      'ffmpeg -version >/dev/null && ffprobe -version >/dev/null && python3 -c "import cv2; import duckdb; import polars; import opentimelineio; print(\'QA readiness noop passed\')" && echo readiness passed',
    ],
  },
  'render-job': {
    jobName: 'reeditpro-staging-render-job',
    serviceAccountId: 'reeditpro-stg-render-sa',
    workerGroup: 'render_worker',
    cpu: '2',
    memory: '4Gi',
    maxRetries: 1,
    executionAllowedInPhase24B: false,
    command: [
      'sh',
      '-lc',
      'ffmpeg -version >/dev/null && ffprobe -version >/dev/null && ldconfig -p | grep libass >/dev/null && test -d dist-remotion-worker && python3 -c "import opentimelineio; print(\'Render readiness noop passed\')" && echo readiness passed',
    ],
  },
} as const

export function buildStagingCloudRunJobPlans(config: StagingDeployConfig, imageRefs: StagingDeployImageRef[]): StagingCloudRunJobPlan[] {
  return imageRefs
    .filter((imageRef) => imageRef.targetId !== 'api')
    .map((imageRef) => {
      const metadata = jobMetadata[imageRef.targetId as keyof typeof jobMetadata]
      return {
        jobName: metadata.jobName,
        targetId: imageRef.targetId,
        imageRef: imageRef.fullImageRef,
        region: config.region,
        serviceAccountEmail: `${metadata.serviceAccountId}@${config.projectId}.iam.gserviceaccount.com`,
        cpu: metadata.cpu,
        memory: metadata.memory,
        tasks: 1,
        parallelism: 1,
        maxRetries: metadata.maxRetries,
        envVars: {
          REEDITPRO_ENV: 'staging',
          E2E_RUNTIME_MODE: 'mock',
          WORKER_RUNTIME_MODE: 'mock',
          API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
          STORAGE_MODE: 'local',
          WORKER_GROUP: metadata.workerGroup,
        },
        command: [...metadata.command],
        secretsMounted: false,
        executionAllowedInPhase24B: metadata.executionAllowedInPhase24B,
        notes: [
          'Cloud Run Job deployment only; no media input is mounted.',
          metadata.executionAllowedInPhase24B
            ? 'Tool-readiness execution may be run only after deploy and only if the deployed command is safe.'
            : 'Do not execute this job in Phase 24B.',
        ],
      }
    })
}
