#!/usr/bin/env bash
set -Eeuo pipefail

trap 'status=$?; printf "ERROR: SAM 3.1 qualification capsule failed at line %s (exit %s)\n" "${LINENO}" "${status}" >&2; exit "${status}"' ERR

readonly ROOT='/opt/weeditpro-capsule-builder'
readonly WORK='/tmp/weeditpro-sam31-qualification-capsule'
readonly BUILD_SOURCE="${WORK}/build-source"
readonly PRIVATE_ROOT="${BUILD_SOURCE}/sam31_private_build_input"
readonly SOURCE_REVISION='96914d2425f90a64f45ca977c2b5165418099543'
readonly SOURCE_TREE='573deb167702e014829a5b830de8ae62abe891d5'
readonly PATCHED_TREE='f3a58b95a0e460d76e1cf38abff0382a7307f67d'
readonly SOURCE_SHA256='5138f0e396de40a40ef0168c106e089aacbbf1dc7651be2f81c76f89c2f67f2a'
readonly PATCHED_SOURCE_SHA256='b692268f0e295673d5c5cc2fc14e7813847effc5e371e32cb18c1861b4c8adfb'
readonly PATCH_SHA256='daf5dfb59dbe6809eb2731b43e13d91b1679c271f0f4af11962236ffe83eb6ca'
readonly CUDA_COMPAT_SHA256='e980bf55b8d1f6390f07968df46644c971a52f4e4129067d33d1445fac716893'
readonly SOURCE_BYTES='73605120'
readonly CUDA_COMPAT_BYTES='37945232'
readonly REPOSITORY_COMMIT="${WEEDITPRO_REPOSITORY_COMMIT:?missing repository commit}"
readonly REPOSITORY_TREE="${WEEDITPRO_REPOSITORY_TREE:?missing repository tree}"
readonly WHEELHOUSE="${PRIVATE_ROOT}/dependency-closure/wheelhouse"

download_exact() {
  local url="$1" destination="$2" expected_sha="$3" expected_bytes="$4"
  python - "${url}" "${destination}" "${expected_sha}" "${expected_bytes}" <<'PY'
import hashlib
import os
from pathlib import Path
import sys
from urllib.parse import urlparse
from urllib.request import HTTPRedirectHandler, Request, build_opener

url, destination_text, expected_sha, expected_bytes_text = sys.argv[1:]
expected_bytes = int(expected_bytes_text)
allowed = {"developer.download.nvidia.com", "files.pythonhosted.org"}

def validate(value: str) -> None:
    parsed = urlparse(value)
    if (parsed.scheme != "https" or parsed.hostname not in allowed or
            parsed.username or parsed.password or parsed.port not in (None, 443)):
        raise SystemExit("capsule download origin is not allowlisted")

class Redirect(HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, message, headers, new_url):
        validate(new_url)
        return super().redirect_request(request, fp, code, message, headers, new_url)

validate(url)
destination = Path(destination_text)
partial = destination.with_name(destination.name + ".partial")
partial.unlink(missing_ok=True)
digest = hashlib.sha256()
observed = 0
try:
    request = Request(url, headers={
        "Accept-Encoding": "identity",
        "User-Agent": "WeEditPro-SAM31-capsule-builder-v1",
    })
    with build_opener(Redirect()).open(request, timeout=300) as response, partial.open("xb") as out:
        validate(response.geturl())
        if response.status != 200:
            raise SystemExit("capsule download status changed")
        while chunk := response.read(1024 * 1024):
            observed += len(chunk)
            if observed > expected_bytes:
                raise SystemExit("capsule download exceeded bound")
            digest.update(chunk)
            out.write(chunk)
        out.flush()
        os.fsync(out.fileno())
    if observed != expected_bytes or digest.hexdigest() != expected_sha:
        raise SystemExit("capsule download identity changed")
    os.replace(partial, destination)
finally:
    partial.unlink(missing_ok=True)
PY
}

