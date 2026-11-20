import index from "../client/index.html";
import { randomInt as cryptoRandomInt } from "node:crypto";
import { mkdir, access } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { z } from "zod";
import { ActionRequestSchema, GameLanguageSchema } from "../shared/protocol";
import { PartyError, PartyService, hashSessionToken } from "./party";
import type { PartySocketIdentity } from "./party";
import { PartyStore } from "./store";
import { advanceGameDeadline, applyGameAction } from "./game";
import { translateText } from "./translate";

const MAX_REQUEST_BYTES = 16 * 1024;
const COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
const SESSION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

const EmptyBodySchema = z.object({}).strict();
const CreatePartyBodySchema = z.object({
  name: z.string(),
  visibility: z.enum(["private", "public"]),
  language: GameLanguageSchema.optional(),
}).strict();
const JoinPartyBodySchema = z.object({ name: z.string() }).strict();

export interface AppOptions {
  port: number;
  hostname: string;
  dbPath: string;
  appOrigin?: string;
  allowSameHostOrigin?: boolean;
  now?: () => number;
  randomInt?: (maxExclusive: number) => number;
}

class RequestRateLimiter {
  private readonly requests = new Map<string, { windowMs: number; timestamps: number[] }>();
  private operations = 0;

  consume(scope: string, address: string, limit: number, windowMs: number, now: number): boolean {
    const key = `${scope}\u0000${address}`;
    const bucket = this.requests.get(key) ?? { windowMs, timestamps: [] };
    const cutoff = now - bucket.windowMs;
    while (bucket.timestamps.length > 0 && bucket.timestamps[0]! <= cutoff) bucket.timestamps.shift();
    if (bucket.timestamps.length >= limit) {
      this.requests.set(key, bucket);
      return false;
    }
    bucket.timestamps.push(now);
    this.requests.set(key, bucket);
    this.operations += 1;
    if (this.operations % 256 === 0) this.removeExpired(now);
    return true;
  }

  private removeExpired(now: number): void {
    for (const [key, bucket] of this.requests) {
      const cutoff = now - bucket.windowMs;
      while (bucket.timestamps.length > 0 && bucket.timestamps[0]! <= cutoff) bucket.timestamps.shift();
      if (bucket.timestamps.length === 0) this.requests.delete(key);
    }
  }
}

function apiResponse(body: unknown, status = 200, headers?: HeadersInit): Response {
  const responseHeaders = new Headers(headers);
  responseHeaders.set("Content-Type", "application/json; charset=utf-8");
  responseHeaders.set("Cache-Control", "no-store");
  return new Response(JSON.stringify(body), { status, headers: responseHeaders });
}

function apiErrorResponse(error: unknown): Response {
  if (error instanceof PartyError) {
    const body: { error: { code: string; message: string }; snapshot?: unknown } = {
      error: { code: error.code, message: error.message },
    };
    if (error.snapshot) body.snapshot = error.snapshot;
    return apiResponse(body, error.status);
  }
  return apiResponse({ error: { code: "INTERNAL_ERROR", message: "An unexpected server error occurred." } }, 500);
}

function validationError(): PartyError {
  return new PartyError("VALIDATION_ERROR", 400, "The request body is invalid.");
}

function rateLimitError(): PartyError {
  return new PartyError("RATE_LIMITED", 429, "Too many requests. Try again shortly.");
}

async function readJsonBody(request: Request): Promise<unknown> {
  const mediaType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (mediaType !== "application/json") throw validationError();
  const contentLength = request.headers.get("content-length");
  if (contentLength !== null) {
    if (!/^\d+$/.test(contentLength) || Number(contentLength) > MAX_REQUEST_BYTES) throw validationError();
  }
  if (!request.body) throw validationError();

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > MAX_REQUEST_BYTES) {
        await reader.cancel().catch(() => {});
        throw validationError();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    const parsed: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    return parsed;
  } catch {
    throw validationError();
  }
}

function parseBody<T extends z.ZodType>(schema: T, value: unknown): z.infer<T> {
  const result = schema.safeParse(value);
  if (!result.success) throw validationError();
  return result.data;
}

function isAllowedOrigin(request: Request, appOrigin: string | undefined, allowSameHostOrigin: boolean): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  if (appOrigin && origin === appOrigin) return true;
  if (!allowSameHostOrigin) return false;
  const host = request.headers.get("host");
  if (!host) return false;
  try {
    const parsed = new URL(origin);
    return (parsed.protocol === "http:" || parsed.protocol === "https:") && parsed.origin === origin && parsed.host === host;
  } catch {
    return false;
  }
}

function requireOrigin(request: Request, appOrigin: string | undefined, allowSameHostOrigin: boolean): void {
  if (!isAllowedOrigin(request, appOrigin, allowSameHostOrigin)) {
    throw new PartyError("FORBIDDEN", 403, "This request must come from the configured application origin.");
  }
}

