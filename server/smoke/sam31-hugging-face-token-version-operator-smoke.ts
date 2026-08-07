import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(
  'scripts/gcp/prod/28-add-sam31-hugging-face-token-version.sh',
  'utf8',
)
const operatorGuide = readFileSync('scripts/gcp/prod/README.md', 'utf8')

for (const expected of [
  "readonly PROJECT_ID='reeditpro'",
  "readonly PROJECT_NUMBER='390722338345'",
  "readonly SECRET_NAME='HUGGINGFACE_TOKEN'",
  'add-weeditpro-sam31-hugging-face-token-version-v1',
  'set +x',
  'umask 077',
  'read -r -s',
  '</dev/tty',
  '^hf_[A-Za-z0-9]{20,220}$',
  'gcloud secrets versions add "${SECRET_NAME}"',
  '--data-file=-',
  'gcloud secrets versions describe',
  '"secretValuePrinted":false',
  '"secretValueWrittenToDeveloperDisk":false',
  '"modelOrCheckpointDownloaded":false',
  '"modelInstalledOnDeveloperMachine":false',
  '"gpuJobStarted":false',
  '"customerCreditsMutated":false',
  '"productionAuthorityGranted":false',
] as const) assert.ok(source.includes(expected), `missing ${expected}`)

for (const forbidden of [
  /mktemp/u,
  /--data-file=(?!-)/u,
  /MODEL_WEIGHT_ACCESS_TOKEN/u,
  /secrets create/u,
  /secrets versions access/u,
  /(?:curl|wget)\s/u,
  /git clone/u,
  /pip(?:3)? install/u,
  /gcloud builds submit/u,
  /gcloud (?:batch|run) jobs (?:submit|execute)/u,
  /sam3\.1_multiplex\.pt/u,
] as const) assert.doesNotMatch(source, forbidden)

assert.match(source, /printf '%s' "\$\{token\}"[\s\\\n]*\| gcloud secrets versions add/u)
assert.doesNotMatch(
  source,
  /gcloud[^\n]*(?:\$\{token\}|\$token)/u,
  'the secret must enter gcloud only through stdin',
)
for (const expected of [
  '`28-add-sam31-hugging-face-token-version.sh` operator',
  'personally signed in to the official',
  '`facebook/sam3.1` gated repository',
  'minimum-scope read token',
  'never writes the token to a local file',
  'no local checkpoint, model installation, image, GPU job, or production',
] as const) assert.ok(
  operatorGuide.includes(expected),
  `operator guide missing ${expected}`,
)
assert.doesNotMatch(operatorGuide, /paste[^\n]*(?:ChatGPT|Codex)/iu)

console.log(JSON.stringify({
  smoke: 'sam31-hugging-face-token-version-operator',
  productName: 'WeEditPro',
  targetSecret: 'HUGGINGFACE_TOKEN',
  interactiveTerminalRequired: true,
  localTemporaryFileUsed: false,
  secretValuePrinted: false,
  modelOrCheckpointDownloaded: false,
  modelInstalledOnDeveloperMachine: false,
  gpuJobStarted: false,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))
