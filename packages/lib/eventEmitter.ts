type EventListener = <T extends unknown[]>(...args: T) => unknown;

export default class EventEmitter {
  private listeners: {
    [key: string]: EventListener[];
  } = {};

  protected listenerCount(event: string) {
    return this.listeners[event] ? this.listeners[event].length : 0;
  }

  public on(event: string, listener: EventListener) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }

    this.listeners[event].push(listener);

    return () => this.off(event, listener);
  }

  public off(event: string, listener: (...rest: unknown[]) => unknown) {
    if (!this.listeners[event]) {
      return;
    }

    const index = this.listeners[event].indexOf(listener);

    if (index === -1) {
      return;
    }

    this.listeners[event].splice(index, 1);
  }

  public emit(event: string, ...args: unknown[]) {
    if (!this.listeners[event]) {
      return;
    }

    let i = 0;
    for (i = 0; i < this.listeners[event].length; i++) {
      this.listeners[event][i](...args);
    }
  }
}
