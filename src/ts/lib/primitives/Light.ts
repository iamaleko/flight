import Sphere from "@lib/meshes/Sphere";

export default class Light extends Sphere {
  d: number; // max lighting distance

  constructor(opts: Record<string, number>) {
    super(opts);

    this.quality = opts.quality ?? 0;
    this.size = opts.size ?? 0;

    this.r = opts.r ?? 255;
    this.g = opts.g ?? 255;
    this.b = opts.b ?? 255;
    this.a = opts.a ?? 0.5;

    this.d = opts.d ?? 100;
  }
}
