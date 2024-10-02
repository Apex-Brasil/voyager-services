import { Request } from "express";

export const tokenRequest = (req: Request) => {
  return req.headers.authorization?.split(" ")[1] ?? "";
};