download_wheel() {
  local file_name="$1" url="$2" expected_sha="$3" expected_bytes="$4"
  download_exact "${url}" "${WHEELHOUSE}/${file_name}" \
    "${expected_sha}" "${expected_bytes}"
}

rm -rf "${WORK}" /output
mkdir -p \
  "${PRIVATE_ROOT}/source" \
  "${WHEELHOUSE}" \
  "${PRIVATE_ROOT}/dependency-closure/cuda-forward-compat" \
  "${BUILD_SOURCE}/docker/prod/gpu-worker/sam3_1" \
  /output

readonly SOURCE_ARCHIVE="${PRIVATE_ROOT}/source/sam3-${SOURCE_REVISION}.tar"
cp "${ROOT}/private-staging/sam3-source.tar" "${SOURCE_ARCHIVE}"
printf '%s  %s\n' "${SOURCE_SHA256}" "${SOURCE_ARCHIVE}" | sha256sum --check --strict
test "$(stat --format='%s' "${SOURCE_ARCHIVE}")" = "${SOURCE_BYTES}"

readonly PATCHED_ARCHIVE="${PRIVATE_ROOT}/source/sam3-${SOURCE_REVISION}-reeditpro-gpu-decode.tar"
cp "${ROOT}/private-source-prep/sam3-patched-source.tar" \
  "${PATCHED_ARCHIVE}"
printf '%s  %s\n' "${PATCHED_SOURCE_SHA256}" "${PATCHED_ARCHIVE}" | sha256sum --check --strict
test "$(stat --format='%s' "${PATCHED_ARCHIVE}")" = "${SOURCE_BYTES}"

cp "${ROOT}/source/patches/0001-reeditpro-gpu-decode.patch" \
  "${BUILD_SOURCE}/docker/prod/gpu-worker/sam3_1/patches.tmp"
test "$(sha256sum "${BUILD_SOURCE}/docker/prod/gpu-worker/sam3_1/patches.tmp" | cut -d' ' -f1)" = "${PATCH_SHA256}"

python - "${PRIVATE_ROOT}/source/source-patch-application-receipt.json" <<PY
import json
from pathlib import Path
receipt = {
  "schemaVersion": "weeditpro-sam3_1-source-patch-application-receipt-v1",
  "officialSourceRevision": "${SOURCE_REVISION}",
  "officialSourceTree": "${SOURCE_TREE}",
  "officialSourceArchiveSha256": "${SOURCE_SHA256}",
  "patchSha256": "${PATCH_SHA256}",
  "patchedSourceTree": "${PATCHED_TREE}",
  "patchedSourceArchiveSha256": "${PATCHED_SOURCE_SHA256}",
  "modifiedPaths": [
    "sam3/model/io_utils.py",
    "sam3/model/sam3_base_predictor.py",
    "sam3/model/sam3_multiplex_tracking.py",
    "sam3/model/sam3_multiplex_video_predictor.py",
    "sam3/model_builder.py",
  ],
  "gpuDecodeRequired": True,
  "cpuDecodeFallbackAllowed": False,
  "containsCheckpoint": False,
  "containsCredentials": False,
  "containsCustomerMedia": False,
}
Path("${PRIVATE_ROOT}/source/source-patch-application-receipt.json").write_text(
  json.dumps(receipt, sort_keys=True, separators=(",", ":")) + "\n",
  encoding="utf-8",
)
PY

# Every CPython 3.12 Linux x86_64 dependency wheel is selected and verified by
# exact immutable PyPI file URL, byte length, and SHA-256. There is no online
# dependency resolution in either the capsule build or qualification runtime.
download_wheel \
  'certifi-2026.7.22-py3-none-any.whl' \
  'https://files.pythonhosted.org/packages/0b/a7/71ac2cff56fec219ed242bb11b8efb69fcc4bec75db06fb7bfe35de520e6/certifi-2026.7.22-py3-none-any.whl' \
  '62f22742b58a1a33014a2b6b706588a8d7e2a88ae7bd1a6ebe8c992928483775' \
  '136983'
