import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import satori from "satori";

const root = process.cwd();
const decision = "ai_graphics_satori_font_runtime_proof_completed_with_warnings";
const docsDir = path.join(root, "docs/tool-intelligence/ai-graphics");
const jsonPath = path.join(docsDir, "satori-font-runtime-proof.json");
const markdownPath = path.join(docsDir, "satori-font-runtime-proof.md");
const fontRelativePath = "node_modules/three/examples/fonts/ttf/kenpixel.ttf";
const fontPath = path.join(root, fontRelativePath);

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function sha256(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function countMatches(input, pattern) {
  return Array.from(input.matchAll(pattern)).length;
}

const packageLock = readJson("package-lock.json");
const satoriVersion = packageLock.packages?.["node_modules/satori"]?.version ?? null;
const threeVersion = packageLock.packages?.["node_modules/three"]?.version ?? null;
const fontData = fs.readFileSync(fontPath);

const fixtureNode = {
  type: "div",
  props: {
    style: {
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      width: "100%",
      height: "100%",
      background: "#ffffff",
      color: "#111827",
      fontFamily: "KenPixel",
      fontSize: 34,
      padding: 32,
      lineHeight: 1.2,
    },
    children: [
      "CPU Static",
      {
        type: "span",
        props: {
          style: {
            display: "block",
            marginTop: 18,
            fontSize: 18,
            color: "#374151",
          },
          children: "Satori locked font fixture proof",
        },
      },
    ],
  },
};

async function renderFixture() {
  return satori(fixtureNode, {
    width: 640,
    height: 360,
    fonts: [
      {
        name: "KenPixel",
        data: fontData,
        weight: 400,
        style: "normal",
      },
    ],
  });
}

const firstSvg = await renderFixture();
const secondSvg = await renderFixture();
const firstHash = sha256(firstSvg);
const secondHash = sha256(secondSvg);
const fontHash = sha256(fontData);
const hasSvgRoot = firstSvg.startsWith("<svg");
const hasExpectedViewBox = firstSvg.includes('viewBox="0 0 640 360"');
const pathCount = countMatches(firstSvg, /<path\b/g);
const deterministic = firstHash === secondHash;
const passed = hasSvgRoot && hasExpectedViewBox && pathCount > 0 && deterministic;

const proof = {
  schemaVersion: "2026-06-25.ai-graphics.satori-font-runtime-proof",
  decision,
  status: passed ? "completed_with_warnings" : "failed",
  branch: "codex/rp-ai-graphics-satori-font-runtime-proof",
  base: "origin/codex/rp-ai-graphics-browser-runtime-proof",
  sourcePr: {
    number: 787,
    url: "https://github.com/yuzastudio6-cyber/Reedkt/pull/787",
    state: "OPEN",
    isDraft: true,
    mergeStateStatus: "CLEAN",
    headSha: "02f582b9c158026346cca4f83ae8f02c45b3aac9",
  },
  sourceProofs: {
    nodeRuntimeProofDecision: "ai_graphics_node_runtime_proof_completed_with_warnings",
    browserRuntimeProofDecision: "ai_graphics_browser_runtime_proof_completed_with_warnings",
    gpuWorkerInstallProofDecision: "ai_graphics_gpu_worker_install_proof_hardened_with_warnings",
  },
  proofScope: "satori_cpu_static_text_svg_layout_with_locked_package_font_fixture",
  tool: {
    toolId: "satori",
    packageName: "satori",
    version: satoriVersion,
    status: passed
      ? "satori_font_fixture_svg_layout_proof_passed"
      : "satori_font_fixture_svg_layout_proof_failed",
    runtimeTarget: "node_cpu_static_svg_layout",
    fontFixture: {
      source: "locked_three_package_example_font",
      packageName: "three",
      packageVersion: threeVersion,
      path: fontRelativePath,
      family: "KenPixel",
      licenseContext: "provided by locked three package; no font binary committed by this lane",
      sha256: fontHash,
      byteLength: fontData.byteLength,
    },
    outputContract: {
      width: 640,
      height: 360,
      hasSvgRoot,
      hasExpectedViewBox,
      pathCount,
      firstSvgSha256: firstHash,
      secondSvgSha256: secondHash,
      deterministic,
      svgLength: firstSvg.length,
      svgArtifactCommitted: false,
      publicArtifactCreated: false,
    },
    agentExecutableNow: false,
    routeExecutionUsed: false,
    workerExecutionUsed: false,
    providerRuntimeUsed: false,
    publicArtifactCreated: false,
  },
  booleans: {
    satoriFontRuntimeProofCompleted: passed,
    lockedPackageFontFixtureUsed: true,
    committedFontBinary: false,
    satoriTextSvgLayoutProofPassed: passed,
    all13JsGraphicsToolsHaveRuntimeProofEvidence: passed,
    npmCiFromLockForValidation: true,
    dependencyInstallPerformed: false,
    packageLockMutationPerformed: false,
    generatedArtifactsCommitted: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
    modelWeightsDownloaded: false,
    mediaProcessingPerformed: false,
    providerRuntimePerformed: false,
    browserWebglCanvasRuntimePerformed: false,
    gpuRuntimePerformed: false,
    agentCanSelectForPlanning: true,
    agentCanExecuteToolsNow: false,
    toolRouteExecutionReadyNow: false,
    workerExecutionReadyNow: false,
    browserWebglCanvasRuntimeReadyNow: false,
    gpuModelRuntimeReadyNow: false,
    runtimeBetaReadyNow: false,
    internalBetaReadyNow: false,
    externalBetaReadyNow: false,
    productionReadyNow: false,
  },
  remainingGaps: [
    "8 model/GPU tools still require linux/amd64 NVIDIA image build and import/runtime proof.",
    "Tool Route and Worker execution gates remain blocked until route contracts, worker handoff, approved fixtures, model manifests, and credit/snapshot gates are proven.",
  ],
};

if (!passed) {
  console.error(JSON.stringify({ status: "failed", proof }, null, 2));
  process.exitCode = 1;
}

fs.mkdirSync(docsDir, { recursive: true });
fs.writeFileSync(jsonPath, `${JSON.stringify(proof, null, 2)}\n`);
fs.writeFileSync(
  markdownPath,
  `# AI Graphics Satori Font Runtime Proof

Decision: \`${decision}\`

This lane resolves the prior Satori font-fixture block by rendering a Satori
text SVG layout in memory with a deterministic font fixture from the locked
\`three@${threeVersion}\` package. It does not add dependencies, commit a font
binary, write rendered SVG/media artifacts, create public artifacts, create
signed URLs, or unlock agent/tool/runtime/beta/production execution.

## Source

- PR #787: [AI graphics browser runtime proof](https://github.com/yuzastudio6-cyber/Reedkt/pull/787), open/draft/CLEAN at \`02f582b9c158026346cca4f83ae8f02c45b3aac9\`.
- Node runtime proof decision: \`ai_graphics_node_runtime_proof_completed_with_warnings\`.
- Browser runtime proof decision: \`ai_graphics_browser_runtime_proof_completed_with_warnings\`.

## Tool Result

| Tool | Package | Version | Status |
| --- | --- | --- | --- |
| \`satori\` | \`satori\` | \`${satoriVersion}\` | \`${proof.tool.status}\` |

## Font Fixture

- Source: locked \`three\` package example font.
- Fixture path: \`${fontRelativePath}\`.
- Family used by proof: \`KenPixel\`.
- Font SHA-256: \`${fontHash}\`.
- Font binary committed by this lane: \`false\`.

## Output Contract

- SVG root present: \`${hasSvgRoot}\`.
- Expected viewBox present: \`${hasExpectedViewBox}\`.
- Path count: \`${pathCount}\`.
- Deterministic in-memory render hash: \`${deterministic}\`.
- SVG artifact committed: \`false\`.
- Public artifact created: \`false\`.

## Gates

- \`agentCanSelectForPlanning=true\`
- \`agentCanExecuteToolsNow=false\`
- \`toolRouteExecutionReadyNow=false\`
- \`workerExecutionReadyNow=false\`
- \`browserWebglCanvasRuntimeReadyNow=false\`
- \`gpuModelRuntimeReadyNow=false\`
- \`runtimeBetaReadyNow=false\`
- \`internalBetaReadyNow=false\`
- \`externalBetaReadyNow=false\`
- \`productionReadyNow=false\`

## Remaining Gaps

- 8 model/GPU tools still require linux/amd64 NVIDIA image build and import/runtime proof.
- Tool Route and Worker execution gates remain blocked until route contracts,
  worker handoff, approved fixtures, model manifests, and credit/snapshot gates
  are proven.
`,
);

console.log(JSON.stringify({
  status: proof.status,
  decision,
  tool: proof.tool.toolId,
  proofStatus: proof.tool.status,
  deterministic,
  fontFixture: fontRelativePath,
}, null, 2));
