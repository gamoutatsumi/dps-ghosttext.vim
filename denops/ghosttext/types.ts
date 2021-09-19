type BufHandlerMap = {
  bufnr: number;
  socket: WebSocket;
};

export type BufHandlerMaps = BufHandlerMap[];

export type FileTypeMap = {
  [key in string]: string;
};
