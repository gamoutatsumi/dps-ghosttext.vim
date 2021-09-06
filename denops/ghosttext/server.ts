import {
  acceptable,
  acceptWebSocket,
} from "./vendor/https/deno.land/std/ws/mod.ts";

import {
  listenAndServe,
  serve,
} from "./vendor/https/deno.land/std/http/mod.ts";

import { Denops } from "./vendor/https/deno.land/x/denops_std/mod.ts";

import { ghost } from "./ghost.ts";

import { BufHandlerMaps } from "./types.ts";

export const runServer = async (
  denops: Denops,
  bufHandlerMaps: BufHandlerMaps,
  port = 4001,
): Promise<void> => {
  try {
    const listener = Deno.listen({
      port: port,
      hostname: "127.0.0.1"
    })
    listener.close()
  } catch (error) {
    if (error instanceof Deno.errors.AddrInUse) {
      return
    }
  }
  console.log("GhostText Server started")
  await listenAndServe({ hostname: "127.0.0.1", port: port }, async (req) => {
    if (req.method === "GET" && req.url === "/") {
      const wsServer = serve({ hostname: "127.0.0.1", port: 0 });
      await req.respond({
        status: 200,
        body: JSON.stringify({
          // @ts-ignore: type is not defined
          WebSocketPort: wsServer.listener.addr.port,
          ProtocolVersion: 1,
        }),
        headers: new Headers({
          "content-type": "application/json",
        }),
      });
      for await (const req of wsServer) {
        if (req.method === "GET" && req.url === "/" && acceptable(req)) {
          await acceptWebSocket({
            conn: req.conn,
            bufReader: req.r,
            bufWriter: req.w,
            headers: req.headers,
          }).then(async (ws) => {
            await ghost(denops, ws, bufHandlerMaps);
          });
        }
      }
    }
  });
};
