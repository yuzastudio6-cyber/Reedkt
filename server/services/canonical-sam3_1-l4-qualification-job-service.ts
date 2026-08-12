import { z } from 'zod'

import { stableAuthorityStringify } from './private-edit-authority-store'

export const CANONICAL_SAM3_1_L4_QUALIFICATION_JOB_SERVICE_VERSION =
  'canonical-sam3_1-l4-qualification-job-service-v1' as const

export const CANONICAL_SAM3_1_L4_QUALIFICATION_JOB_RESOURCE =
  'projects/reeditpro/locations/us-central1/jobs/reeditpro-sam31-l4-fallback' as const
export const CANONICAL_SAM3_1_L4_QUALIFICATION_JOB_NAME =
  'reeditpro-sam31-l4-fallback' as const
export const CANONICAL_SAM3_1_L4_QUALIFICATION_MASK_BUCKET =
  'reeditpro-production-reeditpro-masks' as const

const immutableImage = z.string().regex(
  /^us-central1-docker\.pkg\.dev\/reeditpro\/reeditpro-workers\/reeditpro-sam31-gpu@sha256:[a-f0-9]{64}$/u,
)
const positiveGeneration = z.string().regex(/^[1-9][0-9]*$/u)

const jobSchema = z.object({
  name: z.literal(CANONICAL_SAM3_1_L4_QUALIFICATION_JOB_RESOURCE),
  uid: z.string().uuid(),
  generation: positiveGeneration,
  observedGeneration: positiveGeneration,
  etag: z.string().min(8).max(2_048),
  reconciling: z.boolean().optional(),
  labels: z.record(z.string(), z.string()),
  template: z.object({
    parallelism: z.literal(1),
    taskCount: z.literal(1),
    template: z.object({
      containers: z.array(z.object({
        image: immutableImage,
        env: z.array(z.object({
          name: z.string(),
          value: z.string(),
        }).strict()),
        resources: z.object({
          limits: z.object({
            cpu: z.literal('8'),
            memory: z.literal('32Gi'),
            'nvidia.com/gpu': z.literal('1'),
          }).strict(),
        }).passthrough(),
        volumeMounts: z.array(z.object({
          name: z.literal('reeditpro-private-gpu-objects'),
          mountPath: z.literal('/mnt/reeditpro'),
        }).strict()).length(1),
      }).passthrough()).length(1),
      volumes: z.array(z.object({
        name: z.literal('reeditpro-private-gpu-objects'),
        gcs: z.object({
          bucket: z.literal(
            CANONICAL_SAM3_1_L4_QUALIFICATION_MASK_BUCKET,
          ),
          mountOptions: z.array(z.string()).length(3),
        }).strict(),
      }).strict()).length(1),
      maxRetries: z.literal(0),
      timeout: z.literal('3600s'),
      serviceAccount: z.literal(
        'reeditpro-gpu-worker-sa@reeditpro.iam.gserviceaccount.com',
      ),
      executionEnvironment: z.literal('EXECUTION_ENVIRONMENT_GEN2'),
      vpcAccess: z.object({
        egress: z.literal('ALL_TRAFFIC'),
        networkInterfaces: z.array(z.object({
          network: z.literal('weeditpro-gpu-private'),
          subnetwork: z.literal('weeditpro-gpu-private-us-central1'),
          tags: z.array(z.literal('weeditpro-gpu-private-no-nat')).length(1),
        }).strict()).length(1),
      }).strict(),
      nodeSelector: z.object({ accelerator: z.literal('nvidia-l4') })
        .strict(),
      gpuZonalRedundancyDisabled: z.literal(true),
    }).passthrough(),
  }).passthrough(),
  terminalCondition: z.object({
    type: z.literal('Ready'),
    state: z.literal('CONDITION_SUCCEEDED'),
  }).passthrough(),
}).passthrough()

export type CanonicalSam31L4QualificationJob = z.infer<typeof jobSchema>

export function assertCanonicalSam31L4QualificationJob(
  value: unknown,
  expectedImage: string,
): CanonicalSam31L4QualificationJob {
  const image = immutableImage.parse(expectedImage)
  const job = jobSchema.parse(value)
  const container = job.template.template.containers[0]!
  const env = Object.fromEntries(
    container.env.map((item) => [item.name, item.value]),
  )
  if (
    container.image !== image
    || job.generation !== job.observedGeneration
    || job.reconciling === true
    || stableAuthorityStringify(env) !== stableAuthorityStringify({
      REEDITPRO_ENV: 'production',
      WEEDITPRO_GPU_ACCELERATOR_CLASS: 'nvidia_l4',
      WORKER_GROUP: 'l4_heavy_fallback',
    })
    || job.labels.app !== 'weeditpro'
    || job.labels.release !== 'qualification-candidate'
    || job.labels.route !== 'l4-heavy-fallback'
    || job.labels.scale !== 'zero'
    || stableAuthorityStringify(
      job.template.template.volumes[0]!.gcs.mountOptions,
    ) !== stableAuthorityStringify([
      'uid=65532', 'gid=65532', 'implicit-dirs=true',
    ])
  ) throw new Error('sam31_l4_cloud_run_job_exact_reread_changed')
  return job
}

export function canonicalSam31L4QualificationJobProjection(
  job: CanonicalSam31L4QualificationJob,
) {
  return Object.freeze({
    name: job.name,
    uid: job.uid,
    generation: job.generation,
    observedGeneration: job.observedGeneration,
    labels: job.labels,
    template: job.template,
  })
}

export function buildCanonicalSam31L4QualificationJobImagePatch(input: {
  readonly current: CanonicalSam31L4QualificationJob
  readonly immutableImageUri: string
}) {
  const image = immutableImage.parse(input.immutableImageUri)
  const current = jobSchema.parse(input.current)
  return Object.freeze({
    name: current.name,
    etag: current.etag,
    template: {
      ...current.template,
      template: {
        ...current.template.template,
        containers: current.template.template.containers.map(
          (container, index) => index === 0
            ? { ...container, image }
            : container,
        ),
      },
    },
  })
}

export function assertCanonicalSam31L4QualificationJobOnlyImageChanged(input: {
  readonly before: CanonicalSam31L4QualificationJob
  readonly after: CanonicalSam31L4QualificationJob
}) {
  const normalize = (job: CanonicalSam31L4QualificationJob) => ({
    uid: job.uid,
    labels: job.labels,
    template: {
      ...job.template,
      template: {
        ...job.template.template,
        containers: job.template.template.containers.map(
          (container, index) => index === 0
            ? { ...container, image: '<immutable-image-replaced>' }
            : container,
        ),
      },
    },
  })
  if (
    input.before.uid !== input.after.uid
    || BigInt(input.after.generation) <= BigInt(input.before.generation)
    || stableAuthorityStringify(normalize(input.before)) !==
      stableAuthorityStringify(normalize(input.after))
  ) throw new Error('sam31_l4_job_rollout_changed_more_than_image')
}
