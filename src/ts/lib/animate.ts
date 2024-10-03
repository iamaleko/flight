export type AnimationTimingFunction = (progress: number) => number;
export type AnimationProgressFunction = (progress: number) => void;

export default class Animate {
  private _animationFn: AnimationTimingFunction;
  private _progressFn: AnimationProgressFunction;
  private _resolveFn?: (value: number) => void; 

  private _fps: number;
  private _timer?: ReturnType<typeof setInterval>;
  private _start: number;
  private _progress: number;
  private _duration: number;

  constructor(callbackFn: AnimationProgressFunction, duration: number, animationFn?: AnimationTimingFunction, fps: number = 120) {
    this._progressFn = callbackFn;
    this._animationFn = animationFn ?? Animate.linear;
    this._duration = duration;
    this._fps = fps;
    this._start = 0;
    this._progress = 0;
  }

  start(): Promise<number> {
    return new Promise((resolve) => {
      this.stop();

      this._resolveFn = resolve;
      this._progress = 0;
      this._start = Date.now();

      this._progressFn(this._progress);

      this._timer = setInterval(() => {
        if (Date.now() - this._start > this._duration) {
          this._progress = 1;
        } else {
          this._progress = this._animationFn(Math.max(0, Math.min(1, (Date.now() - this._start) / this._duration)));
        }  
        this._progressFn(this._progress);
        if (this._progress === 1) this.stop();
      }, 1000 / this._fps);
    });
  }

  stop(): void {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = undefined;
      if (this._resolveFn) this._resolveFn(this._progress);
    }
  }

  static linear(x: number): number {
    return x;
  }

  static easeInOut(x: number): number {
    return -(Math.cos(Math.PI * x) - 1) / 2;
  }

  static easeOut(x: number): number {
    return Math.sin((x * Math.PI) / 2);
  }

  static easeOutCubic(x: number): number {
    return 1 - Math.pow(1 - x, 3);
  }

  static easeIn(x: number): number {
    return 1 - Math.cos((x * Math.PI) / 2);
  }

  static easeInCubic(x: number): number {
    return x * x * x;
  }
}