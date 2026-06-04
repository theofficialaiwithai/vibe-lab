import { neon } from "@neondatabase/serverless";

const connectionString = import.meta.env.VITE_NEON_CONNECTION_STRING as string;

if (!connectionString) {
  throw new Error("VITE_NEON_CONNECTION_STRING is not set in .env.local");
}

export const sql = neon(connectionString);
