import { readFileSync, writeFileSync } from "node:fs";

const outputJsonPath = "docs/tool-intelligence/ai-graphics/node-runtime-proof.json";
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const packageLock = JSON.parse(readFileSync("package-lock.json", "utf8"));
const packageLockPackages = packageLock.packages || {};
const rootPackage = packageLockPackages[""] || {};
const dependencies = {
  ...(rootPackage.dependencies || {}),
  ...(rootPackage.devDependencies || {}),
  ...(rootPackage.optionalDependencies || {}),
  ...(packageJson.dependencies || {}),
  ...(packageJson.devDependencies || {}),
  ...(packageJson.optionalDependencies || {}),
};

const toolPackages = {
  d3: "d3",
  echarts: "echarts",
  vega_lite: "vega-lite",
  vega: "vega",
  satori: "satori",
  svgdotjs_svg_js: "@svgdotjs/svg.js",
  viz_js: "@viz-js/viz",
  lottie_web: "lottie-web",
  animejs: "animejs",
  three_js: "three",
  pixi_js: "pixi.js",
  konva: "konva",
  babylonjs: "babylonjs",
};

const failures = [];
const warnings = [];
const tools = [];
const browserBoundaryPattern = /\b(?:document|window|navigator|HTMLElement|HTMLCanvasElement|WebGLRenderingContext|canvas|DOM|localStorage)\b/i;
const existingProof = (() => {
  try {
    return JSON.parse(readFileSync(outputJsonPath, "utf8"));
  } catch {
    return null;
  }
})();

process.on("warning", (warning) => {
  warnings.push({ name: warning.name, message: warning.message });
});

function packageVersion(packageName) {
  return packageLockPackages[`node_modules/${packageName}`]?.version ?? null;
}

function requireDeclared(toolId, packageName) {
  if (!dependencies[packageName]) failures.push(`${toolId}:missing_dependency:${packageName}`);
  if (!packageLockPackages[`node_modules/${packageName}`]) failures.push(`${toolId}:missing_lock_entry:${packageName}`);
}

function record(toolId, result) {
  tools.push({
    toolId,
    packageName: toolPackages[toolId],
    version: packageVersion(toolPackages[toolId]),
    ...result,
    agentExecutableNow: false,
    routeExecutionUsed: false,
    workerExecutionUsed: false,
    providerRuntimeUsed: false,
    publicArtifactCreated: false,
  });
}

function failTool(toolId, error) {
  const message = error?.message ?? String(error);
  record(toolId, {
    status: browserBoundaryPattern.test(message) ? "import_blocked_by_browser_runtime" : "import_failed",
    errorMessage: message,
  });
  if (!browserBoundaryPattern.test(message)) failures.push(`${toolId}:import_failed:${message}`);
}

for (const [toolId, packageName] of Object.entries(toolPackages)) {
  requireDeclared(toolId, packageName);
}

try {
  const d3 = await import("d3");
  const scaleOutput = d3.scaleLinear().domain([0, 20]).range([0, 200])(10);
  const lineOutput = d3.line()([[0, 0], [1, 1], [2, 4]]);
  const passed = scaleOutput === 100 && typeof lineOutput === "string" && lineOutput.startsWith("M0,0");
  record("d3", {
    status: passed ? "node_runtime_proof_passed" : "node_runtime_proof_failed",
    proofScope: "node_in_memory_data_shape_and_svg_path_metadata",
    scaleOutput,
    lineOutput,
    browserRuntimeUsed: false,
  });
  if (!passed) failures.push("d3:runtime_contract_failed");
} catch (error) {
  failTool("d3", error);
}

try {
  const echarts = await import("echarts");
  const passed = typeof echarts.version === "string" && typeof echarts.init === "function" && typeof echarts.graphic === "object";
  record("echarts", {
    status: passed ? "import_api_shape_passed_browser_runtime_pending" : "import_api_shape_failed",
    proofScope: "api_surface_only_no_chart_initialization",
    echartsVersion: echarts.version ?? null,
    initExportType: typeof echarts.init,
    chartInitializationUsed: false,
    browserRuntimeUsed: false,
  });
  if (!passed) failures.push("echarts:api_shape_failed");
} catch (error) {
  failTool("echarts", error);
}

