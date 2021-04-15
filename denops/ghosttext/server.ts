import { createApp, createRouter, Router, setLevel, Loglevel } from "./vendor/https/deno.land/x/servest/mod.ts";

import { Vim } from "./vendor/https/deno.land/x/denops_std/mod.ts";

import ghost from "./ghost.ts";

import BufHandlerMap from "./mod.ts"

const version = "0.0.0"

class Server {
  vim: Vim
  addr: Deno.ListenOptions
  bufHandlerMaps: BufHandlerMap[]
  constructor(vim: Vim, bufHandlerMaps: BufHandlerMap[], port?: number) { 
    this.addr = {
      port: port ?? 4001,
      hostname: "127.0.0.1"
    }
    this.vim = vim;
    this.bufHandlerMaps = bufHandlerMaps;
  }
  run() { runServer(this.vim, this.addr, this.bufHandlerMaps); }
}

const runServer = async (vim: Vim, addr: Deno.ListenOptions, bufHandlerMaps: BufHandlerMap[]): Promise<void> => {
  setLevel(Loglevel.INFO);
  const app = createApp({
  });
  const IndexRoutes = (): Router => {
    const router = createRouter();
    router.handle("/", async (req) => {
      await req.respond({
        status: 200,
        body: JSON.stringify({
          WebSocketPort: addr.port,
          ProtocolVersion: 1,
        }),
        headers: new Headers({
          "content-type": "application/json",
        }),
      });
    });
    router.handle("/version", async (req) => {
      await req.respond({
        status: 200,
        body: version,
        headers: new Headers({
          "content-type": "text/plain",
        }),
      });
    });
    router.handle("/exit", async (req) => {
      await req.respond({
        status: 200,
        body: "exiting...",
        headers: new Headers({
          "content-type": "text/plain",
        }),
      });
    });
    router.handle("/is_ghost_binary", async (req) => {
      await req.respond({
        status: 200,
        body: "True",
        headers: new Headers({
          "content-type": "text/plain",
        }),
      });
    });
    return router;
  }
  app.route("/", IndexRoutes());
  app.ws("/", async (sock) => {
    ghost(vim, sock, bufHandlerMaps);
  });
  app.listen(addr);
}

export default Server;
