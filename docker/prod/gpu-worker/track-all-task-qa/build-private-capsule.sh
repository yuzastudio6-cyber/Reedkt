#!/usr/bin/env bash
set -Eeuo pipefail

trap 'status=$?; printf "ERROR: private capsule build failed at line %s: %s (exit %s)\n" "${LINENO}" "${BASH_COMMAND}" "${status}" >&2; exit "${status}"' ERR

readonly ROOT='/opt/weeditpro-capsule-builder'
readonly WORK='/tmp/weeditpro-track-all-l4-capsule'
readonly PRIVATE_ROOT="${WORK}/build-source/track_all_task_qa_private_build_input"
readonly OPENCV_COMMIT='49486f61fb25722cbcf586b7f4320921d46fb38e'
readonly OPENCV_CONTRIB_COMMIT='d943e1d61c8bc556a13783e1546ee7c1a9e0b1cf'
readonly OPENCV_VERSION='4.12.0'
readonly OPENCV_SOURCE_SHA256='8f00b42869ab2836be36090f6631ae4c38ba59171e22a69a8e0f92f8ef1771d4'
readonly OPENCV_CONTRIB_SOURCE_SHA256='79b55fa0d0edc6b2766f20cc97baf9dcee5f974870d5afeb1f8e3c623623b59b'
readonly BUILDER_IMAGE='pytorch/pytorch@sha256:b574d4ccf6d8856a5d87dcadc667aa4f95dc18d337ef3a28d02b7b01897d7081'
readonly RUNTIME_IMAGE='pytorch/pytorch@sha256:b85566342b86d13a67712e9315d40cdc2dad7f8d86df1aff3831f80835edbcca'
readonly CUDA_COMPAT_SHA256='e980bf55b8d1f6390f07968df46644c971a52f4e4129067d33d1445fac716893'
readonly CUDA_COMPAT_BYTES='37945232'

# OpenCV records its configure time inside both the human-readable build
# information and the compiled runtime. Pin the source epoch and the explicit
# OpenCV timestamp so identical reviewed sources produce identical bytes.
export SOURCE_DATE_EPOCH='0'
export TZ='UTC'
export LANG='C'
export LC_ALL='C'

download_exact() {
  local url="$1"
  local destination="$2"
  local expected_sha="$3"
  local expected_bytes="$4"
  python - "${url}" "${destination}" "${expected_sha}" \
    "${expected_bytes}" <<'PY'
import hashlib
import os
from pathlib import Path
import sys
from urllib.parse import urlparse
from urllib.request import HTTPRedirectHandler, Request, build_opener

url, destination_text, expected_sha256, expected_bytes_text = sys.argv[1:]
expected_bytes = int(expected_bytes_text)
allowed_hosts = {
    "codeload.github.com",
    "developer.download.nvidia.com",
    "files.pythonhosted.org",
    "github.com",
}


def assert_allowed_https(value: str) -> None:
    parsed = urlparse(value)
    if parsed.scheme != "https" or parsed.hostname not in allowed_hosts:
        raise SystemExit("private capsule download origin is not allowlisted")
    if parsed.username or parsed.password or parsed.port not in (None, 443):
        raise SystemExit("private capsule download URL authority is invalid")


class HttpsOnlyRedirectHandler(HTTPRedirectHandler):
    def redirect_request(self, request, file_pointer, code, message, headers,
                         new_url):
        assert_allowed_https(new_url)
        return super().redirect_request(
            request, file_pointer, code, message, headers, new_url
        )


assert_allowed_https(url)
destination = Path(destination_text)
temporary = destination.with_name(f"{destination.name}.partial")
temporary.unlink(missing_ok=True)
request = Request(
    url,
    headers={
        "Accept-Encoding": "identity",
        "User-Agent": "WeEditPro-private-capsule-builder-v1",
    },
    method="GET",
)
digest = hashlib.sha256()
observed_bytes = 0
try:
    with build_opener(HttpsOnlyRedirectHandler()).open(
        request, timeout=300
    ) as response, temporary.open("xb") as output:
        assert_allowed_https(response.geturl())
        if response.status != 200:
            raise SystemExit("private capsule download status is not 200")
        while True:
            chunk = response.read(1024 * 1024)
            if not chunk:
                break
            observed_bytes += len(chunk)
            if observed_bytes > expected_bytes:
                raise SystemExit("private capsule download exceeded byte bound")
            digest.update(chunk)
            output.write(chunk)
        output.flush()
        os.fsync(output.fileno())
    if observed_bytes != expected_bytes:
        raise SystemExit("private capsule download byte count changed")
    if digest.hexdigest() != expected_sha256:
        raise SystemExit("private capsule download digest changed")
    os.replace(temporary, destination)
finally:
    temporary.unlink(missing_ok=True)
PY
}

