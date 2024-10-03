import Polygon from "@lib/primitives/Polygon";
import Point from "@lib/primitives/Point";
import Mesh from "@lib/meshes/Mesh";

export default class Sphere extends Mesh {
  quality: number;
  size: number;

  constructor(opts: Record<string, number>) {
    super(opts);

    this.quality = opts.quality ?? 1;
    this.size = opts.size ?? 1;

    const x = this.x,
          y = this.y - this.size / 2,
          z = this.z,
          hs = 360 / this.quality,
          vs = 180 / this.quality;

    let vi = this.quality;
    while (vi) {
      let hi = this.quality;
      while (hi) {
        let pt1, pt2, pt3;
        if (vi > 0 && vi < this.quality) {
          const i = this.quality - vi - 1;

          pt1 = new Point(x, y, z).rotate(this, 0, vs * i, 0);
          pt1.rotate(new Point(x, pt1.y, z), hs * (hi + 1), 0, 0);
          pt2 = new Point(x, y, z).rotate(this, 0, vs * (i + 1), 0);
          pt2.rotate(new Point(x, pt2.y, z), hs * (hi + 1), 0, 0);
          pt3 = new Point(x, y, z).rotate(this, 0, vs * (i + 1), 0);
          pt3.rotate(new Point(x, pt3.y, z), hs * (hi + 2), 0, 0);
          this.polygons.push(new Polygon(pt1, pt3, pt2, this));

          pt1 = new Point(x, y, z).rotate(this, 0, vs * i, 0);
          pt1.rotate(new Point(x, pt1.y, z), hs * (hi + 1), 0, 0);
          pt2 = new Point(x, y, z).rotate(this, 0, vs * (i + 1), 0);
          pt2.rotate(new Point(x, pt2.y, z), hs * (hi + 2), 0, 0);
          pt3 = new Point(x, y, z).rotate(this, 0, vs * i, 0);
          pt3.rotate(new Point(x, pt3.y, z), hs * (hi + 2), 0, 0);
          this.polygons.push(new Polygon(pt1, pt3, pt2, this));
        }
        if (vi === 1) {
          pt1 = new Point(x, y + this.size, z);
          pt2 = pt1.copy().rotate(this, 0, vs, 0);
          pt2.rotate(new Point(x, pt2.y, z), hs * (hi + 1), 0, 0);
          pt3 = pt1.copy().rotate(this, 0, vs, 0);
          pt3.rotate(new Point(x, pt3.y, z), hs * (hi + 2), 0, 0);
          this.polygons.push(new Polygon(pt1, pt2, pt3, this));
        }
        hi--;
      }
      vi--;
    }

    this.rotate(this, this.ax, this.ay, this.az);
  }
}
