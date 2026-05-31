import { parseGcloudJson, runGcloud } from './vlm-runtime-gcs-model-resolver'
import { vlmRuntimeConfig } from './vlm-runtime-policy'
import type {
  VlmRuntimeIamApplyResult,
  VlmRuntimeIamDeltaReport,
  VlmRuntimeIamPlan,
  VlmRuntimeIamPolicyBinding,
  VlmRuntimeIamPolicySnapshot,
  VlmRuntimeScopedIamPlanReport,
} from './vlm-runtime-types'

const scopedIamConfirmation = 'REEDITPRO_CONFIRM_VLM_PHASE39C_SCOPED_IAM_UPDATE' as const

export function buildVlmRuntimeIamPlan(
  createdAt = new Date().toISOString(),
  input: { iamMutationAllowed?: boolean; includeQaReadback?: boolean } = {},
): VlmRuntimeScopedIamPlanReport {
  const member = `serviceAccount:${vlmRuntimeConfig.serviceAccountEmail}`
  const iamMutationAllowed = input.iamMutationAllowed ?? process.env[scopedIamConfirmation] === 'true'
  const plans = buildPhase39CIamBindings(member)
    .filter((plan) => plan.required || input.includeQaReadback)
    .map((plan) => ({ ...plan, status: plan.required ? 'missing' as const : 'skipped' as const }))

  return {
    phase: '39C',
    reportId: 'phase_39c_vlm_runtime_scoped_iam_plan',
    createdAt,
    iamMutationAllowed,
    defaultMode: 'non_mutating',
    requiredConfirmation: scopedIamConfirmation,
    plans,
    broaderRolesRejected: [
      'roles/storage.admin',
      'roles/storage.objectAdmin',
      'roles/owner',
      'roles/editor',
      'project-wide storage roles',
      'unconditioned bucket-wide roles for Phase 39C',
    ],
    publicPrincipalsRejected: ['allUsers', 'allAuthenticatedUsers'],
    blockers: iamMutationAllowed ? [] : [`${scopedIamConfirmation}=true is required before applying scoped Phase 39C IAM.`],
    warnings: [
      'Default IAM plan/report mode is non-mutating.',
      'storage.objects.list is not requested; Phase 39C model copy must use exact Phase 39B object names.',
      'QA readback IAM is intentionally skipped unless worker-side artifact readback is required.',
    ],
  }
}