rm -rf "${WORK}" /output
mkdir -p \
  "${WORK}/downloads" \
  "${WORK}/opencv-build" \
  "${PRIVATE_ROOT}/python/wheelhouse" \
  "${PRIVATE_ROOT}/opencv/install" \
  "${PRIVATE_ROOT}/cuda-forward-compat" \
  "${WORK}/build-source/docker/prod/gpu-worker/track-all-task-qa" \
  /output

python - <<'PY'
import sys
import torch

assert sys.version_info[:2] == (3, 12)
assert torch.__version__ == "2.10.0+cu128"
assert torch.version.cuda == "12.8"
PY

download_exact \
  "https://github.com/opencv/opencv/archive/${OPENCV_COMMIT}.tar.gz" \
  "${WORK}/downloads/opencv.tar.gz" \
  "${OPENCV_SOURCE_SHA256}" '95283459'
download_exact \
  "https://github.com/opencv/opencv_contrib/archive/${OPENCV_CONTRIB_COMMIT}.tar.gz" \
  "${WORK}/downloads/opencv-contrib.tar.gz" \
  "${OPENCV_CONTRIB_SOURCE_SHA256}" '55486754'
download_exact \
  'https://files.pythonhosted.org/packages/85/05/0c1cc486e87d2a5ad6649eb96a8ccaa7c6002d8d73d676c13e2102f286c1/kornia-0.8.3-py3-none-any.whl' \
  "${PRIVATE_ROOT}/python/wheelhouse/kornia-0.8.3-py3-none-any.whl" \
  '0b15f5d359aeafd7ff54ea631ed1943a3eb295c4a6dae3f745ddeada25e33289' '1189381'
download_exact \
  'https://files.pythonhosted.org/packages/72/7f/01c9456a09a3a5731bf986724f6f6ff70d627ac8072cf298d842ec204692/kornia_rs-0.1.14-cp312-cp312-manylinux_2_17_x86_64.manylinux2014_x86_64.whl' \
  "${PRIVATE_ROOT}/python/wheelhouse/kornia_rs-0.1.14-cp312-cp312-manylinux_2_17_x86_64.manylinux2014_x86_64.whl" \
  '396f84661fcf260885c3f9db717caf6904eafd44857dca17be09a835bd7da8d9' '3695565'
download_exact \
  'https://files.pythonhosted.org/packages/8c/3d/1e1db36cfd41f895d266b103df00ca5b3cbe965184df824dec5c08c6b803/numpy-2.2.6-cp312-cp312-manylinux_2_17_x86_64.manylinux2014_x86_64.whl' \
  "${PRIVATE_ROOT}/python/wheelhouse/numpy-2.2.6-cp312-cp312-manylinux_2_17_x86_64.manylinux2014_x86_64.whl" \
  'fd83c01228a688733f1ded5201c678f0c53ecc1006ffbc404db9f7a899ac6249' '16527618'
download_exact \
  'https://files.pythonhosted.org/packages/63/34/ba1c580383c9eada3711951fef0795c80b829a078d72188184bcab9dd527/packaging-26.3-py3-none-any.whl' \
  "${PRIVATE_ROOT}/python/wheelhouse/packaging-26.3-py3-none-any.whl" \
  'd7193f7c8e4e93f444fde0262bf90af30e16fa0ad0ad44cb553c87339b23cd1c' '129956'
download_exact \
  'https://files.pythonhosted.org/packages/76/25/27abc9792615b5e886ca9411ba6637b675f1b77af3104710ac7353fe5605/pillow-12.1.0-cp312-cp312-manylinux2014_x86_64.manylinux_2_17_x86_64.whl' \
  "${PRIVATE_ROOT}/python/wheelhouse/pillow-12.1.0-cp312-cp312-manylinux2014_x86_64.manylinux_2_17_x86_64.whl" \
  'bef9768cab184e7ae6e559c032e95ba8d07b3023c289f79a2bd36e8bf85605a5' '8044868'
