import express from "express";
import { userController } from "../controllers/user-controller";
import { validate } from "../middlewares/validation";
import { userSchema } from "../schema/user-schema";

const userRouter = express.Router();

userRouter.post(
  "/signup",
  validate.validateRequestBody(userSchema),
  userController.signup
);
userRouter.post("/login", userController.login);
userRouter.post("/refresh", userController.refresh);
userRouter.delete("/logout", userController.logout);

export { userRouter };
