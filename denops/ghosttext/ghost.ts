import {
  isWebSocketCloseEvent,
  WebSocket,
  WebSocketEvent,
} from "./vendor/https/deno.land/std/ws/mod.ts";
import { Vim } from "./vendor/https/deno.land/x/denops_std/mod.ts";

import { BufHandlerMap, FileTypeMap } from "./app.ts";

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
  bufHandlerMaps: BufHandlerMap[],
): Promise<void> => {
  const ftmap: FileTypeMap = await vim.g.get(
    "dps_ghosttext_ftmap",
  ) as FileTypeMap;
  for await (const event of ws) {
    if (isWebSocketCloseEvent(event) || (typeof event !== "string")) {
      bufHandlerMaps = bufHandlerMaps.filter((handler) =>
        handler.socket !== ws
      );
      await vim.execute(`
        augroup dps_ghost
        autocmd!
        augroup END
      `);
      break;
    }
    const data = JSON.parse(event) as GhostTextEvent;
    await vim.cmd(`edit ${data.url}`);
    await vim.call("setline", 1, data.text.split("\n"));
    await vim.execute(`
      setlocal buftype=nofile
      setlocal nobackup noswapfile
      setlocal bufhidden=hide
      setlocal ft=${ftmap[data.url]}
    `);
    const bufnr = await vim.call("bufnr", "%") as number;
    bufHandlerMaps.push({ bufnr: bufnr, socket: ws });
    await vim.execute(`
      augroup dps_ghost
      autocmd!
      autocmd TextChanged,TextChangedP,TextChangedI <buffer> call denops#notify("${vim.name}", "push", [bufnr("%")])
      augroup END
    `);
  }
};
