class Timer {
  count: number = 0; // log counter
  time: number = 0; // time consumed by code, between this timer and previous timer log calls
}

class Marker {
  count: number = 0; // log counter
  time: number = 0; // time consumed by code, between marker start and stop calls
  timers: Map<string, Timer>;

  private _lastLogTimestamp: number = 0;
  private _startedTimestamp: number = 0;

  constructor() {
    this.timers = new Map();
  }

  start(): void {
    this._lastLogTimestamp = this._startedTimestamp = Marker.now();
  }

  log(timerName: string): void {
    if (this._startedTimestamp) {
      let timer = this.timers.get(timerName);
      if (!timer) this.timers.set(timerName, timer = new Timer());
      timer.count++;
      timer.time += Marker.now() - this._lastLogTimestamp;
      this._lastLogTimestamp = Marker.now();
    }
  }

  stop(): void {
    this.count++;
    this.time += Marker.now() - this._startedTimestamp;
    this._lastLogTimestamp = this._startedTimestamp = 0;
  }

  static now(): number {
    return window.performance.now();
  }
}

export default class Markers {
  private _markers: Map<string, Marker>;

  constructor() {
    this._markers = new Map();
  }

  start(markerName: string): void {
    let marker = this._markers.get(markerName);
    if (!marker) this._markers.set(markerName, marker = new Marker());
    marker.start();
  }

  log(markerName: string, timerName: string) {
    const marker = this._markers.get(markerName);
    if (marker) marker.log(timerName);
  }

  stop(markerName: string): void {
    const marker = this._markers.get(markerName);
    if (marker) marker.stop();
  }

  count(markerName: string, timerName?: string): number {
    const marker = this._markers.get(markerName);
    if (marker) {
      if (timerName) {
        const timer = marker.timers.get(timerName);
        if (timer) return timer.count;
      } else {
        return marker.count;
      }
    }
    return 0;
  }

  reset(): void {
    this._markers.clear();
  }

  flush(markerName?: string): void {
    if (markerName) {
      const marker = this._markers.get(markerName);
      if (marker) {
        console.info(`Marker '${markerName}':`);
        console.table(this._getTable(marker));
      } else {
        console.error(`Unknown marker '${markerName}'`);
      }
    } else {
      for (const [markerName, marker] of this._markers) {
        console.info(`Marker '${markerName}':`);
        console.table(this._getTable(marker));
      }
    }
  }

  private _getTableRow(order: number, count: number, time: number, total: number): Record<string, number> {
    return {
      'order': order,
      'ms per iteration': count ? Math.round(time / count * 10000) / 10000 : 0,
      '%': Math.round(time * 100 / total * 100) / 100,
      'ms': Math.round(time * 10000) / 10000,
      'iterations': count,
    };
  }

  private _getTable(marker: Marker): Record<string, Record<string, number>> {
    const table: Record<string, Record<string, number>> = {};
    let order = 0;
    table['ALL'] = this._getTableRow(order++, marker.count, marker.time, marker.time);
    for (const [timerName, timer] of marker.timers) {
      table[timerName] = this._getTableRow(order++, timer.count, timer.time, marker.time)
    }
    return table;
  }
}