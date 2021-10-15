import { Denops } from "./vendor/https/deno.land/x/denops_std/mod.ts";
import { runServer } from "./server.ts";
import * as fn from "./vendor/https/deno.land/x/denops_std/function/mod.ts";
import { ensureNumber } from "./vendor/https/deno.land/x/unknownutil/mod.ts";
import { BufHandlerMaps } from "./types.ts";

const bufHandlerMaps: BufHandlerMaps = [];

export function main(denops: Denops): Promise<void> {
  let status = "stopped";

  denops.dispatcher = {
    run(): Promise<void> {
      runServer(denops, bufHandlerMaps);
      status = "running";
      return Promise.resolve();
    },
    async push(bufnr: unknown): Promise<void> {
      ensureNumber(bufnr);
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
    status(): Promise<string> {
      return Promise.resolve(status);
    },
    close(bufnr: unknown): Promise<void> {
      ensureNumber(bufnr);
      const socket =
        bufHandlerMaps.filter((handler) => handler.bufnr === bufnr)[0].socket;
      socket.close();
      return Promise.resolve();
    },
  };
  return Promise.resolve();
}
