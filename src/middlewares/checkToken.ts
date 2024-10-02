import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { tokenRequest } from "../utils/tokenRequest";

export const checkTokenMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.headers.authorization) {
    const token = tokenRequest(req);
    try {
      jwt.verify(token, process.env.JWT_SECRET as string);
      next();
    } catch (err) {
      return console.log(err);
    }
  } else {
    return res.status(401).json({ error: "User not authenticaded" });
  }
};
