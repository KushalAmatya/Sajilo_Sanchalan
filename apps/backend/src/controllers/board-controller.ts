import { db } from "@/db/db";
import { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { fromPromise } from "neverthrow";
import { Boards } from "../models/board-schema";
import { and, eq, ilike } from "drizzle-orm";
import { StatusCodes } from "@/constants/status-codes";
import { Users } from "@/models/user-schema";

export interface CustomPayload extends JwtPayload {
  user?: {
    id: string;
  };
}
const GetBoardById = async (req: Request, res: Response) => {
  const boardId = req.params.id;
  const user = (req as CustomPayload).user;
  console.log("user", user);
  const getBoard = await fromPromise(
    db
      .select()
      .from(Boards)
      .where(eq(Boards.board_id, Number(boardId)))
      .then((res) => res[0]),
    () => new Error("Unknown Error Occured")
  );
  if (getBoard.isErr()) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: getBoard.error.message,
    });
    return;
  }
  if (!getBoard.value) {
    res.status(StatusCodes.NOT_FOUND).json({ message: "Board not found" });
    return;
  }
  res.status(StatusCodes.OK).json({ message: getBoard.value, id: boardId });
  return;
};

const GetAllUserBoards = async (req: Request, res: Response) => {
  const user = (req as CustomPayload).user;
  const userId = user.id;
  const searchParams = req.query;
  const searchQuery = searchParams.search as string;
  const searchQueryCondition = searchQuery
    ? ilike(Boards.name, `%${searchQuery}%`)
    : undefined;
  const allUserBoards = await fromPromise(
    db
      .select()
      .from(Boards)
      .where(and(eq(Boards.owner_id, Number(userId)), searchQueryCondition))
      .then((res) => res),
    () => new Error("Unknown Error Occured")
  );
  if (allUserBoards.isErr()) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: allUserBoards.error.message,
    });
    return;
  }
  if (!allUserBoards.value) {
    res.status(StatusCodes.NOT_FOUND).json({ message: "No boards found" });
    return;
  }
  res.status(StatusCodes.OK).json({ result: allUserBoards.value });
  return;
};

const CreateNewBoard = async (req: Request, res: Response) => {
  const user = (req as CustomPayload).user;
  const userId = user.id;
  const { boardName, boardDescription, isVisible } = req.body;

  const newBoard = await fromPromise(
    db
      .insert(Boards)
      .values({
        owner_id: Number(userId),
        name: boardName,
        description: boardDescription,
        isVisible: isVisible,
      })
      .returning()
      .then((res) => res[0]),
    () => new Error("Unknown Error Occured")
  );
  if (newBoard.isErr()) {
    console.log("newBoard", newBoard.error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: newBoard.error.message,
    });
    return;
  }
  res.status(StatusCodes.OK).json({ result: newBoard.value });
  return;
};

const GetAllBoards = async (req: Request, res: Response) => {
  const user = (req as CustomPayload).user;
  const userId = user.id;
  const searchParams = req.query;
  const userRole = await fromPromise(
    db
      .select({ role: Users.role })
      .from(Users)
      .where(eq(Users.id, Number(userId)))
      .then((res) => res[0]),
    () => new Error("Unknown Error Occured")
  );
  if (userRole.isErr()) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: userRole.error.message,
    });
    return;
  }
  if (userRole.value.role !== "Admin") {
    res.status(StatusCodes.FORBIDDEN).json({ message: "User not Allowed" });
    return;
  }
  const searchQuery = searchParams.search as string;
  const searchQueryCondition = searchQuery
    ? ilike(Boards.name, `%${searchQuery}%`)
    : undefined;
  const allBoards = await fromPromise(
    db.select().from(Boards).where(searchQueryCondition),
    () => new Error("Unknown Error Occured")
  );
  if (allBoards.isErr()) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: allBoards.error.message,
    });
    return;
  }
  if (!allBoards.value) {
    res.status(StatusCodes.NOT_FOUND).json({ message: "No boards found" });
    return;
  }
  res.status(StatusCodes.OK).json({ result: allBoards.value });
  return;
};

const DeleteBoard = async (req: Request, res: Response) => {
  const boardId = req.params.id;
  const deleteBoard = await fromPromise(
    db
      .delete(Boards)
      .where(eq(Boards.board_id, Number(boardId)))
      .returning()
      .then((res) => res[0]),
    () => new Error("Unknown Error Occured")
  );
  if (deleteBoard.isErr()) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: deleteBoard.error.message,
    });
    return;
  }
  if (!deleteBoard.value) {
    res.status(StatusCodes.NOT_FOUND).json({ message: "No boards found" });
    return;
  }
  res.status(StatusCodes.OK).json({ result: deleteBoard.value });
  return;
};

const UpdateBoard = async (req: Request, res: Response) => {
  const boardId = req.params.id;
  const { boardName, boardDescription, isVisible } = req.body;
  const updateBoard = await fromPromise(
    db
      .update(Boards)
      .set({
        name: boardName,
        description: boardDescription,
        isVisible: isVisible,
      })
      .where(eq(Boards.board_id, Number(boardId)))
      .returning()
      .then((res) => res[0]),
    () => new Error("Unknown Error Occured")
  );
  if (updateBoard.isErr()) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: updateBoard.error.message,
    });
    return;
  }
  if (!updateBoard.value) {
    res.status(StatusCodes.NOT_FOUND).json({ message: "No boards found" });
    return;
  }
  res.status(StatusCodes.OK).json({ result: updateBoard.value });
  return;
};

export const BoardController = {
  GetBoardById,
  GetAllUserBoards,
  CreateNewBoard,
  GetAllBoards,
  DeleteBoard,
  UpdateBoard,
};
