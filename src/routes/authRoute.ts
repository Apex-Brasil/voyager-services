/* eslint-disable camelcase */
import express from "express";
import jwt from "jsonwebtoken";
import passport from "passport";

import { prisma } from "../../prisma/prismaClient";
import { tokenExpiresIn } from "../utils/constants";
import { transformStringOnTimestamp } from "../utils/formatter";
import { tokenRequest } from "../utils/tokenRequest";

const router = express.Router();

router.get("/google", passport.authenticate("google"));
router.get("/twitter", passport.authenticate("twitter"));

router.get(
  "/oauth2/redirect/google",
  passport.authenticate("google", {
    failureRedirect: "/login",
    failureMessage: true,
  }),
  (req: any, res) => {
    const token = req.user.jwtToken;
    const dueDate = req.user.tokenDueDate;
    res.redirect(`${process.env.FRONT_URL}?token=${token}&dueDate=${dueDate}`);
  },
);

router.get(
  "/twitter/callback",
  passport.authenticate("twitter", {
    failureRedirect: "/login",
    failureMessage: true,
  }),
  (req: any, res) => {
    const id = req.user.id;
    const username = req.user.username;
    res.redirect(
      `${process.env.FRONT_URL}?twitter_id=${id}&twitter_username=${username}`,
    );
  },
);

router.get("/logout", (req, res, next) => {
  req.logout(err => {
    if (err) {
      return next(err);
    }
    res.redirect(process.env.FRONT_URL as string);
  });
});

router.post("/termsaccepted", async (req, res) => {
  try {
    if (req.headers.authorization) {
      const token = tokenRequest(req);
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);

      const user = await prisma.user.findFirst({
        where: { google_id: decoded.id },
      });

      if (user?.terms_accepted) {
        return res.status(400).json({ error: "Terms Already Accepted" });
      }

      if (user) {
        const newUser = await prisma.user.update({
          where: { google_id: decoded.id },
          data: {
            terms_accepted: true,
          },
        });

        const tempUser = {
          ...user,
          twitter_id: newUser.twitter_id,
          twitter_username: newUser.twitter_username,
        };

        return res.status(200).json(tempUser);
      }

      return res.status(400).json({ error: "User not found" });
    }
    return res.status(400).json({ error: "User not authenticaded" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/token", async (req, res) => {
  try {
    if (req.headers.authorization) {
      const token = tokenRequest(req);
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);

      const user = await prisma.user.findFirst({
        where: { google_id: decoded.id },
      });

      if (user) {
        const tempUser = {
          username: user.username,
          email: user.email,
          account: user.account,
          permission: user.permission,
          twitter_id: user.twitter_id,
          twitter_username: user.twitter_username,
          terms_accepted: user.terms_accepted,
        };

        // Generate New Token and replace on db
        const dueDateInMiliseconds = transformStringOnTimestamp(tokenExpiresIn);
        const tokenDueDate = Date.now() + dueDateInMiliseconds;

        const jwtToken = jwt.sign(
          { id: user.google_id },
          process.env.JWT_SECRET as string,
          { expiresIn: tokenExpiresIn },
        );

        const userAndNewToken = {
          tempUser,
          newToken: { token: jwtToken, dueDate: tokenDueDate },
        };

        return res.status(200).json(userAndNewToken);
      }

      return res.status(400).json({ error: "User not found" });
    }

    return res.status(400).json({ error: "User not authenticaded" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/connecttwitter", async (req, res) => {
  try {
    if (req.headers.authorization) {
      const token = tokenRequest(req);
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);

      const { twitter_username, twitter_id } = req.body;

      const user = await prisma.user.findFirst({
        where: { google_id: decoded.id },
      });

      const twitterUsername = await prisma.user.findFirst({
        where: { twitter_username },
      });

      const twitterId = await prisma.user.findFirst({
        where: { twitter_id },
      });

      if (twitterUsername || twitterId) {
        return res.status(400).json({ error: "Twitter already linked" });
      }

      if (user && !user.twitter_id && !user.twitter_username) {
        const newUser = await prisma.user.update({
          where: { google_id: decoded.id },
          data: {
            twitter_username,
            twitter_id,
          },
        });

        const tempUser = {
          ...user,
          twitter_id: newUser.twitter_id,
          twitter_username: newUser.twitter_username,
        };

        return res.status(200).json(tempUser);
      }

      return res.status(400).json({ error: "User not found" });
    }
    return res.status(400).json({ error: "User not authenticaded" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/wax", async (req, res) => {
  try {
    const { account, permission, email } = req.body;

    const user = await prisma.user.findFirst({
      where: { email },
    });

    const userAccount = await prisma.user.findFirst({
      where: { account },
    });

    if (userAccount) {
      return res.status(400).json({ error: "Account already exists" });
    }

    if (user && !user.account && !user.permission) {
      const newUser = await prisma.user.update({
        where: { email },
        data: {
          account,
          permission,
        },
      });

      const tempUser = {
        username: newUser.username,
        email: newUser.email,
        account: newUser.account,
        permission: newUser.permission,
      };

      return res.status(200).json(tempUser);
    }

    return res.status(400).json({ error: "User not found" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
