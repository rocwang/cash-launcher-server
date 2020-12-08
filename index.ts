import url from "url";
import fs from "fs";
import https from "https";
import WebSocket from "ws";

const server = https.createServer({
  key: fs.readFileSync("./key.pem"),
  cert: fs.readFileSync("./crt.pem"),
});

const wssArray = ["/velocity", "/orientation"].map((path) => {
  const wss = new WebSocket.Server({ noServer: true });
  let currentSocket: WebSocket | null = null;

  wss.on("connection", (ws: WebSocket) => {
    console.log("A new client is connected");

    if (currentSocket) {
      currentSocket.close(1000, "Another client is connected");
    }

    currentSocket = ws;

    currentSocket.on("message", (message: string) => {
      console.log(message);
    });

    currentSocket.on("close", (code: number, reason: string) => {
      console.log(code, reason);
    });
  });

  return {
    path,
    wss,
  };
});

server.on("upgrade", function upgrade(request, socket, head) {
  const pathname = url.parse(request.url).pathname;

  const match = wssArray.find(({ path }) => path === pathname);
  if (match) {
    match.wss.handleUpgrade(request, socket, head, (ws) => {
      match.wss.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});

const port = 443;
server.listen(port);
console.log(`listening on ${port}`);
