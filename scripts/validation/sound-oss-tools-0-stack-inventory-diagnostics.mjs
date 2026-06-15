import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const requiredFiles = [
  'docs/sound-music-audio-open-source-tool-stack-inventory.md',
  'docs/sound-music-audio-open-source-tool-candidate-matrix.md',
  'docs/sound-music-audio-open-source-tool-install-proof-roadmap.md',
  'docs/sound-music-audio-open-source-tool-gap-register.md',
  'docs/sound-music-audio-open-source-tool-install-blocked-register.md',
  'docs/sound-music-audio-cross-chat-duplicate-risk-register.md',
  'docs/sound-oss-tools-0-stack-inventory-validation-results.md',
  'docs/implementation-prompts/prompt-sound-oss-tools-1-license-provenance-approval.md',
  'docs/cross-chat-tool-ownership-registry.md',
  'scripts/validation/sound-oss-tools-0-stack-inventory-diagnostics.mjs',
  'package.json'
]

const jsonBlocks = {
  inventory: ['docs/sound-music-audio-open-source-tool-stack-inventory.md', 'sound-oss-tools-0-stack-inventory'],
  candidateMatrix: ['docs/sound-music-audio-open-source-tool-candidate-matrix.md', 'sound-oss-tools-0-candidate-matrix'],
  roadmap: ['docs/sound-music-audio-open-source-tool-install-proof-roadmap.md', 'sound-oss-tools-0-install-proof-roadmap'],
  gapRegister: ['docs/sound-music-audio-open-source-tool-gap-register.md', 'sound-oss-tools-0-gap-register'],
  blockedRegister: ['docs/sound-music-audio-open-source-tool-install-blocked-register.md', 'sound-oss-tools-0-blocked-register'],
  validation: ['docs/sound-oss-tools-0-stack-inventory-validation-results.md', 'sound-oss-tools-0-validation-results'],
  duplicateExtension: ['docs/sound-music-audio-cross-chat-duplicate-risk-register.md', 'sound-oss-tools-0-duplicate-risk-extension'],
  ownershipRegistry: ['docs/cross-chat-tool-ownership-registry.md', 'ownership-registry']
}

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8')
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function extractJsonBlock(file, label) {
  const text = read(file)
  const marker = `\`\`\`json ${label}`
  const start = text.indexOf(marker)
  assert(start >= 0, `${file} missing JSON block ${label}`)
  const bodyStart = text.indexOf('\n', start) + 1
  const end = text.indexOf('\n```', bodyStart)
  assert(end > bodyStart, `${file} has unterminated JSON block ${label}`)
  return JSON.parse(text.slice(bodyStart, end))
}

function allText() {
  return requiredFiles.filter((file) => fs.existsSync(path.join(root, file))).map((file) => `${file}\n${read(file)}`).join('\n')
}

for (const file of requiredFiles) {
  assert(fs.existsSync(path.join(root, file)), `Missing required file: ${file}`)
}

const inventory = extractJsonBlock(...jsonBlocks.inventory)
const candidateMatrix = extractJsonBlock(...jsonBlocks.candidateMatrix)
const roadmap = extractJsonBlock(...jsonBlocks.roadmap)
const gapRegister = extractJsonBlock(...jsonBlocks.gapRegister)
const blockedRegister = extractJsonBlock(...jsonBlocks.blockedRegister)
const validation = extractJsonBlock(...jsonBlocks.validation)
const duplicateExtension = extractJsonBlock(...jsonBlocks.duplicateExtension)
const ownershipRegistry = extractJsonBlock(...jsonBlocks.ownershipRegistry)
const packageJson = JSON.parse(read('package.json'))

assert(packageJson.scripts?.['sound-oss-tools-0:diagnostics'] === 'node scripts/validation/sound-oss-tools-0-stack-inventory-diagnostics.mjs', 'Missing package script sound-oss-tools-0:diagnostics')
assert(packageJson.scripts?.['cross-chat-tool-ownership:diagnostics'], 'Missing cross-chat ownership diagnostic script')

