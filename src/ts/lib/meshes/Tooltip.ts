import Mesh from "@lib/meshes/Mesh";
import Star from "@lib/meshes/Star";
import Terrain from "@lib/meshes/Terrain";
import Point from "@lib/primitives/Point";
import Polygon from "@lib/primitives/Polygon";

export default class Tooltip extends Mesh {
  stars: Star[];
  count: number;
  enabled: number;
  height: number;
  width: number;

  sr: number;
  sg: number;
  sb: number;

  constructor(opts: Record<string, number>) {
    super(opts);

    this.stars = [];
    this.count = opts.count ?? 3;
    this.enabled = this.count;
    this.height = opts.height ?? 1;
    this.width = opts.height * this.count;

    this.sr = opts.sr;
    this.sg = opts.sg;
    this.sb = opts.sb;

    // tooltip background
    const terrainY = this.y - this.height / 2;
    const terrain = new Terrain({
      x: this.x,
      y: terrainY,
      z: this.z,
      width: this.count,
      height: 1,
      size: this.height,
    });
    this.polygons.splice(this.polygons.length, 0, ...terrain.polygons);

    // tooltip tail
    const tailY = terrainY + this.height / 2,
          tailSize = this.height / 5;
    this.polygons.push(new Polygon(
      new Point(this.x, tailY + tailSize, this.z),
      new Point(this.x - tailSize, tailY, this.z),
      new Point(this.x + tailSize, tailY, this.z),
      this)
    );

    // stars
    const starSize = this.height * 0.3 * 2,
          starGap = (this.width - starSize * this.count) / (this.count + 1),
          starY = this.y - this.height / 2,
          starX = this.x - (starSize + starGap) * (this.count - 1) / 2;
    for (let i = 0; i < this.count; i++) {
      const star = new Star({
        x: starX + (starGap + starSize) * i,
        y: starY,
        z: this.z,
        tails: 4,
        insize: starSize / 4,
        size: starSize / 2,
        depth: starSize / 4,
        r: this.sr,
        g: this.sg,
        b: this.sb,
      });
      this.polygons.splice(this.polygons.length, 0, ...star.polygons);
      this.stars.push(star);
    }

    this.rotate(this, this.ax, this.ay, this.az);
  }

  setStarsEnabled(enabled: number) {
    if (this.enabled === enabled) return;
    enabled = Math.max(0, Math.min(this.count, enabled));
    this.enabled = enabled;
    for (let i = 0; i < this.stars.length; i++) {
      this.stars[i].r = enabled > i ? this.sr : this.r;
      this.stars[i].g = enabled > i ? this.sg : this.g;
      this.stars[i].b = enabled > i ? this.sb : this.b;
    }
  }
}
