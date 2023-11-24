export default class Markers {
  constructor() {
    this.markers = {};
    this.name = Symbol();
    this.time = Symbol();
    this.count = Symbol();
    this.last = Symbol();
    this.started = Symbol();
  }

  now() {
    return window.performance.now();
  }

  reset(marker) {
    if (marker) {
      this.markers[marker] = {
        [this.count]: 0,
        [this.last]: this.now(),
        [this.started]: this.now(),
        [this.time]: 0,
      };
    } else {
      this.markers = {};
    }
  }

  count(marker, timer) {
    if (!(marker in this.markers)) return 0;
    if (timer) {
      if (!(timer in this.markers[timer])) return 0;
      return this.markers[marker][timer][this.count];
    }
    return this.markers[marker][this.count];
  }

  start(marker) {
    if (marker in this.markers) {
      this.markers[marker][this.last] = this.markers[marker][this.started] = this.now();
    } else {
      this.reset(marker);
    }
  }

  stop(marker) {
    if (marker in this.markers) {
      this.markers[marker][this.time] += this.now() - this.markers[marker][this.started];
      ++this.markers[marker][this.count];
    }
  }

  log(marker, timer) {
    if (marker in this.markers) {
      if (timer in this.markers[marker]) {
        this.markers[marker][timer][this.time] += this.now() - this.markers[marker][this.last];
        ++this.markers[marker][timer][this.count];
        this.markers[marker][this.last] = this.now();
      } else {
        this.markers[marker][timer] = {
          [this.name]: timer,
          [this.count]: 1,
          [this.time]: this.now() - this.markers[marker][this.last],
        };
      }
    }
  }

  flush(marker) {
    const row = (order, count, time, total) => ({
      'order': order,
      'ms per iteration': count ? Math.round(time / count * 10000) / 10000 : 0,
      '%': Math.round(time * 100 / total * 100) / 100,
      'ms': Math.round(time * 10000) / 10000,
      'iterations': count,
    });
    const flush = (marker) => {
      const table = {};
      let order = 0;
      table['ALL'] = row(order, this.markers[marker][this.count], this.markers[marker][this.time], this.markers[marker][this.time]);
      for (const timer in this.markers[marker]) {
        table[timer] = row(++order, this.markers[marker][timer][this.count], this.markers[marker][timer][this.time], this.markers[marker][this.time]);
      }

      console.info(`Marker '${marker}':`);
      console.table(table);
    }
    if (marker) {
      if (marker in this.markers) {
        flush(marker);
      }
    } else {
      for (marker in this.markers) {
        flush(marker);
      }
    }
  }
}