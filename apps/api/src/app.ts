import cors from "cors";
import express from "express";
import { errorHandler } from "./middleware/error-handler";
import { healthRouter } from "./routes/health.routes";
import { postsRouter } from "./routes/posts.routes";
import { usersRouter } from "./routes/users.routes";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.WEB_ORIGIN ?? "http://localhost:5173"
    })
  );
  app.use(express.json());

  app.use("/health", healthRouter);
  app.use("/users", usersRouter);
  app.use("/posts", postsRouter);
  app.use(errorHandler);

  return app;
}

