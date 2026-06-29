import cors from "cors";
import express from "express";
import { currentUserMiddleware } from "./middleware/current-user.js";
import { errorHandler } from "./middleware/error-handler.js";
import { healthRouter } from "./routes/health.routes.js";
import { postsRouter } from "./routes/posts.routes.js";
import { usersRouter } from "./routes/users.routes.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.WEB_ORIGIN ?? "http://localhost:5173"
    })
  );
  app.use(express.json());

  app.use("/health", healthRouter);
  app.use(currentUserMiddleware);
  app.use("/users", usersRouter);
  app.use("/posts", postsRouter);
  app.use(errorHandler);

  return app;
}