download_exact \
  'https://files.pythonhosted.org/packages/23/45/caa600acfab94560807a20a64b5830d2cd3c3202b7f1328644d70b7d6bd8/nvidia_ml_py-13.610.43-py3-none-any.whl' \
  "${PRIVATE_ROOT}/python/wheelhouse/nvidia_ml_py-13.610.43-py3-none-any.whl" \
  'f13c72698edef492f985cc225f14faafe68ae065a2e407f45bdf6f4b9b43fde8' '53163'
download_exact \
  'https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2404/x86_64/cuda-compat-12-8_570.211.01-0ubuntu1_amd64.deb' \
  "${PRIVATE_ROOT}/cuda-forward-compat/cuda-compat-12-8_570.211.01-0ubuntu1_amd64.deb" \
  "${CUDA_COMPAT_SHA256}" "${CUDA_COMPAT_BYTES}"

cat >"${PRIVATE_ROOT}/python/requirements.lock.txt" <<'EOF'
kornia==0.8.3 --hash=sha256:0b15f5d359aeafd7ff54ea631ed1943a3eb295c4a6dae3f745ddeada25e33289
kornia-rs==0.1.14 --hash=sha256:396f84661fcf260885c3f9db717caf6904eafd44857dca17be09a835bd7da8d9
numpy==2.2.6 --hash=sha256:fd83c01228a688733f1ded5201c678f0c53ecc1006ffbc404db9f7a899ac6249
nvidia-ml-py==13.610.43 --hash=sha256:f13c72698edef492f985cc225f14faafe68ae065a2e407f45bdf6f4b9b43fde8
packaging==26.3 --hash=sha256:d7193f7c8e4e93f444fde0262bf90af30e16fa0ad0ad44cb553c87339b23cd1c
pillow==12.1.0 --hash=sha256:bef9768cab184e7ae6e559c032e95ba8d07b3023c289f79a2bd36e8bf85605a5
EOF

readonly BUILDER_PYTHON="${WORK}/builder-python"
mkdir -p "${BUILDER_PYTHON}"
python - \
  "${PRIVATE_ROOT}/python/wheelhouse/numpy-2.2.6-cp312-cp312-manylinux_2_17_x86_64.manylinux2014_x86_64.whl" \
  "${BUILDER_PYTHON}" <<'PY'
from pathlib import Path, PurePosixPath
import stat
import sys
from zipfile import ZipFile

wheel = Path(sys.argv[1])
destination = Path(sys.argv[2])
with ZipFile(wheel) as archive:
    for member in archive.infolist():
        path = PurePosixPath(member.filename)
        file_type = (member.external_attr >> 16) & 0o170000
        if (
            path.is_absolute()
            or ".." in path.parts
            or file_type == stat.S_IFLNK
        ):
            raise SystemExit("builder-only NumPy wheel path policy failed")
    archive.extractall(destination)
PY
export PYTHONPATH="${BUILDER_PYTHON}"

tar --extract --gzip --file "${WORK}/downloads/opencv.tar.gz" \
  --directory "${WORK}"
tar --extract --gzip --file "${WORK}/downloads/opencv-contrib.tar.gz" \
  --directory "${WORK}"
readonly OPENCV_SOURCE="${WORK}/opencv-${OPENCV_COMMIT}"
readonly OPENCV_CONTRIB_SOURCE="${WORK}/opencv_contrib-${OPENCV_CONTRIB_COMMIT}"
test -f "${OPENCV_SOURCE}/LICENSE"
test -f "${OPENCV_CONTRIB_SOURCE}/LICENSE"

readonly PYTHON_EXECUTABLE="$(command -v python)"
readonly PYTHON_INCLUDE="$(python -c 'import sysconfig; print(sysconfig.get_path("include"))')"
readonly NUMPY_INCLUDE="$(python -c 'import numpy; print(numpy.get_include())')"

