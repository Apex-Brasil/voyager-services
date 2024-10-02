import "express-async-errors";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import session from "express-session";
import jwt from "jsonwebtoken";
import passport from "passport";

import { prisma } from "../prisma/prismaClient";
import { cacheMiddlewarre } from "./middlewares/cacheMiddleware";
import { errorMiddleware } from "./middlewares/error";
import { redisClient } from "./redisConfig";
import router from "./routes";
import authRouter from "./routes/authRoute";
import { CORS_ORIGIN, tokenExpiresIn } from "./utils/constants";
import { transformStringOnTimestamp } from "./utils/formatter";

const GoogleStrategy = require("passport-google-oidc");
const TwitterStrategy = require("passport-twitter");
const app = express();
app.disable("x-powered-by");
dotenv.config();

const PORT = process.env.PORT ?? 3333;

app.use(
  express.urlencoded({
    extended: true,
  }),
);
app.use(
  cors({
    origin: CORS_ORIGIN,
  }),
);
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
  }),
);
app.use(passport.authenticate("session"));
app.use(express.json());
app.use(express.static("public"));
app.get("/", (req, res) => {
  const nodeVersion = process.version;

  const tempObj = {
    message: "Server is running",
    data: {
      status: "OK",
      node: nodeVersion,
    },
  };

  res.send(tempObj);
});

passport.use(
  new TwitterStrategy(
    {
      consumerKey: process.env.TWITTER_CLIENT_ID,
      consumerSecret: process.env.TWITTER_CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL_TWITTER,
    },
    async (token: any, tokenSecret: any, profile: any, done: any) => {
      return await done(null, { id: profile.id, username: profile.username });
    },
  ),
);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL,
      scope: ["profile", "email"],
    },
    (issuer: any, profile: any, done: any) => {
      prisma.user
        .findFirst({ where: { google_id: profile.id } })
        .then((user: any) => {
          const dueDateInMiliseconds =
            transformStringOnTimestamp(tokenExpiresIn);
          const tokenDueDate = Date.now() + dueDateInMiliseconds;

          const jwtToken = jwt.sign(
            { id: profile.id },
            process.env.JWT_SECRET as string,
            { expiresIn: tokenExpiresIn },
          );
          console.log({ profile });
          if (user) {
            const userWithToken = { ...user, jwtToken, tokenDueDate };
            return done(null, userWithToken);
          } else {
            // se o usuário não existe, crie um novo usuário na base de dados
            return prisma.user
              .create({
                data: {
                  google_id: profile.id as string,
                  username: profile.displayName as string,
                  email: profile.emails[0].value as string,
                },
              })
              .then((newUser: any) => {
                const userWithToken = { ...newUser, jwtToken, tokenDueDate };
                return done(null, userWithToken);
              });
          }
        })
        .catch((err: any) => {
          return done(err);
        });
    },
  ),
);

passport.serializeUser((user: any, done) => {
  process.nextTick(() => {
    done(null, user.id);
  });
});

passport.deserializeUser((id: any, done) => {
  process.nextTick(() => {
    prisma.user
      .findFirst({ where: { id } })
      .then((user: any) => {
        done(null, user);
      })
      .catch((err: any) => {
        done(err);
      });
  });
});

app.use(cacheMiddlewarre);
app.use("/api/v1", router);
app.use("/api/v1/auth", authRouter);

// kill the process, its needed with prisma
process.on("SIGTERM", () => {
  process.exit();
});

app.use(errorMiddleware);

const startup = async () => {
  await redisClient.connect();
  app.listen(PORT, () => {
    console.log(
      `Server listening on port ${PORT}. Access it at http://localhost:${PORT}`,
    );
  });
};

startup();
