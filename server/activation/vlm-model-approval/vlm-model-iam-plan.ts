export function buildVlmModelApprovalIamPlan(createdAt = new Date().toISOString()) {
  return {
    phase: '39A',
    reportId: 'phase_39a_vlm_model_approval_iam_plan',
    createdAt,
    iamMutationAllowed: false,
    gcpMutationAllowed: false,
    requiredCurrentIamChanges: [],
    futureReadOnlyNeeds: [
      {
        phase: '39B',
        purpose: 'Future exact model file upload verification in private generated-assets bucket.',
        bucket: 'gs://reeditpro-staging-reeditpro-generated-assets',
        mutationInPhase39A: false,
      },
      {
        phase: '39C',
        purpose: 'Future generated-fixture runtime reads private model weights and writes private JSON QA artifacts.',
        buckets: [
          'gs://reeditpro-staging-reeditpro-generated-assets',
          'gs://reeditpro-staging-reeditpro-qa-artifacts',
        ],
        mutationInPhase39A: false,
      },
      {
        phase: '39D',
        purpose: 'Future controlled real-frame VLM artifact writes, if separately approved.',
        bucket: 'gs://reeditpro-staging-reeditpro-qa-artifacts',
        mutationInPhase39A: false,
      },
    ],
    blocked: [
      'No IAM role changes.',
      'No bucket creation or policy mutation.',
      'No Cloud Run deploy.',
      'No Docker/image push.',
      'No service account or secret changes.',
    ],
  }
}

export function summarizeVlmModelApprovalIamPlan(report: ReturnType<typeof buildVlmModelApprovalIamPlan>): string {
  return [
    'Phase 39A VLM model approval IAM plan',
    `iamMutationAllowed: ${report.iamMutationAllowed}`,
    `gcpMutationAllowed: ${report.gcpMutationAllowed}`,
    `requiredCurrentIamChanges: ${report.requiredCurrentIamChanges.length}`,
    `futureReadOnlyNeeds: ${report.futureReadOnlyNeeds.length}`,
    '',
    'Blocked:',
    ...report.blocked.map((item) => `- ${item}`),
  ].join('\n')
}
