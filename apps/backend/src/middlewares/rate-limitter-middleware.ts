import { Request, Response, NextFunction } from "express";
import redisClient from "@/utils/redis";

const WINDOW_SIZE_IN_SECONDS = 60;
const MAX_WINDOW_REQUEST_COUNT = 10;

export const rateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const ip = req.ip;
  const key = `rate-limit:${ip}`;
  const current = await redisClient.get(key);

  if (current && Number(current) >= MAX_WINDOW_REQUEST_COUNT) {
    res.status(429).json({ message: "Too many requests. Try again later." });
    return;
  }

  const tx = redisClient.multi();
  tx.incr(key);
  if (!current) {
    tx.expire(key, WINDOW_SIZE_IN_SECONDS);
  }
  await tx.exec();

  next();
};
