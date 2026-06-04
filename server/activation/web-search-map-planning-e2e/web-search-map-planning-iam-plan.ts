import { webSearchMapPlanningConfig } from './web-search-map-planning-policy'

export function buildWebSearchMapPlanningIamPlan() {
  return {
    phase: '50F',
    mode: 'report_only',
    defaultMutationAllowed: false,
    generatedAssetsPrefix: `gs://${webSearchMapPlanningConfig.generatedAssetsBucket}/${webSearchMapPlanningConfig.reportObjectPrefix}/`,
    qaPrefix: `gs://${webSearchMapPlanningConfig.qaBucket}/${webSearchMapPlanningConfig.reportObjectPrefix}/`,
    conditionalBindingsIfUploadBlocked: [
      {
        role: 'roles/storage.objectCreator',
        bucket: webSearchMapPlanningConfig.generatedAssetsBucket,
        conditionPrefix: `${webSearchMapPlanningConfig.reportObjectPrefix}/`,
      },
      {
        role: 'roles/storage.objectCreator',
        bucket: webSearchMapPlanningConfig.qaBucket,
        conditionPrefix: `${webSearchMapPlanningConfig.reportObjectPrefix}/`,
      },
    ],
    forbiddenBindings: ['allUsers', 'allAuthenticatedUsers', 'roles/storage.admin', 'roles/storage.objectAdmin', 'roles/owner', 'roles/editor'],
    notes: [
      'IAM plan is report-only by default.',
      'No public principals, broad bucket permissions, owner/editor, or storage admin/object admin roles are allowed.',
    ],
  }
}
