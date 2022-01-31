import { EvntCom } from "@evntboard/evntcom-node";
// @ts-ignore
import { default as io } from "socket.io-client";
import { IConfigItem } from "./ConfigLoader";
import {
  EStreamElementsEvent,
  EStreamElementsEventType,
} from "./EStreamElementsEvent";

export class StreamElementsConnexion {
  private evntCom: EvntCom;
  private config: IConfigItem;

  private socket: any;
  private attemps: number = 0;

  constructor(
    evntBoardHost: string,
    evntBoardPort: number,
    config: IConfigItem
  ) {
    this.config = config;
    this.evntCom = new EvntCom({
      name: config.name,
      port: evntBoardPort,
      host: evntBoardHost,
      events: [EStreamElementsEvent.OPEN, EStreamElementsEvent.CLOSE],
    });

    this.evntCom.on("open", this.load);

    this.evntCom.on("event", (data: any): void => {
      if (data?.emitter !== config.name) return;
      switch (data?.event) {
        case EStreamElementsEvent.OPEN:
          this.attemps = 0;
          break;
        case EStreamElementsEvent.CLOSE:
          this.tryReconnect();
          break;
        default:
          break;
      }
    });

    this.evntCom.connect();
  }

  load = async () => {
    await this.evntCom.callMethod("newEvent", [
      EStreamElementsEvent.LOAD,
      null,
      { emitter: this.config.name },
    ]);
    this.socket = io("https://realtime.streamelements.com", {
      transports: ["websocket"],
    });

    const eventHandler = async ({ listener, provider, type, ...rest }: any) => {
      if (Object.values(EStreamElementsEventType).includes(listener)) {
        await this.evntCom.notify("newEvent", [
          listener,
          { listener, provider, type, ...rest },
          { emitter: this.config.name },
        ]);
      } else {
        await this.evntCom.notify("newEvent", [
          `streamelements-${provider}-${type}`,
          { listener, provider, type, ...rest },
          { emitter: this.config.name },
        ]);
      }
    };

    // Socket connected
    this.socket.on("connect", () => {
      console.log("connect");
      this.socket.emit("authenticate", {
        method: "jwt",
        token: this.config.token,
      });
    });
    this.socket.on("connection", () => {
      console.log("connection");
    });

    this.socket.on("connect_error", (e: any) => {
      console.log("connect_error", e);
    });

    this.socket.on("connect_timeout", () => {
      console.log("connect_timeout");
    });

    this.socket.on("error", () => {
      console.log("error");
    });

    this.socket.on("disconnect", () => {
      console.log("disconnect");
    });

    this.socket.on("disconnecting", () => {
      console.log("disconnecting");
    });

    this.socket.on("newListener", () => {
      console.log("newListener");
    });

    this.socket.on("reconnect_attempt", () => {
      console.log("reconnect_attempt");
    });

    this.socket.on("reconnecting", () => {
      console.log("reconnecting");
    });

    this.socket.on("reconnect_error", () => {
      console.log("reconnect_error");
    });

    this.socket.on("reconnect_failed", () => {
      console.log("reconnect_failed");
    });
    this.socket.on("removeListener", () => {
      console.log("removeListener");
    });
    this.socket.on("ping", () => {
      console.log("ping");
    });
    this.socket.on("pong", () => {
      console.log("pong");
    });
    this.socket.on("unauthorized", console.error);

    // Socket got disconnected
    this.socket.on("disconnect", (data: any) => {
      this.evntCom.notify("newEvent", [
        EStreamElementsEvent.CLOSE,
        data,
        { emitter: this.config.name },
      ]);
    });

    // Socket is authenticated
    this.socket.on("authenticated", () => {
      this.evntCom.notify("newEvent", [
        EStreamElementsEvent.OPEN,
        {},
        { emitter: this.config.name },
      ]);
    });

    this.socket.on("event", (data: any) => {
      eventHandler(data);
    });

    this.socket.on("event:test", (data: any) => {
      eventHandler(data);
    });

    this.socket.on("event:update", (data: any) => {
      eventHandler(data);
    });

    this.socket.on("event:reset", (data: any) => {
      eventHandler(data);
    });
  };

  tryReconnect = () => {
    this.attemps += 1;
    console.log(
      `Attempt to reconnect STREAMELEMENTS for the ${this.attemps} time(s)`
    );
    const waintingTime = this.attemps * 5000;
    setTimeout(async () => await this.load(), waintingTime);
  };
}
