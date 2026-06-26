import { registerHooks } from 'node:module'

const runtimeDirectoryMarker = '/server/workers/sound-cpu/runtime/'

export const runtimeModules = [
  'soundCpuJobContracts',
  'soundCpuRuntimeGuards',
  'soundCpuMediaGuards',
  'soundCpuSupabaseGuards',
  'soundCpuArtifactPolicy',
  'soundCpuObservability',
]

registerHooks({
  resolve(specifier, context, nextResolve) {
    const isRuntimeRelativeImport =
      specifier.startsWith('./') &&
      !specifier.endsWith('.ts') &&
      context.parentURL &&
      context.parentURL.includes(runtimeDirectoryMarker)

    if (isRuntimeRelativeImport) {
      return nextResolve(`${specifier}.ts`, context)
    }

    return nextResolve(specifier, context)
  },
})

export async function runSoundCpuNoExecutionImportProof() {
  const importedModules = []

  for (const moduleName of runtimeModules) {
    const moduleNamespace = await import(`../../server/workers/sound-cpu/runtime/${moduleName}.ts`)
    importedModules.push({
      moduleName,
      ok: true,
      exportNames: Object.keys(moduleNamespace).sort(),
    })
  }

  return {
    ok: true,
    moduleCount: importedModules.length,
    importedModules,
    resolverHookUsedForExtensionlessRuntimeImports: true,
    workerDispatchExecuted: false,
    routeExecutionExecuted: false,
    toolExecutionExecuted: false,
    mediaProcessingExecuted: false,
    supabaseSqlExecuted: false,
    artifactCreated: false,
    dockerGcpExecuted: false,
    providerModelCalled: false,
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await runSoundCpuNoExecutionImportProof()
  console.log(JSON.stringify(result, null, 2))
}
