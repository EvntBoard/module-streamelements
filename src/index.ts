// @ts-ignore
import { default as io } from "socket.io-client";

import {
  EStreamElementsEvent,
  EStreamElementsEventType,
} from "./EStreamElementsEvent";
import {EvntComNode} from "evntcom-js/dist/node";

const NAME: string = process.env.EVNTBOARD_NAME || "streamelements";
const HOST: string = process.env.EVNTBOARD_HOST || "localhost";
const PORT: number = process.env.EVNTBOARD_PORT ? parseInt(process.env.EVNTBOARD_PORT) : 5001;
const TOKEN: string = process.env.EVNTBOARD_CONFIG_TOKEN;

const evntCom = new EvntComNode({
  name: NAME,
  port: PORT,
  host: HOST,
});


let socket: any;
let attemps: number = 0;

evntCom.onEvent = (data: any): void => {
  if (data?.emitter !== NAME) return
  switch (data?.event) {
    case EStreamElementsEvent.OPEN:
      attemps = 0
      break
    case EStreamElementsEvent.CLOSE:
      tryReconnect()
      break
    default:
      break
  }
}

const load = async () => {
  await evntCom.callMethod("newEvent", [EStreamElementsEvent.LOAD, null, { emitter: NAME }]);
  socket = io('https://realtime.streamelements.com', {
    transports: ['websocket']
  });

  const eventHandler = async ({ listener, provider, type, ...rest }: any) => {
    if (Object.values(EStreamElementsEventType).includes(listener)) {
      await evntCom.callMethod("newEvent", [
          listener,
          {listener, provider, type, ...rest},
          { emitter: NAME }
      ]);
    } else {
      await evntCom.callMethod("newEvent", [
          `streamelements-${provider}-${type}`,
          {listener, provider, type, ...rest},
          { emitter: NAME }
      ]);
    }
  }

  // Socket connected
  socket.on("connect", () => {
    socket.emit('authenticate', {method: 'jwt', token: TOKEN});
  });

  // Socket got disconnected
  socket.on("disconnect", (data: any) => {
    evntCom.callMethod("newEvent", [EStreamElementsEvent.CLOSE, data, { emitter: NAME }]);
  });

  // Socket is authenticated
  socket.on("authenticated", () => {
    evntCom.callMethod("newEvent", [EStreamElementsEvent.OPEN, {}, { emitter: NAME }]);
  });

  socket.on("event", (data: any) => {
    eventHandler(data);
  });

  socket.on("event:test", (data: any) => {
    eventHandler(data);
  });

  socket.on("event:update", (data: any) => {
    eventHandler(data);
  });

  socket.on("event:reset", (data: any) => {
    eventHandler(data);
  });
}

const tryReconnect = () => {
  attemps += 1
  console.log(`Attempt to reconnect STREAMELEMENTS for the ${attemps} time(s)`)
  const waintingTime = attemps * 5000
  setTimeout(async () => await load(), waintingTime)
}

evntCom.onOpen = load;