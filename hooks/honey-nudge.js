#!/usr/bin/env node
// PostToolUse hook: a SessionStart banner alone does not hold across a long
// investigation turn. Every 3rd tool call while Honey is active, re-inject the
// specific failure mode so the next report is compressed. Counter is per session.
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");

const EVERY = 3;
const MSG =
  "Honey: 3+ tool calls since last check. Compress the next report to a list: " +
  "no recap of what the user already said, no restating doc paths, no narrated steps. " +
  "Keep code, commands, identifiers and safety-critical detail exact.";

function main() {
  const DIR = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), ".claude");
  let mode = "";
  try { mode = fs.readFileSync(path.join(DIR, ".honey-active"), "utf8").trim(); } catch (e) {}
  if (!mode || mode === "off") return;

  let sid = "x";
  try { sid = String(JSON.parse(fs.readFileSync(0, "utf8")).session_id || "x").replace(/[^\w-]/g, ""); } catch (e) {}

  const file = path.join(DIR, ".honey-nudge-" + sid);
  let n = 0;
  try { n = parseInt(fs.readFileSync(file, "utf8"), 10) || 0; } catch (e) {}
  n += 1;
  try { fs.writeFileSync(file, String(n % EVERY)); } catch (e) {}
  if (n % EVERY) return;

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: MSG },
  }));
}

if (require.main === module) main();
