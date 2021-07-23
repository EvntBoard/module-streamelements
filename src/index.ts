import process from 'process'
import { getEvntComClientFromChildProcess, getEvntComServerFromChildProcess } from 'evntboard-communicate'
// @ts-ignore
import { default as io } from "socket.io-client";

import {
  EStreamElementsEvent,
  EStreamElementsEventType,
} from "./EStreamElementsEvent";

// parse params
const { name: NAME, customName: CUSTOM_NAME, config: { token: TOKEN } } = JSON.parse(process.argv[2])
const EMITTER = CUSTOM_NAME || NAME

const evntComClient = getEvntComClientFromChildProcess();
const evntComServer = getEvntComServerFromChildProcess();

let socket: any;
let attemps: number = 0;

const onNewEvent = (data: any): void => {
  if (data?.emitter !== EMITTER) return
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
  evntComClient?.newEvent(EStreamElementsEvent.LOAD, null, { emitter: EMITTER });
  socket = io("https://realtime.streamelements.com", {
    transports: ["websocket"],
  });

  const eventHandler = ({ listener, ...rest }: any) => {
    if (Object.values(EStreamElementsEventType).includes(listener)) {
      evntComClient?.newEvent(
          listener,
          {listener, ...rest},
          { emitter: EMITTER }
      );
    } else {
      console.warn(`Unknow event on streamelements ${listener}`);
    }
  }

  // Socket connected
  socket.on("connect", () => {
    socket.emit("authenticate", {
      method: "jwt",
      token: TOKEN,
    });
  });

  // Socket got disconnected
  socket.on("disconnect", (data: any) => {
    evntComClient?.newEvent(EStreamElementsEvent.CLOSE, data, { emitter: EMITTER });
  });

  // Socket is authenticated
  socket.on("authenticated", () => {
    evntComClient?.newEvent(EStreamElementsEvent.OPEN, { emitter: EMITTER });
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

const unload = async () => {
  try {
    socket.disconnect();
    evntComClient?.newEvent(EStreamElementsEvent.UNLOAD, null, { emitter: EMITTER });
  } catch (e) {
    console.error(e.stack);
  }
}

const reload = async () => {
  await unload();
  await load();
}

const tryReconnect = () => {
  attemps += 1
  console.log(`Attempt to reconnect OBS for the ${attemps} time(s)`)
  const waintingTime = attemps * 5000
  setTimeout(async () => await load(), waintingTime)
}

evntComServer.expose('newEvent', onNewEvent)
evntComServer.expose('load', load)
evntComServer.expose('unload', unload)
evntComServer.expose('reload', reload)