// src/lib/db.ts
import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle({ client: sql, schema });
export { schema }; // NOTE: why do you export schema? Do not export values that are imported.


