import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { Users } from "./user-schema";

export const Boards = pgTable("boards", {
  board_id: serial("board_id").primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  description: varchar({ length: 500 }),
  owner_id: integer()
    .notNull()
    .references(() => Users.id),
  isVisible: boolean("is_visible"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
