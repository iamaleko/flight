export default class Geometry {

  /**
   * Degrees to radians
   */
  static deg2Rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Radians to degrees
   */
  static rad2Deg(rad: number): number {
    return (rad * 180) / Math.PI;
  }

  /**
   * Rotate point around point
   */
  static rotate(
    x1: number, y1: number,
    x2: number, y2: number,
    deg: number,
  ): [number, number] {
    const rad = this.deg2Rad(deg),
          sin = Math.sin(rad),
          cos = Math.cos(rad);

    return [
      (x1 - x2) * cos - (y1 - y2) * sin + x2,
      (x1 - x2) * sin + (y1 - y2) * cos + y2,
    ];
  }

  /**
   * Euclidean distance
   */
  static dist(
    x1: number, y1: number, z1: number,
    x2: number, y2: number, z2: number,
  ): number {
    return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2 + (z1 - z2) ** 2);
  }

  /**
   * Euclidean distance squared
   */
  static distSquared(
    x1: number, y1: number, z1: number,
    x2: number, y2: number, z2: number,
  ): number {
    return (x1 - x2) ** 2 + (y1 - y2) ** 2 + (z1 - z2) ** 2;
  }

  static isCodirectional(
    x1: number, y1: number, z1: number,
    x2: number, y2: number, z2: number,
    x3: number, y3: number, z3: number,
    x4: number, y4: number, z4: number,
  ): boolean {
    const Ax = x2 - x1,
          Ay = y2 - y1,
          Az = z2 - z1;

    const Bx = x4 - x3,
          By = y4 - y3,
          Bz = z4 - z3;

    const scalar = Ax * Bx + Ay * By + Az * Bz;

    return scalar > 0;
  }
  
  /**
   * Normalize vector length
   */
  static normalize(
    x1: number, y1: number, z1: number,
    x2: number, y2: number, z2: number,
  ): [number, number, number, number, number, number] {
    const nx = x2 - x1,
          ny = y2 - y1,
          nz = z2 - z1,
          z = Math.sqrt(nx * nx + ny * ny + nz * nz);

    return [
      x1, y1, z1,
      x1 + nx / z, y1 + ny / z, z1 + nz / z,
    ];
  }

  /**
   * Angle between vectors or vector and point (just omit 4 group of coords)
   */
  static angle(
    x1: number, y1: number, z1: number,
    x2: number, y2: number, z2: number,
    x3: number, y3: number, z3: number,
    x4?: number, y4?: number, z4?: number,
  ): number {
    const Ax = x2 - x1,
          Ay = y2 - y1,
          Az = z2 - z1;

    const Bx = x4 !== undefined ? x4 - x3 : x3 - x1,
          By = y4 !== undefined ? y4 - y3 : y3 - y1,
          Bz = z4 !== undefined ? z4 - z3 : z3 - z1;

    const scalar = Ax * Bx + Ay * By + Az * Bz;
    
    const modA = Math.sqrt(Ax * Ax + Ay * Ay + Az * Az),
          modB = Math.sqrt(Bx * Bx + By * By + Bz * Bz);

    return this.rad2Deg(Math.acos(scalar / (modA * modB))); 
  }
  
}
