import { createQwenLiveBetaDoctorReport } from '../../src/backend/qwen-runtime/qwen-live-beta-service'
import { runQwenMarkerChatBridge } from '../../src/backend/qwen-runtime/qwen-marker-chat-bridge-service'
import {
  QWEN_LIVE_SMOKE_FIXTURE,
  assertNoUnsafeQwenRuntimeEffects,
  createQwenLiveSmokeRepository,
  qwenLiveSmokeBlockedResult,
} from './qwen-live-smoke-helpers'

const doctor = await createQwenLiveBetaDoctorReport()
if (!doctor.ready) {
  console.error(JSON.stringify(qwenLiveSmokeBlockedResult('blocked_live_beta_configuration', {
    doctorStatus: doctor.status,
    checks: doctor.checks,
    nextStep: doctor.nextStep,
  }), null, 2))
  process.exit(1)
}

const provider = await runQwenMarkerChatBridge({
  repository: createQwenLiveSmokeRepository(),
  request: {
    id: `qwen-live-owner-config-provider-${Date.now().toString(36)}`,
    source: 'backend_route',
    projectId: QWEN_LIVE_SMOKE_FIXTURE.projectId,
    editSessionId: QWEN_LIVE_SMOKE_FIXTURE.editSessionId,
    briefId: QWEN_LIVE_SMOKE_FIXTURE.briefId,
    markerId: QWEN_LIVE_SMOKE_FIXTURE.markerId,
    messageText: QWEN_LIVE_SMOKE_FIXTURE.messageText,
  },
})

assertNoUnsafeQwenRuntimeEffects(provider)

const passed = provider.status === 'qwen_beta_completed'
  && provider.qwenCallMade
  && provider.providerCallMade
  && provider.fallbackStatus === 'not_needed'
  && provider.validation.ok

console.log(JSON.stringify({
  smoke: 'qwen-live-owner-config',
  ok: passed,
  doctorStatus: doctor.status,
  providerStatus: provider.status,
  runtimeStatus: provider.runtimeStatus,
  fallbackStatus: provider.fallbackStatus,
  validationStatus: provider.validation.status,
  qwenCallMade: provider.qwenCallMade,
  providerCallMade: provider.providerCallMade,
  secretValuePrinted: provider.secretValuePrinted,
  workerJobCreated: provider.workerJobCreated,
  renderJobCreated: provider.renderJobCreated,
  creditReservedOrSpent: provider.creditReservedOrSpent,
  publicSummary: provider.publicSummary,
}, null, 2))

if (!passed) process.exitCode = 1
