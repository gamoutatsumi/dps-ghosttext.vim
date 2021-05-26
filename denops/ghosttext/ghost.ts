import {
  isWebSocketCloseEvent,
  WebSocket,
  WebSocketEvent,
} from "./vendor/https/deno.land/std/ws/mod.ts";
import { Vim } from "./vendor/https/deno.land/x/denops_std/mod.ts";

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
  vim: Vim,
  ws: WebSocket,
  bufHandlerMaps: BufHandlerMaps,
): Promise<void> => {
  const ftmap: FileTypeMap = await vim.g.get(
    "dps_ghosttext_ftmap",
  ) as FileTypeMap;
  for await (const event of ws) {
    if (isWebSocketCloseEvent(event)) {
      const bufnr = bufHandlerMaps.splice(bufHandlerMaps.findIndex((handler) => handler.socket === ws), 1)[0].bufnr
      await vim.autocmd("dps_ghost", (helper) => {
        helper.remove();
      });
      await vim.execute(`bwipeout ${bufnr}`)
      break;
    }
    const data = JSON.parse(event.toString()) as GhostTextEvent;
    const bufnr = await vim.fn.bufadd(data.url);
    await vim.fn.bufload(bufnr)
    await vim.call("setbufline", bufnr, 1, data.text.split("\n"));
    await vim.execute(`buffer ${bufnr}`);
    await vim.execute(`
      setlocal buftype=nofile
      setlocal nobackup noswapfile
      setlocal buflisted
      setlocal ft=${ftmap[data.url]}
    `);
    bufHandlerMaps.push({ bufnr: bufnr, socket: ws });
    await vim.autocmd("dps_ghost", (helper) => {
      helper.define(
        ["TextChanged", "TextChangedP", "TextChangedI"],
        "<buffer>",
        `call denops#notify("${vim.name}", "push", [${bufnr}])`,
      );
    });
  }
};
