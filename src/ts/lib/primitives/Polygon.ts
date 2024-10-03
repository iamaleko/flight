import Point from "@lib/primitives/Point";
import Mesh from "@lib/meshes/Mesh";
import Colored from "@lib/primitives/Colored";

export default class Polygon extends Colored {
  pt1: Point;
  pt2: Point;
  pt3: Point;
  normA: Point;
  normB: Point;

  object: Mesh;

  constructor(pt1: Point, pt2: Point, pt3: Point, object: Mesh, opts: Record<string, number> = {}) {
    super(opts);

    this.pt1 = pt1;
    this.pt2 = pt2;
    this.pt3 = pt3;
    this.normA = new Point();
    this.normB = new Point();
    
    this.object = object;
  }

  updateNormals(): void {
    this.normA.x = (this.pt1.x + this.pt2.x + this.pt3.x) / 3;
    this.normA.y = (this.pt1.y + this.pt2.y + this.pt3.y) / 3;
    this.normA.z = (this.pt1.z + this.pt2.z + this.pt3.z) / 3;
    this.normB.x = (this.pt3.y - this.normA.y) * (this.pt2.z - this.normA.z) - (this.pt3.z - this.normA.z) * (this.pt2.y - this.normA.y) + this.normA.x;
    this.normB.y = (this.pt3.z - this.normA.z) * (this.pt2.x - this.normA.x) - (this.pt3.x - this.normA.x) * (this.pt2.z - this.normA.z) + this.normA.y;
    this.normB.z = (this.pt3.x - this.normA.x) * (this.pt2.y - this.normA.y) - (this.pt3.y - this.normA.y) * (this.pt2.x - this.normA.x) + this.normA.z;
  }

  move(x = 0, y = 0, z = 0): Polygon {
    if (x || y || z) {
      this.pt1.move(x, y, z);
      this.pt2.move(x, y, z);
      this.pt3.move(x, y, z);
    }
    return this;
  }

  rotate(point: Point, ax: number = 0, ay: number = 0, az: number = 0): Polygon {
    if (ax || ay || az) {
      this.pt1.rotate(point, ax, ay, az);
      this.pt2.rotate(point, ax, ay, az);
      this.pt3.rotate(point, ax, ay, az);
    }
    return this;
  }
}
