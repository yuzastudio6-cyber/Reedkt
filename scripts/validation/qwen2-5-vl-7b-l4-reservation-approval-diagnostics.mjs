#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DECISION =
  "qwen2_5_vl_7b_l4_reservation_approval_ready_for_bounded_us_east1_b_reservation_create_no_vm_no_inference";
const NEXT_PROMPT =
  "QWEN2_5_VL_STACK_TOOL_9-RESERVATION-CREATE: create bounded L4 reservation for Qwen proof in us-east1-b, no VM/no inference";

const REQUIRED_FILES = [
  "docs/qwen2-5-vl-7b-l4-reservation-approval-result.md",
  "docs/qwen2-5-vl-7b-l4-reservation-approval-change-log.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-l4-reservation-create.md",
  "docs/qwen2-5-vl-7b-l4-capacity-assurance-plan-result.md",
  "docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-us-east1-b-result.md",
  "docs/ai-video-broll-generation-gcp-proof-identity-setup-result.md",
  "scripts/validation/qwen2-5-vl-7b-l4-reservation-approval-diagnostics.mjs",
  "package.json"
];

const REQUIRED_RESULT_PHRASES = [
  DECISION,
  "Future bounded reservation creation is approved for planning purposes",
  "| Matching Qwen reservations | none |",
  "| `us-east1` `NVIDIA_L4_GPUS` quota | limit `1`, usage `0` |",
  "| Exact shape visible in `us-east1-b` | true |",
  "Primary target: `us-east1-b`",
  "Reservation name: `reeditpro-qwen2-5-vl-l4-proof-reservation`",
  "VM creation in the reservation-create prompt: false",
  "Inference in the reservation-create prompt: false",
  "Serving in the reservation-create prompt: false",
  "Qwen2.5-VL remains a visual understanding, planning, and QA stack tool",
  NEXT_PROMPT
];

const TRUE_FLAGS = [
  "gcpReadOnlyCommandsExecuted",
  "reservationCreationApprovedForFuturePrompt"
];

const FALSE_FLAGS = [
  "gcpMutatingCommandsExecuted",
  "reservationCreated",
  "reservationDeleted",
  "vmCreateApprovedInReservationPrompt",
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
  packageJson.scripts?.["qwen2-5-vl-7b-l4-reservation-approval:diagnostics"] ===
    "node scripts/validation/qwen2-5-vl-7b-l4-reservation-approval-diagnostics.mjs",
  "package.json must expose qwen2-5-vl-7b-l4-reservation-approval:diagnostics"
);

const result = read("docs/qwen2-5-vl-7b-l4-reservation-approval-result.md");
const prompt = read("docs/implementation-prompts/prompt-qwen2-5-vl-7b-l4-reservation-create.md");
const changeLog = parseBlock(
  "docs/qwen2-5-vl-7b-l4-reservation-approval-change-log.md",
  "qwen2-5-vl-7b-l4-reservation-approval-change-log"
);

includesAll(result, REQUIRED_RESULT_PHRASES, "reservation approval result");
includesAll(prompt, [
  NEXT_PROMPT,
  "Reservation name: `reeditpro-qwen2-5-vl-l4-proof-reservation`",
  "VM creation in this prompt: false",
  "Inference in this prompt: false",
  "Do not create or delete a VM.",
  "Do not run inference.",
  "Do not claim `generated_local_fixture_passed`."
], "reservation create prompt");

for (const flag of TRUE_FLAGS) {
  includesAll(result, [`${flag}=true`], `true runtime flag ${flag}`);
}
for (const flag of FALSE_FLAGS) {
  includesAll(result, [`${flag}=false`], `false runtime flag ${flag}`);
}

check(changeLog.decision === DECISION, "Change log decision mismatch");
check(changeLog.readOnlyGcpState?.matchingQwenReservations === 0, "Matching reservation count mismatch");
check(changeLog.readOnlyGcpState?.primaryTargetRegion === "us-east1", "Target region mismatch");
check(changeLog.readOnlyGcpState?.primaryTargetZone === "us-east1-b", "Target zone mismatch");
check(changeLog.readOnlyGcpState?.globalGpusAllRegionsQuotaLimit === 1, "Global GPU quota limit mismatch");
check(changeLog.readOnlyGcpState?.globalGpusAllRegionsQuotaUsage === 0, "Global GPU quota usage mismatch");
check(changeLog.readOnlyGcpState?.exactShapeVisibleInPrimaryTarget === true, "Exact shape must be visible");
check(changeLog.approvalDecision?.futureReservationCreateApproved === true, "Future reservation create must be approved");
check(changeLog.approvalDecision?.futureVmCreateApprovedInReservationPrompt === false, "VM create must not be approved in reservation prompt");
check(changeLog.approvalDecision?.futureInferenceApproved === false, "Inference must not be approved");
check(changeLog.approvalDecision?.mustRepeatPreflightBeforeMutation === true, "Preflight must be required");
check(changeLog.nextPrompt === NEXT_PROMPT, "Next prompt mismatch");

for (const flag of TRUE_FLAGS) {
  check(changeLog.runtimeFlags?.[flag] === true, `Change log runtime flag ${flag} must be true`);
}
for (const flag of FALSE_FLAGS) {
  check(changeLog.runtimeFlags?.[flag] === false, `Change log runtime flag ${flag} must be false`);
}

for (const file of [
  "docs/qwen2-5-vl-7b-l4-reservation-approval-result.md",
  "docs/qwen2-5-vl-7b-l4-reservation-approval-change-log.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-l4-reservation-create.md"
]) {
  assertNoForbiddenText(file);
}

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  matchingQwenReservations: 0,
  primaryTargetZone: "us-east1-b",
  reservationCreationApprovedForFuturePrompt: true,
  reservationCreated: false,
  vmCreateApprovedInReservationPrompt: false,
  modelInferenceRun: false,
  generatedLocalFixturePassedClaimed: false,
  nextPrompt: NEXT_PROMPT
}, null, 2));
