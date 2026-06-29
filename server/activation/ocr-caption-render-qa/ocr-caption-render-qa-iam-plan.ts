import { ocrCaptionRenderQaConfig } from './ocr-caption-render-qa-policy'

export function buildOcrCaptionRenderQaIamPlan(createdAt = new Date().toISOString()) {
  return {
    phase: '37E' as const,
    planId: 'phase37e_ocr_caption_render_qa_iam_plan',
    createdAt,
    iamMutationAllowed: false,
    requiredExistingAccess: [
      {
        purpose: 'Read Phase 37C/37D private JSON QA artifacts only.',
        bucket: ocrCaptionRenderQaConfig.qaBucket,
        permissions: ['storage.objects.get'],
      },
      {
        purpose: 'Upload Phase 37E private JSON QA artifacts only when confirmed.',
        bucket: ocrCaptionRenderQaConfig.qaBucket,
        permissions: ['storage.objects.create', 'storage.objects.get'],
      },
    ],
    publicAccessPolicy: {
      publicAccessPreventionRequired: 'enforced',
      allUsersAllowed: false,
      allAuthenticatedUsersAllowed: false,
      signedUrlsAsSourceOfTruthAllowed: false,
    },
    notes: [
      'This is a text-only IAM plan. Phase 37E does not mutate IAM.',
      'If required access is missing, keep Phase 37E blocked and do not broaden scope.',
    ],
  }
}

export function summarizeOcrCaptionRenderQaIamPlan(plan = buildOcrCaptionRenderQaIamPlan()): string {
  return [
    'Phase 37E OCR Caption/Render QA IAM Plan',
    `iamMutationAllowed: ${plan.iamMutationAllowed}`,
    `bucket: ${ocrCaptionRenderQaConfig.qaBucket}`,
    `requiredAccessEntries: ${plan.requiredExistingAccess.length}`,
    'publicAccessPreventionRequired: enforced',
    'signedUrlsAsSourceOfTruthAllowed: false',
  ].join('\n')
}
