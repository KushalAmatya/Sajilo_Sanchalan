import { Request, Response } from "express";
import { StatusCodes } from "../constants/status-codes";
import { Users } from "../models/user-schema";
import { eq, and } from "drizzle-orm";
import { db } from "@/db/db";
import { fromPromise } from "neverthrow";
import _ from "lodash";
import * as argon2 from "argon2";
import jwt, { JwtPayload } from "jsonwebtoken";
import { UserTokens } from "../models/user-token-schema";
import { logger } from "@/utils/logger";

export const signup = async (req: Request, res: Response) => {
    const { name, email, password, role } = req.body;

    const isUserPresent = await fromPromise(
        db
            .select({ name: Users.name })
            .from(Users)
            .where(eq(Users.name, name))
            .limit(1),
        (err) => {
            console.error("Actual DB error caught:", err);
            return new Error("Error checking if user exists");
        }
    );
    console.log("isUserPresent", isUserPresent);

    if (isUserPresent.isErr()) {
        console.error("Database error:", isUserPresent.error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: isUserPresent.error.message,
        });
        return;
    }

    if (!_.isEmpty(isUserPresent.value)) {
        res.status(StatusCodes.CONFLICT).json({
            message: "User already exists",
        });
        return;
    }

    const hashedPassword = await fromPromise(
        argon2.hash(password),
        () => new Error(" Password Hashing Error!!")
    );

    if (hashedPassword.isErr()) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: hashedPassword.error.message,
        });

        return;
    }

    const hashedPasswordResult = hashedPassword.value as string;

    const newUser = await fromPromise(
        db.insert(Users).values({
            name: name,
            email: email,
            password: hashedPasswordResult,
            role: role,
        }),
        (e) => {
            console.log(e);
            return new Error("Error! While Inserting Data");
        }
    );

    if (newUser.isErr()) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: newUser.error.message,
        });
        return;
    }

    res.status(StatusCodes.OK).json({ message: "User Added Successfully" });
};

export const login = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(StatusCodes.BAD_REQUEST).json({
            message: "Email and password are required.",
        });
        return;
    }

    const userResult = await fromPromise(
        db.select().from(Users).where(eq(Users.email, email)).limit(1),
        () => new Error("Error fetching user data")
    );

    if (userResult.isErr()) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: userResult.error.message,
        });
        return;
    }

    const user = _.first(userResult.value);
    if (!user) {
        res.status(StatusCodes.UNAUTHORIZED).json({
            message: "Invalid credentials",
        });
        return;
    }

    const passwordResult = await fromPromise(
        argon2.verify(user.password, password),
        () => new Error("Invalid User Credentials")
    );

    if (passwordResult.isErr() || !passwordResult.value) {
        res.status(StatusCodes.UNAUTHORIZED).json({
            message: "Invalid User Credentials!",
        });
    }
    console.log(process.env.ACCESS_TOKEN_EXPIRES_IN);
    const accessToken = jwt.sign(
        {
            id: user.id,
        },
        process.env.ACCESS_SECRET,
        {
            expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN),
        }
    );

    const refreshToken = jwt.sign(
        {
            id: user.id,
        },
        process.env.REFRESH_SECRET,
        {
            expiresIn: Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
        }
    );

    res.cookie("refresh-token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    const tokenTransaction = await fromPromise(
        db.transaction(async (tx) => {
            await tx.insert(UserTokens).values({
                userId: user.id,
                token: refreshToken,
                expiresOn: new Date(
                    Date.now() + Number(process.env.REFRESH_TOKEN_EXPIRES_IN)
                ),
            });
            await tx
                .update(Users)
                .set({ lastLoggedIn: new Date(Date.now()) })
                .where(eq(Users.id, user.id));
        }),
        () => new Error("Error inserting user token")
    );
    if (tokenTransaction.isErr()) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: tokenTransaction.error.message,
        });
        return;
    }

    res.status(StatusCodes.OK).json({
        message: "Login successful",
        accessToken: accessToken,
    });

    logger.info("LoggedIn", {
        email: email,
        userId: user.id,
    });
    // res
    //   .status(StatusCodes.INTERNAL_SERVER_ERROR)
    //   .json({ message: "Token generation failed" });
};

