import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const decision = "reeditpro_e2e_blocker_audit_completed_with_warnings_ready_for_merge_queue";
const scopedStatus = "sound_oss_tools_synthetic_fixture_validation_passed_with_warnings";
const scopedHuman = "SOUND OSS scoped synthetic fixture validation passed with warnings";
const expectedFiles = [
  "docs/reeditpro-e2e-blocker-unlock-0-cross-workstream-audit.md",
  "docs/reeditpro-e2e-owner-workstream-blocker-map.md",
  "docs/reeditpro-e2e-open-pr-merge-order-register.md",
  "docs/reeditpro-e2e-blocked-scope-reason-register.md",
  "docs/reeditpro-e2e-readiness-unlock-plan.md",
  "docs/implementation-prompts/prompt-reeditpro-e2e-merge-hygiene-1-open-pr-ready-queue.md",
  "docs/implementation-prompts/prompt-reeditpro-e2e-blocker-unlock-1-owner-gate-plan.md",
  "scripts/validation/reeditpro-e2e-blocker-unlock-0-diagnostics.mjs"
];
const blocks = {
  "docs/reeditpro-e2e-blocker-unlock-0-cross-workstream-audit.md": "reeditpro-e2e-blocker-unlock-0-cross-workstream-audit",
  "docs/reeditpro-e2e-owner-workstream-blocker-map.md": "reeditpro-e2e-owner-workstream-blocker-map",
  "docs/reeditpro-e2e-open-pr-merge-order-register.md": "reeditpro-e2e-open-pr-merge-order-register",
  "docs/reeditpro-e2e-blocked-scope-reason-register.md": "reeditpro-e2e-blocked-scope-reason-register",
  "docs/reeditpro-e2e-readiness-unlock-plan.md": "reeditpro-e2e-readiness-unlock-plan",
  "docs/implementation-prompts/prompt-reeditpro-e2e-merge-hygiene-1-open-pr-ready-queue.md": "reeditpro-e2e-merge-hygiene-1-open-pr-ready-queue",
  "docs/implementation-prompts/prompt-reeditpro-e2e-blocker-unlock-1-owner-gate-plan.md": "reeditpro-e2e-blocker-unlock-1-owner-gate-plan"
};
const unsafeTrueKeys = ["workerExecutionAllowed", "routeExecutionAllowed", "toolExecutionAllowed", "mediaProcessingAllowed", "ffmpegProbeAllowed", "dockerCloudRunAllowed", "providerModelCallsAllowed", "supabaseMutationAllowed", "sqlExecutionAllowed", "storageWritesAllowed", "signedUrlsAllowed", "publicArtifactsAllowed", "creditsStripeAllowed", "internalBetaUnlocked", "externalBetaUnlocked", "paidProductionUnlocked", "productionUnlocked", "runtimeReady", "runtime_ready", "media_processing_ready", "dry_run_passed", "generated_local_fixture_passed", "generatedLocalFixturePassed", "dryRunPassed"];
function assert(condition, message) { if (!condition) throw new Error(message); }
function read(file) { return fs.readFileSync(path.join(root, file), "utf8"); }
function parseBlock(file, label) {
  const text = read(file);
  const marker = "```json " + label + "\n";
  const start = text.indexOf(marker);
  assert(start !== -1, file + " missing JSON block " + label);
  const jsonStart = start + marker.length;
  const end = text.indexOf("\n```", jsonStart);
  assert(end !== -1, file + " missing closing fence for " + label);
  return JSON.parse(text.slice(jsonStart, end));
}
for (const file of expectedFiles) assert(fs.existsSync(path.join(root, file)), file + " missing");
for (const [file, label] of Object.entries(blocks)) parseBlock(file, label);
const main = parseBlock("docs/reeditpro-e2e-blocker-unlock-0-cross-workstream-audit.md", blocks["docs/reeditpro-e2e-blocker-unlock-0-cross-workstream-audit.md"]);
const owner = parseBlock("docs/reeditpro-e2e-owner-workstream-blocker-map.md", blocks["docs/reeditpro-e2e-owner-workstream-blocker-map.md"]);
const mergeOrder = parseBlock("docs/reeditpro-e2e-open-pr-merge-order-register.md", blocks["docs/reeditpro-e2e-open-pr-merge-order-register.md"]);
const blockers = parseBlock("docs/reeditpro-e2e-blocked-scope-reason-register.md", blocks["docs/reeditpro-e2e-blocked-scope-reason-register.md"]);
const readiness = parseBlock("docs/reeditpro-e2e-readiness-unlock-plan.md", blocks["docs/reeditpro-e2e-readiness-unlock-plan.md"]);
assert(main.decision === decision, "main decision mismatch");
assert(owner.decision === decision, "owner map decision mismatch");
assert(mergeOrder.decision === decision, "merge order decision mismatch");
assert(blockers.decision === decision, "blocker register decision mismatch");
assert(readiness.decision === decision, "readiness plan decision mismatch");
assert(main.soundScopedLane?.scopedStatus === scopedStatus, "SOUND scoped status mismatch");
assert(main.soundScopedLane?.humanWording === scopedHuman, "SOUND human wording mismatch");
assert(main.soundScopedLane?.noFurtherSoundOssToolsPromptRequired === true, "SOUND no-next result missing");
assert(main.soundScopedLane?.soundOssTools16PromptExists === false, "SOUND-OSS-TOOLS-16 must not exist");
const implementationPromptNames = fs.readdirSync(path.join(root, "docs/implementation-prompts"));
assert(!implementationPromptNames.some((name) => /^prompt-sound-oss-tools-16/i.test(name)), "SOUND-OSS-TOOLS-16 prompt exists");
assert(mergeOrder.openPrCount >= 300, "open PR register unexpectedly small");
assert(Array.isArray(mergeOrder.register) && mergeOrder.register.length === mergeOrder.openPrCount, "merge order register count mismatch");
assert(Array.isArray(owner.ownerWorkstreams) && owner.ownerWorkstreams.length >= 14, "owner map missing workstreams");
assert(Array.isArray(blockers.blockers) && blockers.blockers.length >= 25, "blocker register missing required blockers");
assert(Array.isArray(readiness.phases) && readiness.phases.length === 11, "readiness phases missing");
for (const gateMap of [main.runtimeGates, owner.runtimeGates, blockers.runtimeGates, readiness.runtimeGates]) { for (const [key, value] of Object.entries(gateMap || {})) assert(value === false, key + " must remain false"); }
for (const [key, value] of Object.entries(main.forbiddenStatuses || {})) assert(value === "blocked_unclaimed", key + " must stay blocked_unclaimed");
for (const blocker of blockers.blockers) assert(blocker.executionAllowedNow === false, blocker.blockerId + " executionAllowedNow must be false");
for (const phase of readiness.phases) assert(phase.canRunNow === false, phase.phaseId + " canRunNow must be false");
const packageJson = JSON.parse(read("package.json"));
assert(packageJson.scripts?.["reeditpro:e2e-blocker-unlock-0:diagnostics"] === "node scripts/validation/reeditpro-e2e-blocker-unlock-0-diagnostics.mjs", "package script missing");
const changedText = expectedFiles.map((file) => read(file)).join("\n");
for (const key of unsafeTrueKeys) { const re = new RegExp("\"" + key + "\"\\s*:\\s*true", "i"); assert(!re.test(changedText), key + " must not be true"); }
const forbiddenPatterns = [[/Bearer\s+[A-Za-z0-9._~+\/-]{16,}=*/, "Bearer token"], [/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/, "JWT"], [/\b(sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9]{20,}|AIza[A-Za-z0-9_-]{20,})\b/, "secret-shaped token"], [/https?:\/\/[^\s)" + "'" + "]*supabase\.co\b/i, "Supabase URL"], [/[?&](X-Amz-Signature|X-Goog-Signature|Signature)=/i, "signed URL"], [/supabaseMutationAllowed"\s*:\s*true/i, "Supabase mutation claim"], [/productionUnlocked"\s*:\s*true/i, "production unlock claim"], [/externalBetaUnlocked"\s*:\s*true/i, "external beta unlock claim"]];
for (const [pattern, label] of forbiddenPatterns) assert(!pattern.test(changedText), label + " found");
assert(changedText.includes("project-wide generated_local_fixture_passed"), "project-wide generated_local_fixture_passed blocker missing");
assert(changedText.includes("dry_run_passed"), "dry_run_passed blocker missing");
assert(changedText.includes("production blocked") || changedText.includes("production remains blocked"), "production blocked wording missing");
assert(changedText.includes("external beta blocked") || changedText.includes("external beta remains blocked"), "external beta blocked wording missing");
console.log(JSON.stringify({ status: "passed", decision, openPrCount: mergeOrder.openPrCount, ownerWorkstreams: owner.ownerWorkstreams.length, blockers: blockers.blockers.length }, null, 2));
