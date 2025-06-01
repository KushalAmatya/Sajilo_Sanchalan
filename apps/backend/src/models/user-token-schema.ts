import {
    integer,
    pgTable,
    primaryKey,
    text,
    timestamp,
} from "drizzle-orm/pg-core";
import { Users } from "./user-schema";

export const UserTokens = pgTable(
    "user_tokens",
    {
        userId: integer()
            .notNull()
            .references(() => Users.id),
        token: text().notNull(),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        expiresOn: timestamp("expires_on").notNull(),
    },
    (table) => [primaryKey({ columns: [table.token, table.userId] })]
);
