// DB conncetion logic
import dotenv from "@dotenvx/dotenvx";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

dotenv.config();

const pool = new Pool({
    host: process.env.POSTGRES_HOST,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    port: Number(process.env.POSTGRES_PORT),
});

export const db = drizzle(pool, {
    logger: true,
});
