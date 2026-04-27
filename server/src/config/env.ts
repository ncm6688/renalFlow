import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

function loadEnv() {
  // Prefer `server/.env` when running from server folder.
  // Fallback to repo root `.env` when launched from elsewhere.
  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "..", ".env"),
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      dotenv.config({ path: p });
      return;
    }
  }

  // Last resort: default dotenv behavior (won't throw).
  dotenv.config();
}

loadEnv();

if (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
  throw new Error("JWT secrets not defined. Create `server/.env` (see `server/.env.example`).");
}

export const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
export const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;