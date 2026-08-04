import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const tsx = fileURLToPath(new URL('../node_modules/.bin/tsx', import.meta.url))
const smokes = [
  'server/smoke/visual-intelligence-quality-gpu-release-smoke.ts',
  'server/smoke/visual-intelligence-contract-and-provider-smoke.ts',
  'server/smoke/visual-intelligence-canonical-request-package-store-smoke.ts',
  'server/smoke/visual-intelligence-lifecycle-smoke.ts',
  'server/smoke/visual-intelligence-durable-authorities-smoke.ts',
  'server/smoke/visual-intelligence-account-effective-rate-read-port-smoke.ts',
  'server/smoke/visual-intelligence-account-effective-rate-publisher-smoke.ts',
  'server/smoke/visual-intelligence-inspection-coordinator-smoke.ts',
  'server/smoke/visual-intelligence-source-gpu-evidence-smoke.ts',
  'server/smoke/visual-intelligence-production-runtime-smoke.ts',
  'server/smoke/visual-intelligence-gcs-private-object-read-port-smoke.ts',
  'server/smoke/visual-intelligence-orchestra-capability-manifest-smoke.ts',
  'server/smoke/visual-intelligence-orchestra-invocation-compiler-smoke.ts',
  'server/smoke/visual-intelligence-route-contract-smoke.ts',
  'server/smoke/visual-intelligence-qwen-retirement-smoke.ts',
  'server/smoke/visual-intelligence-cloud-runtime-retirement-smoke.ts',
  'server/smoke/visual-intelligence-legacy-cpu-runtime-retirement-smoke.ts',
  'server/smoke/visual-intelligence-private-search-identity-isolation-smoke.ts',
  'server/smoke/visual-intelligence-live-prerequisites-audit-smoke.ts',
  'server/smoke/visual-intelligence-account-price-reader-grant-smoke.ts',
  'server/smoke/visual-intelligence-sam31-foundation-provisioning-smoke.ts',
  'server/smoke/gcp-foundation-config-smoke.ts',
  'server/smoke/source-led-visual-intelligence-content-analysis-smoke.ts',
  'server/smoke/canonical-source-analysis-l4-probe-attempt-owner-smoke.ts',
  'server/smoke/canonical-source-led-content-analysis-reasoner-smoke.ts',
  'server/smoke/canonical-planning-visual-intelligence-operation-owner-smoke.ts',
  'server/smoke/canonical-sam3_1-source-runtime-candidate-smoke.ts',
  'server/smoke/canonical-sam3_1-private-artifact-ingest-smoke.ts',
  'server/smoke/canonical-sam3_1-official-artifact-publication-smoke.ts',
  'server/smoke/canonical-sam3_1-source-checkpoint-qualification-smoke.ts',
  'server/smoke/canonical-sam3_1-cloud-image-build-smoke.ts',
  'server/smoke/canonical-sam3_1-cloud-image-supply-chain-build-smoke.ts',
  'server/smoke/canonical-sam3_1-cloud-image-supply-chain-build-runtime-smoke.ts',
  'server/smoke/canonical-sam3_1-cloud-image-build-runtime-smoke.ts',
  'server/smoke/canonical-sam3_1-cloud-image-build-operator-smoke.ts',
  'server/smoke/canonical-sam3_1-gpu-runtime-contract-smoke.ts',
  'server/smoke/canonical-sam3_1-gpu-runtime-release-smoke.ts',
  'server/smoke/canonical-sam3_1-gpu-task-owner-smoke.ts',
  'server/smoke/canonical-quality-first-professional-tool-gpu-placement-smoke.ts',
  'server/smoke/canonical-quality-first-approved-work-graph-gpu-placement-authority-smoke.ts',
  'server/smoke/canonical-professional-tool-gpu-dispatch-admission-smoke.ts',
  'server/smoke/canonical-professional-gpu-plan-pricing-authority-smoke.ts',
  'server/smoke/canonical-professional-gpu-preapproval-pricing-service-smoke.ts',
  'server/smoke/canonical-professional-tool-gpu-cost-authority-smoke.ts',
  'server/smoke/canonical-professional-gpu-terminal-cost-evidence-service-smoke.ts',
  'server/smoke/canonical-current-google-cloud-gpu-rate-authority-smoke.ts',
  'server/smoke/google-cloud-account-effective-gpu-rate-read-port-smoke.ts',
  'server/smoke/production-gpu-ai-install-smoke.ts',
]

for (const smoke of smokes) {
  const result = spawnSync(tsx, [smoke], {
    cwd: root,
    encoding: 'utf8',
    env: process.env,
  })
  if (result.status !== 0) {
    process.stdout.write(result.stdout ?? '')
    process.stderr.write(result.stderr ?? '')
    throw new Error(`Visual Intelligence qualification failed: ${smoke}`)
  }
}

console.log(JSON.stringify({
  qualification: 'weeditpro-visual-intelligence-quality-gpu-release-v1',
  sourceSmokeCount: smokes.length,
  sourceQualificationPassed: true,
  liveGeminiProviderCalled: false,
  liveGpuJobStarted: false,
  modelCheckpointDownloaded: false,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))
