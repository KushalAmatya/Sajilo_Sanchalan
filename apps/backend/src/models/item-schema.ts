import {
  integer,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { Groups } from "./group-schema";

export const Items = pgTable("items", {
  item_id: serial("item_id").primaryKey(),
  group_id: integer().references(() => Groups.group_id, {
    onDelete: "cascade",
  }),
  name: varchar({ length: 255 }),
  description: varchar({ length: 500 }),
  status: varchar({ length: 50 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