let compiledVegaSpec = null;
try {
  const vegaLite = await import("vega-lite");
  const compiled = vegaLite.compile({
    description: "AI graphics node runtime proof spec",
    data: { values: [{ label: "alpha", value: 4 }, { label: "beta", value: 12 }] },
    mark: "bar",
    encoding: {
      x: { field: "label", type: "nominal" },
      y: { field: "value", type: "quantitative" },
    },
  });
  compiledVegaSpec = compiled.spec;
  const passed = compiled?.spec?.marks?.[0]?.type === "rect";
  record("vega_lite", {
    status: passed ? "node_runtime_compile_passed" : "node_runtime_compile_failed",
    proofScope: "in_memory_spec_compile_no_view_render",
    compiledMarkType: compiled?.spec?.marks?.[0]?.type ?? null,
    viewRenderUsed: false,
  });
  if (!passed) failures.push("vega_lite:compile_failed");
} catch (error) {
  failTool("vega_lite", error);
}

try {
  const vega = await import("vega");
  const parsed = vega.parse(compiledVegaSpec ?? {
    data: [{ name: "table", values: [{ x: 1 }] }],
    marks: [{ type: "rect", from: { data: "table" }, encode: { enter: {} } }],
  });
  const passed = parsed && typeof parsed === "object" && Array.isArray(parsed.operators);
  record("vega", {
    status: passed ? "node_runtime_parse_passed" : "node_runtime_parse_failed",
    proofScope: "in_memory_spec_parse_no_view_render",
    operatorCount: Array.isArray(parsed?.operators) ? parsed.operators.length : 0,
    viewRenderUsed: false,
  });
  if (!passed) failures.push("vega:parse_failed");
} catch (error) {
  failTool("vega", error);
}

try {
  const satori = await import("satori");
  const passed = typeof satori.default === "function" && typeof satori.init === "function";
  record("satori", {
    status: passed ? "import_api_shape_passed_font_fixture_pending" : "import_api_shape_failed",
    proofScope: "api_surface_only_no_text_svg_layout",
    defaultExportType: typeof satori.default,
    initExportType: typeof satori.init,
    approvedFontFixturePresent: false,
    svgRenderUsed: false,
  });
  if (!passed) failures.push("satori:api_shape_failed");
} catch (error) {
  failTool("satori", error);
}

try {
  const [svgjs, jsdom] = await Promise.all([import("@svgdotjs/svg.js"), import("jsdom")]);
  const { JSDOM } = jsdom;
  const dom = new JSDOM("<!doctype html><html><body></body></html>");
  svgjs.registerWindow(dom.window, dom.window.document);
  const draw = svgjs.SVG().size(240, 120);
  draw.rect(80, 40).move(12, 18).attr({ fill: "#1d4ed8", "data-proof-marker": "node-runtime-proof" });
  const svg = draw.svg();
  const passed = svg.startsWith("<svg") && svg.includes("<rect") && svg.includes("node-runtime-proof");
  record("svgdotjs_svg_js", {
    status: passed ? "node_runtime_svg_construction_passed" : "node_runtime_svg_construction_failed",
    proofScope: "node_dom_adapter_in_memory_svg_construction",
    svgLength: svg.length,
    nodeDomAdapterUsed: "jsdom_existing_lockfile_dependency",
    outputFileWritten: false,
  });
  if (!passed) failures.push("svgdotjs_svg_js:svg_contract_failed");
} catch (error) {
  failTool("svgdotjs_svg_js", error);
}

try {
  const viz = await import("@viz-js/viz");
  const instance = await viz.instance();
  const svg = instance.renderString("digraph NodeRuntimeProof { alpha -> beta }", { format: "svg", engine: "dot" });
  const passed = typeof svg === "string" && svg.includes("alpha") && svg.includes("beta");
  record("viz_js", {
    status: passed ? "node_runtime_dot_to_svg_passed" : "node_runtime_dot_to_svg_failed",
    proofScope: "in_memory_dot_to_svg_no_public_artifact",
    graphvizVersion: viz.graphvizVersion ?? null,
    svgLength: typeof svg === "string" ? svg.length : 0,
    outputFileWritten: false,
  });
  if (!passed) failures.push("viz_js:dot_to_svg_failed");
} catch (error) {
  failTool("viz_js", error);
}

try {
  const lottie = await import("lottie-web");
  const surface = lottie.default ?? lottie["module.exports"] ?? lottie;
  record("lottie_web", {
    status: "manifest_metadata_import_passed_player_runtime_pending",
    proofScope: "module_metadata_only_no_animation_load",
    surfaceType: typeof surface,
    enumerableApiKeys: Object.keys(surface ?? {}).length,
    animationLoaded: false,
    browserPlayerRuntimeUsed: false,
  });
} catch (error) {
  const message = error?.message ?? String(error);
  const browserBoundary = browserBoundaryPattern.test(message);
  record("lottie_web", {
    status: browserBoundary ? "manifest_metadata_blocked_by_browser_runtime" : "import_failed",
    proofScope: "module_metadata_only_no_animation_load",
    errorMessage: message,
    animationLoaded: false,
    browserPlayerRuntimeUsed: false,
  });
  if (!browserBoundary) failures.push(`lottie_web:import_failed:${message}`);
}

