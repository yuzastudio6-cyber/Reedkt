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
readonly CUDA_NPP_PACKAGE_VERSION='12.3.3.100-1'
readonly CUDA_NPP_SHA256='54febea3b7a793e65318647c0548c0fea2416ef0a7dc70c672c6877f3bcba992'
readonly CUDA_NPP_BYTES='131485608'
readonly CUDA_NPPC_SHA256='69c1468de02b2951a3c9755a76b8246b83fbf4d8f137fd1e843767a76c344ae7'
readonly CUDA_NPPC_BYTES='1656080'
readonly CUDA_NPPICC_SHA256='bc1f7c1797fda52d0b333f91d65af2add1deeaa0e4cf5b5ae8a58e1d54117fe2'
readonly CUDA_NPPICC_BYTES='9373288'
readonly CUDA_NPP_LICENSE_SHA256='e2c71babfd18a8e69542dd7e9ca018f9caa438094001a58e6bc4d8c999bf0d07'
readonly CUDA_NPP_LICENSE_BYTES='63021'
readonly EINOPS_SHA256='54058201ac7087911181bfec4af6091bb59380360f069276601256a76af08193'
readonly EINOPS_BYTES='65638'
readonly EINOPS_INGEST_RECEIPT_SHA256='d882124bbea8f586e16df53c7062ffce3d9e1499c350ae1ccec0b25fab870608'
readonly PYCOCOTOOLS_SHA256='a82d1c9ed83f75da0b3f244f2a3cf559351a283307bd9b79a4ee2b93ab3231dd'
readonly PYCOCOTOOLS_BYTES='411685'
readonly PYCOCOTOOLS_INGEST_RECEIPT_SHA256='a47f679998c2a8d93d1f8e579a94a00bf4c9ca6ac9f7f40a9486a645177fdea3'
readonly FFMPEG_VERSION='8.0.3'
readonly FFMPEG_SHA256='5c868087e6a0d4243b97776c16f3bfe1511cc53f15c26c822b393a3289608121'
readonly FFMPEG_BYTES='17211188'
readonly PKGCONF_VERSION='3.0.4'
readonly PKGCONF_SHA256='67dd778366d1a094f26a9bf5ad0cce1b2e25588420c49a4c9fea6452a6eef829'
readonly PKGCONF_BYTES='611767'
readonly NV_CODEC_HEADERS_VERSION='n12.2.72.0'
readonly NV_CODEC_HEADERS_COMMIT='157becbf51c8b813425572b75c06c370bd43d8fd'
readonly NV_CODEC_HEADERS_SHA256='dbeaec433d93b850714760282f1d0992b1254fc3b5a6cb7d76fc1340a1e47563'
readonly NV_CODEC_HEADERS_BYTES='80935'
readonly SOURCE_BYTES='73605120'
readonly CUDA_COMPAT_BYTES='37945232'
readonly REPOSITORY_COMMIT="${WEEDITPRO_REPOSITORY_COMMIT:?missing repository commit}"
readonly REPOSITORY_TREE="${WEEDITPRO_REPOSITORY_TREE:?missing repository tree}"
readonly WHEELHOUSE="${PRIVATE_ROOT}/dependency-closure/wheelhouse"
readonly REVIEWED_DEPENDENCY_CLOSURE="${ROOT}/private-dependency-closure/dependency-closure"

stage_exact() {
  local source_url="$1" destination="$2" expected_sha="$3" expected_bytes="$4"
  case "${source_url}" in
    https://codeload.github.com/*|https://developer.download.nvidia.com/*|\
    https://download.pytorch.org/*|https://distfiles.ariadne.space/*|\
    https://ffmpeg.org/*|https://files.pythonhosted.org/*|https://github.com/*) ;;
    *) printf 'ERROR: staged dependency origin is not allowlisted.\n' >&2; return 1 ;;
  esac
  test -f "${destination}"
  test "$(stat --format='%s' "${destination}")" = "${expected_bytes}"
  printf '%s  %s\n' "${expected_sha}" "${destination}" \
    | sha256sum --check --strict
}

