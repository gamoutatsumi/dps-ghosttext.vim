import { Denops } from "./vendor/https/deno.land/x/denops_std/mod.ts";
import * as variable from "./vendor/https/deno.land/x/denops_std/variable/mod.ts";
import * as helper from "./vendor/https/deno.land/x/denops_std/helper/mod.ts";
import { ensureNumber } from "./vendor/https/deno.land/x/unknownutil/mod.ts";
import { runServer } from "./server.ts";
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
      const pos = [
        await denops.call("line", "."),
        await denops.call("col", "."),
      ] as number[];
      const text = await denops.call("getbufline", bufnr, 1, "$") as string[];
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
      if (await denops.call("exists", "g:dps_ghosttext_ftmap") === 1) {
        if (
          await denops.call("exists", `g:dps_ghosttext_ftmap["github"]`) === 0
        ) {
          await variable.g.set(
            denops,
            `dps_ghosttext_ftmap["github.com"]`,
            "markdown",
          );
        }
      } else {
        await variable.g.set(denops, "dps_ghosttext_ftmap", {
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
