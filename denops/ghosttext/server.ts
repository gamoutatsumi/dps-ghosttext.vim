import {
  acceptable,
  acceptWebSocket,
} from "./vendor/https/deno.land/std/ws/mod.ts";

import {
  listenAndServe,
  serve,
} from "./vendor/https/deno.land/std/http/mod.ts";

import { Vim } from "./vendor/https/deno.land/x/denops_std/mod.ts";

import { ghost } from "./ghost.ts";

import { BufHandlerMaps } from "./types.ts";

export const runServer = async (
  vim: Vim,
  bufHandlerMaps: BufHandlerMaps,
  port = 4001,
): Promise<void> => {
  await listenAndServe({ hostname: "127.0.0.1", port: port }, async (req) => {
    if (req.method === "GET" && req.url === "/") {
      const wsServer = serve({ hostname: "127.0.0.1", port: 0 });
      await req.respond({
        status: 200,
        body: JSON.stringify({
          // @ts-ignore
          WebSocketPort: wsServer.listener.addr.port,
          ProtocolVersion: 1,
        }),
        headers: new Headers({
          "content-type": "application/json",
        }),
      });
      for await (const req of wsServer) {
        if (req.method === "GET" && req.url === "/" && acceptable(req)) {
          acceptWebSocket({
            conn: req.conn,
            bufReader: req.r,
            bufWriter: req.w,
            headers: req.headers,
          }).then(async (ws) => {
            await ghost(vim, ws, bufHandlerMaps);
          });
        }
      }
    }
  });
};
