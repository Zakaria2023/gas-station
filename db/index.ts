import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { readDbSettings } from "./connection";
import * as schema from "./schema";

const createPool = () => {
  const { poolMax, ...connection } = readDbSettings();
  return new Pool({
    ...connection,
    // The free Aiven plan allows few connections in total, and every warm
    // server instance holds its own pool. Keep each slice small and recycle
    // idle connections quickly so the server never fills up.
    max: poolMax,
    idleTimeoutMillis: 30_000,
    // A TLS handshake to a far region can take seconds; wait rather than fail.
    connectionTimeoutMillis: 20_000,
    keepAlive: true,
  });
};

const attachErrorHandler = (pool: Pool) => {
  // The server may drop an idle connection; the pool replaces it. Without a
  // listener, that drop would crash the process.
  pool.on("error", (error) => console.error("Idle database connection dropped", error.message));
  return pool;
};

// Reuse one pool across Next.js dev hot-reloads — without this, every code
// change re-evaluates this module and leaks a fresh pool of connections.
const globalForDb = globalThis as typeof globalThis & {
  pgPool?: Pool;
};

const pool = globalForDb.pgPool ?? attachErrorHandler(createPool());
globalForDb.pgPool = pool;

export const db = drizzle(pool, { schema });

export * from "./schema";
