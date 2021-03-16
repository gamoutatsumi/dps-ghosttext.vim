import { listenAndServe, Response } from "https://deno.land/x/std/http/mod.ts";
import { acceptWebSocket, acceptable, WebSocket } from "https://deno.land/x/std/ws/mod.ts";
import serverLog from "./logger.ts";

import { Vim } from "https://deno.land/x/denops_std@v0.3/mod.ts";

import ghost from "./ghost.ts";

const version = "0.0.0"

class Server {
  port: number;
  vim: Vim
  constructor(vim: Vim, port?: number) { 
    this.port = port ?? 4001;
    this.vim = vim
  }
  run() { runServer(this.vim, this.port); }
}

const runServer = async (vim: Vim, port: number): Promise<void> => {
  listenAndServe({ hostname: "127.0.0.1", port: port }, (req) => {
    if (req.method === "GET" && req.url === "/") {
      const json = JSON.stringify({
        WebSocketPort: port,
        ProtocolVersion: 1,
      })
      const response: Response = {
        status: 200,
        body: json,
        headers: new Headers({
          "content-type": "application/json",
        }),
      }
      req.respond(
        response
      ).then(() => {
        serverLog(req, response);
      });
      if (acceptable(req)) {
        acceptWebSocket({
          conn: req.conn,
          bufReader: req.r,
          bufWriter: req.w,
          headers: req.headers,
        }).then(async (ws: WebSocket) => {
          await ghost(vim, ws);
        });
      }
    } else if (req.method === "GET" && req.url === "/version") {
      const response: Response = {
        status: 200,
        body: version,
      }
      req.respond(
        response
      ).then(() => {
        serverLog(req, response);
      });
    } else if (req.method === "GET" && req.url === "/exit") {
      const response: Response = {
        status: 200,
        body: "exiting...",
      };
      req.respond(
        response
      ).then(() => {
        serverLog(req, response);
        Deno.exit();
      });
    } else if (req.method === "GET" && req.url === "/is_ghost_binary") {
      const response: Response = {
        status: 200,
        body: "True",
      }
      req.respond(
        response
      ).then(() => {
        serverLog(req, response)
      })
    }
  });
}

export default Server;
