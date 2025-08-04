import { $ } from "bun";
import { join } from "path";
import config from "../.././config.json";

import {
  initDev,
  initEnv,
  initProd,
  type onFetch,
  type SiteConfig,
} from "rlib/server";

if (config?.db?.orm === "prisma") {
  if (
    !(await Bun.file(
      join(process.cwd(), "shared", "models", "index.js")
    ).exists())
  ) {
    console.log("Generating prisma typings...");
    await $`bun prisma generate`.cwd(join(process.cwd(), "shared")).quiet();
  }
}

const { isDev } = initEnv();

const loadModels = async () => {
  return new (await import("shared/models")).PrismaClient();
};
const loadApi = async () => {
  return (await import("./gen/api")).backendApi;
};
const onFetch: onFetch = async ({ url, req }) => {
  // Auth is now handled by our Laravel-style APIs in /api/auth/*
  // No special handling needed here
};
const index = (await import("frontend/entry/index.html")).default;

const { sessionWebSocketHandler } = await import("./lib/websocket-sessions");
const ws = {
  "/ws/session": sessionWebSocketHandler
};

if (isDev) {
  initDev({
    index,
    loadApi,
    loadModels,
    onFetch,
    ws,
  });
} else {
  const config = (await import("../../config.json")) as SiteConfig;
  initProd({
    index,
    loadApi,
    loadModels,
    onFetch,
    config,
    ws,
  });
}
