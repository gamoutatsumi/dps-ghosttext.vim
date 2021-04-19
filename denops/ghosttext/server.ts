import { createApp, setLevel, Loglevel } from "./vendor/https/deno.land/x/servest/mod.ts";

import { Vim } from "./vendor/https/deno.land/x/denops_std/mod.ts";

import ghost from "./ghost.ts";

import BufHandlerMap from "./mod.ts"

import rand from "./rand.ts";

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
  setLevel(Loglevel.WARN);
  const app = createApp();
  app.handle("/", async (req) => {
    const port = rand(49152, 65535);
    await req.respond({
      status: 200,
      body: JSON.stringify({
        WebSocketPort: port,
        ProtocolVersion: 1,
      }),
      headers: new Headers({
        "content-type": "application/json",
      }),
    });
    await runWsServer(vim, port, bufHandlerMaps);
  });
  app.handle("/version", async (req) => {
    await req.respond({
      status: 200,
      body: version,
      headers: new Headers({
        "content-type": "text/plain",
      }),
    });
  });
  app.handle("/exit", async (req) => {
    await req.respond({
      status: 200,
      body: "exiting...",
      headers: new Headers({
        "content-type": "text/plain",
      }),
    });
  });
  app.handle("/is_ghost_binary", async (req) => {
    await req.respond({
      status: 200,
      body: "True",
      headers: new Headers({
        "content-type": "text/plain",
      }),
    });
  });
  app.listen(addr);
}

const runWsServer = async (vim: Vim, port: number, bufHandlerMaps: BufHandlerMap[]): Promise<void> => {
  const wsApp = createApp();
  wsApp.ws("/", async(sock) => {
    await ghost(vim, sock, bufHandlerMaps);
  })
  wsApp.listen({
    hostname: "127.0.0.1",
    port: port
  })
}
export default Server;