cmake -S "${OPENCV_SOURCE}" -B "${WORK}/opencv-build" \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_INSTALL_PREFIX="${PRIVATE_ROOT}/opencv/install" \
  -DCMAKE_INSTALL_LIBDIR=lib \
  -DCMAKE_INSTALL_RPATH='/opt/weeditpro/opencv-cuda/lib' \
  -DCMAKE_INSTALL_RPATH_USE_LINK_PATH=FALSE \
  -DBUILD_LIST=core,imgproc,cudev,cudaarithm,python3 \
  -DBUILD_SHARED_LIBS=ON \
  -DBUILD_DOCS=OFF \
  -DBUILD_EXAMPLES=OFF \
  -DBUILD_JAVA=OFF \
  -DBUILD_PERF_TESTS=OFF \
  -DBUILD_TESTS=OFF \
  -DBUILD_opencv_apps=OFF \
  -DBUILD_opencv_python3=ON \
  -DCUDA_ARCH_BIN=8.9 \
  -DCUDA_ARCH_PTX= \
  -DCUDA_NVCC_FLAGS=--objdir-as-tempdir \
  -DCUDA_FAST_MATH=OFF \
  -DENABLE_FAST_MATH=OFF \
  -DINSTALL_C_EXAMPLES=OFF \
  -DINSTALL_PYTHON_EXAMPLES=OFF \
  -DOPENCV_DNN_CUDA=OFF \
  -DOPENCV_ENABLE_NONFREE=OFF \
  -DOPENCV_EXTRA_MODULES_PATH="${OPENCV_CONTRIB_SOURCE}/modules" \
  -DOPENCV_GENERATE_PKGCONFIG=OFF \
  -DOPENCV_TIMESTAMP=1970-01-01T00:00:00Z \
  -DOPENCV_SKIP_PYTHON_LOADER=ON \
  -DOPENCV_PYTHON3_INSTALL_PATH="${PRIVATE_ROOT}/opencv/install/python" \
  -DPYTHON3_EXECUTABLE="${PYTHON_EXECUTABLE}" \
  -DPYTHON3_INCLUDE_DIR="${PYTHON_INCLUDE}" \
  -DPYTHON3_NUMPY_INCLUDE_DIRS="${NUMPY_INCLUDE}" \
  -DWITH_1394=OFF \
  -DWITH_CUBLAS=ON \
  -DWITH_CUDA=ON \
  -DWITH_CUDNN=OFF \
  -DWITH_FFMPEG=OFF \
  -DWITH_GSTREAMER=OFF \
  -DWITH_GTK=OFF \
  -DWITH_IPP=OFF \
  -DWITH_JASPER=OFF \
  -DWITH_JPEG=OFF \
  -DWITH_NVCUVID=OFF \
  -DWITH_NVCUVENC=OFF \
  -DWITH_OPENCL=OFF \
  -DWITH_OPENEXR=OFF \
  -DWITH_OPENJPEG=OFF \
  -DWITH_PNG=OFF \
  -DWITH_PROTOBUF=OFF \
  -DWITH_QT=OFF \
  -DWITH_TBB=OFF \
  -DWITH_TIFF=OFF \
  -DWITH_V4L=OFF \
  -DWITH_WEBP=OFF
cmake --build "${WORK}/opencv-build" --parallel "$(nproc)"
cmake --install "${WORK}/opencv-build"

find "${PRIVATE_ROOT}/opencv/install" -type l -print0 \
  | while IFS= read -r -d '' link; do
      target="$(readlink -f "${link}")"
      test -f "${target}"
      cp --remove-destination "${target}" "${link}"
    done
find "${PRIVATE_ROOT}/opencv/install" -type d -empty -delete
cp "${OPENCV_SOURCE}/LICENSE" "${PRIVATE_ROOT}/opencv/LICENSE"
cp "${OPENCV_CONTRIB_SOURCE}/LICENSE" \
  "${PRIVATE_ROOT}/opencv/CONTRIB_LICENSE"

readonly OPENCV_BUILD_INFO="${WORK}/opencv-build-information.txt"
PYTHONPATH="${PRIVATE_ROOT}/opencv/install/python:${BUILDER_PYTHON}" \
LD_LIBRARY_PATH="${PRIVATE_ROOT}/opencv/install/lib:/usr/local/cuda/lib64" \
python - <<'PY' >"${OPENCV_BUILD_INFO}"
import cv2
assert cv2.__version__ == "4.12.0"
assert hasattr(cv2, "cuda")
assert hasattr(cv2.cuda, "countNonZero")
assert hasattr(cv2.cuda, "threshold")
information = cv2.getBuildInformation()
assert "NVIDIA CUDA" in information and "YES" in information
assert "cudaarithm" in information
print(information, end="")
PY
readonly OPENCV_BUILD_INFO_SHA256="$(sha256sum "${OPENCV_BUILD_INFO}" | cut -d' ' -f1)"
cp "${OPENCV_BUILD_INFO}" \
  "${PRIVATE_ROOT}/opencv/opencv-build-information.txt"
