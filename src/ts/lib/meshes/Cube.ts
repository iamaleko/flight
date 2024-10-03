import Mesh from "@lib/meshes/Mesh";
import Point from "@lib/primitives/Point";
import Polygon from "@lib/primitives/Polygon";

export class Cube extends Mesh {
  size: number;

  constructor(opts: Record<string, number>) {
    super(opts);

    this.size = opts.size ?? 1;

    const hs = this.size / 2;

    // bottom
    this.polygons.push(new Polygon(
      new Point(this.x - hs, this.y - hs, this.z - hs),
      new Point(this.x + hs, this.y - hs, this.z - hs),
      new Point(this.x - hs, this.y + hs, this.z - hs),
      this)
    );
    this.polygons.push(new Polygon(
      new Point(this.x + hs, this.y + hs, this.z - hs),
      new Point(this.x - hs, this.y + hs, this.z - hs),
      new Point(this.x + hs, this.y - hs, this.z - hs),
      this)
    );

    // top
    this.polygons.push(new Polygon(
      new Point(this.x - hs, this.y - hs, this.z + hs),
      new Point(this.x - hs, this.y + hs, this.z + hs),
      new Point(this.x + hs, this.y - hs, this.z + hs),
      this
    ));
    this.polygons.push(new Polygon(
      new Point(this.x + hs, this.y + hs, this.z + hs),
      new Point(this.x + hs, this.y - hs, this.z + hs),
      new Point(this.x - hs, this.y + hs, this.z + hs),
      this
    ));

    // left
    this.polygons.push(new Polygon(
      new Point(this.x - hs, this.y - hs, this.z + hs),
      new Point(this.x + hs, this.y - hs, this.z - hs),
      new Point(this.x - hs, this.y - hs, this.z - hs),
      this
    ));
    this.polygons.push(new Polygon(
      new Point(this.x + hs, this.y - hs, this.z + hs),
      new Point(this.x + hs, this.y - hs, this.z - hs),
      new Point(this.x - hs, this.y - hs, this.z + hs),
      this
    ));

    // right
    this.polygons.push(new Polygon(
      new Point(this.x - hs, this.y + hs, this.z + hs),
      new Point(this.x - hs, this.y + hs, this.z - hs),
      new Point(this.x + hs, this.y + hs, this.z - hs),
      this
    ));
    this.polygons.push(new Polygon(
      new Point(this.x + hs, this.y + hs, this.z + hs),
      new Point(this.x - hs, this.y + hs, this.z + hs),
      new Point(this.x + hs, this.y + hs, this.z - hs),
      this
    ));

    // back
    this.polygons.push(new Polygon(
      new Point(this.x - hs, this.y + hs, this.z + hs),
      new Point(this.x - hs, this.y - hs, this.z - hs),
      new Point(this.x - hs, this.y + hs, this.z - hs),
      this
    ));
    this.polygons.push(new Polygon(
      new Point(this.x - hs, this.y + hs, this.z + hs),
      new Point(this.x - hs, this.y - hs, this.z + hs),
      new Point(this.x - hs, this.y - hs, this.z - hs),
      this
    ));

    // front
    this.polygons.push(new Polygon(
      new Point(this.x + hs, this.y + hs, this.z + hs),
      new Point(this.x + hs, this.y + hs, this.z - hs),
      new Point(this.x + hs, this.y - hs, this.z - hs),
      this
    ));
    this.polygons.push(new Polygon(
      new Point(this.x + hs, this.y + hs, this.z + hs),
      new Point(this.x + hs, this.y - hs, this.z - hs),
      new Point(this.x + hs, this.y - hs, this.z + hs),
      this
    ));

    this.rotate(this, this.ax, this.ay, this.az);
  }
}