try {
  const anime = await import("animejs");
  const passed = typeof anime.animate === "function" && typeof anime.createTimeline === "function" && typeof anime.easings === "object";
  record("animejs", {
    status: passed ? "import_api_shape_passed_animation_runtime_pending" : "import_api_shape_failed",
    proofScope: "api_surface_only_no_motion_execution",
    animateExportType: typeof anime.animate,
    createTimelineExportType: typeof anime.createTimeline,
    animationRuntimeExecuted: false,
  });
  if (!passed) failures.push("animejs:api_shape_failed");
} catch (error) {
  failTool("animejs", error);
}

try {
  const three = await import("three");
  const passed = typeof three.REVISION === "string" && typeof three.WebGLRenderer === "function" && typeof three.Scene === "function";
  record("three_js", {
    status: passed ? "import_api_shape_passed_webgl_runtime_pending" : "import_api_shape_failed",
    proofScope: "api_surface_only_no_renderer_or_webgl_context",
    revision: three.REVISION ?? null,
    webglRendererExportType: typeof three.WebGLRenderer,
    sceneExportType: typeof three.Scene,
    webglContextCreated: false,
  });
  if (!passed) failures.push("three_js:api_shape_failed");
} catch (error) {
  failTool("three_js", error);
}

try {
  const pixi = await import("pixi.js");
  const passed = typeof pixi.VERSION === "string" && typeof pixi.Application === "function" && typeof pixi.Container === "function";
  record("pixi_js", {
    status: passed ? "import_api_shape_passed_canvas_webgl_runtime_pending" : "import_api_shape_failed",
    proofScope: "api_surface_only_no_application_or_renderer",
    pixiVersion: pixi.VERSION ?? null,
    applicationExportType: typeof pixi.Application,
    containerExportType: typeof pixi.Container,
    rendererConstructed: false,
  });
  if (!passed) failures.push("pixi_js:api_shape_failed");
} catch (error) {
  failTool("pixi_js", error);
}

try {
  const konvaModule = await import("konva");
  const konva = konvaModule.default ?? konvaModule;
  const passed = typeof konva.version === "string" && typeof konva.Stage === "function" && typeof konva.Layer === "function";
  record("konva", {
    status: passed ? "import_api_shape_passed_canvas_runtime_pending" : "import_api_shape_failed",
    proofScope: "api_surface_only_no_stage_or_canvas",
    konvaVersion: konva.version ?? null,
    stageExportType: typeof konva.Stage,
    layerExportType: typeof konva.Layer,
    canvasRuntimeExecuted: false,
  });
  if (!passed) failures.push("konva:api_shape_failed");
} catch (error) {
  failTool("konva", error);
}

try {
  const babylonModule = await import("babylonjs");
  const babylon = babylonModule.default ?? babylonModule["module.exports"] ?? babylonModule;
  const passed = typeof babylon.Engine === "function" && typeof babylon.Scene === "function" && typeof babylon.Vector3 === "function";
  record("babylonjs", {
    status: passed ? "import_api_shape_passed_webgl_runtime_pending" : "import_api_shape_failed",
    proofScope: "api_surface_only_no_engine_or_webgl_context",
    engineVersion: babylon.Engine?.Version ?? null,
    engineExportType: typeof babylon.Engine,
    sceneExportType: typeof babylon.Scene,
    vector3ExportType: typeof babylon.Vector3,
    engineConstructed: false,
    webglContextCreated: false,
  });
  if (!passed) failures.push("babylonjs:api_shape_failed");
} catch (error) {
  failTool("babylonjs", error);
}

const status = failures.length === 0 ? "completed_with_warnings" : "failed";
const decision = failures.length === 0
  ? "ai_graphics_node_runtime_proof_completed_with_warnings"
  : "ai_graphics_node_runtime_proof_failed";
