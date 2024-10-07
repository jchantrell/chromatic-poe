import EventEmitter from "@pkgs/lib/eventEmitter";

class Input extends EventEmitter {
  constructor() {
    super();
    document.addEventListener("keyup", (event) => {
      this.emit("keypress", event.key, false);
    });
    document.addEventListener("keydown", (event) => {
      this.emit("keypress", event.key, true);
    });
  }
}

export const input = new Input();