download_wheel \
  'charset_normalizer-3.4.9-cp312-cp312-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl' \
  'https://files.pythonhosted.org/packages/01/c4/4fa4c8b3097a11f3c5f09a35b72ed6855fb1d332469504962ab7bafcc702/charset_normalizer-3.4.9-cp312-cp312-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl' \
  '5e226f6218febc71f6c1fc2fafb91c226f75bdc1d8fb12d66823716e891608fd' \
  '224256'
download_wheel \
  'filelock-3.32.2-py3-none-any.whl' \
  'https://files.pythonhosted.org/packages/c1/e8/72f8cef9fdfeffe06213fe8508039396ee48daa0e3259457ed766173bfd6/filelock-3.32.2-py3-none-any.whl' \
  '87dd94cf281e586d135fa51132b8e3d9a598b316e90377a288663c9321036c82' \
  '98830'
download_wheel \
  'fsspec-2026.7.0-py3-none-any.whl' \
  'https://files.pythonhosted.org/packages/fd/3c/6a2bf344106328fd04963664a60b9bb6496fc25df8e962fcdc1367285fb9/fsspec-2026.7.0-py3-none-any.whl' \
  'b57ddbafedfaef7018c1ecab32aa200a9d7ca26b77965f64e48b70061249d279' \
  '206583'
download_wheel \
  'ftfy-6.1.1-py3-none-any.whl' \
  'https://files.pythonhosted.org/packages/e1/1e/bf736f9576a8979752b826b75cbd83663ff86634ea3055a766e2d8ad3ee5/ftfy-6.1.1-py3-none-any.whl' \
  '0ffd33fce16b54cccaec78d6ec73d95ad370e5df5a25255c8966a6147bd667ca' \
  '53098'
download_wheel \
  'hf_xet-1.6.0-cp38-abi3-manylinux2014_x86_64.manylinux_2_17_x86_64.whl' \
  'https://files.pythonhosted.org/packages/67/4e/a28359bf1c1ecf11eba22123168c138698f7cb576ac678f5a2e16cd5da08/hf_xet-1.6.0-cp38-abi3-manylinux2014_x86_64.manylinux_2_17_x86_64.whl' \
  'd62671bb130879cef0ee4c9ebe47a14af6c66ec53e6d84dc15936e5ffdfac82f' \
  '4464663'
download_wheel \
  'huggingface_hub-0.36.0-py3-none-any.whl' \
  'https://files.pythonhosted.org/packages/cb/bd/1a875e0d592d447cbc02805fd3fe0f497714d6a2583f59d14fa9ebad96eb/huggingface_hub-0.36.0-py3-none-any.whl' \
  '7bcc9ad17d5b3f07b57c78e79d527102d08313caa278a641993acddcb894548d' \
  '566094'
download_wheel \
  'idna-3.11-py3-none-any.whl' \
  'https://files.pythonhosted.org/packages/0e/61/66938bbb5fc52dbdf84594873d5b51fb1f7c7794e9c0f5bd885f30bc507b/idna-3.11-py3-none-any.whl' \
  '771a87f49d9defaf64091e6e6fe9c18d4833f140bd19464795bc32d966ca37ea' \
  '71008'
download_wheel \
  'numpy-1.26.4-cp312-cp312-manylinux_2_17_x86_64.manylinux2014_x86_64.whl' \
  'https://files.pythonhosted.org/packages/0f/50/de23fde84e45f5c4fda2488c759b69990fd4512387a8632860f3ac9cd225/numpy-1.26.4-cp312-cp312-manylinux_2_17_x86_64.manylinux2014_x86_64.whl' \
  '675d61ffbfa78604709862923189bad94014bef562cc35cf61d3a07bba02a7ed' \
  '17950613'
download_wheel \
  'packaging-26.3-py3-none-any.whl' \
  'https://files.pythonhosted.org/packages/63/34/ba1c580383c9eada3711951fef0795c80b829a078d72188184bcab9dd527/packaging-26.3-py3-none-any.whl' \
  'd7193f7c8e4e93f444fde0262bf90af30e16fa0ad0ad44cb553c87339b23cd1c' \
  '129956'
