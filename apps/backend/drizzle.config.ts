import { defineConfig } from "drizzle-kit";
import "dotenv/config";
export default defineConfig({
    schema: "./src/models/**/*.ts",
    out: "./src/drizzle/migrations",
    dialect: "postgresql",
    schemaFilter: "public",
    dbCredentials: {
        url: process.env.DB_URL!,
    },
    verbose: true,
    strict: true,
});
