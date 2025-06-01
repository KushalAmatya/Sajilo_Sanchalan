import { integer, pgTable, primaryKey } from "drizzle-orm/pg-core";
import { Items } from "./item-schema";
import { Users } from "./user-schema";

export const ItemAssignments = pgTable(
  "item-assignments",
  {
    item_id: integer()
      .notNull()
      .references(() => Items.item_id, {
        onDelete: "cascade",
      }),
    user_id: integer()
      .notNull()
      .references(() => Users.id, {
        onDelete: "cascade",
      }),
  },
  (table) => [primaryKey({ columns: [table.item_id, table.user_id] })]
);
