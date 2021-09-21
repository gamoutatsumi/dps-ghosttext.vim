import { Denops } from "./vendor/https/deno.land/x/denops_std/mod.ts";
import * as vars from "./vendor/https/deno.land/x/denops_std/variable/mod.ts";
import * as fn from "./vendor/https/deno.land/x/denops_std/function/mod.ts";
import * as opts from "./vendor/https/deno.land/x/denops_std/option/mod.ts";
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
} & WebSocketEventMap;

export const onClose = async (
  ws: WebSocket,
  bufHandlerMaps: BufHandlerMaps,
  denops: Denops,
): Promise<void> => {
  const bufnr = bufHandlerMaps.splice(
    bufHandlerMaps.findIndex((handler) => handler.socket === ws),
    1,
  )[0]?.bufnr;
  if (bufnr == null) return;
  await autocmd.remove(
    denops,
    ["BufLeave"],
    "<buffer>",
    { group: "dps-ghost" },
  );
  await helper.execute(denops, `bwipeout! ${bufnr}`);
};

export const onOpen = async (
  ws: WebSocket,
  event: MessageEvent,
  bufHandlerMaps: BufHandlerMaps,
  denops: Denops,
): Promise<void> => {
  const ftmap: FileTypeMap = await vars.g.get(
    denops,
    "dps_ghosttext#ftmap",
  ) as FileTypeMap;
  const data = JSON.parse(event.data) as GhostTextEvent;
  const bufnr = await fn.bufadd(denops, data.url);
  await fn.bufload(denops, bufnr);
  await fn.setbufline(denops, bufnr, 1, data.text.split("\n"));
  await helper.execute(denops, `buffer ${bufnr}`);
  await opts.buftype.setLocal(denops, "nofile");
  await opts.swapfile.setLocal(denops, false);
  await opts.buflisted.setLocal(denops, true);
  if (data.url in ftmap) {
    await opts.filetype.setLocal(denops, ftmap[data.url]);
  } else {
    await opts.filetype.setLocal(denops, "text");
  }
  bufHandlerMaps.push({ bufnr: bufnr, socket: ws });
  await autocmd.group(denops, "dps-ghost", (helper) => {
    helper.define(
      ["TextChanged", "TextChangedI", "TextChangedP"],
      "<buffer>",
      `call denops#notify("${denops.name}", "push", [${bufnr}])`,
    );
  });
  await autocmd.group(denops, "dps-ghost", (helper) => {
    helper.define(
      ["BufLeave"],
      "<buffer>",
      `call denops#notify("${denops.name}", "close", [${bufnr}])`,
    );
  });
};
