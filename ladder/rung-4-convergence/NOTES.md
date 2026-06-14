# Rung 4 — make convergence real

Pain removed: the config re-load on restart and the warm-path entries array both converge at the same `setOrDefault` lines — no `if (__restarted)` branch needed for the re-load itself, and no check before the pre-created array. The domain namespace constants (`config_namespace`, `users_namespace`) are now named at the top, making the address space legible at a glance. Adding a new route that might-or-might-not have established state means: it reaches the same `setOrDefault` line, which handles both cases without a new branch.
