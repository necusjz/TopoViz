interface Handler {
  fn: any;
  ctx: any;
}
export default class Evt {
  public events: {[k: string]: Handler[]};
  constructor() {
    this.events = {};
  }
  public hasEvent(evt: string): boolean {
    return this.events[evt] && this.events[evt].length > 0;
  }
  public on(evt: string, fn: object, context?: any) {
    this.events[evt] = this.events[evt] || [];
    // 减少内存
    if (context === this) {
      context = undefined;
    }
    const evts: string[] = evt.split('|');
    for (const ev of evts) {
      if (!this.events[ev].some((handle) => handle.fn === fn && handle.ctx === context)) {
        this.events[ev].push({fn, ctx: context});
      }
    }
    return this;
  }
  public once(evt: string, fn: object, context?: any) {
    this.on(evt, fn, context);
    const handler = () => {
      this.off(evt, fn, context);
      this.off(evt, handler, context);
    };
    this.on(evt, handler, context);
  }
  public fire(evt: string, data?: {sourceTarget?: any, [k: string]: any}) {
    if (!this.events[evt] || this.events[evt].length === 0) {
      return;
    }
    const event = Object.assign({}, data, {
      type: evt,
      target: this,
      sourceTarget: data && data.sourceTarget || this,
    });
    for (const cl of this.events[evt]) {
      cl.fn.call(cl.ctx, event);
    }
  }
  public off(evt: string, fn?: any, context?: any) {
    if (!fn) {
      delete this.events[evt];
    } else {
      // 减少内存
      if (context === this) {
        context = undefined;
      }
      const listeners = this.events[evt];
      if (listeners) {
        const index = listeners.findIndex((cl: Handler) => cl.fn === fn && cl.ctx === context);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    }
  }
  public listens(evt: string): boolean {
    const listeners = this.events[evt];
    if (listeners && listeners.length) {
      return true;
    }
    return false;
  }
}
