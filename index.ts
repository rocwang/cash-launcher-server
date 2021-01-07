import url from "url";
import fs from "fs";
import https from "https";
import WebSocket, { MessageEvent } from "ws";
import { toggleMotor, init, pan, tilt, reset } from "./motors";
import { fromEvent, Observable, of } from "rxjs";
import { map, switchMap, delay, startWith, filter, tap } from "rxjs/operators";
import { IncomingMessage, ServerResponse } from "http";

declare interface Orientation {
  alpha: number;
  beta: number;
}

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
            // v < -1
            switchMap<number, Observable<boolean>>((v: number) =>
              of(false).pipe(delay(300), startWith(Boolean(v)))
            )
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
      reset();
    });
  });

  return {
    path,
    wss,
  };
});

const server = https.createServer({
  key: fs.readFileSync("./key.pem"),
  cert: fs.readFileSync("./crt.pem"),
});

server.on("upgrade", (request, socket, head) => {
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

function isSiriRequest(req: IncomingMessage) {
  const pathname = url.parse(req.url as string).pathname;

  return pathname === "/siri";
}

fromEvent<[IncomingMessage, ServerResponse]>(server, "request")
  .pipe(
    tap(([req, res]) => {
      res.writeHead(isSiriRequest(req) ? 204 : 404);
      res.end();
    }),
    filter(([req]) => isSiriRequest(req)),
    switchMap<any, Observable<boolean>>(() =>
      of(false).pipe(delay(500), startWith(true))
    )
  )
  .subscribe(toggleMotor);

init();

const port = 443;
server.listen(port);
console.log(`listening on ${port}`);