export const refresh = async (req: Request, res: Response) => {
    const refreshToken = req.cookies["refresh-token"];
    const decodedToken = jwt.decode(refreshToken as string);
    if (
        !decodedToken ||
        typeof decodedToken !== "object" ||
        !("id" in decodedToken)
    ) {
        res.status(401).json({ error: "Invalid token payload." });
        return;
    }

    const userId = (decodedToken as JwtPayload).id;
    const dbRefreshToken = await fromPromise(
        db
            .select({
                userId: UserTokens.userId,
                token: UserTokens.token,
            })
            .from(UserTokens)
            .where(
                and(
                    eq(UserTokens.userId, userId),
                    eq(UserTokens.token, refreshToken)
                )
            )
            .then((res) => res[0]),
        () => new Error("Error fetching refresh token")
    );
    if (dbRefreshToken.isErr()) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: dbRefreshToken.error.message,
        });
        return;
    }
    if (refreshToken !== dbRefreshToken.value.token) {
        res.status(StatusCodes.UNAUTHORIZED).json({ message: "Invalid token" });
        return;
    }
    const newAccessToken = jwt.sign(
        {
            id: userId,
        },
        process.env.ACCESS_SECRET,
        {
            expiresIn: parseInt(process.env.ACCESS_TOKEN_EXPIRES_IN),
        }
    );
    const newRefreshToken = jwt.sign(
        {
            id: userId,
        },
        process.env.REFRESH_SECRET,
        {
            expiresIn: parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN),
        }
    );
    const tokenTransaction = await fromPromise(
        db.transaction(async (tx) => {
            await tx
                .delete(UserTokens)
                .where(
                    and(
                        eq(UserTokens.userId, userId),
                        eq(UserTokens.token, refreshToken)
                    )
                );

            await tx.insert(UserTokens).values({
                userId: userId,
                token: newRefreshToken,
                expiresOn: new Date(
                    Date.now() + Number(process.env.REFRESH_TOKEN_EXPIRES_IN)
                ),
            });
        }),
        () => new Error("Error inserting new refresh token")
    );
    if (tokenTransaction.isErr()) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: tokenTransaction.error.message,
        });
        return;
    }
    res.clearCookie("refresh-token");
    res.cookie("refresh-token", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(StatusCodes.OK).json({
        message: "Token refreshed successfully",
        accessToken: newAccessToken,
    });
    return;
};

export const logout = async (req: Request, res: Response) => {
    const refreshToken = req.cookies["refresh-token"];
    console.log("refreshToken", refreshToken);
    if (!refreshToken) {
        res.status(StatusCodes.UNAUTHORIZED).json({
            message: "No token provided",
        });
        return;
    }

    const decodedToken = jwt.decode(refreshToken);
    if (!decodedToken) {
        res.status(StatusCodes.UNAUTHORIZED).json({ message: "Invalid token" });
        return;
    }
    if (typeof decodedToken !== "object" || !("id" in decodedToken)) {
        res.status(StatusCodes.UNAUTHORIZED).json({ message: "Invalid token" });
        return;
    }
    const userId = (decodedToken as JwtPayload).id;
    console.log("decodedToken", decodedToken);
    const deleteToken = await fromPromise(
        db.delete(UserTokens).where(eq(UserTokens.userId, Number(userId))),
        () => new Error("Error deleting token")
    );
    if (deleteToken.isErr()) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: deleteToken.error.message,
        });
        return;
    }

    res.clearCookie("refresh-token");
    res.status(StatusCodes.OK).json({ message: "Logged out successfully" });
};
export const userController = { login, signup, refresh, logout };
