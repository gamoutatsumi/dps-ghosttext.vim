import { start } from "https://deno.land/x/denops_std@v0.3/mod.ts";
import Server  from "./server.ts";

start(async (vim) => {
  vim.register({
    async run(port: unknown): Promise<void> {
      if (typeof port !== "number" && port !== undefined) {
        throw new Error(`'port' must be a number`);
      }
      const server = new Server(vim, port);
      server.run();
    }
  });
  await vim.execute(`
    command! -nargs=* GhostStart call denops#notify("${vim.name}", "run", [<f-args>])
  `);
});
