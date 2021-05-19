import { WebSocket } from "./vendor/https/deno.land/std/ws/mod.ts";

interface BufHandlerMap {
  bufnr: number;
  socket: WebSocket;
}

export type BufHandlerMaps = BufHandlerMap[]

export type FileTypeMap = {
  [key in string]: string;
};

