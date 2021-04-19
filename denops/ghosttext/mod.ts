import { start } from "./vendor/https/deno.land/x/denops_std/mod.ts";
import { WebSocket } from "./vendor/https/deno.land/std/ws/mod.ts";
import Server  from "./server.ts";

interface BufHandlerMap {
  bufnr: number,
  socket: WebSocket
}

let bufHandlerMaps: BufHandlerMap[] = []

start(async (vim) => {
  vim.register({
    async run(port: unknown): Promise<void> {
      if (typeof port !== "number" && port !== undefined) {
        throw new Error(`'port' must be a number`);
      }
      const server = new Server(vim, bufHandlerMaps, port);
      server.run();
    },
    async push(arg: unknown): Promise<void> {
      const bufnr = arg as number
      const socket = bufHandlerMaps.filter((handler) => handler.bufnr === bufnr)[0].socket;
      const pos = [await vim.call("line", "."), await vim.call("col", ".")] as number[];
      const text = await vim.call("getbufline", bufnr, 1, "$") as string[];
      const data = {
        text: text.join("\n"),
        selections: {
          start: pos,
          end: pos,
        }
      }
      socket.send(JSON.stringify(data));
    },
    async set_variables(): Promise<void> {
      await vim.g.set("dps#ghosttext#ftmap", {
        "github.com": "markdown"
      })
    }
  });
  await vim.execute(`
    command! -nargs=* GhostStart call denops#notify("${vim.name}", "run", [<f-args>])
    call denops#notify("${vim.name}", "set_variables", [])
  `);
});

export default BufHandlerMap;
