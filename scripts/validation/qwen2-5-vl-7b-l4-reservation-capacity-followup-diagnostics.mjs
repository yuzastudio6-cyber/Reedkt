#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DECISION =
  "qwen2_5_vl_7b_l4_reservation_capacity_followup_ready_for_us_west4_a_reservation_create_no_vm_no_inference";
const NEXT_PROMPT =
  "QWEN2_5_VL_STACK_TOOL_9-RESERVATION-CREATE-US-WEST4-A: create bounded L4 reservation for Qwen proof in us-west4-a, no VM/no inference";

const REQUIRED_FILES = [
  "docs/qwen2-5-vl-7b-l4-reservation-capacity-followup-result.md",
  "docs/qwen2-5-vl-7b-l4-reservation-capacity-followup-change-log.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-l4-reservation-create-us-west4-a.md",
  "docs/qwen2-5-vl-7b-l4-reservation-create-result.md",
  "docs/qwen2-5-vl-7b-l4-reservation-approval-result.md",
  "docs/ai-video-broll-generation-gcp-proof-identity-setup-result.md",
  "scripts/validation/qwen2-5-vl-7b-l4-reservation-capacity-followup-diagnostics.mjs",
  "package.json"
];

const REQUIRED_RESULT_PHRASES = [
  DECISION,
  "`us-east1-b` reservation-create attempt failed with GPU availability stockout",
  "| Existing reservations in project | none |",
  "| `us-west4` `NVIDIA_L4_GPUS` quota | limit `1`, usage `0` |",
  "| `us-west4-a` exact shape visibility | true |",
  "| Matching reservation in `us-west4-a` | absent |",
  "| Try `us-west4-a` next | recommended |",
  "Select `us-west4-a` as the next bounded reservation-create target.",
  "Qwen2.5-VL remains a visual understanding, planning, and QA stack tool",
  NEXT_PROMPT
];

const TRUE_FLAGS = [
  "gcpReadOnlyCommandsExecuted",
  "alternateReservationTargetSelected"
];

const FALSE_FLAGS = [
  "gcpMutatingCommandsExecuted",
  "reservationCreated",
  "reservationDeleted",
  "vmCreated",
  "diskCreated",
  "externalIpCreated",
  "networkChanged",
  "serviceAccountCreated",
  "serviceAccountKeyCreated",
  "firewallRuleCreated",
  "bucketCreated",
  "artifactRegistryImageCreated",
  "cloudRunJobCreated",
  "iapTransferExecuted",
  "sshSessionOpened",
  "dependencyInstalledOnVm",
  "runtimeImportRunOnL4",
  "cudaVisibilityCheckedOnL4",
  "vllmImportedOnL4",
  "sglangImportedOnL4",
  "apiServerStarted",
  "modelImportRun",
  "modelInferenceRun",
  "generatedVideoCreated",
  "generatedAssetsCreated",
  "providerCallsMade",
  "workersDispatched",
  "supabaseTouched",
  "sqlExecuted",
  "publicArtifactsCreated",
  "signedUrlsCreated",
  "creditMutationCreated",
  "betaUnlocked",
  "productionUnlocked",
  "dryRunPassedClaimed",
  "generatedLocalFixturePassedClaimed"
];

