import type { RealEsrganPhase34DEvidence } from './real-esrgan-policy-decision-types'

export const phase34DRealEsrganEvidence: RealEsrganPhase34DEvidence = {
  phase34DRunId: 'phase34d-20260528T20300',
  sourcePhase33DRunId: 'phase33d-20260528T161056',
  sourceFrameGcsUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33d/phase33d-20260528T161056/representative-frame/frame.png',
  sourceFrameDimensions: {
    width: 2160,
    height: 3840,
  },
  sampleCrop: {
    x: 824,
    y: 1664,
    width: 512,
    height: 512,
  },
  enhancedSample: {
    width: 2048,
    height: 2048,
  },
  model: {
    name: 'RealESRGAN_x4plus',
    manifestId: 'real_esrgan_x4plus_staging_v1',
    modelFileSha256: '4fa0d38905f75ac06eb49a7951b426670021be3018265fd191d2125df9d682f1',
    aggregateSha256: '5cee93bc531570df59a772293ecae30f89c4519f93478cbb74ddce9f0e9bb4a5',
  },
  runtime: {
    jobExecutionId: 'reeditpro-staging-real-esrgan-runtime-job-lpp7v',
    imageTag: 'staging-real-esrgan-sample-001',
    pinnedLinuxAmd64Digest: 'sha256:80a032a299a3b4c5b8a6e2f3622668a22ab651d568c29d31aa9c884b04b231e2',
  },
  artifacts: {
    inputSampleGcsUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase34d/phase34d-20260528T20300/sample/input-sample.png',
    enhancedSampleGcsUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase34d/phase34d-20260528T20300/enhanced/enhanced-sample.png',
    metadataGcsUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase34d/phase34d-20260528T20300/metadata/before-after-metadata.json',
    qaGcsUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-real-video/phase34d/phase34d-20260528T20300/qa/enhancement-sample-qa.json',
    reportGcsUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-real-video/phase34d/phase34d-20260528T20300/reports/phase34d-report.json',
  },
  qaSummary: {
    status: 'warning',
    blockers: [],
    warnings: [
      'Human before/after visual review is still required before any broader Real-ESRGAN claim.',
      'The Phase 34D sample proves one bounded crop only; it does not prove full-frame or temporal video safety.',
    ],
    warningOnlyRisks: [
      'hallucination/detail invention',
      'oversharpening',
      'texture artifacts',
      'skin/product integrity',
      'no temporal proof',
      'no full-frame proof',
      'no full-video proof',
    ],
  },
  safetyConfirmations: {
    exactlyOneBoundedSample: true,
    fullFrameEnhanced: false,
    fullVideoEnhanced: false,
    filmUsed: false,
    slowMotionUsed: false,
    providerExecuted: false,
    publicAccessEnabled: false,
    modelDownloadedExternally: false,
    gfpganFaceEnhanceRan: false,
  },
}
