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
  runHttpServer(port, denops, bufHandlerMaps);
  console.log("GhostText Server started");
  return Promise.resolve();
};

function runHttpServer(
  port: number,
  denops: Denops,
  bufHandlerMaps: BufHandlerMaps,
): Deno.HttpServer {
  return Deno.serve({ hostname: "127.0.0.1", port: port }, (request) => {
    if (request.headers.get("upgrade") === "websocket") {
      const { socket, response } = Deno.upgradeWebSocket(request);
      socket.onclose = async () =>
        await onClose(socket, bufHandlerMaps, denops);
      socket.onmessage = async (e) =>
        await onOpen(socket, e, bufHandlerMaps, denops);
      return response;
    }
    if (request.method === "GET") {
      if (new URL(request.url).pathname === "/") {
        const body = JSON.stringify({
          WebSocketPort: port,
          ProtocolVersion: 1,
        });
        const headers = {
          status: 200,
          headers: new Headers({
            "content-type": "application/json",
          }),
        };
        return new Response(body, headers);
      } else {
        return new Response("Not Found", { status: 404 });
      }
    } else {
      return new Response("Method Not Allowed", { status: 405 });
    }
  });
}
