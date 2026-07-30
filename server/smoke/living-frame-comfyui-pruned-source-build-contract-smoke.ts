import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = new URL("../../", import.meta.url);
const dockerfile = read(
  "docker/prod/gpu-worker/comfyui/" +
    "Dockerfile.local-hardened-runtime-pruned-candidate",
);
const pruner = read(
  "docker/prod/gpu-worker/comfyui/" + "prune-hardened-runtime-offline.sh",
);
const sam2Remover = read(
  "docker/prod/gpu-worker/comfyui/" +
    "remove-inherited-sam2-distribution.py",
);
const verifier = read(
  "docker/prod/gpu-worker/comfyui/" + "verify-hardened-runtime-pruned.py",
);

assert.match(
  dockerfile,
  /FROM reeditpro-living-frame-comfyui-canonical-offline:private-internal-bffa1ec0/u,
);
assert.match(
  dockerfile,
  /parent-image-sha256="84358d2b8272998bb3258ca18c46fad4de80118da24528aae98be39ae25bcc1b"/u,
);
assert.equal((dockerfile.match(/RUN --network=none/g) ?? []).length, 2);
assert.match(
  dockerfile,
  /install-hardened-runtime-offline\.sh[\s\S]*prune-hardened-runtime-offline\.sh/u,
);
assert.match(dockerfile, /USER 65532:65532/u);
assert.match(dockerfile, /operation-venv-installer-metadata-present="false"/u);
assert.match(dockerfile, /build-toolchain-present="false"/u);
assert.match(
  dockerfile,
  /inherited-sam2-distribution-present="false"/u,
);
assert.match(dockerfile, /operation-registered="false"/u);
assert.match(dockerfile, /runtime-executed="false"/u);
assert.match(dockerfile, /production-qualified="false"/u);
assert.doesNotMatch(
  dockerfile,
  /\b(?:curl|wget|git clone|pip install|apt-get update)\b/u,
);

for (const required of [
  "accepts no arguments",
  "requires build-root",
  "-m pip uninstall --yes pip setuptools",
  "remove-inherited-sam2-distribution.py",
  "apt-get purge",
  "--no-download",
  "linux-libc-dev",
  "libnode-dev",
  "nodejs",
  "openssl",
  "build-essential",
  "python3-dev",
  "dpkg --purge --force-depends apt gpgv",
  'if [ -d "${apt_cache_root}" ]',
  "verify-installed-layout.sh",
] as const) {
  assert.equal(
    pruner.includes(required),
    true,
    `Missing runtime-prune requirement: ${required}`,
  );
}
assert.doesNotMatch(
  pruner,
  /\b(?:curl|wget|git clone|apt-get update|apt-get autoremove)\b/u,
);

for (const required of [
  "EXPECTED_REVISION = \"2b90b9f5ceec907a1c18123530e92e794ad901a4\"",
  "EXPECTED_FILE_COUNT = 114",
  "e0056305b664ab9f54cf1b4a7f5886a6bcacb389195fe8f1c07aee3547b8e468",
  "not relative_path.startswith(ALLOWED_PREFIXES)",
  "shutil.rmtree(root)",
  "distributionPresentAfterRemoval",
  "sam2ModuleImportableAfterRemoval",
  "runtimeAuthority",
  "productionReady",
] as const) {
  assert.equal(
    sam2Remover.includes(required),
    true,
    `Missing inherited SAM-2 removal requirement: ${required}`,
  );
}
assert.doesNotMatch(
  sam2Remover,
  /\b(?:requests|urllib|socket|subprocess|curl|wget)\b/u,
);

for (const required of [
  "EXPECTED_UID = 65_532",
  "EXPECTED_GID = 65_532",
  "Base hardened runtime verifier lineage changed.",
  "d7728338ebdc04c9a647882b9d0e16328e317f8863287dd7f4d9f6d7cf861440",
  "Operation-local installer metadata remains after pruning.",
  "Build-only OS packages remain installed.",
  "Network trust store remains in offline runtime.",
  '"sam2ImportDenied": base_receipt["sam2ImportDenied"]',
  '"inheritedSam2DistributionPresent": False',
  '"inheritedSam2ModuleImportable": False',
  '"inheritedSam2TrainingModuleImportable": False',
  '"modelWeightsLoaded": False',
  '"graphExecuted": False',
  '"runtimeAuthority": False',
  '"productionReady": False',
] as const) {
  assert.equal(
    verifier.includes(required),
    true,
    `Missing pruned verifier requirement: ${required}`,
  );
}
assert.doesNotMatch(
  verifier,
  /\b(?:requests|urllib|socket|subprocess\.Popen)\b/u,
);

process.stdout.write(
  `${JSON.stringify({
    suite: "living-frame-comfyui-pruned-source-build-contract",
    status: "passed",
    sourceDefinedBuild: true,
    exactParentDigestBound: true,
    offlineWheelInstallPreserved: true,
    operationVenvInstallerMetadataRemoved: true,
    inheritedSam2DistributionRemoved: true,
    buildToolchainPruned: true,
    defaultUid: 65_532,
    defaultGid: 65_532,
    modelWeightsLoaded: false,
    graphExecuted: false,
    operationRegistered: false,
    productionReady: false,
  })}\n`,
);

function read(relativePath: string): string {
  return readFileSync(new URL(relativePath, root), "utf8");
}
