import { WebSocket, isWebSocketCloseEvent } from "https://deno.land/std/ws/mod.ts";
import { Vim } from "https://deno.land/x/denops_std@v0.3/mod.ts";

let sockets: WebSocket[] = new Array();

const ghost = async (vim: Vim, ws: WebSocket): Promise<void> => {
  sockets.push(ws);
  console.log(ws);
  for await (const event of ws) {
    if (isWebSocketCloseEvent(event)) {
      sockets = sockets.filter((socket) => socket !== ws);
      break;
    }
    const data = (typeof event === "string") ? JSON.parse(event).data : "";
    await vim.cmd("tabnew title", {
      title: data.title
    });
    await vim.call("setline", 1, data.text.split("\n"));
    await vim.execute(`
      setlocal buftype=nofile
      setlocal nobackup noswapfile
    `);
  }

}

export default ghost;
