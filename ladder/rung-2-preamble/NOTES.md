# Rung 2 — handler preamble

Pain removed: dependencies scattered through the function body are now visible in one block at the top. The `getMustExist` calls immediately following each `setOrDefault` make the contract explicit — "by the point execution reaches this line, this is established" — so a future reader (or a bug that deletes the `setOrDefault`) surfaces at the exact path rather than as a null dereference somewhere downstream. Failure is now located, not discovered.
