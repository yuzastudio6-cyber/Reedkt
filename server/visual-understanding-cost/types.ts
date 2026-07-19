export interface PrivateGcpVisualInfrastructureRateSnapshot {
  schemaVersion: 'private-gcp-visual-infrastructure-rate-snapshot-v1'
  snapshotId: string
  provider: 'google_cloud'
  currency: 'USD'
  billingRegion: string
  accelerator: 'nvidia_l4'
  pricingEvidenceArtifactId: string
  sourceContentSha256: string
  sourceUrl: string
  observedAt: string
  gpuMicrosPerHour: number
  cpuMicrosPerVcpuHour: number
  memoryMicrosPerGibHour: number
  storageMicrosPerGibMonth: number
  storageBillingMonthHours: number
  networkEgressMicrosPerGib: number
  classAOperationMicrosPerThousand: number
  classBOperationMicrosPerThousand: number
}

export interface PrivateGcpVisualInfrastructureUsage {
  gpuAllocatedMilliseconds: number
  cpuVcpuAllocatedMilliseconds: number
  memoryGibAllocatedMilliseconds: number
  retainedArtifactMibMilliseconds: number
  networkEgressBytes: number
  classAOperationCount: number
  classBOperationCount: number
  cacheDisposition: 'miss_inference_executed' | 'validated_private_cache_hit'
}

export interface PrivateGcpVisualInfrastructureCost {
  schemaVersion: 'private-gcp-visual-infrastructure-cost-v1'
  boundary: 'internal_gcp_infrastructure_cost_only'
  rateSnapshot: PrivateGcpVisualInfrastructureRateSnapshot
  usage: PrivateGcpVisualInfrastructureUsage
  breakdownUsdMicros: {
    gpu: number
    cpu: number
    memory: number
    retainedStorage: number
    networkEgress: number
    classAOperations: number
    classBOperations: number
  }
  totalUsdMicros: number
  providerTokenPriceUsed: false
  providerInvoiceReconciled: false
  customerPriceIncluded: false
  customerCreditsIncluded: false
  serviceFeeIncluded: false
}

export interface PrivateGcpVisualAttemptCostEvidenceInput {
  analysisRunId: string
  attemptId: string
  attemptOrdinal: number
  planHash: string
  sourceChecksumSha256: string
  checkpointSha256: string
  coverageDigestSha256: string
  cacheKeySha256: string
  workerExecutionId: string
  cloudRunExecutionResourceName: string | null
  usageCaptureId: string
  outcome: 'completed' | 'failed'
  usage: PrivateGcpVisualInfrastructureUsage
  rateSnapshot: PrivateGcpVisualInfrastructureRateSnapshot
  recordedAt: string
}

export interface PrivateGcpVisualAttemptCostEvidence {
  schemaVersion: 'private-gcp-visual-attempt-cost-evidence-v1'
  boundary: 'internal_gcp_infrastructure_cost_only'
  evidenceClassification: 'provisional_metered_not_invoice_reconciled'
  analysisRunId: string
  attemptId: string
  attemptOrdinal: number
  planHash: string
  sourceChecksumSha256: string
  checkpointSha256: string
  coverageDigestSha256: string
  cacheKeySha256: string
  workerExecutionId: string
  cloudRunExecutionResourceName: string | null
  usageCaptureId: string
  outcome: 'completed' | 'failed'
  cost: PrivateGcpVisualInfrastructureCost
  recordedAt: string
  persistence: {
    databaseBacked: false
    productionDurability: false
    invoiceReconciled: false
  }
  commercialBoundary: {
    customerPriceCalculated: false
    customerCreditsCalculated: false
    customerChargeCreated: false
    walletMutationMade: false
    serviceFeeIncluded: false
  }
  evidenceHash: string
}

export interface PrivateGcpVisualAttemptCostAggregate {
  analysisRunId: string
  planHash: string
  sourceChecksumSha256: string
  checkpointSha256: string
  coverageDigestSha256: string
  cacheKeySha256: string
  attemptCount: number
  failedAttemptCount: number
  completedAttemptCount: number
  totalUsdMicros: number
  customerChargeCreated: false
  serviceFeeIncluded: false
}

export type PrivateGcpVisualCostResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; field: string; message: string } }
