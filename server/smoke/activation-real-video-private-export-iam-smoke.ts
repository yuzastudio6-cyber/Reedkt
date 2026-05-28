import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildPhase30BIamConditionExpression,
  buildPhase30BIamPlan,
  phase30BForbiddenMembers,
  phase30BForbiddenRoles,
  phase30BRenderServiceAccountMember,
  validatePhase30BIamScopes,
} from '../activation/real-video-private-export'

const plan = buildPhase30BIamPlan()
assert.equal(plan.projectId, 'reeditpro')
assert.equal(plan.renderServiceAccountMember, phase30BRenderServiceAccountMember)
assert.equal(plan.bindings.length, 11)
assert.deepEqual(validatePhase30BIamScopes(), [])
assert.equal(plan.bindings.some((binding) => phase30BForbiddenRoles.includes(binding.scope.role)), false)
assert.equal(plan.bindings.some((binding) => phase30BForbiddenMembers.includes(binding.member)), false)
assert.equal(plan.bindings.some((binding) => String(binding.scope.role) === 'roles/storage.admin'), false)
assert.equal(plan.bindings.some((binding) => String(binding.scope.role) === 'roles/storage.objectAdmin'), false)
assert.equal(plan.bindings.some((binding) => String(binding.scope.role) === 'roles/storage.objectUser'), false)
assert.ok(plan.bindings.some((binding) => binding.scope.role === 'roles/storage.objectViewer' && binding.scope.prefix.includes('phase28-20260528T01552')))
assert.ok(plan.bindings.some((binding) => binding.scope.role === 'roles/storage.objectViewer' && binding.scope.prefix.includes('phase29-20260528T02254')))
assert.ok(plan.bindings.some((binding) => binding.scope.role === 'roles/storage.objectCreator' && binding.scope.prefix === 'activation-real-video/phase30/'))
for (const binding of plan.bindings) {
  assert.equal(binding.conditionExpression, buildPhase30BIamConditionExpression(binding.scope))
  assert.ok(binding.conditionExpression.startsWith(`resource.name.startsWith("projects/_/buckets/${binding.scope.bucket}/objects/${binding.scope.prefix}`))
  assert.ok(binding.command.includes(`--role=${binding.scope.role}`))
  assert.ok(binding.command.includes(`--member=${phase30BRenderServiceAccountMember}`))
}

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.equal(Boolean(packageJson.scripts['smoke:activation-real-video-private-export-iam']), true)
assert.equal(Boolean(packageJson.scripts['activation:real-video:private-export:iam-plan']), true)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'render_sa_only',
    'conditional_prefix_scopes',
    'viewer_for_inputs',
    'creator_for_outputs',
    'forbidden_roles_blocked',
    'public_members_blocked',
    'old_service_account_not_used',
  ],
  bindingCount: plan.bindings.length,
}, null, 2))