download_wheel \
  'pillow-12.3.0-cp312-cp312-manylinux_2_27_x86_64.manylinux_2_28_x86_64.whl' \
  'https://files.pythonhosted.org/packages/84/21/a35af28dcc61f37ed850a2d64c65c701321dfbf25085e469d5559360cbbf/pillow-12.3.0-cp312-cp312-manylinux_2_27_x86_64.manylinux_2_28_x86_64.whl' \
  '78cb2c6865a35ab8ff8b75fd122f6033b92a62c82801110e48ddd6c936a45d91' \
  '6940830'
download_wheel \
  'portalocker-4.1.0-py3-none-any.whl' \
  'https://files.pythonhosted.org/packages/61/91/288c883303be067c1648f1e63ea38e5f8eb5ab7123fd3a9a7366148e58b7/portalocker-4.1.0-py3-none-any.whl' \
  'd985a430d265adf31adf12bc0bf3501aea59efc495e9104c057e5dfb7394c226' \
  '65914'
download_wheel \
  'pyyaml-6.0.3-cp312-cp312-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl' \
  'https://files.pythonhosted.org/packages/8b/9d/b3589d3877982d4f2329302ef98a8026e7f4443c765c46cfecc8858c6b4b/pyyaml-6.0.3-cp312-cp312-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl' \
  'ba1cc08a7ccde2d2ec775841541641e4548226580ab850948cbfda66a1befcdc' \
  '807870'
download_wheel \
  'regex-2026.7.19-cp312-cp312-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl' \
  'https://files.pythonhosted.org/packages/2a/8e/096d00c7c480ef2ff4265349b14e2261d4ab787ba1f74e2e80d1c58079c3/regex-2026.7.19-cp312-cp312-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl' \
  '9dce8ec9695f531a1b8a6f314fd4b393adcccf2ea861db480cdf97a301d01a68' \
  '801798'
download_wheel \
  'requests-2.34.2-py3-none-any.whl' \
  'https://files.pythonhosted.org/packages/a0/f4/c67b0b3f1b9245e8d266f0f112c500d50e5b4e83cb6f3b71b6528104182a/requests-2.34.2-py3-none-any.whl' \
  '2a0d60c172f83ac6ab31e4554906c0f3b3588d37b5cb939b1c061f4907e278e0' \
  '73075'
download_wheel \
  'safetensors-0.8.0-cp310-abi3-manylinux_2_17_x86_64.manylinux2014_x86_64.whl' \
  'https://files.pythonhosted.org/packages/28/50/f203ff3a3ddfe19308efc83c5a3a29ed02bf786732ec35e68bf9162f3365/safetensors-0.8.0-cp310-abi3-manylinux_2_17_x86_64.manylinux2014_x86_64.whl' \
  'fd6f3f93c9a0a7cc2788ee63fb763353d4bd2e89b0751bc78fcf7dda00bea774' \
  '516040'
download_wheel \
  'timm-1.0.28-py3-none-any.whl' \
  'https://files.pythonhosted.org/packages/c1/76/de1bfac17d183c49c6d0887903d3064ced51cf1d9ba7a8d611c1a8808c4f/timm-1.0.28-py3-none-any.whl' \
  'e577b88da96b3a722ea5e2f042455ce6f715d398304d8e63b17d126ed7d89968' \
  '2597944'
download_wheel \
  'torchcodec-0.10.0-cp312-cp312-manylinux_2_28_x86_64.whl' \
  'https://files.pythonhosted.org/packages/29/34/ccc711b6dc581e43b8d8d227e4173a8826994ee7b68d6b3d82291f307325/torchcodec-0.10.0-cp312-cp312-manylinux_2_28_x86_64.whl' \
  '6e43184d83ccced965b31cad5bb6200c779646fee2ec153a6d784b4def40c91b' \
  '2083121'
