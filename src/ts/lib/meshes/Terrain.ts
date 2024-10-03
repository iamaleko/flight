import Mesh from "@lib/meshes/Mesh";
import Point from "@lib/primitives/Point";
import Polygon from "@lib/primitives/Polygon";

export type AltitudeMap = Record<number, Record<number, number>>;

export default class Terrain extends Mesh {
  size: number;
  width: number;
  height: number;
  altitude: number;
  altitudeMap: AltitudeMap;

  constructor(opts: Record<string, any>) {
    super(opts);

    this.size = opts.size ?? 1;
    this.width = opts.width ?? 1;
    this.height = opts.height ?? 1;
    this.altitude = opts.altitude ?? 0;

    this.altitudeMap = opts.altitudeMap ?? {};

    const xOffset = (this.width * this.size) / 2,
          yOffset = (this.height * this.size) / 2;

    for (let w = 0; w < this.width; ++w) {
      for (let h = 0; h < this.height; ++h) {
        const x = w * this.size + this.x - xOffset, y = h * this.size + this.y - yOffset, nx = x + this.size, ny = y + this.size;

        this.polygons.push(new Polygon(
          new Point(x, y, this._getAltitude(w, h)),
          new Point(nx, y, this._getAltitude(w + 1, h)),
          new Point(x, ny, this._getAltitude(w, h + 1)),
          this)
        );
        this.polygons.push(new Polygon(
          new Point(nx, y, this._getAltitude(w + 1, h)),
          new Point(nx, ny, this._getAltitude(w + 1, h + 1)),
          new Point(x, ny, this._getAltitude(w, h + 1)),
          this)
        );
      }
    }

    this.rotate(this, this.ax, this.ay, this.az);
  }

  private _getAltitude(x: number, y: number): number {
    if (!this.altitudeMap.hasOwnProperty(x)) this.altitudeMap[x] = {};
    if (!this.altitudeMap[x].hasOwnProperty(y)) this.altitudeMap[x][y] = this.z + Math.random() * this.altitude;
    return this.altitudeMap[x][y];
  }
}
