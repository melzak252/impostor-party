import { join } from "node:path";
import { createApp } from "./app";

const port = Number(process.env.PORT ?? 3000);
const hostname = process.env.HOST ?? "0.0.0.0";
const production = process.env.NODE_ENV === "production";
const appOrigin = process.env.APP_ORIGIN ?? (production ? undefined : `http://localhost:${port}`);
if (!appOrigin) throw new Error("APP_ORIGIN is required in production");
const allowSameHostOrigin = !production && !process.env.APP_ORIGIN;
const app = await createApp({ port, hostname, dbPath: process.env.DATABASE_PATH ?? join(import.meta.dir, "../data/impostor.sqlite"), appOrigin, allowSameHostOrigin });
console.log(`Impostor Party listening at ${app.url}`);
const shutdown = async () => { await app.close(); process.exit(0); };
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
