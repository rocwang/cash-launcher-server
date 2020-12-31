import url from "url";
import fs from "fs";
import https from "https";
import WebSocket, { MessageEvent } from "ws";
import { toggleMotor, init, pan, tilt } from "./motors";
import { fromEvent, Observable, of } from "rxjs";
import { map, switchMap, delay, startWith } from "rxjs/operators";

declare interface Orientation {
  alpha: number;
  beta: number;
}

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

    const message$ = fromEvent<MessageEvent>(currentSocket, "message");
    switch (path) {
      case "/velocity":
        message$
          .pipe(
            map<MessageEvent, number>((e: MessageEvent) =>
              JSON.parse(e.data as string)
            ),
            switchMap<number, Observable<boolean>>((v: number) => {
              // v < -1
              return of(false).pipe(delay(300), startWith(Boolean(v)));
            })
          )
          .subscribe(toggleMotor);
        break;
      case "/orientation":
        message$.subscribe((e: MessageEvent) => {
          const o: Orientation = JSON.parse(e.data as string);

          pan(o.alpha);
          tilt(o.beta);
        });
        break;
      default:
        currentSocket.close(1000, "Unknown websocket path");
        break;
    }

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

init();

const port = 443;
server.listen(port);
console.log(`listening on ${port}`);
