import { Denops } from "./deps.ts";
import { onClose, onOpen } from "./ghost.ts";
import { BufHandlerMaps } from "./types.ts";

export const runServer = (
  denops: Denops,
  bufHandlerMaps: BufHandlerMaps,
  port = 4001,
): Promise<void> => {
  try {
    const listener = Deno.listen({
      port: port,
      hostname: "127.0.0.1",
    });
    listener.close();
  } catch (error) {
    if (error instanceof Deno.errors.AddrInUse) {
      console.error("GhostText Server already started");
      return Promise.resolve();
    }
  }
  const wsServer = Deno.listen({ hostname: "127.0.0.1", port: 0 });
  // @ts-ignore: type is not exposed
  runHttpServer(port, wsServer.addr.port);
  runWsServer(wsServer, denops, bufHandlerMaps);
  console.log("GhostText Server started");
  return Promise.resolve();
};

async function runHttpServer(port: number, wsPort: number): Promise<void> {
  for await (const conn of Deno.listen({ hostname: "127.0.0.1", port: port })) {
    for await (const { request, respondWith } of Deno.serveHttp(conn)) {
      if (request.method === "GET" && new URL(request.url).pathname === "/") {
        const body = JSON.stringify({
          WebSocketPort: wsPort,
          ProtocolVersion: 1,
        });
        const headers = {
          status: 200,
          headers: new Headers({
            "content-type": "application/json",
          }),
        };
        const res = new Response(body, headers);
        respondWith(res);
      }
    }
  }
}

async function runWsServer(
  listener: Deno.Listener,
  denops: Denops,
  bufHandlerMaps: BufHandlerMaps,
): Promise<void> {
  for await (const conn of listener) {
    (async () => {
      for await (const e of Deno.serveHttp(conn)) {
        e.respondWith(websocketHandle(denops, e.request, bufHandlerMaps));
      }
    })();
  }
}

function websocketHandle(
  denops: Denops,
  req: Request,
  bufHandlerMaps: BufHandlerMaps,
): Response {
  if (req.headers.get("upgrade") !== "websocket") {
    return new Response("not trying to upgrade as websocket.");
  }
  const { socket, response } = Deno.upgradeWebSocket(req);
  socket.onclose = async () => await onClose(socket, bufHandlerMaps, denops);
  socket.onmessage = async (e) =>
    await onOpen(socket, e, bufHandlerMaps, denops);
  return response;
}
