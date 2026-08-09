import { z } from 'zod'

import {
  visualIntelligenceCanonicalJson,
} from '../visual-intelligence/visual-intelligence-contract'
import {
  createVisualIntelligenceDetailedBillingExportObservationRepository,
} from '../visual-intelligence/visual-intelligence-detailed-billing-export-observation-repository'
import {
  createVisualIntelligenceDetailedBillingExportReadPort,
  createVisualIntelligenceDetailedBillingExportReaderConfiguration,
} from '../visual-intelligence/visual-intelligence-detailed-billing-export-read-port'
import {
  createVisualIntelligenceModelBillingSkuQualificationFinalizer,
} from '../visual-intelligence/visual-intelligence-model-billing-sku-qualification-finalizer'
import {
  createVisualIntelligenceModelBillingSkuLiveGcsStore,
} from '../visual-intelligence/visual-intelligence-model-billing-sku-live-gcs-store'
import {
  createVisualIntelligenceModelBillingSkuQualificationRepository,
} from '../visual-intelligence/visual-intelligence-model-billing-sku-qualification-repository'
import {
  createVisualIntelligenceModelBillingSkuReconciliationService,
} from '../visual-intelligence/visual-intelligence-model-billing-sku-reconciliation-service'
import {
  createVisualIntelligenceProviderAuditWindowObservationRepository,
} from '../visual-intelligence/visual-intelligence-provider-audit-window-observation-repository'
import {
  createVisualIntelligenceProviderAuditWindowReadPort,
  createVisualIntelligenceProviderAuditWindowReaderConfiguration,
} from '../visual-intelligence/visual-intelligence-provider-audit-window-read-port'
import {
  createVisualIntelligenceGcsProviderTrafficGuard,
} from '../visual-intelligence/visual-intelligence-provider-traffic-guard'
import {
  createVisualIntelligenceProviderTrafficIsolationAuthorityFinalizer,
} from '../visual-intelligence/visual-intelligence-provider-traffic-isolation-authority-finalizer'
import {
  createVisualIntelligenceProviderTrafficIsolationAuthorityRepository,
} from '../visual-intelligence/visual-intelligence-provider-traffic-isolation-authority-repository'

const EXACT_CONFIRMATION =
  'I_APPROVE_READ_ONLY_AUDIT_AND_BILLING_RECONCILIATION_NO_PROVIDER_CALL'
const EXACT_PROVIDER_PRINCIPAL =
  'reeditpro-api-sa@reeditpro.iam.gserviceaccount.com'

if (
  process.argv.length !== 3
  || process.argv[2] !== '--execute'
  || process.env.REEDITPRO_CONFIRM_VI_MODEL_SKU_RECONCILIATION
    !== EXACT_CONFIRMATION
) throw new Error(
  'Visual Intelligence reconciliation requires exact read-only external-evidence confirmation.',
)

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const env = z.object({
  GOOGLE_CLOUD_PROJECT_ID: z.literal('reeditpro'),
  GCS_CONTROL_PLANE_STATE_BUCKET: z.string()
    .regex(/^[a-z0-9][a-z0-9._-]{1,220}[a-z0-9]$/u),
  REEDITPRO_VI_MODEL_SKU_LIVE_ADMISSION_ID: safeId,
  REEDITPRO_VI_MODEL_SKU_LIVE_ADMISSION_VERSION:
    z.coerce.number().int().positive().safe(),
  REEDITPRO_VI_MODEL_SKU_LIVE_ADMISSION_SHA256:
    z.string().regex(/^sha256:[a-f0-9]{64}$/u),
  REEDITPRO_VI_MODEL_SKU_LIVE_RESULT_ID: safeId,
  REEDITPRO_VI_MODEL_SKU_LIVE_RESULT_VERSION:
    z.coerce.number().int().positive().safe(),
  REEDITPRO_VI_MODEL_SKU_LIVE_RESULT_SHA256:
    z.string().regex(/^sha256:[a-f0-9]{64}$/u),
  REEDITPRO_VI_BILLING_QUERY_PROJECT_ID: z.string()
    .regex(/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/u),
  REEDITPRO_VI_BILLING_EXPORT_DATASET_ID: z.string()
    .regex(/^[A-Za-z_][A-Za-z0-9_]{0,1023}$/u),
  REEDITPRO_VI_BILLING_EXPORT_TABLE_ID: z.string()
    .regex(/^gcp_billing_export_resource_v1_[A-F0-9_]{20,80}$/u),
  REEDITPRO_VI_BILLING_MAXIMUM_BYTES_BILLED: z.string()
    .regex(/^[1-9][0-9]{6,15}$/u),
}).strict().parse({
  GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID,
  GCS_CONTROL_PLANE_STATE_BUCKET:
    process.env.GCS_CONTROL_PLANE_STATE_BUCKET,
  REEDITPRO_VI_MODEL_SKU_LIVE_ADMISSION_ID:
    process.env.REEDITPRO_VI_MODEL_SKU_LIVE_ADMISSION_ID,
  REEDITPRO_VI_MODEL_SKU_LIVE_ADMISSION_VERSION:
    process.env.REEDITPRO_VI_MODEL_SKU_LIVE_ADMISSION_VERSION,
  REEDITPRO_VI_MODEL_SKU_LIVE_ADMISSION_SHA256:
    process.env.REEDITPRO_VI_MODEL_SKU_LIVE_ADMISSION_SHA256,
  REEDITPRO_VI_MODEL_SKU_LIVE_RESULT_ID:
    process.env.REEDITPRO_VI_MODEL_SKU_LIVE_RESULT_ID,
  REEDITPRO_VI_MODEL_SKU_LIVE_RESULT_VERSION:
    process.env.REEDITPRO_VI_MODEL_SKU_LIVE_RESULT_VERSION,
  REEDITPRO_VI_MODEL_SKU_LIVE_RESULT_SHA256:
    process.env.REEDITPRO_VI_MODEL_SKU_LIVE_RESULT_SHA256,
  REEDITPRO_VI_BILLING_QUERY_PROJECT_ID:
    process.env.REEDITPRO_VI_BILLING_QUERY_PROJECT_ID,
  REEDITPRO_VI_BILLING_EXPORT_DATASET_ID:
    process.env.REEDITPRO_VI_BILLING_EXPORT_DATASET_ID,
  REEDITPRO_VI_BILLING_EXPORT_TABLE_ID:
    process.env.REEDITPRO_VI_BILLING_EXPORT_TABLE_ID,
  REEDITPRO_VI_BILLING_MAXIMUM_BYTES_BILLED:
    process.env.REEDITPRO_VI_BILLING_MAXIMUM_BYTES_BILLED,
})

