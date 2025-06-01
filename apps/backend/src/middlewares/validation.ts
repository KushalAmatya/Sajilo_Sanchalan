import { RequestHandler, Request, Response, NextFunction } from "express";
import { ZodRawShape, ZodObject, ZodError } from "zod";
import { StatusCodes } from "../constants/status-codes";

export function validateRequestBody<T extends ZodRawShape>(
  schema: ZodObject<T>
): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (err) {
      console.log(err);
      let message = "Validation Failed";
      let details: unknown = {};

      if (err instanceof ZodError) {
        message = `Validation failed: ${err.issues.length} errors detected in body`;
        details = err.issues;
      }

      res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: message, details: details });
    }
  };
}

export const validate = { validateRequestBody };
