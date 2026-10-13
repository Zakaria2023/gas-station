/**
 * The database settings from the environment, shared by the app's pool
 * (db/index.ts) and drizzle-kit (drizzle.config.ts) so both connect alike.
 */

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export type DbSettings = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl: false | { rejectUnauthorized: boolean; ca?: string };
  poolMax: number;
};

export const readDbSettings = (): DbSettings => {
  // Pasted into one env line, the certificate's line breaks arrive as "\n".
  const ca = process.env.DB_CA_CERT?.replace(/\\n/g, "\n").trim();
  const connectionLimit = Number(process.env.DB_CONNECTION_LIMIT) || 20;
  const poolMax = Number(process.env.DB_POOL_MAX) || 3;

  return {
    host: required("DB_HOST"),
    port: Number(required("DB_PORT")),
    user: required("DB_USER"),
    password: required("DB_PASSWORD"),
    database: required("DB_NAME"),
    ssl:
      process.env.DB_SSL_MODE === "disable"
        ? false
        : ca
          ? { rejectUnauthorized: true, ca }
          : { rejectUnauthorized: false },
    // One copy of the app never takes the whole plan's allowance.
    poolMax: Math.max(1, Math.min(poolMax, connectionLimit)),
  };
};
