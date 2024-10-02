/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import cache from "memory-cache";

export const cacheMiddlewarre = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const cacheKey = req.originalUrl || req.url;
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    return res.status(200).send(cachedData);
  }

  next();
};