download_wheel \
  'tqdm-4.70.0-py3-none-any.whl' \
  'https://files.pythonhosted.org/packages/f9/1c/01bfd571a64e7f270e6bab5e33777debe0edc56759233ce84f27dec92d14/tqdm-4.70.0-py3-none-any.whl' \
  '7f585706bfddbdebf89daac705b2dfcc16890130727d3197ca62c732b4310953' \
  '80184'
download_wheel \
  'typing_extensions-4.16.0-py3-none-any.whl' \
  'https://files.pythonhosted.org/packages/49/d3/b8441a820a491ddfc024b0b0cf0393375b75ea13866d9c66727e54c2fc80/typing_extensions-4.16.0-py3-none-any.whl' \
  '481caa481374e813c1b176ada14e97f1f67a4539ce9cfeb3f350d78d6370c2e8' \
  '45571'
download_wheel \
  'urllib3-2.6.3-py3-none-any.whl' \
  'https://files.pythonhosted.org/packages/39/08/aaaad47bc4e9dc8c725e68f9d04865dbcb2052843ff09c97b08904852d84/urllib3-2.6.3-py3-none-any.whl' \
  'bf272323e553dfb2e87d9bfd225ca7b0f467b919d7bbd355436d3fd37cb0acd4' \
  '131584'
download_wheel \
  'wcwidth-0.8.2-py3-none-any.whl' \
  'https://files.pythonhosted.org/packages/96/42/3e5985a0a7e57de470b320c6d6a1a67c844f6737a587f3d44dd13d1819e7/wcwidth-0.8.2-py3-none-any.whl' \
  'd63947694a0539a1d51e01eda7caf800c291020e6cdd7e28ad7b14dd33ad4f85' \
  '323166'

download_exact \
  'https://files.pythonhosted.org/packages/72/73/b3d451dfc523756cf177d3ebb0af76dc7751b341c60e2a21871be400ae29/iopath-0.1.10.tar.gz' \
  "${WORK}/iopath-0.1.10.tar.gz" \
  '3311c16a4d9137223e20f141655759933e1eda24f8bff166af834af3c645ef01' \
  '42226'
python -m pip wheel --disable-pip-version-check --no-cache-dir --no-deps \
  --no-build-isolation --wheel-dir "${WHEELHOUSE}" \
  "${WORK}/iopath-0.1.10.tar.gz"

download_exact \
  'https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2404/x86_64/cuda-compat-12-8_570.211.01-0ubuntu1_amd64.deb' \
  "${PRIVATE_ROOT}/dependency-closure/cuda-forward-compat/cuda-compat-12-8_570.211.01-0ubuntu1_amd64.deb" \
  "${CUDA_COMPAT_SHA256}" "${CUDA_COMPAT_BYTES}"

python - "${WHEELHOUSE}" \
  "${PRIVATE_ROOT}/dependency-closure/requirements.lock.txt" \
  "${PRIVATE_ROOT}/dependency-closure/dependency-closure-receipt.json" <<'PY'
import email.parser
import hashlib
import json
from pathlib import Path
import re
import sys
from zipfile import ZipFile

wheelhouse, lock_path, receipt_path = map(Path, sys.argv[1:])
expected = {
  "certifi": "2026.7.22", "charset-normalizer": "3.4.9",
  "filelock": "3.32.2", "fsspec": "2026.7.0", "ftfy": "6.1.1",
  "hf-xet": "1.6.0", "huggingface-hub": "0.36.0", "idna": "3.11",
  "iopath": "0.1.10", "numpy": "1.26.4", "packaging": "26.3",
  "pillow": "12.3.0", "portalocker": "4.1.0", "pyyaml": "6.0.3",
  "regex": "2026.7.19", "requests": "2.34.2", "safetensors": "0.8.0",
  "timm": "1.0.28", "torchcodec": "0.10.0", "tqdm": "4.70.0",
  "typing-extensions": "4.16.0", "urllib3": "2.6.3", "wcwidth": "0.8.2",
}

