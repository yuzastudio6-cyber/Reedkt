#!/bin/sh
set -eu

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

driver_version="$({
  sed -n \
    's/.*Kernel Module[[:space:]]*\([0-9][0-9.]*\).*/\1/p' \
    "${driver_version_file}"
} | sed -n '1p')"
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
runtime_library_paths=/opt/weeditpro/ffmpeg/lib:/usr/local/cuda/lib64:/usr/local/cuda-12.8/lib64
if [ ! -x /opt/weeditpro/ffmpeg/bin/ffmpeg ] \
  || [ ! -r /opt/weeditpro/ffmpeg/lib/libavcodec.so.62 ] \
  || [ ! -r /opt/weeditpro/ffmpeg/lib/libavformat.so.62 ] \
  || [ ! -r /opt/weeditpro/ffmpeg/lib/libavutil.so.60 ]; then
  echo "Pinned FFmpeg 8 shared-library closure is unavailable" >&2
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

exec /opt/weeditpro/python-venv/bin/python \
  -I -B /opt/reeditpro/sam3_1/runner.py