readonly OPENCV_RUNTIME_SET_SHA256="$(
  cd "${PRIVATE_ROOT}/opencv/install"
  find . -type f -print0 \
    | sort -z \
    | xargs -0 sha256sum \
    | sha256sum \
    | cut -d' ' -f1
)"

python - "${PRIVATE_ROOT}/opencv/opencv-cuda-receipt.json" \
  "${OPENCV_BUILD_INFO_SHA256}" "${OPENCV_RUNTIME_SET_SHA256}" <<'PY'
import json
import sys

path, build_info_sha256, runtime_set_sha256 = sys.argv[1:]
receipt = {
    "schemaVersion": "weeditpro-opencv-cuda-runtime-receipt-v1",
    "opencvVersion": "4.12.0",
    "sourceRepository": "https://github.com/opencv/opencv",
    "sourceCommitSha": "49486f61fb25722cbcf586b7f4320921d46fb38e",
    "sourceArchiveSha256": "8f00b42869ab2836be36090f6631ae4c38ba59171e22a69a8e0f92f8ef1771d4",
    "sourceReleaseTag": "4.12.0",
    "sourceReleaseTagSignatureVerified": False,
    "opencvContribRepository": "https://github.com/opencv/opencv_contrib",
    "opencvContribCommitSha": "d943e1d61c8bc556a13783e1546ee7c1a9e0b1cf",
    "opencvContribArchiveSha256": "79b55fa0d0edc6b2766f20cc97baf9dcee5f974870d5afeb1f8e3c623623b59b",
    "opencvContribReleaseTag": "4.12.0",
    "opencvContribReleaseTagSignatureVerified": False,
    "licenseSpdx": "Apache-2.0",
    "builderImage": "pytorch/pytorch@sha256:b574d4ccf6d8856a5d87dcadc667aa4f95dc18d337ef3a28d02b7b01897d7081",
    "runtimeBaseImage": "pytorch/pytorch@sha256:b85566342b86d13a67712e9315d40cdc2dad7f8d86df1aff3831f80835edbcca",
    "cudaToolkitVersion": "12.8",
    "cudaArchitecture": "8.9",
    "buildList": ["core", "imgproc", "cudev", "cudaarithm", "python3"],
    "sharedLibraries": True,
    "fastMathEnabled": False,
    "nonFreeAlgorithmsEnabled": False,
    "runtimeNetworkDownloadsAllowed": False,
    "pythonImportPassed": True,
    "cudaPythonBindingsPresent": True,
    "opencvBuildInformationSha256": build_info_sha256,
    "runtimeArtifactSetSha256": runtime_set_sha256,
}
with open(path, "w", encoding="utf-8", newline="\n") as handle:
    json.dump(receipt, handle, ensure_ascii=False, allow_nan=False,
              sort_keys=True, separators=(",", ":"))
    handle.write("\n")
PY

python - "${PRIVATE_ROOT}/cuda-forward-compat/cuda-forward-compat-ingest-receipt.json" <<'PY'
import json
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
with open(sys.argv[1], "w", encoding="utf-8", newline="\n") as handle:
    json.dump(receipt, handle, ensure_ascii=False, allow_nan=False,
              sort_keys=True, separators=(",", ":"))
    handle.write("\n")
PY

cp "${ROOT}/source/Dockerfile.candidate" \
  "${WORK}/build-source/docker/prod/gpu-worker/track-all-task-qa/Dockerfile.candidate"
cp "${ROOT}/source/runner.py" \
  "${WORK}/build-source/docker/prod/gpu-worker/track-all-task-qa/runner.py"
cp "${ROOT}/source/entrypoint.sh" \
  "${WORK}/build-source/docker/prod/gpu-worker/track-all-task-qa/entrypoint.sh"
cp "${ROOT}/source/verify-private-build-input.py" \
  "${WORK}/build-source/docker/prod/gpu-worker/track-all-task-qa/verify-private-build-input.py"