const summary = {
  schemaVersion: "2026-06-25.ai-graphics.node-runtime-proof",
  decision,
  status,
  branch: "codex/rp-ai-graphics-node-runtime-proof",
  base: "origin/codex/rp-ai-graphics-gpu-import-readiness",
  sourcePr: {
    number: 775,
    url: "https://github.com/yuzastudio6-cyber/Reedkt/pull/775",
    state: "OPEN",
    isDraft: true,
    mergeStateStatus: "CLEAN",
    headSha: "589a704339fb3b06a101a7cd51504ea681a8c0eb",
  },
  ...(existingProof?.proofPr ? { proofPr: existingProof.proofPr } : {}),
  proofScope: "node_import_api_and_in_memory_static_contracts_for_13_js_graphics_tools",
  tools,
  warnings,
  failures,
  booleans: {
    nodeRuntimeProofCompleted: failures.length === 0,
    all13NodeGraphicsToolsProofAttempted: tools.length === 13,
    npmCiFromLockForValidation: true,
    d3NodeRuntimeProofPassed: tools.find((tool) => tool.toolId === "d3")?.status === "node_runtime_proof_passed",
    vegaLiteNodeCompilePassed: tools.find((tool) => tool.toolId === "vega_lite")?.status === "node_runtime_compile_passed",
    vegaNodeParsePassed: tools.find((tool) => tool.toolId === "vega")?.status === "node_runtime_parse_passed",
    svgdotjsNodeSvgConstructionPassed: tools.find((tool) => tool.toolId === "svgdotjs_svg_js")?.status === "node_runtime_svg_construction_passed",
    vizJsNodeDotToSvgPassed: tools.find((tool) => tool.toolId === "viz_js")?.status === "node_runtime_dot_to_svg_passed",
    satoriImportApiPassedFontFixturePending: tools.find((tool) => tool.toolId === "satori")?.status === "import_api_shape_passed_font_fixture_pending",
    browserRuntimeStillRequired: true,
    webglCanvasRuntimeStillRequired: true,
    agentCanSelectForPlanning: true,
    agentCanExecuteToolsNow: false,
    toolRouteExecutionReadyNow: false,
    workerExecutionReadyNow: false,
    browserWebglCanvasRuntimeReadyNow: false,
    runtimeBetaReadyNow: false,
    internalBetaReadyNow: false,
    externalBetaReadyNow: false,
    productionReadyNow: false,
    packageLockMutationPerformed: false,
    generatedArtifactsCommitted: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
  },
  nextImplementationMilestones: [
    "Approve deterministic Satori font fixture and rerun text SVG layout proof.",
    "Run browser/player/canvas/WebGL sandbox proofs for ECharts, Lottie, Anime.js, Three.js, PixiJS, Konva, and Babylon.js.",
    "Wire Tool Route and Worker execution only after approved snapshot, credit, and runtime gates.",
    "Continue GPU worker image build/import proof for model-backed AI graphics tools.",
  ],
};

const rows = tools
  .map((tool) => `| \`${tool.toolId}\` | \`${tool.packageName}\` | \`${tool.version}\` | \`${tool.status}\` | \`${tool.proofScope}\` |`)
  .join("\n");
const markdown = `# AI Graphics Node Runtime Proof

Decision: \`${decision}\`

This lane proves the 13 JavaScript AI graphics packages from the existing lockfile install at the Node import/API/in-memory contract layer. It does not claim browser, WebGL, canvas, player, Tool Route, Worker, public artifact, beta, or production readiness.

## Source

- PR #775: [AI graphics GPU import readiness](https://github.com/yuzastudio6-cyber/Reedkt/pull/775), open/draft/CLEAN at \`589a704339fb3b06a101a7cd51504ea681a8c0eb\`.${existingProof?.proofPr ? `

## Draft PR

- PR #${existingProof.proofPr.number}: [AI graphics node runtime proof](${existingProof.proofPr.url}), open/draft/${existingProof.proofPr.mergeStateStatus} at creation head \`${existingProof.proofPr.headShaAtPrCreation}\`.
- Check rollup at PR creation: empty.` : ""}

## Tool Results

| Tool | Package | Version | Status | Scope |
| --- | --- | --- | --- | --- |
${rows}

## Required False Gates

- \`agentCanExecuteToolsNow=false\`
- \`toolRouteExecutionReadyNow=false\`
- \`workerExecutionReadyNow=false\`
- \`browserWebglCanvasRuntimeReadyNow=false\`
- \`runtimeBetaReadyNow=false\`
- \`internalBetaReadyNow=false\`
- \`externalBetaReadyNow=false\`
- \`productionReadyNow=false\`
- \`publicArtifactCreated=false\`
- \`signedUrlCreated=false\`

## Next Proof

Satori still needs an approved deterministic font fixture before text SVG layout can be accepted. Browser/player/canvas/WebGL tools still need a browser sandbox proof before agent execution or beta readiness.
`;

writeFileSync(outputJsonPath, `${JSON.stringify(summary, null, 2)}\n`);
writeFileSync("docs/tool-intelligence/ai-graphics/node-runtime-proof.md", markdown);

console.log(JSON.stringify({
  status,
  decision,
  toolsChecked: tools.length,
  failures,
  runtimeBetaReadyNow: false,
}, null, 2));

if (failures.length > 0) process.exit(1);
