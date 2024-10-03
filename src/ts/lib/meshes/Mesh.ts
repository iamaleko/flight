import Point from "@lib/primitives/Point";
import Polygon from "@lib/primitives/Polygon";

export default class Mesh extends Point {
  ax: number;
  ay: number;
  az: number;

  r: number;
  g: number;
  b: number;
  a: number;
  m: number;

  polygons: Polygon[];

  constructor(opts: Record<string, number>) {
    super(opts.x, opts.y, opts.z);

    this.ax = opts.ax ?? 0;
    this.ay = opts.ay ?? 0;
    this.az = opts.az ?? 0;
    
    this.r = opts.r ?? 80;
    this.g = opts.g ?? 80;
    this.b = opts.b ?? 80;
    this.a = opts.a ?? 1;
    this.m = opts.m ?? 1;

    this.polygons = [];
  }

  move(x = 0, y = 0, z = 0): Mesh {
    if (x || y || z) {
      for (const polygon of this.polygons) polygon.move(x, y, z);
      super.move(x, y, z);
    }
    return this;
  }

  rotate(point: Point, ax = 0, ay = 0, az = 0): Mesh {
    if (ax || ay || az) {
      for (const polygon of this.polygons) polygon.rotate(point, ax, ay, az);
      this.ax += ax;
      this.ay += ay;
      this.az += az;
      super.rotate(point, ax, ay, az);
    }
    return this;
  }

  rotateTo(ax: number, ay: number, az: number): Mesh {
    return this.rotate(this, ax - this.ax, ay - this.ay, az - this.az);
  }
}
