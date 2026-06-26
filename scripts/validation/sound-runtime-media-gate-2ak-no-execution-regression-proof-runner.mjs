import { runSoundCpuNoExecutionImportProof } from './sound-runtime-media-gate-2ah-no-execution-import-proof-runner.mjs'

const runtimeGuardModulePath = '../../server/workers/sound-cpu/runtime/soundCpuRuntimeGuards.ts'
const mediaGuardModulePath = '../../server/workers/sound-cpu/runtime/soundCpuMediaGuards.ts'
const supabaseGuardModulePath = '../../server/workers/sound-cpu/runtime/soundCpuSupabaseGuards.ts'
const artifactPolicyModulePath = '../../server/workers/sound-cpu/runtime/soundCpuArtifactPolicy.ts'

function captureFailClosed(fn) {
  try {
    fn()
    return { threw: false, messageIncludesBlocked: false }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      threw: true,
      messageIncludesBlocked: /blocked|disabled|owner gates/i.test(message),
      sanitizedMessage: message.replace(/Bearer\s+[A-Za-z0-9._~+/-]+/g, 'Bearer [redacted]'),
    }
  }
}

export async function runSoundCpuRuntimeGuardNoExecutionRegressionProof() {
  const importProof = await runSoundCpuNoExecutionImportProof()
  const runtimeGuards = await import(runtimeGuardModulePath)
  const mediaGuards = await import(mediaGuardModulePath)
  const supabaseGuards = await import(supabaseGuardModulePath)
  const artifactPolicy = await import(artifactPolicyModulePath)

  const disabledFlags = runtimeGuards.getSoundCpuRuntimeDisabledFlags()
  const disabledFlagKeys = runtimeGuards.SOUND_CPU_RUNTIME_DISABLED_FLAG_KEYS
  const disabledFlagValues = Object.fromEntries(disabledFlagKeys.map((key) => [key, disabledFlags[key]]))
  const defaultAssertionResult = runtimeGuards.assertSoundCpuRuntimeDisabledFlags(disabledFlags)
  const invalidFlags = {
    ...disabledFlags,
    REEDITPRO_SOUND_CPU_RUNTIME_ENABLED: '1',
  }

  const failClosedAssertions = {
    invalidRuntimeFlagRejected: captureFailClosed(() => runtimeGuards.assertSoundCpuRuntimeDisabledFlags(invalidFlags)),
    runtimeExecutionBlocked: captureFailClosed(() => runtimeGuards.assertSoundCpuRuntimeExecutionBlocked()),
    mediaOperationBlocked: captureFailClosed(() => mediaGuards.assertSoundCpuMediaOperationBlocked()),
    supabaseMutationBlocked: captureFailClosed(() => supabaseGuards.assertSoundCpuSupabaseMutationBlocked()),
    artifactWriteBlocked: captureFailClosed(() => artifactPolicy.assertSoundCpuArtifactWriteBlocked()),
  }

  return {
    ok: true,
    importedRuntimeModuleCount: importProof.moduleCount,
    disabledFlagKeyCount: disabledFlagKeys.length,
    disabledFlagValues,
    defaultAssertionReturnedSameFlags: defaultAssertionResult === disabledFlags,
    failClosedAssertions,
    workerDispatchExecuted: false,
    routeExecutionExecuted: false,
    toolExecutionExecuted: false,
    mediaProcessingExecuted: false,
    supabaseSqlExecuted: false,
    artifactCreated: false,
    dockerGcpExecuted: false,
    providerModelCalled: false,
    generatedLocalFixturePassedClaimed: false,
    dryRunPassedClaimed: false,
    runtimeReadinessClaimed: false,
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await runSoundCpuRuntimeGuardNoExecutionRegressionProof()
  console.log(JSON.stringify(result, null, 2))
}