function sessionTokenFromCookie(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;
  let token: string | null = null;
  for (const entry of cookieHeader.split(";")) {
    const separator = entry.indexOf("=");
    if (separator < 0 || entry.slice(0, separator).trim() !== "impostor_session") continue;
    if (token !== null) return null;
    const value = entry.slice(separator + 1).trim();
    if (!SESSION_TOKEN_PATTERN.test(value)) return null;
    token = value;
  }
  return token;
}

function sessionCookie(token: string, secure: boolean): string {
  const securePart = secure ? "; Secure" : "";
  return `impostor_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}${securePart}`;
}

function decodePartyCode(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    throw validationError();
  }
}

function peerAddress(server: Bun.Server<PartySocketIdentity>, request: Request): string {
  return server.requestIP(request)?.address ?? "unknown";
}

export async function createApp(options: AppOptions): Promise<{ url: string; close(): Promise<void> }> {
  if (!Number.isInteger(options.port) || options.port < 0 || options.port > 65535) throw new Error("PORT must be an integer from 0 through 65535");
  if (!options.hostname.trim()) throw new Error("HOST must not be empty");
  if (options.appOrigin) {
    let origin: URL;
    try { origin = new URL(options.appOrigin); } catch { throw new Error("APP_ORIGIN must be a valid absolute HTTP(S) origin"); }
    if (!(["http:", "https:"].includes(origin.protocol)) || origin.origin !== options.appOrigin.replace(/\/$/, "")) {
      throw new Error("APP_ORIGIN must be a valid HTTP(S) origin without a path");
    }
  }
  if (options.dbPath !== ":memory:") await mkdir(dirname(options.dbPath), { recursive: true });

  let openedStore: PartyStore | undefined;
  try {
    openedStore = new PartyStore(options.dbPath);
    await access(options.dbPath === ":memory:" ? "." : options.dbPath);
  } catch (error) {
    openedStore?.close();
    throw new Error(`Unable to open database at ${options.dbPath}: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!openedStore) throw new Error("Unable to open the party database");
  const store = openedStore;

  let parties: PartyService;
  try {
    parties = new PartyService(store, options.now ?? Date.now, options.randomInt ?? cryptoRandomInt);
  } catch (error) {
    store.close();
    throw error;
  }
  parties.setGameActionHandler(applyGameAction);
  parties.setDeadlineHandler(advanceGameDeadline);
  const rateLimiter = new RequestRateLimiter();
  let stopping = false;
  let appOrigin = options.appOrigin ? new URL(options.appOrigin).origin : undefined;
  const allowSameHostOrigin = Boolean(options.allowSameHostOrigin);
  const routes = process.env.NODE_ENV === "production" ? {} : { "/": index, "/join/:code": index, "/party/:code": index };

  let server: Bun.Server<PartySocketIdentity>;
  try {
    server = Bun.serve<PartySocketIdentity>({
      port: options.port,
      hostname: options.hostname,
      development: process.env.NODE_ENV !== "production",
      routes,
      websocket: {
        maxPayloadLength: 4 * 1024,
        idleTimeout: 60,
        open(socket) {
          try { parties.socketOpened(socket.data, socket); }
          catch {
            socket.close(1011, "Unable to open party connection");
          }
        },
        message(socket) {
          socket.close(1008, "Send party actions over HTTP");
        },
        close(socket) {
          parties.socketClosed(socket.data, socket);
        },
      },
      async fetch(request, server) {
        if (stopping) return new Response("Server shutting down", { status: 503 });
        const url = new URL(request.url);
        const path = url.pathname;
        if (
          process.env.NODE_ENV === "production"
          && request.method === "GET"
          && (path === "/" || /^\/(?:join|party)\/[^/]+$/.test(path))
        ) {
          const html = Bun.file(join(process.cwd(), "index.html"));
          if (await html.exists()) return new Response(html);
        }

        try {
          if (path === "/healthz" && request.method === "GET") {
            return new Response("ok", { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } });
          }

          if (path === "/ws" && request.method === "GET") {
            if (!isAllowedOrigin(request, appOrigin, allowSameHostOrigin)) {
              throw new PartyError("FORBIDDEN", 403, "This connection must come from the configured application origin.");
            }
            const token = sessionTokenFromCookie(request);
            if (!token) throw new PartyError("SESSION_REQUIRED", 401, "Create or resume a guest session first.");
            const code = url.searchParams.get("code");
            if (!code) throw validationError();
            const identity = parties.authorizeSocket(code, hashSessionToken(token));
            if (server.upgrade(request, { data: identity })) return undefined;
            throw validationError();
          }

          if (path === "/api/session" && request.method === "POST") {
            if (!appOrigin && !allowSameHostOrigin) throw new PartyError("FORBIDDEN", 403, "The application origin is not configured.");
            requireOrigin(request, appOrigin, allowSameHostOrigin);
            parseBody(EmptyBodySchema, await readJsonBody(request));
            const token = sessionTokenFromCookie(request);
            const secureCookie = (request.headers.get("origin") ?? appOrigin ?? "").startsWith("https://");
            if (token) {
              const resumed = parties.resumeSession(token);
              if (resumed) {
                return apiResponse({ currentPartyCode: resumed.currentPartyCode }, 200, {
                  "Set-Cookie": sessionCookie(token, secureCookie),
                });
              }
            }
            if (!rateLimiter.consume("session", peerAddress(server, request), 60, 60_000, (options.now ?? Date.now)())) {
              throw rateLimitError();
            }
            const session = parties.createSession();
            return apiResponse({ currentPartyCode: session.currentPartyCode }, 200, {
              "Set-Cookie": sessionCookie(session.token, secureCookie),
            });
          }

          if (path === "/api/parties" && request.method === "GET") {
            return apiResponse({ parties: parties.listPublicParties() });
          }

          if (path === "/api/parties" && request.method === "POST") {
            if (!appOrigin && !allowSameHostOrigin) throw new PartyError("FORBIDDEN", 403, "The application origin is not configured.");
            requireOrigin(request, appOrigin, allowSameHostOrigin);
            if (!rateLimiter.consume("create", peerAddress(server, request), 20, 60 * 60_000, (options.now ?? Date.now)())) {
              throw rateLimitError();
            }
            const body = parseBody(CreatePartyBodySchema, await readJsonBody(request));
            const token = sessionTokenFromCookie(request);
            if (!token) throw new PartyError("SESSION_REQUIRED", 401, "Create or resume a guest session first.");
            const snapshot = parties.createParty(hashSessionToken(token), body.name, body.visibility, body.language);
            return apiResponse({ snapshot }, 201);
          }

          const partyRoute = /^\/api\/parties\/([^/]+)(?:\/(join|actions))?$/.exec(path);
          if (partyRoute) {
            const code = decodePartyCode(partyRoute[1]!);
            const actionRoute = partyRoute[2];
            if (actionRoute === "join" && request.method === "POST") {
              if (!appOrigin && !allowSameHostOrigin) throw new PartyError("FORBIDDEN", 403, "The application origin is not configured.");
              requireOrigin(request, appOrigin, allowSameHostOrigin);
              if (!rateLimiter.consume("join", peerAddress(server, request), 30, 60_000, (options.now ?? Date.now)())) {
                throw rateLimitError();
              }
              const body = parseBody(JoinPartyBodySchema, await readJsonBody(request));
              const token = sessionTokenFromCookie(request);
              if (!token) throw new PartyError("SESSION_REQUIRED", 401, "Create or resume a guest session first.");
              const snapshot = parties.joinParty(code, hashSessionToken(token), body.name);
              return apiResponse({ snapshot });
            }
            if (actionRoute === "actions" && request.method === "POST") {
              if (!appOrigin && !allowSameHostOrigin) throw new PartyError("FORBIDDEN", 403, "The application origin is not configured.");
              requireOrigin(request, appOrigin, allowSameHostOrigin);
              const body = parseBody(ActionRequestSchema, await readJsonBody(request));
              const token = sessionTokenFromCookie(request);
              if (!token) throw new PartyError("SESSION_REQUIRED", 401, "Create or resume a guest session first.");
              const result = parties.applyAction(code, hashSessionToken(token), body);
              if (
                "snapshot" in result
                && result.snapshot.round
                && (result.snapshot.settings.language ?? "en") !== "en"
                && (body.action.type === "start_round" || body.action.type === "next_round" || body.action.type === "skip_round")
              ) {
                const localized = await parties.localizeRoundQuestions(code, result.snapshot.round.id, translateText);
                if (localized) return apiResponse({ snapshot: localized });
              }
              return apiResponse(result);
            }
            if (!actionRoute && request.method === "GET") {
              const token = sessionTokenFromCookie(request);
              if (!token) throw new PartyError("SESSION_REQUIRED", 401, "Create or resume a guest session first.");
              return apiResponse({ snapshot: parties.getPartySnapshot(code, hashSessionToken(token)) });
            }
          }

          if (path.startsWith("/api/")) return apiErrorResponse(new PartyError("PARTY_NOT_FOUND", 404, "API route not found."));
          const assetName = basename(path);
          if (process.env.NODE_ENV === "production" && /^index-[a-z0-9]+\.(?:js|css)$/.test(assetName)) {
            const asset = Bun.file(join(process.cwd(), assetName));
            if (await asset.exists()) return new Response(asset);
          }
          return new Response("Not found", { status: 404 });
        } catch (error) {
          return apiErrorResponse(error);
        }
      },
    });
  } catch (error) {
    parties.stop();
    store.close();
    throw error;
  }

  appOrigin ??= new URL(server.url).origin;
  const maintenanceTimer = setInterval(() => {
    try { parties.maintenance(); }
    catch { console.error("Party maintenance failed"); }
  }, 1000);
  return {
    url: server.url.toString().replace(/\/$/, ""),
    async close() {
      if (stopping) return;
      stopping = true;
      clearInterval(maintenanceTimer);
      parties.stop();
      await server.stop(true);
      store.close();
    },
  };
}
