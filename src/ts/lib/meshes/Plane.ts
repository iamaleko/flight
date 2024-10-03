import Mesh from "@lib/meshes/Mesh";
import Point from "@lib/primitives/Point";
import Polygon from "@lib/primitives/Polygon";

export default class Plane extends Mesh {
  width: number;
  height: number;
  rightWingPoint: Point;
  leftWingPoint: Point;

  constructor(opts: Record<string, any>) {
    super(opts);

    this.width = opts.width ?? 1;
    this.height = opts.height ?? 3;

    const inner = 0.15,
          depth = 0.44,
          y = this.y + this.height / 2;

    // right wing
    this.polygons.push(new Polygon(
      new Point(this.x, y, this.z),
      new Point(this.x + this.width / 2 * inner, y - this.height, this.z),
      this.rightWingPoint = new Point(this.x + this.width / 2, y - this.height, this.z),
      this)
    );

    // inner right
    this.polygons.push(new Polygon(
      new Point(this.x, y, this.z),
      new Point(this.x, y - this.height, this.z + this.width / 2 * depth),
      new Point(this.x + this.width / 2 * inner, y - this.height, this.z),
      this)
    );
    this.polygons.push(new Polygon(
      new Point(this.x, y, this.z),
      new Point(this.x + this.width / 2 * inner, y - this.height, this.z),
      new Point(this.x, y - this.height, this.z + this.width / 2 * depth),
      this)
    );

    // left wing
    this.polygons.push(new Polygon(
      new Point(this.x, y, this.z),
      this.leftWingPoint = new Point(this.x - this.width / 2, y - this.height, this.z),
      new Point(this.x - this.width / 2 * inner, y - this.height, this.z),
      this)
    );

    // inner left
    this.polygons.push(new Polygon(
      new Point(this.x, y, this.z),
      new Point(this.x - this.width / 2 * inner, y - this.height, this.z),
      new Point(this.x, y - this.height, this.z + this.width / 2 * depth),
      this)
    );
    this.polygons.push(new Polygon(
      new Point(this.x, y, this.z),
      new Point(this.x, y - this.height, this.z + this.width / 2 * depth),
      new Point(this.x - this.width / 2 * inner, y - this.height, this.z),
      this)
    );

    this.rotate(this, this.ax, this.ay, this.az);
  }
}
