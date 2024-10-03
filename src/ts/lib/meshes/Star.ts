import Geometry from "@lib/Geometry";
import Mesh from "@lib/meshes/Mesh";
import Point from "@lib/primitives/Point";
import Polygon from "@lib/primitives/Polygon";

export default class Star extends Mesh {
  constructor(opts: Record<string, number>) {
    super(opts);

    const size = opts.size ?? 1,
          insize = opts.insize ?? size * 0.5,
          depth = opts.depth ?? size * 0.3,
          tails = opts.tails ?? 5,
          front = new Point(this.x, this.y, this.z - depth),
          back = new Point(this.x, this.y, this.z + depth),
          angle = Math.PI * 2 / tails,
          sideX = Math.sin(angle / 2) * insize,
          sideY = Math.sqrt(Math.pow(insize, 2) - Math.pow(sideX, 2));

    for (let i = 0; i < tails; ++i) {
      // front
      this.polygons.push(new Polygon(
        new Point(this.x, this.y + size, this.z).rotate(this, 0, 0, Geometry.rad2Deg(angle * i)),
        front.copy(),
        new Point(this.x + sideX, this.y + sideY, this.z).rotate(this, 0, 0, Geometry.rad2Deg(angle * i)),
        this)
      );
      this.polygons.push(new Polygon(
        new Point(this.x, this.y + size, this.z).rotate(this, 0, 0, Geometry.rad2Deg(angle * i)),
        new Point(this.x - sideX, this.y + sideY, this.z).rotate(this, 0, 0, Geometry.rad2Deg(angle * i)),
        front.copy(),
        this)
      );

      // back
      this.polygons.push(new Polygon(
        new Point(this.x, this.y + size, this.z).rotate(this, 0, 0, Geometry.rad2Deg(angle * i)),
        new Point(this.x + sideX, this.y + sideY, this.z).rotate(this, 0, 0, Geometry.rad2Deg(angle * i)),
        back.copy(),
        this)
      );
      this.polygons.push(new Polygon(
        new Point(this.x, this.y + size, this.z).rotate(this, 0, 0, Geometry.rad2Deg(angle * i)),
        back.copy(),
        new Point(this.x - sideX, this.y + sideY, this.z).rotate(this, 0, 0, Geometry.rad2Deg(angle * i)),
        this)
      );
    }

    this.rotate(this, this.ax, this.ay, this.az);
  }
}
