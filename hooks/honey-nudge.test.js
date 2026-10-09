"use strict";
const { test } = require("node:test");
const assert = require("node:assert");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const HOOK = path.join(__dirname, "honey-nudge.js");
const run = (cfg) =>
  execFileSync("node", [HOOK], {
    env: { ...process.env, CLAUDE_CONFIG_DIR: cfg },
    input: JSON.stringify({ session_id: "s1" }),
    encoding: "utf8",
  });

test("nudges on every 3rd tool call while active", () => {
  const cfg = fs.mkdtempSync(path.join(os.tmpdir(), "honey-nudge-"));
  fs.writeFileSync(path.join(cfg, ".honey-active"), "full");
  const outs = [1, 2, 3, 4, 5, 6].map(() => run(cfg));
  assert.deepStrictEqual(outs.map(Boolean), [false, false, true, false, false, true]);
  assert.match(JSON.parse(outs[2]).hookSpecificOutput.additionalContext, /Compress the next report/);
});

test("silent when Honey is off", () => {
  const cfg = fs.mkdtempSync(path.join(os.tmpdir(), "honey-nudge-"));
  assert.strictEqual([1, 2, 3].map(() => run(cfg)).join(""), "");
});
