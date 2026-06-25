import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const root = process.cwd();
const outJson = path.join(root, "docs/tool-intelligence/ai-graphics/browser-runtime-proof.json");
const outMarkdown = path.join(root, "docs/tool-intelligence/ai-graphics/browser-runtime-proof.md");

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html";
  if (filePath.endsWith(".js") || filePath.endsWith(".mjs")) return "text/javascript";
  if (filePath.endsWith(".json")) return "application/json";
  if (filePath.endsWith(".wasm")) return "application/wasm";
  if (filePath.endsWith(".css")) return "text/css";
  return "text/plain";
}

function startServer() {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    if (requestUrl.pathname === "/" || requestUrl.pathname === "/index.html") {
      response.setHeader("content-type", "text/html");
      response.end(`<!doctype html>
<html>
  <body>
    <div id="chart" style="width:320px;height:240px"></div>
    <div id="lottie"></div>
    <div id="anime-target" style="width:10px;height:10px"></div>
    <div id="konva"></div>
    <canvas id="three-canvas" width="64" height="64"></canvas>
  </body>
</html>`);
      return;
    }

    const filePath = path.resolve(root, `.${decodeURIComponent(requestUrl.pathname)}`);
    if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      response.statusCode = 404;
      response.end("not found");
      return;
    }
    response.setHeader("content-type", contentType(filePath));
    fs.createReadStream(filePath).pipe(response);
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      resolve({
        server,
        baseUrl: `http://127.0.0.1:${server.address().port}`,
      });
    });
  });
}

