import Geometry from "@lib/Geometry";

export default class Point {
  x: number;
  y: number;
  z: number;

  constructor(x: number = 0, y: number = 0, z: number = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  copy(): Point {
    return new Point(this.x, this.y, this.z);
  }

  move(x: number = 0, y: number = 0, z: number = 0): Point {
    this.x += x;
    this.y += y;
    this.z += z;
    return this;
  }

  moveTo(x: number, y: number, z: number): Point {
    return this.move(x - this.x, y - this.y, z - this.z);
  }

  rotate(point: Point, ax: number = 0, ay: number = 0, az: number = 0): Point {
    if (ax) [this.x, this.z] = Geometry.rotate(this.x, this.z, point.x, point.z, ax);
    if (ay) [this.y, this.z] = Geometry.rotate(this.y, this.z, point.y, point.z, ay);
    if (az) [this.x, this.y] = Geometry.rotate(this.x, this.y, point.x, point.y, az);
    return this;
  }
}