const FORBIDDEN_PATTERNS = [
  ["signed URL token", /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ["credential assignment", /\b(api[_-]?key|service[_-]?role|secret|password|hf[_-]?token|access[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ["database URL", /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ["remote storage URI", /\b(gs:\/\/|s3:\/\/|storage\.googleapis\.com\/)/i],
  ["raw worker prompt field", /\b(raw_worker_prompt|rawPromptPayload|raw_prompt)\b/i],
  ["runtime-ready true claim", /\b(productionReady|betaReady|runtimeReadinessClaimed)\b\s*[:=]\s*(true|"true")/i],
  ["unsafe pass claim", /\b(dryRunPassedClaimed|generatedLocalFixturePassedClaimed)\b\s*[:=]\s*(true|"true")/i]
];

function check(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function parseBlock(relativePath, label) {
  const text = read(relativePath);
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(new RegExp("```json\\s+" + escaped + "\\n([\\s\\S]*?)\\n```"));
  check(match, `Missing JSON block ${label} in ${relativePath}`);
  return JSON.parse(match[1]);
}

function includesAll(text, values, label) {
  for (const value of values) {
    check(text.includes(value), `${label} missing ${value}`);
  }
}

function assertNoForbiddenText(relativePath) {
  const text = read(relativePath);
  const findings = [];
  for (const [name, pattern] of FORBIDDEN_PATTERNS) {
    if (pattern.test(text)) {
      findings.push(name);
    }
  }
  check(findings.length === 0, `Forbidden value in ${relativePath}: ${findings.join("; ")}`);
}

for (const file of REQUIRED_FILES) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`);
}

const packageJson = JSON.parse(read("package.json"));
check(
  packageJson.scripts?.["qwen2-5-vl-7b-l4-reservation-capacity-followup:diagnostics"] ===
    "node scripts/validation/qwen2-5-vl-7b-l4-reservation-capacity-followup-diagnostics.mjs",
  "package.json must expose qwen2-5-vl-7b-l4-reservation-capacity-followup:diagnostics"
);

const result = read("docs/qwen2-5-vl-7b-l4-reservation-capacity-followup-result.md");
const prompt = read("docs/implementation-prompts/prompt-qwen2-5-vl-7b-l4-reservation-create-us-west4-a.md");
const changeLog = parseBlock(
  "docs/qwen2-5-vl-7b-l4-reservation-capacity-followup-change-log.md",
  "qwen2-5-vl-7b-l4-reservation-capacity-followup-change-log"
);

includesAll(result, REQUIRED_RESULT_PHRASES, "reservation capacity followup result");
includesAll(prompt, [
  NEXT_PROMPT,
  "Zone: `us-west4-a`",
  "VM creation in this prompt: false",
  "Inference in this prompt: false",
  "Do not create or delete a VM.",
  "Do not run inference.",
  "Do not claim `generated_local_fixture_passed`."
], "us-west4-a reservation create prompt");

for (const flag of TRUE_FLAGS) {
  includesAll(result, [`${flag}=true`], `true runtime flag ${flag}`);
}
for (const flag of FALSE_FLAGS) {
  includesAll(result, [`${flag}=false`], `false runtime flag ${flag}`);
}
includesAll(result, ["selectedReservationZone=us-west4-a"], "selected reservation zone");

check(changeLog.decision === DECISION, "Change log decision mismatch");
check(changeLog.readOnlyGcpState?.matchingReservationsInProject === 0, "Matching reservation count mismatch");
check(changeLog.readOnlyGcpState?.selectedReservationRegion === "us-west4", "Selected reservation region mismatch");
check(changeLog.readOnlyGcpState?.selectedReservationZone === "us-west4-a", "Selected reservation zone mismatch");
check(changeLog.readOnlyGcpState?.selectedReservationPresentBeforeCreate === false, "Selected reservation must be absent");
check(changeLog.optionDecision?.tryUsWest4ANext === "recommended", "us-west4-a decision mismatch");
check(changeLog.optionDecision?.tryUsWest4CNext === "fallback", "us-west4-c fallback mismatch");
check(changeLog.nextPrompt === NEXT_PROMPT, "Next prompt mismatch");

for (const flag of TRUE_FLAGS) {
  check(changeLog.runtimeFlags?.[flag] === true, `Change log runtime flag ${flag} must be true`);
}
for (const flag of FALSE_FLAGS) {
  check(changeLog.runtimeFlags?.[flag] === false, `Change log runtime flag ${flag} must be false`);
}
check(changeLog.runtimeFlags?.selectedReservationZone === "us-west4-a", "Runtime selected reservation zone mismatch");

for (const file of [
  "docs/qwen2-5-vl-7b-l4-reservation-capacity-followup-result.md",
  "docs/qwen2-5-vl-7b-l4-reservation-capacity-followup-change-log.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-l4-reservation-create-us-west4-a.md"
]) {
  assertNoForbiddenText(file);
}

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  selectedReservationZone: "us-west4-a",
  reservationCreated: false,
  vmCreated: false,
  gcpMutatingCommandsExecuted: false,
  modelInferenceRun: false,
  generatedLocalFixturePassedClaimed: false,
  nextPrompt: NEXT_PROMPT
}, null, 2));
