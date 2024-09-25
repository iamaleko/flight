export default class Animate {
  #animationFn = Animate.linear;
  #fps = 120;

  #timer;
  #start;
  #callbackFn;
  #duration;
  #progress;

  #resolve;

  constructor(callbackFn, duration, animationFn, fps) {
    this.#callbackFn = callbackFn;
    this.#animationFn = animationFn ?? this.#animationFn;
    this.#duration = duration;
    this.#fps = fps ?? this.#fps;
  }

  start() {
    return new Promise((resolve) => {
      this.stop();

      this.#resolve = resolve;

      this.#progress = 0,
      this.#start = Date.now();

      this.#callbackFn(this.#progress);

      this.#timer = setInterval(() => {
        this.#progress = Date.now() - this.#start > this.#duration ? 1 : this.#animationFn(Math.max(0, Math.min(1, (Date.now() - this.#start) / this.#duration)));
        this.#callbackFn(this.#progress);
        if (this.#progress === 1) this.stop();
      }, 1000 / this.#fps);
    });
  }

  stop() {
    if (this.#timer) {
      clearInterval(this.#timer);
      this.#timer = undefined;
      this.#resolve(this.#progress);
    }
  }

  static linear(x) {
    return x;
  }

  static easeInOut(x) {
    return -(Math.cos(Math.PI * x) - 1) / 2;
  }

  static easeOut(x) {
    return Math.sin((x * Math.PI) / 2);
  }

  static easeOutCubic(x) {
    return 1 - Math.pow(1 - x, 3);
  }

  static easeIn(x) {
    return 1 - Math.cos((x * Math.PI) / 2);
  }

  static easeInCubic(x) {
    return x * x * x;
  }
}