stage_wheel() {
  local file_name="$1" url="$2" expected_sha="$3" expected_bytes="$4"
  stage_exact "${url}" "${WHEELHOUSE}/${file_name}" \
    "${expected_sha}" "${expected_bytes}"
}

rm -rf "${WORK}" /output
mkdir -p \
  "${PRIVATE_ROOT}/source" \
  "${WHEELHOUSE}" \
  "${PRIVATE_ROOT}/dependency-closure/cuda-forward-compat" \
  "${PRIVATE_ROOT}/dependency-closure/cuda-npp" \
  "${PRIVATE_ROOT}/dependency-closure/ffmpeg" \
  "${PRIVATE_ROOT}/dependency-closure/python-ingest/einops" \
  "${PRIVATE_ROOT}/dependency-closure/python-ingest/pycocotools" \
  "${BUILD_SOURCE}/docker/prod/gpu-worker/sam3_1" \
  /output
test -d "${REVIEWED_DEPENDENCY_CLOSURE}"
cp -a "${REVIEWED_DEPENDENCY_CLOSURE}/." \
  "${PRIVATE_ROOT}/dependency-closure/"

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
# exact immutable official PyPI or PyTorch wheel URL, byte length, and SHA-256.
# There is no online dependency resolution in the image or qualification runtime.
stage_wheel \
  'certifi-2026.7.22-py3-none-any.whl' \
  'https://files.pythonhosted.org/packages/0b/a7/71ac2cff56fec219ed242bb11b8efb69fcc4bec75db06fb7bfe35de520e6/certifi-2026.7.22-py3-none-any.whl' \
  '62f22742b58a1a33014a2b6b706588a8d7e2a88ae7bd1a6ebe8c992928483775' \
  '136983'
stage_wheel \
  'charset_normalizer-3.4.9-cp312-cp312-manylinux_2_28_x86_64.whl' \
  'https://files.pythonhosted.org/packages/01/c4/4fa4c8b3097a11f3c5f09a35b72ed6855fb1d332469504962ab7bafcc702/charset_normalizer-3.4.9-cp312-cp312-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl' \
  '5e226f6218febc71f6c1fc2fafb91c226f75bdc1d8fb12d66823716e891608fd' \
  '224256'
stage_wheel \
  'filelock-3.32.2-py3-none-any.whl' \
  'https://files.pythonhosted.org/packages/c1/e8/72f8cef9fdfeffe06213fe8508039396ee48daa0e3259457ed766173bfd6/filelock-3.32.2-py3-none-any.whl' \
  '87dd94cf281e586d135fa51132b8e3d9a598b316e90377a288663c9321036c82' \
  '98830'
stage_wheel \
  'fsspec-2026.7.0-py3-none-any.whl' \
  'https://files.pythonhosted.org/packages/fd/3c/6a2bf344106328fd04963664a60b9bb6496fc25df8e962fcdc1367285fb9/fsspec-2026.7.0-py3-none-any.whl' \
  'b57ddbafedfaef7018c1ecab32aa200a9d7ca26b77965f64e48b70061249d279' \
  '206583'
stage_wheel \
  'ftfy-6.1.1-py3-none-any.whl' \
  'https://files.pythonhosted.org/packages/e1/1e/bf736f9576a8979752b826b75cbd83663ff86634ea3055a766e2d8ad3ee5/ftfy-6.1.1-py3-none-any.whl' \
  '0ffd33fce16b54cccaec78d6ec73d95ad370e5df5a25255c8966a6147bd667ca' \
  '53098'
stage_wheel \
  'einops-0.8.2-py3-none-any.whl' \
  'https://files.pythonhosted.org/packages/2a/09/f8d8f8f31e4483c10a906437b4ce31bdf3d6d417b73fe33f1a8b59e34228/einops-0.8.2-py3-none-any.whl' \
  "${EINOPS_SHA256}" \
  "${EINOPS_BYTES}"