assert(inventory.decision === 'sound_oss_tools_0_stack_inventory_gap_audit_completed_ready_for_license_provenance_approval', 'Unexpected inventory decision')
assert(inventory.sourceOfTruth?.ownershipRegistry === 'docs/cross-chat-tool-ownership-registry.md', 'Inventory must reference ownership registry')
assert(inventory.sourceOfTruth?.duplicateRiskRegister === 'docs/sound-music-audio-cross-chat-duplicate-risk-register.md', 'Inventory must reference duplicate-risk register')
assert(inventory.runtimeFlags?.toolExecutionAllowed === false, 'Tool execution must be false')
assert(inventory.runtimeFlags?.supabaseMutationAllowed === false, 'Supabase mutation must be false')
assert(inventory.runtimeFlags?.dryRunPassedClaimed === false, 'dryRunPassedClaimed must be false')
assert(inventory.runtimeFlags?.generatedLocalFixturePassedClaimed === false, 'generatedLocalFixturePassedClaimed must be false')
assert(inventory.runtimeFlags?.runtimeReadinessClaimed === false, 'runtimeReadinessClaimed must be false')

assert(Array.isArray(candidateMatrix.candidates), 'Candidate matrix must contain candidates')
assert(candidateMatrix.candidates.length >= 57, 'Candidate matrix must list at least 57 candidates')
assert(candidateMatrix.candidateCount === candidateMatrix.candidates.length, 'candidateCount must match candidates length')

const candidateById = new Map(candidateMatrix.candidates.map((tool) => [tool.toolId, tool]))
for (const id of ['ffmpeg', 'ffprobe', 'sox', 'mediainfo', 'exiftool', 'libsndfile', 'opus_tools', 'flac_metaflac', 'vorbis_tools', 'wavpack', 'librosa', 'soundfile', 'audioread', 'pydub', 'scipy_signal', 'resampy', 'soxr', 'pyloudnorm', 'essentia', 'audioflux', 'aubio', 'madmom', 'vamp_sonic_annotator', 'music21', 'pretty_midi', 'mido', 'fluidsynth_pyfluidsynth', 'basic_pitch', 'deepfilternet', 'rnnoise', 'noisereduce', 'demucs', 'spleeter', 'open_unmix', 'asteroid', 'speechbrain_enhancement', 'pyrubberband', 'signalsmith_stretch', 'soundtouch', 'rubberband_cli', 'pedalboard', 'ladspa_lv2_host', 'pydub_effects', 'ebu_r128_pyloudnorm', 'bs1770gain', 'whisper_cpp', 'faster_whisper', 'pyannote_audio', 'crepe', 'torchcrepe', 'mir_eval', 'lyria', 'mirelo_sfx_v1_5', 'mmaudio_v2', 'internal_sfx_library', 'soundsync_cue_planning', 'music_ducking_mix_qa']) {
  assert(candidateById.has(id), `Candidate missing: ${id}`)
}

const blockedById = new Map(blockedRegister.blocked.map((tool) => [tool.toolId, tool]))
for (const id of ['demucs', 'rnnoise', 'rubber_band', 'essentia']) {
  const candidate = candidateById.get(id) || candidateById.get(id === 'rubber_band' ? 'pyrubberband' : id)
  const blocked = blockedById.get(id)
  assert(blocked, `${id} must be in blocked register`)
  assert(blocked.blockedInstall === true, `${id} install must be blocked`)
  assert(blocked.blockedRuntime === true, `${id} runtime must be blocked`)
  if (candidate) {
    assert(['blocked', 'blocked_evaluation_only', 'inactive_blocked'].includes(candidate.repoStatus), `${id} candidate status must be blocked`)
  }
}

assert(roadmap.currentPhase === 0, 'Roadmap must remain at phase 0')
assert(roadmap.phases?.[0]?.blockedActions?.includes('install'), 'Phase 0 must block install')
assert(roadmap.phases?.[0]?.blockedActions?.includes('execute'), 'Phase 0 must block execution')
assert(gapRegister.gaps.length >= 10, 'Gap register must include meaningful gaps')
assert(validation.candidatesEvaluated >= 57, 'Validation must record at least 57 candidates')
assert(validation.dryRunPassedStatus === 'not_claimed', 'dry_run_passed must be not_claimed')
assert(validation.generatedLocalFixturePassedStatus === 'not_claimed', 'generated_local_fixture_passed must be not_claimed')
assert(validation.runtimeReadiness === 'not_claimed', 'runtime readiness must be not_claimed')
assert(validation.supabaseStatus?.updateRequired === false, 'Supabase update must be false')
assert(Array.isArray(duplicateExtension.risks) && duplicateExtension.risks.length >= 10, 'Duplicate-risk extension must include shared risks')
assert(ownershipRegistry.decision === 'cross_chat_tool_ownership_registry_created_ready_for_sound_oss_tools_0', 'Ownership registry decision mismatch')

