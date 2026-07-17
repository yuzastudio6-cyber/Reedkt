import assert from 'node:assert/strict'

import {
  createGoogleApiGatewayReadinessProbePlan,
  evaluateGoogleApiGatewayReadiness,
  REEDITPRO_GOOGLE_API_GATEWAY_STAGING_TARGET,
  type GoogleApiGatewayReadinessProbeId,
  type GoogleApiGatewayReadinessProbeResult,
} from '../config/google-api-gateway-readiness'

const target = REEDITPRO_GOOGLE_API_GATEWAY_STAGING_TARGET
const plan = createGoogleApiGatewayReadinessProbePlan(target)
const mutationTokens = new Set([
  'add-iam-policy-binding',
  'create',
  'delete',
  'deploy',
  'enable',
  'remove-iam-policy-binding',
  'set-iam-policy',
  'update',
])

assert.equal(plan.length, 6)
assert.equal(new Set(plan.map((probe) => probe.id)).size, plan.length)
assert.deepEqual(plan.map((probe) => [probe.id, ...probe.args.slice(0, 3)]), [
  ['enabled_services', 'services', 'list', '--enabled'],
  ['cloud_run_service', 'run', 'services', 'describe'],
  ['cloud_run_iam', 'run', 'services', 'get-iam-policy'],
  ['api_gateway_apis', 'api-gateway', 'apis', 'list'],
  ['api_gateway_configs', 'api-gateway', 'api-configs', 'list'],
  ['api_gateway_gateways', 'api-gateway', 'gateways', 'list'],
])
for (const probe of plan) {
  assert.equal(probe.command, 'gcloud')
  assert.equal(probe.readOnly, true)
  assert.equal(probe.args.includes(`--project=${target.projectId}`), true)
  assert.equal(probe.args.includes('--quiet'), true)
  assert.equal(probe.args.some((arg) => mutationTokens.has(arg)), false)
}

const readyResults = fixtureResults()
const readyReport = evaluateGoogleApiGatewayReadiness(target, readyResults)
assert.equal(readyReport.ok, true)
assert.equal(readyReport.decision, 'ready_for_signed_in_gateway_route_test')
assert.equal(readyReport.blockers.length, 0)
assert.equal(readyReport.counts.enabledRequiredGoogleApis, 3)
assert.equal(readyReport.counts.cloudRunPublicInvokerMembers, 0)
assert.deepEqual(readyReport.missingRuntimeEnvNames, [])
assert.deepEqual(Object.values(readyReport.gates), Object.values(readyReport.gates).map(() => true))
assert.deepEqual(readyReport.boundaries, {
  readOnly: true,
  apiEnablementPerformed: false,
  resourceCreationPerformed: false,
  iamMutationPerformed: false,
  deploymentPerformed: false,
  supabaseContacted: false,
  providerCalled: false,
  billingCalled: false,
  secretsPrinted: false,
  rawIamPrincipalsPrinted: false,
})

const disabledResults = readyResults.map((result) => {
  if (result.id === 'enabled_services') {
    return passedResult(result.id, 'servicecontrol.googleapis.com\nservicemanagement.googleapis.com\n')
  }
  if (result.id.startsWith('api_gateway_')) {
    return failedResult(result.id, 'service_disabled')
  }
  return result
})
const disabledReport = evaluateGoogleApiGatewayReadiness(target, disabledResults)
assert.equal(disabledReport.ok, false)
assert.equal(disabledReport.decision, 'blocked_before_signed_in_gateway_route_test')
assert.equal(disabledReport.gates.requiredGoogleApisEnabled, false)
assert.equal(disabledReport.gates.apiResourcePresent, false)
assert.equal(disabledReport.gates.apiConfigPresent, false)
assert.equal(disabledReport.gates.gatewayPresent, false)
assert.equal(disabledReport.gates.gatewayActive, false)

const hostileResults = readyResults.map((result) => result.id === 'cloud_run_iam'
  ? passedResult(result.id, JSON.stringify({
    bindings: [{
      role: 'roles/run.invoker',
      members: [
        `serviceAccount:${target.gatewayServiceAccount}`,
        'allUsers',
        'user:private-owner@example.test',
      ],
    }],
  }))
  : result)
