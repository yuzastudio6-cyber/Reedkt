#!/bin/sh
set -eu

umask 077

assert_private_runtime_directory() {
  expected_path="$1"
  expected_value="$2"
  variable_name="$3"
  if [ "${expected_value}" != "${expected_path}" ]; then
    echo "${variable_name} changed from its admitted path" >&2
    exit 70
  fi
  if [ ! -d "${expected_path}" ] || [ -L "${expected_path}" ]; then
    echo "${variable_name} is absent or symlinked" >&2
    exit 70
  fi
  if [ "$(stat -c '%u:%g:%a' "${expected_path}")" != "65532:65532:700" ]; then
    echo "${variable_name} ownership or mode changed" >&2
    exit 70
  fi
  if [ ! -w "${expected_path}" ] || [ ! -x "${expected_path}" ]; then
    echo "${variable_name} is not private-writable" >&2
    exit 70
  fi
}

assert_private_runtime_directory \
  /var/lib/weeditpro/sam31 "${HOME:-}" HOME
assert_private_runtime_directory \
  /var/cache/weeditpro/sam31/xdg "${XDG_CACHE_HOME:-}" XDG_CACHE_HOME
assert_private_runtime_directory \
  /var/cache/weeditpro/sam31/triton "${TRITON_CACHE_DIR:-}" TRITON_CACHE_DIR
assert_private_runtime_directory \
  /var/cache/weeditpro/sam31/torchinductor \
  "${TORCHINDUCTOR_CACHE_DIR:-}" TORCHINDUCTOR_CACHE_DIR
assert_private_runtime_directory \
  /var/cache/weeditpro/sam31/cuda "${CUDA_CACHE_PATH:-}" CUDA_CACHE_PATH

# Select the CUDA driver-library path before Python or PyTorch can load
# libcuda. Cloud Run L4 currently exposes the 535 driver branch, so the
# pinned CUDA 12.8 runtime must use NVIDIA's exact forward-compatibility
# package there. Newer host drivers use their mounted libraries directly.

case "${WEEDITPRO_GPU_ACCELERATOR_CLASS:-}" in
  nvidia_a100_80gb|nvidia_l4)
    ;;
  *)
    echo "WEEDITPRO_GPU_ACCELERATOR_CLASS is missing or invalid" >&2
    exit 70
    ;;
esac

driver_version_file=/proc/driver/nvidia/version
if [ ! -r "${driver_version_file}" ]; then
  echo "NVIDIA kernel driver version is unavailable" >&2
  exit 70
fi

driver_version="$(
  awk '
    function is_driver_version(candidate, pieces, count, part_index) {
      count = split(candidate, pieces, ".")
      if (count < 2 || count > 4) {
        return 0
      }
      for (part_index = 1; part_index <= count; part_index += 1) {
        if (pieces[part_index] !~ /^[0-9]+$/) {
          return 0
        }
      }
      return 1
    }

    /^NVRM version:/ {
      for (field = 1; field <= NF; field += 1) {
        if (is_driver_version($field)) {
          print $field
          exit
        }
      }
    }
  ' "${driver_version_file}"
)"
driver_major="${driver_version%%.*}"

case "${driver_version}" in
  ''|*[!0-9.]*)
    echo "NVIDIA kernel driver version is malformed" >&2
    exit 70
    ;;
esac
case "${driver_major}" in
  ''|*[!0-9]*)
    echo "NVIDIA kernel driver major version is malformed" >&2
    exit 70
    ;;
esac

host_driver_paths=/usr/local/nvidia/lib64:/usr/local/nvidia/lib
runtime_library_paths=/opt/weeditpro/ffmpeg/lib:/opt/weeditpro/cuda-npp/lib:/usr/local/cuda/lib64:/usr/local/cuda-12.8/lib64
if [ ! -x /opt/weeditpro/ffmpeg/bin/ffmpeg ] \
  || [ ! -r /opt/weeditpro/ffmpeg/lib/libavcodec.so.62 ] \
  || [ ! -r /opt/weeditpro/ffmpeg/lib/libavformat.so.62 ] \
  || [ ! -r /opt/weeditpro/ffmpeg/lib/libavutil.so.60 ]; then
  echo "Pinned FFmpeg 8 shared-library closure is unavailable" >&2
  exit 70
fi
if [ ! -r /opt/weeditpro/cuda-npp/lib/libnppc.so.12 ] \
  || [ ! -r /opt/weeditpro/cuda-npp/lib/libnppicc.so.12 ]; then
  echo "Pinned NVIDIA NPP runtime closure is unavailable" >&2
  exit 70
fi
if [ "${driver_major}" -ge 535 ] && [ "${driver_major}" -lt 570 ]; then
  compatibility_path=/usr/local/cuda-12.8/compat
  if [ ! -r "${compatibility_path}/libcuda.so.1" ]; then
    echo "CUDA 12.8 forward-compatibility library is unavailable" >&2
    exit 70
  fi
  WEEDITPRO_CUDA_DRIVER_LIBRARY_MODE=cuda_compat_12_8
  LD_LIBRARY_PATH="${compatibility_path}:${host_driver_paths}:${runtime_library_paths}"
elif [ "${driver_major}" -ge 570 ]; then
  WEEDITPRO_CUDA_DRIVER_LIBRARY_MODE=host_driver
  LD_LIBRARY_PATH="${host_driver_paths}:${runtime_library_paths}"
else
  echo "NVIDIA driver is below the admitted CUDA 12.8 floor" >&2
  exit 70
fi

export LD_LIBRARY_PATH
export WEEDITPRO_CUDA_DRIVER_LIBRARY_MODE
export WEEDITPRO_OBSERVED_NVIDIA_DRIVER_VERSION="${driver_version}"
export CUBLAS_WORKSPACE_CONFIG=:4096:8

case "${WEEDITPRO_SAM31_RUNTIME_MODE:-one_shot_v1}" in
  one_shot_v1)
    exec /opt/weeditpro/python-venv/bin/python \
      -I -B /opt/reeditpro/sam3_1/runner.py
    ;;
  vertex_prediction_endpoint_v1)
    if [ "${WEEDITPRO_GPU_ACCELERATOR_CLASS}" != "nvidia_a100_80gb" ]; then
      echo "Vertex prediction mode requires the A100 80 GB route" >&2
      exit 70
    fi
    exec /opt/weeditpro/python-venv/bin/python \
      -I -B /opt/reeditpro/sam3_1/vertex_prediction_server.py
    ;;
  *)
    echo "WEEDITPRO_SAM31_RUNTIME_MODE is invalid" >&2
    exit 70
    ;;
esac
