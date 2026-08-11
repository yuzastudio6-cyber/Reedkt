import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const workflow = await readFile('.github/workflows/ui-qa.yml', 'utf8')
const installName = '      - name: Install private-pipeline media runtime'
const browserName = '      - name: Browser E2E'
const serverTypecheckName = '      - name: Server typecheck'
const installIndex = workflow.indexOf(installName)
const browserIndex = workflow.indexOf(browserName)
const serverTypecheckIndex = workflow.indexOf(serverTypecheckName)

assert.ok(installIndex >= 0, 'UI QA must install the system media runtime.')
assert.ok(browserIndex > installIndex, 'Media runtime installation must precede browser E2E.')
assert.ok(serverTypecheckIndex > browserIndex, 'Server and private pipeline validation must remain after browser E2E.')

const installStep = workflow.slice(installIndex, browserIndex)
assert.match(installStep, /sudo [^\n]*apt-get install --yes ffmpeg/u)
assert.match(installStep, /ffmpeg -version/u)
assert.match(installStep, /ffprobe -version/u)
assert.doesNotMatch(installStep, /continue-on-error|if:\s*failure|\|\|\s*true/u)

const browserStep = workflow.slice(browserIndex, serverTypecheckIndex)
assert.match(browserStep, /run: npm run test:e2e/u)
assert.doesNotMatch(browserStep, /continue-on-error|if:|ENOENT|skip/u)

assert.equal(
  [...workflow.matchAll(/apt-get install --yes ffmpeg/gu)].length,
  1,
  'UI QA must install the media runtime once and reuse it for later private-pipeline steps.',
)

console.log(JSON.stringify({
  status: 'ok',
  mediaRuntimeInstalledBeforeBrowserE2e: true,
  ffmpegVersionVerified: true,
  ffprobeVersionVerified: true,
  browserE2eUnskipped: true,
  laterPrivatePipelinePreserved: true,
  duplicateMediaInstallations: 0,
}, null, 2))