const hostileReport = evaluateGoogleApiGatewayReadiness(target, hostileResults)
assert.equal(hostileReport.ok, false)
assert.equal(hostileReport.gates.cloudRunPublicInvokerAbsent, false)
assert.equal(hostileReport.counts.cloudRunPublicInvokerMembers, 1)

const hostileSerialized = JSON.stringify(hostileReport)
assert.equal(hostileSerialized.includes('allUsers'), false)
assert.equal(hostileSerialized.includes(target.gatewayServiceAccount), false)
assert.equal(hostileSerialized.includes('private-owner@example.test'), false)
assert.equal(hostileSerialized.includes('fixture-sensitive-value'), false)

assert.throws(
  () => createGoogleApiGatewayReadinessProbePlan({ ...target, projectId: 'attacker-project' }),
  /exact reviewed ReEditPro staging lane/i,
)

console.log('google-api-gateway-readiness-smoke passed')

function fixtureResults(): GoogleApiGatewayReadinessProbeResult[] {
  return [
    passedResult(
      'enabled_services',
      [
        'apigateway.googleapis.com',
        'servicecontrol.googleapis.com',
        'servicemanagement.googleapis.com',
      ].join('\n'),
    ),
    passedResult('cloud_run_service', JSON.stringify({
      metadata: { name: target.cloudRunServiceName },
      spec: {
        template: {
          spec: {
            serviceAccountName: target.cloudRunRuntimeServiceAccount,
            containers: [{
              env: [
                { name: 'API_ALLOWED_CORS_ORIGINS', value: 'https://app.reeditpro.test' },
                { name: 'REEDITPRO_BROWSER_API_TRANSPORT', value: 'google_api_gateway' },
                secretEnv('REEDITPRO_INTERNAL_SERVICE_TOKEN'),
                secretEnv('SUPABASE_ANON_KEY'),
                secretEnv('SUPABASE_SERVICE_ROLE_KEY'),
                secretEnv('SUPABASE_URL'),
                { name: 'UNRELATED_FIXTURE', value: 'fixture-sensitive-value' },
              ],
            }],
          },
        },
      },
      status: {
        url: 'https://reeditpro-api-staging-fixture-ue.a.run.app',
        conditions: [{ type: 'Ready', status: 'True' }],
      },
    })),
    passedResult('cloud_run_iam', JSON.stringify({
      bindings: [{
        role: 'roles/run.invoker',
        members: [`serviceAccount:${target.gatewayServiceAccount}`],
      }],
    })),
    passedResult('api_gateway_apis', JSON.stringify([{
      name: `projects/${target.projectId}/locations/global/apis/${target.apiId}`,
    }])),
    passedResult('api_gateway_configs', JSON.stringify([{
      name: `projects/${target.projectId}/locations/global/apis/${target.apiId}/configs/reviewed-config`,
      state: 'ACTIVE',
    }])),
    passedResult('api_gateway_gateways', JSON.stringify([{
      name: `projects/${target.projectId}/locations/${target.region}/gateways/${target.gatewayId}`,
      state: 'ACTIVE',
      defaultHostname: 'reeditpro-browser-staging-fixture.ue.gateway.dev',
    }])),
  ]
}

function secretEnv(name: string): Record<string, unknown> {
  return {
    name,
    valueFrom: {
      secretKeyRef: {
        key: 'latest',
        name: `fixture-${name.toLowerCase().replaceAll('_', '-')}`,
      },
    },
  }
}

function passedResult(
  id: GoogleApiGatewayReadinessProbeId,
  stdout: string,
): GoogleApiGatewayReadinessProbeResult {
  return {
    id,
    ok: true,
    exitCode: 0,
    classification: 'passed',
    stdout,
    outputByteCount: Buffer.byteLength(stdout, 'utf8'),
  }
}

function failedResult(
  id: GoogleApiGatewayReadinessProbeId,
  classification: GoogleApiGatewayReadinessProbeResult['classification'],
): GoogleApiGatewayReadinessProbeResult {
  return {
    id,
    ok: false,
    exitCode: 1,
    classification,
    stdout: '',
    outputByteCount: 0,
  }
}
