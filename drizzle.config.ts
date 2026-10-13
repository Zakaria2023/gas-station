import { defineConfig } from "drizzle-kit";
import { readDbSettings } from "./db/connection";

const { poolMax: _poolMax, ...connection } = readDbSettings();
void _poolMax;

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    ...connection,
    // drizzle-kit wants `true` or an options object, not `false`.
    ssl: connection.ssl === false ? undefined : connection.ssl,
  },
});
