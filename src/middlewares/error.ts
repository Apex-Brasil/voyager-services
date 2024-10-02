/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";

import { ApiError } from "../errors";

export const errorMiddleware = (
  error: Error & Partial<ApiError>,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.log(error);
  const statusCode = error.statusCode ?? 500;
  const message = error.message ? error.message : "Internal Server Error";

  return res.status(statusCode).json({ message });
};
