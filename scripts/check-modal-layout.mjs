import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const modal = readFileSync(resolve(process.cwd(), "components/ui/modal.tsx"), "utf8");

assert.match(
  modal,
  /import\s+\{\s*createPortal\s*\}\s+from\s+["']react-dom["']/,
  "Shared modals must use a React portal so fixed positioning is viewport-relative",
);
assert.match(
  modal,
  /createPortal\([\s\S]*document\.body\s*,?\s*\)/,
  "Shared modals must mount directly under document.body",
);
assert.match(modal, /fixed inset-0/, "Shared modals must retain a viewport-covering fixed overlay");

console.log("PASS shared modal mounts at the viewport boundary");
