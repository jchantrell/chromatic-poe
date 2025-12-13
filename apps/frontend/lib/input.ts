import EventEmitter from "@app/lib/event-emitter";

class Input extends EventEmitter {
  constructor() {
    super();
    document.addEventListener("keyup", (event) => {
      this.emit("keypress", event.key, false, {
        shift: event.shiftKey,
        alt: event.altKey,
        ctrl: event.ctrlKey,
      });
    });
    document.addEventListener("keydown", (event) => {
      this.emit("keypress", event.key, true, {
        shift: event.shiftKey,
        alt: event.altKey,
        ctrl: event.ctrlKey,
      });
    });
  }
}

export const input = new Input();
