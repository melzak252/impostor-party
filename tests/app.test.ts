import { expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "../server/app";
import { setApprovedSuggestions } from "../server/questions";

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
    setApprovedSuggestions([]);
    await app.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test("suggestion box queues submissions and ADMIN_TOKEN approves them into the catalog", async () => {
  const directory = await mkdtemp(join(tmpdir(), "impostor-suggestions-"));
  const adminToken = "test-admin-secret-token";
  const app = await createApp({
    port: 0,
    hostname: "127.0.0.1",
    dbPath: join(directory, "party.sqlite"),
    allowSameHostOrigin: true,
    adminToken,
  });
  try {
    const origin = new URL(app.url).origin;
    const headers = { "Content-Type": "application/json", Origin: origin };

    // Link blocked
    const linkRes = await fetch(new URL("/api/suggestions", app.url), {
      method: "POST",
      headers,
      body: JSON.stringify({ topic: "friends", language: "en", spicy: false, text: "Check https://spam.example.com now" }),
    });
    expect(linkRes.status).toBe(400);

    // Honeypot silently accepted without storing
    const botRes = await fetch(new URL("/api/suggestions", app.url), {
      method: "POST",
      headers,
      body: JSON.stringify({ topic: "friends", language: "en", spicy: false, text: "Bot question text here?", honeypot: "http://bot" }),
    });
    expect(botRes.status).toBe(201);

    // Valid suggestion
    const text = "Who at this table always forgets their keys?";
    const okRes = await fetch(new URL("/api/suggestions", app.url), {
      method: "POST",
      headers,
      body: JSON.stringify({ topic: "friends", language: "en", spicy: false, text }),
    });
    expect(okRes.status).toBe(201);
    const created = (await okRes.json()) as { ok: boolean; id: string };

    // Duplicate rejected
    const dupRes = await fetch(new URL("/api/suggestions", app.url), {
      method: "POST",
      headers,
      body: JSON.stringify({ topic: "friends", language: "en", spicy: false, text }),
    });
    expect(dupRes.status).toBe(409);

    // Admin auth required
    expect((await fetch(new URL("/api/admin/suggestions", app.url))).status).toBe(401);
    expect((await fetch(new URL("/api/admin/suggestions", app.url), {
      headers: { Authorization: "Bearer wrong" },
    })).status).toBe(401);

    // Admin lists pending (honeypot was not stored)
    const listRes = await fetch(new URL("/api/admin/suggestions?status=pending", app.url), {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(listRes.status).toBe(200);
    const listed = (await listRes.json()) as { suggestions: Array<{ id: string; text: string }> };
    expect(listed.suggestions.length).toBe(1);
    expect(listed.suggestions[0]!.text).toBe(text);

    // Admin approves -> appears in /api/questions
    const approveRes = await fetch(new URL(`/api/admin/suggestions/${created.id}`, app.url), {
      method: "PATCH",
      headers: { ...headers, Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: "approved" }),
    });
    expect(approveRes.status).toBe(200);

    const catalogRes = await fetch(new URL("/api/questions", app.url));
    const catalog = (await catalogRes.json()) as { questions: Array<{ text: string }> };
    expect(catalog.questions.some((q) => q.text === text)).toBe(true);
  } finally {
    setApprovedSuggestions([]);
    await app.close();
    await rm(directory, { recursive: true, force: true });
  }
});
