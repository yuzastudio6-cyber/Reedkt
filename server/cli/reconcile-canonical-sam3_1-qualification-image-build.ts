import {
  createCanonicalSam31GcpQualificationImageBuildReconciliationRuntime,
} from '../services/canonical-sam3_1-qualification-image-build-reconciliation-runtime'

const CONFIRMATION =
  'reconcile-one-sam31-qualification-image-build' as const

if (
  process.env.WEEDITPRO_SAM31_QUALIFICATION_IMAGE_RECONCILIATION_CONFIRMATION !==
    CONFIRMATION
) throw new Error('SAM 3.1 qualification reconciliation confirmation missing.')

const runtime =
  createCanonicalSam31GcpQualificationImageBuildReconciliationRuntime()
const result = await runtime.reconcileAndPersistOne({
  reconciliationId:
    'sam31-qualification-image-build-reconciliation-b062f52b26deca94',
  submissionRef: {
    id: 'sam31-qualification-image-submission-b062f52b26deca94cdde',
    version: 1,
    contentHash:
      'sha256:b062f52b26deca94cdde912efa425a5577a576da803811af66e93740091d3d36',
  },
})

console.log(JSON.stringify(result, null, 2))
