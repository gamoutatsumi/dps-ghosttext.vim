import * as log from "https://deno.land/std/log/mod.ts";
import { ServerRequest, Response } from "https://deno.land/x/std/http/mod.ts";

await log.setup({
  handlers: {
    console: new log.handlers.ConsoleHandler("DEBUG", {
      formatter: "{datetime} {msg}"
    }),
  },
  loggers: {
    default: {
      level: "WARNING",
      handlers: ["console"],
    },
  },
});

const serverLog = (req: ServerRequest, res: Response): void => {
  const s = `"${req.method} ${req.url} ${req.proto}" ${res.status}`;
  if (res.status === 200) {
    log.info(s)
  }
}

export default serverLog;
