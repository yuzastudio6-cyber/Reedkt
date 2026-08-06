import { ensureBrowser } from '@remotion/renderer'

const status = await ensureBrowser({ chromeMode: 'headless-shell', logLevel: 'error' })
if (status.type !== 'local-puppeteer-browser' && status.type !== 'user-defined-path') {
  throw new Error(`Browser preparation failed: ${status.type}`)
}
process.stdout.write(`${status.path}\n`)