const text = allText()
const unsafePatterns = [
  [/toolExecutionAllowed\s*[:=]\s*true/i, 'tool execution true flag'],
  [/routeExecutionAllowed\s*[:=]\s*true/i, 'route execution true flag'],
  [/workerExecutionAllowed\s*[:=]\s*true/i, 'worker execution true flag'],
  [/providerCallsAllowed\s*[:=]\s*true/i, 'provider call true flag'],
  [/supabaseMutationAllowed\s*[:=]\s*true/i, 'Supabase mutation true flag'],
  [/sqlExecutionAllowed\s*[:=]\s*true/i, 'SQL execution true flag'],
  [/dependencyMutationAllowed\s*[:=]\s*true/i, 'dependency mutation true flag'],
  [/publicArtifactAllowed\s*[:=]\s*true/i, 'public artifact true flag'],
  [/signedUrlAllowed\s*[:=]\s*true/i, 'signed URL true flag'],
  [/dryRunPassedClaimed\s*[:=]\s*true/i, 'dry run passed true claim'],
  [/generatedLocalFixturePassedClaimed\s*[:=]\s*true/i, 'generated local fixture true claim'],
  [/runtimeReadinessClaimed\s*[:=]\s*true/i, 'runtime readiness true claim'],
  [/installCompletionClaimed\s*[:=]\s*true/i, 'install completion true claim'],
  [/productionReady\s*[:=]\s*true/i, 'production ready true claim'],
  [/betaReady\s*[:=]\s*true/i, 'beta ready true claim'],
  [/-----BEGIN (?:RSA |EC |OPENSSH |DSA |PRIVATE )?PRIVATE KEY-----/i, 'private key block'],
  [/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/, 'JWT literal'],
  [/\b(?:postgres(?:ql)?|mysql|mongodb):\/\/[^\s`"']+/i, 'database URL literal'],
  [/https:\/\/[a-z0-9]{20}\.supabase\.co/i, 'Supabase project URL literal']
]

const findings = []
for (const [pattern, message] of unsafePatterns) {
  if (pattern.test(text)) findings.push(message)
}
assert(findings.length === 0, `Unsafe claims or secret-shaped values found: ${findings.join(', ')}`)

const soundOwned = candidateMatrix.candidates.filter((tool) => tool.primaryOwner === 'SOUND_MUSIC_AUDIO' && tool.soundRole === 'own').length
const governanceOnly = candidateMatrix.candidates.filter((tool) => tool.soundRole === 'governance-only').length
const handoffOnly = candidateMatrix.candidates.filter((tool) => tool.soundRole === 'handoff-only').length
const referenceOnly = candidateMatrix.candidates.filter((tool) => tool.soundRole === 'reference-only').length

console.log(JSON.stringify({
  status: 'passed',
  phase: 'SOUND-OSS-TOOLS-0',
  decision: inventory.decision,
  candidatesEvaluated: candidateMatrix.candidates.length,
  soundOwned,
  governanceOnly,
  handoffOnly,
  referenceOnly,
  blockedTools: blockedRegister.blocked.length,
  ownershipConflicts: validation.ownershipConflicts.length,
  duplicateRisks: duplicateExtension.risks.length,
  roadmapCreated: true,
  demucsBlocked: blockedById.get('demucs')?.blockedInstall === true,
  rnnoiseBlocked: blockedById.get('rnnoise')?.blockedInstall === true,
  rubberBandBlocked: blockedById.get('rubber_band')?.blockedInstall === true,
  essentiaBlocked: blockedById.get('essentia')?.blockedInstall === true,
  runtimeClaimsClosed: true,
  supabaseUpdateRequired: false,
  nextPrompt: validation.nextPrompt
}, null, 2))
