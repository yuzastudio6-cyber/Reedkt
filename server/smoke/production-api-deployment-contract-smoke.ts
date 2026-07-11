import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const viteServerConfig = read('vite.server.config.ts')
const legacyServerSource = 'src/server/server.ts'
assert.match(viteServerConfig, /ssr:\s*['"]server\/index\.ts['"]/)
assert.equal(viteServerConfig.includes(legacyServerSource), true, 'The legacy source should be named only in the safety comment.')
assert.equal(viteServerConfig.includes(`ssr: '${legacyServerSource}'`), false)
assert.equal(viteServerConfig.includes('noExternal: true'), false)

const primaryDockerfile = read('Dockerfile.backend')
const productionDockerfile = read('docker/prod/api/Dockerfile')
for (const [name, dockerfile] of [
  ['Dockerfile.backend', primaryDockerfile],
  ['docker/prod/api/Dockerfile', productionDockerfile],
] as const) {
  assert.match(dockerfile, /ENV NODE_ENV=production/)
  assert.match(dockerfile, /ENV E2E_RUNTIME_MODE=cloud_run/)
  assert.match(dockerfile, /ENV STORAGE_MODE=gcs_disabled/)
  assert.match(dockerfile, /ENV WORKER_RUNTIME_MODE=disabled/)
  assert.match(dockerfile, /ENV REEDITPRO_DISABLE_DOTENV=true/)
  assert.match(dockerfile, /USER node/)
  assert.match(dockerfile, /CMD \["node", "dist-server\/server\.js"\]/)
  assert.equal(dockerfile.includes('SERVER_RUNTIME_MODE=mock'), false, `${name} must not ship the legacy mock runtime mode.`)
}
assert.match(productionDockerfile, /FROM base AS build\s+ENV NODE_ENV=development/)

const dockerIgnore = read('.dockerignore')
assert.match(dockerIgnore, /^\._\*$/m)
assert.match(dockerIgnore, /^\*\*\/\._\*$/m)

const cloudBuildConfig = read('scripts/gcp/prod/cloudbuild-image.yaml')
assert.match(cloudBuildConfig, /\$\{_DOCKERFILE\}/)
assert.match(cloudBuildConfig, /\$\{_IMAGE\}/)

const buildCommands = read('scripts/gcp/prod/07-build-image-commands.sh')
assert.match(buildCommands, /--config="scripts\/gcp\/prod\/cloudbuild-image\.yaml"/)
assert.match(buildCommands, /_DOCKERFILE=docker\/prod\/api\/Dockerfile/)
assert.equal(buildCommands.includes('gcloud builds submit --project="${GCP_PROJECT_ID}" --tag='), false)
assert.equal(buildCommands.includes('reeditpro-cpu-worker)" .'), false)

const deployTemplate = read('scripts/gcp/prod/08-deploy-api-service.example.sh')
for (const requiredRuntimeSetting of [
  'E2E_RUNTIME_MODE=cloud_run',
  'WORKER_RUNTIME_MODE=disabled',
  'STORAGE_MODE=gcs_disabled',
  'REEDITPRO_DISABLE_DOTENV=true',
  'API_ALLOWED_CORS_ORIGINS=${REEDITPRO_API_ALLOWED_CORS_ORIGINS}',
  'SUPABASE_URL=${REEDITPRO_SECRET_PREFIX}-supabase-url:${REEDITPRO_SUPABASE_URL_SECRET_VERSION}',
  'SUPABASE_ANON_KEY=${REEDITPRO_SECRET_PREFIX}-supabase-anon-key:${REEDITPRO_SUPABASE_ANON_KEY_SECRET_VERSION}',
  'SUPABASE_SERVICE_ROLE_KEY=${REEDITPRO_SECRET_PREFIX}-supabase-service-role-key:${REEDITPRO_SUPABASE_SERVICE_ROLE_KEY_SECRET_VERSION}',
  'REEDITPRO_INTERNAL_SERVICE_TOKEN=${REEDITPRO_SECRET_PREFIX}-api-internal-service-token:${REEDITPRO_INTERNAL_SERVICE_TOKEN_SECRET_VERSION}',
  '--ingress=internal-and-cloud-load-balancing',
  '--no-allow-unauthenticated',
] as const) {
  assert.equal(
    deployTemplate.includes(requiredRuntimeSetting),
    true,
    `API deployment template is missing ${requiredRuntimeSetting}.`,
  )
}
assert.equal(deployTemplate.includes(':latest'), false)
assert.equal(deployTemplate.includes('PROVIDER_GATEWAY_SHARED_SECRET'), false)
assert.equal(deployTemplate.includes('WORKER_WEBHOOK_SECRET'), false)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'hardened_server_is_only_production_build_entry',
    'native_runtime_dependencies_externalized',
    'api_images_use_fail_closed_cloud_runtime_defaults',
    'api_images_run_direct_node_as_non_root',
    'build_stage_installs_development_toolchain',
    'macos_metadata_excluded_from_docker_context',
    'cloud_build_uses_explicit_dockerfile_config',
    'unproven_worker_image_commands_omitted',
    'private_canary_ingress_and_iam_preserved',
    'runtime_secrets_are_named_and_version_pinned',
    'obsolete_shared_secret_mappings_removed',
  ],
}))

function read(path: string): string {
  return readFileSync(path, 'utf8')
}