stage_wheel \
  'pycocotools-2.0.11-cp312-abi3-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl' \
  'https://files.pythonhosted.org/packages/23/59/dc81895beff4e1207a829d40d442ea87cefaac9f6499151965f05c479619/pycocotools-2.0.11-cp312-abi3-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl' \
  "${PYCOCOTOOLS_SHA256}" \
  "${PYCOCOTOOLS_BYTES}"
stage_wheel \
  'hf_xet-1.6.0-cp38-abi3-manylinux2014_x86_64.manylinux_2_17_x86_64.whl' \
  'https://files.pythonhosted.org/packages/67/4e/a28359bf1c1ecf11eba22123168c138698f7cb576ac678f5a2e16cd5da08/hf_xet-1.6.0-cp38-abi3-manylinux2014_x86_64.manylinux_2_17_x86_64.whl' \
  'd62671bb130879cef0ee4c9ebe47a14af6c66ec53e6d84dc15936e5ffdfac82f' \
  '4464663'
stage_wheel \
  'huggingface_hub-0.36.0-py3-none-any.whl' \
  'https://files.pythonhosted.org/packages/cb/bd/1a875e0d592d447cbc02805fd3fe0f497714d6a2583f59d14fa9ebad96eb/huggingface_hub-0.36.0-py3-none-any.whl' \
  '7bcc9ad17d5b3f07b57c78e79d527102d08313caa278a641993acddcb894548d' \
  '566094'
stage_wheel \
  'idna-3.11-py3-none-any.whl' \
  'https://files.pythonhosted.org/packages/0e/61/66938bbb5fc52dbdf84594873d5b51fb1f7c7794e9c0f5bd885f30bc507b/idna-3.11-py3-none-any.whl' \
  '771a87f49d9defaf64091e6e6fe9c18d4833f140bd19464795bc32d966ca37ea' \
  '71008'
stage_wheel \
  'numpy-1.26.4-cp312-cp312-manylinux_2_17_x86_64.manylinux2014_x86_64.whl' \
  'https://files.pythonhosted.org/packages/0f/50/de23fde84e45f5c4fda2488c759b69990fd4512387a8632860f3ac9cd225/numpy-1.26.4-cp312-cp312-manylinux_2_17_x86_64.manylinux2014_x86_64.whl' \
  '675d61ffbfa78604709862923189bad94014bef562cc35cf61d3a07bba02a7ed' \
  '17950613'
stage_wheel \
  'packaging-26.3-py3-none-any.whl' \
  'https://files.pythonhosted.org/packages/63/34/ba1c580383c9eada3711951fef0795c80b829a078d72188184bcab9dd527/packaging-26.3-py3-none-any.whl' \
  'd7193f7c8e4e93f444fde0262bf90af30e16fa0ad0ad44cb553c87339b23cd1c' \
  '129956'
stage_wheel \
  'pillow-12.3.0-cp312-cp312-manylinux_2_27_x86_64.manylinux_2_28_x86_64.whl' \
  'https://files.pythonhosted.org/packages/84/21/a35af28dcc61f37ed850a2d64c65c701321dfbf25085e469d5559360cbbf/pillow-12.3.0-cp312-cp312-manylinux_2_27_x86_64.manylinux_2_28_x86_64.whl' \
  '78cb2c6865a35ab8ff8b75fd122f6033b92a62c82801110e48ddd6c936a45d91' \
  '6940830'
stage_wheel \
  'portalocker-4.1.0-py3-none-any.whl' \
  'https://files.pythonhosted.org/packages/61/91/288c883303be067c1648f1e63ea38e5f8eb5ab7123fd3a9a7366148e58b7/portalocker-4.1.0-py3-none-any.whl' \
  'd985a430d265adf31adf12bc0bf3501aea59efc495e9104c057e5dfb7394c226' \
  '65914'
stage_wheel \
  'pyyaml-6.0.3-cp312-cp312-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl' \
  'https://files.pythonhosted.org/packages/8b/9d/b3589d3877982d4f2329302ef98a8026e7f4443c765c46cfecc8858c6b4b/pyyaml-6.0.3-cp312-cp312-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl' \
  'ba1cc08a7ccde2d2ec775841541641e4548226580ab850948cbfda66a1befcdc' \
  '807870'
