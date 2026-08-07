import {
  createCanonicalSam31GcpQualificationImageBuildReconciliationRuntime,
} from '../services/canonical-sam3_1-qualification-image-build-reconciliation-runtime'

const CONFIRMATION =
  'reconcile-one-sam31-qualification-image-build' as const
const targets = {
  initial: {
    reconciliationId:
      'sam31-qualification-image-build-reconciliation-b062f52b26deca94',
    submissionRef: {
      id: 'sam31-qualification-image-submission-b062f52b26deca94cdde',
      version: 1 as const,
      contentHash:
        'sha256:b062f52b26deca94cdde912efa425a5577a576da803811af66e93740091d3d36' as const,
    },
  },
  successor_1: {
    reconciliationId:
      'sam31-qualification-image-build-reconciliation-57ef0b4aa3a0b93d',
    submissionRef: {
      id: 'sam31-qualification-image-submission-57ef0b4aa3a0b93dfd23',
      version: 1 as const,
      contentHash:
        'sha256:57ef0b4aa3a0b93dfd23a57c795be80aa1c7ce191d277ac4ae32b5440eb8e1f4' as const,
    },
  },
  successor_3: {
    reconciliationId:
      'sam31-qualification-image-build-reconciliation-3bffc6891ce985b7',
    submissionRef: {
      id: 'sam31-qualification-image-submission-3bffc6891ce985b7e9aa',
      version: 1 as const,
      contentHash:
        'sha256:3bffc6891ce985b7e9aa89613a67cee4924e65c5b8536940e2616747efc9b070' as const,
    },
  },
} as const

if (
  process.env.WEEDITPRO_SAM31_QUALIFICATION_IMAGE_RECONCILIATION_CONFIRMATION !==
    CONFIRMATION
) throw new Error('SAM 3.1 qualification reconciliation confirmation missing.')

const targetName = process.env.WEEDITPRO_SAM31_QUALIFICATION_IMAGE_RECONCILIATION_TARGET
if (
  targetName !== 'initial'
  && targetName !== 'successor_1'
  && targetName !== 'successor_3'
) {
  throw new Error('SAM 3.1 qualification reconciliation target is invalid.')
}
const target = targets[targetName]

const runtime =
  createCanonicalSam31GcpQualificationImageBuildReconciliationRuntime()
const result = await runtime.reconcileAndPersistOne(target)

console.log(JSON.stringify(result, null, 2))
