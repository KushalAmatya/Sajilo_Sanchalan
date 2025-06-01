import express from "express";
import { BoardController } from "../controllers/board-controller";
import { authMiddleware } from "@/middlewares/auth-middleware";
import { GroupController } from "../controllers/group-controller";
import { ItemController } from "@/controllers/item-controlller";
import { ItemAssignmentsController } from "@/controllers/item-assignments-controller";

const AppRouter = express.Router();

AppRouter.get(
  "/getBoardByID/:id",
  authMiddleware,
  BoardController.GetBoardById
);
AppRouter.get(
  "/getUserBoards",
  authMiddleware,
  BoardController.GetAllUserBoards
);
AppRouter.post("/createBoard", authMiddleware, BoardController.CreateNewBoard);
AppRouter.delete(
  "/deleteBoard/:id",
  authMiddleware,
  BoardController.DeleteBoard
);
AppRouter.put("/updateBoard/:id", authMiddleware, BoardController.UpdateBoard);
AppRouter.get("/getAllBoards", authMiddleware, BoardController.GetAllBoards);

AppRouter.post("/createGroup/:id", authMiddleware, GroupController.createGroup);
AppRouter.get(
  "/getAllUserGroups/:id",
  authMiddleware,
  GroupController.getAllUserGroups
);
AppRouter.get(
  "/getGroupByID/:id",
  authMiddleware,
  GroupController.getGroupById
);
AppRouter.put("/updateGroup/:id", authMiddleware, GroupController.updateGroup);
AppRouter.delete(
  "/deleteGroup/:id",
  authMiddleware,
  GroupController.deleteGroup
);

//ItemRoutes
AppRouter.get(
  "/getAllItems/:id",
  authMiddleware,
  ItemController.GetItemsByBoardId
);
AppRouter.get("/getItemByID/:id", authMiddleware, ItemController.GetItemById);
AppRouter.post("/createItem", authMiddleware, ItemController.CreateItem);
AppRouter.put("/updateItem/:id", authMiddleware, ItemController.UpdateItem);
AppRouter.delete("/deleteItem/:id", authMiddleware, ItemController.DeleteItem);

//item assignments

AppRouter.post(
  "/assignItemToUser",
  authMiddleware,
  ItemAssignmentsController.AssignItemToUser
);
AppRouter.delete(
  "/removeUserFromItem",
  authMiddleware,
  ItemAssignmentsController.RemoveUserFromItem
);
AppRouter.get(
  "/getItemAssignments/:itemId",
  authMiddleware,
  ItemAssignmentsController.GetItemAssignments
);

export { AppRouter };