stage_wheel \
  'regex-2026.7.19-cp312-cp312-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl' \
  'https://files.pythonhosted.org/packages/2a/8e/096d00c7c480ef2ff4265349b14e2261d4ab787ba1f74e2e80d1c58079c3/regex-2026.7.19-cp312-cp312-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl' \
  '9dce8ec9695f531a1b8a6f314fd4b393adcccf2ea861db480cdf97a301d01a68' \
  '801798'
stage_wheel \
  'requests-2.34.2-py3-none-any.whl' \
  'https://files.pythonhosted.org/packages/a0/f4/c67b0b3f1b9245e8d266f0f112c500d50e5b4e83cb6f3b71b6528104182a/requests-2.34.2-py3-none-any.whl' \
  '2a0d60c172f83ac6ab31e4554906c0f3b3588d37b5cb939b1c061f4907e278e0' \
  '73075'
stage_wheel \
  'safetensors-0.8.0-cp310-abi3-manylinux_2_17_x86_64.manylinux2014_x86_64.whl' \
  'https://files.pythonhosted.org/packages/28/50/f203ff3a3ddfe19308efc83c5a3a29ed02bf786732ec35e68bf9162f3365/safetensors-0.8.0-cp310-abi3-manylinux_2_17_x86_64.manylinux2014_x86_64.whl' \
  'fd6f3f93c9a0a7cc2788ee63fb763353d4bd2e89b0751bc78fcf7dda00bea774' \
  '516040'
stage_wheel \
  'timm-1.0.28-py3-none-any.whl' \
  'https://files.pythonhosted.org/packages/c1/76/de1bfac17d183c49c6d0887903d3064ced51cf1d9ba7a8d611c1a8808c4f/timm-1.0.28-py3-none-any.whl' \
  'e577b88da96b3a722ea5e2f042455ce6f715d398304d8e63b17d126ed7d89968' \
  '2597944'
stage_wheel \
  'torchcodec-0.10.0+cu128-cp312-cp312-manylinux_2_28_x86_64.whl' \
  'https://download.pytorch.org/whl/cu128/torchcodec-0.10.0%2Bcu128-cp312-cp312-manylinux_2_28_x86_64.whl' \
  '5ecb4aeb61b4f14f30ceed11ce892308f38232d82eee64605ae19583c51a8e72' \
  '2403046'
stage_wheel \
  'tqdm-4.70.0-py3-none-any.whl' \
  'https://files.pythonhosted.org/packages/f9/1c/01bfd571a64e7f270e6bab5e33777debe0edc56759233ce84f27dec92d14/tqdm-4.70.0-py3-none-any.whl' \
  '7f585706bfddbdebf89daac705b2dfcc16890130727d3197ca62c732b4310953' \
  '80184'
stage_wheel \
  'typing_extensions-4.16.0-py3-none-any.whl' \
  'https://files.pythonhosted.org/packages/49/d3/b8441a820a491ddfc024b0b0cf0393375b75ea13866d9c66727e54c2fc80/typing_extensions-4.16.0-py3-none-any.whl' \
  '481caa481374e813c1b176ada14e97f1f67a4539ce9cfeb3f350d78d6370c2e8' \
  '45571'
stage_wheel \
  'urllib3-2.6.3-py3-none-any.whl' \
  'https://files.pythonhosted.org/packages/39/08/aaaad47bc4e9dc8c725e68f9d04865dbcb2052843ff09c97b08904852d84/urllib3-2.6.3-py3-none-any.whl' \
  'bf272323e553dfb2e87d9bfd225ca7b0f467b919d7bbd355436d3fd37cb0acd4' \
  '131584'
stage_wheel \
  'wcwidth-0.8.2-py3-none-any.whl' \
  'https://files.pythonhosted.org/packages/96/42/3e5985a0a7e57de470b320c6d6a1a67c844f6737a587f3d44dd13d1819e7/wcwidth-0.8.2-py3-none-any.whl' \
  'd63947694a0539a1d51e01eda7caf800c291020e6cdd7e28ad7b14dd33ad4f85' \
  '323166'

