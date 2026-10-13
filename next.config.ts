import fs from "fs";
import type { NextConfig } from "next";
import path from "path";

// Load .env.local into process.env without overriding anything the platform
// already set, so a hosted deployment uses its own environment variables.
const rootEnv = path.join(__dirname, ".env.local");
if (fs.existsSync(rootEnv)) {
  for (const line of fs.readFileSync(rootEnv, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq === -1) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    if (process.env[key] !== undefined) {
      continue;
    }
    process.env[key] = trimmed
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
  }
}

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg"],
  // The dev badge sits on top of the bottom tab bar; the app is tried on phones.
  devIndicators: false,
};

export default nextConfig;