def normalize(value: str) -> str:
    return re.sub(r"[-_.]+", "-", value).lower()

records = []
for wheel in sorted(wheelhouse.glob("*.whl"), key=lambda p: p.name):
    body = wheel.read_bytes()
    with ZipFile(wheel) as archive:
        metadata_names = [name for name in archive.namelist()
                          if name.endswith(".dist-info/METADATA")]
        if len(metadata_names) != 1:
            raise SystemExit("wheel metadata shape changed")
        metadata = email.parser.BytesParser().parsebytes(
            archive.read(metadata_names[0])
        )
    name = normalize(str(metadata["Name"]))
    version = str(metadata["Version"])
    records.append({
        "name": name,
        "version": version,
        "fileName": wheel.name,
        "byteLength": len(body),
        "sha256": hashlib.sha256(body).hexdigest(),
    })
observed = {record["name"]: record["version"] for record in records}
if observed != expected or len(records) != len(expected):
    raise SystemExit(f"wheel set changed: {observed}")
lock_lines = [
    f'{record["name"]}=={record["version"]} --hash=sha256:{record["sha256"]}'
    for record in sorted(records, key=lambda item: item["name"])
]
lock_path.write_text("\n".join(lock_lines) + "\n", encoding="utf-8")
receipt = {
    "schemaVersion": "weeditpro-sam3_1-python-dependency-closure-receipt-v1",
    "pythonVersion": "3.12",
    "torchVersionProvidedByPinnedBase": "2.10.0+cu128",
    "torchvisionVersionProvidedByPinnedBase": "0.25.0",
    "cudaVersionProvidedByPinnedBase": "12.8",
    "offlineInstallRequired": True,
    "requireHashes": True,
    "dependencyResolutionAtRuntimeAllowed": False,
    "networkAtRuntimeAllowed": False,
    "wheels": sorted(records, key=lambda item: item["fileName"]),
    "containsCheckpoint": False,
    "containsCredentials": False,
    "containsCustomerMedia": False,
}
receipt_path.write_text(
    json.dumps(receipt, sort_keys=True, separators=(",", ":")) + "\n",
    encoding="utf-8",
)
PY

python - "${PRIVATE_ROOT}/dependency-closure/cuda-forward-compat/cuda-forward-compat-ingest-receipt.json" <<'PY'
import json
from pathlib import Path
import sys
receipt = {
  "schemaVersion": "weeditpro-cuda-forward-compat-ingest-receipt-v1",
  "packageName": "cuda-compat-12-8",
  "packageVersion": "570.211.01-0ubuntu1",
  "architecture": "amd64",
  "source": "official_nvidia_cuda_ubuntu_2404_repository",
  "sha256": "e980bf55b8d1f6390f07968df46644c971a52f4e4129067d33d1445fac716893",
  "byteLength": 37945232,
  "containsCredentials": False,
  "containsCustomerMedia": False,
  "containsModelWeights": False,
}
Path(sys.argv[1]).write_text(
  json.dumps(receipt, sort_keys=True, separators=(",", ":")) + "\n",
  encoding="utf-8",
)
PY

mkdir -p "${BUILD_SOURCE}/docker/prod/gpu-worker/sam3_1/patches"
cp "${ROOT}/source/Dockerfile.qualification.candidate" \
  "${BUILD_SOURCE}/docker/prod/gpu-worker/sam3_1/Dockerfile.qualification.candidate"
cp "${ROOT}/source/qualification_runner.py" \
  "${BUILD_SOURCE}/docker/prod/gpu-worker/sam3_1/qualification_runner.py"
cp "${ROOT}/source/qualification_entrypoint.sh" \
  "${BUILD_SOURCE}/docker/prod/gpu-worker/sam3_1/qualification_entrypoint.sh"
cp "${ROOT}/source/source-provenance.lock" \
  "${BUILD_SOURCE}/docker/prod/gpu-worker/sam3_1/source-provenance.lock"
