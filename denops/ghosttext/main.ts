import { Denops } from "./vendor/https/deno.land/x/denops_std/mod.ts";
import {
  ensureNumber,
  ensureString,
} from "./vendor/https/deno.land/x/unknownutil/mod.ts";
import { runServer } from "./server.ts";
import * as fn from "./vendor/https/deno.land/x/denops_std/function/mod.ts";
import { BufHandlerMaps } from "./types.ts";

const bufHandlerMaps: BufHandlerMaps = [];

export function main(denops: Denops): Promise<void> {
  denops.dispatcher = {
    run(port: unknown): Promise<void> {
      if (port !== undefined) {
        ensureString(port);
        port = +port;
        ensureNumber(port);
      }
      runServer(denops, bufHandlerMaps, port);
      return Promise.resolve();
    },
    async push(arg: unknown): Promise<void> {
      const bufnr = arg as number;
      const socket =
        bufHandlerMaps.filter((handler) => handler.bufnr === bufnr)[0].socket;
      const selectPos = {
        start: await fn.line(denops, "'<"),
        end: await fn.col(denops, "'>"),
      };
      const text = await fn.getbufline(denops, bufnr, 1, "$");
      const data = {
        text: text.join("\n"),
        selections: selectPos,
      };
      socket.send(JSON.stringify(data));
    },
  };
  return Promise.resolve();
}
