import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { fromThrowable } from "neverthrow";

export interface AuthRequest extends Request {
    user?: string | JwtPayload;
}

export const authMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const token = req.headers["authorization"];
    if (!token) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    console.log("token", token);
    const decoded = fromThrowable(
        () => jwt.verify(token, process.env.ACCESS_SECRET || "secret"),
        () => new Error("Invalid token")
    );
    console.log(decoded);
    const result = decoded();
    if (result.isErr()) {
        res.status(401).json({ message: result.error.message });
        return;
    }
    (req as AuthRequest).user = result.value;

    next();
};