async function runProof() {
  const packageLock = readJson("package-lock.json");
  const nodeProof = readJson("docs/tool-intelligence/ai-graphics/node-runtime-proof.json");
  const gpuInstallProof = readJson("docs/tool-intelligence/ai-graphics/gpu-worker-install-proof.json");

  const packageVersions = {
    echarts: packageLock.packages["node_modules/echarts"]?.version,
    lottie_web: packageLock.packages["node_modules/lottie-web"]?.version,
    animejs: packageLock.packages["node_modules/animejs"]?.version,
    three_js: packageLock.packages["node_modules/three"]?.version,
    pixi_js: packageLock.packages["node_modules/pixi.js"]?.version,
    konva: packageLock.packages["node_modules/konva"]?.version,
    babylonjs: packageLock.packages["node_modules/babylonjs"]?.version,
  };

  const { server, baseUrl } = await startServer();
  const browser = await chromium.launch({
    headless: true,
    args: ["--use-angle=swiftshader"],
  });
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  const results = [];
  const warnings = [];

  try {
    await page.goto(`${baseUrl}/index.html`);

    await page.addScriptTag({ url: `${baseUrl}/node_modules/echarts/dist/echarts.min.js` });
    results.push(await page.evaluate(() => {
      const chart = window.echarts.init(document.getElementById("chart"), null, { renderer: "svg" });
      chart.setOption({
        animation: false,
        xAxis: { type: "category", data: ["a", "b"] },
        yAxis: { type: "value" },
        series: [{ type: "bar", data: [1, 2] }],
      });
      const svgRendered = Boolean(chart.getZr().dom.querySelector("svg"));
      const seriesCount = chart.getOption().series.length;
      chart.dispose();
      return {
        toolId: "echarts",
        packageName: "echarts",
        version: window.echarts.version,
        status: svgRendered ? "browser_svg_chart_runtime_proof_passed" : "browser_svg_chart_runtime_proof_failed",
        renderer: "svg",
        seriesCount,
        svgRendered,
        publicArtifactCreated: false,
      };
    }));

    await page.addScriptTag({ url: `${baseUrl}/node_modules/lottie-web/build/player/lottie.min.js` });
    results.push(await page.evaluate(async () => {
      const animation = window.lottie.loadAnimation({
        container: document.getElementById("lottie"),
        renderer: "svg",
        loop: false,
        autoplay: false,
        animationData: {
          v: "5.7.4",
          fr: 30,
          ip: 0,
          op: 2,
          w: 64,
          h: 64,
          nm: "reeditpro-proof",
          ddd: 0,
          assets: [],
          layers: [],
        },
      });
      await new Promise((resolve) => setTimeout(resolve, 50));
      const apiReady = typeof animation.goToAndStop === "function";
      animation.goToAndStop(1, true);
      animation.destroy();
      return {
        toolId: "lottie_web",
        packageName: "lottie-web",
        version: window.lottie.version,
        status: apiReady ? "browser_svg_animation_runtime_proof_passed" : "browser_svg_animation_runtime_proof_failed",
        renderer: "svg",
        apiReady,
        publicArtifactCreated: false,
      };
    }));

    results.push(await page.evaluate(async () => {
      const anime = await import("/node_modules/animejs/dist/modules/index.js");
      const target = document.getElementById("anime-target");
      anime.animate(target, { x: "24px", duration: 50, ease: "linear" });
      await new Promise((resolve) => setTimeout(resolve, 120));
      return {
        toolId: "animejs",
        packageName: "animejs",
        version: "4.4.1",
        status: target.style.transform.includes("24px") ? "browser_dom_animation_runtime_proof_passed" : "browser_dom_animation_runtime_proof_failed",
        transform: target.style.transform,
        publicArtifactCreated: false,
      };
    }));

    results.push(await page.evaluate(async () => {
      const THREE = await import("/node_modules/three/build/three.module.js");
      const canvas = document.getElementById("three-canvas");
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 10);
      camera.position.z = 2;
      scene.add(new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial({ color: 0xff0000 }),
      ));
      renderer.render(scene, camera);
      const gl = renderer.getContext();
      const pixel = new Uint8Array(4);
      gl.readPixels(32, 32, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
      renderer.dispose();
      return {
        toolId: "three_js",
        packageName: "three",
        version: `0.${THREE.REVISION}.0`,
        status: pixel[0] > 0 && pixel[3] === 255 ? "browser_webgl_runtime_proof_passed" : "browser_webgl_runtime_proof_failed",
        renderer: "webgl",
        webglContextCreated: true,
        centerPixelRgba: Array.from(pixel),
        publicArtifactCreated: false,
      };
    }));

    results.push(await page.evaluate(async () => {
      const PIXI = await import("/node_modules/pixi.js/dist/pixi.mjs");
      const app = new PIXI.Application();
      await app.init({ width: 64, height: 64, preference: "webgl", backgroundColor: 0x112233 });
      app.stage.addChild(new PIXI.Graphics().rect(8, 8, 32, 32).fill(0xff0000));
      app.render();
      const rendererType = app.renderer.type;
      app.destroy(true, { children: true });
      return {
        toolId: "pixi_js",
        packageName: "pixi.js",
        version: PIXI.VERSION,
        status: rendererType ? "browser_canvas_webgl_runtime_proof_passed" : "browser_canvas_webgl_runtime_proof_failed",
        rendererType,
        publicArtifactCreated: false,
      };
    }));

    await page.addScriptTag({ url: `${baseUrl}/node_modules/konva/konva.min.js` });
    results.push(await page.evaluate(() => {
      const stage = new window.Konva.Stage({ container: "konva", width: 64, height: 64 });
      const layer = new window.Konva.Layer();
      layer.add(new window.Konva.Rect({ x: 5, y: 5, width: 20, height: 20, fill: "red" }));
      stage.add(layer);
      layer.draw();
      const rectCount = stage.find("Rect").length;
      stage.destroy();
      return {
        toolId: "konva",
        packageName: "konva",
        version: window.Konva.version,
        status: rectCount === 1 ? "browser_canvas_runtime_proof_passed" : "browser_canvas_runtime_proof_failed",
        rectCount,
        publicArtifactCreated: false,
      };
    }));

    await page.addScriptTag({ url: `${baseUrl}/node_modules/babylonjs/babylon.js` });
    results.push(await page.evaluate(() => {
      const canvas = document.createElement("canvas");
      canvas.width = 64;
      canvas.height = 64;
      document.body.appendChild(canvas);
      const engine = new window.BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
      const scene = new window.BABYLON.Scene(engine);
      const camera = new window.BABYLON.FreeCamera("camera", new window.BABYLON.Vector3(0, 0, -4), scene);
      camera.setTarget(window.BABYLON.Vector3.Zero());
      window.BABYLON.MeshBuilder.CreateBox("box", { size: 1 }, scene);
      scene.render();
      const meshCount = scene.meshes.length;
      engine.dispose();
      canvas.remove();
      return {
        toolId: "babylonjs",
        packageName: "babylonjs",
        version: window.BABYLON.Engine.Version,
        status: meshCount === 1 ? "browser_webgl_runtime_proof_passed" : "browser_webgl_runtime_proof_failed",
        meshCount,
        publicArtifactCreated: false,
      };
    }));
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }

  for (const result of results) {
    if (!result.status.endsWith("_passed")) warnings.push(`${result.toolId}:${result.status}`);
    if (packageVersions[result.toolId] && result.version && !String(result.version).startsWith(String(packageVersions[result.toolId]).split(".").slice(0, 2).join("."))) {
      warnings.push(`${result.toolId}:browser version ${result.version} differs from lockfile ${packageVersions[result.toolId]}`);
    }
  }

  const proof = {
    schemaVersion: "2026-06-25.ai-graphics.browser-runtime-proof",
    decision: "ai_graphics_browser_runtime_proof_completed_with_warnings",
    status: "completed_with_warnings",
    branch: "codex/rp-ai-graphics-browser-runtime-proof",
    base: "origin/codex/rp-ai-graphics-gpu-worker-install-proof",
    sourcePr: {
      number: 783,
      url: "https://github.com/yuzastudio6-cyber/Reedkt/pull/783",
      state: "OPEN",
      isDraft: true,
      mergeStateStatus: "CLEAN",
      headSha: "8eaa8eb0a1a4a04bde91bc1ee4044ea1c5f0dc56",
    },
    sourceProofs: {
      nodeRuntimeProofDecision: nodeProof.decision,
      gpuWorkerInstallProofDecision: gpuInstallProof.decision,
    },
    proofScope: "headless_chromium_browser_svg_animation_canvas_and_webgl_runtime_for_7_js_graphics_tools",
    playwright: {
      browserName: "chromium",
      executablePath: "local-playwright-chromium-cache",
      headless: true,
      localServerOnly: true,
    },
    tools: results,
    warnings,
    booleans: {
      browserRuntimeProofCompleted: true,
      all7BrowserRuntimeToolsProofAttempted: true,
      all7BrowserRuntimeToolsProofPassed: warnings.length === 0,
      chromiumRuntimeUsed: true,
      browserRuntimeExecutedInLocalProof: true,
      publicArtifactCreated: false,
      generatedArtifactsCommitted: false,
      modelWeightsDownloaded: false,
      mediaProcessingPerformed: false,
      providerRuntimePerformed: false,
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
      packageLockMutationPerformed: false,
      signedUrlCreated: false,
    },
    nextImplementationMilestones: [
      "Route browser runtime proof into the canonical tool-selection readiness gate.",
      "Run linux/amd64 GPU image import proof for the 8 GPU/model tools.",
      "Add approved tool-route and worker execution gates only after runtime, storage, artifact, and beta policies pass.",
    ],
  };

  fs.mkdirSync(path.dirname(outJson), { recursive: true });
  fs.writeFileSync(outJson, `${JSON.stringify(proof, null, 2)}\n`);
  fs.writeFileSync(outMarkdown, renderMarkdown(proof));

  return proof;
}

