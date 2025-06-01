import z from "zod";
import argon2 from "argon2";

export const userSchema = z.object({
  name: z.string().min(1).max(20),
  email: z.string().email({ message: "Invalid Email Address" }),
  password: z
    .string({ message: "Password is required" })
    .min(8, { message: "Password must be at least 8 characters long" }),
  role: z.string().optional(),
});

export type InputUserSchema = z.infer<typeof userSchema>;
