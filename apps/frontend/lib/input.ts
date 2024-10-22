import EventEmitter from "@pkgs/lib/eventEmitter";

class Input extends EventEmitter {
  constructor() {
    super();
    document.addEventListener("keyup", (event) => {
      this.emit("keyup", event.key);
    });
    document.addEventListener("keydown", (event) => {
      this.emit("keydown", event.key);
    });
  }
}

export const input = new Input();
