import {
  integer,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { Boards } from "./board-schema";

export const Groups = pgTable("groups", {
  group_id: serial().primaryKey(),
  board_id: integer()
    .notNull()
    .references(() => Boards.board_id, {
      onDelete: "cascade",
    }),
  name: varchar({ length: 255 }),
  color: varchar({ length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
});
