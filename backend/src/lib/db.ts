import { PrismaClient } from "shared/models";

// Use global db instance
export const db = global.db || new PrismaClient();

if (!global.db) {
  global.db = db;
}