import {
  createApp,
  Loglevel,
  ServerRequest,
  setLevel,
} from "./vendor/https/deno.land/x/servest/mod.ts";

import { Vim } from "./vendor/https/deno.land/x/denops_std/mod.ts";

import { ghost } from "./ghost.ts";

import { BufHandlerMap } from "./app.ts";

import { rand } from "./rand.ts";

export class Server {
  vim: Vim;
  addr: Deno.ListenOptions;
  bufHandlerMaps: BufHandlerMap[];
  constructor(vim: Vim, bufHandlerMaps: BufHandlerMap[], port?: number) {
    this.addr = {
      port: port ?? 4001,
      hostname: "127.0.0.1",
    };
    this.vim = vim;
    this.bufHandlerMaps = bufHandlerMaps;
  }
  run() {
    runServer(this.vim, this.addr, this.bufHandlerMaps);
  }
}

const runServer = (
  vim: Vim,
  addr: Deno.ListenOptions,
  bufHandlerMaps: BufHandlerMap[],
): void => {
  setLevel(Loglevel.WARN);
  const app = createApp();
  app.handle("/", async (req) => {
    await runWsServer(vim, bufHandlerMaps, req);
  });
  app.listen(addr);
};

const runWsServer = async (
  vim: Vim,
  bufHandlerMaps: BufHandlerMap[],
  req: ServerRequest,
): Promise<void> => {
  try {
    const port = rand(49152, 65535);
    const wsApp = createApp();
    wsApp.ws("/", async (sock) => {
      await ghost(vim, sock, bufHandlerMaps);
    });
    wsApp.listen({
      hostname: "127.0.0.1",
      port: port,
    });
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
  } catch {
    await runWsServer(vim, bufHandlerMaps, req);
  }
};
