import { varchar, text, serial, timestamp, pgTable } from "drizzle-orm/pg-core";

export const Users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 225 }).notNull().unique(),
  password: text().notNull(),
  role: varchar({ length: 100 }).default("User"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastLoggedIn: timestamp("last_login"),
});