export async function runVlmRuntimeScopedIamUpdate(input: {
  createdAt?: string
  includeQaReadback?: boolean
} = {}): Promise<VlmRuntimeIamApplyResult> {
  const createdAt = input.createdAt ?? new Date().toISOString()
  const plan = buildVlmRuntimeIamPlan(createdAt, {
    iamMutationAllowed: process.env[scopedIamConfirmation] === 'true',
    includeQaReadback: input.includeQaReadback,
  })
  const before = {
    generatedAssets: await fetchIamPolicySnapshot(vlmRuntimeConfig.generatedAssetsBucket, 'phase_39c_vlm_runtime_iam_before', createdAt),
    qaArtifacts: await fetchIamPolicySnapshot(vlmRuntimeConfig.qaBucket, 'phase_39c_vlm_runtime_iam_before', createdAt),
  }
  const appliedBindings: VlmRuntimeIamPlan[] = []
  const alreadyPresentBindings: VlmRuntimeIamPlan[] = []
  const skippedBindings: VlmRuntimeIamPlan[] = []
  const blockers = [...plan.blockers]
  const warnings = [
    ...plan.warnings,
    ...before.generatedAssets.warnings,
    ...before.qaArtifacts.warnings,
  ]

  for (const binding of plan.plans) {
    const bucketSnapshot = snapshotForBinding(before, binding)
    if (!binding.required && input.includeQaReadback !== true) {
      skippedBindings.push({ ...binding, status: 'skipped', warnings: ['worker_side_qa_readback_not_required'] })
      continue
    }
    if (policyHasEquivalentBinding(bucketSnapshot, binding)) {
      alreadyPresentBindings.push({ ...binding, status: 'already_present' })
      continue
    }
    if (!plan.iamMutationAllowed) {
      blockers.push(`iam_binding_not_applied_confirmation_missing:${binding.bindingId}`)
      skippedBindings.push({ ...binding, status: 'blocked', blockers: [`${scopedIamConfirmation}=true is required.`] })
      continue
    }
    try {
      await runGcloud([
        'storage',
        'buckets',
        'add-iam-policy-binding',
        binding.resource,
        '--member',
        binding.member,
        '--role',
        binding.role,
        '--condition',
        [
          `title=${binding.conditionTitle}`,
          `description=${binding.conditionDescription ?? binding.description}`,
          `expression=${binding.conditionExpression}`,
        ].join(','),
      ])
      appliedBindings.push({ ...binding, status: 'added' })
    } catch (error) {
      const message = summarizeIamError(error)
      blockers.push(`iam_binding_apply_failed:${binding.bindingId}:${message}`)
      skippedBindings.push({ ...binding, status: 'blocked', blockers: [message] })
    }
  }

  const after = {
    generatedAssets: await fetchIamPolicySnapshot(vlmRuntimeConfig.generatedAssetsBucket, 'phase_39c_vlm_runtime_iam_after', createdAt),
    qaArtifacts: await fetchIamPolicySnapshot(vlmRuntimeConfig.qaBucket, 'phase_39c_vlm_runtime_iam_after', createdAt),
  }
  const missingRequiredBindings = plan.plans
    .filter((binding) => binding.required)
    .filter((binding) => !policyHasEquivalentBinding(snapshotForBinding(after, binding), binding))
    .map((binding) => ({ ...binding, status: 'missing' as const, blockers: [`required_scoped_iam_binding_missing_after_apply:${binding.bindingId}`] }))
  blockers.push(...missingRequiredBindings.flatMap((binding) => binding.blockers ?? []))

  if (after.generatedAssets.publicPrincipalsDetected || after.qaArtifacts.publicPrincipalsDetected) {
    blockers.push('phase39c_public_principal_detected_after_iam_update')
  }
  if (before.generatedAssets.broadBindingsForPhase39cMember.length || before.qaArtifacts.broadBindingsForPhase39cMember.length) {
    warnings.push('pre_existing_broad_phase39c_member_binding_detected_and_left_unchanged')
  }

  const delta: VlmRuntimeIamDeltaReport = {
    phase: '39C',
    reportId: 'phase_39c_vlm_runtime_iam_delta_report',
    createdAt,
    iamMutationAllowed: plan.iamMutationAllowed,
    member: `serviceAccount:${vlmRuntimeConfig.serviceAccountEmail}`,
    appliedBindings,
    alreadyPresentBindings,
    skippedBindings,
    missingRequiredBindings,
    before,
    after,
    broadAccessGranted: false,
    publicAccessGranted: false,
    blockers: Array.from(new Set(blockers)),
    warnings: Array.from(new Set(warnings)),
  }

  return { plan, before, after, delta }
}

function buildPhase39CIamBindings(member: string): VlmRuntimeIamPlan[] {
  const modelPrefix = `projects/_/buckets/${vlmRuntimeConfig.generatedAssetsBucket}/objects/model-weights/qwen3-vl/qwen3-vl-8b-instruct/${vlmRuntimeConfig.modelRevision}/`
  const qaPrefix = `projects/_/buckets/${vlmRuntimeConfig.qaBucket}/objects/${vlmRuntimeConfig.qaArtifactPrefix}/`
  return [
    {
      bindingId: 'phase39c-vlm-model-read',
      resource: `gs://${vlmRuntimeConfig.generatedAssetsBucket}`,
      role: 'roles/storage.objectViewer',
      member,
      conditionTitle: 'phase39c-vlm-model-read-qwen3vl-8b',
      conditionDescription: 'Read exact Phase 39B Qwen3-VL private model objects only',
      conditionExpression: `resource.name.startsWith('${modelPrefix}')`,
      description: 'Staging GPU worker read access to verified Phase 39B private Qwen3-VL model assets only.',
      commandString: `gcloud storage buckets add-iam-policy-binding gs://${vlmRuntimeConfig.generatedAssetsBucket} --member=${member} --role=roles/storage.objectViewer --condition=title=phase39c-vlm-model-read-qwen3vl-8b,expression=resource.name.startsWith('${modelPrefix}')`,
      required: true,
    },
    {
      bindingId: 'phase39c-vlm-qa-create',
      resource: `gs://${vlmRuntimeConfig.qaBucket}`,
      role: 'roles/storage.objectCreator',
      member,
      conditionTitle: 'phase39c-vlm-qa-create',
      conditionDescription: 'Create Phase 39C generated VLM runtime QA artifacts only',
      conditionExpression: `resource.name.startsWith('${qaPrefix}')`,
      description: 'Staging GPU worker create access to private Phase 39C generated VLM QA artifacts only.',
      commandString: `gcloud storage buckets add-iam-policy-binding gs://${vlmRuntimeConfig.qaBucket} --member=${member} --role=roles/storage.objectCreator --condition=title=phase39c-vlm-qa-create,expression=resource.name.startsWith('${qaPrefix}')`,
      required: true,
    },
    {
      bindingId: 'phase39c-vlm-qa-readback',
      resource: `gs://${vlmRuntimeConfig.qaBucket}`,
      role: 'roles/storage.objectViewer',
      member,
      conditionTitle: 'phase39c-vlm-qa-readback',
      conditionDescription: 'Read back Phase 39C generated VLM runtime QA artifacts only if worker verification needs it',
      conditionExpression: `resource.name.startsWith('${qaPrefix}')`,
      description: 'Optional staging GPU worker readback access to private Phase 39C generated VLM QA artifacts only.',
      commandString: `gcloud storage buckets add-iam-policy-binding gs://${vlmRuntimeConfig.qaBucket} --member=${member} --role=roles/storage.objectViewer --condition=title=phase39c-vlm-qa-readback,expression=resource.name.startsWith('${qaPrefix}')`,
      required: false,
      optionalReason: 'Skipped by default because Codex/operator credentials perform artifact readback after the job.',
    },
  ]
}

