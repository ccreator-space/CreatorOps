import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);

config({
  path: path.resolve(currentDirectory, "../../../.env")
});
config();

const { createApp } = await import("./app.js");

const port = Number(process.env.API_PORT ?? 4000);
const app = createApp();

app.listen(port, () => {
  console.log(`CreatorOps API listening on http://localhost:${port}`);
});