cp "${ROOT}/source/source-provenance.lock" \
  "${WORK}/build-source/docker/prod/gpu-worker/track-all-task-qa/source-provenance.lock"

python - "${PRIVATE_ROOT}" <<'PY'
import hashlib
import json
import os
from pathlib import Path
import sys

root = Path(sys.argv[1])
artifacts = []
files = (item for item in root.rglob("*") if item.is_file())
for path in sorted(
    files,
    key=lambda item: item.relative_to(root).as_posix(),
):
    relative = path.relative_to(root).as_posix()
    if relative == "capsule-manifest.json" or path.is_symlink():
        raise SystemExit("private capsule path policy failed")
    if relative == "python/requirements.lock.txt":
        role = "python_requirement_lock"
    elif relative.startswith("python/wheelhouse/"):
        role = "python_wheel"
    elif relative == "opencv/opencv-cuda-receipt.json":
        role = "opencv_cuda_receipt"
    elif relative == "opencv/opencv-build-information.txt":
        role = "opencv_cuda_build_information"
    elif relative == "opencv/LICENSE":
        role = "opencv_source_license"
    elif relative == "opencv/CONTRIB_LICENSE":
        role = "opencv_contrib_source_license"
    elif relative.startswith("opencv/install/python/") and relative.endswith(".so"):
        role = "opencv_cuda_python_module"
    elif relative.startswith("opencv/install/lib/") and ".so" in relative:
        role = "opencv_cuda_shared_library"
    elif relative.startswith("opencv/install/"):
        role = "opencv_cuda_runtime_file"
    elif relative.endswith(".deb"):
        role = "cuda_forward_compat_package"
    elif relative.endswith("cuda-forward-compat-ingest-receipt.json"):
        role = "cuda_forward_compat_ingest_receipt"
    else:
        raise SystemExit(f"unclassified private capsule file: {relative}")
    body = path.read_bytes()
    artifacts.append({
        "path": relative,
        "role": role,
        "byteLength": len(body),
        "sha256": hashlib.sha256(body).hexdigest(),
    })
manifest = {
    "schemaVersion": "weeditpro-track-all-sam3_1-l4-task-qa-private-build-capsule-v1",
    "capsuleId": "track-all-l4-task-qa-opencv-4.12.0-kornia-0.8.3-v1",
    "artifacts": artifacts,
    "runtimeDownloadsAllowed": False,
    "containsCredentials": False,
    "containsCustomerMedia": False,
    "containsModelWeights": False,
}
encoded = json.dumps(manifest, ensure_ascii=False, allow_nan=False,
                     sort_keys=True, separators=(",", ":")).encode("utf-8") + b"\n"
(root / "capsule-manifest.json").write_bytes(encoded)
PY

test -z "$(find "${WORK}/build-source" -type l -print -quit)"
find "${WORK}/build-source" -type f -exec touch -d '@0' {} +

readonly UNCOMPRESSED_TAR="${WORK}/track-all-l4-task-qa-build-source.tar"
(
  cd "${WORK}/build-source"
  find . -mindepth 1 \( -type d -o -type f \) -printf '%P\0' \
    | sort -z \
    | tar --create --format=ustar --mtime='@0' \
        --owner=0 --group=0 --numeric-owner --no-recursion \
        --file="${UNCOMPRESSED_TAR}" --null --files-from=-
)
gzip --no-name --best "${UNCOMPRESSED_TAR}"
readonly ARCHIVE="${UNCOMPRESSED_TAR}.gz"
readonly ARCHIVE_SHA256="$(sha256sum "${ARCHIVE}" | cut -d' ' -f1)"
mv "${ARCHIVE}" "/output/${ARCHIVE_SHA256}.tar.gz"

printf '%s\n' \
  "builder_image=${BUILDER_IMAGE}" \
  "runtime_image=${RUNTIME_IMAGE}" \
  "opencv_source_sha256=${OPENCV_SOURCE_SHA256}" \
  "cuda_compat_sha256=${CUDA_COMPAT_SHA256}" \
  "build_source_sha256=${ARCHIVE_SHA256}" \
  >"/output/${ARCHIVE_SHA256}.receipt.txt"

test -s "/output/${ARCHIVE_SHA256}.tar.gz"
test -s "/output/${ARCHIVE_SHA256}.receipt.txt"
