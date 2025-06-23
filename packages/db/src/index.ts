import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import schema from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

export const db = drizzle({ client: pool, schema });
