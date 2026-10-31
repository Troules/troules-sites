---
"@troules/index": patch
---

Static background: the slow drift animation re-rendered every glass panel's backdrop (including the CPU-bound SVG
refraction filter) on each frame, adding up to ~1 s of main-thread blocking on slow devices.