readonly IOPATH_WHEEL="${WHEELHOUSE}/iopath-0.1.10-py3-none-any.whl"
test -f "${IOPATH_WHEEL}"
test "$(stat --format='%s' "${IOPATH_WHEEL}")" = 31596
printf '%s  %s\n' \
  da148222e6160aa193fb0547e4d186669bd594ec8ba03831f8294977cc2ee453 \
  "${IOPATH_WHEEL}" | sha256sum --check --strict

readonly EINOPS_INGEST_RECEIPT="${PRIVATE_ROOT}/dependency-closure/python-ingest/einops/einops-ingest-receipt.json"
test -f "${EINOPS_INGEST_RECEIPT}"
test "$(stat --format='%s' "${EINOPS_INGEST_RECEIPT}")" = 1778
printf '%s  %s\n' "${EINOPS_INGEST_RECEIPT_SHA256}" \
  "${EINOPS_INGEST_RECEIPT}" | sha256sum --check --strict

readonly PYCOCOTOOLS_INGEST_RECEIPT="${PRIVATE_ROOT}/dependency-closure/python-ingest/pycocotools/pycocotools-ingest-receipt.json"
test -f "${PYCOCOTOOLS_INGEST_RECEIPT}"
test "$(stat --format='%s' "${PYCOCOTOOLS_INGEST_RECEIPT}")" = 1782
printf '%s  %s\n' "${PYCOCOTOOLS_INGEST_RECEIPT_SHA256}" \
  "${PYCOCOTOOLS_INGEST_RECEIPT}" | sha256sum --check --strict

stage_exact \
  "https://ffmpeg.org/releases/ffmpeg-${FFMPEG_VERSION}.tar.gz" \
  "${PRIVATE_ROOT}/dependency-closure/ffmpeg/ffmpeg-${FFMPEG_VERSION}.tar.gz" \
  "${FFMPEG_SHA256}" "${FFMPEG_BYTES}"

stage_exact \
  "https://distfiles.ariadne.space/pkgconf/pkgconf-${PKGCONF_VERSION}.tar.gz" \
  "${PRIVATE_ROOT}/dependency-closure/ffmpeg/pkgconf-${PKGCONF_VERSION}.tar.gz" \
  "${PKGCONF_SHA256}" "${PKGCONF_BYTES}"

stage_exact \
  "https://github.com/FFmpeg/nv-codec-headers/archive/refs/tags/${NV_CODEC_HEADERS_VERSION}.tar.gz" \
  "${PRIVATE_ROOT}/dependency-closure/ffmpeg/nv-codec-headers-${NV_CODEC_HEADERS_VERSION}.tar.gz" \
  "${NV_CODEC_HEADERS_SHA256}" "${NV_CODEC_HEADERS_BYTES}"

python - \
  "${PRIVATE_ROOT}/dependency-closure/ffmpeg/ffmpeg-closure-receipt.json" <<PY
