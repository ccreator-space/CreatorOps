import cors from "cors";
import express from "express";
import path from "node:path";
import { currentUserMiddleware } from "./middleware/current-user.js";
import { errorHandler } from "./middleware/error-handler.js";
import { assignmentsRouter } from "./routes/assignments.routes.js";
import { authPublicRouter, authRouter } from "./routes/auth.routes.js";
import { healthRouter } from "./routes/health.routes.js";
import { postsRouter } from "./routes/posts.routes.js";
import { usersRouter } from "./routes/users.routes.js";
import { uploadsDirectory } from "./services/uploads.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.WEB_ORIGIN ?? "http://localhost:5173"
    })
  );
  app.use(express.json());
  app.use("/uploads", express.static(path.resolve(uploadsDirectory)));

  app.use("/health", healthRouter);
  app.use("/auth", authPublicRouter);
  app.use(currentUserMiddleware);
  app.use("/auth", authRouter);
  app.use("/assignments", assignmentsRouter);
  app.use("/users", usersRouter);
  app.use("/posts", postsRouter);
  app.use(errorHandler);

  return app;
}
