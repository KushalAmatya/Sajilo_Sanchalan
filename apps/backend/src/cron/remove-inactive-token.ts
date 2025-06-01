import { CronJob } from "cron";
import { fromPromise } from "neverthrow";
import { UserTokens } from "../models/user-token-schema";
import { db } from "@/db/db";
import { Users } from "@/models/user-schema";
import { eq, inArray } from "drizzle-orm";
import { logger } from "@/utils/logger";

export const removeInactiveToken = CronJob.from({
  cronTime: "0 0 * * * *",
  onTick: async () => {
    console.log("Running cron job to remove inactive tokens");
    const users = await fromPromise(
      db.select({ id: Users.id, lastLoggedIn: Users.lastLoggedIn }).from(Users),
      () => new Error("Error! While fetching users")
    );
    if (users.isErr()) {
      console.log(users.error.message);
      return;
    }
    const userList = users.value;
    const currentDate = new Date();
    const inactiveUsers = userList.filter((user) => {
      const lastLoggedInDate = new Date(user.lastLoggedIn);
      const diffTime = Math.abs(
        currentDate.getTime() - lastLoggedInDate.getTime()
      );
      const diffDays = Math.ceil(diffTime);
      return diffDays > Number(process.env.REFRESH_TOKEN_EXPIRES_IN);
    });
    const inactiveUserIds = inactiveUsers.map((user) => user.id);
    if (inactiveUserIds.length === 0) {
      logger.info("No inactive users found");
      return;
    }
    const deleteTokens = await fromPromise(
      db.delete(UserTokens).where(inArray(UserTokens.userId, inactiveUserIds)),
      () => new Error("Error! While deleting tokens")
    );
    if (deleteTokens.isErr()) {
      logger.error(deleteTokens.error.message);
      return;
    }
    logger.info("Deleted ID", inactiveUserIds.join(","));
    return;
  },
  start: true,
  timeZone: "Asia/Kathmandu",
});
