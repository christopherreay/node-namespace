#!/usr/bin/env node
"use strict";

const { spawnSync } = require("node:child_process");
const path          = require("node:path");
const fs            = require("node:fs");

const ladderDir = __dirname;
const testFile  = path.join(ladderDir, "test", "invariant.test.js");

const allRungs = [
  "rung-0-plain",
  "rung-1-tree",
  "rung-2-preamble",
  "rung-3-required",
  "rung-4-convergence",
  "rung-5-forward",
  "rung-6-modules",
  "rung-7-batch",
  "rung-8-eval",
];

function runRung(rungDir_value) {
  const handlerPath_namespace = path.join(ladderDir, rungDir_value, "handler.js");
  if (!fs.existsSync(handlerPath_namespace)) {
    console.error(`  handler not found: ${handlerPath_namespace}`);
    return false;
  }
  const result = spawnSync(
    process.execPath,
    ["--test", testFile],
    {
      env:      { ...process.env, LADDER_HANDLER: handlerPath_namespace },
      encoding: "utf8",
    }
  );
  return result.status === 0;
}

const requestedRung = process.argv[2];

if (!requestedRung || requestedRung === "all") {
  // Run all rungs and print a matrix
  console.log("\nLadder invariant suite — all rungs\n");
  let allPassed = true;
  for (const rungDir_value of allRungs) {
    const passed = runRung(rungDir_value);
    console.log(`  ${passed ? "✓" : "✗"}  ${rungDir_value}`);
    if (!passed) allPassed = false;
  }
  console.log();
  process.exit(allPassed ? 0 : 1);
} else {
  // Run one rung with full output
  const handlerPath_namespace = path.join(ladderDir, requestedRung, "handler.js");
  if (!fs.existsSync(handlerPath_namespace)) {
    console.error(`handler not found: ${handlerPath_namespace}`);
    process.exit(1);
  }
  const result = spawnSync(
    process.execPath,
    ["--test", testFile],
    {
      env:   { ...process.env, LADDER_HANDLER: handlerPath_namespace },
      stdio: "inherit",
    }
  );
  process.exit(result.status);
}
