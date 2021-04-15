import { WebSocket, isWebSocketCloseEvent } from "./vendor/https/deno.land/std/ws/mod.ts";
import { Vim } from "./vendor/https/deno.land/x/denops_std/mod.ts";

import BufHandlerMap from "./mod.ts";

const ghost = async (vim: Vim, ws: WebSocket, bufHandlerMaps: BufHandlerMap[]): Promise<void> => {
  for await (const event of ws) {
    if (isWebSocketCloseEvent(event)) {
      bufHandlerMaps = bufHandlerMaps.filter((handler) => handler.socket !== ws);
      break;
    }
    const data = (typeof event === "string") ? JSON.parse(event).data : "";
    await vim.cmd("tabbed title", {
      title: data.title
    });
    await vim.call("setline", 1, data.text.split("\n"));
    await vim.execute(`
      setlocal buftype=nofile
      setlocal nobackup noswapfile
    `);
    const bufnr = await vim.call("bufnr", "%") as number;
    bufHandlerMaps.push({bufnr: bufnr, socket: ws});
  }
  await vim.autocmd("dps_ghost", (helper) => {
    helper.remove("*", "<buffer>");
    helper.define(
      ["TextChanged", "TextChangedI", "TextChangedP"],
      "<buffer>",
      `call denops#notify("${vim.name}", "push", [getline(1, "$"), ${ws}])`
    );
  });
  const text = await vim.call("getline", 1, "$") as string[];
  const pos = [await vim.call("line", "."), vim.call("col", ".")] 
  ws.send(JSON.stringify({
    text: text.join("\n"),
    selections: {
      start: pos,
      end: pos,
    }
  }));
  // await vim.execute(`call denops#notify("${vim.name}", "push", [getline(1, "$"), ${ws}])`);
  await vim.call(`denops#notify`, [`${vim.name}`, "push", await vim.call("bufnr", "%")]);
}

export default ghost;
