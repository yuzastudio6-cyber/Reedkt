import { buildVlmModelDownloadIamPlan } from '../activation/vlm-model-download'

const iamPlan = buildVlmModelDownloadIamPlan()

if (process.argv.includes('--json')) console.log(JSON.stringify(iamPlan, null, 2))
else {
  console.log([
    'Phase 39B Qwen3-VL model download IAM plan',
    `IAM mutation allowed: ${iamPlan.iamMutationAllowed}`,
    `GCP infrastructure mutation allowed: ${iamPlan.gcpInfrastructureMutationAllowed}`,
    `Approved private target: ${iamPlan.approvedPrivateUploadTarget}`,
    `Current IAM changes: ${iamPlan.requiredCurrentIamChanges.length}`,
    '',
    'Blocked:',
    ...iamPlan.blocked.map((item) => `- ${item}`),
  ].join('\n'))
}