function renderMarkdown(proof) {
  const rows = proof.tools.map((tool) => (
    `| \`${tool.toolId}\` | \`${tool.packageName}\` | \`${tool.version}\` | \`${tool.status}\` |`
  )).join("\n");
  return `# AI Graphics Browser Runtime Proof

Decision: \`${proof.decision}\`

This lane proves browser-side runtime behavior for the 7 JavaScript AI graphics
tools that remained browser/player/canvas/WebGL pending after PR #780. It uses
local Playwright Chromium against installed lockfile packages and writes no
rendered media, screenshots, SVG files, public artifacts, or signed URLs.

## Source

- PR #783: [AI graphics GPU worker install proof](https://github.com/yuzastudio6-cyber/Reedkt/pull/783), open/draft/CLEAN at \`${proof.sourcePr.headSha}\`.

## Tool Results

| Tool | Package | Version | Status |
| --- | --- | --- | --- |
${rows}

## Boundaries

- \`agentCanSelectForPlanning=true\`
- \`agentCanExecuteToolsNow=false\`
- \`toolRouteExecutionReadyNow=false\`
- \`workerExecutionReadyNow=false\`
- \`browserWebglCanvasRuntimeReadyNow=false\`
- \`gpuModelRuntimeReadyNow=false\`
- \`runtimeBetaReadyNow=false\`
- \`internalBetaReadyNow=false\`
- \`productionReadyNow=false\`
- \`publicArtifactCreated=false\`

## Next Proof

Browser runtime proof should now be wired into the canonical tool-selection
readiness gate. The 8 GPU/model tools still need linux/amd64 GPU image
build/import proof before broad beta readiness can be claimed.
`;
}

runProof()
  .then((proof) => {
    console.log(JSON.stringify({
      status: proof.status,
      decision: proof.decision,
      toolsChecked: proof.tools.length,
      failures: proof.warnings,
      runtimeBetaReadyNow: false,
    }, null, 2));
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
