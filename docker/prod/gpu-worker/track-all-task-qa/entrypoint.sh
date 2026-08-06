#!/bin/sh
set -eu

if [ "${WEEDITPRO_GPU_ACCELERATOR_CLASS:-}" != "nvidia_l4" ]; then
  echo "Track All task QA requires WEEDITPRO_GPU_ACCELERATOR_CLASS=nvidia_l4" >&2
  exit 70
fi

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
runtime_library_paths=/opt/weeditpro/opencv-cuda/lib:/opt/weeditpro/cuda-npp/lib:/usr/local/lib/python3.12/dist-packages/nvidia/cublas/lib:/usr/local/lib/python3.12/dist-packages/nvidia/cuda_runtime/lib:/usr/local/lib/python3.12/dist-packages/nvidia/cufft/lib:/usr/local/cuda/lib64
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

exec /usr/bin/python -s -B \
  /opt/weeditpro/track-all-task-qa/runner.py
