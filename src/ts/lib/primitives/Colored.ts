export default class Colored {
  r: number; // red channel
  g: number; // green channel
  b: number; // blue channel
  a: number; // alpha channel, normalized
  m: number; // mixing with light, normalized

  constructor(opts: Record<string, number> = {}) {
    this.r = opts.r; 
    this.g = opts.g;
    this.b = opts.b;
    this.a = opts.a;
    this.m = opts.m;
  }
}
