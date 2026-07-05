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

const result = await runQwenMarkerChatBridge({
  repository: createQwenLiveSmokeRepository(),
  request: {
    id: `qwen-live-provider-smoke-${Date.now().toString(36)}`,
    source: 'backend_route',
    projectId: QWEN_LIVE_SMOKE_FIXTURE.projectId,
    editSessionId: QWEN_LIVE_SMOKE_FIXTURE.editSessionId,
    briefId: QWEN_LIVE_SMOKE_FIXTURE.briefId,
    markerId: QWEN_LIVE_SMOKE_FIXTURE.markerId,
    messageText: QWEN_LIVE_SMOKE_FIXTURE.messageText,
  },
})

assertNoUnsafeQwenRuntimeEffects(result)

const passed = result.status === 'qwen_beta_completed'
  && result.qwenCallMade
  && result.providerCallMade
  && result.fallbackStatus === 'not_needed'
  && result.validation.ok

const output = {
  smoke: 'qwen-live-provider',
  ok: passed,
  status: passed ? 'qwen_live_provider_passed' : 'qwen_live_provider_failed',
  bridgeStatus: result.status,
  runtimeStatus: result.runtimeStatus,
  fallbackStatus: result.fallbackStatus,
  validationStatus: result.validation.status,
  qwenCallMade: result.qwenCallMade,
  providerCallMade: result.providerCallMade,
  modelCallMade: result.modelCallMade,
  secretValuePrinted: result.secretValuePrinted,
  workerJobCreated: result.workerJobCreated,
  renderJobCreated: result.renderJobCreated,
  creditReservedOrSpent: result.creditReservedOrSpent,
  publicSummary: result.publicSummary,
  warnings: result.warnings,
}

console.log(JSON.stringify(output, null, 2))
if (!passed) process.exitCode = 1
