import WebSocket from "ws";

const fs = require("fs");
const https = require("https");
const ws = require("ws");

const server = https.createServer({
  key: fs.readFileSync("./key.pem"),
  cert: fs.readFileSync("./crt.pem"),
});
const wss = new ws.Server({ server });

let currentWebSocket: WebSocket | null = null;
wss.on("connection", (ws: WebSocket) => {
  console.log("A new client is connected");

  if (currentWebSocket) {
    currentWebSocket.close(1000, "Another client is connected");
  }

  currentWebSocket = ws;

  currentWebSocket.on("message", (message: string) => {
    console.log(message);
  });

  currentWebSocket.on("close", (code: number, reason: string) => {
    console.log(code, reason);
  });
});

const port = 443;
server.listen(port);
console.log(`listening on ${port}`);
