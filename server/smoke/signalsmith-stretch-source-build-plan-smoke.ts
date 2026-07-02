import { existsSync, readFileSync } from 'node:fs'

function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

function readRepoFile(path: string): string {
  const url = new URL(`../../${path}`, import.meta.url)
  check(existsSync(url), `Missing required file: ${path}`)
  return readFileSync(url, 'utf8')
}

const jsonPath = 'docs/production-readiness/signalsmith-stretch-source-build-plan.json'
const markdownPath = 'docs/production-readiness/signalsmith-stretch-source-build-plan.md'

const packet = JSON.parse(readRepoFile(jsonPath)) as {
  decision?: string
  toolId?: string
  sourceClass?: string
  upstream?: {
    repository?: string
    head?: string
    licenseFile?: string
    license?: string
    commandSource?: string
    makefile?: string
    cmakeFile?: string
  }
  approvedNextStep?: {
    name?: string
    installedCommand?: string
    blockedEvidence?: string[]
  }
  boundaries?: Record<string, unknown>
  nextPrompt?: string
}
const markdown = readRepoFile(markdownPath)
const packageJson = readRepoFile('package.json')

check(packet.decision === 'signalsmith_stretch_source_build_plan_passed_ready_for_bounded_source_build_execution', 'Signalsmith decision drifted.')
check(packet.toolId === 'signalsmith_stretch', 'Signalsmith packet must target signalsmith_stretch.')
check(packet.sourceClass === 'official_upstream_source_build', 'Signalsmith source class must be official upstream source build.')
check(packet.upstream?.repository === 'https://github.com/Signalsmith-Audio/signalsmith-stretch', 'Signalsmith upstream repository must be canonical.')
check(packet.upstream?.head === '57b93f4e9206a089a45387eaa39bdc9f310d3308', 'Signalsmith upstream head must be recorded.')
check(packet.upstream?.licenseFile === 'LICENSE.txt', 'Signalsmith license file must be recorded.')
check(packet.upstream?.license === 'MIT', 'Signalsmith source license must be MIT.')
check(packet.upstream?.commandSource === 'cmd/main.cpp', 'Signalsmith command source path must be recorded.')
check(packet.upstream?.makefile === 'cmd/Makefile', 'Signalsmith Makefile path must be recorded.')
check(packet.upstream?.cmakeFile === 'cmd/CMakeLists.txt', 'Signalsmith CMake path must be recorded.')
check(packet.approvedNextStep?.name === 'bounded_source_build_execution', 'Next step must be bounded source build execution.')
check(packet.approvedNextStep?.installedCommand === 'signalsmith-stretch', 'Installed command name must be signalsmith-stretch.')
check(packet.approvedNextStep?.blockedEvidence?.includes('CMake FetchContent example input download') === true, 'CMake example input fetch must be blocked.')
check(packet.boundaries?.doesNotRunSignalsmith === true, 'This plan must not run Signalsmith.')
check(packet.boundaries?.doesNotBuildDocker === true, 'This plan must not build Docker.')
check(packet.boundaries?.doesNotProcessAudio === true, 'This plan must not process audio.')
check(packet.boundaries?.doesNotMutateSupabase === true, 'This plan must not mutate Supabase.')
check(packet.boundaries?.doesNotEnableBetaOrProduction === true, 'This plan must not enable beta or production.')
check(packet.boundaries?.productReadyLocalOssTools === 0, 'Product-ready local OSS tools must remain 0.')
check(packet.nextPrompt === 'SIGNALSMITH_STRETCH_BOUNDED_SOURCE_BUILD_EXECUTION', 'Next prompt drifted.')

for (const required of [
  'cmd/main.cpp',
  'cmd/Makefile',
  'cmd/CMakeLists.txt',
  'FetchContent',
  'No audio/media input or output processing',
  'Product-ready local OSS tools remain `0`',
  'SIGNALSMITH_STRETCH_BOUNDED_SOURCE_BUILD_EXECUTION',
]) {
  check(markdown.includes(required), `Signalsmith markdown must mention ${required}.`)
}

check(packageJson.includes('smoke:signalsmith-stretch-source-build-plan'), 'package.json must expose the Signalsmith source-build plan smoke.')

for (const forbidden of [
  /docker\s+build\s+-/i,
  /apt-get\s+install/i,
  /\bgit\s+clone\b/i,
  /ffmpeg\s+-i/i,
  /ffprobe\s+-/i,
  /supabase\s+(db|migration|sql)/i,
]) {
  check(!forbidden.test(markdown), `Signalsmith source-build plan contains forbidden runtime or production scope: ${forbidden}.`)
}

console.log(JSON.stringify({
  ok: true,
  decision: packet.decision,
  sourceClass: packet.sourceClass,
  upstreamHead: packet.upstream?.head,
  nextPrompt: packet.nextPrompt,
  productReadyLocalOssTools: packet.boundaries?.productReadyLocalOssTools,
  noRuntimeScope: true,
}, null, 2))
