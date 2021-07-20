import { Denops } from "./vendor/https/deno.land/x/denops_std/mod.ts";
import * as vars from "./vendor/https/deno.land/x/denops_std/variable/mod.ts";
import * as helper from "./vendor/https/deno.land/x/denops_std/helper/mod.ts";
import { ensureNumber } from "./vendor/https/deno.land/x/unknownutil/mod.ts";
import { runServer } from "./server.ts";
import * as fn from "./vendor/https/deno.land/x/denops_std/function/mod.ts";
import { BufHandlerMaps } from "./types.ts";

const bufHandlerMaps: BufHandlerMaps = [];

export async function main(denops: Denops): Promise<void> {
  denops.dispatcher = {
    run(port: unknown): Promise<void> {
      if (port !== undefined) {
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
      }
      const text = await fn.getbufline(denops, bufnr, 1, "$");
      const data = {
        text: text.join("\n"),
        selections: selectPos 
      };
      socket.send(JSON.stringify(data));
    },
    async set_variables(): Promise<void> {
      if (await fn.exists(denops, "g:dps_ghosttext_ftmap")) {
        if (
          await fn.exists(denops, `g:dps_ghosttext_ftmap["github"]`)
        ) {
          await vars.g.set(
            denops,
            `dps_ghosttext_ftmap["github.com"]`,
            "markdown",
          );
        }
      } else {
        await vars.g.set(denops, "dps_ghosttext_ftmap", {
          "github.com": "markdown",
        });
      }
    },
  };
  await helper.execute(
    denops,
    `
    command! -nargs=* GhostStart call denops#notify("${denops.name}", "run", [<f-args>])
    call denops#notify("${denops.name}", "set_variables", [])
  `,
  );
}