import json
from pathlib import Path
receipt = {
  "schemaVersion": "weeditpro-sam3_1-ffmpeg-nvdec-source-closure-receipt-v1",
  "ffmpegVersion": "${FFMPEG_VERSION}",
  "ffmpegReleaseArchiveSha256": "${FFMPEG_SHA256}",
  "ffmpegReleaseArchiveByteLength": ${FFMPEG_BYTES},
  "ffmpegLicense": "LGPL-2.1-or-later",
  "pkgconfVersion": "${PKGCONF_VERSION}",
  "pkgconfSourceArchiveSha256": "${PKGCONF_SHA256}",
  "pkgconfSourceArchiveByteLength": ${PKGCONF_BYTES},
  "pkgconfLicense": "ISC",
  "pkgconfBuiltFromSource": True,
  "nvCodecHeadersVersion": "${NV_CODEC_HEADERS_VERSION}",
  "nvCodecHeadersCommit": "${NV_CODEC_HEADERS_COMMIT}",
  "nvCodecHeadersArchiveSha256": "${NV_CODEC_HEADERS_SHA256}",
  "nvCodecHeadersArchiveByteLength": ${NV_CODEC_HEADERS_BYTES},
  "nvCodecHeadersLicense": "MIT",
  "cudaCompilerBaseImageDigest": "sha256:4b9ed5fa8361736996499f64ecebf25d4ec37ff56e4d11323ccde10aa36e0c43",
  "sharedLibrariesRequired": True,
  "ffnvcodecRequired": True,
  "nvdecRequired": True,
  "cuvidRequired": True,
  "h264CuvidDecoderRequired": True,
  "hevcCuvidDecoderRequired": True,
  "gplComponentsEnabled": False,
  "nonfreeComponentsEnabled": False,
  "libnppLinkedIntoFfmpeg": False,
  "networkAtBuildAllowed": False,
  "networkAtRuntimeAllowed": False,
  "cpuVideoDecodeFallbackAllowed": False,
  "containsCheckpoint": False,
  "containsCredentials": False,
  "containsCustomerMedia": False,
}
Path("${PRIVATE_ROOT}/dependency-closure/ffmpeg/ffmpeg-closure-receipt.json").write_text(
  json.dumps(receipt, sort_keys=True, separators=(",", ":")) + "\n",
  encoding="utf-8",
)
PY

stage_exact \
  'https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2404/x86_64/cuda-compat-12-8_570.211.01-0ubuntu1_amd64.deb' \
  "${PRIVATE_ROOT}/dependency-closure/cuda-forward-compat/cuda-compat-12-8_570.211.01-0ubuntu1_amd64.deb" \
  "${CUDA_COMPAT_SHA256}" "${CUDA_COMPAT_BYTES}"

stage_exact \
  "https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2404/x86_64/libnpp-12-8_${CUDA_NPP_PACKAGE_VERSION}_amd64.deb" \
  "${PRIVATE_ROOT}/dependency-closure/cuda-npp/libnpp-12-8_${CUDA_NPP_PACKAGE_VERSION}_amd64.deb" \
  "${CUDA_NPP_SHA256}" "${CUDA_NPP_BYTES}"

python - \
  "${PRIVATE_ROOT}/dependency-closure/cuda-npp/cuda-npp-runtime-receipt.json" <<PY
import json
from pathlib import Path
import sys
receipt = {
  "schemaVersion": "weeditpro-sam3_1-torchcodec-cuda-npp-runtime-receipt-v1",
  "packageName": "libnpp-12-8",
  "packageVersion": "${CUDA_NPP_PACKAGE_VERSION}",
  "architecture": "amd64",
  "source": "official_nvidia_cuda_ubuntu_2404_repository",
  "packageSha256": "${CUDA_NPP_SHA256}",
  "packageByteLength": ${CUDA_NPP_BYTES},
  "license": "NVIDIA CUDA Toolkit EULA",
  "licenseFileSha256": "${CUDA_NPP_LICENSE_SHA256}",
  "licenseFileByteLength": ${CUDA_NPP_LICENSE_BYTES},
  "torchcodecCudaWheelVersion": "0.10.0+cu128",
  "exactTorchcodecElfNeededClosure": True,
  "requiredLibraries": [
    {
      "fileName": "libnppc.so.12.3.3.100",
      "soname": "libnppc.so.12",
      "sha256": "${CUDA_NPPC_SHA256}",
      "byteLength": ${CUDA_NPPC_BYTES},
    },
    {
      "fileName": "libnppicc.so.12.3.3.100",
      "soname": "libnppicc.so.12",
      "sha256": "${CUDA_NPPICC_SHA256}",
      "byteLength": ${CUDA_NPPICC_BYTES},
    },
  ],
  "completeCudaToolkitCopied": False,
  "cpuVideoDecodeFallbackAllowed": False,
  "networkAtBuildAllowed": False,
  "networkAtRuntimeAllowed": False,
  "containsCheckpoint": False,
  "containsCredentials": False,
  "containsCustomerMedia": False,
}
Path(sys.argv[1]).write_text(
  json.dumps(receipt, sort_keys=True, separators=(",", ":")) + "\n",
  encoding="utf-8",
)
PY

