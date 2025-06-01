import { Request, Response } from "express";
import { CustomPayload } from "./board-controller";
import { db } from "../db/db";
import { Groups } from "../models/group-schema";
import { eq, like, or, and, ilike } from "drizzle-orm";
import { fromPromise } from "neverthrow";
import { StatusCodes } from "../constants/status-codes";
import { Users } from "../models/user-schema";
import { logger } from "../utils/logger";

const getGroupById = async (req: Request, res: Response) => {
    const groupId = req.params.id;
    if (!groupId) {
        res.status(StatusCodes.NOT_FOUND).send({
            message: "Group Id Not Found",
        });
    }
    const findGroup = await fromPromise(
        db
            .select()
            .from(Groups)
            .where(eq(Groups.group_id, Number(groupId)))
            .then((row) => row[0]),
        () => new Error("Unknown Error Occured")
    );

    if (findGroup.isErr()) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: findGroup.error.message,
        });
        logger.error("GetGroupById DB Error", findGroup.error.message);
        return;
    }
    if (!findGroup.value) {
        res.status(StatusCodes.NOT_FOUND).json({
            message: "Group Not Found",
        });
    }

    res.status(StatusCodes.OK).json({ result: findGroup.value });
    logger.info("getGroupById Api hit", findGroup.value);
};

const getAllUserGroups = async (req: Request, res: Response) => {
    const searchParams = req.query;
    const query = searchParams.search
        ? String(searchParams.search).toLowerCase()
        : undefined;
    const b_id = req.params.id;
    const checkSearch = query ? ilike(Groups.name, `%${query}%`) : undefined;
    console.log("check query", query, checkSearch, "asdasd", b_id);
    const getAllGroups = await fromPromise(
        db
            .select()
            .from(Groups)
            .where(and(eq(Groups.board_id, Number(b_id)), checkSearch)),
        (err) => {
            console.log(err, "yyyyy");

            return new Error("Unknown Error Occured");
        }
    );

    if (getAllGroups.isErr()) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: getAllGroups.error.message,
        });
        logger.error("GetALL User Groups DB Error", getAllGroups.error.message);
        return;
    }

    if (!getAllGroups.value) {
        res.status(StatusCodes.NOT_FOUND).json({
            message: "Group Not Found",
        });
    }

    res.status(StatusCodes.OK).json({ result: getAllGroups.value });
    logger.info(" Hit get all user api", getAllGroups.value);
};

const getAllGroups = async (req: Request, res: Response) => {
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
        logger.info("GetAllGroups DB Error", userRole.error.message);
        return;
    }

    if (userRole.value.role !== "Admin") {
        res.status(StatusCodes.FORBIDDEN).json({ message: "User not Allowed" });
    }

    const queryString = searchParams.search
        ? String(searchParams).toLowerCase()
        : undefined;
    const queryCheck = queryString
        ? ilike(Groups.name, `%${queryString}%`)
        : undefined;

    const allGroups = await fromPromise(
        db.select().from(Groups).where(queryCheck),
        () => new Error("Unknown Error Occured")
    );
    if (!allGroups.isOk()) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: allGroups.error.message,
        });
        return;
    }
    if (!allGroups.value) {
        res.status(StatusCodes.NOT_FOUND).json({ message: "No Groups Found" });
    }

    res.status(StatusCodes.OK).json({ result: allGroups.value });
    logger.info("Hit GetAllGroups Api", allGroups.value);
};

const createGroup = async (req: Request, res: Response) => {
    const { groupName, color } = req.body;
    const board = req.params.id;
    console.log("asdasd", board);
    const newGroup = await fromPromise(
        db
            .insert(Groups)
            .values({
                board_id: Number(board),
                name: groupName,
                color: color,
            })
            .returning()
            .then((res) => res[0]),
        () => new Error("Unknown Error Occured")
    );

    if (newGroup.isErr()) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: newGroup.error.message,
        });
        return;
    }

    res.status(StatusCodes.CREATED).json({
        result: newGroup.value,
        message: "Data Created Successfully",
    });
    logger.info("User Creation Api Hit", newGroup.value);
};

const updateGroup = async (req: Request, res: Response) => {
    const { name, color } = req.body;
    const groupId = req.params.id;

    const updatedGroup = await fromPromise(
        db
            .update(Groups)
            .set({ name, color })
            .where(eq(Groups.group_id, Number(groupId)))
            .returning()
            .then((res) => res[0]),
        () => new Error("Unknown Error Occured!!")
    );

    if (updatedGroup.isErr()) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: updatedGroup.error.message,
        });
        logger.error("Updated Group DB Error", updatedGroup.error.message);
        return;
    }

    if (!updatedGroup.value) {
        res.status(StatusCodes.NOT_FOUND).json({ message: "Board not found" });
        return;
    }

    res.status(StatusCodes.OK).json({
        result: updatedGroup.value,
        message: "Data Updated Successfully",
    });
    logger.info("Updated Group Api Hit", updatedGroup);
};

const deleteGroup = async (req: Request, res: Response) => {
    const groupId = req.params.id;

    const deletedGroup = await fromPromise(
        db
            .delete(Groups)
            .where(eq(Groups.group_id, Number(groupId)))
            .returning()
            .then((res) => res[0]),
        () => new Error("Unknown Error Occured")
    );

    if (deletedGroup.isErr()) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: deletedGroup.error.message,
        });
        logger.info("Deleted Group DB Error", deletedGroup.error.message);
        return;
    }

    if (!deletedGroup.value) {
        res.status(StatusCodes.NOT_FOUND).json({
            message: "Deletion Id Not Found",
        });
        return;
    }

    res.status(StatusCodes.OK).json({
        result: deletedGroup.value,
        message: "Groups Deleted Successfully",
    });
    logger.info("Group Delete Api Hit", deletedGroup.value);
};

export const GroupController = {
    createGroup,
    getAllGroups,
    getGroupById,
    deleteGroup,
    updateGroup,
    getAllUserGroups,
};