async function fetchIamPolicySnapshot(
  bucket: string,
  reportId: VlmRuntimeIamPolicySnapshot['reportId'],
  createdAt: string,
): Promise<VlmRuntimeIamPolicySnapshot> {
  const output = await runGcloud(['storage', 'buckets', 'get-iam-policy', `gs://${bucket}`, '--format=json'])
  const parsed = parseGcloudJson(output) as { etag?: string; bindings?: VlmRuntimeIamPolicyBinding[] }
  const bindings = (parsed.bindings ?? []).map(normalizeBinding)
  const member = `serviceAccount:${vlmRuntimeConfig.serviceAccountEmail}`
  const relevantBindings = bindings.filter((binding) => {
    return binding.members.includes(member)
      || binding.members.includes('allUsers')
      || binding.members.includes('allAuthenticatedUsers')
      || binding.role.startsWith('roles/storage.')
  })
  const broadBindingsForPhase39cMember = bindings.filter((binding) => {
    return binding.members.includes(member)
      && (binding.role === 'roles/storage.objectViewer' || binding.role === 'roles/storage.objectCreator')
      && !binding.condition
  })
  return {
    phase: '39C',
    reportId,
    createdAt,
    bucket,
    etag: parsed.etag,
    bindingCount: bindings.length,
    bindings,
    relevantBindings,
    publicPrincipalsDetected: bindings.some((binding) => binding.members.includes('allUsers') || binding.members.includes('allAuthenticatedUsers')),
    broadBindingsForPhase39cMember,
    warnings: broadBindingsForPhase39cMember.length
      ? [`pre_existing_unconditioned_storage_binding_for_phase39c_member:${bucket}`]
      : [],
  }
}

function snapshotForBinding(
  snapshots: { generatedAssets: VlmRuntimeIamPolicySnapshot; qaArtifacts: VlmRuntimeIamPolicySnapshot },
  binding: VlmRuntimeIamPlan,
): VlmRuntimeIamPolicySnapshot {
  return binding.resource === `gs://${vlmRuntimeConfig.generatedAssetsBucket}`
    ? snapshots.generatedAssets
    : snapshots.qaArtifacts
}

function policyHasEquivalentBinding(snapshot: VlmRuntimeIamPolicySnapshot, desired: VlmRuntimeIamPlan): boolean {
  return snapshot.bindings.some((binding) => {
    return binding.role === desired.role
      && binding.members.includes(desired.member)
      && normalizeExpression(binding.condition?.expression) === normalizeExpression(desired.conditionExpression)
  })
}

function normalizeBinding(binding: VlmRuntimeIamPolicyBinding): VlmRuntimeIamPolicyBinding {
  return {
    role: binding.role,
    members: [...(binding.members ?? [])].sort(),
    condition: binding.condition
      ? {
          title: binding.condition.title,
          description: binding.condition.description,
          expression: binding.condition.expression,
        }
      : undefined,
  }
}

function normalizeExpression(expression: string | undefined): string {
  return (expression ?? '').replaceAll('"', '\'').replace(/\s+/g, '')
}

function summarizeIamError(error: unknown): string {
  const maybe = error as { message?: string; stderr?: string; stdout?: string }
  return String(maybe?.stderr || maybe?.stdout || maybe?.message || error).replace(/\s+/g, ' ').slice(0, 600)
}