python - "${WHEELHOUSE}" \
  "${PRIVATE_ROOT}/dependency-closure/requirements.lock.txt" \
  "${PRIVATE_ROOT}/dependency-closure/dependency-closure-receipt.json" \
  "${PRIVATE_ROOT}/dependency-closure/ffmpeg/ffmpeg-closure-receipt.json" \
  "${PRIVATE_ROOT}/dependency-closure/cuda-npp/cuda-npp-runtime-receipt.json" \
  "${PRIVATE_ROOT}/dependency-closure/python-ingest/einops/einops-ingest-receipt.json" \
  "${PRIVATE_ROOT}/dependency-closure/python-ingest/pycocotools/pycocotools-ingest-receipt.json" <<'PY'
import email.parser
import hashlib
import json
from pathlib import Path
import re
import sys
from zipfile import ZipFile

wheelhouse, lock_path, receipt_path, ffmpeg_receipt_path, npp_receipt_path, einops_ingest_receipt_path, pycocotools_ingest_receipt_path = map(
    Path, sys.argv[1:]
)
expected = {
  "certifi": "2026.7.22", "charset-normalizer": "3.4.9",
  "einops": "0.8.2", "filelock": "3.32.2", "fsspec": "2026.7.0", "ftfy": "6.1.1",
  "hf-xet": "1.6.0", "huggingface-hub": "0.36.0", "idna": "3.11",
  "iopath": "0.1.10", "numpy": "1.26.4", "packaging": "26.3",
  "pillow": "12.3.0", "portalocker": "4.1.0", "pycocotools": "2.0.11",
  "pyyaml": "6.0.3",
  "regex": "2026.7.19", "requests": "2.34.2", "safetensors": "0.8.0",
  "timm": "1.0.28", "torchcodec": "0.10.0+cu128", "tqdm": "4.70.0",
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
einops_ingest = json.loads(einops_ingest_receipt_path.read_text(encoding="utf-8"))
einops_ingest_without_hash = dict(einops_ingest)
embedded_einops_receipt_hash = einops_ingest_without_hash.pop("receiptHash", None)
computed_einops_receipt_hash = hashlib.sha256(json.dumps(
    einops_ingest_without_hash,
    sort_keys=True,
    separators=(",", ":"),
    ensure_ascii=False,
    allow_nan=False,
).encode("utf-8")).hexdigest()
if (
    einops_ingest.get("schemaVersion")
    != "weeditpro-sam3_1-einops-private-ingest-receipt-v1"
    or einops_ingest.get("packageName") != "einops"
    or einops_ingest.get("packageVersion") != "0.8.2"
    or einops_ingest.get("officialWheelSha256")
    != "54058201ac7087911181bfec4af6091bb59380360f069276601256a76af08193"
    or einops_ingest.get("officialWheelByteLength") != 65638
    or einops_ingest.get("license") != "MIT"
    or einops_ingest.get("licenseFileSha256")
    != "30d984364296f51ffaecad4b01ee127e95250c5068918d4b66fc96206723e434"
    or einops_ingest.get("licenseFileByteLength") != 1073
    or einops_ingest.get("malwareScan", {}).get("scanPassed") is not True
    or einops_ingest.get("privateObject", {}).get("generation")
    != "1786106120404202"
    or einops_ingest.get("privateObject", {}).get("etag")
    != "COr52ebDjpYDEAE="
    or embedded_einops_receipt_hash != computed_einops_receipt_hash
    or einops_ingest.get("developerMachineInstallPerformed") is not False
    or einops_ingest.get("modelExecuted") is not False
):
    raise SystemExit("einops private ingest receipt changed")
pycocotools_ingest = json.loads(
    pycocotools_ingest_receipt_path.read_text(encoding="utf-8")
)
pycocotools_ingest_without_hash = dict(pycocotools_ingest)
embedded_pycocotools_receipt_hash = pycocotools_ingest_without_hash.pop(
    "receiptHash", None
)
computed_pycocotools_receipt_hash = hashlib.sha256(json.dumps(
    pycocotools_ingest_without_hash,
    sort_keys=True,
    separators=(",", ":"),
    ensure_ascii=False,
    allow_nan=False,
).encode("utf-8")).hexdigest()
if (
    pycocotools_ingest.get("schemaVersion")
    != "weeditpro-sam3_1-pycocotools-private-ingest-receipt-v1"
    or pycocotools_ingest.get("packageName") != "pycocotools"
    or pycocotools_ingest.get("packageVersion") != "2.0.11"
    or pycocotools_ingest.get("officialWheelSha256")
    != "a82d1c9ed83f75da0b3f244f2a3cf559351a283307bd9b79a4ee2b93ab3231dd"
    or pycocotools_ingest.get("officialWheelByteLength") != 411685
    or pycocotools_ingest.get("license") != "FreeBSD"
    or pycocotools_ingest.get("nativeExtensionImportVerified") is not True
    or pycocotools_ingest.get("malwareScan", {}).get("scanPassed") is not True
    or pycocotools_ingest.get("privateObject", {}).get("generation")
    != "1786112742762071"
    or pycocotools_ingest.get("privateObject", {}).get("etag")
    != "CNfMvrzcjpYDEAE="
    or embedded_pycocotools_receipt_hash
    != computed_pycocotools_receipt_hash
    or pycocotools_ingest.get("developerMachineInstallPerformed") is not False
    or pycocotools_ingest.get("modelExecuted") is not False
):
    raise SystemExit("pycocotools private ingest receipt changed")
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
    "torchcodecCudaWheelVersion": "0.10.0+cu128",
    "torchcodecCpuWheelAccepted": False,
    "einopsVersion": "0.8.2",
    "einopsOfficialWheelSha256": "54058201ac7087911181bfec4af6091bb59380360f069276601256a76af08193",
    "einopsPrivateIngestReceiptSha256": hashlib.sha256(
        einops_ingest_receipt_path.read_bytes()
    ).hexdigest(),
    "einopsPrivateObjectGeneration": "1786106120404202",
    "einopsPrivateObjectEtag": "COr52ebDjpYDEAE=",
    "einopsLicense": "MIT",
    "einopsLicenseFileSha256": "30d984364296f51ffaecad4b01ee127e95250c5068918d4b66fc96206723e434",
    "samCoreUnconditionallyImportsEinops": True,
    "pycocotoolsVersion": "2.0.11",
    "pycocotoolsOfficialWheelSha256": "a82d1c9ed83f75da0b3f244f2a3cf559351a283307bd9b79a4ee2b93ab3231dd",
    "pycocotoolsPrivateIngestReceiptSha256": hashlib.sha256(
        pycocotools_ingest_receipt_path.read_bytes()
    ).hexdigest(),
    "pycocotoolsPrivateObjectGeneration": "1786112742762071",
    "pycocotoolsPrivateObjectEtag": "CNfMvrzcjpYDEAE=",
    "pycocotoolsLicense": "FreeBSD",
    "pycocotoolsNativeExtensionImportVerified": True,
    "samCoreUnconditionallyImportsPycocotools": True,
    "cudaNppRuntimeReceiptSha256": hashlib.sha256(
        npp_receipt_path.read_bytes()
    ).hexdigest(),
    "cudaNppPackageName": "libnpp-12-8",
    "cudaNppPackageVersion": "12.3.3.100-1",
    "torchcodecExactNppRuntimeClosureRequired": True,
    "completeCudaToolkitCopied": False,
    "ffmpegClosureReceiptSha256": hashlib.sha256(
        ffmpeg_receipt_path.read_bytes()
    ).hexdigest(),
    "ffmpegSharedLibraryVersion": "8.0.3",
    "ffmpegNvdecRequired": True,
    "ffmpegCpuVideoDecodeFallbackAllowed": False,
    "pkgconfVersion": "3.0.4",
    "pkgconfBuiltOfflineFromPinnedSource": True,
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
find "${BUILD_SOURCE}" -type d -exec chmod 0555 {} +
find "${BUILD_SOURCE}" -type f -exec chmod 0444 {} +

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
