import {
  ensureNumber,
  main,
} from "./vendor/https/deno.land/x/denops_std/mod.ts";
import { runServer } from "./server.ts";
import { BufHandlerMaps } from "./types.ts";

const bufHandlerMaps: BufHandlerMaps = [];

main(async ({ vim }) => {
  vim.register({
    run(port: unknown): Promise<void> {
      if (port !== undefined) {
        ensureNumber(port, "port");
      }
      runServer(vim, bufHandlerMaps, port);
      return Promise.resolve();
    },
    async push(arg: unknown): Promise<void> {
      const bufnr = arg as number;
      const socket = bufHandlerMaps.filter((handler) =>
        handler.bufnr === bufnr
      )[0].socket;
      const pos = [
        await vim.call("line", "."),
        await vim.call("col", "."),
      ] as number[];
      const text = await vim.call("getbufline", bufnr, 1, "$") as string[];
      const data = {
        text: text.join("\n"),
        selections: {
          start: pos,
          end: pos,
        },
      };
      socket.send(JSON.stringify(data));
    },
    async set_variables(): Promise<void> {
      if (await vim.call("exists", "g:dps_ghosttext_ftmap") === 1) {
        if (await vim.call("exists", `g:dps_ghosttext_ftmap["github"]`) === 0) {
          await vim.g.set(`dps_ghosttext_ftmap["github.com"]`, "markdown");
        }
      } else {
        await vim.g.set("dps_ghosttext_ftmap", {
          "github.com": "markdown",
        });
      }
    },
  });
  await vim.execute(`
    command! -nargs=* GhostStart call denops#notify("${vim.name}", "run", [<f-args>])
    call denops#notify("${vim.name}", "set_variables", [])
  `);
});