mv "${BUILD_SOURCE}/docker/prod/gpu-worker/sam3_1/patches.tmp" \
  "${BUILD_SOURCE}/docker/prod/gpu-worker/sam3_1/patches/0001-reeditpro-gpu-decode.patch"

test -z "$(find "${BUILD_SOURCE}" -type l -print -quit)"
find "${BUILD_SOURCE}" -type f -exec touch -d '@0' {} +

readonly UNCOMPRESSED="${WORK}/sam31-qualification-build-source.tar"
(
  cd "${BUILD_SOURCE}"
  find . -mindepth 1 \( -type d -o -type f \) -printf '%P\0' \
    | sort -z \
    | tar --create --format=ustar --mtime='@0' --owner=0 --group=0 \
        --numeric-owner --no-recursion --file="${UNCOMPRESSED}" \
        --null --files-from=-
)
gzip --no-name --best "${UNCOMPRESSED}"
readonly CAPSULE="${UNCOMPRESSED}.gz"
readonly CAPSULE_SHA256="$(sha256sum "${CAPSULE}" | cut -d' ' -f1)"

python - "${BUILD_SOURCE}" "${CAPSULE}" \
  "/output/${CAPSULE_SHA256}.capsule.json" \
  "${REPOSITORY_COMMIT}" "${REPOSITORY_TREE}" <<'PY'
import hashlib
import json
from pathlib import Path
import sys

root, capsule, output = map(Path, sys.argv[1:4])
repository_commit, repository_tree = sys.argv[4:]
entries = []
for path in sorted((item for item in root.rglob("*") if item.is_file()),
                   key=lambda item: item.relative_to(root).as_posix()):
    body = path.read_bytes()
    entries.append({
        "path": path.relative_to(root).as_posix(),
        "byteLength": len(body),
        "sha256": hashlib.sha256(body).hexdigest(),
    })
by_path = {item["path"]: item for item in entries}
wheels = [item for item in entries if item["path"].startswith(
    "sam31_private_build_input/dependency-closure/wheelhouse/")]
canonical = lambda value: json.dumps(
    value, sort_keys=True, separators=(",", ":"), ensure_ascii=False,
    allow_nan=False,
).encode("utf-8")
body = capsule.read_bytes()
record = {
    "schemaVersion": "weeditpro-sam3_1-qualification-capsule-builder-result-v1",
    "repositoryCommit": repository_commit,
    "repositoryTree": repository_tree,
    "capsuleSha256": hashlib.sha256(body).hexdigest(),
    "capsuleByteLength": len(body),
    "archiveEntries": entries,
    "archiveEntrySetSha256": hashlib.sha256(canonical(entries)).hexdigest(),
    "dependencyWheelCount": len(wheels),
    "dependencyWheelManifestSha256": hashlib.sha256(canonical(wheels)).hexdigest(),
    "dependencyLockSha256": by_path[
        "sam31_private_build_input/dependency-closure/requirements.lock.txt"
    ]["sha256"],
    "dependencyClosureReceiptSha256": by_path[
        "sam31_private_build_input/dependency-closure/dependency-closure-receipt.json"
    ]["sha256"],
    "patchApplicationReceiptSha256": by_path[
        "sam31_private_build_input/source/source-patch-application-receipt.json"
    ]["sha256"],
    "cudaForwardCompatIngestReceiptSha256": by_path[
        "sam31_private_build_input/dependency-closure/cuda-forward-compat/cuda-forward-compat-ingest-receipt.json"
    ]["sha256"],
    "checkpointIncluded": False,
    "qualificationReceiptIncluded": False,
    "containsCredentials": False,
    "containsCustomerMedia": False,
}
output.write_bytes(canonical(record) + b"\n")
PY

mv "${CAPSULE}" "/output/${CAPSULE_SHA256}.tar.gz"
test -s "/output/${CAPSULE_SHA256}.tar.gz"
test -s "/output/${CAPSULE_SHA256}.capsule.json"
