import { StatusCodes } from "@/constants/status-codes";
import { db } from "@/db/db";
import { Items } from "@/models/item-schema";
import { logger } from "@/utils/logger";
import { and, eq, ilike, or } from "drizzle-orm";
import { Request, Response } from "express";
import { fromPromise } from "neverthrow";

const GetItemById = async (req: Request, res: Response) => {
  const itemId = req.params.id;
  const getItem = await fromPromise(
    db
      .select()
      .from(Items)
      .where(eq(Items.item_id, Number(itemId)))
      .then((res) => res[0]),
    () => new Error("Unknown Error Occured")
  );
  if (getItem.isErr()) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: getItem.error.message });
    return;
  }
  if (!getItem.value) {
    res.status(StatusCodes.NOT_FOUND).json({ message: "No items found" });
    return;
  }
  res.status(StatusCodes.OK).json({ result: getItem.value });
  logger.info("Accessed Item DB Id: ", getItem.value.item_id);
  return;
};

const GetItemsByBoardId = async (req: Request, res: Response) => {
  const boardId = req.params.id;
  if (!boardId) {
    res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Board ID is required" });
    return;
  }
  const searchParams = req.query;
  const searchQuery = searchParams.search as string;
  const searchQueryCondition = searchQuery
    ? ilike(Items.name, `%${searchQuery}%`)
    : undefined;
  const getAllItems = await fromPromise(
    db
      .select()
      .from(Items)
      .where(and(eq(Items.group_id, Number(boardId)), searchQueryCondition))
      .then((res) => res),
    () => new Error("Unknown Error Occured")
  );
  if (getAllItems.isErr()) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: getAllItems.error.message });
    return;
  }
  if (!getAllItems.value) {
    res.status(StatusCodes.NOT_FOUND).json({ message: "No items found" });
    return;
  }
  res.status(StatusCodes.OK).json({ result: getAllItems.value });
  logger.info("Hit Get Items By Board Id API");
  return;
};

const CreateItem = async (req: Request, res: Response) => {
  const { group_id, name, description, status } = req.body;
  if (!group_id || !name || !description || !status) {
    res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "All fields are required" });
    return;
  }
  const createItem = await fromPromise(
    db
      .insert(Items)
      .values({ group_id, name, description, status })
      .returning()
      .then((res) => res[0]),
    () => new Error("Unknown Error Occured")
  );
  if (createItem.isErr()) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: createItem.error.message });
    return;
  }
  res
    .status(StatusCodes.CREATED)
    .json({ result: createItem.value, message: "Data Successfully Created" });
  logger.info("Created Item DB Id: ", createItem.value.item_id);
  return;
};

const UpdateItem = async (req: Request, res: Response) => {
  const itemId = req.params.id;
  if (!itemId) {
    res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Item ID is required" });
    return;
  }
  const { name, description, status } = req.body;
  if (!name || !description || !status) {
    res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "All fields are required" });
    return;
  }
  const updateItem = await fromPromise(
    db
      .update(Items)
      .set({ name, description, status })
      .where(eq(Items.item_id, Number(itemId)))
      .returning()
      .then((res) => res[0]),
    () => new Error("Unknown Error Occured")
  );
  if (updateItem.isErr()) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: updateItem.error.message });
    logger.error(updateItem.error.message);
    return;
  }
  res
    .status(StatusCodes.OK)
    .json({ result: updateItem.value, message: "Data Success Fully Updated" });
  logger.info("Updated Item DB Id: ", updateItem.value.item_id);
  return;
};

const DeleteItem = async (req: Request, res: Response) => {
  const itemId = req.params.id;
  if (!itemId) {
    res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Item ID is required" });
    return;
  }
  const deleteItem = await fromPromise(
    db
      .delete(Items)
      .where(eq(Items.item_id, Number(itemId)))
      .returning()
      .then((res) => res[0]),
    () => new Error("Unknown Error Occured")
  );
  if (deleteItem.isErr()) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: deleteItem.error.message });
    logger.error("Error while deleting item", deleteItem.error.message);
    return;
  }
  if (!deleteItem.value) {
    res.status(StatusCodes.NOT_FOUND).json({ message: "No items found" });
    return;
  }
  res.status(StatusCodes.OK).json({ result: deleteItem.value });
  logger.info("Deleted Item DB Id: ", deleteItem.value.item_id);
  return;
};

export const ItemController = {
  GetItemById,
  GetItemsByBoardId,
  CreateItem,
  UpdateItem,
  DeleteItem,
};
