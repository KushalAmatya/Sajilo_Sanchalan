import { StatusCodes } from "@/constants/status-codes";
import { db } from "@/db/db";
import { ItemAssignments } from "@/models/item-assignments-schema";
import { logger } from "@/utils/logger";
import { eq, inArray } from "drizzle-orm";
import { Request, Response } from "express";
import { fromPromise } from "neverthrow";

const AssignItemToUser = async (req: Request, res: Response) => {
  const { itemId, userId }: { itemId: number; userId: number[] } = req.body;
  if (!itemId || !userId) {
    res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Item ID and User ID are required" });
    return;
  }

  const mappingItems = userId.map((user: number) => {
    return {
      item_id: Number(itemId),
      user_id: Number(user),
    };
  });
  const assignItem = await fromPromise(
    db.insert(ItemAssignments).values(mappingItems),

    () => new Error("Unknown Error Occured")
  );

  if (assignItem.isErr()) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: assignItem.error.message });
    logger.error(
      "Error while assigning item to user",
      assignItem.error.message
    );
    return;
  }

  res.status(StatusCodes.OK).json({ message: "Assigned Successfully" });
  logger.info("Item assigned to user successfully");
  return;
};

const RemoveUserFromItem = async (req: Request, res: Response) => {
  const { itemId, userId }: { itemId: number; userId: number[] } = req.body;
  if (!itemId || !userId) {
    res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Item ID and User ID are required" });
    return;
  }

  const removeUser = await fromPromise(
    db.delete(ItemAssignments).where(inArray(ItemAssignments.user_id, userId)),

    () => new Error("Unknown Error Occured")
  );

  if (removeUser.isErr()) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: removeUser.error.message });
    logger.error(
      "Error while removing user from item",
      removeUser.error.message
    );
    return;
  }

  res.status(StatusCodes.OK).json({ message: "Removed Successfully" });
  logger.info("User removed from item successfully");
  return;
};

const GetItemAssignments = async (req: Request, res: Response) => {
  const { itemId } = req.params;
  if (!itemId) {
    res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Item ID is required" });
    return;
  }

  const itemAssignments = await fromPromise(
    db
      .select()
      .from(ItemAssignments)
      .where(eq(ItemAssignments.item_id, Number(itemId))),
    () => new Error("Unknown Error Occured")
  );

  if (itemAssignments.isErr()) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: itemAssignments.error.message });
    logger.error(
      "Error while fetching item assignments",
      itemAssignments.error.message
    );
    return;
  }

  res.status(StatusCodes.OK).json({ result: itemAssignments.value });
  logger.info("Item assignments fetched successfully");
  return;
};

export const ItemAssignmentsController = {
  AssignItemToUser,
  RemoveUserFromItem,
  GetItemAssignments,
};