const projectId = env.GOOGLE_CLOUD_PROJECT_ID
const bucketName = env.GCS_CONTROL_PLANE_STATE_BUCKET
const liveStore = createVisualIntelligenceModelBillingSkuLiveGcsStore({
  projectId,
  bucketName,
})
const guard = createVisualIntelligenceGcsProviderTrafficGuard({
  projectId,
  bucketName,
})
const auditRepository =
  createVisualIntelligenceProviderAuditWindowObservationRepository({
    projectId,
    bucketName,
  })
const isolationRepository =
  createVisualIntelligenceProviderTrafficIsolationAuthorityRepository({
    projectId,
    bucketName,
  })
const billingRepository =
  createVisualIntelligenceDetailedBillingExportObservationRepository({
    projectId,
    bucketName,
  })
const qualificationRepository =
  createVisualIntelligenceModelBillingSkuQualificationRepository({
    projectId,
    bucketName,
  })
const isolationFinalizer =
  createVisualIntelligenceProviderTrafficIsolationAuthorityFinalizer({
    contextEvidenceReadPort: liveStore.contextEvidenceRepository,
    providerGuardEvidenceReadPort: guard,
    auditObservationRepository: auditRepository,
    routeRegistryReadPort: liveStore.routeRegistryReadPort,
    isolationAuthorityRepository: isolationRepository,
  })
const qualificationFinalizer =
  createVisualIntelligenceModelBillingSkuQualificationFinalizer({
    contextEvidenceReadPort: liveStore.contextEvidenceRepository,
    billingObservationRepository: billingRepository,
    isolationAuthorityReadPort: isolationRepository,
    qualificationRepository,
  })
const service = createVisualIntelligenceModelBillingSkuReconciliationService({
  admissionReadPort: liveStore.admissionReadPort,
  liveResultRepository: liveStore.resultRepository,
  providerGuardEvidenceReadPort: guard,
  providerAuditReadPort: createVisualIntelligenceProviderAuditWindowReadPort({
    configuration:
      createVisualIntelligenceProviderAuditWindowReaderConfiguration({
        schemaVersion:
          'visual-intelligence-provider-audit-window-reader-configuration-v1',
        projectId,
        expectedProviderPrincipalEmail: EXACT_PROVIDER_PRINCIPAL,
        timeoutMs: 15_000,
      }),
  }),
  providerAuditObservationRepository: auditRepository,
  isolationFinalizer,
  billingExportReadPort:
    createVisualIntelligenceDetailedBillingExportReadPort({
      configuration:
        createVisualIntelligenceDetailedBillingExportReaderConfiguration({
          schemaVersion:
            'visual-intelligence-detailed-billing-export-reader-configuration-v1',
          queryProjectId: env.REEDITPRO_VI_BILLING_QUERY_PROJECT_ID,
          billingExportDatasetId:
            env.REEDITPRO_VI_BILLING_EXPORT_DATASET_ID,
          billingExportTableId: env.REEDITPRO_VI_BILLING_EXPORT_TABLE_ID,
          billedProjectId: projectId,
          providerServiceId: 'services/C7E2-9256-1C43',
          maximumBytesBilled:
            env.REEDITPRO_VI_BILLING_MAXIMUM_BYTES_BILLED,
          timeoutMs: 15_000,
        }),
    }),
  billingObservationRepository: billingRepository,
  qualificationFinalizer,
})
const result = await service.reconcile({
  admissionRef: {
    id: env.REEDITPRO_VI_MODEL_SKU_LIVE_ADMISSION_ID,
    version: env.REEDITPRO_VI_MODEL_SKU_LIVE_ADMISSION_VERSION,
    contentHash: env.REEDITPRO_VI_MODEL_SKU_LIVE_ADMISSION_SHA256,
  },
  liveExecutionResultRef: {
    id: env.REEDITPRO_VI_MODEL_SKU_LIVE_RESULT_ID,
    version: env.REEDITPRO_VI_MODEL_SKU_LIVE_RESULT_VERSION,
    contentHash: env.REEDITPRO_VI_MODEL_SKU_LIVE_RESULT_SHA256,
  },
})

process.stdout.write(`${visualIntelligenceCanonicalJson(result)}\n`)
