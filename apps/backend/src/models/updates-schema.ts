import {
    integer,
    pgTable,
    serial,
    timestamp,
    varchar,
} from "drizzle-orm/pg-core";
import { Users } from "./user-schema";
import { Items } from "./item-schema";

export const Updates = pgTable("updated", {
    update_id: serial("update_id").primaryKey(),
    item_id: integer()
        .notNull()
        .references(() => Items.item_id),
    user_id: integer()
        .notNull()
        .references(() => Users.id),
    content: varchar({ length: 500 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});
