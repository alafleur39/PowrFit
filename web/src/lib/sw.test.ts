import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Runs public/sw.js in a sandbox with fake worker globals, then fires fetch
// events at it to check which requests it takes over (P1-09).

const ORIGIN = "https://powrfit.example";
const source = readFileSync(
  fileURLToPath(new URL("../../public/sw.js", import.meta.url)),
  "utf8"
);

type Listener = (event: unknown) => void;

function loadWorker({ online = true, cached = new Map<string, Response>() } = {}) {
  const listeners: Record<string, Listener> = {};
  const store = new Map(cached);
  const cache = {
    addAll: vi.fn(async () => {}),
    put: vi.fn(async (request: Request, response: Response) => {
      store.set(new URL(request.url).pathname, response);
    }),
  };
  const fetchMock = vi.fn(async () => {
    if (!online) throw new TypeError("Failed to fetch");
    return new Response("network", { status: 200 });
  });

  const cachesApi = {
    open: vi.fn(async () => cache),
    keys: vi.fn(async () => ["powrfit-shell-v1", "powrfit-shell-v2"]),
    delete: vi.fn(async () => true),
    match: vi.fn(async (request: Request | string) => {
      const path = typeof request === "string" ? request : new URL(request.url).pathname;
      return store.get(path);
    }),
  };

  runInNewContext(source, {
    self: {
      location: { origin: ORIGIN },
      addEventListener: (type: string, fn: Listener) => (listeners[type] = fn),
      skipWaiting: vi.fn(),
      clients: { claim: vi.fn(async () => {}) },
    },
    caches: cachesApi,
    fetch: fetchMock,
    URL,
    Response,
  });

  /** Fires a fetch event; resolves to the worker's response, or null if it passed. */
  async function dispatch(url: string, init: { method?: string; mode?: string } = {}) {
    let responded = null as Promise<Response> | null;
    listeners.fetch({
      request: { url, method: init.method ?? "GET", mode: init.mode ?? "cors" },
      respondWith: (value: Promise<Response>) => (responded = value),
    });
    return responded ? await responded : null;
  }

  return { listeners, cache, cachesApi, fetchMock, dispatch };
}

describe("service worker request handling", () => {
  let worker: ReturnType<typeof loadWorker>;
  beforeEach(() => {
    worker = loadWorker();
  });

  it.each([
    ["Firebase Auth", "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword"],
    ["Firestore", "https://firestore.googleapis.com/google.firestore.v1.Firestore/Listen"],
    ["Firebase auth handler", "https://powrfit.firebaseapp.com/__/auth/handler"],
    ["another origin's script", "https://cdn.example.com/lib.js"],
  ])("leaves %s requests alone", async (_name, url) => {
    expect(await worker.dispatch(url)).toBeNull();
    expect(await worker.dispatch(url, { mode: "navigate" })).toBeNull();
  });

  it.each(["/api/agent", "/__/auth/handler"])("leaves same-origin %s alone", async (path) => {
    expect(await worker.dispatch(ORIGIN + path, { mode: "navigate" })).toBeNull();
  });

  it("leaves non-GET requests alone", async () => {
    expect(await worker.dispatch(`${ORIGIN}/_next/static/a.js`, { method: "POST" })).toBeNull();
  });

  it("leaves other same-origin files to the browser", async () => {
    expect(await worker.dispatch(`${ORIGIN}/manifest.webmanifest`)).toBeNull();
    expect(await worker.dispatch(`${ORIGIN}/icons/icon-192.png`)).toBeNull();
  });

  it("serves build assets from the cache, fetching and storing them once", async () => {
    const url = `${ORIGIN}/_next/static/chunks/app.js`;
    expect(await (await worker.dispatch(url))!.text()).toBe("network");
    expect(worker.cache.put).toHaveBeenCalledTimes(1);

    await worker.dispatch(url);
    expect(worker.fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not cache a failed build-asset response", async () => {
    worker.fetchMock.mockResolvedValueOnce(new Response("missing", { status: 404 }));
    await worker.dispatch(`${ORIGIN}/_next/static/chunks/gone.js`);
    expect(worker.cache.put).not.toHaveBeenCalled();
  });

  it("loads pages from the network when online", async () => {
    const response = await worker.dispatch(`${ORIGIN}/home`, { mode: "navigate" });
    expect(await response!.text()).toBe("network");
  });

  it("shows the offline page when a navigation fails", async () => {
    const offline = loadWorker({
      online: false,
      cached: new Map([["/offline.html", new Response("offline page")]]),
    });
    const response = await offline.dispatch(`${ORIGIN}/progress`, { mode: "navigate" });
    expect(await response!.text()).toBe("offline page");
  });
});

describe("service worker lifecycle", () => {
  it("precaches the offline page and deletes old caches", async () => {
    const worker = loadWorker();
    let pending: Promise<unknown> = Promise.resolve();
    const waitUntil = (promise: Promise<unknown>) => (pending = promise);

    worker.listeners.install({ waitUntil });
    await pending;
    expect(worker.cache.addAll).toHaveBeenCalledWith(
      expect.arrayContaining(["/offline.html"])
    );

    worker.listeners.activate({ waitUntil });
    await pending;
    expect(worker.cachesApi.delete).toHaveBeenCalledWith("powrfit-shell-v1");
    expect(worker.cachesApi.delete).not.toHaveBeenCalledWith("powrfit-shell-v2");
  });
});
