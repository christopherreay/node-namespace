# Rung 3 — required vs optional, on the face

Pain removed: the "what is required" question is no longer answered by imperative guard branches — it is answered by the verb name (`getMustExist` vs `getOrDefault`). The error message is co-located with the contract, not in a separate conditional block. Removing a required-field check would now mean deleting a `getMustExist` call, which is visible; the old approach let you forget a guard branch with no structural signal that anything was missing.
