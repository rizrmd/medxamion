#!/usr/bin/env bun
import { $ } from "bun";
import { join } from "path";

// Setup git hooks first (silently)
await $`bun run scripts/setup-git-hooks.ts`.quiet();

// Kill existing process on port 45622 if it exists
try {
  const result = await $`lsof -ti:45622`.text();
  if (result.trim()) {
    await $`kill -9 ${result.trim()}`.quiet();
    console.log("Killed existing process on port 45622");
    // Wait a moment for the port to be released
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
} catch (e) {
  // Ignore error if no process found on port
}

// Generate Prisma models if they don't exist
if (!(await Bun.file(join(process.cwd(), "shared", "models", "index.js")).exists())) {
  console.log("Generating prisma typings...");
  await $`bun prisma generate`.cwd(join(process.cwd(), "shared")).quiet();
}

// Run the actual dev server
await $`bun run --silent --hot --no-clear-screen ./backend/src/index.tsx --dev`;