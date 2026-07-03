# libGL Root Cause Review

Prior PR #587 blocked on `libGL.so.1` through `cv2` during PaddleOCR import.
`python:3.12-slim` uses apt, so the minimal selected package is `libgl1`.
After adding `libgl1`, PaddleOCR import advanced to a new missing `libgthread-2.0.so.0` blocker.
