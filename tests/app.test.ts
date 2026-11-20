import { expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "../server/app";

test("createApp serves the React entry on direct invitation routes and closes cleanly", async () => {
  const directory = await mkdtemp(join(tmpdir(), "impostor-party-"));
  const app = await createApp({ port: 0, hostname: "127.0.0.1", dbPath: join(directory, "party.sqlite") });
  try {
    for (const path of ["/", "/join/ABC234", "/party/ABC234"]) {
      const response = await fetch(new URL(path, app.url));
      expect(response.status).toBe(200);
      const html = await response.text();
      expect(html).toContain("<div id=\"root\"></div>");
      expect(html).toContain("/_bun/client/index-");
    }
    expect((await fetch(new URL("/not-a-route", app.url))).status).toBe(404);
  } finally {
    await app.close();
    await rm(directory, { recursive: true, force: true });
  }
});
