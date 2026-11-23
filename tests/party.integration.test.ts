import { expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "../server/app";

type JsonResponse = { response: Response; body: unknown };

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("Expected an object response");
  return value as Record<string, unknown>;
}

function field(value: unknown, name: string): unknown {
  return record(value)[name];
}

function stringField(value: unknown, name: string): string {
  const result = field(value, name);
  if (typeof result !== "string") throw new Error(`Expected ${name} to be a string`);
  return result;
}
function numberField(value: unknown, name: string): number {
  const result = field(value, name);
  if (typeof result !== "number") throw new Error(`Expected ${name} to be a number`);
  return result;
}

function arrayField(value: unknown, name: string): unknown[] {
  const result = field(value, name);
  if (!Array.isArray(result)) throw new Error(`Expected ${name} to be an array`);
  return result;
}

function snapshot(response: JsonResponse): Record<string, unknown> {
  return record(field(response.body, "snapshot"));
}

function errorCode(response: JsonResponse): string {
  return stringField(field(response.body, "error"), "code");
}

function playerColors(snapshotValue: unknown): string[] {
  return arrayField(snapshotValue, "players").map((player) => stringField(player, "colorId"));
}

async function jsonRequest(app: { url: string }, path: string, options: { method?: string; cookie?: string; body?: unknown } = {}): Promise<JsonResponse> {
  const response = await fetch(new URL(path, app.url), {
    method: options.method ?? "GET",
    headers: {
      ...(options.method && options.method !== "GET" ? { Origin: app.url } : {}),
      ...(options.cookie ? { Cookie: options.cookie } : {}),
      ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
  });
  const body: unknown = await response.json();
  return { response, body };
}

async function makeSession(app: { url: string }) {
  const { response, body } = await jsonRequest(app, "/api/session", { method: "POST", body: {} });
  expect(response.status).toBe(200);
  const setCookie = response.headers.get("set-cookie");
  expect(setCookie).toContain("impostor_session=");
  expect(setCookie).toContain("HttpOnly");
  expect(setCookie).toContain("SameSite=Lax");
  expect(setCookie).toContain("Path=/");
  expect(setCookie).toContain("Max-Age=2592000");
  return { cookie: setCookie!.split(";", 1)[0]!, body };
}

async function createParty(app: { url: string }, cookie: string, name: string, visibility: "private" | "public") {
  return jsonRequest(app, "/api/parties", { method: "POST", cookie, body: { name, visibility } });
}
const BunClientWebSocket = WebSocket as unknown as {
  new (url: string | URL, options: { headers: Record<string, string> }): WebSocket;
};

async function connectPartySocket(app: { url: string }, cookie: string, code: string, origin = app.url, forgedPlayerId?: string): Promise<WebSocket> {
  const socketUrl = new URL(`/ws?code=${encodeURIComponent(code)}`, app.url);
  if (forgedPlayerId) socketUrl.searchParams.set("playerId", forgedPlayerId);
  socketUrl.protocol = socketUrl.protocol === "https:" ? "wss:" : "ws:";
  const { promise, resolve, reject } = Promise.withResolvers<WebSocket>();
  // Bun's client-only headers option is a runtime extension to the DOM WebSocket type.
  const socket = new BunClientWebSocket(socketUrl, { headers: { Cookie: cookie, Origin: origin } });
  let settled = false;
  socket.addEventListener("message", (event) => {
    if (typeof event.data !== "string") return;
    let eventType: unknown;
    try {
      eventType = field(JSON.parse(event.data), "type");
    } catch {
      return;
    }
    if (eventType === "removed") {
      socket.close();
      return;
    }
    if (settled || eventType !== "snapshot") return;
    settled = true;
    resolve(socket);
  });
  socket.addEventListener("error", () => {
    if (settled) return;
    settled = true;
    reject(new Error("Party WebSocket connection failed"));
  }, { once: true });
  socket.addEventListener("close", () => {
    if (settled) return;
    settled = true;
    reject(new Error("Party WebSocket closed before its initial snapshot"));
  }, { once: true });
  return promise;
}
async function closePartySocket(socket: WebSocket): Promise<void> {
  if (socket.readyState === WebSocket.CLOSED) return;
  const { promise, resolve } = Promise.withResolvers<void>();
  socket.addEventListener("close", () => resolve(), { once: true });
  socket.close();
  await promise;
}

test("a public party is discoverable only while its host has an authenticated socket", async () => {
  const directory = await mkdtemp(join(tmpdir(), "impostor-party-api-"));
  const app = await createApp({ port: 0, hostname: "127.0.0.1", dbPath: join(directory, "party.sqlite") });
  try {
    const host = await makeSession(app);
    const created = await createParty(app, host.cookie, "Host", "public");
    expect(created.response.status).toBe(201);
    const code = stringField(snapshot(created), "code");

    expect(field((await jsonRequest(app, "/api/parties")).body, "parties")).toEqual([]);
    const socket = await connectPartySocket(app, host.cookie, code);
    const listing = await jsonRequest(app, "/api/parties");
    expect(field(listing.body, "parties")).toEqual([{ code, hostName: "Host", playerCount: 1, maxPlayers: 8 }]);

    await closePartySocket(socket);
    expect(field((await jsonRequest(app, "/api/parties")).body, "parties")).toEqual([]);
  } finally {
    await app.close();
    await rm(directory, { recursive: true, force: true });
  }
});


test("independent cookie sessions create and join parties without leaking private rooms", async () => {
  const directory = await mkdtemp(join(tmpdir(), "impostor-party-api-"));
  const app = await createApp({ port: 0, hostname: "127.0.0.1", dbPath: join(directory, "party.sqlite") });
  try {
    const host = await makeSession(app);
    const guest = await makeSession(app);
    expect(host.cookie).not.toBe(guest.cookie);

    const created = await createParty(app, host.cookie, " Host ", "private");
    expect(created.response.status).toBe(201);
    const hostSnapshot = snapshot(created);
    expect(arrayField(hostSnapshot, "players")).toHaveLength(1);
    expect(stringField(arrayField(hostSnapshot, "players")[0], "name")).toBe("Host");
    expect(playerColors(hostSnapshot)).toEqual(["coral"]);
    expect(field(host.body, "currentPartyCode")).toBeNull();
    const code = stringField(hostSnapshot, "code");

    const listing = await jsonRequest(app, "/api/parties");
    expect(field(listing.body, "parties")).toEqual([]);

    const denied = await jsonRequest(app, `/api/parties/${code}`, { cookie: guest.cookie });
    expect(denied.response.status).toBe(403);
    expect(errorCode(denied)).toBe("NOT_MEMBER");
    const resumedSession = await jsonRequest(app, "/api/session", { method: "POST", cookie: host.cookie, body: {} });
    expect(resumedSession.response.status).toBe(200);
    expect(field(resumedSession.body, "currentPartyCode")).toBe(code);
    const secondParty = await createParty(app, host.cookie, "Host", "public");
    expect(secondParty.response.status).toBe(409);
    expect(errorCode(secondParty)).toBe("ALREADY_IN_PARTY");
    const pastedCode = `${code.slice(0, 3).toLowerCase()}-${code.slice(3).toLowerCase()}`;

    const joined = await jsonRequest(app, `/api/parties/${pastedCode}/join`, {
      method: "POST", cookie: guest.cookie, body: { name: "Guest" },
    });
    expect(joined.response.status).toBe(200);
    expect(arrayField(snapshot(joined), "players")).toHaveLength(2);
    expect(playerColors(snapshot(joined))).toEqual(["coral", "amber"]);
    expect(field(snapshot(joined), "selfId")).not.toBe(field(hostSnapshot, "selfId"));

    const resumed = await jsonRequest(app, `/api/parties/${code}/join`, {
      method: "POST", cookie: guest.cookie, body: { name: "Different name" },
    });
    expect(resumed.response.status).toBe(200);
    const resumedSnapshot = snapshot(resumed);
    expect(arrayField(resumedSnapshot, "players")).toHaveLength(2);
    expect(field(resumedSnapshot, "selfId")).toBe(field(snapshot(joined), "selfId"));
    expect(arrayField(resumedSnapshot, "players").map((player) => stringField(player, "name"))).toEqual(["Host", "Guest"]);

    const current = await jsonRequest(app, `/api/parties/${code}`, { cookie: host.cookie });
    expect(current.response.status).toBe(200);
    expect(JSON.stringify(current.body)).not.toContain("sessionHash");
  } finally {
    await app.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test("public discovery is minimal and colour conflicts and voluntary leave are atomic", async () => {
  const directory = await mkdtemp(join(tmpdir(), "impostor-party-api-"));
  const app = await createApp({ port: 0, hostname: "127.0.0.1", dbPath: join(directory, "party.sqlite") });
  let hostSocket: WebSocket | undefined;
  try {
    const host = await makeSession(app);
    const guest = await makeSession(app);
    const created = await createParty(app, host.cookie, "Host", "public");
    expect(created.response.status).toBe(201);
    const code = stringField(snapshot(created), "code");

    hostSocket = await connectPartySocket(app, host.cookie, code);
    const joined = await jsonRequest(app, `/api/parties/${code}/join`, {
      method: "POST", cookie: guest.cookie, body: { name: "Guest" },
    });
    expect(joined.response.status).toBe(200);
    expect(hostSocket.readyState).toBe(WebSocket.OPEN);

    const listing = await jsonRequest(app, "/api/parties");
    expect(field(listing.body, "parties")).toEqual([{ code, hostName: "Host", playerCount: 2, maxPlayers: 8 }]);
    expect(JSON.stringify(listing.body)).not.toContain("Guest");

    const colorConflict = await jsonRequest(app, `/api/parties/${code}/actions`, {
      method: "POST", cookie: guest.cookie,
      body: { expectedPhase: "lobby", roundId: null, action: { type: "set_color", colorId: "coral" } },
    });
    expect(colorConflict.response.status).toBe(409);
    expect(errorCode(colorConflict)).toBe("COLOR_TAKEN");
    expect(field(colorConflict.body, "snapshot")).toBeUndefined();

    const stillMember = await jsonRequest(app, `/api/parties/${code}`, { cookie: guest.cookie });
    expect(playerColors(snapshot(stillMember))).toEqual(["coral", "amber"]);

    const left = await jsonRequest(app, `/api/parties/${code}/actions`, {
      method: "POST", cookie: host.cookie,
      body: { expectedPhase: "lobby", roundId: null, action: { type: "leave" } },
    });
    expect(left.response.status).toBe(200);
    expect(left.body).toEqual({ left: true });

    const guestSnapshot = await jsonRequest(app, `/api/parties/${code}`, { cookie: guest.cookie });
    expect(guestSnapshot.response.status).toBe(200);
    expect(field(snapshot(guestSnapshot), "hostId")).toBe(field(snapshot(guestSnapshot), "selfId"));
    const formerHost = await jsonRequest(app, `/api/parties/${code}`, { cookie: host.cookie });
    expect(formerHost.response.status).toBe(403);
    expect(errorCode(formerHost)).toBe("NOT_MEMBER");
  } finally {
    await app.close();
    await rm(directory, { recursive: true, force: true });
  }
});
test("only the host changes lobby settings and a kicked session cannot rejoin", async () => {
  const directory = await mkdtemp(join(tmpdir(), "impostor-party-api-"));
  const app = await createApp({ port: 0, hostname: "127.0.0.1", dbPath: join(directory, "party.sqlite") });
  try {
    const host = await makeSession(app);
    const guest = await makeSession(app);
    const created = await createParty(app, host.cookie, "Host", "private");
    const code = stringField(snapshot(created), "code");
    const joined = await jsonRequest(app, `/api/parties/${code}/join`, {
      method: "POST", cookie: guest.cookie, body: { name: "Guest" },
    });
    const guestId = stringField(arrayField(snapshot(joined), "players")[1], "id");
    const settings = { visibility: "public", questionRevealMode: "auto", questionSource: "mixed" };

    const deniedSettings = await jsonRequest(app, `/api/parties/${code}/actions`, {
      method: "POST", cookie: guest.cookie,
      body: { expectedPhase: "lobby", roundId: null, action: { type: "set_settings", settings } },
    });
    expect(deniedSettings.response.status).toBe(403);
    expect(errorCode(deniedSettings)).toBe("FORBIDDEN");

    const changedSettings = await jsonRequest(app, `/api/parties/${code}/actions`, {
      method: "POST", cookie: host.cookie,
      body: { expectedPhase: "lobby", roundId: null, action: { type: "set_settings", settings } },
    });
    expect(changedSettings.response.status).toBe(200);
    expect(field(snapshot(changedSettings), "settings")).toEqual(settings);

    const kicked = await jsonRequest(app, `/api/parties/${code}/actions`, {
      method: "POST", cookie: host.cookie,
      body: { expectedPhase: "lobby", roundId: null, action: { type: "kick", playerId: guestId } },
    });
    expect(kicked.response.status).toBe(200);
    expect(arrayField(snapshot(kicked), "players")).toHaveLength(1);

    const rejoin = await jsonRequest(app, `/api/parties/${code}/join`, {
      method: "POST", cookie: guest.cookie, body: { name: "Guest" },
    });
    expect(rejoin.response.status).toBe(403);
    expect(errorCode(rejoin)).toBe("KICKED");
  } finally {
    await app.close();
    await rm(directory, { recursive: true, force: true });
  }
});


test("mutation routes require the matching Origin and reject malformed or oversized bodies", async () => {
  const directory = await mkdtemp(join(tmpdir(), "impostor-party-api-"));
  const app = await createApp({ port: 0, hostname: "127.0.0.1", dbPath: join(directory, "party.sqlite") });
  try {
    const noOrigin = await fetch(new URL("/api/session", app.url), {
      method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
    });
    expect(noOrigin.status).toBe(403);
    expect(errorCode({ response: noOrigin, body: await noOrigin.json() })).toBe("FORBIDDEN");

    const wrongOrigin = await fetch(new URL("/api/session", app.url), {
      method: "POST", headers: { Origin: "https://elsewhere.invalid", "Content-Type": "application/json" }, body: "{}",
    });
    expect(wrongOrigin.status).toBe(403);

    const badJson = await fetch(new URL("/api/session", app.url), {
      method: "POST", headers: { Origin: app.url, "Content-Type": "application/json" }, body: "{",
    });
    expect(badJson.status).toBe(400);
    expect(errorCode({ response: badJson, body: await badJson.json() })).toBe("VALIDATION_ERROR");

    const tooLarge = await fetch(new URL("/api/session", app.url), {
      method: "POST", headers: { Origin: app.url, "Content-Type": "application/json" }, body: JSON.stringify({ padding: "x".repeat(16_385) }),
    });
    expect(tooLarge.status).toBe(400);
    expect(errorCode({ response: tooLarge, body: await tooLarge.json() })).toBe("VALIDATION_ERROR");
  } finally {
    await app.close();
    await rm(directory, { recursive: true, force: true });
  }
});
test("a restarted app recovers the same session and reserved party seat", async () => {
  const directory = await mkdtemp(join(tmpdir(), "impostor-party-recovery-"));
  const dbPath = join(directory, "party.sqlite");
  let app = await createApp({ port: 0, hostname: "127.0.0.1", dbPath });
  try {
    const { cookie } = await makeSession(app);
    const created = await createParty(app, cookie, "Recoverable host", "private");
    expect(created.response.status).toBe(201);
    const before = snapshot(created);
    const code = stringField(before, "code");
    const playerId = stringField(before, "selfId");
    const oldVersion = numberField(before, "version");

    await app.close();
    app = await createApp({ port: 0, hostname: "127.0.0.1", dbPath });
    const resumedSession = await jsonRequest(app, "/api/session", { method: "POST", cookie, body: {} });
    expect(resumedSession.response.status).toBe(200);
    expect(field(resumedSession.body, "currentPartyCode")).toBe(code);

    const resumedParty = await jsonRequest(app, `/api/parties/${code}`, { cookie });
    expect(resumedParty.response.status).toBe(200);
    const after = snapshot(resumedParty);
    expect(field(after, "selfId")).toBe(playerId);
    expect(numberField(after, "version")).toBeGreaterThan(oldVersion);
    expect(field(arrayField(after, "players")[0], "connected")).toBe(false);
  } finally {
    await app.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test("concurrent colour claims leave one unique owner", async () => {
  const directory = await mkdtemp(join(tmpdir(), "impostor-party-colour-race-"));
  const app = await createApp({ port: 0, hostname: "127.0.0.1", dbPath: join(directory, "party.sqlite") });
  try {
    const host = await makeSession(app);
    const guest = await makeSession(app);
    const created = await createParty(app, host.cookie, "Host", "private");
    const code = stringField(snapshot(created), "code");
    const joined = await jsonRequest(app, `/api/parties/${code}/join`, {
      method: "POST", cookie: guest.cookie, body: { name: "Guest" },
    });
    expect(joined.response.status).toBe(200);

    const claims = await Promise.all([
      jsonRequest(app, `/api/parties/${code}/actions`, {
        method: "POST", cookie: host.cookie,
        body: { expectedPhase: "lobby", roundId: null, action: { type: "set_color", colorId: "violet" } },
      }),
      jsonRequest(app, `/api/parties/${code}/actions`, {
        method: "POST", cookie: guest.cookie,
        body: { expectedPhase: "lobby", roundId: null, action: { type: "set_color", colorId: "violet" } },
      }),
    ]);
    expect(claims.map(({ response }) => response.status).sort()).toEqual([200, 409]);
    expect(claims.filter(({ response }) => response.status === 409).map(errorCode)).toEqual(["COLOR_TAKEN"]);
    const latest = await jsonRequest(app, `/api/parties/${code}`, { cookie: guest.cookie });
    const colors = playerColors(snapshot(latest));
    expect(new Set(colors).size).toBe(2);
    expect(colors.filter((color) => color === "violet")).toHaveLength(1);
  } finally {
    await app.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test("concurrent eighth-seat contenders serialize and same-session rejoin preserves identity", async () => {
  const directory = await mkdtemp(join(tmpdir(), "impostor-party-seat-race-"));
  const app = await createApp({ port: 0, hostname: "127.0.0.1", dbPath: join(directory, "party.sqlite") });
  try {
    const host = await makeSession(app);
    const created = await createParty(app, host.cookie, "Host", "private");
    const code = stringField(snapshot(created), "code");
    const seatedGuests = await Promise.all(Array.from({ length: 6 }, () => makeSession(app)));
    for (const guest of seatedGuests) {
      const joined = await jsonRequest(app, `/api/parties/${code}/join`, {
        method: "POST", cookie: guest.cookie, body: { name: "Guest" },
      });
      expect(joined.response.status).toBe(200);
    }
    const contenders = await Promise.all([makeSession(app), makeSession(app)]);
    const claims = await Promise.all(contenders.map(({ cookie }) => jsonRequest(app, `/api/parties/${code}/join`, {
      method: "POST", cookie, body: { name: "Final seat" },
    })));
    expect(claims.map(({ response }) => response.status).sort()).toEqual([200, 409]);
    expect(claims.filter(({ response }) => response.status === 409).map(errorCode)).toEqual(["PARTY_FULL"]);
    const winnerIndex = claims.findIndex(({ response }) => response.status === 200);
    const winner = snapshot(claims[winnerIndex]!);
    const winnerId = stringField(winner, "selfId");
    const rejoined = await jsonRequest(app, `/api/parties/${code}/join`, {
      method: "POST", cookie: contenders[winnerIndex]!.cookie, body: { name: "Ignored rename" },
    });
    expect(rejoined.response.status).toBe(200);
    expect(stringField(snapshot(rejoined), "selfId")).toBe(winnerId);
    expect(arrayField(snapshot(rejoined), "players")).toHaveLength(8);
    expect(new Set(playerColors(snapshot(rejoined))).size).toBe(8);

    const seventh = await makeSession(app);
    const rejected = await jsonRequest(app, `/api/parties/${code}/join`, {
      method: "POST", cookie: seventh.cookie, body: { name: "Seventh" },
    });
    expect(rejected.response.status).toBe(409);
    expect(errorCode(rejected)).toBe("PARTY_FULL");
  } finally {
    await app.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test("multiple tabs preserve presence and offline hosts transfer after grace", async () => {
  const directory = await mkdtemp(join(tmpdir(), "impostor-party-presence-"));
  let now = 1_700_000_000_000;
  const app = await createApp({ port: 0, hostname: "127.0.0.1", dbPath: join(directory, "party.sqlite"), now: () => now });
  let guestSocket: WebSocket | undefined;
  try {
    const host = await makeSession(app);
    const guest = await makeSession(app);
    const created = await createParty(app, host.cookie, "Host", "public");
    const code = stringField(snapshot(created), "code");
    const hostId = stringField(snapshot(created), "selfId");
    const joined = await jsonRequest(app, `/api/parties/${code}/join`, {
      method: "POST", cookie: guest.cookie, body: { name: "Guest" },
    });
    const guestId = stringField(snapshot(joined), "selfId");

    const hostTabOne = await connectPartySocket(app, host.cookie, code);
    const hostTabTwo = await connectPartySocket(app, host.cookie, code);
    guestSocket = await connectPartySocket(app, guest.cookie, code);
    await closePartySocket(hostTabOne);
    const whileSecondTabOpen = await jsonRequest(app, `/api/parties/${code}`, { cookie: host.cookie });
    const hostAfterOneClose = arrayField(snapshot(whileSecondTabOpen), "players").find((player) => stringField(player, "id") === hostId);
    expect(field(hostAfterOneClose, "connected")).toBe(true);

    await closePartySocket(hostTabTwo);
    const offline = await jsonRequest(app, `/api/parties/${code}`, { cookie: host.cookie });
    const hostOffline = arrayField(snapshot(offline), "players").find((player) => stringField(player, "id") === hostId);
    expect(field(hostOffline, "connected")).toBe(false);

    now += 59_999;
    const resumed = await jsonRequest(app, "/api/session", { method: "POST", cookie: host.cookie, body: {} });
    expect(field(resumed.body, "currentPartyCode")).toBe(code);
    const sameSeat = await jsonRequest(app, `/api/parties/${code}/join`, {
      method: "POST", cookie: host.cookie, body: { name: "Renamed host" },
    });
    expect(stringField(snapshot(sameSeat), "selfId")).toBe(hostId);
    expect(arrayField(snapshot(sameSeat), "players").map((player) => stringField(player, "name"))).toEqual(["Host", "Guest"]);
    const reconnectedTab = await connectPartySocket(app, host.cookie, code);
    await closePartySocket(reconnectedTab);
    const offlineAgain = await jsonRequest(app, `/api/parties/${code}`, { cookie: host.cookie });
    const confirmedOffline = arrayField(snapshot(offlineAgain), "players").find((player) => stringField(player, "id") === hostId);
    expect(field(confirmedOffline, "connected")).toBe(false);

    now += 60_001;
    const publicListing = await jsonRequest(app, "/api/parties");
    const guestSnapshot = await jsonRequest(app, `/api/parties/${code}`, { cookie: guest.cookie });
    expect(field(publicListing.body, "parties")).toEqual([{ code, hostName: "Guest", playerCount: 1, maxPlayers: 8 }]);
    expect(stringField(snapshot(guestSnapshot), "hostId")).toBe(guestId);
    const expiredHost = await jsonRequest(app, `/api/parties/${code}`, { cookie: host.cookie });
    expect(expiredHost.response.status).toBe(403);
    expect(errorCode(expiredHost)).toBe("NOT_MEMBER");
  } finally {
    if (guestSocket) await closePartySocket(guestSocket);
    await app.close();
    await rm(directory, { recursive: true, force: true });
  }
});
test("WebSocket authorization requires matching origin and cookie membership, not supplied player ids", async () => {
  const directory = await mkdtemp(join(tmpdir(), "impostor-party-socket-auth-"));
  const app = await createApp({ port: 0, hostname: "127.0.0.1", dbPath: join(directory, "party.sqlite") });
  try {
    const host = await makeSession(app);
    const guest = await makeSession(app);
    const created = await createParty(app, host.cookie, "Host", "public");
    const code = stringField(snapshot(created), "code");
    const hostId = stringField(snapshot(created), "selfId");

    await expect(connectPartySocket(app, host.cookie, code, "https://attacker.invalid")).rejects.toThrow("Party WebSocket connection failed");
    await expect(connectPartySocket(app, guest.cookie, code)).rejects.toThrow("Party WebSocket connection failed");
    await expect(connectPartySocket(app, guest.cookie, code, app.url, hostId)).rejects.toThrow("Party WebSocket connection failed");
    expect(field((await jsonRequest(app, "/api/parties")).body, "parties")).toEqual([]);
  } finally {
    await app.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test("the automatic question reveal is exact, stale actions return a safe snapshot, and voting still has a ready gate", async () => {
  const directory = await mkdtemp(join(tmpdir(), "impostor-party-auto-reveal-"));
  let now = 1_700_000_000_000;
  const app = await createApp({
    port: 0,
    hostname: "127.0.0.1",
    dbPath: join(directory, "party.sqlite"),
    now: () => now,
    randomInt: () => 0,
  });
  const sockets: WebSocket[] = [];
  try {
    const host = await makeSession(app);
    const guests = await Promise.all([makeSession(app), makeSession(app)]);
    const created = await createParty(app, host.cookie, "Host", "private");
    const code = stringField(snapshot(created), "code");
    for (const [index, guest] of guests.entries()) {
      const joined = await jsonRequest(app, `/api/parties/${code}/join`, {
        method: "POST",
        cookie: guest.cookie,
        body: { name: `Guest ${index + 1}` },
      });
      expect(joined.response.status).toBe(200);
    }
    for (const cookie of [host.cookie, ...guests.map((guest) => guest.cookie)]) {
      sockets.push(await connectPartySocket(app, cookie, code));
    }

    const postAction = (cookie: string, expectedPhase: string, roundId: string | null, action: unknown) =>
      jsonRequest(app, `/api/parties/${code}/actions`, {
        method: "POST",
        cookie,
        body: { expectedPhase, roundId, action },
      });
    const settings = await postAction(host.cookie, "lobby", null, {
      type: "set_settings",
      settings: { visibility: "private", questionRevealMode: "auto", questionSource: "builtin" },
    });
    expect(settings.response.status).toBe(200);
    const deniedStart = await postAction(guests[0]!.cookie, "lobby", null, { type: "start_round" });
    expect(deniedStart.response.status).toBe(403);
    expect(errorCode(deniedStart)).toBe("FORBIDDEN");
    const started = await postAction(host.cookie, "lobby", null, { type: "start_round" });
    expect(started.response.status).toBe(200);
    const roundId = stringField(field(snapshot(started), "round"), "id");
    const cookies = [host.cookie, ...guests.map((guest) => guest.cookie)];

    for (const [index, cookie] of cookies.entries()) {
      const submitted = await postAction(cookie, "answering", roundId, {
        type: "submit_answer",
        answer: `answer ${index + 1}`,
      });
      expect(submitted.response.status).toBe(200);
    }
    const answerOnly = await jsonRequest(app, `/api/parties/${code}`, { cookie: host.cookie });
    const answerRound = record(field(snapshot(answerOnly), "round"));
    expect(field(snapshot(answerOnly), "phase")).toBe("answers");
    expect(answerRound).toHaveProperty("answers");
    expect(answerRound).not.toHaveProperty("normalQuestion");
    expect(answerRound).not.toHaveProperty("impostorId");
    const revealAt = numberField(answerRound, "questionRevealAt");

    now = revealAt - 1;
    const early = await jsonRequest(app, `/api/parties/${code}`, { cookie: host.cookie });
    expect(field(snapshot(early), "phase")).toBe("answers");
    expect(field(snapshot(early), "round")).not.toHaveProperty("normalQuestion");

    now = revealAt;
    const exact = await jsonRequest(app, `/api/parties/${code}`, { cookie: host.cookie });
    expect(field(snapshot(exact), "phase")).toBe("voting");
    expect(field(snapshot(exact), "round")).toHaveProperty("normalQuestion");
    const stale = await postAction(host.cookie, "answers", roundId, { type: "set_ready", ready: true });
    expect(stale.response.status).toBe(409);
    expect(errorCode(stale)).toBe("STALE_ACTION");
    expect(field(stale.body, "snapshot")).toHaveProperty("phase", "voting");

    const voting = await jsonRequest(app, `/api/parties/${code}`, { cookie: host.cookie });
    expect(field(snapshot(voting), "phase")).toBe("voting");
    const playerIds = arrayField(snapshot(voting), "players").map((player) => stringField(player, "id"));
    for (const [index, cookie] of cookies.entries()) {
      const vote = await postAction(cookie, "voting", roundId, {
        type: "vote",
        targetPlayerId: playerIds[(index + 1) % playerIds.length]!,
      });
      expect(vote.response.status).toBe(200);
    }
    const results = await jsonRequest(app, `/api/parties/${code}`, { cookie: host.cookie });
    expect(field(snapshot(results), "phase")).toBe("results");
    const leaveAfterResults = await postAction(guests[0]!.cookie, "voting", roundId, { type: "leave" });
    expect(leaveAfterResults.body).toEqual({ left: true });
    const retainedResults = await jsonRequest(app, `/api/parties/${code}`, { cookie: host.cookie });
    const retained = record(field(snapshot(retainedResults), "round"));
    expect(field(snapshot(retainedResults), "phase")).toBe("results");
    expect(arrayField(retained, "participants")).toHaveLength(3);
    expect(arrayField(retained, "participants").map((participant) => stringField(participant, "name"))).toEqual([
      "Host", "Guest 1", "Guest 2",
    ]);
    expect(Object.keys(record(field(retained, "answers")))).toHaveLength(3);
    expect(Object.keys(record(field(retained, "votes")))).toHaveLength(3);
  } finally {
    for (const socket of sockets) await closePartySocket(socket);
    await app.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test("an overdue persisted automatic reveal advances during app restart", async () => {
  const directory = await mkdtemp(join(tmpdir(), "impostor-party-deadline-recovery-"));
  const dbPath = join(directory, "party.sqlite");
  let now = 1_700_000_000_000;
  let app = await createApp({
    port: 0,
    hostname: "127.0.0.1",
    dbPath,
    now: () => now,
    randomInt: () => 0,
  });
  const sockets: WebSocket[] = [];
  try {
    const host = await makeSession(app);
    const guests = await Promise.all([makeSession(app), makeSession(app)]);
    const created = await createParty(app, host.cookie, "Host", "private");
    const code = stringField(snapshot(created), "code");
    for (const [index, guest] of guests.entries()) {
      const joined = await jsonRequest(app, `/api/parties/${code}/join`, {
        method: "POST",
        cookie: guest.cookie,
        body: { name: `Guest ${index + 1}` },
      });
      expect(joined.response.status).toBe(200);
    }
    for (const cookie of [host.cookie, ...guests.map((guest) => guest.cookie)]) {
      sockets.push(await connectPartySocket(app, cookie, code));
    }
    const postAction = (cookie: string, expectedPhase: string, roundId: string | null, action: unknown) =>
      jsonRequest(app, `/api/parties/${code}/actions`, {
        method: "POST",
        cookie,
        body: { expectedPhase, roundId, action },
      });
    await postAction(host.cookie, "lobby", null, {
      type: "set_settings",
      settings: { visibility: "private", questionRevealMode: "auto", questionSource: "builtin" },
    });
    const started = await postAction(host.cookie, "lobby", null, { type: "start_round" });
    const startedRound = field(snapshot(started), "round");
    const roundId = stringField(startedRound, "id");
    const impostorQuestion = stringField(startedRound, "privateQuestion");
    const cookies = [host.cookie, ...guests.map((guest) => guest.cookie)];
    for (const cookie of cookies) await postAction(cookie, "answering", roundId, { type: "submit_answer", answer: "saved" });
    const answers = await jsonRequest(app, `/api/parties/${code}`, { cookie: host.cookie });
    const answersRound = record(field(snapshot(answers), "round"));
    const revealAt = numberField(answersRound, "questionRevealAt");

    await app.close();
    now = revealAt;
    app = await createApp({
      port: 0,
      hostname: "127.0.0.1",
      dbPath,
      now: () => now,
      randomInt: () => 0,
    });

    const recovered = await jsonRequest(app, `/api/parties/${code}`, { cookie: host.cookie });
    const recoveredSnapshot = snapshot(recovered);
    expect(field(recoveredSnapshot, "phase")).toBe("voting");
    const recoveredRound = record(field(recoveredSnapshot, "round"));
    expect(stringField(recoveredRound, "id")).toBe(roundId);
    expect(stringField(recoveredRound, "privateQuestion")).toBe(impostorQuestion);
    expect(recoveredRound).toHaveProperty("normalQuestion");
    expect(field(recoveredRound, "questionRevealAt")).toBeNull();
    expect(Object.values(record(field(recoveredRound, "answers")))).toEqual(["saved", "saved", "saved"]);
    expect(arrayField(recoveredSnapshot, "players").every((player) => field(player, "connected") === false)).toBe(true);
  } finally {
    await app.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test("an expired member cancels the active round before its simultaneous reveal deadline", async () => {
  const directory = await mkdtemp(join(tmpdir(), "impostor-party-expiry-order-"));
  let now = 1_700_000_000_000;
  const app = await createApp({
    port: 0,
    hostname: "127.0.0.1",
    dbPath: join(directory, "party.sqlite"),
    now: () => now,
    randomInt: () => 0,
  });
  const sockets: WebSocket[] = [];
  try {
    const host = await makeSession(app);
    const guests = await Promise.all([makeSession(app), makeSession(app)]);
    const created = await createParty(app, host.cookie, "Host", "private");
    const code = stringField(snapshot(created), "code");
    for (const [index, guest] of guests.entries()) {
      await jsonRequest(app, `/api/parties/${code}/join`, {
        method: "POST",
        cookie: guest.cookie,
        body: { name: `Guest ${index + 1}` },
      });
    }
    const cookies = [host.cookie, ...guests.map((guest) => guest.cookie)];
    for (const cookie of cookies) sockets.push(await connectPartySocket(app, cookie, code));
    const postAction = (cookie: string, expectedPhase: string, roundId: string | null, action: unknown) =>
      jsonRequest(app, `/api/parties/${code}/actions`, {
        method: "POST",
        cookie,
        body: { expectedPhase, roundId, action },
      });
    await postAction(host.cookie, "lobby", null, {
      type: "set_settings",
      settings: { visibility: "private", questionRevealMode: "auto", questionSource: "builtin" },
    });
    const started = await postAction(host.cookie, "lobby", null, { type: "start_round" });
    const roundId = stringField(field(snapshot(started), "round"), "id");
    for (const cookie of cookies) await postAction(cookie, "answering", roundId, { type: "submit_answer", answer: "saved" });
    const answers = await jsonRequest(app, `/api/parties/${code}`, { cookie: host.cookie });
    const revealAt = numberField(record(field(snapshot(answers), "round")), "questionRevealAt");

    await closePartySocket(sockets[2]!);
    const disconnected = await jsonRequest(app, `/api/parties/${code}`, { cookie: host.cookie });
    expect(arrayField(snapshot(disconnected), "players").map((player) => field(player, "connected"))).toEqual([true, true, false]);
    now = revealAt + 60_000;
    const expired = await jsonRequest(app, `/api/parties/${code}`, { cookie: host.cookie });
    const expiredSnapshot = snapshot(expired);
    expect(field(expiredSnapshot, "phase")).toBe("lobby");
    expect(field(expiredSnapshot, "round")).toBeNull();
    expect(field(expiredSnapshot, "notice")).toEqual({ type: "round_cancelled", playerName: "Guest 2" });
    expect(arrayField(expiredSnapshot, "players")).toHaveLength(2);
  } finally {
    for (const socket of sockets) await closePartySocket(socket);
    await app.close();
    await rm(directory, { recursive: true, force: true });
  }
});
