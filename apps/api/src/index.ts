import "dotenv/config";
import { createApp } from "./app";

const port = Number(process.env.API_PORT ?? 4000);
const app = createApp();

app.listen(port, () => {
  console.log(`Shipin API listening on http://localhost:${port}`);
});

