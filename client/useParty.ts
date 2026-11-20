import { useCallback, useEffect, useRef, useState } from "react";
import type { PartyAction, PartySnapshot } from "./api";
import { ApiError, asApiError, createSession, getParty, isPartySnapshot, normalizePartyCode, sendAction } from "./api";

export type PartyLoadStatus = "loading" | "ready" | "invalid-code" | "not-member" | "different-party" | "error";
export type RemovedReason = "left" | "kicked" | "expired";
export type PartyActionResult = PartySnapshot | { left: true } | null;

export interface UsePartyResult {
  code: string;
  status: PartyLoadStatus;
  snapshot: PartySnapshot | null;
  currentPartyCode: string | null;
  connected: boolean;
  busy: boolean;
  error: ApiError | null;
  removedReason: RemovedReason | null;
  act(action: PartyAction): Promise<PartyActionResult>;
  retry(): void;
  clearError(): void;
}

interface SocketEvent {
  type: "snapshot";
  snapshot: PartySnapshot;
}

const retryDelays = [500, 1_000, 2_000, 4_000, 5_000];

function isSocketEvent(value: unknown): value is SocketEvent | { type: "removed"; reason: RemovedReason } {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const event = value as Record<string, unknown>;
  if (event.type === "snapshot") return isPartySnapshot(event.snapshot);
  return event.type === "removed" && ["left", "kicked", "expired"].includes(String(event.reason));
}

export function useParty(rawCode: string): UsePartyResult {
  const normalizedCode = normalizePartyCode(rawCode);
  const code = normalizedCode ?? rawCode.trim().toUpperCase();
  const [status, setStatus] = useState<PartyLoadStatus>(normalizedCode ? "loading" : "invalid-code");
  const [snapshot, setSnapshot] = useState<PartySnapshot | null>(null);
  const [currentPartyCode, setCurrentPartyCode] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [removedReason, setRemovedReason] = useState<RemovedReason | null>(null);
  const [retryNumber, setRetryNumber] = useState(0);
  const snapshotRef = useRef<PartySnapshot | null>(null);
  const versionRef = useRef(-1);
  const busyRef = useRef(false);

  const applySnapshot = useCallback((next: PartySnapshot) => {
    if (next.version < versionRef.current) return;
    versionRef.current = next.version;
    snapshotRef.current = next;
    setSnapshot(next);
  }, []);

  useEffect(() => {
    if (!normalizedCode) {
      setStatus("invalid-code");
      setSnapshot(null);
      setCurrentPartyCode(null);
      return;
    }

    let cancelled = false;
    let terminalRemoval = false;
    let socket: WebSocket | null = null;
    let reconnectTimer: number | undefined;
    let attempts = 0;

    setStatus("loading");
    setSnapshot(null);
    snapshotRef.current = null;
    versionRef.current = -1;
    setCurrentPartyCode(null);
    setConnected(false);
    setBusy(false);
    busyRef.current = false;
    setError(null);
    setRemovedReason(null);

    let connectSocket = () => {};
    const scheduleReconnect = () => {
      if (cancelled || terminalRemoval) return;
      setConnected(false);
      const delay = retryDelays[Math.min(attempts, retryDelays.length - 1)];
      attempts += 1;
      reconnectTimer = window.setTimeout(connectSocket, delay);
    };

    connectSocket = () => {
      if (cancelled || terminalRemoval) return;
      setConnected(false);
      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const socketUrl = `${wsProtocol}//${window.location.host}/ws?code=${encodeURIComponent(normalizedCode)}`;
      let activeSocket: WebSocket;
      try {
        activeSocket = new WebSocket(socketUrl);
      } catch {
        scheduleReconnect();
        return;
      }
      socket = activeSocket;

      activeSocket.onopen = () => {
        if (cancelled || terminalRemoval) {
          activeSocket.close();
          return;
        }
        attempts = 0;
        setConnected(true);
      };
      activeSocket.onmessage = (message) => {
        if (cancelled || terminalRemoval) return;
        let parsed: unknown;
        try {
          parsed = JSON.parse(String(message.data));
        } catch {
          return;
        }
        if (!isSocketEvent(parsed)) return;
        if (parsed.type === "snapshot") {
          applySnapshot(parsed.snapshot);
          return;
        }
        terminalRemoval = true;
        setRemovedReason(parsed.reason);
        setConnected(false);
        activeSocket.close();
      };
      activeSocket.onerror = () => activeSocket.close();
      activeSocket.onclose = () => {
        if (socket !== activeSocket) return;
        socket = null;
        if (cancelled || terminalRemoval) return;
        scheduleReconnect();
      };
    };

    const bootstrap = async () => {
      try {
        const session = await createSession();
        if (cancelled) return;
        const memberCode = session.currentPartyCode ? normalizePartyCode(session.currentPartyCode) : null;
        setCurrentPartyCode(memberCode);
        if (memberCode && memberCode !== normalizedCode) {
          setStatus("different-party");
          return;
        }
        const initial = await getParty(normalizedCode);
        if (cancelled) return;
        applySnapshot(initial);
        setStatus("ready");
        connectSocket();
      } catch (cause) {
        if (cancelled) return;
        const apiError = asApiError(cause);
        if (apiError.snapshot) applySnapshot(apiError.snapshot);
        setError(apiError);
        setStatus(apiError.code === "NOT_MEMBER" ? "not-member" : "error");
      }
    };

    void bootstrap();
    return () => {
      cancelled = true;
      if (reconnectTimer !== undefined) window.clearTimeout(reconnectTimer);
      const activeSocket = socket;
      socket = null;
      activeSocket?.close();
    };
  }, [applySnapshot, normalizedCode, retryNumber]);

  const act = useCallback(async (action: PartyAction): Promise<PartyActionResult> => {
    const current = snapshotRef.current;
    if (!connected || !current || busyRef.current || removedReason) return null;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const response = await sendAction(code, action, current.phase, current.round?.id ?? null);
      if ("left" in response) return response;
      applySnapshot(response.snapshot);
      return response.snapshot;
    } catch (cause) {
      const apiError = asApiError(cause);
      if (apiError.snapshot) applySnapshot(apiError.snapshot);
      setError(apiError);
      return null;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [applySnapshot, code, connected, removedReason]);

  const retry = useCallback(() => {
    if (removedReason) return;
    setRetryNumber((number) => number + 1);
  }, [removedReason]);

  const clearError = useCallback(() => setError(null), []);

  return { code, status, snapshot, currentPartyCode, connected, busy, error, removedReason, act, retry, clearError };
}
