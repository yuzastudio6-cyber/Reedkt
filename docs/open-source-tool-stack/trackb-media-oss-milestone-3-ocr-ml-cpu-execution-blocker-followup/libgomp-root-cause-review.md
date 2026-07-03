# libgomp Root Cause Review

Prior PR: #583.

Prior blocker: `libgomp.so.1: cannot open shared object file` while loading `/usr/local/lib/python3.12/site-packages/paddle/base/libpaddle.so`.

Base image: `python:3.12-slim`.

Selected package: `libgomp1`.

Package strategy clear: `true`.

OCR inference, model asset operations, and GPU execution remain blocked.
