import {
  isWebSocketCloseEvent,
  WebSocket,
  WebSocketEvent,
} from "./vendor/https/deno.land/std/ws/mod.ts";
import { Denops } from "./vendor/https/deno.land/x/denops_std/mod.ts";
import { globals } from "./vendor/https/deno.land/x/denops_std/variable/mod.ts";
import * as fn from "./vendor/https/deno.land/x/denops_std/function/mod.ts";
import * as helper from "./vendor/https/deno.land/x/denops_std/helper/mod.ts";
import * as autocmd from "./vendor/https/deno.land/x/denops_std/autocmd/mod.ts";

import { BufHandlerMaps, FileTypeMap } from "./types.ts";

type GhostTextEvent = {
  title: string;
  text: string;
  url: string;
  syntax: string;
  selections: [{
    start: number;
    end: number;
  }];
} & WebSocketEvent;

export const ghost = async (
  denops: Denops,
  ws: WebSocket,
  bufHandlerMaps: BufHandlerMaps,
): Promise<void> => {
  const ftmap: FileTypeMap = await globals.get(
    denops,
    "dps_ghosttext_ftmap",
  ) as FileTypeMap;
  for await (const event of ws) {
    if (isWebSocketCloseEvent(event)) {
      const bufnr = bufHandlerMaps.splice(
        bufHandlerMaps.findIndex((handler) => handler.socket === ws),
        1,
      )[0].bufnr;
      await autocmd.remove(
        denops,
        ["TextChanged", "TextChangedP", "TextChangedI"],
        "*",
        { group: "dps_ghost" },
      );
      await helper.execute(denops, `bwipeout ${bufnr}`);
      break;
    }
    const data = JSON.parse(event.toString()) as GhostTextEvent;
    const bufnr = await fn.bufadd(denops, data.url);
    await fn.bufload(denops, bufnr);
    await fn.setbufline(denops, bufnr, 1, data.text.split("\n"));
    await helper.execute(denops, `buffer ${bufnr}`);
    await helper.execute(
      denops,
      `
      setlocal buftype=nofile
      setlocal nobackup noswapfile
      setlocal buflisted
      setlocal ft=${ftmap[data.url]}
    `,
    );
    bufHandlerMaps.push({ bufnr: bufnr, socket: ws });
    await autocmd.group(denops, "dps_ghost", (helper) => {
      helper.define(
        ["TextChanged", "TextChangedI", "TextChangedP"],
        "<buffer>",
        `call denops#notify("${denops.name}", "push", [${bufnr}])`,
      );
    });
  }
};
